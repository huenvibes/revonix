import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  try {
    console.log("REVTOO QUERY:", req.query);

    // USER ID রিসিভ করা
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

    // AMOUNT রিসিভ করা
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

    // Number নাকি UUID চেক করা
    const isNumeric = /^\d+$/.test(targetUserId);

    // GET PROFILE
    let query = supabase.from("profiles").select("*");
    
    if (isNumeric) {
      // যদি শুধুমাত্র সংখ্যা (user_code) হয়
      query = query.eq("user_code", Number(targetUserId));
    } else {
      // যদি টেক্সট বা UUID হয়
      query = query.eq("id", targetUserId);
    }

    const { data: profile, error: profileError } = await query.maybeSingle();

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
    let updateQuery = supabase.from("profiles").update({
      balance: newBalance,
      total_earned: newEarned,
    });

    // আপডেট করার সময়ও সেম চেক
    if (isNumeric) {
      updateQuery = updateQuery.eq("user_code", Number(targetUserId));
    } else {
      updateQuery = updateQuery.eq("id", targetUserId);
    }

    const { error: updateError } = await updateQuery;

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
