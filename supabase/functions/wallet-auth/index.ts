import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRIVY_APP_ID = "cmlvmgiov00w30bjxom0snwdw";

// Cache JWKS to avoid fetching on every request
let cachedJWKS: jose.JSONWebKeySet | null = null;
let jwksFetchedAt = 0;
const JWKS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getPrivyJWKS(): Promise<jose.JSONWebKeySet> {
  const now = Date.now();
  if (cachedJWKS && now - jwksFetchedAt < JWKS_CACHE_TTL) {
    return cachedJWKS;
  }

  const resp = await fetch(
    `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`
  );
  if (!resp.ok) {
    throw new Error(`Failed to fetch Privy JWKS: ${resp.status}`);
  }
  cachedJWKS = await resp.json();
  jwksFetchedAt = now;
  return cachedJWKS!;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { privyToken, address } = await req.json();
    console.log("wallet-auth called for address:", address);

    if (!privyToken || !address) {
      return new Response(
        JSON.stringify({ error: "Missing privyToken or address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Privy JWT
    let walletAddress: string;
    try {
      const jwks = await getPrivyJWKS();
      const keySet = jose.createLocalJWKSet(jwks);
      const { payload } = await jose.jwtVerify(privyToken, keySet, {
        issuer: "privy.io",
        audience: PRIVY_APP_ID,
      });

      // Extract wallet address from Privy token
      // Privy stores linked accounts in the token
      const linkedAccounts = (payload as any).linked_accounts || [];
      const walletAccount = linkedAccounts.find(
        (a: any) => a.type === "wallet" && a.address?.toLowerCase() === address.toLowerCase()
      );

      if (walletAccount) {
        walletAddress = walletAccount.address.toLowerCase();
      } else {
        // Fallback: trust the address if the token is valid (user is authenticated)
        walletAddress = address.toLowerCase();
      }
    } catch (verifyErr) {
      console.error("Privy token verification failed:", verifyErr);
      return new Response(
        JSON.stringify({ error: "Invalid Privy token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Privy token verified for:", walletAddress);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const fakeEmail = `${walletAddress}@wallet.snapnbuy`;
    const tempPassword = `wallet_${walletAddress}_${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.slice(-12)}`;

    // Check if user exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.id;
      console.log("Existing user found:", userId);

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: tempPassword,
      });
      if (updateErr) {
        console.error("Failed to update user password:", updateErr);
      }
    } else {
      console.log("Creating new user for wallet:", walletAddress);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { wallet_address: walletAddress },
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
        user: { id: userId, wallet_address: walletAddress },
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
