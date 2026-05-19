import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postService } from '../../services/postService';

const BASE_URL = 'http://localhost:3001';
vi.stubEnv('NEXT_PUBLIC_API_URL', BASE_URL);

function mockFetch(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

const TOKEN = 'valid-jwt-token';
const POST_ID = 'post-uuid-123';

const mockPost = {
  id: POST_ID,
  authorId: 'user-1',
  content: 'Olá mundo!',
  likesCount: 0,
  commentsCount: 0,
  likedByMe: false,
  createdAt: new Date().toISOString(),
  deletedAt: null,
};

// ─── postService.createPost (UC-11) ──────────────────────────────────────────

describe('postService.createPost', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('CT-18 — envia POST /posts com conteúdo e token', async () => {
    mockFetch(201, mockPost);

    const result = await postService.createPost(TOKEN, 'Olá mundo!');

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}/posts`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.content).toBe('Olá mundo!');
  });

  it('CT-19 — lança erro quando conteúdo excede 280 chars (400 do servidor)', async () => {
    mockFetch(400, { message: 'Conteúdo inválido' });

    await expect(
      postService.createPost(TOKEN, 'a'.repeat(281)),
    ).rejects.toThrow('Conteúdo inválido');
  });

  it('CT-20 — lança erro sem token (401)', async () => {
    mockFetch(401, { message: 'Não autorizado' });

    await expect(postService.createPost('', 'Olá!')).rejects.toThrow('Não autorizado');
  });
});

// ─── postService.deletePost (UC-12) ──────────────────────────────────────────

describe('postService.deletePost', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('CT-21 — envia DELETE /posts/:id com token do autor', async () => {
    mockFetch(204, undefined);

    await postService.deletePost(TOKEN, POST_ID);

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}/posts/${POST_ID}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('CT-22 — lança erro 403 quando usuário não é autor', async () => {
    mockFetch(403, { message: 'Sem permissão' });

    await expect(postService.deletePost(TOKEN, POST_ID)).rejects.toThrow('Sem permissão');
  });

  it('CT-23 — lança erro 404 quando post não existe', async () => {
    mockFetch(404, { message: 'Post não encontrado' });

    await expect(postService.deletePost(TOKEN, 'id-inexistente')).rejects.toThrow(
      'Post não encontrado',
    );
  });
});

// ─── postService.likePost / unlikePost (UC-13) ───────────────────────────────

describe('postService.likePost', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('CT-24 — envia POST /posts/:id/like', async () => {
    mockFetch(204, undefined);
    await postService.likePost(TOKEN, POST_ID);

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}/posts/${POST_ID}/like`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('CT-25 — lança erro 409 ao curtir post já curtido', async () => {
    mockFetch(409, { message: 'Post já curtido' });
    await expect(postService.likePost(TOKEN, POST_ID)).rejects.toThrow('Post já curtido');
  });
});

describe('postService.unlikePost', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('CT-26 — envia DELETE /posts/:id/like', async () => {
    mockFetch(204, undefined);
    await postService.unlikePost(TOKEN, POST_ID);

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}/posts/${POST_ID}/like`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

// ─── postService.getFeed (UC-16) ──────────────────────────────────────────────

describe('postService.getFeed', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('CT-27 — busca GET /feed sem cursor e retorna posts', async () => {
    const feed = { items: [mockPost], nextCursor: null };
    mockFetch(200, feed);

    const result = await postService.getFeed(TOKEN);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/feed`, expect.anything());
    expect(result.items).toHaveLength(1);
  });

  it('CT-28 — inclui cursor na query string quando fornecido', async () => {
    mockFetch(200, { items: [], nextCursor: null });

    await postService.getFeed(TOKEN, '2026-05-19T10:00:00Z');

    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('cursor=');
  });

  it('CT-29 — funciona sem token (visitante)', async () => {
    mockFetch(200, { items: [mockPost], nextCursor: null });

    const result = await postService.getFeed(undefined);
    expect(result.items).toHaveLength(1);
  });
});
