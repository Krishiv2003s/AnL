import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

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

serve(async (req) => {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
        const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

        if (!razorpayKeyId || !razorpayKeySecret) {
            throw new Error('Razorpay keys not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('Invalid user');
        }

        const { action, ...payload } = await req.json();

        if (action === 'create-order') {
            // Create Razorpay Order
            // Amount: 200 INR = 20000 paise
            const amount = 20000;
            const currency = 'INR';

            const response = await fetch('https://api.razorpay.com/v1/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
                },
                body: JSON.stringify({
                    amount,
                    currency,
                    receipt: `rcpt_${user.id.slice(0, 10)}_${Date.now()}`,
                    notes: {
                        user_id: user.id
                    }
                }),
            });

            const orderData = await response.json();
            if (!response.ok) {
                throw new Error(orderData.error?.description || 'Failed to create order');
            }

            return new Response(JSON.stringify(orderData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        else if (action === 'verify-payment') {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

            // Verify Signature
            // HMAC_SHA256(order_id + "|" + payment_id, secret)
            const data = `${razorpay_order_id}|${razorpay_payment_id}`;
            const encoder = new TextEncoder();
            const keyData = encoder.encode(razorpayKeySecret);
            const msgData = encoder.encode(data);

            const cryptoKey = await crypto.subtle.importKey(
                "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
            );
            const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);

            // Convert buffer to hex string
            const signatureArray = Array.from(new Uint8Array(signatureBuffer));
            const generatedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

            if (generatedSignature !== razorpay_signature) {
                throw new Error('Invalid signature');
            }

            // Update User Profile
            // Set to active, +30 days
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 30); // Monthly subscription validation

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    subscription_status: 'active',
                    subscription_tier: 'pro',
                    subscription_end_date: endDate.toISOString(),
                    razorpay_subscription_id: razorpay_order_id // storing order_id as pseudo-sub id for now
                })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            // Log Payment
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    user_id: user.id,
                    amount: 200.00,
                    currency: 'INR',
                    status: 'success',
                    razorpay_order_id,
                    razorpay_payment_id
                });

            if (paymentError) console.error('Error logging payment:', paymentError);

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        else {
            throw new Error('Invalid action');
        }

    } catch (error) {
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
