import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Props {
  complaintId: string;
  trigger?: React.ReactNode;
}

export const FeedbackDialog = ({ complaintId, trigger }: Props) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!rating) {
      toast.error("Please rate before submitting");
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/api/complaints/receipt/${complaintId}/feedback`, { rating, text });
      toast.success(`Feedback submitted for ${complaintId}`);
      setOpen(false);
      setRating(0);
      setText("");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Star className="h-3.5 w-3.5 mr-1" /> Rate Resolution
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate this resolution</DialogTitle>
          <DialogDescription>
            Your feedback helps improve service quality for {complaintId}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`Rate ${n} stars`}
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  (hover || rating) >= n
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Share your experience (optional)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[90px]"
        />

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="hero" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
