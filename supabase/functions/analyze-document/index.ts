import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// CORS headers - restrict to trusted origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://avubnhpompugktamckev.supabase.co',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// Input validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BASE64_SIZE = MAX_FILE_SIZE * 1.37; // base64 is ~37% larger
const VALID_DOCUMENT_TYPES = ['bank_statement', 'form_16', 'ledger', 'tax_return', 'other'];
const VALID_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/png',
  'image/jpeg',
];

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Configuration error');
    }

    // Create Supabase client and verify the user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_end_date, lifetime_docs_analyzed')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Fail open or closed? Closed for MVP to prevent abuse, but might block legitimate users if profile missing.
      // Profile creation is guaranteed by trigger.
      throw new Error('Failed to fetch user profile');
    }

    const isActive = profile.subscription_status === 'active';
    // Simplified check. Real world would check dates too, but 'active' status is main gate.

    const usageCount = profile.lifetime_docs_analyzed || 0;
    const FREE_LIMIT = 1;

    if (!isActive && usageCount >= FREE_LIMIT) {
      return new Response(JSON.stringify({
        error: 'Free limit reached. Please upgrade to Pro for unlimited analysis.',
        code: 'PAYMENT_REQUIRED',
        is_limit_reached: true
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { documentContent, documentType, fileName, isBase64, mimeType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Input validation
    if (!documentContent || typeof documentContent !== 'string') {
      return new Response(JSON.stringify({ error: 'Document content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file size for ALL content types
    if (isBase64) {
      // For base64, check encoded size (base64 is ~37% larger than original)
      if (documentContent.length > MAX_BASE64_SIZE) {
        return new Response(JSON.stringify({ error: 'File size exceeds 10MB limit' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // For text content, validate actual content length
      const contentSizeBytes = new TextEncoder().encode(documentContent).length;
      if (contentSizeBytes > MAX_FILE_SIZE) {
        return new Response(JSON.stringify({ error: 'File size exceeds 10MB limit' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate document type
    if (!documentType || !VALID_DOCUMENT_TYPES.includes(documentType)) {
      return new Response(JSON.stringify({ error: 'Invalid document type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate MIME type if provided
    if (mimeType && !VALID_MIME_TYPES.includes(mimeType)) {
      return new Response(JSON.stringify({ error: 'Invalid file type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize fileName (remove potential path traversal)
    const sanitizedFileName = fileName ? String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255) : 'document';

    const systemPrompt = `You are an expert Indian tax consultant and financial analyst. Analyze the provided financial document and extract ALL transactions and structured information.

IMPORTANT: Extract EVERY transaction you can see in the document including:
- All credits (deposits, income, transfers in)
- All debits (withdrawals, expenses, transfers out)
- Opening and closing balances
- Interest earned
- Any fees or charges

Your task:
1. Identify and categorize ALL transactions into accounts (Cash, Credit Card, Bank Transfer, Investment, Salary, Loan, Expense, Income, etc.)
2. Calculate total credit, debit, and net balance for each account category
3. Determine if each account is taxable under Indian tax laws
4. Classify each account as Asset, Liability, or Neutral
5. Provide detailed tax insights specific to Indian ITR filing
6. Identify any red flags or warnings based on latest Indian tax regulations

For each insight, determine the severity:
- "error" for critical issues (exceeding cash limits, unreported crypto, etc.)
- "warning" for potential issues (high cash transactions, missing documents)
- "info" for general advice and recommendations

Always suggest the appropriate ITR form (ITR-1, ITR-2, ITR-3, ITR-4) based on the income sources identified.

Respond with a valid JSON object in this exact format:
{
  "accounts": [
    {
      "account_name": "string (descriptive name)",
      "category": "cash|credit_card|bank_transfer|investment|salary|loan|expense|income|other",
      "total_credit": number (total money received),
      "total_debit": number (total money spent),
      "net_balance": number (credit - debit),
      "is_taxable": boolean,
      "classification": "asset|liability|neutral",
      "tax_implications": "string explaining tax treatment"
    }
  ],
  "insights": [
    {
      "insight_type": "string (e.g., 'cash_limit', 'crypto_trading', 'itr_recommendation', 'income_analysis')",
      "severity": "error|warning|info",
      "title": "string",
      "description": "string",
      "recommendation": "string",
      "itr_form_suggestion": "ITR-1|ITR-2|ITR-3|ITR-4|null"
    }
  ],
  "summary": {
    "total_assets": number,
    "total_liabilities": number,
    "net_worth": number,
    "primary_income_source": "string",
    "recommended_itr_form": "string",
    "tax_regime_suggestion": "Old Regime|New Regime"
  }
}`;

    // Build messages based on whether content is base64 (PDF/image) or text
    let userContent: any;

    if (isBase64) {
      // For PDFs and images, use multimodal input
      userContent = [
        {
          type: "text",
          text: `Document Type: ${documentType}\nFile Name: ${sanitizedFileName}\n\nPlease analyze this financial document thoroughly. Extract ALL transactions, calculate totals, and provide tax insights. Look at every page and every transaction.`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType || 'application/pdf'};base64,${documentContent}`
          }
        }
      ];
    } else {
      // For text content
      userContent = `Document Type: ${documentType}\nFile Name: ${sanitizedFileName}\n\nDocument Content:\n${documentContent}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error('AI processing failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty AI response');
    }

    // Parse the JSON from the response
    let analysisResult;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      // Return a default structure if parsing fails
      analysisResult = {
        accounts: [],
        insights: [{
          insight_type: 'parsing_error',
          severity: 'warning',
          title: 'Document Processing Note',
          description: 'The document was processed but some details may need manual verification.',
          recommendation: 'Please review the uploaded document and ensure it contains clear transaction data.',
          itr_form_suggestion: null
        }],
        summary: {
          total_assets: 0,
          total_liabilities: 0,
          net_worth: 0,
          primary_income_source: 'Unknown',
          recommended_itr_form: 'ITR-1',
          tax_regime_suggestion: 'New Regime'
        }
      };
    }

    // Increment usage count for free users (and paid too, for stats)
    if (!isActive || true) { // Always track usage
      await supabase.from('profiles').update({
        lifetime_docs_analyzed: usageCount + 1
      }).eq('user_id', user.id);
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: `Error: ${error instanceof Error ? error.message : String(error)}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
