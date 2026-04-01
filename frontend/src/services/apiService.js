// In dev, Vite proxy forwards /api calls so BASE_URL is empty.
// In production (Vercel), we call the backend directly via VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL || '';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * fetchHelper with automatic 503 retry.
 * Render free tier cold-starts take ~30s. If the backend responds with 503
 * ("database not ready"), we wait 5 s and retry up to 3 times before throwing.
 */
async function fetchHelper(url, options = {}, _retries = 3) {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // 503 = backend is up but DB isn't connected yet (cold start). Retry.
  if (response.status === 503 && _retries > 0) {
    let retryAfter = 5;
    try {
      const body = await response.json();
      retryAfter = body.retryAfter ?? 5;
    } catch (_) { /* ignore */ }
    console.warn(`[API] Server warming up — retrying in ${retryAfter}s (${_retries} attempts left)`);
    await sleep(retryAfter * 1000);
    return fetchHelper(url, options, _retries - 1);
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      // Backend uses { error: '...' } — check both fields
      message = data.error || data.message || message;
    } catch (e) {
      message = response.statusText || message;
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  // Handle empty responses
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const apiService = {
  async getActiveSession() {
    return fetchHelper('/api/sessions/active', { method: 'GET' });
  },

  async startSession(doctorName) {
    return fetchHelper('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ doctorName })
    });
  },

  async endSession(sessionId) {
    return fetchHelper(`/api/sessions/${sessionId}/end`, {
      method: 'POST'
    });
  },

  async callNext(sessionId) {
    return fetchHelper(`/api/sessions/${sessionId}/call-next`, {
      method: 'POST'
    });
  },

  async getQueue(sessionId) {
    return fetchHelper(`/api/tokens/queue/${sessionId}`, {
      method: 'GET'
    });
  },

  async createToken(patientName, sessionId, abhaAddress, phoneNumber, patientProfile, priority, department) {
    return fetchHelper('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({
        patientName,
        sessionId,
        ...(abhaAddress && { abhaAddress }),
        ...(phoneNumber && { phoneNumber }),
        ...(patientProfile && { patientProfile }),
        priority: priority || 'normal',
        department: department || 'General OPD'
      })
    });
  },

  async skipPatient(tokenId) {
    return fetchHelper(`/api/tokens/${tokenId}/skip`, {
      method: 'POST'
    });
  },

  async completeConsultation(tokenId) {
    return fetchHelper(`/api/tokens/${tokenId}/complete`, {
      method: 'POST'
    });
  },

  async bulkSync(tokens) {
    return fetchHelper('/api/tokens/bulk-sync', {
      method: 'POST',
      body: JSON.stringify({ tokens })
    });
  },

  async abhaGenerateOtp(mobileOrAbha) {
    return fetchHelper('/api/abha/generate-otp', {
      method: 'POST',
      body: JSON.stringify({ mobileOrAbha })
    });
  },

  async abhaVerifyOtp(transactionId, otp) {
    return fetchHelper('/api/abha/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ transactionId, otp })
    });
  }
};
