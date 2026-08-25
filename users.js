// ============================================================
// 👑 KIRONG AI — USER STORAGE V13
// Vercel Blob backed user records
// ============================================================

"use strict";

import {
  put,
  get
} from "@vercel/blob";

import {
  createDefaultUser,
  resetDailyUsageIfNeeded,
  normalizePlan
} from "./plans.js";

// ============================================================
// 🔐 BLOB CONFIGURATION
// ============================================================

const TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN;

const USER_PREFIX =
  "kirong-ai/users/";

// ============================================================
// 🛡️ SAFE USER ID
// ============================================================

function safeId(id) {
  return String(id || "anonymous")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
}

// ============================================================
// 📁 USER PATH
// ============================================================

function userPath(userId) {
  return `${USER_PREFIX}${safeId(userId)}.json`;
}

// ============================================================
// 🔐 REQUIRE BLOB TOKEN
// ============================================================

function requireToken() {
  if (!TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing."
    );
  }
}

// ============================================================
// 📥 GET USER
// ============================================================

export async function getUser(userId) {
  requireToken();

  const id =
    safeId(userId);

  const path =
    userPath(id);

  try {
    // ----------------------------------------------------------
    // Private Blob stores require reading via get() (authenticated,
    // streamed) — a plain public-URL fetch() will not work since
    // private blob URLs reject unauthenticated requests.
    // ----------------------------------------------------------

    const result =
      await get(
        path,
        {
          token: TOKEN,
          access: "private",
          useCache: false
        }
      );

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const text =
      await new Response(result.stream).text();

    let user;

    try {
      user = JSON.parse(text);
    } catch {
      return null;
    }

    if (!user || typeof user !== "object") {
      return null;
    }

    // --------------------------------------------------------
    // Ensure user ID is valid
    // --------------------------------------------------------

    user.userId =
      safeId(
        user.userId || id
      );

    // --------------------------------------------------------
    // Reset daily usage if needed
    // --------------------------------------------------------

    resetDailyUsageIfNeeded(user);

    // --------------------------------------------------------
    // Normalize expired subscriptions
    // --------------------------------------------------------

    normalizePlan(user);

    return user;
  }

  catch (error) {
    const message =
      String(
        error?.message || ""
      ).toLowerCase();

    // --------------------------------------------------------
    // Missing user = normal condition
    // --------------------------------------------------------
    // @vercel/blob's get() throws a BlobNotFoundError (message:
    // "The requested blob does not exist") when the file isn't
    // there yet — e.g. a brand new user who has never been saved.
    // This is expected and should return null, NOT bubble up as
    // a 500. We check the error's `name` first (most reliable
    // across SDK versions), then fall back to message text.
    // --------------------------------------------------------

    if (
      error?.name === "BlobNotFoundError" ||
      message.includes("not found") ||
      message.includes("does not exist") ||
      message.includes("404")
    ) {
      return null;
    }

    // --------------------------------------------------------
    // Do NOT silently hide real storage failures
    // --------------------------------------------------------

    throw error;
  }
}

// ============================================================
// 💾 SAVE USER
// ============================================================

export async function saveUser(user) {
  requireToken();

  if (!user || typeof user !== "object") {
    throw new Error(
      "Invalid user object."
    );
  }

  if (!user.userId) {
    throw new Error(
      "Cannot save user without userId."
    );
  }

  const id =
    safeId(
      user.userId
    );

  user.userId = id;

  // ----------------------------------------------------------
  // Reset usage if a new day started
  // ----------------------------------------------------------

  resetDailyUsageIfNeeded(user);

  // ----------------------------------------------------------
  // Normalize subscription status
  // ----------------------------------------------------------

  normalizePlan(user);

  // ----------------------------------------------------------
  // Update timestamp
  // ----------------------------------------------------------

  user.updatedAt =
    new Date().toISOString();

  const path =
    userPath(id);

  // ----------------------------------------------------------
  // Store JSON
  // ----------------------------------------------------------

  const blob =
    await put(
      path,
      JSON.stringify(
        user,
        null,
        2
      ),
      {
        token: TOKEN,

        // This store is configured as PRIVATE in the Vercel
        // dashboard — access must match the store's mode or
        // put() throws "Cannot use public access on a private store."
        access: "private",

        contentType:
          "application/json",

        addRandomSuffix: false,

        // Current @vercel/blob SDK uses `allowOverwrite`
        // (older versions used `overwrite`). Pass both is
        // unnecessary — allowOverwrite is the current name.
        allowOverwrite: true
      }
    );

  return {
    ...user,

    storageUrl:
      blob?.url || null
  };
}

// ============================================================
// 👤 GET OR CREATE USER
// ============================================================

export async function getOrCreateUser(
  userId
) {
  const id =
    safeId(userId);

  let user =
    await getUser(id);

  // ----------------------------------------------------------
  // Existing user
  // ----------------------------------------------------------

  if (user) {
    resetDailyUsageIfNeeded(user);

    normalizePlan(user);

    return user;
  }

  // ----------------------------------------------------------
  // New user
  // ----------------------------------------------------------

  user =
    createDefaultUser(id);

  user =
    await saveUser(user);

  return user;
}

// ============================================================
// 🔄 UPDATE USER
// ============================================================

export async function updateUser(
  userId,
  updates = {}
) {
  const user =
    await getOrCreateUser(
      userId
    );

  if (
    !updates ||
    typeof updates !== "object"
  ) {
    throw new Error(
      "Invalid user updates."
    );
  }

  // ----------------------------------------------------------
  // Prevent changing identity accidentally
  // ----------------------------------------------------------

  const {
    userId: ignoredUserId,
    createdAt: ignoredCreatedAt,
    usage: ignoredUsage,
    ...safeUpdates
  } = updates;

  Object.assign(
    user,
    safeUpdates
  );

  // ----------------------------------------------------------
  // Keep user ID stable
  // ----------------------------------------------------------

  user.userId =
    safeId(userId);

  // ----------------------------------------------------------
  // Save
  // ----------------------------------------------------------

  return await saveUser(
    user
  );
}

// ============================================================
// 📊 GET USER USAGE
// ============================================================

export async function getUserUsage(
  userId
) {
  const user =
    await getOrCreateUser(
      userId
    );

  return {
    userId:
      user.userId,

    plan:
      user.plan,

    usage:
      user.usage,

    subscription:
      user.subscription || null
  };
}

// ============================================================
// 👑 CHECK IF USER IS PRO
// ============================================================

export async function isProUser(
  userId
) {
  const user =
    await getOrCreateUser(
      userId
    );

  return (
    normalizePlan(user) ===
    "pro"
  );
}

// ============================================================
// 🗑️ DELETE USER RECORD
// ============================================================
// Intentionally NOT implemented here.
// User deletion should use a separate authenticated
// admin/account-deletion flow.
// ============================================================

// ============================================================
// 📦 STORAGE INFORMATION
// ============================================================

export function getUserStoragePath(
  userId
) {
  return userPath(
    safeId(userId)
  );
}
