import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { put } from "@vercel/blob";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localUploadDirectory = path.resolve(__dirname, "../../uploads/audit-evidence");

function ensureLocalUploadDirectory() {
  if (!fs.existsSync(localUploadDirectory)) {
    fs.mkdirSync(localUploadDirectory, { recursive: true });
  }
}

function sanitizeFileName(originalName) {
  const extension = path.extname(originalName).toLowerCase();
  const safeBase = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);

  return `${Date.now()}-${safeBase}${extension}`;
}

function useBlobStorage() {
  return env.storageMode === "blob" || Boolean(env.blobReadWriteToken);
}

export async function persistEvidenceFile(file) {
  const storageFileName = sanitizeFileName(file.originalname);

  if (useBlobStorage()) {
    const blob = await put(`audit-evidence/${storageFileName}`, file.buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.mimetype,
      token: env.blobReadWriteToken || undefined
    });

    return {
      fileName: file.originalname,
      filePath: blob.url,
      fileSize: file.size
    };
  }

  ensureLocalUploadDirectory();
  const absolutePath = path.join(localUploadDirectory, storageFileName);
  fs.writeFileSync(absolutePath, file.buffer);

  return {
    fileName: file.originalname,
    filePath: `/uploads/audit-evidence/${storageFileName}`,
    fileSize: file.size
  };
}

export async function loadEvidenceBuffer(filePath) {
  if (!filePath) {
    return null;
  }

  if (/^https?:\/\//i.test(filePath)) {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error("Unable to download stored evidence file");
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      mimeType: response.headers.get("content-type") || "image/png"
    };
  }

  const absolutePath = path.resolve(__dirname, "../../", `.${filePath}`);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return {
    buffer: fs.readFileSync(absolutePath),
    mimeType: mimeTypeFromFilePath(filePath)
  };
}

function mimeTypeFromFilePath(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".pdf") {
    return "application/pdf";
  }

  return "application/octet-stream";
}
