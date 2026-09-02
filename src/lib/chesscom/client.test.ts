// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { getArchives, getArchiveGames, ChessComError } from './client';

describe('chesscom/client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getArchives', () => {
    it('lowercases the username in the request URL', async () => {
      let capturedUrl = '';
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        capturedUrl = String(input);
        return new Response(JSON.stringify({ archives: [] }), { status: 200 });
      });

      await getArchives('SomeUser');
      expect(capturedUrl).toBe(
        'https://api.chess.com/pub/player/someuser/games/archives'
      );
    });

    it('returns the archive URL list on success', async () => {
      const archives = [
        'https://api.chess.com/pub/player/someuser/games/2024/01',
        'https://api.chess.com/pub/player/someuser/games/2024/02',
      ];
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ archives }), { status: 200 })
      );

      await expect(getArchives('someuser')).resolves.toEqual(archives);
    });

    it('throws ChessComError(404) for an unknown username', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('not found', { status: 404 })
      );

      const err = await getArchives('nobody').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ChessComError);
      expect((err as ChessComError).status).toBe(404);
    });
  });

  describe('getArchiveGames', () => {
    it('returns the games array from an archive response', async () => {
      const games = [
        {
          url: 'https://www.chess.com/game/live/1',
          pgn: '[Event "Live Chess"]',
          time_control: '600',
          end_time: 1700000000,
          rated: true,
          time_class: 'rapid',
          rules: 'chess',
          white: { username: 'someuser', rating: 1500, result: 'win' },
          black: { username: 'opponent', rating: 1490, result: 'checkmated' },
        },
      ];
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ games }), { status: 200 })
      );

      await expect(
        getArchiveGames('https://api.chess.com/pub/player/someuser/games/2024/01')
      ).resolves.toEqual(games);
    });

    it('retries once after a fixed backoff on 429', async () => {
      vi.useFakeTimers();
      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response('rate limited', { status: 429 });
        }
        return new Response(JSON.stringify({ games: [] }), { status: 200 });
      });

      const promise = getArchiveGames('https://api.chess.com/pub/player/someuser/games/2024/01');
      await vi.advanceTimersByTimeAsync(2100);
      await promise;

      expect(callCount).toBe(2);
      vi.useRealTimers();
    });

    it('throws ChessComError if the retry also fails', async () => {
      vi.useFakeTimers();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('rate limited', { status: 429 })
      );

      const promise = getArchiveGames('https://api.chess.com/pub/player/someuser/games/2024/01').catch(
        (e: unknown) => e
      );
      await vi.advanceTimersByTimeAsync(2100);
      const err = await promise;

      expect(err).toBeInstanceOf(ChessComError);
      vi.useRealTimers();
    });

    it('throws ChessComError for a non-OK, non-429, non-404 response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('server error', { status: 500 })
      );

      const err = await getArchiveGames(
        'https://api.chess.com/pub/player/someuser/games/2024/01'
      ).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ChessComError);
      expect((err as ChessComError).status).toBe(500);
    });
  });
});
