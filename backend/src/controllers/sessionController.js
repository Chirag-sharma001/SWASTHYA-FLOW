const { v4: uuidv4 } = require('uuid');
const DoctorSession = require('../models/DoctorSession');
const Token = require('../models/Token');
const { emitToSession } = require('../socket');

exports.startSession = async (req, res, next) => {
  try {
    const { doctorName } = req.body;
    if (!doctorName) return res.status(400).json({ error: 'doctorName is required' });

    const session = new DoctorSession({
      sessionId: uuidv4(),
      doctorName
    });

    await session.save();
    
    // Convert to regular object for emit
    const sessionObj = session.toObject();
    delete sessionObj._id;
    delete sessionObj.__v;

    emitToSession(sessionObj.sessionId, 'SESSION_STARTED', { session: sessionObj });
    res.status(201).json(sessionObj);
  } catch (err) {
    next(err);
  }
};

exports.endSession = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const session = await DoctorSession.findOneAndUpdate(
      { sessionId },
      { status: 'closed', closedAt: Date.now() },
      { new: true }
    );

    if (!session) return res.status(404).json({ error: 'Session not found' });

    emitToSession(sessionId, 'SESSION_ENDED', { sessionId });
    res.json({ message: 'Session ended successfully', session });
  } catch (err) {
    next(err);
  }
};
