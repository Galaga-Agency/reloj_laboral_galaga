import { BaseRepository } from './base.repository';
import { RefreshTokenRow } from './types';

export class RefreshTokenRepository extends BaseRepository {
  async storeToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    await this.execute(
      `INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );
  }

  async findValidToken(userId: string, tokenHash: string): Promise<RefreshTokenRow | null> {
    const sql = `
      SELECT * FROM refresh_tokens
      WHERE usuario_id = $1 AND token_hash = $2 AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return this.queryOne<RefreshTokenRow>(sql, [userId, tokenHash]);
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRow | null> {
    const sql = `
      SELECT * FROM refresh_tokens
      WHERE token_hash = $1 AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return this.queryOne<RefreshTokenRow>(sql, [tokenHash]);
  }

  async deleteToken(tokenId: string): Promise<void> {
    await this.execute('DELETE FROM refresh_tokens WHERE id = $1', [tokenId]);
  }

  async deleteTokenByHash(tokenHash: string): Promise<void> {
    await this.execute('DELETE FROM refresh_tokens WHERE token_hash = $1', [
      tokenHash,
    ]);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.execute('DELETE FROM refresh_tokens WHERE usuario_id = $1', [
      userId,
    ]);
  }
}
