import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, User, Lock, LogOut, Shield, Moon, Sun, Bell, Info, Loader2, Languages } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { setLanguage } from "@/i18n";

const Settings = () => {
  const { user, userRole, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "am" ? "am" : "en";

  const switchLang = () => {
    setLanguage(lang === "en" ? "am" : "en");
  };

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_url, full_name").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setAvatarUrl(data.avatar_url || null);
          setDisplayName(data.full_name || null);
        }
      });
  }, [user]);

  const initials = displayName
    ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset email sent!", description: "Check your email for the password reset link." });
    }
    setResetting(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const settingsSections = [
    {
      title: t("settings.account"),
      items: [
        {
          icon: User,
          label: t("settings.accountInfo"),
          description: t("settings.accountInfoDesc"),
          to: "/profile",
          chevron: true,
        },
        {
          icon: Lock,
          label: t("settings.changePassword"),
          description: t("settings.changePasswordDesc"),
          action: handleResetPassword,
          loading: resetting,
          chevron: true,
        },
      ],
    },
    {
      title: t("settings.general"),
      items: [
        {
          icon: Languages,
          label: t("settings.language"),
          description: lang === "en" ? "English" : "አማርኛ",
          action: switchLang,
          chevron: true,
        },
        {
          icon: theme === "dark" ? Sun : Moon,
          label: t("settings.appearance"),
          description: theme === "dark" ? t("settings.darkMode") : t("settings.lightMode"),
          action: toggleTheme,
          chevron: true,
        },
        {
          icon: Bell,
          label: t("settings.notifications"),
          description: t("settings.notificationsDesc"),
          chevron: true,
          disabled: true,
        },
      ],
    },
    {
      title: t("settings.about"),
      items: [
        {
          icon: Info,
          label: t("settings.aboutApp"),
          description: t("settings.aboutAppDesc"),
          chevron: false,
          disabled: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b px-4 h-14 flex items-center">
        <h1 className="text-lg font-heading font-bold">Settings</h1>
      </div>

      <main className="container py-6 max-w-lg md:py-10">
        {/* Desktop heading */}
        <h1 className="hidden md:block text-3xl font-heading font-bold mb-8">Settings</h1>

        {/* Profile card */}
        {user && (
          <Link to="/profile" className="block mb-6">
            <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 active:opacity-80 transition-opacity">
              <Avatar className="w-16 h-16 border-2 border-primary/20 shrink-0">
                <AvatarImage src={avatarUrl || undefined} alt={displayName || user.email || ""} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-lg truncate">{displayName || "Set your name"}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <p className="text-xs text-primary capitalize mt-0.5">{userRole || "User"}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
          </Link>
        )}

        {/* Settings sections */}
        <div className="space-y-5">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">{section.title}</p>
              <div className="bg-card rounded-2xl shadow-card overflow-hidden divide-y divide-border">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <div className={`flex items-center gap-3 px-4 py-3.5 ${item.disabled ? "opacity-50" : "active:bg-muted transition-colors"}`}>
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4.5 h-4.5 text-primary w-[18px] h-[18px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      {item.loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : item.chevron ? (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : null}
                    </div>
                  );

                  if (item.to) {
                    return <Link key={item.label} to={item.to}>{content}</Link>;
                  }
                  if (item.action) {
                    return <button key={item.label} onClick={item.action} disabled={item.disabled || item.loading} className="w-full text-left">{content}</button>;
                  }
                  return <div key={item.label}>{content}</div>;
                })}
              </div>
            </div>
          ))}

          {/* Sign out */}
          <div>
            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted transition-colors text-destructive"
              >
                <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <LogOut className="w-[18px] h-[18px] text-destructive" />
                </div>
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
