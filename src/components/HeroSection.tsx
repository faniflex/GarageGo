import { Button } from "@/components/ui/button";
import { MapPin, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="hidden md:flex relative min-h-[85vh] items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-hero-gradient opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />

      <div className="container relative z-10 py-20">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 animate-fade-in">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary-foreground">
              Serving Addis Ababa & Beyond
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-primary-foreground leading-tight animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Find Garages &{" "}
            <span className="text-gradient-gold">Spare Parts</span>{" "}
            Instantly
          </h1>

          <p
            className="text-lg text-primary-foreground/80 max-w-lg animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Connect with verified mechanics and trusted spare part sellers
            across Ethiopia. GPS-powered, transparent, and reliable.
          </p>

          <div
            className="flex flex-wrap gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button variant="hero" size="lg" asChild>
              <Link to="/garages">
                <MapPin className="w-5 h-5" />
                Find Nearby Garages
              </Link>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <Link to="/spare-parts">
                <Wrench className="w-5 h-5" />
                Browse Spare Parts
              </Link>
            </Button>
          </div>

          <div
            className="flex items-center gap-8 pt-4 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              { label: "Verified Garages", value: "500+" },
              { label: "Spare Parts", value: "10K+" },
              { label: "Happy Drivers", value: "25K+" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-heading font-bold text-accent">
                  {stat.value}
                </p>
                <p className="text-xs text-primary-foreground/60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
