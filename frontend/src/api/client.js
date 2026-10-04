const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchWithConfig(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const client = {
  get: (endpoint) => fetchWithConfig(endpoint, { method: 'GET' }),
  post: (endpoint, body) => fetchWithConfig(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => fetchWithConfig(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  del: (endpoint) => fetchWithConfig(endpoint, { method: 'DELETE' })
};
