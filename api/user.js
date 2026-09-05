// ============================================================
// 👑 KIRONG AI — USER / PLAN BRIDGE (Netlify Functions v2)
// Exposes plan + usage info to the frontend (plan badge, limits)
// ------------------------------------------------------------
// ⚠️ Your original referenced `user.userId` and `user.subscription`
// — neither field exists on the user object this system's
// plans.js/users.js actually produce (the id field is `user.id`,
// and there's no separate subscription object; Pro access is
// tracked entirely via `proTrialUntil`, extended by both
// referral.js and payment-callback.js). I've adjusted the
// response below to match what's actually there instead of
// silently returning undefined for those fields.
// ============================================================

"use strict";

import { getOrCreateUser } from "./users.js";
import { getUsageSnapshot, getUserPlan } from "./plans.js";

export const config = { path: "/api/user" };

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

function getUserId(req, url) {
  const fromQuery = url.searchParams.get("userId");
  const fromHeader = req.headers.get("x-kirong-user-id");
  return String(fromQuery || fromHeader || "anonymous").trim().slice(0, 100);
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  try {
    const url = new URL(req.url);
    const userId = getUserId(req, url);

    const user = await getOrCreateUser(userId);
    const plan = getUserPlan(user);
    const usage = getUsageSnapshot(user);

    return jsonResponse({
      ok: true,
      userId: user.id,
      plan: plan.id,
      planLabel: plan.label,
      usage,
      proTrialUntil: user.proTrialUntil || null,
      referralCount: Number(user.referralCount) || 0
    });
  } catch (error) {
    console.error("KIRONG USER ERROR:", error);
    return jsonResponse(
      { ok: false, error: "Could not load account info.", code: "USER_SERVER_ERROR" },
      500
    );
  }
};
