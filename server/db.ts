import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import pg from "pg";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Detect if running in desktop mode (Electron)
const isDesktopMode = process.env.NODE_ENV === "desktop" || process.env.IS_DESKTOP === "true";

let db: any;
let pool: pg.Pool | null = null;

if (isDesktopMode) {
  // Desktop mode: use SQLite
  const dbPath = process.env.DATABASE_URL?.replace("sqlite:", "") || "./database.db";
  console.log(`[Desktop Mode] Using SQLite database at: ${dbPath}`);

  const sqlite = new Database(dbPath);
  db = drizzleSqlite(sqlite, { schema });
  pool = null; // Not used in SQLite mode
} else {
  // Web mode: use PostgreSQL  
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  };

  pool = new Pool(poolConfig);

  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
  });

  db = drizzlePostgres(pool, { schema });
}

export { db, pool };
