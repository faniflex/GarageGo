import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ClipboardList, MessageSquare, XCircle, ArrowLeft, Package } from "lucide-react";

interface Order {
  id: string;
  garage_id: string;
  service_requested: string;
  status: string;
  notes: string | null;
  conversation_id: string | null;
  created_at: string;
  amount?: number;
  payment_status?: string;
  garageName?: string;
  garageAddress?: string;
}

interface PartOrder {
  id: string;
  spare_part_id: string;
  quantity: number;
  amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  partName?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  accepted: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const MyOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [partOrders, setPartOrders] = useState<PartOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    const [{ data, error }, { data: pData }] = await Promise.all([
      supabase
      .from("orders")
      .select("*")
      .eq("customer_id", user!.id)
      .order("created_at", { ascending: false }),
      supabase
      .from("part_orders")
      .select("*")
      .eq("buyer_id", user!.id)
      .order("created_at", { ascending: false }),
    ]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const rawOrders = (data as Order[]) || [];
    const garageIds = [...new Set(rawOrders.map((o) => o.garage_id))];
    const { data: garages } = await supabase
      .from("garages")
      .select("id, name, address")
      .in("id", garageIds);

    const garageMap: Record<string, { name: string; address: string }> = {};
    (garages || []).forEach((g: any) => {
      garageMap[g.id] = { name: g.name, address: g.address };
    });

    setOrders(
      rawOrders.map((o) => ({
        ...o,
        garageName: garageMap[o.garage_id]?.name || "Garage",
        garageAddress: garageMap[o.garage_id]?.address || "",
      }))
    );

    const pos = (pData as PartOrder[]) || [];
    if (pos.length > 0) {
      const partIds = [...new Set(pos.map(p => p.spare_part_id))];
      const { data: parts } = await supabase.from("spare_parts").select("id, name").in("id", partIds);
      const map: Record<string, string> = {};
      (parts || []).forEach((p: any) => { map[p.id] = p.name; });
      setPartOrders(pos.map(p => ({ ...p, partName: map[p.spare_part_id] || "Part" })));
    } else {
      setPartOrders([]);
    }
    setLoading(false);
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Order cancelled" });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b px-4 h-14 flex items-center gap-3">
        <h1 className="text-lg font-heading font-bold">My Orders</h1>
      </div>

      <main className="container py-6 md:py-10">
        {/* Desktop heading */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track your service bookings</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-lg font-semibold mb-1">No orders yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Book a service at a garage to get started
            </p>
            <Button asChild>
              <Link to="/garages">Find Garages</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{order.service_requested}</p>
                    <p className="text-sm text-muted-foreground truncate">{order.garageName}</p>
                    {order.garageAddress && (
                      <p className="text-xs text-muted-foreground/70 truncate">{order.garageAddress}</p>
                    )}
                    {order.amount ? <p className="text-sm font-semibold text-primary mt-1">{Number(order.amount).toLocaleString()} ETB</p> : null}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={`shrink-0 text-xs border ${statusColors[order.status] || ""}`} variant="outline">
                      {order.status.replace("_", " ")}
                    </Badge>
                    {order.payment_status && (
                      <Badge variant="outline" className="text-[10px]">{order.payment_status}</Badge>
                    )}
                  </div>
                </div>

                {order.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-3">
                    {order.notes}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => cancelOrder(order.id)}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </Button>
                    )}
                    {order.conversation_id && (
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => navigate(`/chat?id=${order.conversation_id}`)}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Part orders */}
        {partOrders.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" /> Spare Part Orders
            </h2>
            <div className="space-y-3">
              {partOrders.map((po) => (
                <div key={po.id} className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{po.partName}</p>
                      <p className="text-xs text-muted-foreground">Qty: {po.quantity}</p>
                      <p className="text-sm font-semibold text-primary mt-1">{Number(po.amount).toLocaleString()} ETB</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge className={`text-xs border ${statusColors[po.status] || ""}`} variant="outline">{po.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{po.payment_status}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(po.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyOrders;
