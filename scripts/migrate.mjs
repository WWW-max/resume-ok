import { readFile } from "node:fs/promises";
import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5432/resume_ok";
const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString });
try {
  await client.connect();
  await client.query(sql);
  console.log("Database schema is up to date.");
} finally {
  await client.end();
}
