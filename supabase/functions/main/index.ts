import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import all function handlers
import professionalAssessment from "../professional-assessment/index.ts";

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Route to appropriate function
  if (path.startsWith('/professional-assessment')) {
    return professionalAssessment(req);
  }

  // Default response
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'AI English Studio Edge Functions',
      available_functions: [
        '/professional-assessment',
        '/translate',
        '/redeem-code',
        '/admin-action'
      ]
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
});
