import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.16.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, signature, message } = await req.json();
    console.log("wallet-auth called for address:", address);

    if (!address || !signature || !message) {
      return new Response(
        JSON.stringify({ error: "Missing address, signature, or message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (verifyErr) {
      console.error("Signature verification failed:", verifyErr);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Signature does not match address" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Signature verified for:", address);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const walletLower = address.toLowerCase();
    const fakeEmail = `${walletLower}@wallet.snapnbuy`;
    const tempPassword = `wallet_${walletLower}_${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.slice(-12)}`;

    // Check if user exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletLower)
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.id;
      console.log("Existing user found:", userId);

      // Update password for existing user
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: tempPassword,
      });
      if (updateErr) {
        console.error("Failed to update user password:", updateErr);
      }
    } else {
      console.log("Creating new user for wallet:", walletLower);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { wallet_address: walletLower },
      });

      if (createError || !newUser.user) {
        console.error("User creation failed:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user", details: createError?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = newUser.user.id;
    }

    // Sign in to get session tokens
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: session, error: signInError } = await anonClient.auth.signInWithPassword({
      email: fakeEmail,
      password: tempPassword,
    });

    if (signInError || !session.session) {
      console.error("Sign in failed:", signInError);
      return new Response(
        JSON.stringify({ error: "Failed to create session", details: signInError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Session created for user:", userId);

    return new Response(
      JSON.stringify({
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        user: { id: userId, wallet_address: walletLower },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
