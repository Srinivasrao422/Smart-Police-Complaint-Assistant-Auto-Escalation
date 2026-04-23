import jsPDF from "jspdf";
import type { LegalSection } from "./legal";
import { formatLocation } from "@/lib/admin";

export interface FIRData {
  complaintId: string;
  filedAt: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  location: string;
  department: string;
  officer: string;
  slaHours: number;
  priority: string;
  victim: {
    fullName: string;
    mobile: string;
    address: string;
    idType: string;
    idMasked: string;
  };
  accused: { name: string; contact: string; address: string; relation: string }[];
  witnesses: { name: string; contact: string; statement: string }[];
  legalSections: LegalSection[];
}

export const generateFIRDraft = (data: FIRData): jsPDF => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(30, 58, 138); // deep blue
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SPCAES — Smart Police Complaint Assistant", margin, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("First Information Report (FIR) — DRAFT", margin, 50);
  doc.setFontSize(9);
  doc.text("For citizen reference only · Final FIR is registered by the IO", margin, 62);
  y = 90;
  doc.setTextColor(20, 20, 20);

  // Top metadata box
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, pageWidth - margin * 2, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Complaint ID:", margin + 10, y + 18);
  doc.text("Filed On:", margin + 10, y + 36);
  doc.text("Department:", margin + 280, y + 18);
  doc.text("SLA:", margin + 280, y + 36);
  doc.text("Priority:", margin + 10, y + 52);
  doc.text("Officer:", margin + 280, y + 52);
  doc.setFont("helvetica", "normal");
  doc.text(data.complaintId, margin + 90, y + 18);
  doc.text(data.filedAt, margin + 90, y + 36);
  doc.text(data.department, margin + 350, y + 18);
  doc.text(`${data.slaHours} hours`, margin + 320, y + 36);
  doc.text(data.priority, margin + 70, y + 52);
  doc.text(data.officer, margin + 340, y + 52);
  y += 75;

  const section = (title: string) => {
    ensureSpace(30);
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, pageWidth - margin * 2, 20, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(title, margin + 8, y + 14);
    doc.setTextColor(20, 20, 20);
    y += 28;
  };

  const kv = (k: string, v: string) => {
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(k, margin + 8, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(v || "—", pageWidth - margin * 2 - 130);
    doc.text(lines, margin + 130, y);
    y += Math.max(14, lines.length * 12);
  };

  const para = (text: string) => {
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - 16);
    ensureSpace(lines.length * 12 + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(lines, margin + 8, y);
    y += lines.length * 12 + 4;
  };

  // Incident
  section("1. Incident Details");
  kv("Title", data.title);
  kv("Category", data.categoryLabel);
  kv("Location", formatLocation(data.location));
  kv("Description", data.description);

  // Victim
  section("2. Complainant / Victim");
  kv("Full Name", data.victim.fullName);
  kv("Mobile", data.victim.mobile);
  kv("Address", data.victim.address);
  kv("ID", `${data.victim.idType}: ${data.victim.idMasked}`);

  // Accused
  section("3. Accused Person(s)");
  if (data.accused.length === 0) {
    para("No accused details provided.");
  } else {
    data.accused.forEach((a, i) => {
      ensureSpace(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Accused ${i + 1}`, margin + 8, y);
      y += 14;
      kv("Name", a.name);
      kv("Contact", a.contact);
      kv("Address", a.address);
      kv("Relation", a.relation);
    });
  }

  // Witnesses
  section("4. Witnesses");
  if (data.witnesses.length === 0) {
    para("No witnesses listed.");
  } else {
    data.witnesses.forEach((w, i) => {
      ensureSpace(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Witness ${i + 1}`, margin + 8, y);
      y += 14;
      kv("Name", w.name);
      kv("Contact", w.contact);
      kv("Statement", w.statement);
    });
  }

  // Legal sections
  section("5. Applicable Sections (Indicative)");
  if (data.legalSections.length === 0) {
    para("No applicable sections suggested for this category.");
  } else {
    data.legalSections.forEach((s) => {
      ensureSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${s.code} — ${s.title}`, margin + 8, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      kv("Punishment", s.punishment);
      kv("Fine", s.fine);
      const exp = doc.splitTextToSize(s.explanation, pageWidth - margin * 2 - 16);
      ensureSpace(exp.length * 11 + 6);
      doc.text(exp, margin + 8, y);
      y += exp.length * 11 + 8;
    });
  }

  // Disclaimer + signature
  ensureSpace(80);
  y += 10;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const disc = doc.splitTextToSize(
    "Disclaimer: This document is a draft generated by SPCAES based on citizen-provided information. It does not constitute a legally registered FIR. Final registration, sections invoked and punishments are determined by the Investigating Officer and the courts.",
    pageWidth - margin * 2
  );
  doc.text(disc, margin, y);
  y += disc.length * 10 + 20;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Complainant Signature: ____________________", margin, y);
  doc.text("Officer Signature: ____________________", pageWidth - margin - 220, y);

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `SPCAES · ${data.complaintId} · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 16,
      { align: "center" }
    );
  }

  return doc;
};
