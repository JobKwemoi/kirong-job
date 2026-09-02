```js
// ============================================================
// 👑 KIRONG AI — PLANS ENGINE V15
// ------------------------------------------------------------
// Central plan + usage engine for Kirong AI.
//
// Exports:
//   PLANS
//   createDefaultUser()
//   normalizePlan()
//   resetDailyUsageIfNeeded()
//   getUserPlan()
//   checkUsageLimit()
//   checkTokenLimit()
//   recordUsage()
//   getUsageSnapshot()
//   canUseFeature()
//
// Compatible with:
//   users.js V14
//   chat.js V13
//   referral/payment logic
// ============================================================

"use strict";

// ============================================================
// ⚙️ PLAN DEFINITIONS
// ============================================================

const PLANS = {
  free: {
    id: "free",
    label: "Free",

    messagesPerDay: 30,
    imagesPerDay: 3,
    tokensPerDay: 60000,

    maxInputTokens: 6000,
    maxOutputTokens: 1024,

    features: {
      contentFactory: false,
      whatsappBusiness: false,
      blogEngine: false,
      affiliateEngine: false
    }
  },

  pro: {
    id: "pro",
    label: "Pro",

    messagesPerDay: 300,
    imagesPerDay: 50,
    tokensPerDay: 1000000,

    maxInputTokens: 16000,
    maxOutputTokens: 4096,

    features: {
      contentFactory: true,
      whatsappBusiness: true,
      blogEngine: true,
      affiliateEngine: true
    }
  }
};

// ============================================================
// 📅 DATE HELPER
// ============================================================

function todayKey() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

// ============================================================
// 🧱 USAGE DEFAULTS
// ============================================================

function createDefaultUsage() {
  return {
    date: todayKey(),
    messages: 0,
    images: 0,
    tokens: 0
  };
}

// ============================================================
// 🆕 CREATE DEFAULT USER
// ------------------------------------------------------------
// This is imported directly by users.js.
// Keep both userId and id for compatibility with different
// parts of the application.
// ============================================================

function createDefaultUser(userId) {
  const id =
    String(userId || "anonymous")
      .trim();

  return {
    userId: id,
    id,

    plan: "free",

    usage: createDefaultUsage(),

    referredBy: null,
    referralCount: 0,
    proTrialUntil: null,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };
}

// ============================================================
// 🔧 NORMALIZE PLAN
// ------------------------------------------------------------
// Returns ONLY:
//   "free"
//   "pro"
//
// This is intentionally separate from getUserPlan(), which
// returns the complete plan object.
//
// users.js uses:
//   normalizePlan(user) === "pro"
// ============================================================

function normalizePlan(user) {
  if (
    !user ||
    typeof user !== "object"
  ) {
    return "free";
  }

  const rawPlan =
    String(
      user.plan || "free"
    )
      .trim()
      .toLowerCase();

  if (rawPlan === "pro") {
    user.plan = "pro";
    return "pro";
  }

  user.plan = "free";

  return "free";
}

// ============================================================
// 🔄 RESET DAILY USAGE
// ------------------------------------------------------------
// Resets counters when the stored usage date is different
// from today's UTC date.
//
// Mutates the existing user object and returns it.
// ============================================================

function resetDailyUsageIfNeeded(user) {
  if (
    !user ||
    typeof user !== "object"
  ) {
    throw new Error(
      "plans.js: expected a user object."
    );
  }

  if (
    !user.usage ||
    typeof user.usage !== "object"
  ) {
    user.usage =
      createDefaultUsage();

    return user;
  }

  const today =
    todayKey();

  if (
    user.usage.date !== today
  ) {
    user.usage = {
      date: today,
      messages: 0,
      images: 0,
      tokens: 0
    };
  }

  user.usage.messages =
    Math.max(
      0,
      Number(user.usage.messages) || 0
    );

  user.usage.images =
    Math.max(
      0,
      Number(user.usage.images) || 0
    );

  user.usage.tokens =
    Math.max(
      0,
      Number(user.usage.tokens) || 0
    );

  return user;
}

// ============================================================
// 🧱 ENSURE USER SHAPE
// ============================================================

function ensureUserShape(user) {
  if (
    !user ||
    typeof user !== "object"
  ) {
    throw new Error(
      "plans.js: expected a user object."
    );
  }

  resetDailyUsageIfNeeded(user);

  normalizePlan(user);

  if (
    !Object.prototype.hasOwnProperty.call(
      user,
      "referredBy"
    )
  ) {
    user.referredBy = null;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      user,
      "referralCount"
    )
  ) {
    user.referralCount = 0;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      user,
      "proTrialUntil"
    )
  ) {
    user.proTrialUntil = null;
  }

  return user;
}

// ============================================================
// 👑 TRIAL CHECK
// ============================================================

function isTrialActive(user) {
  if (
    !user?.proTrialUntil
  ) {
    return false;
  }

  const until =
    new Date(
      user.proTrialUntil
    ).getTime();

  return (
    Number.isFinite(until) &&
    until > Date.now()
  );
}

// ============================================================
// 👤 GET USER PLAN
// ------------------------------------------------------------
// Priority:
//   1. Active Pro trial
//   2. Permanent Pro
//   3. Free
// ============================================================

function getUserPlan(user) {
  ensureUserShape(user);

  if (
    isTrialActive(user)
  ) {
    return {
      ...PLANS.pro,
      viaTrial: true
    };
  }

  if (
    normalizePlan(user) ===
    "pro"
  ) {
    return {
      ...PLANS.pro,
      viaTrial: false
    };
  }

  return {
    ...PLANS.free,
    viaTrial: false
  };
}

// ============================================================
// 🚦 USAGE LIMIT CHECK
// ------------------------------------------------------------
// type:
//   "message"
//   "image"
// ============================================================

function checkUsageLimit(
  user,
  type
) {
  ensureUserShape(user);

  const plan =
    getUserPlan(user);

  const isImage =
    String(type || "")
      .toLowerCase() ===
    "image";

  const limitKey =
    isImage
      ? "imagesPerDay"
      : "messagesPerDay";

  const usedKey =
    isImage
      ? "images"
      : "messages";

  const limit =
    Number(
      plan[limitKey]
    ) || 0;

  const current =
    Number(
      user.usage[usedKey]
    ) || 0;

  return {
    allowed:
      current < limit,

    limit,

    current,

    remaining:
      Math.max(
        0,
        limit - current
      )
  };
}

// ============================================================
// 🔢 TOKEN LIMIT CHECK
// ============================================================

function checkTokenLimit(
  user,
  {
    inputTokens = 0,
    outputTokens = 0
  } = {}
) {
  ensureUserShape(user);

  const plan =
    getUserPlan(user);

  const input =
    Math.max(
      0,
      Number(inputTokens) || 0
    );

  const output =
    Math.max(
      0,
      Number(outputTokens) || 0
    );

  const current =
    Math.max(
      0,
      Number(
        user.usage.tokens
      ) || 0
    );

  const projected =
    current +
    input +
    output;

  const limit =
    Number(
      plan.tokensPerDay
    ) || 0;

  if (
    projected > limit
  ) {
    return {
      allowed: false,

      reason:
        `Daily token limit (${limit.toLocaleString()}) reached for your plan.`,

      limit,

      current,

      requested:
        input + output,

      remaining:
        Math.max(
          0,
          limit - current
        )
    };
  }

  return {
    allowed: true,

    reason: null,

    limit,

    current,

    requested:
      input + output,

    remaining:
      Math.max(
        0,
        limit - projected
      )
  };
}

// ============================================================
// 📊 RECORD USAGE
// ------------------------------------------------------------
// type:
//   "message"
//   "image"
//
// Token usage can be recorded independently.
// ============================================================

function recordUsage(
  user,
  {
    type,
    inputTokens = 0,
    outputTokens = 0
  } = {}
) {
  ensureUserShape(user);

  if (
    type === "message"
  ) {
    user.usage.messages =
      (
        Number(
          user.usage.messages
        ) || 0
      ) + 1;
  }

  if (
    type === "image"
  ) {
    user.usage.images =
      (
        Number(
          user.usage.images
        ) || 0
      ) + 1;
  }

  const input =
    Math.max(
      0,
      Number(inputTokens) || 0
    );

  const output =
    Math.max(
      0,
      Number(outputTokens) || 0
    );

  const tokenDelta =
    input + output;

  if (
    tokenDelta > 0
  ) {
    user.usage.tokens =
      (
        Number(
          user.usage.tokens
        ) || 0
      ) + tokenDelta;
  }

  return user;
}

// ============================================================
// 📸 USAGE SNAPSHOT
// ------------------------------------------------------------
// Frontend shape:
//
// {
//   plan,
//   viaTrial,
//   proTrialUntil,
//   messages: { used, limit },
//   images:   { used, limit },
//   tokens:   { used, limit }
// }
// ============================================================

function getUsageSnapshot(user) {
  ensureUserShape(user);

  const plan =
    getUserPlan(user);

  return {
    plan:
      plan.id,

    viaTrial:
      Boolean(
        plan.viaTrial
      ),

    proTrialUntil:
      user.proTrialUntil ||
      null,

    messages: {
      used:
        Number(
          user.usage.messages
        ) || 0,

      limit:
        plan.messagesPerDay
    },

    images: {
      used:
        Number(
          user.usage.images
        ) || 0,

      limit:
        plan.imagesPerDay
    },

    tokens: {
      used:
        Number(
          user.usage.tokens
        ) || 0,

      limit:
        plan.tokensPerDay
    }
  };
}

// ============================================================
// 🔐 FEATURE GATE
// ============================================================

function canUseFeature(
  user,
  feature
) {
  const plan =
    getUserPlan(user);

  return Boolean(
    plan.features?.[feature]
  );
}

// ============================================================
// 📤 EXPORTS
// ============================================================

export {
  PLANS,

  createDefaultUser,

  normalizePlan,

  resetDailyUsageIfNeeded,

  getUserPlan,

  checkUsageLimit,

  checkTokenLimit,

  recordUsage,

  getUsageSnapshot,

  canUseFeature
};
```
