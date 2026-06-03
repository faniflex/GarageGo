import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Save } from "lucide-react";

const Profile = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setLocation(data.location || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from("images").upload(path, file, { upsert: true });
    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
    const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    if (dbErr) {
      toast({ title: "Error saving avatar", description: dbErr.message, variant: "destructive" });
    } else {
      setAvatarUrl(publicUrl + "?t=" + Date.now());
      toast({ title: "Profile picture updated!" });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, location, bio })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
    setSaving(false);
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="container py-10 max-w-lg">
        <div className="flex items-center gap-4 mb-8">
          {/* Avatar upload */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="w-20 h-20 border-4 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt={fullName} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">My Profile</h1>
            <p className="text-sm text-muted-foreground capitalize">{userRole || "User"}</p>
            <p className="text-xs text-primary mt-0.5 cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
              Change photo
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
          </div>
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 9X XXX XXXX" />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Addis Ababa" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
