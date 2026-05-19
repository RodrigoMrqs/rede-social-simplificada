const BASE_URL = 'https://fakerapi.it/api/v2';

export type FakerUser = {
  id: number;
  uuid: string;
  username: string;
  email: string;
  image: string;
};

export type FakerText = {
  title: string;
  author: string;
  genre: string;
  content: string;
};

type FakerList<T> = {
  status: string;
  code: number;
  total: number;
  data: T[];
};

export async function fetchFakerUsers(quantity = 10): Promise<FakerUser[]> {
  const res = await fetch(`${BASE_URL}/users?_quantity=${quantity}`);
  if (!res.ok) throw new Error(`FakerAPI /users falhou: ${res.status}`);
  const body: FakerList<FakerUser> = await res.json();
  return body.data;
}

export async function fetchFakerTexts(quantity = 30): Promise<FakerText[]> {
  const res = await fetch(`${BASE_URL}/texts?_quantity=${quantity}`);
  if (!res.ok) throw new Error(`FakerAPI /texts falhou: ${res.status}`);
  const body: FakerList<FakerText> = await res.json();
  return body.data;
}
