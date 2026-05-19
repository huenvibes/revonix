import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  try {
    console.log("REVTOO QUERY:", req.query);
    console.log(req.query);
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
    .eq("id", targetUserId.trim())
  return res.status(200).send("OK");
}

    const { data: profile } = await supabase
      .from("profiles")
.select("*")
.eq("id", targetUserId.trim())
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
    balance: Number(newBalance),
    total_earned: Number(newEarned),
  })
  .eq("id", String(targetUserId).trim());
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
