import { Link } from "react-router-dom";

export const Logo = ({ variant = "default" }: { variant?: "default" | "light" }) => {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="absolute inset-0 gradient-primary rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
        <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-soft">
          <img
            src="/favicon.ico"
            alt="SPCAES logo"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <div className="leading-tight">
        <div className={`font-display font-bold text-lg ${variant === "light" ? "text-white" : "text-foreground"}`}>
          SPCAES
        </div>
        <div className={`text-[10px] uppercase tracking-wider ${variant === "light" ? "text-white/70" : "text-muted-foreground"}`}>
          Smart Complaint System
        </div>
      </div>
    </Link>
  );
};
