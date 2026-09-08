import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var __resumeOkPool: Pool | undefined;
}

function connectionString(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured.");
  return value;
}

export function db(): Pool {
  if (!globalThis.__resumeOkPool) {
    globalThis.__resumeOkPool = new Pool({
      connectionString: connectionString(),
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalThis.__resumeOkPool;
}

export async function transaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export type DbRow = QueryResultRow;
