import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationMap from "@/components/LocationMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Star, Phone, ShieldCheck, ArrowLeft, Loader2, Send, MessageSquare, ClipboardList, Wifi, WifiOff, Clock, ChevronLeft, ChevronRight, Wallet as WalletIcon } from "lucide-react";
import GarageConnectButton from "@/components/ConnectButton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GarageData {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  services: string[] | null;
  description: string | null;
  image_url: string | null;
  verified: boolean | null;
  rating: number | null;
  review_count: number | null;
  owner_id: string;
  latitude: number | null;
  longitude: number | null;
  mechanic_status: string | null;
}

interface GarageImage {
  url: string;
  position: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
}

const mechStatusConfig = {
  available: { label: "Available", icon: Wifi, color: "text-green-500", bg: "bg-green-500/20 border-green-500/30" },
  busy: { label: "Busy", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/20 border-yellow-500/30" },
  offline: { label: "Offline", icon: WifiOff, color: "text-muted-foreground", bg: "bg-muted border-border" },
};

const GarageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [garage, setGarage] = useState<GarageData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Book service dialog
  const [bookOpen, setBookOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [bookNotes, setBookNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [priceList, setPriceList] = useState<{ id: string; name: string; price: number }[]>([]);
  const [bookPrice, setBookPrice] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    const fetchGarage = async () => {
      const [{ data }, { data: revs }, { data: imgs }, { data: services }] = await Promise.all([
        supabase.from("garages").select("*").eq("id", id).single(),
        supabase.from("reviews").select("*").eq("garage_id", id).order("created_at", { ascending: false }),
        supabase.from("garage_images").select("url, position").eq("garage_id", id).order("position"),
        supabase.from("garage_services").select("id, name, price").eq("garage_id", id),
      ]);
      setGarage(data as GarageData | null);
      setReviews((revs as Review[]) || []);
      setPriceList((services as any) || []);
      const sortedImgs = (imgs as GarageImage[] || []).sort((a, b) => a.position - b.position).map(i => i.url);
      if (sortedImgs.length > 0) {
        setGalleryImages(sortedImgs);
      } else if (data?.image_url) {
        setGalleryImages([data.image_url]);
      } else {
        setGalleryImages(["https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=400&fit=crop"]);
      }
      setLoading(false);
    };
    fetchGarage();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setWalletBalance(Number(data?.balance || 0)));
  }, [user, bookOpen]);

  // When picking a known service, autofill price
  useEffect(() => {
    const match = priceList.find((s) => s.name === selectedService);
    if (match) setBookPrice(String(match.price));
  }, [selectedService, priceList]);

  const submitReview = async () => {
    if (!user || !id) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({ garage_id: id, reviewer_id: user.id, rating: newRating, comment: newComment || null });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted!" });
      setNewComment("");
      setNewRating(5);
      const { data: revs } = await supabase.from("reviews").select("*").eq("garage_id", id).order("created_at", { ascending: false });
      setReviews((revs as Review[]) || []);
    }
    setSubmitting(false);
  };

  const bookService = async () => {
    if (!user || !garage || !selectedService) return;
    const amount = Number(bookPrice);
    if (!amount || amount <= 0) {
      toast({ title: "Enter a price", description: "Service price is required to charge your wallet.", variant: "destructive" });
      return;
    }
    if (amount > walletBalance) {
      toast({ title: "Insufficient wallet balance", description: `You need ${amount.toLocaleString()} ETB. Top up first.`, variant: "destructive" });
      navigate("/wallet");
      return;
    }
    setBooking(true);

    try {
      // Create or find conversation with mechanic
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_one.eq.${user.id},participant_two.eq.${garage.owner_id}),and(participant_one.eq.${garage.owner_id},participant_two.eq.${user.id})`)
        .eq("garage_id", garage.id)
        .maybeSingle();

      let convId: string;
      if (existing) {
        convId = existing.id;
      } else {
        const { data: newConv, error: convErr } = await supabase
          .from("conversations")
          .insert({ participant_one: user.id, participant_two: garage.owner_id, garage_id: garage.id })
          .select("id").single();
        if (convErr) throw convErr;
        convId = newConv.id;
      }

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          garage_id: garage.id,
          customer_id: user.id,
          mechanic_id: garage.owner_id,
          service_requested: selectedService,
          notes: bookNotes || null,
          conversation_id: convId,
          amount,
          payment_status: "paid",
        })
        .select("id").single();
      if (orderErr) throw orderErr;

      // Charge wallet
      const { data: pay, error: payErr } = await supabase.rpc("process_wallet_payment", {
        _buyer_id: user.id,
        _seller_id: garage.owner_id,
        _amount: amount,
        _order_id: order.id,
        _description: `Service: ${selectedService} @ ${garage.name}`,
      });
      if (payErr) throw payErr;
      const pr = pay as any;
      if (!pr?.success) {
        // rollback order
        await supabase.from("orders").update({ status: "cancelled", payment_status: "unpaid" }).eq("id", order.id);
        throw new Error(pr?.error || "Payment failed");
      }

      // Send a system message in the conversation
      await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        content: `🔧 Service Booking (paid)\n\nService: ${selectedService}\nAmount: ${amount.toLocaleString()} ETB\nGarage: ${garage.name}${bookNotes ? `\nNotes: ${bookNotes}` : ""}`,
      });

      toast({ title: "Service booked & paid", description: "Redirecting to chat..." });
      setBookOpen(false);
      navigate(`/receipt/${order.id}?type=service`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setBooking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-20 text-center">
          <p className="text-lg text-muted-foreground">Garage not found.</p>
          <Button asChild className="mt-4"><Link to="/garages">Back to Garages</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const statusCfg = mechStatusConfig[garage.mechanic_status as keyof typeof mechStatusConfig] || mechStatusConfig.available;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b px-4 h-14 flex items-center gap-3">
        <Link to="/garages" className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base font-heading font-bold line-clamp-1">{garage.name}</h1>
      </div>

      <main className="container py-4 md:py-10">
        <Link to="/garages" className="hidden md:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Garages
        </Link>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-5 md:space-y-6">
            {/* Image Gallery */}
            <div className="relative rounded-xl overflow-hidden">
              <div className="h-52 md:h-80">
                <img
                  src={galleryImages[activeImg]}
                  alt={`${garage.name} - photo ${activeImg + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveImg((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                    {galleryImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImg ? "bg-white scale-125" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                  {/* Thumbnail strip */}
                  <div className="flex gap-2 overflow-x-auto p-2 bg-black/10">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`shrink-0 w-14 h-10 md:w-20 md:h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-3xl font-heading font-bold">{garage.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" /> {garage.address}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {garage.verified && (
                    <Badge className="bg-primary text-primary-foreground">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                  <Badge className={`border ${statusCfg.bg} ${statusCfg.color} flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 text-accent">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-bold text-lg">{garage.rating || 0}</span>
                </div>
                <span className="text-sm text-muted-foreground">({garage.review_count || 0} reviews)</span>
              </div>

              {garage.description && <p className="mt-4 text-muted-foreground leading-relaxed">{garage.description}</p>}

              <div className="flex flex-wrap gap-2 mt-4">
                {(garage.services || []).map((s) => (<Badge key={s} variant="secondary">{s}</Badge>))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-xl font-heading font-semibold mb-4">Reviews</h2>
              {user && (
                <div className="bg-card rounded-xl p-5 shadow-card mb-6 space-y-3">
                  <p className="font-medium text-sm">Leave a review</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setNewRating(n)} type="button">
                        <Star className={`w-6 h-6 transition-colors ${n <= newRating ? "text-accent fill-current" : "text-muted"}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Share your experience..." rows={3} />
                  <Button onClick={submitReview} disabled={submitting} size="sm">
                    <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              )}
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-card rounded-xl p-4 shadow-card">
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((n) => (<Star key={n} className={`w-4 h-4 ${n <= r.rating ? "text-accent fill-current" : "text-muted"}`} />))}
                      </div>
                      {r.comment && <p className="text-sm">{r.comment}</p>}
                      <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {garage.latitude && garage.longitude && (
              <div className="bg-card rounded-xl p-5 shadow-card">
                <h3 className="font-heading font-semibold mb-3">Location</h3>
                <LocationMap latitude={garage.latitude} longitude={garage.longitude} name={garage.name} />
              </div>
            )}

            <div className="bg-card rounded-xl p-5 shadow-card space-y-3">
              <h3 className="font-heading font-semibold">Contact & Booking</h3>
              <GarageConnectButton garageId={garage.id} ownerId={garage.owner_id} phone={garage.phone} />

              {user && user.id !== garage.owner_id && (
                <>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => setBookOpen(true)}
                    disabled={garage.mechanic_status === "offline"}
                  >
                    <ClipboardList className="w-4 h-4" />
                    {garage.mechanic_status === "offline" ? "Currently Offline" : "Book Service"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Book Service Dialog */}
      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Service at {garage.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Service *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(priceList.length > 0 ? priceList.map(p => p.name) : (garage.services || [])).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedService(s)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selectedService === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {priceList.length === 0 && (garage.services || []).length === 0 && (
                <input
                  className="w-full mt-2 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Enter service type..."
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                />
              )}
            </div>
            <div>
              <Label>Price (ETB) *</Label>
              <Input
                type="number"
                min="0"
                value={bookPrice}
                onChange={(e) => setBookPrice(e.target.value)}
                placeholder="Enter agreed price"
                className="mt-1"
                readOnly={!!priceList.find(p => p.name === selectedService)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Wallet balance: {walletBalance.toLocaleString()} ETB
                {Number(bookPrice) > walletBalance && (
                  <span className="text-destructive ml-1">— insufficient, <Link to="/wallet" className="underline">top up</Link></span>
                )}
              </p>
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={bookNotes}
                onChange={(e) => setBookNotes(e.target.value)}
                placeholder="Describe your issue or any additional details..."
                rows={3}
                className="mt-1"
              />
            </div>
            <Button
              className="w-full"
              onClick={bookService}
              disabled={booking || !selectedService || !bookPrice}
            >
              {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <WalletIcon className="w-4 h-4" />}
              {booking ? "Processing..." : `Pay ${Number(bookPrice || 0).toLocaleString()} ETB & Book`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GarageDetail;
