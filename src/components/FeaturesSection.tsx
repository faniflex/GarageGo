import { MapPin, ShieldCheck, Star, MessageCircle, ShoppingCart, Zap } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "GPS Garage Finder",
    description: "Locate the nearest verified garages with real-time GPS positioning and distance calculation.",
  },
  {
    icon: ShoppingCart,
    title: "Spare Parts Market",
    description: "Browse, compare, and buy genuine spare parts from trusted sellers across Ethiopia.",
  },
  {
    icon: Zap,
    title: "Roadside Assistance",
    description: "Request emergency help with one tap — towing, battery jump-start, tire change, and more.",
  },
  {
    icon: Star,
    title: "Ratings & Reviews",
    description: "Make informed decisions with transparent ratings from real car owners.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Providers",
    description: "Every garage and seller is verified by our admin team for quality and authenticity.",
  },
  {
    icon: MessageCircle,
    title: "Direct Communication",
    description: "Chat or call mechanics and sellers directly through the platform.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="hidden md:block py-20 bg-muted/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4">
            Everything You Need for Your Car
          </h2>
          <p className="text-muted-foreground text-lg">
            One platform for garages, spare parts, and roadside help — built for Ethiopian drivers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
