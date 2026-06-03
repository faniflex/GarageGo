import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const CHAPA_SECRET = 'CHASECK_TEST-ko9vQijV1pAv8EoOVbTmUgHpq7KJs6pO';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let tx_ref = url.searchParams.get('tx_ref') || '';
    if (!tx_ref) {
      try {
        const body = await req.json();
        tx_ref = body?.tx_ref || '';
      } catch {/* ignore */}
    }
    if (!tx_ref) return json({ error: 'tx_ref_required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const res = await fetch(`https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(tx_ref)}`, {
      headers: { Authorization: `Bearer ${CHAPA_SECRET}` },
    });
    const body = await res.json();

    if (!res.ok || body.status !== 'success' || body.data?.status !== 'success') {
      await supabase.from('wallet_transactions')
        .update({ status: 'failed', metadata: body })
        .eq('reference', tx_ref)
        .eq('status', 'pending');
      return json({ success: false, status: body.data?.status || 'unknown' });
    }

    // Look up the pending transaction to find the user (tx_ref format is short/opaque)
    const { data: pendingTx } = await supabase
      .from('wallet_transactions')
      .select('user_id, amount')
      .eq('reference', tx_ref)
      .maybeSingle();

    const userId = pendingTx?.user_id;
    const amount = Number(body.data.amount ?? pendingTx?.amount);

    if (!userId) {
      return json({ error: 'pending_tx_not_found', tx_ref }, 404);
    }

    // mark pending row as success (or no-op if already) and credit via RPC (idempotent)
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('credit_wallet', {
      _user_id: userId,
      _amount: amount,
      _reference: tx_ref,
      _type: 'deposit',
      _description: 'Chapa deposit',
    });
    if (rpcErr) return json({ error: rpcErr.message }, 500);

    // remove the original pending placeholder row if present
    await supabase.from('wallet_transactions')
      .delete()
      .eq('reference', tx_ref)
      .eq('status', 'pending');

    return json({ success: true, result: rpcRes });
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