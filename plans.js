// ============================================================
// 👑 KIRONG AI — PLANS ENGINE
// ------------------------------------------------------------
// Exports everything chat.js and referral.js already import:
//   getUserPlan(user)              → plan object (free or pro)
//   checkUsageLimit(user, type)    → { allowed, limit, current, remaining }
//   checkTokenLimit(user, tokens)  → { allowed, reason }
//   recordUsage(user, usageEvent)  → mutates user.usage counters
//   getUsageSnapshot(user)         → { plan, messages, images, tokens }
//   canUseFeature(user, feature)   → boolean
//
// ⚠️ IMPORTANT — please verify against your real users.js:
// This assumes getOrCreateUser(userId) (in users.js) returns a
// plain mutable object, and that it's fine for THIS file to lazily
// initialize user.usage / user.plan the first time it sees a user
// that doesn't have them yet (handled below via ensureUserShape()).
// If your users.js already sets defaults differently, adjust
// ensureUserShape() rather than users.js.
//
// The numbers below (30 messages/day, 3 images/day, 60,000 tokens/
// day on Free) match what your live app was already returning in
// its usage snapshot, so this should slot in without changing what
// users currently experience on Free.
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
// 📅 DAILY RESET HELPERS
// ------------------------------------------------------------
// All usage counters live under user.usage and reset whenever the
// stored date no longer matches "today" (UTC calendar day).
// ============================================================

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function ensureUserShape(user) {
  if (!user || typeof user !== "object") {
    throw new Error("plans.js: expected a user object.");
  }

  if (!user.usage || typeof user.usage !== "object") {
    user.usage = {
      date: todayKey(),
      messages: 0,
      images: 0,
      tokens: 0
    };
  }

  if (user.usage.date !== todayKey()) {
    user.usage.date = todayKey();
    user.usage.messages = 0;
    user.usage.images = 0;
    user.usage.tokens = 0;
  }

  return user;
}

// ============================================================
// 👑 TRIAL CHECK
// ------------------------------------------------------------
// referral.js grants free trial days by setting user.proTrialUntil
// (an ISO date string) on both the referee and the referrer. This
// is the one piece referral.js's own comment says is required for
// those trial days to actually unlock Pro.
// ============================================================

function isTrialActive(user) {
  if (!user?.proTrialUntil) return false;

  const until = new Date(user.proTrialUntil).getTime();
  return Number.isFinite(until) && until > Date.now();
}

// ============================================================
// 👤 GET USER PLAN
// ------------------------------------------------------------
// Priority: active referral trial > a permanent paid Pro flag
// (e.g. set by payment.js after a successful M-Pesa charge) > Free.
// If your payment success handler marks the user differently than
// `user.plan === "pro"`, adjust the middle check below to match.
// ============================================================

function getUserPlan(user) {
  ensureUserShape(user);

  if (isTrialActive(user)) {
    return { ...PLANS.pro, viaTrial: true };
  }

  if (String(user.plan || "").toLowerCase() === "pro") {
    return { ...PLANS.pro, viaTrial: false };
  }

  return { ...PLANS.free, viaTrial: false };
}

// ============================================================
// 🚦 USAGE LIMIT CHECK — messages / images per day
// ------------------------------------------------------------
// type: "message" | "image"
// ============================================================

function checkUsageLimit(user, type) {
  ensureUserShape(user);

  const plan = getUserPlan(user);

  const limitKey =
    type === "image" ? "imagesPerDay" : "messagesPerDay";

  const usedKey =
    type === "image" ? "images" : "messages";

  const limit = plan[limitKey];
  const current = Number(user.usage[usedKey]) || 0;

  return {
    allowed: current < limit,
    limit,
    current,
    remaining: Math.max(0, limit - current)
  };
}

// ============================================================
// 🔢 TOKEN LIMIT CHECK — daily token budget
// ------------------------------------------------------------
// Accepts { inputTokens, outputTokens } and checks whether adding
// that amount would push today's total over the plan's daily cap.
// ============================================================

function checkTokenLimit(user, { inputTokens = 0, outputTokens = 0 } = {}) {
  ensureUserShape(user);

  const plan = getUserPlan(user);
  const projected =
    (Number(user.usage.tokens) || 0) +
    (Number(inputTokens) || 0) +
    (Number(outputTokens) || 0);

  if (projected > plan.tokensPerDay) {
    return {
      allowed: false,
      reason: `Daily token limit (${plan.tokensPerDay.toLocaleString()}) reached for your plan.`
    };
  }

  return { allowed: true, reason: null };
}

// ============================================================
// 📊 RECORD USAGE
// ------------------------------------------------------------
// Call after a request succeeds. type: "message" | "image".
// Safe to call with just tokens (e.g. image gen with no token
// cost) or just a message count.
// ============================================================

function recordUsage(user, { type, inputTokens = 0, outputTokens = 0 } = {}) {
  ensureUserShape(user);

  if (type === "message") {
    user.usage.messages = (Number(user.usage.messages) || 0) + 1;
  }

  if (type === "image") {
    user.usage.images = (Number(user.usage.images) || 0) + 1;
  }

  const tokenDelta =
    (Number(inputTokens) || 0) + (Number(outputTokens) || 0);

  if (tokenDelta > 0) {
    user.usage.tokens = (Number(user.usage.tokens) || 0) + tokenDelta;
  }

  return user;
}

// ============================================================
// 📸 USAGE SNAPSHOT — what app.js's usage bar / limits modal read
// ------------------------------------------------------------
// Shape matches exactly what your frontend already expects:
//   { plan, messages:{used,limit}, images:{used,limit}, tokens:{used,limit} }
// ============================================================

function getUsageSnapshot(user) {
  ensureUserShape(user);

  const plan = getUserPlan(user);

  return {
    plan: plan.id,
    viaTrial: Boolean(plan.viaTrial),
    proTrialUntil: user.proTrialUntil || null,
    messages: {
      used: Number(user.usage.messages) || 0,
      limit: plan.messagesPerDay
    },
    images: {
      used: Number(user.usage.images) || 0,
      limit: plan.imagesPerDay
    },
    tokens: {
      used: Number(user.usage.tokens) || 0,
      limit: plan.tokensPerDay
    }
  };
}

// ============================================================
// 🔐 FEATURE GATE — Pro-only super-modes
// ------------------------------------------------------------
// feature: "contentFactory" | "whatsappBusiness" | "blogEngine" |
//          "affiliateEngine"
// ============================================================

function canUseFeature(user, feature) {
  const plan = getUserPlan(user);
  return Boolean(plan.features?.[feature]);
}

// ============================================================
// 📤 EXPORTS
// ============================================================

export {
  PLANS,
  getUserPlan,
  checkUsageLimit,
  checkTokenLimit,
  recordUsage,
  getUsageSnapshot,
  canUseFeature
};
