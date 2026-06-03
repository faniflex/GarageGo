import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Mail, Lock, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const roleOptions = [
  { value: "car_owner", label: "Car Owner", desc: "Find garages and buy parts" },
  { value: "mechanic", label: "Mechanic / Garage", desc: "List your garage and services" },
  { value: "seller", label: "Spare Part Seller", desc: "Sell spare parts online" },
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("car_owner");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've signed in successfully." });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, phone, role },
          },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account before signing in.",
        });
      }
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
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-4">
              <Car className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold">
              {isLogin ? "Welcome Back" : "Join Garage-Go"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLogin ? "Sign in to your account" : "Create your account to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-card space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+251 9X XXX XXXX"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {roleOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setRole(opt.value)}
                        className={`text-left p-3 rounded-lg border-2 transition-colors ${
                          role === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
