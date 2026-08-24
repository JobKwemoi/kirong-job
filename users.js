// ============================================================
// 👑 KIRONG AI — USER STORAGE V12
// Vercel Blob backed user records
// Root architecture
// ============================================================

"use strict";

import {
  put,
  head
} from "@vercel/blob";

import {
  createDefaultUser,
  resetDailyUsageIfNeeded
} from "./plans.js";

// ============================================================
// 🔐 ENVIRONMENT
// ============================================================

const TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN;

// ============================================================
// 📁 USER STORAGE
// ============================================================

const USER_PREFIX =
  "kirong-ai/users/";

// ============================================================
// 🛡️ SAFE USER ID
// ============================================================

function safeId(id) {
  return String(id || "anonymous")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
}

// ============================================================
// 📍 USER PATH
// ============================================================

function userPath(userId) {
  return `${USER_PREFIX}${safeId(userId)}.json`;
}

// ============================================================
// 📥 GET USER
// ============================================================

export async function getUser(userId) {

  const id =
    safeId(userId);

  const path =
    userPath(id);

  if (!TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing."
    );
  }

  try {

    const result =
      await head(
        path,
        {
          token: TOKEN
        }
      );

    if (!result?.url) {
      return null;
    }

    const response =
      await fetch(
        result.url,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      return null;
    }

    const user =
      await response.json();

    if (!user?.userId) {
      return null;
    }

    // ========================================================
    // 🔄 DAILY RESET
    // ========================================================

    resetDailyUsageIfNeeded(user);

    return user;

  }

  catch (error) {

    console.error(
      "⚠️ GET USER ERROR:",
      error?.message ||
        error
    );

    return null;
  }
}

// ============================================================
// 💾 SAVE USER
// ============================================================

export async function saveUser(user) {

  if (!TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing."
    );
  }

  if (!user?.userId) {
    throw new Error(
      "Cannot save user without userId."
    );
  }

  const cleanUser = {
    ...user,

    userId:
      safeId(user.userId),

    updatedAt:
      new Date().toISOString()
  };

  const path =
    userPath(
      cleanUser.userId
    );

  const blob =
    await put(
      path,

      JSON.stringify(
        cleanUser,
        null,
        2
      ),

      {
        access:
          "public",

        contentType:
          "application/json",

        token:
          TOKEN,

        addRandomSuffix:
          false,

        overwrite:
          true
      }
    );

  return {
    ...cleanUser,

    storageUrl:
      blob.url
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

  // ==========================================================
  // 🆕 NEW USER
  // ==========================================================

  if (!user) {

    user =
      createDefaultUser(id);

    user =
      await saveUser(user);
  }

  // ==========================================================
  // 🔄 DAILY RESET
  // ==========================================================

  const before =
    JSON.stringify(user);

  resetDailyUsageIfNeeded(user);

  const after =
    JSON.stringify(user);

  // Save only if reset changed something
  if (before !== after) {
    user =
      await saveUser(user);
  }

  return user;
}

// ============================================================
// 🗑️ RESET / UTILITY EXPORT
// ============================================================

export function normalizeUserId(userId) {
  return safeId(userId);
}
