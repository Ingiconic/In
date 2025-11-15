import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('check-username function called');
    const { username } = await req.json();
    console.log('Checking username:', username);

    if (!username) {
      console.log('No username provided');
      return new Response(
        JSON.stringify({ error: 'نام کاربری الزامی است' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Querying profiles table for username:', username);

    // Check if username exists in profiles
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Database error checking username:', error);
      return new Response(
        JSON.stringify({ error: 'خطا در بررسی نام کاربری' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Query result:', data);
    const exists = !!data;
    console.log('Username exists:', exists);

    // Return whether user exists or not
    return new Response(
      JSON.stringify({ exists }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Exception in check-username function:', error);
    return new Response(
      JSON.stringify({ error: 'خطای سرور' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
