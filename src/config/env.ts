import * as dotenv from "dotenv";

dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/fastify_db",
  PORT: parseInt(process.env.PORT || "3000", 10),
  HOST: process.env.HOST || "localhost",
  NODE_ENV: process.env.NODE_ENV || "development"
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}
