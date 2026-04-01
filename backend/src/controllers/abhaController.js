const { v4: uuidv4 } = require('uuid');

// In-memory store for mock transactions (sufficient for hackathon demo)
const transactions = new Map();

// Mock ABHA profiles keyed by mobile/ABHA ID
const MOCK_PROFILES = {
  '9999999999': { name: 'Rahul Sharma', age: 34, gender: 'Male', yearOfBirth: 1990, abhaAddress: 'rahul.sharma@abdm' },
  '8888888888': { name: 'Priya Patel', age: 28, gender: 'Female', yearOfBirth: 1996, abhaAddress: 'priya.patel@abdm' },
  '7777777777': { name: 'Amit Kumar', age: 45, gender: 'Male', yearOfBirth: 1979, abhaAddress: 'amit.kumar@abdm' },
  // Default fallback for any unknown number
  DEFAULT: { name: 'Demo Patient', age: 30, gender: 'Male', yearOfBirth: 1994, abhaAddress: 'demo.patient@abdm' },
};

/**
 * POST /api/abha/generate-otp
 * Body: { mobileOrAbha: string }
 * Returns: { transactionId, message }
 */
exports.generateOtp = (req, res) => {
  const { mobileOrAbha } = req.body;
  if (!mobileOrAbha) {
    return res.status(400).json({ error: 'mobileOrAbha is required' });
  }

  const transactionId = uuidv4();
  // Store the identifier so verify-otp can look up the profile
  transactions.set(transactionId, { mobileOrAbha, createdAt: Date.now() });

  // Clean up transactions older than 10 minutes
  for (const [id, tx] of transactions.entries()) {
    if (Date.now() - tx.createdAt > 10 * 60 * 1000) transactions.delete(id);
  }

  console.log(`[ABHA Mock] OTP sent to ${mobileOrAbha} | txn: ${transactionId} | OTP: 123456`);

  return res.status(200).json({
    transactionId,
    message: `OTP sent to ${mobileOrAbha.replace(/.(?=.{4})/g, '*')}. Use 123456 for demo.`,
  });
};

/**
 * POST /api/abha/verify-otp
 * Body: { transactionId: string, otp: string }
 * Returns: { profile: AbhaProfile }
 */
exports.verifyOtp = (req, res) => {
  const { transactionId, otp } = req.body;

  if (!transactionId || !otp) {
    return res.status(400).json({ error: 'transactionId and otp are required' });
  }

  if (otp !== '123456') {
    return res.status(401).json({ error: 'Invalid OTP. Please try again.' });
  }

  const tx = transactions.get(transactionId);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction expired or not found. Please generate a new OTP.' });
  }

  const profile = MOCK_PROFILES[tx.mobileOrAbha] || MOCK_PROFILES.DEFAULT;

  // Clean up used transaction
  transactions.delete(transactionId);

  return res.status(200).json({ profile });
};
