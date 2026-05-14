import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

function verifyPaystackSignature(body: string, signature: string): boolean {
  const encoder = new TextEncoder();
  const key = encoder.encode(PAYSTACK_SECRET_KEY);
  const data = encoder.encode(body);
  const hash = await crypto.subtle.digestSync('SHA-512', key, data);
  const expected = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === signature;
}

async function fetchPaystackTransfer(transferId: string) {
  const resp = await fetch(`https://api.paystack.co/transfer/${transferId}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return resp.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get('x-paystack-signature') ?? '';
  let event: any;

  try {
    const body = await req.text();

    // Verify webhook signature
    if (PAYSTACK_SECRET_KEY && !await verifyPaystackSignature(body, signature)) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    event = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Only process transfer events
  if (event.event !== 'transfer.success' && event.event !== 'transfer.failed' && event.event !== 'transfer.reversed') {
    return new Response(JSON.stringify({ received: true, skipped: 'non-transfer event' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const transfer = event.data;
  const paystackRef = transfer.reference as string;

  try {
    // Idempotency: check if already processed
    const { data: existing } = await supabase
      .from('withdrawals')
      .select('id, status')
      .eq('paystack_reference', paystackRef)
      .single();

    if (!existing) {
      console.log(`Withdrawal not found for reference: ${paystackRef}`);
      return new Response(JSON.stringify({ received: true, note: 'Withdrawal not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existing.status === 'paid' && event.event === 'transfer.success') {
      // Already processed — return success to avoid double-processing
      return new Response(JSON.stringify({ received: true, note: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (event.event === 'transfer.success') {
      // ── Transfer succeeded: mark as paid ──
      // The database trigger handle_withdrawal_paid() will deduct total_revenue_recovered
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paystack_response: transfer,
        })
        .eq('paystack_reference', paystackRef);

      if (error) throw error;

      // Update the restaurant's cached recipient code if changed
      if (transfer.recipient?.recipient_code) {
        const { data: wd } = await supabase
          .from('withdrawals')
          .select('restaurant_id')
          .eq('paystack_reference', paystackRef)
          .single();

        if (wd) {
          await supabase
            .from('withdrawal_recipients')
            .upsert({
              restaurant_id: wd.restaurant_id,
              recipient_code: transfer.recipient.recipient_code,
            }, { onConflict: 'restaurant_id, bank_account_number' });
        }
      }

      console.log(`Withdrawal paid: ${paystackRef}`);
    } else if (event.event === 'transfer.failed') {
      // ── Transfer failed: mark as failed, no deduction ──
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          paystack_response: transfer,
        })
        .eq('paystack_reference', paystackRef);

      if (error) throw error;
      console.log(`Withdrawal failed: ${paystackRef}`);
    } else if (event.event === 'transfer.reversed') {
      // ── Transfer reversed: Paystack returned funds — mark as reversed ──
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'reversed',
          paystack_response: transfer,
        })
        .eq('paystack_reference', paystackRef);

      if (error) throw error;
      console.log(`Withdrawal reversed: ${paystackRef}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});