import pg from "pg";
import env from "./env.js";

const { Pool } = pg;

const pool = new Pool({
  ...(env.database.url
    ? { connectionString: env.database.url }
    : {
        host: env.database.host,
        port: env.database.port,
        database: env.database.name,
        user: env.database.user,
        password: env.database.password
      }),
  ...(env.database.ssl ? { ssl: { rejectUnauthorized: false } } : {}),

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on("connect", () => {
  console.log("📦 PostgreSQL client connected");
});

pool.on("error", (error) => {
  console.error("❌ PostgreSQL pool error:", error);
});

export const query = (text, params) => {
  return pool.query(text, params);
};

export const getClient = () => {
  return pool.connect();
};

export const checkDatabaseConnection = async () => {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("✅ PostgreSQL database connected");
  } finally {
    client.release();
  }
};

export default pool;