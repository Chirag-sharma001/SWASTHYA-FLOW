// With the Vite proxy, all /api calls go through the same origin.
// This works whether the browser opens via localhost or the LAN IP.
const BASE_URL = '';

async function fetchHelper(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

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

  async createToken(patientName, sessionId, abhaAddress, phoneNumber) {
    return fetchHelper('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({
        patientName,
        sessionId,
        ...(abhaAddress && { abhaAddress }),
        ...(phoneNumber && { phoneNumber })
      })
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
