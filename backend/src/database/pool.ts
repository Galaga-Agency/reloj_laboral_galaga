import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import env from '@config/env';

const config: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: 20,
};

if (env.NODE_ENV === 'production') {
  config.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(config);

pool.on('error', (error) => {
  console.error('Unexpected database error', error);
});

export const getClient = async (): Promise<PoolClient> => pool.connect();

export const query = async <T = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> => pool.query<T>(text, params);

export default pool;
