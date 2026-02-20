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

    if (!address || !signature || !message) {
      return new Response(
        JSON.stringify({ error: "Missing address, signature, or message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user with this wallet exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("wallet_address", address.toLowerCase())
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // Create new user in auth.users with wallet as email placeholder
      const fakeEmail = `${address.toLowerCase()}@wallet.snapnbuy`;
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        email_confirm: true,
        user_metadata: { wallet_address: address.toLowerCase() },
      });

      if (createError || !newUser.user) {
        return new Response(
          JSON.stringify({ error: "Failed to create user", details: createError?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
    }

    // Generate a JWT for this user using admin API
    // We use generateLink to get a magic link, then extract the token
    // Actually, the cleanest way is to sign in the user directly
    const fakeEmail = `${address.toLowerCase()}@wallet.snapnbuy`;
    const tempPassword = `wallet_${address.toLowerCase()}_${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.slice(-8)}`;

    // Update the user's password so we can sign them in
    await supabaseAdmin.auth.admin.updateUser(userId, {
      password: tempPassword,
    });

    // Sign in to get a session
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: session, error: signInError } = await anonClient.auth.signInWithPassword({
      email: fakeEmail,
      password: tempPassword,
    });

    if (signInError || !session.session) {
      return new Response(
        JSON.stringify({ error: "Failed to create session", details: signInError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        user: {
          id: userId,
          wallet_address: address.toLowerCase(),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
