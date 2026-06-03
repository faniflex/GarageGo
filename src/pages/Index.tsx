import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import GarageCard from "@/components/GarageCard";
import SparePartCard from "@/components/SparePartCard";
import { garages as mockGarages, spareParts as mockSpareParts } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wrench, Package, ClipboardList, Zap, MessageSquare, ShoppingCart, Search, MapPin, Star, Shield, Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import WalletBalance from "@/components/WalletBalance";

interface MobileGarage {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  verified: boolean | null;
  mechanic_status: string;
  galleryImage?: string;
}

interface MobilePart {
  id: string;
  name: string;
  price: number;
  condition: string;
  car_model: string | null;
  rating: number | null;
  galleryImage?: string;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const quickActions = [
  { icon: Wrench, label: "Find Garage", to: "/garages", color: "bg-primary/10 text-primary" },
  { icon: Package, label: "Spare Parts", to: "/spare-parts", color: "bg-secondary/20 text-secondary-foreground" },
  { icon: ClipboardList, label: "My Orders", to: "/my-orders", color: "bg-accent/20 text-accent-foreground" },
  { icon: Zap, label: "Emergency", to: "/garages", color: "bg-destructive/10 text-destructive" },
  { icon: MessageSquare, label: "Messages", to: "/chat", color: "bg-primary/10 text-primary" },
  { icon: ShoppingCart, label: "Cart", to: "/cart", color: "bg-secondary/20 text-secondary-foreground" },
];

const stats = [
  { value: "500+", label: "Garages", icon: Wrench },
  { value: "10K+", label: "Parts", icon: Package },
  { value: "25K+", label: "Drivers", icon: Car },
];

const Index = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mobileGarages, setMobileGarages] = useState<MobileGarage[]>([]);
  const [mobileParts, setMobileParts] = useState<MobilePart[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);

  // Derive the dashboard/orders link by role
  const ordersLink = userRole === "car_owner" ? "/my-orders" : "/dashboard";

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setProfileName(data.full_name);
            setAvatarUrl(data.avatar_url);
          }
        });
      supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count }) => setCartCount(count || 0));
    }
  }, [user]);

  useEffect(() => {
    const fetchMobileData = async () => {
      // Fetch garages with first image
      const { data: garageData } = await supabase
        .from("garages")
        .select("id, name, address, rating, verified, mechanic_status, garage_images(url, position)")
        .order("rating", { ascending: false })
        .limit(8);

      if (garageData) {
        setMobileGarages(
          garageData.map((g: any) => ({
            id: g.id,
            name: g.name,
            address: g.address,
            rating: g.rating,
            verified: g.verified,
            mechanic_status: g.mechanic_status,
            galleryImage:
              g.garage_images?.sort((a: any, b: any) => a.position - b.position)[0]?.url ||
              undefined,
          }))
        );
      }

      // Fetch spare parts with first image
      const { data: partData } = await supabase
        .from("spare_parts")
        .select("id, name, price, condition, car_model, rating, spare_part_images(url, position)")
        .eq("available", true)
        .eq("sold", false)
        .order("created_at", { ascending: false })
        .limit(8);

      if (partData) {
        setMobileParts(
          partData.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            condition: p.condition,
            car_model: p.car_model,
            rating: p.rating,
            galleryImage:
              p.spare_part_images?.sort((a: any, b: any) => a.position - b.position)[0]?.url ||
              undefined,
          }))
        );
      }
    };

    fetchMobileData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/garages?search=${encodeURIComponent(searchQuery)}`);
  };

  const displayName = profileName || user?.email?.split("@")[0] || null;
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : "G";

  const statusColors: Record<string, string> = {
    available: "bg-green-500",
    busy: "bg-yellow-500",
    offline: "bg-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden md:block">
        <Navbar />
        <HeroSection />
        <FeaturesSection />

        {/* Top Garages Preview */}
        <section className="py-20">
          <div className="container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-heading font-bold mb-2">Top Rated Garages</h2>
                <p className="text-muted-foreground">Verified mechanics near you in Addis Ababa</p>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/garages">View All <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockGarages.slice(0, 3).map((garage) => (
                <GarageCard key={garage.id} garage={garage} />
              ))}
            </div>
          </div>
        </section>

        {/* Spare Parts Preview */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-heading font-bold mb-2">Latest Spare Parts</h2>
                <p className="text-muted-foreground">Genuine parts from trusted sellers</p>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/spare-parts">View All <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockSpareParts.slice(0, 3).map((part) => (
                <SparePartCard key={part.id} part={part} />
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* ===== MOBILE / TABLET LAYOUT ===== */}
      <div className="md:hidden flex flex-col min-h-screen bg-background">

        {/* Mobile Top Header */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Wrench className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-base text-foreground">Garage-Go</span>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    to="/cart"
                    aria-label="Cart"
                    className="relative w-9 h-9 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center"
                  >
                    <ShoppingCart className="w-4.5 h-4.5 text-foreground w-[18px] h-[18px]" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-bold">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile" aria-label="Profile">
                    <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </>
              ) : (
                <Button size="sm" variant="default" className="h-7 text-xs px-3" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Greeting Banner */}
          <div className="px-4 pt-5 pb-3">
            {user ? (
              <>
                <p className="text-muted-foreground text-sm">{getGreeting()},</p>
                <h1 className="font-heading font-bold text-xl text-foreground leading-tight">
                  {displayName || "Driver"} 👋
                </h1>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-sm">Welcome to</p>
                <h1 className="font-heading font-bold text-xl text-foreground leading-tight">
                  Garage-Go 🚗
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">Find garages & spare parts near you</p>
              </>
            )}
          </div>

          {/* Wallet bar (mobile, signed-in only) */}
          {user && (
            <div className="px-4 mb-4">
              <WalletBalance variant="bar" />
            </div>
          )}

          {/* Search Bar */}
          <div className="px-4 mb-5">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search garages, parts..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </form>
          </div>

          {/* Stats Strip */}
          <div className="mx-4 mb-5 rounded-xl bg-primary px-4 py-3 flex items-center justify-between">
            {stats.map((s, i) => (
              <div key={s.label} className={`flex flex-col items-center ${i !== 0 ? "border-l border-primary-foreground/20 pl-4" : ""}`}>
                <span className="font-heading font-bold text-lg text-primary-foreground leading-none">{s.value}</span>
                <span className="text-[10px] text-primary-foreground/70 mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions Grid */}
          <div className="px-4 mb-6">
            <h2 className="font-heading font-semibold text-sm text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                // Remap My Orders link based on role
                const href = action.label === "My Orders" ? ordersLink : action.to;
                return (
                  <Link
                    key={action.label}
                    to={href}
                    className="flex flex-col items-center gap-2 bg-card rounded-xl p-3 shadow-sm border border-border active:scale-95 transition-transform"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground text-center leading-tight">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Nearby Garages — Horizontal Scroll */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="font-heading font-semibold text-sm text-foreground">Nearby Garages</h2>
              <Link to="/garages" className="text-xs text-primary font-medium flex items-center gap-0.5">
                See All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
              {(mobileGarages.length > 0 ? mobileGarages : mockGarages.slice(0, 6).map(g => ({
                id: g.id, name: g.name, address: g.address, rating: g.rating,
                verified: g.verified ?? false, mechanic_status: "available", galleryImage: g.image,
              }))).map((garage) => (
                <Link
                  key={garage.id}
                  to={`/garages/${garage.id}`}
                  className="snap-start shrink-0 w-[150px] bg-card rounded-xl overflow-hidden border border-border shadow-sm active:scale-95 transition-transform"
                >
                  <div className="relative h-[90px] bg-muted overflow-hidden">
                    {garage.galleryImage ? (
                      <img src={garage.galleryImage} alt={garage.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Wrench className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                    )}
                    {garage.verified && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${statusColors[garage.mechanic_status] || "bg-muted-foreground"}`} />
                  </div>
                  <div className="p-2">
                    <p className="font-heading font-semibold text-xs text-foreground line-clamp-1">{garage.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{garage.address}</p>
                    {garage.rating != null && (
                      <div className="flex items-center gap-0.5 mt-1">
                        <Star className="w-2.5 h-2.5 fill-current text-accent" />
                        <span className="text-[10px] font-medium text-foreground">{Number(garage.rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {/* See all card */}
              <Link
                to="/garages"
                className="snap-start shrink-0 w-[80px] h-[150px] bg-muted rounded-xl flex flex-col items-center justify-center gap-1 border border-border text-muted-foreground active:scale-95 transition-transform"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="text-[10px] font-medium text-center leading-tight">View All</span>
              </Link>
            </div>
          </div>

          {/* Spare Parts — Horizontal Scroll */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="font-heading font-semibold text-sm text-foreground">Spare Parts</h2>
              <Link to="/spare-parts" className="text-xs text-primary font-medium flex items-center gap-0.5">
                See All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
              {(mobileParts.length > 0 ? mobileParts : mockSpareParts.slice(0, 6).map(p => ({
                id: p.id, name: p.name, price: p.price, condition: p.condition,
                car_model: p.carModel, rating: p.rating, galleryImage: p.image,
              }))).map((part) => (
                <Link
                  key={part.id}
                  to="/spare-parts"
                  className="snap-start shrink-0 w-[140px] bg-card rounded-xl overflow-hidden border border-border shadow-sm active:scale-95 transition-transform"
                >
                  <div className="relative h-[80px] bg-muted overflow-hidden">
                    {part.galleryImage ? (
                      <img src={part.galleryImage} alt={part.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Package className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                    )}
                    <Badge
                      className={`absolute top-1 right-1 text-[9px] px-1 py-0 ${part.condition === "New" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                    >
                      {part.condition}
                    </Badge>
                  </div>
                  <div className="p-2">
                    <p className="font-heading font-semibold text-xs text-foreground line-clamp-1">{part.name}</p>
                    {part.car_model && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{part.car_model}</p>
                    )}
                    <p className="text-xs font-bold text-primary mt-1">
                      {Number(part.price).toLocaleString()} <span className="text-[9px] font-normal">ETB</span>
                    </p>
                  </div>
                </Link>
              ))}
              {/* See all card */}
              <Link
                to="/spare-parts"
                className="snap-start shrink-0 w-[80px] h-[140px] bg-muted rounded-xl flex flex-col items-center justify-center gap-1 border border-border text-muted-foreground active:scale-95 transition-transform"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="text-[10px] font-medium text-center leading-tight">View All</span>
              </Link>
            </div>
          </div>

          {/* Features Strip */}
          <div className="px-4 mb-6">
            <h2 className="font-heading font-semibold text-sm text-foreground mb-3">Why Garage-Go?</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: MapPin, title: "GPS Finder", desc: "Locate nearest garages" },
                { icon: Shield, title: "Verified", desc: "Trusted providers only" },
                { icon: Star, title: "Reviews", desc: "Real ratings from owners" },
                { icon: Zap, title: "Emergency", desc: "Quick roadside help" },
              ].map((f) => {
                const FIcon = f.icon;
                return (
                  <div key={f.title} className="bg-card rounded-xl p-3 border border-border flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{f.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sign-in CTA for guests */}
          {!user && (
            <div className="mx-4 mb-6 rounded-xl bg-primary/10 border border-primary/20 p-4 flex flex-col gap-3">
              <div>
                <p className="font-heading font-semibold text-sm text-foreground">Get Started</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sign in to book services, manage orders, and more.</p>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link to="/auth">Sign In / Register</Link>
              </Button>
            </div>
          )}

          {/* Bottom padding for nav bar */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
};

export default Index;
