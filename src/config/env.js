import "dotenv/config";

const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 5000,

  apiPrefix: process.env.API_PREFIX || "/api/v1",

  corsOrigin: process.env.CORS_ORIGIN || "*",

  auth: {
    tokenSecret: process.env.AUTH_TOKEN_SECRET || "",
  },

  mail: {
    apiHost: process.env.MAIL_API_HOST?.trim() || "",
    apiToken: process.env.MAIL_API_TOKEN?.trim() || "",
    fromAddress: process.env.MAIL_FROM_ADDRESS?.trim() || "",
    fromName: process.env.MAIL_FROM_NAME?.trim() || "Onco Sahayak",
    logoUrl: process.env.MAIL_LOGO_URL?.trim() || ""
  },

  aws: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_S3_REGION || "",
    bucket: process.env.AWS_S3_BUCKET || ""
  },

  database: {
    url: process.env.DATABASE_URL || "",
    host: process.env.DB_HOST || "",
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    ssl:
      process.env.DB_SSL === "true" ||
      Boolean(
        process.env.DATABASE_URL?.includes("supabase") ||
          process.env.DB_HOST?.endsWith(".supabase.com")
      )
  }
};

export default env;