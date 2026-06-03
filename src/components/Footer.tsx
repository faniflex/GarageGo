import { Car } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="hidden md:block bg-foreground text-primary-foreground/80 py-12">
      <div className="container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg text-primary-foreground mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
                <Car className="w-4 h-4 text-foreground" />
              </div>
              Garage-Go
            </Link>
            <p className="text-sm text-primary-foreground/50">
              Ethiopia's first digital car service and spare part marketplace.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-primary-foreground mb-3">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/garages" className="hover:text-primary-foreground transition-colors">Find Garages</Link>
              <Link to="/spare-parts" className="hover:text-primary-foreground transition-colors">Spare Parts</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-primary-foreground mb-3">Services</h4>
            <div className="flex flex-col gap-2 text-sm">
              <span>Roadside Assistance</span>
              <span>Mechanic Booking</span>
              <span>Part Marketplace</span>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-primary-foreground mb-3">Contact</h4>
            <div className="flex flex-col gap-2 text-sm">
              <span>Addis Ababa, Ethiopia</span>
              <span>info@garagego.et</span>
              <span>+251 91 000 0000</span>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center text-xs text-primary-foreground/40">
          © 2026 Garage-Go. All rights reserved. Built for Ethiopian drivers.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
