import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setReady(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      navigate("/auth");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-12 flex justify-center">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-4">
            <Car className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold mb-1">Set New Password</h1>
          <p className="text-muted-foreground mb-6">Enter your new password below</p>
          <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-card space-y-4">
            <div className="text-left">
              <Label htmlFor="password">New Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !ready}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
