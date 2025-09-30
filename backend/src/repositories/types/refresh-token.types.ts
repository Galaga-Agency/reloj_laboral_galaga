export interface RefreshTokenRow {
  id: string;
  usuario_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}
