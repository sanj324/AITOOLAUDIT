import dotenv from "dotenv";

dotenv.config();

const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  appUrl: process.env.APP_URL || "http://localhost:4000",
  storageMode: process.env.STORAGE_MODE || "local",
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN || "",
  allowVercelPreviewOrigins: process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === "true",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiVisionModel: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini"
};
