import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SparePartCard from "@/components/SparePartCard";
import { spareParts as mockParts } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/hooks/useUserLocation";
import { haversineDistance, formatDistance } from "@/lib/distance";
import type { SparePart } from "@/data/mockData";

const conditions = ["All", "New", "Used"] as const;

const SpareParts = () => {
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState<string>("All");
  const [partsList, setPartsList] = useState<SparePart[]>(mockParts);
  const [loading, setLoading] = useState(true);
  const [sortNearest, setSortNearest] = useState(false);
  const userLocation = useUserLocation();

  useEffect(() => {
    const fetchParts = async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("*, spare_part_images(url, position)")
        .eq("available", true)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: SparePart[] = data.map((p: any) => {
          const sortedImages = (p.spare_part_images || []).sort((a: any, b: any) => a.position - b.position);
          const primaryImage = sortedImages[0]?.url || p.image_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop";
          return {
            id: p.id,
            name: p.name,
            price: Number(p.price),
            seller: "Seller",
            location: p.location || "Addis Ababa",
            condition: p.condition as "New" | "Used",
            carModel: p.car_model || "Universal",
            image: primaryImage,
            rating: Number(p.rating) || 0,
            latitude: p.latitude,
            longitude: p.longitude,
          };
        });
        setPartsList(mapped);
      }
      setLoading(false);
    };
    fetchParts();
  }, []);

  const partsWithDistance = partsList.map((p) => {
    if (userLocation.latitude && userLocation.longitude && p.latitude && p.longitude) {
      const dist = haversineDistance(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude);
      return { ...p, distance: formatDistance(dist), _distKm: dist };
    }
    return { ...p, _distKm: Infinity };
  });

  const filtered = partsWithDistance.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.carModel.toLowerCase().includes(search.toLowerCase());
    const matchCondition = condition === "All" || p.condition === condition;
    return matchSearch && matchCondition;
  });

  const sorted = sortNearest ? [...filtered].sort((a, b) => a._distKm - b._distKm) : filtered;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b px-4 h-14 flex items-center">
        <h1 className="text-lg font-heading font-bold">Spare Parts</h1>
      </div>
      <main className="container py-6 md:py-10">
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-heading font-bold mb-2">Spare Parts Marketplace</h1>
          <p className="text-muted-foreground">Browse genuine spare parts from trusted sellers</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search parts or car model..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            {conditions.map((c) => (
              <Button key={c} size="sm" className="h-11" variant={condition === c ? "default" : "outline"} onClick={() => setCondition(c)}>
                {c}
              </Button>
            ))}
            <Button size="sm" className="h-11" variant={sortNearest ? "default" : "outline"} onClick={() => setSortNearest(!sortNearest)} disabled={!userLocation.latitude}>
              <ArrowUpDown className="w-4 h-4" /> Nearest
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-xl h-56 md:h-72 animate-pulse" />
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {sorted.map((part) => (
              <SparePartCard key={part.id} part={part} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No parts found matching your criteria</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SpareParts;
