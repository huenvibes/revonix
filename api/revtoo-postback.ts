import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  try {
    console.log("REVTOO QUERY:", req.query);

    // USER ID
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

    // AMOUNT
    const amount = Number(
      req.query.reward ||
      req.query.payout ||
      req.query.amount ||
      req.query.value ||
      0
    );

    console.log("TARGET USER:", targetUserId);
    console.log("AMOUNT:", amount);

    // CHECK USER ID
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: "Missing user id",
      });
    }

    // GET PROFILE
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .maybeSingle();

    // PROFILE NOT FOUND
    if (profileError || !profile) {
      console.log("PROFILE ERROR:", profileError);

      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    // NEW VALUES
    const newBalance = Number(profile.balance || 0) + amount;
    const newEarned = Number(profile.total_earned || 0) + amount;

    // UPDATE PROFILE
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        balance: newBalance,
        total_earned: newEarned,
      })
      .eq("id", targetUserId)

    // UPDATE FAILED
    if (updateError) {
      console.log("UPDATE ERROR:", updateError);

      return res.status(500).json({
        success: false,
        error: updateError.message,
      });
    }

    console.log("BALANCE ADDED SUCCESS");

    return res.status(200).send("OK");
  } catch (err) {
    console.log("SERVER ERROR:", err);

    return res.status(500).json({
      success: false,
      error: String(err),
    });
  }
}
