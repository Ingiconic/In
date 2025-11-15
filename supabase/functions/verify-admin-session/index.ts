import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function for token verification
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, expiresAt } = await req.json();

    if (!token || !expiresAt) {
      return new Response(
        JSON.stringify({ valid: false, error: 'نشست نامعتبر است' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired
    const now = new Date().getTime();
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ valid: false, error: 'نشست منقضی شده است' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token format (should be 64 hex characters)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return new Response(
        JSON.stringify({ valid: false, error: 'نشست نامعتبر است' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Token is valid
    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-admin-session function:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'خطای سرور' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
