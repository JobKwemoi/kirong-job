// ============================================================
// 👑 KIRONG AI — LOCAL / REPLIT SERVER
// Serves the static app and adapts Vercel-style API handlers to
// Node's built-in HTTP server, so the same code works locally and
// on serverless deployment platforms.
// ============================================================

"use strict";

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const MAX_JSON_BYTES = 2 * 1024 * 1024;

const API_ROUTES = {
  "/api/chat": "./api/chat.js",
  "/api/image": "./api/image.js",
  "/api/projects": "./api/projects.js",
  "/api/user": "./api/user.js",
  "/api/payment": "./api/payment.js",
  "/api/payment-status": "./api/payment-status.js",
  "/api/payment-callback": "./api/payment-callback.js"
};

const JSON_BODY_ROUTES = new Set([
  "/api/image",
  "/api/projects",
  "/api/payment",
  "/api/payment-callback"
]);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, payload) {
  if (res.writableEnded) return;
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function createHandlerResponse(res) {
  return {
    setHeader: (name, value) => res.setHeader(name, value),
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(payload) {
      if (res.writableEnded) return this;

      if (!res.headersSent) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }

      res.end(JSON.stringify(payload));
      return this;
    },
    end(payload) {
      if (res.writableEnded) return this;

      res.end(payload);
      return this;
    }
  };
}

function parseQuery(url) {
  return Object.fromEntries(url.searchParams.entries());
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      total += chunk.length;

      if (total > MAX_JSON_BYTES) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    req.on("error", reject);
  });
}

async function handleApi(req, res, url) {
  const modulePath = API_ROUTES[url.pathname];

  if (!modulePath) return false;

  if (JSON_BODY_ROUTES.has(url.pathname) &&
      req.method !== "GET" &&
      req.method !== "OPTIONS") {
    try {
      req.body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
      return true;
    }
  }

  req.query = parseQuery(url);

  try {
    const module = await import(pathToFileURL(path.join(ROOT, modulePath)));
    await module.default(req, createHandlerResponse(res));
  } catch (error) {
    console.error("KIRONG SERVER ERROR:", error);
    sendJson(res, 500, {
      ok: false,
      error: "Kirong server encountered an unexpected error."
    });
  }

  return true;
}

async function serveStatic(req, res, url) {
  let relativePath;

  try {
    relativePath = decodeURIComponent(
      url.pathname === "/" ? "/index.html" : url.pathname
    );
  } catch {
    sendJson(res, 400, { ok: false, error: "Invalid URL." });
    return;
  }

  const filePath = path.resolve(ROOT, `.${relativePath}`);

  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    sendJson(res, 403, { ok: false, error: "Forbidden." });
    return;
  }

  try {
    const stats = await fs.promises.stat(filePath);

    if (!stats.isFile()) {
      sendJson(res, 404, { ok: false, error: "Not found." });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME_TYPES[extension] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache");

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  } catch {
    sendJson(res, 404, { ok: false, error: "Not found." });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (await handleApi(req, res, url)) return;
  await serveStatic(req, res, url);
});

server.listen(PORT, HOST, () => {
  console.log(`👑 Kirong AI running at http://localhost:${PORT}`);
});
