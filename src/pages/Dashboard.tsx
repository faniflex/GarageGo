import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationPicker from "@/components/LocationPicker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Package, Wrench, Loader2, Tag, Upload, FileText, ClipboardList, Wifi, WifiOff, Clock, ShieldCheck, ShieldAlert, ShieldX, CheckCircle2, Images, X, ImagePlus, Phone, Check, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GarageRow {
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
  latitude: number | null;
  longitude: number | null;
  mechanic_status: string | null;
  verification_level: number | null;
  gallery?: string[];
}

interface SparePartRow {
  id: string;
  name: string;
  price: number;
  condition: string;
  car_model: string | null;
  category: string | null;
  location: string | null;
  description: string | null;
  image_url: string | null;
  available: boolean | null;
  sold: boolean | null;
  latitude: number | null;
  longitude: number | null;
  gallery?: string[];
}

interface GarageDoc {
  id: string;
  garage_id: string;
  document_url: string;
  document_name: string;
  document_type: string;
  status: string;
  rejection_note: string | null;
  created_at: string;
}

interface Order {
  id: string;
  garage_id: string;
  customer_id: string;
  mechanic_id: string;
  service_requested: string;
  status: string;
  notes: string | null;
  conversation_id: string | null;
  created_at: string;
  garageName?: string;
  customerName?: string;
}

interface ConnectRequest {
  id: string;
  user_id: string;
  garage_id: string;
  mechanic_id: string;
  amount: number;
  status: string;
  created_at: string;
  responded_at: string | null;
  requesterName?: string;
  garageName?: string;
}

interface StagedPhoto {
  file: File;
  preview: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  accepted: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const mechStatusConfig = {
  available: { label: "Available", icon: Wifi, color: "text-green-500", bg: "bg-green-500/20 border-green-500/30" },
  busy: { label: "Busy", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/20 border-yellow-500/30" },
  offline: { label: "Offline", icon: WifiOff, color: "text-muted-foreground", bg: "bg-muted border-border" },
};

const kycLevels = [
  { level: 0, label: "Unverified", icon: ShieldX, color: "text-muted-foreground", bg: "bg-muted/50" },
  { level: 1, label: "Pending Review", icon: ShieldAlert, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { level: 2, label: "Verified", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-500/10" },
];

// Photo upload section for forms
const PhotoUploadSection = ({
  stagedPhotos,
  existingPhotos,
  onStagedAdd,
  onStagedRemove,
  onExistingRemove,
  label = "Photos",
}: {
  stagedPhotos: StagedPhoto[];
  existingPhotos: { id: string; url: string }[];
  onStagedAdd: (files: FileList) => void;
  onStagedRemove: (index: number) => void;
  onExistingRemove: (id: string) => void;
  label?: string;
}) => (
  <div>
    <Label className="flex items-center gap-1 mb-2">
      <Images className="w-4 h-4" /> {label}
      <span className="text-xs text-muted-foreground ml-1">(first photo = card image)</span>
    </Label>

    {/* Thumbnails grid */}
    {(existingPhotos.length > 0 || stagedPhotos.length > 0) && (
      <div className="flex flex-wrap gap-2 mb-3">
        {existingPhotos.map((img, i) => (
          <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-border group">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center py-0.5 font-semibold">
                Primary
              </div>
            )}
            <button
              type="button"
              onClick={() => onExistingRemove(img.id)}
              className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {stagedPhotos.map((sp, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/50 group">
            <img src={sp.preview} alt="" className="w-full h-full object-cover" />
            {existingPhotos.length === 0 && i === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center py-0.5 font-semibold">
                Primary
              </div>
            )}
            <button
              type="button"
              onClick={() => onStagedRemove(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    )}

    <Label htmlFor="photo-upload" className="cursor-pointer block">
      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-colors text-sm text-muted-foreground">
        <ImagePlus className="w-4 h-4" />
        Add Photos (multiple allowed)
      </div>
    </Label>
    <input
      id="photo-upload"
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={(e) => { if (e.target.files) { onStagedAdd(e.target.files); e.target.value = ""; } }}
    />
  </div>
);

// KYC Verification Card Component
const KYCCard = ({
  garage,
  documents,
  onUpload,
  uploading,
  onViewDocument,
}: {
  garage: GarageRow;
  documents: GarageDoc[];
  onUpload: (garageId: string, file: File, docType: string) => Promise<void>;
  uploading: boolean;
  onViewDocument: (doc: GarageDoc) => void;
}) => {
  const garageDocs = documents.filter((d) => d.garage_id === garage.id);
  const level = garage.verification_level ?? 0;
  const lvlCfg = kycLevels[Math.min(level, 2)];
  const LvlIcon = lvlCfg.icon;

  const hasLicense = garageDocs.some((d) => d.document_type === "business_license");
  const hasIdFront = garageDocs.some((d) => d.document_type === "national_id_front");
  const hasIdBack = garageDocs.some((d) => d.document_type === "national_id_back");
  const rejectedDoc = garageDocs.find((d) => d.status === "rejected");

  return (
    <div className="bg-card rounded-xl p-5 shadow-card border space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold">{garage.name}</h3>
          <p className="text-xs text-muted-foreground">Garage Verification</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${lvlCfg.bg}`}>
          <LvlIcon className={`w-4 h-4 ${lvlCfg.color}`} />
          <span className={`text-xs font-semibold ${lvlCfg.color}`}>{lvlCfg.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-0">
        {kycLevels.map((l, i) => {
          const done = level >= l.level;
          const current = level === l.level;
          return (
            <div key={l.level} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 text-xs font-bold transition-all ${
                done ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground"
              } ${current ? "ring-2 ring-primary/30 ring-offset-1" : ""}`}>
                {done && level > l.level ? <CheckCircle2 className="w-4 h-4" /> : l.level}
              </div>
              {i < kycLevels.length - 1 && (
                <div className={`flex-1 h-0.5 ${level > l.level ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground -mt-2">
        {kycLevels.map((l) => <span key={l.level}>{l.label}</span>)}
      </div>

      {rejectedDoc && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
          <p className="font-semibold mb-1">Document Rejected</p>
          <p className="text-xs">{rejectedDoc.rejection_note || "Please re-upload your documents."}</p>
        </div>
      )}

      {garageDocs.length > 0 && (
        <div className="space-y-2">
          {garageDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span className="truncate max-w-[140px]">{doc.document_name}</span>
                <Badge className={`text-[10px] ${
                  doc.status === "approved" ? "bg-green-500/20 text-green-600" :
                  doc.status === "rejected" ? "bg-destructive/20 text-destructive" :
                  "bg-yellow-500/20 text-yellow-600"
                }`}>{doc.status}</Badge>
              </div>
              <button onClick={() => onViewDocument(doc)} className="text-primary hover:underline">View</button>
            </div>
          ))}
        </div>
      )}

      {level === 0 && (
        <div className="border border-dashed border-primary/30 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-center">Level 1 — Business License</p>
          <p className="text-xs text-muted-foreground text-center">Upload your Business Registration or Trade License (Image/PDF)</p>
          <Label htmlFor={`lic-${garage.id}`} className="cursor-pointer block">
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary text-sm font-medium">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload Business License"}
            </div>
          </Label>
          <input id={`lic-${garage.id}`} type="file" accept="image/*,.pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(garage.id, f, "business_license"); e.target.value = ""; }} />
        </div>
      )}

      {level >= 1 && !garage.verified && (
        <div className="border border-dashed border-primary/30 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-center">Level 2 — Ethiopian National ID</p>
          <p className="text-xs text-muted-foreground text-center">Upload front and back of your National ID</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`idf-${garage.id}`} className="cursor-pointer block">
                <div className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border-2 transition-colors text-xs font-medium ${hasIdFront ? "border-green-500 bg-green-500/10 text-green-600" : "border-dashed border-border hover:border-primary/50 text-muted-foreground"}`}>
                  {hasIdFront ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                  ID Front
                </div>
              </Label>
              <input id={`idf-${garage.id}`} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(garage.id, f, "national_id_front"); e.target.value = ""; }} />
            </div>
            <div>
              <Label htmlFor={`idb-${garage.id}`} className="cursor-pointer block">
                <div className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border-2 transition-colors text-xs font-medium ${hasIdBack ? "border-green-500 bg-green-500/10 text-green-600" : "border-dashed border-border hover:border-primary/50 text-muted-foreground"}`}>
                  {hasIdBack ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                  ID Back
                </div>
              </Label>
              <input id={`idb-${garage.id}`} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(garage.id, f, "national_id_back"); e.target.value = ""; }} />
            </div>
          </div>
        </div>
      )}

      {garage.verified && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-600">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-sm font-semibold">This garage is Verified ✓</span>
        </div>
      )}
    </div>
  );
};

// Parts CRUD section (shared by seller and mechanic)
const PartsSection = ({
  parts,
  loading,
  user,
  onAdd,
  onEdit,
  onDelete,
  onToggleSold,
  partDialogOpen,
  setPartDialogOpen,
  editingPart,
  pForm,
  setPForm,
  stagedPartPhotos,
  setStagedPartPhotos,
  existingPartPhotos,
  setExistingPartPhotos,
  savePart,
  submitting,
}: any) => (
  <section>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" /> My Parts
      </h2>
      <Dialog open={partDialogOpen} onOpenChange={setPartDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" onClick={onAdd}><Plus className="w-4 h-4" /> List Part</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPart ? "Edit Part" : "List New Part"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={pForm.name} onChange={(e: any) => setPForm({ ...pForm, name: e.target.value })} placeholder="Part name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price (ETB) *</Label><Input type="number" value={pForm.price} onChange={(e: any) => setPForm({ ...pForm, price: e.target.value })} placeholder="0" /></div>
              <div>
                <Label>Condition</Label>
                <select value={pForm.condition} onChange={(e: any) => setPForm({ ...pForm, condition: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                </select>
              </div>
            </div>
            <div><Label>Car Model</Label><Input value={pForm.car_model} onChange={(e: any) => setPForm({ ...pForm, car_model: e.target.value })} placeholder="e.g. Toyota Corolla 2015-2020" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label><Input value={pForm.category} onChange={(e: any) => setPForm({ ...pForm, category: e.target.value })} placeholder="e.g. Brakes" /></div>
              <div><Label>Location</Label><Input value={pForm.location} onChange={(e: any) => setPForm({ ...pForm, location: e.target.value })} placeholder="e.g. Bole" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={pForm.description} onChange={(e: any) => setPForm({ ...pForm, description: e.target.value })} placeholder="Describe this part..." /></div>
            <div>
              <Label>Location on Map</Label>
              <p className="text-xs text-muted-foreground mb-2">Click the map to set your part location</p>
              <LocationPicker latitude={pForm.latitude} longitude={pForm.longitude} onChange={(lat: number, lng: number) => setPForm({ ...pForm, latitude: lat, longitude: lng })} />
            </div>
            <PhotoUploadSection
              label="Part Photos"
              stagedPhotos={stagedPartPhotos}
              existingPhotos={existingPartPhotos}
              onStagedAdd={(files: FileList) => {
                const newPhotos: StagedPhoto[] = Array.from(files).map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
                setStagedPartPhotos((prev: StagedPhoto[]) => [...prev, ...newPhotos]);
              }}
              onStagedRemove={(i: number) => setStagedPartPhotos((prev: StagedPhoto[]) => prev.filter((_, idx) => idx !== i))}
              onExistingRemove={(id: string) => setExistingPartPhotos((prev: any[]) => prev.filter((img) => img.id !== id))}
            />
            <Button onClick={savePart} disabled={submitting} className="w-full">{submitting ? "Saving..." : editingPart ? "Update Part" : "List Part"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    {loading ? (
      <div className="grid sm:grid-cols-2 gap-4">{[1, 2].map((i) => <div key={i} className="bg-card rounded-xl h-32 animate-pulse" />)}</div>
    ) : parts.length === 0 ? (
      <div className="bg-card rounded-xl p-8 text-center text-muted-foreground">
        <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>No parts listed yet. Add your first spare part!</p>
      </div>
    ) : (
      <div className="grid sm:grid-cols-2 gap-4">
        {parts.map((p: SparePartRow) => (
          <div key={p.id} className={`bg-card rounded-xl overflow-hidden shadow-card ${p.sold ? "opacity-70" : ""}`}>
            {p.gallery && p.gallery.length > 0 && (
              <div className="h-28 overflow-hidden">
                <img src={p.gallery[0]} alt={p.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-semibold">{p.name}</h3>
                    {p.sold && <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">Sold</Badge>}
                  </div>
                  <p className="text-sm font-bold text-primary">{Number(p.price).toLocaleString()} ETB</p>
                  <p className="text-xs text-muted-foreground">{p.condition} · {p.car_model}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(p)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
              <Button size="sm" variant={p.sold ? "outline" : "secondary"} onClick={() => onToggleSold(p)} className="w-full mt-3">
                <Tag className="w-3 h-3" />
                {p.sold ? "Mark as Available" : "Mark as Sold"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);

const Dashboard = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [garages, setGarages] = useState<GarageRow[]>([]);
  const [parts, setParts] = useState<SparePartRow[]>([]);
  const [documents, setDocuments] = useState<GarageDoc[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [connects, setConnects] = useState<ConnectRequest[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Garage dialog
  const [garageDialogOpen, setGarageDialogOpen] = useState(false);
  const [editingGarage, setEditingGarage] = useState<GarageRow | null>(null);
  const [gForm, setGForm] = useState({ name: "", address: "", phone: "", services: "", description: "", latitude: null as number | null, longitude: null as number | null });
  const [stagedGaragePhotos, setStagedGaragePhotos] = useState<StagedPhoto[]>([]);
  const [existingGaragePhotos, setExistingGaragePhotos] = useState<{ id: string; url: string }[]>([]);

  // Part dialog
  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePartRow | null>(null);
  const [pForm, setPForm] = useState({ name: "", price: "", condition: "New", car_model: "", category: "", location: "", description: "", latitude: null as number | null, longitude: null as number | null });
  const [stagedPartPhotos, setStagedPartPhotos] = useState<StagedPhoto[]>([]);
  const [existingPartPhotos, setExistingPartPhotos] = useState<{ id: string; url: string }[]>([]);

  const [docUploading, setDocUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect car_owner to /my-orders
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && userRole === "car_owner") navigate("/my-orders");
  }, [authLoading, user, userRole, navigate]);

  useEffect(() => {
    if (!user || userRole === "car_owner") return;
    fetchData();
  }, [user, userRole]);

  const fetchData = async () => {
    setLoading(true);
    const promises: Promise<any>[] = [];

    if (userRole === "mechanic" || userRole === "admin") {
      promises.push(
        Promise.resolve(supabase.from("garages").select("*, garage_images(id, url, position)").eq("owner_id", user!.id))
          .then(({ data }) => {
            const mapped = (data || []).map((g: any) => {
              const sorted = (g.garage_images || []).sort((a: any, b: any) => a.position - b.position);
              return { ...g, gallery: sorted.map((i: any) => i.url) };
            });
            setGarages(mapped as GarageRow[]);
          }),
        Promise.resolve(supabase.from("garage_documents").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false }))
          .then(({ data }) => setDocuments((data as GarageDoc[]) || [])),
        Promise.resolve(supabase.from("orders").select("*").eq("mechanic_id", user!.id).order("created_at", { ascending: false }))
          .then(async ({ data }) => {
            const rawOrders = (data as Order[]) || [];
            const customerIds = [...new Set(rawOrders.map(o => o.customer_id))];
            const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", customerIds);
            const nameMap: Record<string, string> = {};
            (profs || []).forEach((p: any) => { nameMap[p.user_id] = p.full_name || "Customer"; });
            setOrders(rawOrders.map(o => ({ ...o, customerName: nameMap[o.customer_id] || "Customer" })));
          }),
        Promise.resolve(supabase.from("garage_connects").select("*").eq("mechanic_id", user!.id).order("created_at", { ascending: false }))
          .then(async ({ data }) => {
            const raw = (data as ConnectRequest[]) || [];
            const userIds = [...new Set(raw.map(r => r.user_id))];
            const garageIds = [...new Set(raw.map(r => r.garage_id))];
            const [{ data: profs }, { data: gs }] = await Promise.all([
              supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
              supabase.from("garages").select("id, name").in("id", garageIds),
            ]);
            const nameMap: Record<string, string> = {};
            (profs || []).forEach((p: any) => { nameMap[p.user_id] = p.full_name || "User"; });
            const gMap: Record<string, string> = {};
            (gs || []).forEach((g: any) => { gMap[g.id] = g.name; });
            setConnects(raw.map(r => ({ ...r, requesterName: nameMap[r.user_id] || "User", garageName: gMap[r.garage_id] || "Garage" })));
          })
      );
    }

    // Mechanics can also sell parts
    if (userRole === "seller" || userRole === "mechanic" || userRole === "admin") {
      promises.push(
        Promise.resolve(supabase.from("spare_parts").select("*, spare_part_images(id, url, position)").eq("seller_id", user!.id))
          .then(({ data }) => {
            const mapped = (data || []).map((p: any) => {
              const sorted = (p.spare_part_images || []).sort((a: any, b: any) => a.position - b.position);
              return { ...p, gallery: sorted.map((i: any) => i.url) };
            });
            setParts(mapped as SparePartRow[]);
          })
      );
    }

    await Promise.all(promises);
    setLoading(false);
  };

  // Upload photos for garage
  const uploadGaragePhotos = async (garageId: string, photos: StagedPhoto[], startPosition: number) => {
    for (let i = 0; i < photos.length; i++) {
      const { file } = photos[i];
      const ext = file.name.split(".").pop();
      const path = `garage-photos/${garageId}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from("images").upload(path, file);
      if (upErr) continue;
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
      await supabase.from("garage_images").insert({ garage_id: garageId, url: publicUrl, position: startPosition + i });
    }
  };

  // Upload photos for part
  const uploadPartPhotos = async (partId: string, photos: StagedPhoto[], startPosition: number) => {
    for (let i = 0; i < photos.length; i++) {
      const { file } = photos[i];
      const ext = file.name.split(".").pop();
      const path = `part-photos/${partId}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from("images").upload(path, file);
      if (upErr) continue;
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
      await supabase.from("spare_part_images").insert({ spare_part_id: partId, url: publicUrl, position: startPosition + i });
    }
  };

  // Remove deleted existing garage photos from DB
  const syncDeletedGaragePhotos = async (garageId: string, current: { id: string; url: string }[]) => {
    const original = garages.find(g => g.id === garageId);
    if (!original || !original.gallery) return;
    // The current existing photos are what survived (not deleted by user)
    // We need to delete any that are missing from current
    const { data: allImgs } = await supabase.from("garage_images").select("id, url").eq("garage_id", garageId);
    if (!allImgs) return;
    const currentIds = new Set(current.map(c => c.id));
    const toDelete = allImgs.filter((img: any) => !currentIds.has(img.id));
    for (const img of toDelete) {
      await supabase.from("garage_images").delete().eq("id", img.id);
    }
  };

  const syncDeletedPartPhotos = async (partId: string, current: { id: string; url: string }[]) => {
    const { data: allImgs } = await supabase.from("spare_part_images").select("id, url").eq("spare_part_id", partId);
    if (!allImgs) return;
    const currentIds = new Set(current.map(c => c.id));
    const toDelete = allImgs.filter((img: any) => !currentIds.has(img.id));
    for (const img of toDelete) {
      await supabase.from("spare_part_images").delete().eq("id", img.id);
    }
  };

  const openGarageDialog = async (garage?: GarageRow) => {
    if (garage) {
      setEditingGarage(garage);
      setGForm({ name: garage.name, address: garage.address, phone: garage.phone || "", services: (garage.services || []).join(", "), description: garage.description || "", latitude: garage.latitude, longitude: garage.longitude });
      // Load existing photos
      const { data: imgs } = await supabase.from("garage_images").select("id, url, position").eq("garage_id", garage.id).order("position");
      setExistingGaragePhotos((imgs || []).map((i: any) => ({ id: i.id, url: i.url })));
    } else {
      setEditingGarage(null);
      setGForm({ name: "", address: "", phone: "", services: "", description: "", latitude: null, longitude: null });
      setExistingGaragePhotos([]);
    }
    setStagedGaragePhotos([]);
    setGarageDialogOpen(true);
  };

  const saveGarage = async () => {
    if (!gForm.name || !gForm.address) return;
    setSubmitting(true);
    const payload = {
      name: gForm.name, address: gForm.address, phone: gForm.phone || null,
      services: gForm.services.split(",").map((s) => s.trim()).filter(Boolean),
      description: gForm.description || null, owner_id: user!.id,
      latitude: gForm.latitude, longitude: gForm.longitude,
    };

    if (editingGarage) {
      const { error } = await supabase.from("garages").update(payload).eq("id", editingGarage.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else {
        await syncDeletedGaragePhotos(editingGarage.id, existingGaragePhotos);
        await uploadGaragePhotos(editingGarage.id, stagedGaragePhotos, existingGaragePhotos.length);
        toast({ title: "Garage updated!" });
      }
    } else {
      const { data: newGarage, error } = await supabase.from("garages").insert(payload).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else if (newGarage) {
        // Charge one-time listing fee (100 ETB)
        const { data: fee } = await supabase.rpc("charge_listing_fee", { _user_id: user!.id, _kind: "garage", _ref_id: newGarage.id });
        const fr = fee as any;
        if (!fr?.success) {
          await supabase.from("garages").delete().eq("id", newGarage.id);
          toast({ title: "Listing fee failed", description: fr?.error === "insufficient_balance" ? "You need 100 ETB in your wallet to publish a garage." : (fr?.error || "Failed"), variant: "destructive" });
          setSubmitting(false);
          setGarageDialogOpen(false);
          navigate("/wallet");
          return;
        }
        if (stagedGaragePhotos.length > 0) {
          await uploadGaragePhotos(newGarage.id, stagedGaragePhotos, 0);
        }
        toast({ title: "Garage added!", description: "100 ETB listing fee charged." });
      }
    }
    setSubmitting(false);
    setStagedGaragePhotos([]);
    setExistingGaragePhotos([]);
    setGarageDialogOpen(false);
    fetchData();
  };

  const deleteGarage = async (id: string) => {
    const { error } = await supabase.from("garages").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Garage deleted" }); fetchData(); }
  };

  const updateMechanicStatus = async (garageId: string, status: string) => {
    const { error } = await supabase.from("garages").update({ mechanic_status: status }).eq("id", garageId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setGarages(prev => prev.map(g => g.id === garageId ? { ...g, mechanic_status: status } : g));
      toast({ title: `Status set to ${status}` });
    }
  };

  const viewDocument = async (doc: GarageDoc) => {
    if (doc.document_url.startsWith("http")) {
      window.open(doc.document_url, "_blank");
      return;
    }
    const { data } = supabase.storage.from("documents").getPublicUrl(doc.document_url);
    if (data?.publicUrl) window.open(data.publicUrl, "_blank");
    else toast({ title: "Error", description: "Could not load document", variant: "destructive" });
  };

  const uploadDocument = async (garageId: string, file: File, docType: string = "business_license") => {
    setDocUploading(true);
    const ext = file.name.split(".").pop();
    const path = `garage-docs/${garageId}/${docType}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { toast({ title: "Upload error", description: upErr.message, variant: "destructive" }); setDocUploading(false); return; }

    const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
    const publicUrl = pub.publicUrl;
    const existing = documents.find(d => d.garage_id === garageId && d.document_type === docType && d.status === "rejected");
    if (existing) {
      await supabase.from("garage_documents").update({ document_url: publicUrl, document_name: file.name, status: "pending", rejection_note: null } as any).eq("id", existing.id);
    } else {
      await supabase.from("garage_documents").insert({ garage_id: garageId, owner_id: user!.id, document_url: publicUrl, document_name: file.name, document_type: docType } as any);
    }

    const garage = garages.find(g => g.id === garageId);
    if (garage && (garage.verification_level ?? 0) === 0 && docType === "business_license") {
      await supabase.from("garages").update({ verification_level: 1 } as any).eq("id", garageId);
    }

    toast({ title: "Document uploaded! Pending admin review." });
    fetchData();
    setDocUploading(false);
  };

  const openPartDialog = async (part?: SparePartRow) => {
    if (part) {
      setEditingPart(part);
      setPForm({ name: part.name, price: String(part.price), condition: part.condition, car_model: part.car_model || "", category: part.category || "", location: part.location || "", description: part.description || "", latitude: part.latitude, longitude: part.longitude });
      const { data: imgs } = await supabase.from("spare_part_images").select("id, url, position").eq("spare_part_id", part.id).order("position");
      setExistingPartPhotos((imgs || []).map((i: any) => ({ id: i.id, url: i.url })));
    } else {
      setEditingPart(null);
      setPForm({ name: "", price: "", condition: "New", car_model: "", category: "", location: "", description: "", latitude: null, longitude: null });
      setExistingPartPhotos([]);
    }
    setStagedPartPhotos([]);
    setPartDialogOpen(true);
  };

  const savePart = async () => {
    if (!pForm.name || !pForm.price) return;
    setSubmitting(true);
    const payload = {
      name: pForm.name, price: Number(pForm.price), condition: pForm.condition,
      car_model: pForm.car_model || null, category: pForm.category || null,
      location: pForm.location || null, description: pForm.description || null,
      seller_id: user!.id, latitude: pForm.latitude, longitude: pForm.longitude,
    };

    if (editingPart) {
      const { error } = await supabase.from("spare_parts").update(payload).eq("id", editingPart.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else {
        await syncDeletedPartPhotos(editingPart.id, existingPartPhotos);
        await uploadPartPhotos(editingPart.id, stagedPartPhotos, existingPartPhotos.length);
        toast({ title: "Part updated!" });
      }
    } else {
      const { data: newPart, error } = await supabase.from("spare_parts").insert(payload).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else if (newPart) {
        // Charge one-time listing fee (20 ETB)
        const { data: fee } = await supabase.rpc("charge_listing_fee", { _user_id: user!.id, _kind: "spare_part", _ref_id: newPart.id });
        const fr = fee as any;
        if (!fr?.success) {
          await supabase.from("spare_parts").delete().eq("id", newPart.id);
          toast({ title: "Listing fee failed", description: fr?.error === "insufficient_balance" ? "You need 20 ETB in your wallet to publish a part." : (fr?.error || "Failed"), variant: "destructive" });
          setSubmitting(false);
          setPartDialogOpen(false);
          navigate("/wallet");
          return;
        }
        if (stagedPartPhotos.length > 0) {
          await uploadPartPhotos(newPart.id, stagedPartPhotos, 0);
        }
        toast({ title: "Part listed!", description: "20 ETB listing fee charged." });
      }
    }
    setSubmitting(false);
    setStagedPartPhotos([]);
    setExistingPartPhotos([]);
    setPartDialogOpen(false);
    fetchData();
  };

  const deletePart = async (id: string) => {
    const { error } = await supabase.from("spare_parts").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Part deleted" }); fetchData(); }
  };

  const toggleSold = async (part: SparePartRow) => {
    const newSold = !part.sold;
    const { error } = await supabase.from("spare_parts").update({ sold: newSold, available: !newSold }).eq("id", part.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setParts(prev => prev.map(p => p.id === part.id ? { ...p, sold: newSold, available: !newSold } : p));
      toast({ title: newSold ? "Part marked as sold" : "Part restored to available" });
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast({ title: `Order ${status.replace("_", " ")}` });
    }
  };

  // Notify requester via chat message (auto-create conversation when needed)
  const sendConnectNotice = async (c: ConnectRequest, accepted: boolean) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(participant_one.eq.${user.id},participant_two.eq.${c.user_id}),and(participant_one.eq.${c.user_id},participant_two.eq.${user.id})`)
      .eq("garage_id", c.garage_id)
      .maybeSingle();
    let convId = existing?.id as string | undefined;
    if (!convId) {
      const { data: nc } = await supabase
        .from("conversations")
        .insert({ participant_one: user.id, participant_two: c.user_id, garage_id: c.garage_id })
        .select("id")
        .single();
      convId = nc?.id;
    }
    if (!convId) return;
    const content = accepted
      ? `✅ I have accepted your connect request for "${c.garageName}". You can now view my contact and message me here.`
      : `❌ I am unable to accept your connect request for "${c.garageName}" at this time. Your 10 ETB has been refunded to your wallet.`;
    await supabase.from("messages").insert({ conversation_id: convId, sender_id: user.id, content });
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
  };

  const respondConnect = async (c: ConnectRequest, accept: boolean) => {
    setRespondingId(c.id);
    const { data, error } = await supabase.rpc("respond_garage_connect", { _connect_id: c.id, _accept: accept });
    if (error || !(data as any)?.success) {
      toast({ title: "Error", description: error?.message || (data as any)?.error || "Failed", variant: "destructive" });
      setRespondingId(null);
      return;
    }
    await sendConnectNotice(c, accept);
    setConnects(prev => prev.map(x => x.id === c.id ? { ...x, status: accept ? "accepted" : "rejected", responded_at: new Date().toISOString() } : x));
    toast({ title: accept ? "Connect accepted" : "Connect rejected", description: "Requester has been notified." });
    setRespondingId(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isMechanicOrAdmin = userRole === "mechanic" || userRole === "admin";
  const canSellParts = userRole === "seller" || userRole === "mechanic" || userRole === "admin";

  const mechanicDefaultTab = "garages";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b px-4 h-14 flex items-center">
        <h1 className="text-lg font-heading font-bold">Dashboard</h1>
      </div>

      <main className="container py-6 md:py-10">
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-heading font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your {userRole === "mechanic" ? "garages, parts & orders" : userRole === "seller" ? "spare parts" : "listings"}
          </p>
        </div>

        {isMechanicOrAdmin && (
          <Tabs defaultValue={mechanicDefaultTab} className="mb-12">
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="garages"><Wrench className="w-4 h-4 mr-1" /> My Garages</TabsTrigger>
              <TabsTrigger value="parts"><Package className="w-4 h-4 mr-1" /> My Parts</TabsTrigger>
              <TabsTrigger value="verification">
                <ShieldCheck className="w-4 h-4 mr-1" /> Verify
                {garages.some(g => !(g.verified)) && (
                  <span className="ml-1 bg-yellow-500/80 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">!</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="orders">
                <ClipboardList className="w-4 h-4 mr-1" /> Orders
                {orders.filter(o => o.status === "pending").length > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {orders.filter(o => o.status === "pending").length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="connects">
                <Phone className="w-4 h-4 mr-1" /> Connects
                {connects.filter(c => c.status === "pending").length > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {connects.filter(c => c.status === "pending").length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Garages Tab */}
            <TabsContent value="garages">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-semibold">My Garages</h2>
                <Dialog open={garageDialogOpen} onOpenChange={setGarageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => openGarageDialog()}><Plus className="w-4 h-4" /> Add Garage</Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingGarage ? "Edit Garage" : "Add New Garage"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Name *</Label><Input value={gForm.name} onChange={(e) => setGForm({ ...gForm, name: e.target.value })} placeholder="Garage name" /></div>
                      <div><Label>Address *</Label><Input value={gForm.address} onChange={(e) => setGForm({ ...gForm, address: e.target.value })} placeholder="Full address" /></div>
                      <div><Label>Phone</Label><Input value={gForm.phone} onChange={(e) => setGForm({ ...gForm, phone: e.target.value })} placeholder="+251 9X XXX XXXX" /></div>
                      <div><Label>Services (comma-separated)</Label><Input value={gForm.services} onChange={(e) => setGForm({ ...gForm, services: e.target.value })} placeholder="Oil Change, Brake Repair, ..." /></div>
                      <div><Label>Description</Label><Textarea value={gForm.description} onChange={(e) => setGForm({ ...gForm, description: e.target.value })} placeholder="Describe your garage..." /></div>
                      <div>
                        <Label>Location on Map</Label>
                        <p className="text-xs text-muted-foreground mb-2">Click the map to set your garage location</p>
                        <LocationPicker latitude={gForm.latitude} longitude={gForm.longitude} onChange={(lat, lng) => setGForm({ ...gForm, latitude: lat, longitude: lng })} />
                      </div>
                      <PhotoUploadSection
                        label="Garage Photos"
                        stagedPhotos={stagedGaragePhotos}
                        existingPhotos={existingGaragePhotos}
                        onStagedAdd={(files: FileList) => {
                          const newPhotos: StagedPhoto[] = Array.from(files).map(f => ({ file: f, preview: URL.createObjectURL(f) }));
                          setStagedGaragePhotos(prev => [...prev, ...newPhotos]);
                        }}
                        onStagedRemove={(i: number) => setStagedGaragePhotos(prev => prev.filter((_, idx) => idx !== i))}
                        onExistingRemove={(id: string) => setExistingGaragePhotos(prev => prev.filter(img => img.id !== id))}
                      />
                      <Button onClick={saveGarage} disabled={submitting} className="w-full">
                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingGarage ? "Update Garage" : "Create Garage"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="grid sm:grid-cols-2 gap-4">{[1, 2].map((i) => <div key={i} className="bg-card rounded-xl h-32 animate-pulse" />)}</div>
              ) : garages.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center text-muted-foreground">
                  <Wrench className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No garages yet. Add your first garage to get started!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {garages.map((g) => {
                    const statusCfg = mechStatusConfig[g.mechanic_status as keyof typeof mechStatusConfig] || mechStatusConfig.available;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <div key={g.id} className="bg-card rounded-xl overflow-hidden shadow-card">
                        {g.gallery && g.gallery.length > 0 && (
                          <div className="h-32 overflow-hidden">
                            <img src={g.gallery[0]} alt={g.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-heading font-semibold">{g.name}</h3>
                                {g.verified && (
                                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px] gap-0.5">
                                    <ShieldCheck className="w-3 h-3" /> Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{g.address}</p>
                              <p className="text-xs text-muted-foreground mt-1">{(g.services || []).join(", ")}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openGarageDialog(g)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteGarage(g.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Status:</span>
                            {(["available", "busy", "offline"] as const).map((s) => {
                              const cfg = mechStatusConfig[s];
                              const Icon = cfg.icon;
                              return (
                                <button key={s} onClick={() => updateMechanicStatus(g.id, s)}
                                  className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 transition-all ${g.mechanic_status === s ? cfg.bg + " " + cfg.color : "border-border text-muted-foreground hover:border-primary/50"}`}>
                                  <Icon className="w-3 h-3" /> {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Parts Tab (mechanic) */}
            <TabsContent value="parts">
              <PartsSection
                parts={parts}
                loading={loading}
                user={user}
                onAdd={() => openPartDialog()}
                onEdit={(p: SparePartRow) => openPartDialog(p)}
                onDelete={deletePart}
                onToggleSold={toggleSold}
                partDialogOpen={partDialogOpen}
                setPartDialogOpen={setPartDialogOpen}
                editingPart={editingPart}
                pForm={pForm}
                setPForm={setPForm}
                stagedPartPhotos={stagedPartPhotos}
                setStagedPartPhotos={setStagedPartPhotos}
                existingPartPhotos={existingPartPhotos}
                setExistingPartPhotos={setExistingPartPhotos}
                savePart={savePart}
                submitting={submitting}
              />
            </TabsContent>

            {/* Verification Tab (KYC) */}
            <TabsContent value="verification">
              <div className="mb-6">
                <h2 className="text-xl font-heading font-semibold mb-1">Garage Verification (KYC)</h2>
                <p className="text-sm text-muted-foreground">Complete verification to display a Verified badge on your garage profile.</p>
              </div>
              {garages.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center text-muted-foreground">
                  <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Add a garage first to start verification.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {garages.map((g) => (
                    <KYCCard key={g.id} garage={g} documents={documents} onUpload={uploadDocument} uploading={docUploading} onViewDocument={viewDocument} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <h2 className="text-xl font-heading font-semibold mb-4">Service Orders</h2>
              {orders.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No orders yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-card rounded-xl p-5 shadow-card">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{order.service_requested}</p>
                          <p className="text-sm text-muted-foreground">Customer: {order.customerName}</p>
                          {order.notes && <p className="text-sm text-muted-foreground mt-1">Notes: {order.notes}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className={statusColors[order.status] || ""}>{order.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap mt-3">
                        {order.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => updateOrderStatus(order.id, "accepted")}>Accept</Button>
                            <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, "cancelled")}>Cancel</Button>
                          </>
                        )}
                        {order.status === "accepted" && (
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, "in_progress")}>Start Work</Button>
                        )}
                        {order.status === "in_progress" && (
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, "completed")}>Mark Complete</Button>
                        )}
                        {order.conversation_id && (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/chat?id=${order.conversation_id}`)}>Open Chat</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Connect Requests Tab */}
            <TabsContent value="connects">
              <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" /> Contact Unlock Requests
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Car owners pay 10 ETB to unlock your contact. Accept to reveal your phone and start a chat, or reject to refund the user.
              </p>
              {connects.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center text-muted-foreground">
                  <Phone className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No connect requests yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connects.map((c) => (
                    <div key={c.id} className="bg-card rounded-xl p-5 shadow-card">
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{c.requesterName}</p>
                          <p className="text-sm text-muted-foreground">Garage: {c.garageName}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString()}</p>
                          <p className="text-xs text-primary mt-1 font-semibold">{Number(c.amount).toFixed(2)} ETB</p>
                        </div>
                        <Badge className={statusColors[c.status] || ""}>{c.status}</Badge>
                      </div>
                      {c.status === "pending" && (
                        <div className="flex gap-2 flex-wrap mt-3">
                          <Button size="sm" disabled={respondingId === c.id} onClick={() => respondConnect(c, true)}>
                            {respondingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Accept
                          </Button>
                          <Button size="sm" variant="destructive" disabled={respondingId === c.id} onClick={() => respondConnect(c, false)}>
                            <XCircle className="w-4 h-4" /> Reject & Refund
                          </Button>
                        </div>
                      )}
                      {c.status === "accepted" && (
                        <p className="text-xs text-green-600 mt-2">Accepted — payout included in weekly cycle.</p>
                      )}
                      {c.status === "rejected" && (
                        <p className="text-xs text-destructive mt-2">Rejected — 10 ETB refunded to requester.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Seller-only (non-mechanic): Spare Parts */}
        {userRole === "seller" && (
          <PartsSection
            parts={parts}
            loading={loading}
            user={user}
            onAdd={() => openPartDialog()}
            onEdit={(p: SparePartRow) => openPartDialog(p)}
            onDelete={deletePart}
            onToggleSold={toggleSold}
            partDialogOpen={partDialogOpen}
            setPartDialogOpen={setPartDialogOpen}
            editingPart={editingPart}
            pForm={pForm}
            setPForm={setPForm}
            stagedPartPhotos={stagedPartPhotos}
            setStagedPartPhotos={setStagedPartPhotos}
            existingPartPhotos={existingPartPhotos}
            setExistingPartPhotos={setExistingPartPhotos}
            savePart={savePart}
            submitting={submitting}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
