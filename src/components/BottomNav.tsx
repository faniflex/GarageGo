import { Link, useLocation } from "react-router-dom";
import { Home, Wrench, Package, LayoutDashboard, ClipboardList, MessageSquare, ShoppingCart, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const location = useLocation();
  const { user, userRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const { t } = useTranslation();

  // Hide bottom nav (and floating buttons) while inside a chat conversation on
  // mobile/tablet so the conversation has full screen real estate.
  const hideForChat = location.pathname.startsWith("/chat");

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const [{ count: unread }, { count: cart }] = await Promise.all([
        supabase.from("messages").select("*", { count: "exact", head: true }).neq("sender_id", user.id).eq("read", false),
        supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setUnreadCount(unread || 0);
      setCartCount(cart || 0);
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const dashboardPath = userRole === "car_owner" ? "/my-orders" : (user ? "/dashboard" : "/auth");
  const dashboardLabel = userRole === "car_owner" ? t("nav.myOrders") : t("nav.dashboard");
  const DashboardIcon = userRole === "car_owner" ? ClipboardList : LayoutDashboard;

  const navItems = [
    { path: "/", label: t("nav.home"), Icon: Home },
    { path: "/garages", label: t("nav.garages"), Icon: Wrench },
    { path: "/spare-parts", label: t("nav.parts"), Icon: Package },
    { path: dashboardPath, label: dashboardLabel, Icon: DashboardIcon },
    { path: "/chat", label: t("nav.chat"), Icon: MessageSquare },
    { path: "/settings", label: t("nav.settings"), Icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Bottom nav bar */}
      {hideForChat ? null : (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border h-16 flex items-stretch">
        {navItems.map(({ path, label, Icon }) => {
          const active = isActive(path);
          const badge =
            path === "/chat" ? unreadCount : path === "/cart" ? cartCount : 0;
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className={`relative w-10 h-7 flex items-center justify-center rounded-xl transition-all ${active ? "bg-primary/10" : ""}`}>
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                {badge > 0 && (
                  <span className="absolute -top-1 right-1 bg-destructive text-destructive-foreground text-[9px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-bold">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${active ? "text-primary" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </nav>
      )}
    </>
  );
};

export default BottomNav;
