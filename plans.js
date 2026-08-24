// ============================================================
// 👑 KIRONG AI — BILLING & USAGE PLANS V13
// FREE + PRO
// Server-side limits + token protection
// ============================================================

"use strict";

// ============================================================
// 💰 PLAN DEFINITIONS
// ============================================================

export const PLANS = {
  free: {
    id: "free",
    name: "Free",

    // --------------------------------------------------------
    // 📊 DAILY USAGE LIMITS
    // --------------------------------------------------------

    dailyMessages: 20,
    dailyImages: 2,
    dailyFiles: 3,

    // --------------------------------------------------------
    // 🧠 PER-REQUEST TOKEN LIMITS
    // --------------------------------------------------------

    maxInputTokens: 4000,
    maxOutputTokens: 1200,

    // --------------------------------------------------------
    // 🛡️ DAILY TOKEN SAFETY LIMITS
    // --------------------------------------------------------

    dailyInputTokens: 50000,
    dailyOutputTokens: 15000,

    // --------------------------------------------------------
    // 🚀 FEATURES
    // --------------------------------------------------------

    contentFactory: false,
    whatsappBusiness: false,
    blogEngine: false,
    affiliateEngine: false,

    // --------------------------------------------------------
    // 🧠 AI ROUTING
    // --------------------------------------------------------

    priority: false,

    // --------------------------------------------------------
    // 💰 SUBSCRIPTION
    // --------------------------------------------------------

    price: 0,
    currency: "KES",
    durationDays: null
  },

  pro: {
    id: "pro",
    name: "Pro",

    // --------------------------------------------------------
    // 📊 DAILY USAGE LIMITS
    // --------------------------------------------------------

    dailyMessages: 200,
    dailyImages: 30,
    dailyFiles: 30,

    // --------------------------------------------------------
    // 🧠 PER-REQUEST TOKEN LIMITS
    // --------------------------------------------------------

    maxInputTokens: 12000,
    maxOutputTokens: 4000,

    // --------------------------------------------------------
    // 🛡️ DAILY TOKEN SAFETY LIMITS
    // --------------------------------------------------------

    dailyInputTokens: 500000,
    dailyOutputTokens: 150000,

    // --------------------------------------------------------
    // 🚀 FEATURES
    // --------------------------------------------------------

    contentFactory: true,
    whatsappBusiness: true,
    blogEngine: true,
    affiliateEngine: true,

    // --------------------------------------------------------
    // 🧠 AI ROUTING
    // --------------------------------------------------------

    priority: true,

    // --------------------------------------------------------
    // 💰 SUBSCRIPTION
    // --------------------------------------------------------

    price: 299,
    currency: "KES",
    durationDays: 30
  }
};

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
// 🧹 CREATE EMPTY DAILY USAGE
// ============================================================

export function createEmptyUsage() {
  return {
    date: getTodayKey(),

    messages: 0,
    images: 0,
    files: 0,

    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };
}

// ============================================================
// 👤 CREATE DEFAULT USER
// ============================================================

export function createDefaultUser(userId) {
  const now = new Date().toISOString();

  return {
    userId: String(userId || "anonymous"),

    plan: "free",

    subscription: {
      active: false,

      startedAt: null,

      expiresAt: null,

      paymentReference: null,

      phone: null
    },

    usage: createEmptyUsage(),

    createdAt: now,

    updatedAt: now
  };
}

// ============================================================
// 🔄 RESET DAILY USAGE
// ============================================================

export function resetDailyUsageIfNeeded(user) {
  if (!user) {
    return user;
  }

  const today = getTodayKey();

  // ----------------------------------------------------------
  // Missing usage object
  // ----------------------------------------------------------

  if (!user.usage) {
    user.usage = createEmptyUsage();

    return user;
  }

  // ----------------------------------------------------------
  // New day
  // ----------------------------------------------------------

  if (user.usage.date !== today) {
    user.usage = createEmptyUsage();
  }

  return user;
}

// ============================================================
// 👑 NORMALIZE PLAN
// ============================================================

export function normalizePlan(user) {
  if (!user) {
    return "free";
  }

  const subscription =
    user.subscription || {};

  // ----------------------------------------------------------
  // FREE USER
  // ----------------------------------------------------------

  if (user.plan !== "pro") {
    user.plan = "free";

    return "free";
  }

  // ----------------------------------------------------------
  // PRO REQUIRES ACTIVE SUBSCRIPTION
  // ----------------------------------------------------------

  if (
    subscription.active !== true ||
    !subscription.expiresAt
  ) {
    user.plan = "free";

    if (user.subscription) {
      user.subscription.active = false;
    }

    return "free";
  }

  // ----------------------------------------------------------
  // CHECK EXPIRY
  // ----------------------------------------------------------

  const expiry =
    new Date(
      subscription.expiresAt
    ).getTime();

  if (
    !Number.isFinite(expiry) ||
    expiry <= Date.now()
  ) {
    user.plan = "free";

    user.subscription.active = false;

    return "free";
  }

  return "pro";
}

// ============================================================
// 📊 GET USER PLAN
// ============================================================

export function getUserPlan(user) {
  const planId =
    normalizePlan(user);

  return (
    PLANS[planId] ||
    PLANS.free
  );
}

// ============================================================
// 🛡️ CHECK USAGE LIMIT
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

      current =
        Number(
          usage.messages
        ) || 0;

      limit =
        plan.dailyMessages;

      break;

    case "image":

      current =
        Number(
          usage.images
        ) || 0;

      limit =
        plan.dailyImages;

      break;

    case "file":

      current =
        Number(
          usage.files
        ) || 0;

      limit =
        plan.dailyFiles;

      break;

    default:

      return {
        allowed: false,

        reason:
          "unknown_usage_type"
      };
  }

  return {
    allowed:
      current < limit,

    type,

    current,

    limit,

    remaining:
      Math.max(
        0,
        limit - current
      ),

    plan:
      plan.id,

    planName:
      plan.name
  };
}

// ============================================================
// 🧠 CHECK TOKEN LIMIT
// ============================================================

export function checkTokenLimit(
  user,
  {
    inputTokens = 0,
    outputTokens = 0
  } = {}
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

  // ----------------------------------------------------------
  // PER REQUEST
  // ----------------------------------------------------------

  if (
    input >
    plan.maxInputTokens
  ) {
    return {
      allowed: false,

      reason:
        "input_token_limit",

      current: input,

      limit:
        plan.maxInputTokens,

      plan:
        plan.id
    };
  }

  if (
    output >
    plan.maxOutputTokens
  ) {
    return {
      allowed: false,

      reason:
        "output_token_limit",

      current: output,

      limit:
        plan.maxOutputTokens,

      plan:
        plan.id
    };
  }

  // ----------------------------------------------------------
  // DAILY INPUT TOKENS
  // ----------------------------------------------------------

  if (
    usage.inputTokens +
      input >
    plan.dailyInputTokens
  ) {
    return {
      allowed: false,

      reason:
        "daily_input_token_limit",

      current:
        usage.inputTokens,

      requested:
        input,

      limit:
        plan.dailyInputTokens,

      remaining:
        Math.max(
          0,
          plan.dailyInputTokens -
            usage.inputTokens
        ),

      plan:
        plan.id
    };
  }

  // ----------------------------------------------------------
  // DAILY OUTPUT TOKENS
  // ----------------------------------------------------------

  if (
    usage.outputTokens +
      output >
    plan.dailyOutputTokens
  ) {
    return {
      allowed: false,

      reason:
        "daily_output_token_limit",

      current:
        usage.outputTokens,

      requested:
        output,

      limit:
        plan.dailyOutputTokens,

      remaining:
        Math.max(
          0,
          plan.dailyOutputTokens -
            usage.outputTokens
        ),

      plan:
        plan.id
    };
  }

  return {
    allowed: true,

    plan:
      plan.id,

    maxInputTokens:
      plan.maxInputTokens,

    maxOutputTokens:
      plan.maxOutputTokens,

    dailyInputTokens:
      plan.dailyInputTokens,

    dailyOutputTokens:
      plan.dailyOutputTokens
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
  if (!user) {
    return user;
  }

  resetDailyUsageIfNeeded(user);

  const usage =
    user.usage;

  // ----------------------------------------------------------
  // EVENT COUNTERS
  // ----------------------------------------------------------

  if (type === "message") {
    usage.messages += 1;
  }

  if (type === "image") {
    usage.images += 1;
  }

  if (type === "file") {
    usage.files += 1;
  }

  // ----------------------------------------------------------
  // TOKEN COUNTERS
  // ----------------------------------------------------------

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

  usage.inputTokens += input;

  usage.outputTokens += output;

  usage.totalTokens =
    usage.inputTokens +
    usage.outputTokens;

  user.updatedAt =
    new Date().toISOString();

  return user;
}

// ============================================================
// 🎯 FEATURE ACCESS
// ============================================================

export function canUseFeature(
  user,
  feature
) {
  if (!user || !feature) {
    return false;
  }

  const plan =
    getUserPlan(user);

  return Boolean(
    plan[feature]
  );
}

// ============================================================
// 🚀 GET AVAILABLE FEATURES
// ============================================================

export function getAvailableFeatures(
  user
) {
  const plan =
    getUserPlan(user);

  return {
    contentFactory:
      Boolean(
        plan.contentFactory
      ),

    whatsappBusiness:
      Boolean(
        plan.whatsappBusiness
      ),

    blogEngine:
      Boolean(
        plan.blogEngine
      ),

    affiliateEngine:
      Boolean(
        plan.affiliateEngine
      )
  };
}

// ============================================================
// 💰 GET PRO PLAN
// ============================================================

export function getProPlan() {
  const plan =
    PLANS.pro;

  return {
    id:
      plan.id,

    name:
      plan.name,

    price:
      plan.price,

    currency:
      plan.currency,

    durationDays:
      plan.durationDays,

    dailyMessages:
      plan.dailyMessages,

    dailyImages:
      plan.dailyImages,

    dailyFiles:
      plan.dailyFiles,

    maxInputTokens:
      plan.maxInputTokens,

    maxOutputTokens:
      plan.maxOutputTokens,

    features: {
      contentFactory:
        plan.contentFactory,

      whatsappBusiness:
        plan.whatsappBusiness,

      blogEngine:
        plan.blogEngine,

      affiliateEngine:
        plan.affiliateEngine
    }
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

    durationDays =
      PLANS.pro.durationDays
  } = {}
) {
  if (!user) {
    throw new Error(
      "User is required."
    );
  }

  const days =
    Number(durationDays);

  if (
    !Number.isFinite(days) ||
    days <= 0
  ) {
    throw new Error(
      "Invalid subscription duration."
    );
  }

  const now =
    new Date();

  const expires =
    new Date(now);

  expires.setDate(
    expires.getDate() + days
  );

  user.plan =
    "pro";

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
// 🔻 DOWNGRADE TO FREE
// ============================================================

export function downgradeToFree(
  user
) {
  if (!user) {
    return user;
  }

  user.plan =
    "free";

  if (!user.subscription) {
    user.subscription = {};
  }

  user.subscription.active =
    false;

  user.updatedAt =
    new Date().toISOString();

  return user;
}

// ============================================================
// ⏳ SUBSCRIPTION STATUS
// ============================================================

export function getSubscriptionStatus(
  user
) {
  if (!user) {
    return {
      active: false,

      plan: "free",

      expiresAt: null,

      remainingDays: 0
    };
  }

  const planId =
    normalizePlan(user);

  const subscription =
    user.subscription || {};

  if (
    planId !== "pro" ||
    !subscription.expiresAt
  ) {
    return {
      active: false,

      plan: "free",

      expiresAt: null,

      remainingDays: 0
    };
  }

  const expiry =
    new Date(
      subscription.expiresAt
    ).getTime();

  const remainingMs =
    Math.max(
      0,
      expiry - Date.now()
    );

  const remainingDays =
    Math.ceil(
      remainingMs /
        (1000 * 60 * 60 * 24)
    );

  return {
    active:
      remainingMs > 0,

    plan:
      "pro",

    expiresAt:
      subscription.expiresAt,

    remainingDays
  };
}

// ============================================================
// 📦 USAGE SNAPSHOT
// ============================================================

export function getUsageSnapshot(
  user
) {
  if (!user) {
    return null;
  }

  resetDailyUsageIfNeeded(user);

  const plan =
    getUserPlan(user);

  const usage =
    user.usage;

  return {
    plan:
      plan.id,

    planName:
      plan.name,

    date:
      usage.date,

    messages: {
      used:
        usage.messages,

      limit:
        plan.dailyMessages,

      remaining:
        Math.max(
          0,
          plan.dailyMessages -
            usage.messages
        )
    },

    images: {
      used:
        usage.images,

      limit:
        plan.dailyImages,

      remaining:
        Math.max(
          0,
          plan.dailyImages -
            usage.images
        )
    },

    files: {
      used:
        usage.files,

      limit:
        plan.dailyFiles,

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
        usage.totalTokens,

      inputLimit:
        plan.dailyInputTokens,

      outputLimit:
        plan.dailyOutputTokens,

      inputRemaining:
        Math.max(
          0,
          plan.dailyInputTokens -
            usage.inputTokens
        ),

      outputRemaining:
        Math.max(
          0,
          plan.dailyOutputTokens -
            usage.outputTokens
        )
    },

    subscription:
      getSubscriptionStatus(
        user
      ),

    features:
      getAvailableFeatures(
        user
      )
  };
}

// ============================================================
// 🔒 SAFE PLAN SUMMARY
// ============================================================
// Useful for sending plan information to frontend.
// Does not expose private subscription/payment data.
// ============================================================

export function getPublicPlanSummary(
  user
) {
  const plan =
    getUserPlan(user);

  return {
    id:
      plan.id,

    name:
      plan.name,

    price:
      plan.price,

    currency:
      plan.currency,

    dailyMessages:
      plan.dailyMessages,

    dailyImages:
      plan.dailyImages,

    dailyFiles:
      plan.dailyFiles,

    maxInputTokens:
      plan.maxInputTokens,

    maxOutputTokens:
      plan.maxOutputTokens,

    features: {
      contentFactory:
        plan.contentFactory,

      whatsappBusiness:
        plan.whatsappBusiness,

      blogEngine:
        plan.blogEngine,

      affiliateEngine:
        plan.affiliateEngine
    }
  };
}
