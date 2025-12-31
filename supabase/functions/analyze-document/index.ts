
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// CORS headers - restrict to trusted origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
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
const VALID_DOCUMENT_TYPES = ['bank_statement', 'form_16', 'ledger', 'tax_return', 'ais', 'form_26as', 'itr_coi', 'other'];
const VALID_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/png',
  'image/jpeg',
];

Deno.serve(async (req) => {
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

    // Validate document type
    if (!documentType || !VALID_DOCUMENT_TYPES.includes(documentType)) {
      return new Response(JSON.stringify({ error: 'Invalid document type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize fileName
    const sanitizedFileName = fileName ? String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255) : 'document';

    const systemPrompt = `You are an expert Indian tax consultant and financial analyst. Analyze the provided financial document and extract ALL structured information for an ITR Self-Audit.

### DOCUMENT VALIDATION:
1. **REJECT NON-FINANCIAL DOCUMENTS**: If the document is NOT a tax return, bank statement, AIS, Form 26AS, or ITR Computation (COI), you MUST return an error insight. Set "is_financial_document" to false.
2. **DETECTION RULES**: Look for keywords like "Income Tax", "AIS", "Form 26AS", "Account Statement", "TDS", "Section 80C".

### EXTRACTION GOALS (Indian Tax Context):
1. **Salary (Section 16)**: Extract Gross Salary, standard deduction, professional tax, and HRA exemptions.
2. **Other Income**: Interest (Savings/FD), Dividends, Capital Gains.
3. **Deductions (Chapter VI-A)**: 80C (LIC/PPF/PF), 80D (Health), 80G (Donations), 80TTA/B (Savings Interest).
4. **TDS/Tax Credits**: Extract TDS from Salary, Banks, and others.
5. **ITR Computation (COI)**: If this is a COI, extract the "Total Income" and "Tax Payable" as calculated by the CA/Software.

### INSIGHT TYPES:
- "error" for critical mismatches, non-financial documents, or potential scrutiny triggers.
- "warning" for minor discrepancies or missing data.
- "info" for optimization tips.

### EXTRACTION RULES:
1. **NO DOUBLE COUNTING**: Strictly ignore summary rows within tables.
2. **CLASSIFICATION**: 'asset', 'liability', or 'neutral'.

Respond with a valid JSON object in this exact format:
{
  "is_financial_document": boolean,
  "accounts": [
    {
      "account_name": "string (e.g., 'Gross Salary', 'Interest income', '80C Deduction')",
      "category": "salary|interest|dividend|deduction|tax_paid|other",
      "amount": number,
      "classification": "asset|liability|neutral",
      "details": "string"
    }
  ],
  "insights": [
    {
      "insight_type": "string",
      "severity": "error|warning|info",
      "title": "string",
      "description": "string",
      "recommendation": "string"
    }
  ],
  "summary": {
    "total_income": number,
    "total_deductions": number,
    "total_tax_paid": number,
    "tax_regime": "Old|New|Unknown"
  }
}`;

    let userContent: any;
    if (isBase64) {
      userContent = [
        {
          type: "text",
          text: `Document Type: ${documentType}\nFile Name: ${sanitizedFileName}\n\nPlease analyze this document for Indian tax data extraction.`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType || 'application/pdf'};base64,${documentContent}`
          }
        }
      ];
    } else {
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
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) throw new Error('AI processing failed');

    const responseData = await response.json();
    const content = responseData.choices?.[0]?.message?.content;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const analysisResult = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
