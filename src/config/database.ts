import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import { env } from "./env.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: env.DATABASE_URL
});

export const db = drizzle(pool);
