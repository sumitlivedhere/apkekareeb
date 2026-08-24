import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);

    if (cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ success: false, error: "Please enter a valid 10-digit mobile number." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 1. Generate 6-Digit Numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Hash OTP using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`townhub_otp_${otpCode}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const otpHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 3. Store OTP Challenge in Database (enforces 60s cooldown)
    const { data: dbResult, error: dbError } = await supabase.rpc("store_sms_otp_challenge", {
      p_phone: cleanPhone,
      p_otp_hash: otpHash,
    });

    if (dbError || !dbResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: dbResult?.error || dbError?.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // 4. Dispatch SMS via Fast2SMS Quick OTP Route
    if (FAST2SMS_API_KEY) {
      const smsResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otpCode,
          numbers: cleanPhone,
        }),
      });

      const smsResult = await smsResponse.json();
      if (!smsResult.return) {
        console.error("Fast2SMS gateway error:", smsResult);
        return new Response(
          JSON.stringify({ success: false, error: smsResult.message?.[0] || "SMS delivery failed." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
        );
      }
    } else {
      console.log(`[LOCAL DEV SMS] OTP for +91 ${cleanPhone}: ${otpCode}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `OTP sent successfully to +91 ${cleanPhone}`,
        debug_otp: FAST2SMS_API_KEY ? undefined : otpCode
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});