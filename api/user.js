// ============================================================
// 👑 KIRONG AI — USER API V1
// Profile + usage + subscription
// ============================================================

import {
  getOrCreateUser
} from "../users.js";

import {
  getUsageSnapshot,
  getPublicPlanSummary,
  getSubscriptionStatus
} from "../plans.js";

function getUserId(req) {
  const header =
    req.headers["x-kirong-user-id"];

  const query =
    req.query?.userId;

  return String(
    header ||
    query ||
    ""
  ).trim();
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed"
      });
    }

    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: "Missing user ID"
      });
    }

    const user =
      await getOrCreateUser(userId);

    return res.status(200).json({
      ok: true,

      user: {
        userId: user.userId,
        plan: user.plan,
        createdAt: user.createdAt
      },

      plan:
        getPublicPlanSummary(user),

      usage:
        getUsageSnapshot(user),

      subscription:
        getSubscriptionStatus(user)
    });

  } catch (error) {
    console.error(
      "USER API ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "Unable to load user profile"
    });
  }
}
