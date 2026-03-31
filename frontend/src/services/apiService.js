const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

async function fetchHelper(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const data = await response.json();
      message = data.message || message;
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

  async createToken(patientName, sessionId) {
    return fetchHelper('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({ patientName, sessionId })
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
  }
};
