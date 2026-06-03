import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowLeft, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";

interface ReceiptData {
  id: string;
  amount: number;
  date: string;
  buyerName: string;
  sellerName: string;
  itemName: string;
  type: "part" | "service";
  fee?: number;
  netToSeller?: number;
}

const Receipt = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [params] = useSearchParams();
  const type = (params.get("type") as "part" | "service") || "part";
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || !orderId) return;
    (async () => {
      const table = type === "part" ? "part_orders" : "orders";
      const { data: order } = await supabase.from(table).select("*").eq("id", orderId).maybeSingle();
      if (!order) { setLoading(false); return; }
      const buyerId = type === "part" ? (order as any).buyer_id : (order as any).customer_id;
      const sellerId = type === "part" ? (order as any).seller_id : (order as any).mechanic_id;

      const [{ data: buyer }, { data: seller }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", buyerId).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("user_id", sellerId).maybeSingle(),
      ]);

      let itemName = "";
      if (type === "part") {
        const { data: p } = await supabase.from("spare_parts").select("name").eq("id", (order as any).spare_part_id).maybeSingle();
        itemName = p?.name || "Spare Part";
      } else {
        itemName = (order as any).service_requested || "Service";
      }

      // Fee from wallet_transactions
      const { data: fees } = await supabase
        .from("wallet_transactions")
        .select("amount")
        .eq("related_order_id", orderId)
        .eq("type", "service_fee");
      const fee = (fees || []).reduce((s, r) => s + Number(r.amount || 0), 0);

      setData({
        id: order.id,
        amount: Number(order.amount),
        date: order.created_at,
        buyerName: buyer?.full_name || "Customer",
        sellerName: seller?.full_name || (type === "part" ? "Seller" : "Mechanic"),
        itemName,
        type,
        fee: fee || undefined,
        netToSeller: fee ? Number(order.amount) - fee : undefined,
      });
      setLoading(false);
    })();
  }, [user, orderId, type]);

  const downloadPdf = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Garage-Go", 20, 25);
    doc.setFontSize(14);
    doc.text(t("receipt.title"), 20, 35);
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    doc.setFontSize(11);
    let y = 55;
    const row = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(label + ":", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 80, y);
      y += 9;
    };
    row(t("receipt.orderId"), data.id.slice(0, 8).toUpperCase());
    row(t("receipt.date"), new Date(data.date).toLocaleString());
    row(t("receipt.from"), data.buyerName);
    row(t("receipt.to"), data.sellerName);
    row(data.type === "part" ? t("receipt.item") : t("receipt.service"), data.itemName);
    row(t("receipt.amount"), `${data.amount.toLocaleString()} ETB`);
    if (data.fee) {
      row("Platform Fee (3%)", `${data.fee.toLocaleString()} ETB`);
      row("Seller Receives", `${(data.netToSeller || 0).toLocaleString()} ETB`);
    }

    doc.line(20, y + 5, 190, y + 5);
    doc.setFontSize(10);
    doc.text(t("receipt.thanks"), 20, y + 15);
    doc.save(`receipt-${data.id.slice(0, 8)}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p>Receipt not found.</p>
          <Button asChild><Link to="/my-orders">Back</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-md mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("common.back")}
        </Button>

        <div className="bg-card rounded-2xl shadow-card p-6 border">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-heading font-bold">{t("receipt.title")}</h1>
            <p className="text-sm text-muted-foreground">Garage-Go</p>
          </div>

          <div className="space-y-3 text-sm border-t border-b py-4 my-4">
            <Row label={t("receipt.orderId")} value={data.id.slice(0, 8).toUpperCase()} />
            <Row label={t("receipt.date")} value={new Date(data.date).toLocaleString()} />
            <Row label={t("receipt.from")} value={data.buyerName} />
            <Row label={t("receipt.to")} value={data.sellerName} />
            <Row label={data.type === "part" ? t("receipt.item") : t("receipt.service")} value={data.itemName} />
            <Row label={t("receipt.amount")} value={`${data.amount.toLocaleString()} ETB`} bold />
            {data.fee && (
              <>
                <Row label="Platform Fee (3%)" value={`${data.fee.toLocaleString()} ETB`} muted />
                <Row label="Seller Receives" value={`${(data.netToSeller || 0).toLocaleString()} ETB`} muted />
              </>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground mb-4">{t("receipt.thanks")}</p>

          <Button onClick={downloadPdf} className="w-full">
            <Download className="w-4 h-4" /> {t("receipt.download")}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) => (
  <div className="flex justify-between gap-3">
    <span className={muted ? "text-muted-foreground" : "text-muted-foreground"}>{label}</span>
    <span className={`text-right ${bold ? "font-bold text-primary text-base" : ""} ${muted ? "text-muted-foreground" : ""}`}>{value}</span>
  </div>
);

export default Receipt;