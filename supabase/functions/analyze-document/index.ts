
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// CORS headers
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

const VALID_DOCUMENT_TYPES = ['bank_statement', 'form_16', 'ledger', 'tax_return', 'ais', 'form_26as', 'itr_coi', 'other'];

// @ts-ignore
Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Auth header missing');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { documentContent, documentType, fileName, isBase64, mimeType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    if (!VALID_DOCUMENT_TYPES.includes(documentType)) throw new Error('Invalid doc type');
    const sanitizedFileName = fileName ? String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_') : 'document';

    const systemPrompt = `You are an expert Indian tax consultant and financial analyst. 

### CLASSIFICATION SYSTEM (CRITICAL):
1. **asset** (State): Wealth snapshot. Examples: Closing Bank Balance, FD amount, Stock value. 
   - *Strict Rule*: In a bank statement, ONLY the Final Closing Balance is an asset.
2. **liability** (State): Debt snapshot. Examples: Loan Balance, Credit Card Outstanding.
3. **neutral** (Flow): Transactions/Events. Examples: Salary Credit, Rent Paid, Interest Earned, Grocery spending, TDS.
   - *Rule*: All one-time transaction flows are neutral.

### REASONING STEP:
Before outputting, mentally verify: "Is this a balance (Asset/Liab) or a transaction (Neutral)?"

### EXAMPLES:
- "Salary Credit (₹1,50,000)": classification: "neutral", category: "salary"
- "Closing Balance (₹8,45,000)": classification: "asset", category: "other"
- "HDFC Home Loan (₹45,00,000)": classification: "liability", category: "other"

Respond with JSON:
{
  "is_financial_document": boolean,
  "accounts": [{
    "account_name": "string",
    "category": "salary|interest|dividend|deduction|tax_paid|expense|income|other",
    "amount": number,
    "classification": "asset|liability|neutral",
    "reasoning": "string (Mentally verify State vs Flow)",
    "details": "string"
  }],
  "insights": [...],
  "summary": {
    "total_income": number,
    "total_deductions": number,
    "total_tax_paid": number,
    "total_assets": number,
    "total_liabilities": number,
    "tax_regime": "Old|New|Unknown"
  }
}`;

    let userContent: any;
    if (isBase64) {
      userContent = [{ type: "text", text: `Type: ${documentType}\nFile: ${sanitizedFileName}` }, { type: "image_url", image_url: { url: `data:${mimeType || 'application/pdf'};base64,${documentContent}` } }];
    } else {
      userContent = `Type: ${documentType}\nFile: ${sanitizedFileName}\n\nContent:\n${documentContent}`;
    }

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
        temperature: 0.1,
      }),
    });

    if (!aiRes.ok) throw new Error('AI Failed');
    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || [null, content];
    const result = JSON.parse(jsonMatch[1].trim());

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
