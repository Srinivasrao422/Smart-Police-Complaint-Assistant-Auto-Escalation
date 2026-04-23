import { api } from "@/lib/api";
import { formatLocation } from "@/lib/admin";

// Lightweight client-side "AI" helpers - keyword based.
// These run instantly and require no backend.

export type Priority = "Low" | "Medium" | "High";

const HIGH_KEYWORDS = [
  "weapon", "gun", "knife", "blood", "injur", "kidnap", "abduct", "missing child",
  "rape", "assault", "threat to kill", "ransom", "minor", "acid", "fire",
  "unconscious", "bleeding", "emergency", "life threat",
];
const MEDIUM_KEYWORDS = [
  "stolen", "theft", "fraud", "scam", "harass", "stalk", "phish", "otp",
  "upi", "cheated", "missing", "broke into", "burgl",
];

// Detect priority from free-text description.
export const detectPriority = (text: string): Priority => {
  const t = text.toLowerCase();
  if (HIGH_KEYWORDS.some((k) => t.includes(k))) return "High";
  if (MEDIUM_KEYWORDS.some((k) => t.includes(k))) return "Medium";
  return "Low";
};

export interface KnownComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
}

export const RECENT_COMPLAINTS: KnownComplaint[] = [];

export const fetchRecentComplaints = async (limit = 10): Promise<KnownComplaint[]> => {
  try {
    const data = await api.get(`/api/complaints/recent?limit=${limit}`);
    return ((data?.items || data || []) as any[]).map((d: any) => ({
      id: d._id || d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      location: formatLocation(d.location),
    }));
  } catch {
    return [];
  }
};

const tokenize = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

const similarity = (a: string, b: string): number => {
  const A = tokenize(a);
  const B = tokenize(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((w) => {
    if (B.has(w)) inter++;
  });
  const union = new Set([...A, ...B]).size;
  return inter / union;
};

export interface DuplicateMatch {
  complaint: KnownComplaint;
  score: number;
}

export const findDuplicates = (
  title: string,
  description: string,
  category: string,
  recent: KnownComplaint[] = RECENT_COMPLAINTS,
  threshold = 0.18
): DuplicateMatch[] => {
  const text = `${title} ${description}`;
  return recent.filter((c) => !category || c.category === category)
    .map((c) => ({
      complaint: c,
      score: similarity(text, `${c.title} ${c.description}`),
    }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

export const maskId = (raw: string): string => {
  const clean = raw.replace(/\s+/g, "");
  if (clean.length <= 4) return clean;
  return "X".repeat(clean.length - 4) + clean.slice(-4);
};
