import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet as WalletIcon, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  variant?: "pill" | "bar";
  className?: string;
}

const formatBalance = (n: number) =>
  `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;

const WalletBalance = ({ variant = "pill", className = "" }: Props) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      setBalance(Number(data?.balance || 0));
      setLoaded(true);
    };
    load();
    const i = setInterval(load, 20000);
    return () => clearInterval(i);
  }, [user]);

  if (!user) return null;

  const display = visible ? formatBalance(balance) : "••••••";

  if (variant === "bar") {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-4 py-3 shadow-md ${className}`}
      >
        <Link to="/wallet" className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
            <WalletIcon className="w-4.5 h-4.5 text-primary-foreground w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70 leading-none">
              Wallet Balance
            </p>
            <p className="font-heading font-bold text-base text-primary-foreground leading-tight mt-0.5 tabular-nums">
              {loaded || visible ? display : "••••••"}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setVisible((v) => !v);
          }}
          aria-label={visible ? "Hide balance" : "Show balance"}
          className="w-9 h-9 rounded-xl bg-primary-foreground/15 hover:bg-primary-foreground/25 flex items-center justify-center text-primary-foreground transition-colors shrink-0"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  // Pill (desktop/tablet header)
  return (
    <div
      className={`flex items-center gap-1.5 h-9 pl-2.5 pr-1.5 rounded-full border border-border bg-card hover:bg-muted/60 transition-colors ${className}`}
    >
      <Link to="/wallet" className="flex items-center gap-1.5">
        <WalletIcon className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {display}
        </span>
      </Link>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide balance" : "Show balance"}
        className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
      >
        {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

export default WalletBalance;