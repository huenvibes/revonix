import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

// Setup supabase admin client for server-side updates
// Prefer service role key to bypass RLS for webhook updates
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder-url.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("SERVICE KEY:", !!serviceKey);

if (!serviceKey) {
  console.warn("⚠️ [Server] SUPABASE_SERVICE_ROLE_KEY is missing! Using VITE_SUPABASE_ANON_KEY fallback. RLS might block webhooks.");
}

const supabaseKey = serviceKey || process.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware
  app.use(express.json());

  // Revtoo Postback Webhook
  app.get("/api/revtoo-postback", async (req, res) => {
    try {
      const { userId, subId, payout, reward, transId, offer_name, status, signature } = req.query;

      // Log incoming query params for debugging
      console.log("[Revtoo Webhook] Incoming payload:", req.query);

      // Extract user ID (check both userId and subId for compatibility)
      const targetUserId = ((userId as string) || (subId as string) || "").trim();
      
      // Extract payout (check both payout and reward)
      const targetPayout = ((payout as string) || (reward as string))?.trim();

      // Handle missing transId during test mode
      const finalTransId = ((transId as string) || `test_${Date.now()}`).trim();

      // Ensure required fields exist
      if (!targetUserId || !targetPayout) {
        console.error("[Revtoo Webhook] Missing required parameters - targetUserId:", targetUserId, "payout:", targetPayout);
        // Always return OK even on failures to prevent Revtoo from retrying forever
        res.set('Content-Type', 'text/plain');
        return res.status(200).send("OK");
      }

      // Basic Signature Validation Stub (In production, replace with actual hash comparison)
      /*
      const postbackSecret = process.env.REVTOO_POSTBACK_SECRET || '';
      // Example signature check
      // const expectedSignature = md5(`${targetUserId}${finalTransId}${targetPayout}${postbackSecret}`);
      */

      // Ensure payout is a number
      const payoutAmount = parseFloat(targetPayout);
      if (isNaN(payoutAmount)) {
          console.error("[Revtoo Webhook] Invalid payout amount:", targetPayout);
          res.set('Content-Type', 'text/plain');
          return res.status(200).send("OK");
      }

      // 1. Check if transId already exists in reward_transactions
      // Only check duplicates if there is a real trans_id provided
      if (transId) {
        const { data: existingTx, error: txError } = await supabase
          .from("reward_transactions")
          .select("id")
          .eq("trans_id", transId as string)
          .single();

        if (existingTx) {
          // Prevent duplicate, but return OK so Revtoo doesn't retry
          res.set('Content-Type', 'text/plain');
          return res.status(200).send("OK");
        }

        if (txError && txError.code !== "PGRST116") {
          // PGRST116 means zero rows, which is what we want
          console.error("Error checking tx:", txError);
        }
      }

      // 2. Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, balance, total_earned")
        .eq("id", targetUserId)
        .single();

      if (profileError || !profile) {
        console.error(`[Revtoo Webhook] User not found for ID "${targetUserId}":`, profileError);
        res.set('Content-Type', 'text/plain');
        return res.status(200).send("OK"); // Return OK even on failure
      }

      const currentBalance = Number(profile.balance || 0);
      const currentTotalEarned = Number(profile.total_earned || 0);
      const currentPayout = Number(payoutAmount);

      console.log(`[Revtoo Webhook] Found profile for ${targetUserId}`);
      console.log(`[Revtoo Webhook] Current balance:`, currentBalance);
      console.log(`[Revtoo Webhook] Payout:`, currentPayout);

      const newBalance = currentBalance + currentPayout;
      const newTotalEarned = currentTotalEarned + currentPayout;

      console.log(`[Revtoo Webhook] Updated balance:`, newBalance);

      // 3. Update user profile balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance, total_earned: newTotalEarned })
        .eq("id", targetUserId);

      if (updateError) {
        console.error(`[Revtoo Webhook] Failed to update balance for user ${targetUserId}. Full error:`, JSON.stringify(updateError, null, 2));
        res.set('Content-Type', 'text/plain');
        return res.status(200).send("OK"); // Return OK even on failure
      }

      console.log(`[Revtoo Webhook] Successfully updated balance for user ${targetUserId}. New balance: ${newBalance}`);

      // 4. Record the transaction safely inside a try/catch
      try {
        const { error: insertError } = await supabase
          .from("reward_transactions")
          .insert({
            user_id: targetUserId,
            trans_id: finalTransId,
            offer_name: (offer_name as string) || "Revtoo Offer",
            payout: payoutAmount,
            status: (status as string) || "completed",
          });

        if (insertError) {
          console.error(`[Revtoo Webhook] Failed to insert tx for trans ${finalTransId}:`, insertError);
          // We DO NOT rollback the balance because the user earned the reward,
          // the transaction logger just failed.
        } else {
          console.log(`[Revtoo Webhook] Successfully inserted reward transaction: ${finalTransId} details: user_id=${targetUserId}, amount=${payoutAmount}`);
        }
      } catch (txErr) {
        console.error(`[Revtoo Webhook] Exception during transaction insert for ${finalTransId}:`, txErr);
        // Do not fail the webhook, allow it to return 200 OK
      }

      // Always return OK if we successfully reached this point
      res.set('Content-Type', 'text/plain');
      return res.status(200).send("OK");
    } catch (err) {
      console.error("Webhook processing error:", err);
      // For Revtoo, we should still return 200 OK so it doesn't keep retrying and spamming
      res.set('Content-Type', 'text/plain');
      return res.status(200).send("OK");
    }
  });

  // Admin Data Endpoint
  app.post("/api/admin/data", async (req, res) => {
    try {
      const { secretKey } = req.body;
      const expectedKey = process.env.VITE_ADMIN_SECRET_KEY || "admin123";
      
      if (secretKey !== expectedKey) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
        
      const { data: payouts, error: payErr } = await supabase
        .from("payout_requests")
        .select("*")
        .order("created_at", { ascending: false });
        
      const { data: rewards, error: rErr } = await supabase
        .from("reward_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (pErr) console.error("Admin data - Error fetching profiles:", pErr);
      if (payErr) console.error("Admin data - Error fetching payouts:", payErr);
      if (rErr) console.error("Admin data - Error fetching rewards:", rErr);

      return res.status(200).json({
        profiles: profiles || [],
        payouts: payouts || [],
        rewards: rewards || [],
        serviceRoleOk: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
    } catch (err) {
      console.error("Admin data endpoint error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Admin Payout Update Endpoint
  app.post("/api/admin/payout/update", async (req, res) => {
    try {
      const { secretKey, payoutId, newStatus } = req.body;
      const expectedKey = process.env.VITE_ADMIN_SECRET_KEY || "admin123";
      
      if (secretKey !== expectedKey) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!["pending", "processing", "completed", "approved", "rejected", "hold"].includes(newStatus)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing. Required for admin operations." });
      }

      // Fetch the payout to see its current status and amount
      const { data: payout, error: fetchErr } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("id", payoutId)
        .single();

      if (fetchErr || !payout) {
        return res.status(404).json({ error: "Payout request not found" });
      }

      // If status is changing to rejected, refund the user
      if (payout.status !== "rejected" && newStatus === "rejected") {
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", payout.user_id)
          .single();

        if (profile && !profileErr) {
          const newBalance = (profile.balance || 0) + payout.amount;
          await supabase.from("profiles").update({ balance: newBalance }).eq("id", payout.user_id);
        }
      }

      // Update payout status
      const { error: updateErr, data: updatedPayout } = await supabase
        .from("payout_requests")
        .update({ status: newStatus })
        .eq("id", payoutId)
        .select()
        .single();

      if (updateErr) {
        return res.status(500).json({ error: "Failed to update payout status" });
      }

      return res.status(200).json({ success: true, payout: updatedPayout });
    } catch (err) {
      console.error("Admin payout update error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Admin User Bonus Endpoint
  app.post("/api/admin/user/bonus", async (req, res) => {
    try {
      const { secretKey, userId, amount } = req.body;
      const bonusAmount = parseFloat(amount);
      const expectedKey = process.env.VITE_ADMIN_SECRET_KEY || "admin123";
      
      if (secretKey !== expectedKey) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (isNaN(bonusAmount) || bonusAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing. Required for admin operations." });
      }

      // Fetch current profile
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("balance, total_earned")
        .eq("id", userId)
        .single();

      if (profileErr || !profile) {
        return res.status(404).json({ error: "User not found" });
      }

      const newBalance = (profile.balance || 0) + bonusAmount;
      const newTotal = (profile.total_earned || 0) + bonusAmount;

      // Update balance
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ balance: newBalance, total_earned: newTotal })
        .eq("id", userId);

      if (updateErr) {
        return res.status(500).json({ error: "Failed to update user balance" });
      }

      // Insert transaction history
      const { error: txErr } = await supabase
        .from("reward_transactions")
        .insert({
          user_id: userId,
          trans_id: `bonus_${Date.now()}`,
          provider: "Admin System",
          offer_name: "Admin Bonus",
          payout: bonusAmount,
          status: "completed"
        });

      if (txErr) {
        console.error("Failed to insert bonus transaction:", txErr);
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Admin user bonus error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Temporary Debug Endpoint
  app.get("/api/debug-supabase", async (req, res) => {
    try {
      const dbServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const dbUrl = process.env.VITE_SUPABASE_URL;

      if (!dbServiceKey || !dbUrl) {
        return res.status(500).json({
          error: "Missing credentials",
          message: "SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL is missing."
        });
      }

      // Create a fresh client specifically for this debug endpoint 
      // to guarantee it's using the service role key
      const debugSupabase = createClient(dbUrl, dbServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await debugSupabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (error) {
        return res.status(500).json({ error: "Failed to fetch from profiles", details: error });
      }

      return res.status(200).json({
        success: true,
        message: "Successfully queried profiles table using service role key",
        data: data
      });
    } catch (err) {
      console.error("Debug endpoint error:", err);
      return res.status(500).json({ error: "Internal Server Error", details: err });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
