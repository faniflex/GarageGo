import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Trash2, MessageSquare, Loader2, ArrowRight, Wallet as WalletIcon } from "lucide-react";

interface CartItem {
  id: string;
  user_id: string;
  spare_part_id: string;
  quantity: number;
  created_at: string;
  part?: {
    id: string;
    name: string;
    price: number;
    condition: string;
    image_url: string | null;
    seller_id: string;
    location: string | null;
    car_model: string | null;
  };
}

const Cart = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchCart();
    supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setBalance(Number(data?.balance || 0)));
  }, [user]);

  const fetchCart = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    const items = (data || []) as CartItem[];

    if (items.length > 0) {
      const partIds = items.map((i) => i.spare_part_id);
      const { data: parts } = await supabase
        .from("spare_parts")
        .select("id, name, price, condition, image_url, seller_id, location, car_model")
        .in("id", partIds);

      const partMap: Record<string, any> = {};
      (parts || []).forEach((p) => { partMap[p.id] = p; });
      setCartItems(items.map((i) => ({ ...i, part: partMap[i.spare_part_id] })));
    } else {
      setCartItems([]);
    }
    setLoading(false);
  };

  const removeItem = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Removed from cart" });
  };

  const contactSeller = async (item: CartItem) => {
    if (!user || !item.part) return;
    setContactingId(item.id);

    // Find or create conversation with seller about this part
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(participant_one.eq.${user.id},participant_two.eq.${item.part.seller_id}),and(participant_one.eq.${item.part.seller_id},participant_two.eq.${user.id})`)
      .eq("spare_part_id", item.spare_part_id)
      .maybeSingle();

    if (existing) {
      navigate(`/chat?id=${existing.id}`);
    } else {
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          participant_one: user.id,
          participant_two: item.part.seller_id,
          spare_part_id: item.spare_part_id,
        })
        .select("id")
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        // Send an initial message with the part details
        await supabase.from("messages").insert({
          conversation_id: newConv.id,
          sender_id: user.id,
          content: `Hi! I'm interested in purchasing: ${item.part.name} — ${Number(item.part.price).toLocaleString()} ETB (${item.part.condition})`,
        });
        navigate(`/chat?id=${newConv.id}`);
      }
    }
    setContactingId(null);
  };

  const total = cartItems.reduce((sum, i) => sum + (i.part ? Number(i.part.price) * i.quantity : 0), 0);

  const checkout = async () => {
    if (!user) return;
    if (cartItems.length === 0) return;
    if (total > balance) {
      toast({ title: "Insufficient wallet balance", description: `You need ${total.toLocaleString()} ETB. Top up first.`, variant: "destructive" });
      navigate("/wallet");
      return;
    }
    setPaying(true);
    const orderIds: string[] = [];
    try {
      for (const item of cartItems) {
        if (!item.part) continue;
        const amount = Number(item.part.price) * item.quantity;

        // Create part_order
        const { data: order, error: orderErr } = await supabase
          .from("part_orders")
          .insert({
            buyer_id: user.id,
            seller_id: item.part.seller_id,
            spare_part_id: item.spare_part_id,
            quantity: item.quantity,
            amount,
            status: "pending",
            payment_status: "paid",
          })
          .select("id")
          .single();
        if (orderErr) throw orderErr;
        orderIds.push(order.id);

        // Move money buyer -> seller (3% platform fee deducted from seller)
        const { data: pay, error: payErr } = await supabase.rpc("process_wallet_payment", {
          _buyer_id: user.id,
          _seller_id: item.part.seller_id,
          _amount: amount,
          _order_id: order.id,
          _description: `Purchase: ${item.part.name}`,
          _fee_bps: 300,
        });
        if (payErr) throw payErr;
        const pr = pay as any;
        if (!pr?.success) {
          throw new Error(pr?.error === "insufficient_balance" ? "Insufficient wallet balance" : pr?.error || "Payment failed");
        }

        // Remove from cart
        await supabase.from("cart_items").delete().eq("id", item.id);
      }
      toast({ title: "Payment successful", description: "Your orders have been placed." });
      if (orderIds.length === 1) {
        navigate(`/receipt/${orderIds[0]}?type=part`);
      } else {
        navigate("/my-orders");
      }
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    }
    setPaying(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-heading font-bold">My Cart</h1>
          <span className="text-muted-foreground">({cartItems.length} items)</span>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center text-muted-foreground">
            <ShoppingCart className="w-14 h-14 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Your cart is empty</p>
            <p className="text-sm mb-6">Browse spare parts and add items to your cart</p>
            <Button onClick={() => navigate("/spare-parts")}>
              Browse Spare Parts <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-card rounded-xl p-5 shadow-card flex gap-4">
                {item.part?.image_url ? (
                  <img src={item.part.image_url} alt={item.part?.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground opacity-40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold">{item.part?.name || "Part"}</h3>
                  <p className="text-xs text-muted-foreground">{item.part?.condition} · {item.part?.car_model}</p>
                  <p className="text-xs text-muted-foreground">{item.part?.location}</p>
                  <p className="text-lg font-bold text-primary mt-1">
                    {(Number(item.part?.price || 0) * item.quantity).toLocaleString()} ETB
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => contactSeller(item)}
                    disabled={contactingId === item.id}
                  >
                    {contactingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    Contact Seller
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => removeItem(item.id)}>
                    <Trash2 className="w-4 h-4" /> Remove
                  </Button>
                </div>
              </div>
            ))}

            <div className="bg-card rounded-xl p-5 shadow-card flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total ({cartItems.length} items)</p>
                <p className="text-2xl font-heading font-bold text-primary">{total.toLocaleString()} ETB</p>
                <p className="text-xs text-muted-foreground mt-1">Wallet balance: {balance.toLocaleString()} ETB</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={checkout} disabled={paying || cartItems.length === 0}>
                  {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <WalletIcon className="w-4 h-4" />}
                  Pay with Wallet
                </Button>
                <Button onClick={() => navigate("/spare-parts")} variant="outline" size="sm">
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
