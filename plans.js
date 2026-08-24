// ============================================================
// 👑 KIRONG AI — BILLING & USAGE PLANS V13
// FREE + PRO
// Server-side usage + token protection
// ============================================================

"use strict";

// ============================================================
// 💰 PLAN DEFINITIONS
// ============================================================

export const PLANS = {
  free: {
    id: "free",
    name: "Free",

    // Daily limits
    dailyMessages: 20,
    dailyImages: 2,
    dailyFiles: 3,

    // Per-request token protection
    maxInputTokens: 4000,
    maxOutputTokens: 1200,

    // Optional daily token safety ceiling
    dailyInputTokens: 50000,
    dailyOutputTokens: 15000,

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

    // Daily limits
    dailyMessages: 200,
    dailyImages: 30,
    dailyFiles: 30,

    // Per-request token protection
    maxInputTokens: 12000,
    maxOutputTokens: 4000,

    // Daily token safety ceiling
    dailyInputTokens: 500000,
    dailyOutputTokens: 150000,

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
// 📅 TODAY KEY
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
// 🧠 EMPTY
