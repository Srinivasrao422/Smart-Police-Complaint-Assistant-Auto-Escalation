import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "hi" | "te";

type Dict = Record<string, string>;

const dictionaries: Record<Lang, Dict> = {
  en: {
    "raise.title": "Raise a Complaint",
    "raise.subtitle": "Fill out the form below. It only takes 2-3 minutes.",
    "raise.step.identity": "Identity",
    "raise.step.details": "Details",
    "raise.step.parties": "Parties",
    "raise.step.category": "Category",
    "raise.step.evidence": "Evidence",
    "raise.step.review": "Review",
    "raise.victim": "Victim Details",
    "raise.accused": "Accused Details",
    "raise.witness": "Witnesses",
    "raise.fullName": "Full name",
    "raise.mobile": "Mobile number",
    "raise.address": "Address",
    "raise.idType": "ID type",
    "raise.idNumber": "ID number",
    "raise.photo": "Photo",
    "raise.verifyOtp": "Verify via OTP",
    "raise.send": "Send OTP",
    "raise.verified": "Verified",
    "raise.addAccused": "Add accused",
    "raise.addWitness": "Add witness",
    "raise.firDraft": "Download FIR Draft (PDF)",
    "raise.summaryReceipt": "Download Receipt (Text)",
    "raise.continue": "Continue",
    "raise.back": "Back",
    "raise.submit": "Submit Complaint",
    "common.optional": "optional",
    "lang.label": "Language",
  },
  hi: {
    "raise.title": "शिकायत दर्ज करें",
    "raise.subtitle": "नीचे फॉर्म भरें। केवल 2-3 मिनट लगेंगे।",
    "raise.step.identity": "पहचान",
    "raise.step.details": "विवरण",
    "raise.step.parties": "पक्षकार",
    "raise.step.category": "श्रेणी",
    "raise.step.evidence": "साक्ष्य",
    "raise.step.review": "समीक्षा",
    "raise.victim": "पीड़ित विवरण",
    "raise.accused": "आरोपी विवरण",
    "raise.witness": "गवाह",
    "raise.fullName": "पूरा नाम",
    "raise.mobile": "मोबाइल नंबर",
    "raise.address": "पता",
    "raise.idType": "पहचान पत्र प्रकार",
    "raise.idNumber": "पहचान संख्या",
    "raise.photo": "फोटो",
    "raise.verifyOtp": "ओटीपी से सत्यापित करें",
    "raise.send": "ओटीपी भेजें",
    "raise.verified": "सत्यापित",
    "raise.addAccused": "आरोपी जोड़ें",
    "raise.addWitness": "गवाह जोड़ें",
    "raise.firDraft": "एफआईआर ड्राफ्ट डाउनलोड (PDF)",
    "raise.summaryReceipt": "रसीद डाउनलोड (टेक्स्ट)",
    "raise.continue": "आगे बढ़ें",
    "raise.back": "वापस",
    "raise.submit": "शिकायत जमा करें",
    "common.optional": "वैकल्पिक",
    "lang.label": "भाषा",
  },
  te: {
    "raise.title": "ఫిర్యాదు నమోదు",
    "raise.subtitle": "క్రింది ఫారం పూరించండి. కేవలం 2-3 నిమిషాలు పడుతుంది.",
    "raise.step.identity": "గుర్తింపు",
    "raise.step.details": "వివరాలు",
    "raise.step.parties": "పక్షాలు",
    "raise.step.category": "వర్గం",
    "raise.step.evidence": "ఆధారాలు",
    "raise.step.review": "సమీక్ష",
    "raise.victim": "బాధితుని వివరాలు",
    "raise.accused": "నిందితుని వివరాలు",
    "raise.witness": "సాక్షులు",
    "raise.fullName": "పూర్తి పేరు",
    "raise.mobile": "మొబైల్ నంబర్",
    "raise.address": "చిరునామా",
    "raise.idType": "గుర్తింపు రకం",
    "raise.idNumber": "గుర్తింపు సంఖ్య",
    "raise.photo": "ఫోటో",
    "raise.verifyOtp": "OTP ద్వారా ధృవీకరించండి",
    "raise.send": "OTP పంపండి",
    "raise.verified": "ధృవీకరించబడింది",
    "raise.addAccused": "నిందితుని జోడించండి",
    "raise.addWitness": "సాక్షిని జోడించండి",
    "raise.firDraft": "FIR డ్రాఫ్ట్ డౌన్‌లోడ్ (PDF)",
    "raise.summaryReceipt": "రసీదు డౌన్‌లోడ్ (టెక్స్ట్)",
    "raise.continue": "కొనసాగించు",
    "raise.back": "వెనుకకు",
    "raise.submit": "ఫిర్యాదు సమర్పించండి",
    "common.optional": "ఐచ్ఛికం",
    "lang.label": "భాష",
  },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

const STORAGE_KEY = "spcaes.lang";

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return saved && ["en", "hi", "te"].includes(saved) ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (key: string) => dictionaries[lang][key] || dictionaries.en[key] || key;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  hi: "हिन्दी",
  te: "తెలుగు",
};
