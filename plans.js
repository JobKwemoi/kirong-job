// ============================================================
// 👑 KIRONG AI — BILLING & USAGE PLANS V12
// FREE + PRO
// Server-side limits
// ============================================================

"use strict";

// ============================================================
// 💰 PLAN DEFINITIONS
// ============================================================

export const PLANS = {
  free: {
    id: "free",
    name: "Free",

    // Daily usage
    dailyMessages: 20,
    dailyImages: 2,
    dailyFiles: 3,

    // Token protection
    maxInputTokens: 4000,
    maxOutputTokens: 1200,

    // Features
    contentFactory: false,
    whatsappBusiness: false,
    blogEngine: false,
    affiliateEngine: false,

    // AI routing
    priority: false,

    // Subscription
    price: 0,
    currency: "KES",
    durationDays: null
  },

  pro: {
    id: "pro",
    name: "Pro",

    // Daily usage
    dailyMessages: 200,
    dailyImages: 30,
    dailyFiles: 30,

    // Token protection
    maxInputTokens: 12000,
    maxOutputTokens: 4000,

    // Features
    contentFactory: true,
    whatsappBusiness: true,
    blogEngine: true,
    affiliateEngine: true,

    // AI routing
    priority: true,

    // Subscription
    price: 299,
    currency: "KES",
    durationDays: 30
  }
};

// ============================================================
// 🧠 DEFAULT USER
// ============================================================

export function createDefaultUser(userId) {
  return {
    userId,

    plan: "free",

    subscription: {
      active: false,
      startedAt: null,
      expiresAt: null,
      paymentReference: null,
      phone: null
    },

    usage: {
      date: getTodayKey(),

      messages: 0,
      images: 0,
      files: 0,

      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// ============================================================
// 📅 DATE KEY
// ============================================================

export function getTodayKey() {
  const now = new Date();

  return [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0")
  ].join("-");
}

// ============================================================
// 🔄 RESET DAILY USAGE
// ============================================================

export function resetDailyUsageIfNeeded(user) {
  if (!user) return user;

  const today = getTodayKey();

  if (!user.usage) {
    user.usage = {
      date: today,
      messages: 0,
      images: 0,
      files: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    };

    return user;
  }

  if (user.usage.date !== today) {
    user.usage = {
      date: today,
      messages: 0,
      images: 0,
      files: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    };
  }

  return user;
}

// ============================================================
// 👑 CHECK SUBSCRIPTION
// ============================================================

export function normalizePlan(user) {
  if (!user) return "free";

  const subscription =
    user.subscription || {};

  if (
    user.plan === "pro" &&
    subscription.active === true &&
    subscription.expiresAt
  ) {
    const expiry =
      new Date(subscription.expiresAt).getTime();

    if (
      Number.isFinite(expiry) &&
      expiry > Date.now()
    ) {
      return "pro";
    }
  }

  // Expired subscription
  if (user.plan === "pro") {
    user.plan = "free";

    if (user.subscription) {
      user.subscription.active = false;
    }
  }

  return "free";
}

// ============================================================
// 📊 GET PLAN
// ============================================================

export function getUserPlan(user) {
  const planId = normalizePlan(user);

  return PLANS[planId] || PLANS.free;
}

// ============================================================
// 🛡️ USAGE CHECK
// ============================================================

export function checkUsageLimit(
  user,
  type = "message"
) {
  if (!user) {
    return {
      allowed: false,
      reason: "user_missing"
    };
  }

  resetDailyUsageIfNeeded(user);

  const plan =
    getUserPlan(user);

  const usage =
    user.usage;

  let current = 0;
  let limit = 0;

  switch (type) {
    case "message":
      current = usage.messages;
      limit = plan.dailyMessages;
      break;

    case "image":
      current = usage.images;
      limit = plan.dailyImages;
      break;

    case "file":
      current = usage.files;
      limit = plan.dailyFiles;
      break;

    default:
      return {
        allowed: false,
        reason: "unknown_usage_type"
      };
  }

  return {
    allowed: current < limit,

    type,

    current,

    limit,

    remaining:
      Math.max(
        0,
        limit - current
      ),

    plan: plan.id
  };
}

// ============================================================
// ➕ RECORD USAGE
// ============================================================

export function recordUsage(
  user,
  {
    type = "message",
    inputTokens = 0,
    outputTokens = 0
  } = {}
) {
  if (!user) return;

  resetDailyUsageIfNeeded(user);

  const usage =
    user.usage;

  if (type === "message") {
    usage.messages += 1;
  }

  if (type === "image") {
    usage.images += 1;
  }

  if (type === "file") {
    usage.files += 1;
  }

  const input =
    Number(inputTokens) || 0;

  const output =
    Number(outputTokens) || 0;

  usage.inputTokens += input;
  usage.outputTokens += output;

  usage.totalTokens =
    usage.inputTokens +
    usage.outputTokens;

  user.updatedAt =
    new Date().toISOString();
}

// ============================================================
// 🎯 FEATURE ACCESS
// ============================================================

export function canUseFeature(
  user,
  feature
) {
  const plan =
    getUserPlan(user);

  return Boolean(
    plan[feature]
  );
}

// ============================================================
// 💰 PRO CHECKOUT INFO
// ============================================================

export function getProPlan() {
  return {
    id: PLANS.pro.id,
    name: PLANS.pro.name,
    price: PLANS.pro.price,
    currency: PLANS.pro.currency,
    durationDays: PLANS.pro.durationDays
  };
}

// ============================================================
// 👑 ACTIVATE PRO
// ============================================================

export function activatePro(
  user,
  {
    paymentReference = null,
    phone = null,
    durationDays = PLANS.pro.durationDays
  } = {}
) {
  if (!user) {
    throw new Error(
      "User is required."
    );
  }

  const now =
    new Date();

  const expires =
    new Date(now);

  expires.setDate(
    expires.getDate() +
      Number(durationDays || 30)
  );

  user.plan = "pro";

  user.subscription = {
    active: true,

    startedAt:
      now.toISOString(),

    expiresAt:
      expires.toISOString(),

    paymentReference,

    phone
  };

  user.updatedAt =
    now.toISOString();

  return user;
}

// ============================================================
// 🔻 DOWNGRADE
// ============================================================

export function downgradeToFree(user) {
  if (!user) return;

  user.plan = "free";

  if (!user.subscription) {
    user.subscription = {};
  }

  user.subscription.active =
    false;

  user.updatedAt =
    new Date().toISOString();
}

// ============================================================
// 📦 USAGE SNAPSHOT
// ============================================================

export function getUsageSnapshot(user) {
  resetDailyUsageIfNeeded(user);

  const plan =
    getUserPlan(user);

  const usage =
    user.usage;

  return {
    plan: plan.id,

    planName:
      plan.name,

    date:
      usage.date,

    messages: {
      used: usage.messages,
      limit: plan.dailyMessages,
      remaining:
        Math.max(
          0,
          plan.dailyMessages -
            usage.messages
        )
    },

    images: {
      used: usage.images,
      limit: plan.dailyImages,
      remaining:
        Math.max(
          0,
          plan.dailyImages -
            usage.images
        )
    },

    files: {
      used: usage.files,
      limit: plan.dailyFiles,
      remaining:
        Math.max(
          0,
          plan.dailyFiles -
            usage.files
        )
    },

    tokens: {
      input:
        usage.inputTokens,

      output:
        usage.outputTokens,

      total:
        usage.totalTokens
    },

    subscription:
      user.subscription || null
  };
}
