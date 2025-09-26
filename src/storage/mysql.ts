import mysql from "mysql2/promise";
import type { StoredTokens, TokenStore } from "../types.js";

export interface MySqlTokenStoreOptions {
  uri?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  tableName?: string; // default: lazada_tokens
}

export class MySqlTokenStore implements TokenStore {
  private readonly options: Required<Omit<MySqlTokenStoreOptions, "uri">> & {
    uri?: string;
  };
  private pool?: mysql.Pool;

  constructor(options: MySqlTokenStoreOptions) {
    this.options = {
      uri: options.uri,
      host: options.host ?? "localhost",
      port: options.port ?? 3306,
      user: options.user ?? "root",
      password: options.password ?? "",
      database: options.database ?? "lazada",
      tableName: options.tableName ?? "lazada_tokens",
    };
  }

  async init(): Promise<void> {
    this.pool = this.options.uri
      ? mysql.createPool(this.options.uri)
      : mysql.createPool({
          host: this.options.host,
          port: this.options.port,
          user: this.options.user,
          password: this.options.password,
          database: this.options.database,
        });

    const table = this.options.tableName;
    const ddl = `
      CREATE TABLE IF NOT EXISTS \`${table}\` (
        installation_id VARCHAR(191) NOT NULL PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        meta JSON NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await this.pool.query(ddl);
  }

  private ensurePool(): mysql.Pool {
    if (!this.pool)
      throw new Error("MySqlTokenStore not initialized. Call init().");
    return this.pool;
  }

  async get(installationId: string): Promise<StoredTokens | null> {
    const pool = this.ensurePool();
    const [rows] = await pool.query(
      `SELECT installation_id, access_token, refresh_token, expires_at, meta FROM \`${this.options.tableName}\` WHERE installation_id = ? LIMIT 1`,
      [installationId]
    );
    const list = rows as Array<any>;
    if (!list.length) return null;
    const row = list[0];
    return {
      installationId: row.installation_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: Number(row.expires_at),
      meta: row.meta ? JSON.parse(row.meta as string) : undefined,
    };
  }

  async set(tokens: StoredTokens): Promise<void> {
    const pool = this.ensurePool();
    await pool.query(
      `REPLACE INTO \`${this.options.tableName}\` (installation_id, access_token, refresh_token, expires_at, meta) VALUES (?, ?, ?, ?, ?)`,
      [
        tokens.installationId,
        tokens.accessToken,
        tokens.refreshToken,
        tokens.expiresAt,
        tokens.meta ? JSON.stringify(tokens.meta) : null,
      ]
    );
  }

  async clear(installationId: string): Promise<void> {
    const pool = this.ensurePool();
    await pool.query(
      `DELETE FROM \`${this.options.tableName}\` WHERE installation_id = ?`,
      [installationId]
    );
  }
}
