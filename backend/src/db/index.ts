import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../../shared/schema.js";

type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | null = null;

function getDb(): DB {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not set. Add it to your Railway environment variables."
      );
    }
    _db = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return _db;
}

// Proxy so all existing storage.ts code (db.select, db.insert, etc.) works unchanged
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  }
});
