import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import authRoutes from "./modules/auth/auth.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import auditTrailRoutes from "./modules/audit-trail/audit-trail.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import checklistRoutes from "./modules/checklist/checklist.routes.js";
import observationRoutes from "./modules/observation/observation.routes.js";
import toolRoutes from "./modules/tool/tool.routes.js";
import { sendError, sendSuccess } from "./utils/api-response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigins = (env.frontendUrl || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin || allowedOrigins.length === 0) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (env.allowVercelPreviewOrigins && origin.endsWith(".vercel.app")) {
    return true;
  }

  return false;
}

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(
      res,
      {
        service: "AI Privacy & Security Internal Audit System API",
        database: "connected"
      },
      "Service is healthy"
    );
  } catch (error) {
    return sendError(res, "Database connectivity issue", 500);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/audits", auditRoutes);
app.use("/api/audit-trails", auditTrailRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tools", toolRoutes);
app.use("/api/checklists", checklistRoutes);
app.use("/api/observations", observationRoutes);
app.use((req, res) => sendError(res, "Route not found", 404));

app.use((error, req, res, next) => {
  console.error(error);
  return sendError(res, error.message || "Internal server error", 500);
});

export default app;
