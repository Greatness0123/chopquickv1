import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getPaystackBankCode(bankName: string): Promise<string | null> {
  const resp = await paystackRequest('GET', '/bank');
  const banks: any[] = resp.data ?? [];
  const normalized = bankName.toLowerCase().replace(/\s+/g, '');
  const match = banks.find((b) => {
    const bName = (b.name as string).toLowerCase().replace(/\s+/g, '');
    return bName === normalized || bName.includes(normalized) || normalized.includes(bName);
  });
  return match ? String(match.code) : null;
}

async function verifyAccount(accountNumber: string, bankCode: string): Promise<string | null> {
  const resp = await paystackRequest('GET', `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
  return resp.data?.account_name ?? null;
}

async function paystackRequest(method: string, path: string, body?: object) {
  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const resp = await fetch(url, opts);
  return resp.json();
}

function createPaystackRef(restaurantId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const short = restaurantId.slice(0, 8).toUpperCase();
  return `CW_${short}_${ts}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const { restaurant_id, amount, bank_name, bank_code, bank_account_number, bank_account_name } = await req.json();

    if (!restaurant_id || !amount || !bank_name || !bank_code || !bank_account_number || !bank_account_name) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (amount < 1000) {
      return new Response(JSON.stringify({ success: false, error: 'Minimum withdrawal is NGN 1,000' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the restaurant and check balance
    const { data: restaurant, error: restErr } = await supabase
      .from('restaurants')
      .select('id, owner_id, total_revenue_recovered, paystack_recipient_code')
      .eq('id', restaurant_id)
      .single();

    if (restErr || !restaurant) {
      return new Response(JSON.stringify({ success: false, error: 'Restaurant not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (amount > (restaurant.total_revenue_recovered ?? 0)) {
      return new Response(JSON.stringify({ success: false, error: 'Insufficient balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Step 0: Resolve Paystack bank code from bank name ──
    let resolvedBankCode = bank_code;

    const paystackBankCode = await getPaystackBankCode(bank_name);
    if (paystackBankCode) {
      resolvedBankCode = paystackBankCode;
    }

    if (paystackBankCode === null && bank_code === '00000') {
      return new Response(JSON.stringify({ success: false, error: 'Could not identify bank. Please check your bank name in settings.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const verifiedName = await verifyAccount(bank_account_number, resolvedBankCode);
    const recipientName = verifiedName || bank_account_name;

    // ── Step 1: Find or create Paystack recipient ──
    let recipientCode = restaurant.paystack_recipient_code;

    if (!recipientCode) {
      // Check withdrawal_recipients table
      const { data: existing } = await supabase
        .from('withdrawal_recipients')
        .select('recipient_code')
        .eq('restaurant_id', restaurant_id)
        .eq('bank_account_number', bank_account_number)
        .single();

      if (existing) {
        recipientCode = existing.recipient_code;
      }
    }

    if (!recipientCode) {
      // Create new recipient
      const recipientResp = await paystackRequest('POST', '/transferrecipient', {
        type: 'nuban',
        name: recipientName,
        account_number: bank_account_number,
        bank_code: resolvedBankCode,
        currency: 'NGN',
      });

      if (!recipientResp.status) {
        return new Response(JSON.stringify({ success: false, error: `Paystack: ${JSON.stringify(recipientResp.message)}` }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      recipientCode = recipientResp.data.recipient_code;

      // Store recipient
      await supabase.from('withdrawal_recipients').upsert({
        restaurant_id,
        bank_name,
        bank_code: resolvedBankCode,
        bank_account_number,
        bank_account_name: recipientName,
        recipient_code: recipientCode,
      }, { onConflict: 'restaurant_id, bank_account_number' });

      // Cache on restaurant
      await supabase
        .from('restaurants')
        .update({ paystack_recipient_code: recipientCode })
        .eq('id', restaurant_id);
    }

    // ── Step 2: Initiate transfer ──
    const paystackRef = createPaystackRef(restaurant_id);
    const amountKobo = Math.round(amount * 100);

    const transferResp = await paystackRequest('POST', '/transfer', {
      source: 'balance',
      amount: amountKobo,
      recipient: recipientCode,
      reference: paystackRef,
      reason: 'ChopQuick withdrawal',
      bank_code: resolvedBankCode,
    });

    if (!transferResp.status) {
      return new Response(JSON.stringify({ success: false, error: `Paystack transfer: ${JSON.stringify(transferResp.message)}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const transferCode = transferResp.data.transfer_code;

    // ── Step 3: Insert withdrawal record into DB ──
    const { data: withdrawal, error: insertErr } = await supabase
      .from('withdrawals')
      .insert({
        restaurant_id,
        amount,
        bank_name,
        bank_account_number,
        bank_account_name,
        status: 'processing',
        paystack_reference: paystackRef,
        paystack_transfer_id: transferCode,
        recipient_code: recipientCode,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Failed to insert withdrawal record:', insertErr);
      return new Response(JSON.stringify({ success: false, error: 'Failed to record withdrawal' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      withdrawal_id: withdrawal.id,
      paystack_reference: paystackRef,
      status: 'processing',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('paystack-transfer error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});