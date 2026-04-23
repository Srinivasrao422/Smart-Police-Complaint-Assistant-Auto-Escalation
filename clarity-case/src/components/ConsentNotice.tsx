import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ConsentNotice = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("spcaes-consent")) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("spcaes-consent", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-fade-in-up">
      <div className="rounded-2xl border border-border bg-card shadow-soft p-4 backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">Privacy & Data Consent</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              SPCAES uses encrypted storage to process your complaints. By
              continuing, you agree to our{" "}
              <a href="#" className="text-primary underline">Privacy Policy</a> and{" "}
              <a href="#" className="text-primary underline">Terms</a>.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="hero" onClick={accept}>
                I Agree
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
