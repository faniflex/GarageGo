import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Lock, Loader2, Clock, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  garageId: string;
  ownerId: string;
  phone: string | null;
}

type ConnectState = "none" | "pending" | "accepted" | "rejected";

const maskPhone = (phone: string | null) => {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return phone.slice(0, 4) + " *** ****";
};

const GarageConnectButton = ({ garageId, ownerId, phone }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [state, setState] = useState<ConnectState>("none");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const refresh = async () => {
    if (!user) { setChecking(false); return; }
    if (user.id === ownerId) { setState("accepted"); setChecking(false); return; }
    const { data } = await supabase
      .from("garage_connects")
      .select("status")
      .eq("user_id", user.id)
      .eq("garage_id", garageId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setState((data?.status as ConnectState) || "none");
    setChecking(false);
  };

  useEffect(() => { refresh(); }, [user, garageId]);

  const request = async () => {
    if (!user) { navigate("/auth"); return; }
    setLoading(true);
    const { data, error } = await supabase.rpc("request_garage_connect", { _garage_id: garageId });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const r = data as any;
    if (!r?.success) {
      if (r?.error === "insufficient_balance") {
        toast({ title: "Insufficient balance", description: "Top up at least 10 ETB to unlock.", variant: "destructive" });
        navigate("/wallet");
      } else {
        toast({ title: "Error", description: r?.error || "Failed", variant: "destructive" });
      }
      return;
    }
    toast({ title: "Request sent", description: "Awaiting mechanic acceptance." });
    refresh();
  };

  if (checking) return null;

  if (state === "accepted") {
    return (
      <div className="space-y-2">
        <a
          href={phone ? `tel:${phone}` : "#"}
          className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <Phone className="w-4 h-4" /> {phone || "—"}
        </a>
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            if (!user) return;
            const { data: existing } = await supabase
              .from("conversations")
              .select("id")
              .or(`and(participant_one.eq.${user.id},participant_two.eq.${ownerId}),and(participant_one.eq.${ownerId},participant_two.eq.${user.id})`)
              .eq("garage_id", garageId)
              .maybeSingle();
            if (existing) {
              navigate(`/chat?id=${existing.id}`);
              return;
            }
            const { data: newConv, error } = await supabase
              .from("conversations")
              .insert({ participant_one: user.id, participant_two: ownerId, garage_id: garageId })
              .select("id")
              .single();
            if (error) {
              toast({ title: "Error", description: error.message, variant: "destructive" });
            } else {
              navigate(`/chat?id=${newConv.id}`);
            }
          }}
        >
          <MessageSquare className="w-4 h-4" /> Message Garage
        </Button>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" /> {maskPhone(phone)}
        </div>
        <Button variant="outline" className="w-full" disabled>
          <Clock className="w-4 h-4" /> Awaiting mechanic acceptance...
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="w-4 h-4" /> {maskPhone(phone)}
      </div>
      <Button onClick={request} disabled={loading} variant="default" className="w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
        Unlock contact — 10 ETB
      </Button>
      {state === "rejected" && (
        <p className="text-xs text-destructive">Previous request was rejected (refunded). You can try again.</p>
      )}
    </div>
  );
};

export default GarageConnectButton;