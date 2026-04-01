/**
 * smsService.js — Fast2SMS integration
 * Sends SMS to Indian mobile numbers (10 digits, no country code needed).
 * Docs: https://docs.fast2sms.com
 */

const https = require('https');

/**
 * sendSms
 * @param {string} phoneNumber  10-digit Indian number e.g. "9876543210"
 *                              or E.164 "+919876543210" (country code stripped automatically)
 * @param {string} message      SMS body (max 160 chars for single SMS)
 */
async function sendSms(phoneNumber, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  // Strip country code if present
  const number = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');

  if (!apiKey) {
    console.log(`[SMS MOCK] To: ${number} | Msg: ${message}`);
    return { success: true, channel: 'mock' };
  }

  const payload = JSON.stringify({
    route: 'q',          // Quick SMS (transactional-style, no template needed)
    message,
    numbers: number,
    flash: 0,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.return === true) {
            console.log(`[SMS] Sent → ${number} | request_id: ${parsed.request_id}`);
            resolve({ success: true, request_id: parsed.request_id });
          } else {
            console.error(`[SMS] Failed → ${number}:`, parsed.message || data);
            resolve({ success: false, error: parsed.message || data });
          }
        } catch (e) {
          console.error('[SMS] Parse error:', data);
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[SMS] Request error:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

module.exports = { sendSms };
