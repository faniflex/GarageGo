import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
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
          {sent ? (
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h1 className="text-2xl font-heading font-bold mb-2">Check Your Email</h1>
              <p className="text-muted-foreground">We've sent a password reset link to <strong>{email}</strong>.</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-heading font-bold mb-1">Forgot Password</h1>
              <p className="text-muted-foreground mb-6">Enter your email and we'll send a reset link</p>
              <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-card space-y-4">
                <div className="text-left">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
