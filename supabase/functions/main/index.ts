import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Default response - list available functions
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'AI English Studio Edge Functions',
      available_functions: [
        '/professional-assessment',
        '/translate',
        '/redeem-code',
        '/admin-action'
      ],
      note: 'Each function should be called directly via its own endpoint'
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
});
