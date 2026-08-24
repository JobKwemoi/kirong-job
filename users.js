// ============================================================
// 👑 KIRONG AI — USER STORAGE V12
// Vercel Blob backed user records
// ============================================================

"use strict";

import {
  put,
  list,
  head
} from "@vercel/blob";

import {
  createDefaultUser,
  resetDailyUsageIfNeeded
} from "../billing/plans.js";

const TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN;

const USER_PREFIX =
  "kirong-ai/users/";

function safeId(id) {
  return String(id || "anonymous")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
}

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
      throw new Error(
        "User record not found."
      );
    }

    const response =
      await fetch(
        result.url,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `User storage returned ${response.status}.`
      );
    }

    const user =
      await response.json();

    resetDailyUsageIfNeeded(user);

    return user;
  }

  catch (error) {
    // New user
    if (
      String(error?.message || "")
        .toLowerCase()
        .includes("not found")
    ) {
      return null;
    }

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

  const path =
    userPath(user.userId);

  user.updatedAt =
    new Date().toISOString();

  const blob =
    await put(
      path,
      JSON.stringify(
        user,
        null,
        2
      ),
      {
        access: "public",

        contentType:
          "application/json",

        token: TOKEN,

        // Current Blob SDK supports overriding
        // an existing pathname.
        addRandomSuffix: false,

        overwrite: true
      }
    );

  return {
    ...user,
    storageUrl:
      blob.url
  };
}

// ============================================================
// 👤 GET OR CREATE USER
// ============================================================

export async function getOrCreateUser(userId) {
  const id =
    safeId(userId);

  let user =
    await getUser(id);

  if (!user) {
    user =
      createDefaultUser(id);

    user =
      await saveUser(user);
  }

  resetDailyUsageIfNeeded(user);

  return user;
}
