import { Pool } from "pg";
import dotenv from 'dotenv';
dotenv.config();
const CONNECTION_STRING = process.env.DATABASE_URL;
const db = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

// When pool connects
db.on("connect", () => {
  console.log("✅ PostgreSQL connected successfully");
});

// If error occurs
db.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
});

// Test connection
(async () => {
  try {
    console.log("🔄 Testing PostgreSQL connection...");
    const res = await db.query("SELECT NOW()");
    console.log("✅ PostgreSQL test query success:", res.rows[0]);
  } catch (err) {
    console.error("❌ PostgreSQL test query failed:", err.message);
  }
})();

export default db;
