export const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

export async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, options);
  const data = await response.text();
  try {
    return { status: response.status, data: JSON.parse(data) };
  } catch (e) {
    return { status: response.status, data };
  }
}
