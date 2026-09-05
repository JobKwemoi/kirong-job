// ============================================================
// 👑 KIRONG AI — PROJECTS STORAGE (Netlify Functions v2)
// Netlify Blobs backed project records (private, per-user)
// ------------------------------------------------------------
// Same behavior as your Vercel version — only the storage calls
// changed (@vercel/blob → @netlify/blobs) and the request/
// response handling (Node req/res → Web Request/Response).
// ============================================================

"use strict";

import { getStore } from "@netlify/blobs";

export const config = { path: "/api/projects" };

const PROJECTS_STORE = "kirong-projects";
const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 50000;
const MAX_TYPE_LENGTH = 40;

const ALLOWED_TYPES = ["website", "cv", "business", "code", "note"];

function safeId(id) {
  return String(id || "anonymous")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
}

function newProjectId() {
  return "proj_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function projectKey(userId, projectId) {
  return `${safeId(userId)}/${safeId(projectId)}`;
}

function userProjectPrefix(userId) {
  return `${safeId(userId)}/`;
}

function normalizeType(type) {
  const t = String(type || "note").trim().slice(0, MAX_TYPE_LENGTH);
  return ALLOWED_TYPES.includes(t) ? t : "note";
}

function store() {
  return getStore(PROJECTS_STORE);
}

// ============================================================
// 📥 READ / 📋 LIST / 💾 SAVE / 🗑️ DELETE
// ============================================================

async function readProject(userId, projectId) {
  return await store().get(projectKey(userId, projectId), { type: "json" });
}

async function listProjectsForUser(userId) {
  const prefix = userProjectPrefix(userId);
  const result = await store().list({ prefix });
  const blobs = result?.blobs || [];

  const projects = [];
  for (const b of blobs) {
    const project = await store().get(b.key, { type: "json" });
    if (project) projects.push(project);
  }

  projects.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return projects;
}

async function saveProject(project) {
  await store().setJSON(projectKey(project.userId, project.id), project);
  return project;
}

async function deleteProject(userId, projectId) {
  await store().delete(projectKey(userId, projectId));
}

// ============================================================
// 🌐 RESPONSE HELPERS
// ============================================================

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Kirong-User-Id",
    ...extra
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" })
  });
}

function getUserId(req, url, body) {
  const fromQuery = url.searchParams.get("userId");
  const fromHeader = req.headers.get("x-kirong-user-id");
  const fromBody = body?.userId;
  return safeId(fromQuery || fromHeader || fromBody || "anonymous");
}

// ============================================================
// 🚀 MAIN HANDLER
// ============================================================

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(req.url);

  try {
    // ----------------------------------------------------------
    // GET — list all projects, or fetch one by ?id=
    // ----------------------------------------------------------

    if (req.method === "GET") {
      const userId = getUserId(req, url, null);
      const projectId = url.searchParams.get("id");

      if (projectId) {
        const project = await readProject(userId, projectId);
        if (!project) {
          return jsonResponse({ ok: false, error: "Project not found." }, 404);
        }
        return jsonResponse({ ok: true, project });
      }

      const projects = await listProjectsForUser(userId);
      return jsonResponse({ ok: true, projects });
    }

    // ----------------------------------------------------------
    // POST — create a new project
    // ----------------------------------------------------------

    if (req.method === "POST") {
      let body = {};
      try { body = await req.json(); } catch { body = {}; }

      const userId = getUserId(req, url, body);
      const title = String(body.title || "Untitled Project").trim().slice(0, MAX_TITLE_LENGTH);

      if (!title) {
        return jsonResponse({ ok: false, error: "Title is required." }, 400);
      }

      const project = {
        id: newProjectId(),
        userId,
        title,
        type: normalizeType(body.type),
        content: String(body.content || "").slice(0, MAX_CONTENT_LENGTH),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveProject(project);
      return jsonResponse({ ok: true, project });
    }

    // ----------------------------------------------------------
    // PUT — update an existing project
    // ----------------------------------------------------------

    if (req.method === "PUT") {
      let body = {};
      try { body = await req.json(); } catch { body = {}; }

      const userId = getUserId(req, url, body);
      const projectId = body.id;

      if (!projectId) {
        return jsonResponse({ ok: false, error: "Project id is required." }, 400);
      }

      const existing = await readProject(userId, projectId);
      if (!existing) {
        return jsonResponse({ ok: false, error: "Project not found." }, 404);
      }

      if (typeof body.title === "string") {
        const trimmed = body.title.trim().slice(0, MAX_TITLE_LENGTH);
        if (trimmed) existing.title = trimmed;
      }

      if (typeof body.content === "string") {
        existing.content = body.content.slice(0, MAX_CONTENT_LENGTH);
      }

      if (typeof body.type === "string") {
        existing.type = normalizeType(body.type);
      }

      existing.updatedAt = new Date().toISOString();

      await saveProject(existing);
      return jsonResponse({ ok: true, project: existing });
    }

    // ----------------------------------------------------------
    // DELETE — remove a project
    // ----------------------------------------------------------

    if (req.method === "DELETE") {
      let body = {};
      try { body = await req.json(); } catch { body = {}; }

      const userId = getUserId(req, url, body);
      const projectId = url.searchParams.get("id") || body.id;

      if (!projectId) {
        return jsonResponse({ ok: false, error: "Project id is required." }, 400);
      }

      await deleteProject(userId, projectId);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  } catch (error) {
    console.error("KIRONG PROJECTS ERROR:", error);
    return jsonResponse(
      { ok: false, error: "Projects storage is temporarily unavailable.", code: "PROJECTS_SERVER_ERROR" },
      500
    );
  }
};
