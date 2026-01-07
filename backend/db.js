import { Pool } from "pg";

  const CONNECTION_STRING = "postgresql://postgres:Vaishnavi90@db.quoaloyyhbwihdizbaxx.supabase.co:5432/postgres";
  
const db = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 🔹 When pool successfully connects
db.on("connect", () => {
  console.log("✅ PostgreSQL connected successfully");
});

// 🔹 If any error occurs
db.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
});

// 🔹 Test the connection immediately
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
