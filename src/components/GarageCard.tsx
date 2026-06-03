import { Link } from "react-router-dom";
import { MapPin, Star, Phone, ShieldCheck, Wifi, WifiOff, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Garage } from "@/data/mockData";

const mechStatusConfig = {
  available: { label: "Available", icon: Wifi, color: "text-green-500", bg: "bg-green-500/10 border-green-500/30" },
  busy: { label: "Busy", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30" },
  offline: { label: "Offline", icon: WifiOff, color: "text-muted-foreground", bg: "bg-muted border-border" },
};

interface GarageWithStatus extends Omit<Garage, 'verified'> {
  mechanic_status?: string;
  verified?: boolean | null;
  galleryImage?: string;
}

const GarageCard = ({ garage }: { garage: GarageWithStatus }) => {
  const statusKey = (garage.mechanic_status || "available") as keyof typeof mechStatusConfig;
  const statusCfg = mechStatusConfig[statusKey] || mechStatusConfig.available;
  const StatusIcon = statusCfg.icon;
  const displayImage = garage.galleryImage || garage.image;

  return (
    <Link to={`/garages/${garage.id}`} className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group block">
      <div className="relative h-32 md:h-48 overflow-hidden">
        <img
          src={displayImage}
          alt={garage.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {garage.verified && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-semibold shadow-lg md:text-xs md:px-2.5 md:py-1">
            <ShieldCheck className="w-3 h-3" />
            <span className="hidden md:inline">Verified</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border md:text-xs md:px-2 md:py-1 ${statusCfg.bg} ${statusCfg.color}`}>
            <StatusIcon className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span className="hidden md:inline">{statusCfg.label}</span>
          </span>
        </div>
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-full bg-card/90 backdrop-blur-sm text-[10px] font-medium flex items-center gap-1 md:text-xs md:px-2 md:py-1 md:bottom-3 md:left-3">
          <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 text-accent" />
          {garage.distance}
        </div>
      </div>

      <div className="p-3 md:p-5">
        <div className="flex items-start justify-between mb-1 md:mb-2">
          <h3 className="font-heading font-semibold text-sm md:text-lg leading-tight line-clamp-1">
            {garage.name}
          </h3>
          <div className="flex items-center gap-0.5 text-accent shrink-0 ml-1">
            <Star className="w-3 h-3 md:w-4 md:h-4 fill-current" />
            <span className="text-xs md:text-sm font-semibold">{garage.rating}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 line-clamp-1">
          <MapPin className="w-2.5 h-2.5 shrink-0" />
          {garage.address}
        </p>

        <div className="flex flex-wrap gap-1 mb-3 md:mb-4">
          {garage.services.slice(0, 2).map((service) => (
            <Badge key={service} variant="secondary" className="text-[10px] md:text-xs px-1.5 py-0">
              {service}
            </Badge>
          ))}
          {garage.services.length > 2 && (
            <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 py-0">
              +{garage.services.length - 2}
            </Badge>
          )}
        </div>

        <Button size="sm" className="w-full h-8 md:h-9 text-xs md:text-sm">
          <Phone className="w-3 h-3 md:w-4 md:h-4" />
          Contact
        </Button>
      </div>
    </Link>
  );
};

export default GarageCard;
