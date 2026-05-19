import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  try {
    console.log(req.query);
const targetUserId = String(
  req.query.subId ||
  req.query.subid ||
  req.query.userId ||
  req.query.userid ||
  req.query.amount ||
  ""
).trim();

const amount = Number(
  req.query.reward ||
  req.query.payout ||
  0
);
    if (!targetUserId) {
  return res.status(200).send("OK");
}

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    const newBalance = Number(profile.balance || 0) + amount;
const newEarned = Number(profile.total_earned || 0) + amount;

const { error } = await supabase
  .from("profiles")
  .update({
    balance: newBalance,
    total_earned: newEarned,
  })
  .eq("id", targetUserId);
    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).send("OK");

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: String(err),
    });
  }
}
