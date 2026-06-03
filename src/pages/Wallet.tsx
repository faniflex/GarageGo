import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Loader2, ArrowLeft,
  TrendingUp, TrendingDown, ArrowRightLeft, Clock,
} from "lucide-react";

interface Tx {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  reference: string | null;
  created_at: string;
}

const Wallet = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const [balance, setBalance] = useState<number>(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmt, setDepositAmt] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [wAmt, setWAmt] = useState("");
  const [wBank, setWBank] = useState("");
  const [wAccNum, setWAccNum] = useState("");
  const [wAccName, setWAccName] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  // Safety net: verify any pending deposits when wallet loads
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: pendings } = await supabase
        .from("wallet_transactions")
        .select("reference")
        .eq("user_id", user.id)
        .eq("type", "deposit")
        .eq("status", "pending")
        .not("reference", "is", null);
      if (!pendings || pendings.length === 0) return;
      for (const p of pendings) {
        await supabase.functions.invoke("chapa-verify", { body: { tx_ref: p.reference } });
      }
      refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle Chapa return
  useEffect(() => {
    const tx_ref = params.get("tx_ref");
    if (tx_ref && user && !verifying) {
      setVerifying(true);
      supabase.functions.invoke("chapa-verify", { body: { tx_ref } }).then(({ data, error }) => {
        if (error || !(data as any)?.success) {
          toast({ title: "Deposit not completed", description: "Your transaction was not successful.", variant: "destructive" });
        } else {
          toast({ title: "Deposit successful", description: "Your wallet has been credited." });
        }
        params.delete("tx_ref");
        setParams(params, { replace: true });
        refresh();
        setVerifying(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.get("tx_ref")]);

  const refresh = async () => {
    setLoading(true);
    const [{ data: w }, { data: t }] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", user!.id).maybeSingle(),
      supabase.from("wallet_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setBalance(Number(w?.balance || 0));
    setTxs((t as Tx[]) || []);
    setLoading(false);
  };

  const startDeposit = async () => {
    const amt = Number(depositAmt);
    if (!amt || amt < 10) {
      toast({ title: "Invalid amount", description: "Minimum deposit is 10 ETB.", variant: "destructive" });
      return;
    }
    setDepositing(true);
    const { data, error } = await supabase.functions.invoke("chapa-initiate", {
      body: { amount: amt, return_url: `${window.location.origin}/wallet` },
    });
    setDepositing(false);
    if (error || !(data as any)?.checkout_url) {
      toast({ title: "Could not start deposit", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    window.location.href = (data as any).checkout_url;
  };

  const requestPayout = async () => {
    const amt = Number(wAmt);
    if (!amt || amt <= 0) return toast({ title: "Enter a valid amount", variant: "destructive" });
    if (amt > balance) return toast({ title: "Insufficient balance", variant: "destructive" });
    if (!wBank || !wAccNum || !wAccName) return toast({ title: "Fill all bank details", variant: "destructive" });
    setSubmittingPayout(true);
    const { error } = await supabase.from("payout_requests").insert({
      user_id: user!.id, amount: amt, bank_name: wBank, account_number: wAccNum, account_name: wAccName,
    });
    setSubmittingPayout(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout requested", description: "An admin will review your request." });
      setWithdrawOpen(false);
      setWAmt(""); setWBank(""); setWAccNum(""); setWAccName("");
    }
  };

  const txIcon = (type: string) => {
    if (type === "deposit") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (type === "credit") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (type === "payment") return <TrendingDown className="w-4 h-4 text-destructive" />;
    if (type === "payout") return <ArrowUpFromLine className="w-4 h-4 text-destructive" />;
    if (type === "refund") return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
    return <Clock className="w-4 h-4" />;
  };

  const sign = (type: string) => (["deposit", "credit", "refund"].includes(type) ? "+" : "-");

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="md:hidden sticky top-0 z-40 bg-card border-b px-4 h-14 flex items-center gap-3">
        <h1 className="text-lg font-heading font-bold">Wallet</h1>
      </div>

      <main className="container py-6 md:py-10 max-w-3xl">
        <div className="hidden md:flex items-center gap-4 mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-heading font-bold">My Wallet</h1>
            <p className="text-muted-foreground">Top up and pay for services or parts</p>
          </div>
        </div>

        {/* Balance card */}
        <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl p-6 shadow-card mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 opacity-90">
              <WalletIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Available Balance</span>
            </div>
            {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <p className="text-4xl font-heading font-bold mb-6">
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-lg opacity-80">ETB</span>
          </p>
          <div className="flex gap-3">
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="flex-1"><ArrowDownToLine className="w-4 h-4" /> Deposit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Deposit via Chapa</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Amount (ETB)</Label>
                    <Input type="number" min="10" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} placeholder="100" className="mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">Minimum 10 ETB. You will be redirected to Chapa to complete payment.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[100, 500, 1000, 5000].map((v) => (
                      <Button key={v} type="button" size="sm" variant="outline" onClick={() => setDepositAmt(String(v))}>{v} ETB</Button>
                    ))}
                  </div>
                  <Button className="w-full" onClick={startDeposit} disabled={depositing}>
                    {depositing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                    Continue to Chapa
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 bg-background/10 border-primary-foreground/30 text-primary-foreground hover:bg-background/20 hover:text-primary-foreground">
                  <ArrowUpFromLine className="w-4 h-4" /> Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Request Payout</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Amount (ETB)</Label>
                    <Input type="number" value={wAmt} onChange={(e) => setWAmt(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Bank Name</Label>
                    <Input value={wBank} onChange={(e) => setWBank(e.target.value)} placeholder="CBE, Awash, etc." className="mt-1" />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input value={wAccNum} onChange={(e) => setWAccNum(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Account Name</Label>
                    <Input value={wAccName} onChange={(e) => setWAccName(e.target.value)} className="mt-1" />
                  </div>
                  <p className="text-xs text-muted-foreground">An admin will review and process your payout within 1-3 business days.</p>
                  <Button className="w-full" onClick={requestPayout} disabled={submittingPayout}>
                    {submittingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpFromLine className="w-4 h-4" />}
                    Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Transactions */}
        <div>
          <h2 className="text-lg font-heading font-semibold mb-3">Recent Transactions</h2>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-card animate-pulse rounded-xl" />)}</div>
          ) : txs.length === 0 ? (
            <div className="bg-card rounded-xl p-10 text-center text-muted-foreground">
              <WalletIcon className="w-12 h-12 mx-auto opacity-30 mb-3" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl divide-y border">
              {txs.map((t) => (
                <div key={t.id} className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">{txIcon(t.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description || t.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold ${["deposit","credit","refund"].includes(t.type) ? "text-green-600" : "text-destructive"}`}>
                      {sign(t.type)}{Number(t.amount).toLocaleString()} ETB
                    </p>
                    {t.status !== "success" && (
                      <Badge variant="outline" className="text-[10px] mt-0.5">{t.status}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Wallet;