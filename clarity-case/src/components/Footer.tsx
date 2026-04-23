import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 mt-20">
      <div className="container py-14 grid gap-10 md:grid-cols-4">
        <div className="space-y-4 md:col-span-1">
          <Logo />
          <p className="text-sm text-muted-foreground leading-relaxed">
            A trusted, AI-driven complaint platform built to make justice transparent and accessible.
          </p>
          <div className="flex gap-2">
            {[Facebook, Twitter, Instagram].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-4 text-sm">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/citizen/raise" className="hover:text-primary story-link">Raise Complaint</Link></li>
            <li><Link to="/citizen/track" className="hover:text-primary story-link">Track Status</Link></li>
            <li><Link to="/citizen/assistant" className="hover:text-primary story-link">AI Assistant</Link></li>
            <li><Link to="/portal" className="hover:text-primary story-link">Portals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-4 text-sm">Resources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-primary story-link">Citizen Rights</a></li>
            <li><a href="#" className="hover:text-primary story-link">FAQ</a></li>
            <li><a href="#" className="hover:text-primary story-link">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-primary story-link">Terms of Service</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-4 text-sm">Emergency Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-destructive" />
              <span>Police: 100</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-secondary" />
              <span>Helpline: 1800-XXX-XXX</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span>support@spcaes.gov</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border bg-accent/20">
        <div className="container py-3 text-[11px] text-muted-foreground text-center">
          🔒 SPCAES is an end-to-end encrypted government grievance platform. Your data is processed under the IT Act, 2000 and the DPDP Act, 2023. Read our{" "}
          <a href="#" className="text-primary underline">Privacy Policy</a> and{" "}
          <a href="#" className="text-primary underline">Terms of Service</a>.
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container py-4 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} SPCAES. All rights reserved.</p>
          <p>Built with trust, transparency, and technology.</p>
        </div>
      </div>
    </footer>
  );
};
