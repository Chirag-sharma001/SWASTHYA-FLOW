const { v4: uuidv4 } = require('uuid');
const Token = require('../models/Token');
const Counter = require('../models/Counter');
const DoctorSession = require('../models/DoctorSession');
const { emitToSession } = require('../socket');
const { estimateWait } = require('../utils/predictor');
const { sendSms } = require('../services/smsService');

async function getPopulatedQueue(sessionId) {
  const queue = await Token.find({ sessionId, status: { $ne: 'completed' } })
    .sort({ tokenNumber: 1 })
    .lean();
  
  if (queue.length === 0) return [];

  const session = await DoctorSession.findOne({ sessionId });
  const durations = session ? session.consultationDurations : [];

  let pendingCount = 0;
  return queue.map(t => {
    if (t.status === 'pending') {
      pendingCount++;
      return { ...t, estimatedWait: estimateWait(pendingCount, durations, 5) };
    }
    // "called" patient wait is technically 0 or n/a, use 0
    return { ...t, estimatedWait: 0 };
  });
}

exports.createToken = async (req, res, next) => {
  try {
    const { patientName, sessionId, abhaAddress, phoneNumber, patientProfile, priority, department } = req.body;
    if (!patientName || !sessionId) return res.status(400).json({ error: 'patientName and sessionId are required' });

    const session = await DoctorSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const counter = await Counter.findOneAndUpdate(
      { sessionId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const token = new Token({
      tokenId: uuidv4(),
      tokenNumber: counter.seq,
      patientName,
      sessionId,
      ...(abhaAddress && { abhaAddress }),
      ...(phoneNumber && { phoneNumber }),
      ...(patientProfile && { patientProfile }),
      priority: priority || 'normal',
      department: department || 'General OPD'
    });

    await token.save();
    
    // Strip mongoose fields
    const tokenObj = token.toObject();
    delete tokenObj._id;
    delete tokenObj.__v;

    const queue = await getPopulatedQueue(sessionId);
    emitToSession(sessionId, 'NEW_PATIENT_JOINED', { token: tokenObj, queue });

    res.status(201).json({ token: tokenObj, queue });
  } catch (err) {
    next(err);
  }
};

exports.bulkSync = async (req, res, next) => {
  try {
    const { tokens } = req.body; // array of { patientName, sessionId, ... }
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: 'Valid tokens array is required' });
    }

    const sessionId = tokens[0].sessionId;
    const session = await DoctorSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const counter = await Counter.findOneAndUpdate(
      { sessionId },
      { $inc: { seq: tokens.length } },
      { new: true, upsert: true }
    );

    const startSeq = counter.seq - tokens.length + 1;
    const docs = tokens.map((t, i) => ({
      ...t,
      tokenId: t.tokenId || uuidv4(),
      tokenNumber: startSeq + i,
      status: 'pending',
      sessionId,
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now()
    }));

    await Token.insertMany(docs);

    const queue = await getPopulatedQueue(sessionId);
    emitToSession(sessionId, 'QUEUE_UPDATED', { queue });

    res.status(201).json({ message: 'Bulk sync successful', inserted: docs.length });
  } catch (err) {
    next(err);
  }
};

exports.getQueue = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const queue = await getPopulatedQueue(sessionId);
    res.json({ queue });
  } catch (err) {
    next(err);
  }
};

exports.callNext = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    
    const token = await Token.findOneAndUpdate(
      { sessionId, status: 'pending' },
      { status: 'called', calledAt: Date.now() },
      { sort: { tokenNumber: 1 }, new: true }
    ).lean();

    if (!token) {
      return res.status(404).json({ error: 'No pending patients in queue' });
    }

    const queue = await getPopulatedQueue(sessionId);
    const payload = { 
      tokenId: token.tokenId, 
      tokenNumber: token.tokenNumber, 
      queue 
    };
    emitToSession(sessionId, 'CALL_NEXT_PATIENT', payload);

    // Find the next pending patient and notify them via SMS
    const nextPending = await Token.findOne({
      sessionId,
      status: 'pending',
      tokenNumber: { $gt: token.tokenNumber }
    }).sort({ tokenNumber: 1 }).lean();

    if (nextPending?.phoneNumber) {
      const msg = `SwasthQueue: Token T-${token.tokenNumber} is now with the doctor. You are NEXT (T-${nextPending.tokenNumber} - ${nextPending.patientName}). Please be ready at the door.`;
      sendSms(nextPending.phoneNumber, msg).catch(() => {});
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
};

exports.completeConsultation = async (req, res, next) => {
  try {
    const { id: tokenId } = req.params;
    
    const token = await Token.findOne({ tokenId });
    if (!token) return res.status(404).json({ error: 'Token not found' });
    if (token.status !== 'called') {
      return res.status(400).json({ error: 'Only called tokens can be completed' });
    }

    token.status = 'completed';
    token.completedAt = Date.now();
    await token.save();

    const durationSeconds = Math.floor((token.completedAt - token.calledAt) / 1000);
    
    await DoctorSession.findOneAndUpdate(
      { sessionId: token.sessionId },
      { $push: { consultationDurations: durationSeconds } }
    );

    const queue = await getPopulatedQueue(token.sessionId);
    const payload = { queue };
    emitToSession(token.sessionId, 'QUEUE_UPDATED', payload);

    res.json(payload);
  } catch (err) {
    next(err);
  }
};

exports.skipPatient = async (req, res, next) => {
  try {
    const { id: tokenId } = req.params;

    const token = await Token.findOne({ tokenId });
    if (!token) return res.status(404).json({ error: 'Token not found' });
    if (token.status !== 'called') {
      return res.status(400).json({ error: 'Only called tokens can be skipped' });
    }

    token.status = 'completed';
    token.completedAt = Date.now();
    await token.save();

    // Don't record duration — this was a no-show / skip

    const queue = await getPopulatedQueue(token.sessionId);
    const payload = { queue };
    emitToSession(token.sessionId, 'QUEUE_UPDATED', payload);

    res.json(payload);
  } catch (err) {
    next(err);
  }
};

exports.getEmergencyProfile = async (req, res, next) => {
  try {
    const { tokenId } = req.params;
    const token = await Token.findOne({ tokenId }).lean();
    if (!token) return res.status(404).json({ error: 'Token not found' });
    
    res.json({
      patientName: token.patientName,
      bloodGroup: token.patientProfile?.bloodGroup || 'N/A',
      emergencyContact: token.patientProfile?.emergencyContact || 'N/A'
    });
  } catch (err) {
    next(err);
  }
};
