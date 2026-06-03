import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, ShieldOff, Trash2, Loader2, FileText, Star, CheckCircle, XCircle, ShieldAlert, Eye, Wallet as WalletIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const docTypeLabels: Record<string, string> = {
  business_license: "Business License",
  national_id_front: "National ID (Front)",
  national_id_back: "National ID (Back)",
};

const AdminPanel = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [garages, setGarages] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectGarageId, setRejectGarageId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // Image preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingDocUrl, setLoadingDocUrl] = useState<string | null>(null);

  const getDocUrl = async (doc: any): Promise<string | null> => {
    if (doc.document_url.startsWith("http")) return doc.document_url;
    const { data } = supabase.storage.from("documents").getPublicUrl(doc.document_url);
    return data?.publicUrl ?? null;
  };

  const viewDoc = async (doc: any) => {
    setLoadingDocUrl(doc.id);
    const url = await getDocUrl(doc);
    setLoadingDocUrl(null);
    if (url) {
      setPreviewUrl(url);
    } else {
      toast({ title: "Error", description: "Could not load document", variant: "destructive" });
    }
  };

  const openDocInTab = async (doc: any) => {
    const url = await getDocUrl(doc);
    if (url) window.open(url, "_blank");
    else toast({ title: "Error", description: "Could not load document", variant: "destructive" });
  };

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "admin")) navigate("/admin/login");
  }, [authLoading, userRole, navigate]);

  useEffect(() => {
    if (userRole === "admin") fetchAll();
  }, [userRole]);

  const fetchAll = async () => {
    setLoading(true);
    const [g, p, pr, r, docs, revs, po] = await Promise.all([
      supabase.from("garages").select("*").order("created_at", { ascending: false }),
      supabase.from("spare_parts").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("garage_documents").select("*").order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
      supabase.from("payout_requests").select("*").order("created_at", { ascending: false }),
    ]);
    setGarages(g.data || []);
    setParts(p.data || []);
    setProfiles(pr.data || []);
    setRoles(r.data || []);
    setDocuments(docs.data || []);
    setReviews(revs.data || []);
    setPayouts(po.data || []);
    setLoading(false);
  };

  const updatePayout = async (id: string, status: string) => {
    const { data, error } = await supabase.rpc("process_payout", {
      _payout_id: id, _new_status: status, _admin_note: null,
    });
    const r = data as any;
    if (error || !r?.success) {
      toast({ title: "Error", description: error?.message || r?.error || "Failed", variant: "destructive" });
    } else {
      toast({ title: `Payout ${status}` });
      setPayouts((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    }
  };

  const toggleVerified = async (id: string, current: boolean) => {
    await supabase.from("garages").update({ verified: !current }).eq("id", id);
    setGarages((prev) => prev.map((g) => (g.id === id ? { ...g, verified: !current } : g)));
    toast({ title: `Garage ${!current ? "verified" : "unverified"}` });
  };

  const deleteGarage = async (id: string) => {
    await supabase.from("garages").delete().eq("id", id);
    setGarages((prev) => prev.filter((g) => g.id !== id));
    toast({ title: "Garage deleted" });
  };

  const toggleAvailable = async (id: string, current: boolean) => {
    await supabase.from("spare_parts").update({ available: !current }).eq("id", id);
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, available: !current } : p)));
    toast({ title: `Part ${!current ? "available" : "unavailable"}` });
  };

  const deletePart = async (id: string) => {
    await supabase.from("spare_parts").delete().eq("id", id);
    setParts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Part deleted" });
  };

  const approveApplication = async (garageId: string) => {
    // Approve all pending docs for this garage
    const pendingDocs = documents.filter((d) => d.garage_id === garageId && d.status === "pending");
    await Promise.all(
      pendingDocs.map((d) => supabase.from("garage_documents").update({ status: "approved" }).eq("id", d.id))
    );
    await supabase.from("garages").update({ verified: true, verification_level: 2 } as any).eq("id", garageId);
    setDocuments((prev) => prev.map((d) => d.garage_id === garageId && d.status === "pending" ? { ...d, status: "approved" } : d));
    setGarages((prev) => prev.map((g) => g.id === garageId ? { ...g, verified: true, verification_level: 2 } : g));
    toast({ title: "✅ Garage verified successfully!" });
  };

  const openRejectDialog = (garageId: string) => {
    setRejectGarageId(garageId);
    setRejectDocId(null);
    setRejectNote("");
    setRejectOpen(true);
  };

  const rejectApplication = async () => {
    if (!rejectGarageId) return;
    const pendingDocs = documents.filter((d) => d.garage_id === rejectGarageId && d.status === "pending");
    await Promise.all(
      pendingDocs.map((d) =>
        supabase.from("garage_documents").update({ status: "rejected", rejection_note: rejectNote || "Please re-submit valid documents." }).eq("id", d.id)
      )
    );
    // Reset verification level back to 0 on rejection
    await supabase.from("garages").update({ verification_level: 0 } as any).eq("id", rejectGarageId);
    setDocuments((prev) =>
      prev.map((d) =>
        d.garage_id === rejectGarageId && d.status === "pending"
          ? { ...d, status: "rejected", rejection_note: rejectNote || "Please re-submit valid documents." }
          : d
      )
    );
    setGarages((prev) => prev.map((g) => g.id === rejectGarageId ? { ...g, verification_level: 0 } : g));
    toast({ title: "Application rejected" });
    setRejectOpen(false);
  };

  const getRoleForUser = (userId: string) => {
    const r = roles.find((r) => r.user_id === userId);
    return r?.role || "unknown";
  };

  const getGarageName = (garageId: string) => garages.find((g) => g.id === garageId)?.name || "—";

  // Group pending documents by garage
  const pendingByGarage = documents
    .filter((d) => d.status === "pending")
    .reduce((acc: Record<string, any[]>, doc) => {
      if (!acc[doc.garage_id]) acc[doc.garage_id] = [];
      acc[doc.garage_id].push(doc);
      return acc;
    }, {});

  const garageRatings = garages.map((g) => {
    const gRevs = reviews.filter((r) => r.garage_id === g.id);
    const avg = gRevs.length ? (gRevs.reduce((s: number, r: any) => s + r.rating, 0) / gRevs.length).toFixed(1) : "—";
    const top = gRevs.filter((r: any) => r.comment).slice(0, 2).map((r: any) => r.comment);
    return { ...g, avgRating: avg, reviewCount: gRevs.length, topComments: top };
  }).sort((a, b) => Number(b.avgRating) - Number(a.avgRating));

  const partRatings = parts.map((p) => {
    const pRevs = reviews.filter((r) => r.spare_part_id === p.id);
    const avg = pRevs.length ? (pRevs.reduce((s: number, r: any) => s + r.rating, 0) / pRevs.length).toFixed(1) : "—";
    return { ...p, avgRating: avg, reviewCount: pRevs.length };
  }).sort((a, b) => Number(b.avgRating) - Number(a.avgRating));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (userRole !== "admin") return null;

  const pendingKYCCount = Object.keys(pendingByGarage).length;

  // Fix type for pendingByGarage entries
  const pendingByGarageTyped = pendingByGarage as Record<string, any[]>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <h1 className="text-3xl font-heading font-bold mb-6">Admin Panel</h1>

        <Tabs defaultValue="kyc">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="kyc" className="relative">
              <ShieldAlert className="w-4 h-4 mr-1" /> KYC Review
              {pendingKYCCount > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingKYCCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="garages">Garages ({garages.length})</TabsTrigger>
            <TabsTrigger value="parts">Spare Parts ({parts.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({profiles.length})</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="payouts" className="relative">
              <WalletIcon className="w-4 h-4 mr-1" /> Payouts
              {payouts.filter(p => p.status === "pending").length > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {payouts.filter(p => p.status === "pending").length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* KYC Review Board */}
          <TabsContent value="kyc">
            <div className="mb-6">
              <h2 className="text-xl font-heading font-semibold mb-1">KYC Review Board</h2>
              <p className="text-sm text-muted-foreground">Review and approve garage verification applications. Verify documents before granting the Verified badge.</p>
            </div>

            {pendingKYCCount === 0 ? (
              <div className="bg-card rounded-xl p-12 text-center text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-40 text-green-500" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm mt-1">No pending verification applications.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(pendingByGarageTyped).map(([garageId, docs]) => {
                  const garage = garages.find((g) => g.id === garageId);
                  return (
                    <div key={garageId} className="bg-card rounded-xl p-6 shadow-card border">
                      {/* Garage header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-heading font-semibold text-lg">{garage?.name || "Unknown Garage"}</h3>
                          <p className="text-sm text-muted-foreground">{garage?.address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                              <ShieldAlert className="w-3 h-3 mr-1" /> Pending Review
                            </Badge>
                            <span className="text-xs text-muted-foreground">{docs.length} document{docs.length > 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => approveApplication(garageId)}>
                            <CheckCircle className="w-4 h-4" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openRejectDialog(garageId)}>
                            <XCircle className="w-4 h-4" /> Reject
                          </Button>
                        </div>
                      </div>

                      {/* Documents grid */}
                      <div className="grid sm:grid-cols-3 gap-3">
                        {docs.map((doc) => {
                          const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.document_url) || /image/i.test(doc.document_name);
                          return (
                            <div key={doc.id} className="border rounded-lg overflow-hidden bg-muted/30">
                              <div
                                className="h-36 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity bg-muted relative group"
                                onClick={() => viewDoc(doc)}
                              >
                                {isImage && doc.document_url.startsWith("http") ? (
                                  <img src={doc.document_url} alt={doc.document_name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <FileText className="w-10 h-10" />
                                    <span className="text-xs">{isImage ? "Image" : "PDF Document"}</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  {loadingDocUrl === doc.id ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Eye className="w-6 h-6 text-white" />}
                                </div>
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-semibold text-primary">
                                  {docTypeLabels[doc.document_type] || doc.document_type}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">{doc.document_name}</p>
                                <button onClick={() => openDocInTab(doc)}
                                  className="text-[10px] text-primary hover:underline">Open in new tab →</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Also show all-time history */}
            {documents.filter((d) => d.status !== "pending").length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-heading font-semibold mb-3 text-muted-foreground">Review History</h3>
                <div className="space-y-2">
                  {documents.filter((d) => d.status !== "pending").map((doc) => (
                    <div key={doc.id} className="bg-card rounded-lg p-3 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{getGarageName(doc.garage_id)}</p>
                          <p className="text-xs text-muted-foreground">{docTypeLabels[doc.document_type] || doc.document_type} · {new Date(doc.created_at).toLocaleDateString()}</p>
                          {doc.rejection_note && <p className="text-xs text-destructive">{doc.rejection_note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={
                          doc.status === "approved" ? "bg-green-500/20 text-green-600 border-green-500/30" :
                          "bg-destructive/20 text-destructive border-destructive/30"
                        }>{doc.status}</Badge>
                        <button onClick={() => openDocInTab(doc)} className="text-xs text-primary hover:underline">View</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Garages */}
          <TabsContent value="garages">
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC Level</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {garages.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>{g.address}</TableCell>
                      <TableCell><Badge variant="secondary">{g.mechanic_status || "available"}</Badge></TableCell>
                      <TableCell>
                        <Badge className={
                          g.verification_level === 2 ? "bg-green-500/20 text-green-600 border-green-500/30" :
                          g.verification_level === 1 ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" :
                          "bg-muted text-muted-foreground border-border"
                        }>
                          Level {g.verification_level || 0}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant={g.verified ? "default" : "secondary"}>{g.verified ? "Verified" : "Unverified"}</Badge></TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleVerified(g.id, !!g.verified)}>
                          {g.verified ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteGarage(g.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Spare Parts */}
          <TabsContent value="parts">
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.price} ETB</TableCell>
                      <TableCell>{p.condition}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={p.available ? "default" : "secondary"}>{p.available ? "Available" : "Unavailable"}</Badge>
                          {p.sold && <Badge className="bg-destructive/20 text-destructive border-destructive/30">Sold</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleAvailable(p.id, !!p.available)}>
                          {p.available ? "Hide" : "Show"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deletePart(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                      <TableCell>{p.phone || "—"}</TableCell>
                      <TableCell>{p.location || "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{getRoleForUser(p.user_id)}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent" /> Garage Ratings
                </h2>
                <div className="rounded-xl border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Garage</TableHead>
                        <TableHead>Avg Rating</TableHead>
                        <TableHead>Reviews</TableHead>
                        <TableHead>Top Comments</TableHead>
                        <TableHead>Verified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {garageRatings.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className={`w-4 h-4 ${g.avgRating !== "—" ? "text-accent fill-current" : "text-muted"}`} />
                              <span className="font-semibold">{g.avgRating}</span>
                            </div>
                          </TableCell>
                          <TableCell>{g.reviewCount}</TableCell>
                          <TableCell className="max-w-xs">
                            {g.topComments.length > 0 ? (
                              <div className="space-y-1">
                                {g.topComments.map((c: string, i: number) => (
                                  <p key={i} className="text-xs text-muted-foreground italic truncate">"{c}"</p>
                                ))}
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={g.verified ? "default" : "secondary"}>{g.verified ? "Yes" : "No"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent" /> Spare Part Ratings
                </h2>
                <div className="rounded-xl border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Avg Rating</TableHead>
                        <TableHead>Reviews</TableHead>
                        <TableHead>Condition</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partRatings.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.price} ETB</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className={`w-4 h-4 ${p.avgRating !== "—" ? "text-accent fill-current" : "text-muted"}`} />
                              <span className="font-semibold">{p.avgRating}</span>
                            </div>
                          </TableCell>
                          <TableCell>{p.reviewCount}</TableCell>
                          <TableCell>{p.condition}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </div>
          </TabsContent>

          {/* Payouts */}
          <TabsContent value="payouts">
            <div className="space-y-3 mt-4">
              {payouts.length === 0 ? (
                <div className="bg-card rounded-xl p-12 text-center text-muted-foreground">
                  <WalletIcon className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p>No payout requests yet</p>
                </div>
              ) : (
                payouts.map((p) => {
                  const requester = profiles.find((pr) => pr.user_id === p.user_id);
                  return (
                    <div key={p.id} className="bg-card rounded-xl p-4 border flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          {Number(p.amount).toLocaleString()} ETB
                          <Badge variant="outline" className="ml-2 text-xs">{p.status}</Badge>
                        </p>
                        <p className="text-sm text-muted-foreground">{requester?.full_name || p.user_id}</p>
                        <p className="text-xs text-muted-foreground">{p.bank_name} · {p.account_number} · {p.account_name}</p>
                        <p className="text-xs text-muted-foreground/70">{new Date(p.created_at).toLocaleString()}</p>
                      </div>
                      {p.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updatePayout(p.id, "approved")}>
                            <CheckCircle className="w-4 h-4" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updatePayout(p.id, "rejected")}>
                            <XCircle className="w-4 h-4" /> Reject
                          </Button>
                        </div>
                      )}
                      {p.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => updatePayout(p.id, "paid")}>
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Provide a reason for rejection. This will be shown to the mechanic so they can re-submit.</p>
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Document is blurry or illegible. Please re-upload a clear photo."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={rejectApplication}>
                <XCircle className="w-4 h-4" /> Reject Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-3xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="Document preview" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-4 -right-4 bg-card text-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-muted"
            >✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
