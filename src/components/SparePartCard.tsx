import { Star, MapPin, ShoppingCart, Navigation, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SparePart } from "@/data/mockData";

interface SparePartWithId extends SparePart {
  seller_id?: string;
}

const SparePartCard = ({ part, onCartUpdate }: { part: SparePartWithId; onCartUpdate?: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    setAdding(true);

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("spare_part_id", part.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, spare_part_id: part.id, quantity: 1 });
    }

    toast({ title: "Added to cart!", description: part.name });
    onCartUpdate?.();
    setAdding(false);
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group">
      <div className="relative h-32 md:h-44 overflow-hidden">
        <img
          src={part.image}
          alt={part.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <Badge
          className={`absolute top-2 right-2 text-[10px] md:text-xs px-1.5 py-0.5 ${
            part.condition === "New"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {part.condition}
        </Badge>
        {part.distance && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-full bg-card/90 backdrop-blur-sm text-[10px] font-medium flex items-center gap-1 md:text-xs md:bottom-3 md:left-3 md:px-2 md:py-1">
            <Navigation className="w-2.5 h-2.5 md:w-3 md:h-3 text-accent" />
            {part.distance}
          </div>
        )}
      </div>

      <div className="p-3 md:p-5">
        <h3 className="font-heading font-semibold text-sm md:text-base mb-0.5 leading-tight line-clamp-1">{part.name}</h3>
        <p className="text-[10px] md:text-xs text-muted-foreground mb-2 line-clamp-1">{part.carModel}</p>

        <div className="flex items-center justify-between mb-2 md:mb-3">
          <p className="text-base md:text-xl font-heading font-bold text-primary">
            {part.price.toLocaleString()} <span className="text-xs font-normal">ETB</span>
          </p>
          <div className="flex items-center gap-0.5 text-accent">
            <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
            <span className="text-xs font-medium">{part.rating}</span>
          </div>
        </div>

        <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 line-clamp-1 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 shrink-0" />
          {part.location}
        </p>

        <Button size="sm" className="w-full mt-2 h-8 md:h-9 text-xs md:text-sm" onClick={addToCart} disabled={adding}>
          {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />}
          {adding ? "Adding..." : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
};

export default SparePartCard;
