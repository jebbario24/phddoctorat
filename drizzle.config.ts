import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env", override: true });

const isDesktopMode = process.env.NODE_ENV === "desktop";

if (isDesktopMode) {
  // Desktop mode: SQLite
  const dbPath = process.env.DATABASE_URL?.replace("sqlite:", "") || "./database.db";
  console.log("DEBUG: Using SQLite for desktop mode:", dbPath);

  export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "sqlite",
    dbCredentials: {
      url: dbPath,
    },
  });
} else {
  // Web mode: PostgreSQL
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is completely empty/undefined!");
    throw new Error("DATABASE_URL, ensure the database is provisioned");
  } else {
    console.log("DEBUG: DATABASE_URL is loaded. Starts with:", process.env.DATABASE_URL.substring(0, 15) + "...");
  }

  export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
      url: process.env.DATABASE_URL,
    },
  });
}

