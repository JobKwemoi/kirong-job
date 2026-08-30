// ============================================================
// 👑 KIRONG AI — REFERRAL ENDPOINT
// ------------------------------------------------------------
// GET  /api/referral?userId=...        → your code, link, stats
// POST /api/referral {userId, code}    → redeem a friend's code
//
// ⚠️ IMPORTANT — please verify against your real users.js/plans.js:
// This file assumes:
//   1. getOrCreateUser(userId) returns a plain mutable object you
//      can attach new fields to, and saveUser(user) persists it —
//      same contract chat.js already relies on.
//   2. It's safe to add these NEW fields to the user object:
//        user.referredBy         (string userId | null)
//        user.referralCount      (number)
//        user.proTrialUntil      (ISO date string | null)
//   3. Your plans.js's getUserPlan(user) needs one small addition
//      to actually treat an active trial as Pro — see the note
//      at the bottom of this file. Without that change, the trial
//      fields will be saved correctly but won't unlock Pro yet.
// If your real user object shape differs (e.g. nested under
// user.data, or nested under user.referrals), adjust the field
// paths below rather than your users.js file.
// ============================================================

"use strict";

import { getOrCreateUser, saveUser } from "../users.js";

// ============================================================
// ⚙️ CONFIG
// ============================================================

const REFEREE_TRIAL_DAYS = 3; // days of Pro the NEW user gets for signing up via a link
const REFERRER_BONUS_DAYS = 3; // days of Pro the REFERRER gets per successful referral
const SITE_URL = "https://kirongjob.vercel.app";

// ============================================================
// 🔐 CODE ENCODING — the code IS the referrer's userId, just
// base64url-encoded. This means no separate code→user lookup
// table is needed; we can decode any code straight back to the
// referrer's userId and load them with getOrCreateUser.
// ============================================================

function encodeReferralCode(userId) {
  return Buffer.from(String(userId), "utf8").toString("base64url");
}

function decodeReferralCode(code) {
  try {
    const decoded = Buffer.from(String(code), "base64url").toString("utf8");
    // Sanity check: re-encoding should round-trip, otherwise this
    // wasn't actually one of our codes (or was tampered with).
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

// ============================================================
// 🌐 CORS
// ============================================================

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Kirong-User-Id");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function getUserId(req, body) {
  const fromBody = body?.userId;
  const fromQuery = req.query?.userId;
  const fromHeader = req.headers["x-kirong-user-id"];
  const id = fromBody || fromQuery || fromHeader || "";
  return String(id).trim().slice(0, 100);
}

// ============================================================
// 🚀 HANDLER
// ============================================================

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    if (req.method === "GET") {
      const userId = getUserId(req, null);

      if (!userId) {
        return res.status(400).json({ ok: false, error: "userId is required." });
      }

      const user = await getOrCreateUser(userId);

      const code = encodeReferralCode(userId);

      return res.status(200).json({
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
      let body = req.body;

      // Vercel usually parses JSON bodies automatically for POST,
      // but guard for the raw-string case just in case.
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }

      const userId = getUserId(req, body || {});
      const code = String(body?.code || "").trim();

      if (!userId || !code) {
        return res.status(400).json({ ok: false, error: "userId and code are required." });
      }

      const referrerId = decodeReferralCode(code);

      if (!referrerId) {
        return res.status(400).json({ ok: false, error: "That referral code isn't valid." });
      }

      if (referrerId === userId) {
        return res.status(400).json({ ok: false, error: "You can't use your own referral link." });
      }

      const user = await getOrCreateUser(userId);

      if (user.referredBy) {
        return res.status(409).json({
          ok: false,
          error: "You've already redeemed a referral code.",
          code: "ALREADY_REDEEMED"
        });
      }

      const referrer = await getOrCreateUser(referrerId);

      // --------------------------------------------------------
      // GRANT: new user gets a Pro trial
      // --------------------------------------------------------

      user.referredBy = referrerId;
      user.proTrialUntil = addDaysISO(REFEREE_TRIAL_DAYS, user.proTrialUntil);

      // --------------------------------------------------------
      // GRANT: referrer gets bonus days (stacks on any existing
      // active trial rather than overwriting it)
      // --------------------------------------------------------

      referrer.referralCount = (Number(referrer.referralCount) || 0) + 1;
      referrer.proTrialUntil = addDaysISO(
        REFERRER_BONUS_DAYS,
        isTrialActive(referrer.proTrialUntil) ? referrer.proTrialUntil : null
      );

      await saveUser(user);
      await saveUser(referrer);

      return res.status(200).json({
        ok: true,
        message: `Referral applied! You just got ${REFEREE_TRIAL_DAYS} days of Kirong AI Pro 👑`,
        proTrialUntil: user.proTrialUntil
      });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  } catch (error) {
    console.error("REFERRAL ERROR:", error);
    return res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
  }
}

// ============================================================
// 📌 REQUIRED plans.js CHANGE (not included here — I don't have
// your plans.js source, so please add this yourself):
//
// Inside getUserPlan(user), before your existing free/pro logic,
// add something like:
//
//   if (user.proTrialUntil && new Date(user.proTrialUntil) > new Date()) {
//     return { ...PRO_PLAN_OBJECT, id: "pro", viaTrial: true };
//   }
//
// Replace PRO_PLAN_OBJECT with whatever your existing Pro plan
// constant/object is called. Without this, proTrialUntil will be
// saved correctly by this endpoint but won't actually unlock Pro
// features or limits yet.
// ============================================================
