import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car, Menu, X, LogOut, Shield, MessageSquare, ShoppingCart, Settings as SettingsIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import WalletBalance from "@/components/WalletBalance";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut, userRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const { t } = useTranslation();

  const navLinks = [
    { label: t("nav.home"), path: "/" },
    { label: t("nav.garages"), path: "/garages" },
    { label: t("nav.parts"), path: "/spare-parts" },
  ];

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const [{ count: unread }, { count: cart }, { data: profile }] = await Promise.all([
        supabase.from("messages").select("*", { count: "exact", head: true }).neq("sender_id", user.id).eq("read", false),
        supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("avatar_url, full_name").eq("user_id", user.id).single(),
      ]);
      setUnreadCount(unread || 0);
      setCartCount(cart || 0);
      if (profile) {
        setAvatarUrl(profile.avatar_url || null);
        setDisplayName(profile.full_name || null);
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const initials = displayName
    ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl">
          <div className="w-9 h-9 rounded-lg bg-hero-gradient flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>Garage-Go</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {userRole === "admin" && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin"><Shield className="w-4 h-4" /> Admin</Link>
                </Button>
              )}
              {/* Wallet pill — tablet & desktop */}
              <div className="flex">
                <WalletBalance variant="pill" />
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/chat" className="relative">
                  <MessageSquare className="w-4 h-4" /> {t("nav.chat")}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/cart" className="relative">
                  <ShoppingCart className="w-4 h-4" /> {t("nav.cart")}
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="hidden lg:inline-flex">
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
              {/* Profile — desktop only */}
              <Link to="/profile" className="hidden lg:flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="w-8 h-8 border-2 border-primary/20">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName || user.email || ""} />
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium max-w-[100px] truncate">{displayName || user.email}</span>
              </Link>
              {/* Settings replaces sign-out on all md+ */}
              <Button variant="ghost" size="icon" asChild aria-label="Settings">
                <Link to="/settings"><SettingsIcon className="w-4 h-4" /></Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">Log In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card animate-fade-in">
          <div className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  Profile
                </Link>
                <Link to="/cart" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Cart {cartCount > 0 && `(${cartCount})`}
                </Link>
                <Link to="/chat" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Messages {unreadCount > 0 && `(${unreadCount})`}
                </Link>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
                  Dashboard
                </Link>
              </>
            )}
            <div className="flex gap-2 mt-2">
              {user ? (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { signOut(); setMobileOpen(false); }}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              ) : (
                <Button size="sm" className="flex-1" asChild>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Sign In / Sign Up</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
