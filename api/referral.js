// ============================================================
// 👑 KIRONG AI — REFERRAL ENDPOINT (Netlify Functions v2)
// ------------------------------------------------------------
// GET  /api/referral?userId=...        → your code, link, stats
// POST /api/referral {userId, code}    → redeem a friend's code
//
// Same logic as the Vercel version — only the request/response
// handling changed to match Netlify's Web-standard Request/
// Response API instead of Node's (req, res).
// ============================================================

"use strict";

import { getOrCreateUser, saveUser } from "./users.js";

export const config = { path: "/api/referral" };

const REFEREE_TRIAL_DAYS = 3;
const REFERRER_BONUS_DAYS = 3;
const SITE_URL = "https://kirong.netlify.app";

function encodeReferralCode(userId) {
  return Buffer.from(String(userId), "utf8").toString("base64url");
}

function decodeReferralCode(code) {
  try {
    const decoded = Buffer.from(String(code), "base64url").toString("utf8");
    if (encodeReferralCode(decoded) !== code) return null;
    return decoded;
  } catch {
    return null;
  }
}

function addDaysISO(days, fromISO) {
  const base = fromISO ? new Date(fromISO) : new Date();
  const start = Number.isFinite(base.getTime()) ? base : new Date();
  start.setUTCDate(start.getUTCDate() + days);
  return start.toISOString();
}

function isTrialActive(proTrialUntil) {
  if (!proTrialUntil) return false;
  const until = new Date(proTrialUntil).getTime();
  return Number.isFinite(until) && until > Date.now();
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Kirong-User-Id"
    }
  });
}

function getUserId(req, url, body) {
  const fromBody = body?.userId;
  const fromQuery = url.searchParams.get("userId");
  const fromHeader = req.headers.get("x-kirong-user-id");
  const id = fromBody || fromQuery || fromHeader || "";
  return String(id).trim().slice(0, 100);
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return json({}, 204);
  }

  const url = new URL(req.url);

  try {
    if (req.method === "GET") {
      const userId = getUserId(req, url, null);

      if (!userId) {
        return json({ ok: false, error: "userId is required." }, 400);
      }

      const user = await getOrCreateUser(userId);
      const code = encodeReferralCode(userId);

      return json({
        ok: true,
        code,
        link: `${SITE_URL}/?ref=${code}`,
        referralCount: Number(user.referralCount) || 0,
        trialActive: isTrialActive(user.proTrialUntil),
        proTrialUntil: user.proTrialUntil || null,
        alreadyRedeemed: Boolean(user.referredBy),
        rewardDaysPerReferral: REFERRER_BONUS_DAYS,
        rewardDaysForNewUser: REFEREE_TRIAL_DAYS
      });
    }

    if (req.method === "POST") {
      let body = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }

      const userId = getUserId(req, url, body);
      const code = String(body?.code || "").trim();

      if (!userId || !code) {
        return json({ ok: false, error: "userId and code are required." }, 400);
      }

      const referrerId = decodeReferralCode(code);

      if (!referrerId) {
        return json({ ok: false, error: "That referral code isn't valid." }, 400);
      }

      if (referrerId === userId) {
        return json({ ok: false, error: "You can't use your own referral link." }, 400);
      }

      const user = await getOrCreateUser(userId);

      if (user.referredBy) {
        return json(
          { ok: false, error: "You've already redeemed a referral code.", code: "ALREADY_REDEEMED" },
          409
        );
      }

      const referrer = await getOrCreateUser(referrerId);

      user.referredBy = referrerId;
      user.proTrialUntil = addDaysISO(REFEREE_TRIAL_DAYS, user.proTrialUntil);

      referrer.referralCount = (Number(referrer.referralCount) || 0) + 1;
      referrer.proTrialUntil = addDaysISO(
        REFERRER_BONUS_DAYS,
        isTrialActive(referrer.proTrialUntil) ? referrer.proTrialUntil : null
      );

      await saveUser(user);
      await saveUser(referrer);

      return json({
        ok: true,
        message: `Referral applied! You just got ${REFEREE_TRIAL_DAYS} days of Kirong AI Pro 👑`,
        proTrialUntil: user.proTrialUntil
      });
    }

    return json({ ok: false, error: "Method not allowed." }, 405);
  } catch (error) {
    console.error("REFERRAL ERROR:", error);
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
};
