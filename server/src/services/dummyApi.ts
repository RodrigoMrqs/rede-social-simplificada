const BASE_URL = 'https://dummyapi.io/data/v1';

async function request<T>(path: string): Promise<T> {
  const appId = process.env.DUMMY_API_APP_ID;
  if (!appId) throw new Error('DUMMY_API_APP_ID não configurado');

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'app-id': appId },
  });

  if (!res.ok) throw new Error(`DummyAPI retornou ${res.status}`);
  return res.json() as Promise<T>;
}

export const dummyApi = { request };
