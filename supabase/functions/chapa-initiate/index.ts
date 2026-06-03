import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const CHAPA_SECRET = 'CHASECK_TEST-ko9vQijV1pAv8EoOVbTmUgHpq7KJs6pO';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: 'unauthorized' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { amount, return_url } = await req.json();
    const amt = Number(amount);
    if (!amt || amt < 10) return json({ error: 'amount_must_be_at_least_10' }, 400);

    // Chapa requires tx_ref <= 50 chars. Use short user prefix + base36 timestamp + random.
    const shortUid = user.id.replace(/-/g, '').slice(0, 12);
    const tx_ref = `wlt-${shortUid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    // Record pending transaction
    let { data: wallet } = await admin.from('wallets').select('id').eq('user_id', user.id).maybeSingle();
    if (!wallet) {
      const { data: newWallet } = await admin.from('wallets').insert({ user_id: user.id }).select('id').single();
      wallet = newWallet;
    }
    if (wallet) {
      const { error: txErr } = await admin.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        user_id: user.id,
        type: 'deposit',
        amount: amt,
        status: 'pending',
        reference: tx_ref,
        description: 'Chapa deposit (pending)',
      });
      if (txErr) return json({ error: 'pending_tx_insert_failed', detail: txErr.message }, 500);
    } else {
      return json({ error: 'wallet_missing' }, 500);
    }

    const baseReturn = return_url || `${req.headers.get('origin') || ''}/wallet`;
    const returnWithRef = `${baseReturn}${baseReturn.includes('?') ? '&' : '?'}tx_ref=${tx_ref}`;
    const projectUrl = Deno.env.get('SUPABASE_URL')!;

    const payload = {
      amount: String(amt),
      currency: 'ETB',
      email: user.email || `user-${user.id}@garagego.local`,
      first_name: (user.user_metadata?.full_name as string)?.split(' ')[0] || 'User',
      last_name: (user.user_metadata?.full_name as string)?.split(' ').slice(1).join(' ') || 'GarageGo',
      tx_ref,
      return_url: returnWithRef,
      callback_url: `${projectUrl}/functions/v1/chapa-verify?tx_ref=${tx_ref}`,
      customization: { title: 'GarageGo Wallet', description: 'Top up' },
    };

    const res = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok || body.status !== 'success') {
      return json({ error: 'chapa_init_failed', detail: body }, 400);
    }
    return json({ checkout_url: body.data.checkout_url, tx_ref });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}