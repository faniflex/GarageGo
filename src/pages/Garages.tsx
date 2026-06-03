import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GarageCard from "@/components/GarageCard";
import { garages as mockGarages } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, Wifi } from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { haversineDistance, formatDistance } from "@/lib/distance";
import type { Garage } from "@/data/mockData";

interface GarageWithStatus extends Garage {
  mechanic_status?: string;
  galleryImage?: string;
}

const Garages = () => {
  const [search, setSearch] = useState("");
  const [garageList, setGarageList] = useState<GarageWithStatus[]>(mockGarages);
  const [loading, setLoading] = useState(true);
  const [sortNearest, setSortNearest] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const userLocation = useUserLocation();

  useEffect(() => {
    const fetchGarages = async () => {
      const { data, error } = await supabase
        .from("garages")
        .select("*, garage_images(url, position)")
        .order("rating", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: GarageWithStatus[] = data.map((g: any) => {
          // Sort images by position and pick the first one
          const sortedImages = (g.garage_images || []).sort((a: any, b: any) => a.position - b.position);
          const primaryImage = sortedImages[0]?.url || g.image_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop";
          return {
            id: g.id,
            name: g.name,
            address: g.address,
            rating: Number(g.rating) || 0,
            reviewCount: g.review_count || 0,
            services: g.services || [],
            distance: "—",
            phone: g.phone || "",
            verified: g.verified || false,
            image: primaryImage,
            galleryImage: primaryImage,
            latitude: g.latitude,
            longitude: g.longitude,
            mechanic_status: g.mechanic_status || "available",
          };
        });
        setGarageList(mapped);
      }
      setLoading(false);
    };
    fetchGarages();
  }, []);

  const garagesWithDistance = garageList.map((g) => {
    if (userLocation.latitude && userLocation.longitude && g.latitude && g.longitude) {
      const dist = haversineDistance(userLocation.latitude, userLocation.longitude, g.latitude, g.longitude);
      return { ...g, distance: formatDistance(dist), _distKm: dist };
    }
    return { ...g, _distKm: Infinity };
  });

  const filtered = garagesWithDistance.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.services.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchAvailable = !availableOnly || g.mechanic_status === "available";
    return matchSearch && matchAvailable;
  });

  const sorted = sortNearest ? [...filtered].sort((a, b) => a._distKm - b._distKm) : filtered;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b px-4 h-14 flex items-center">
        <h1 className="text-lg font-heading font-bold">Find Garages</h1>
      </div>
      <main className="container py-6 md:py-10">
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-heading font-bold mb-2">Find Garages</h1>
          <p className="text-muted-foreground">Browse verified garages and mechanics near you</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or service..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" className="h-11" variant={availableOnly ? "default" : "outline"} onClick={() => setAvailableOnly(!availableOnly)}>
              <Wifi className="w-4 h-4" /> Available
            </Button>
            <Button size="sm" className="h-11" variant={sortNearest ? "default" : "outline"} onClick={() => setSortNearest(!sortNearest)} disabled={!userLocation.latitude}>
              <ArrowUpDown className="w-4 h-4" /> Nearest
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="bg-card rounded-xl h-64 md:h-80 animate-pulse" />)}
          </div>
        ) : sorted.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {sorted.map((garage) => (
              <GarageCard key={garage.id} garage={garage} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No garages found matching "{search}"</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Garages;
