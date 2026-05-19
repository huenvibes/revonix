import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  try {
    console.log("REVTOO QUERY:", req.query);

    const targetUserId = String(
      req.query.subId ||
      req.query.subid ||
      req.query.userId ||
      req.query.userid ||
      req.query.uid ||
      req.query.user_id ||
      req.query.s1 ||
      req.query.clickid ||
      req.query.transaction_id ||
      ""
    ).trim();

    const amount = Number(
      req.query.reward ||
      req.query.payout ||
      req.query.amount ||
      req.query.value ||
      0
    );

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: "Missing user id",
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    const newBalance = Number(profile.balance || 0) + amount;
    const newEarned = Number(profile.total_earned || 0) + amount;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        balance: newBalance,
        total_earned: newEarned,
      })
      .eq("id", targetUserId);

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      credited: amount,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: String(err),
    });
  }
}
