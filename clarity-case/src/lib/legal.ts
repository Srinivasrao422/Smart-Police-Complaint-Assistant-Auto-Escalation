// Legal references library — categorized by complaint type.
// Indicative IPC / IT Act / MV Act sections with punishments and simple explanations.
// NOTE: Informational only — not legal advice.

export interface LegalSection {
  code: string;
  title: string;
  punishment: string;
  fine: string;
  explanation: string;
}

export const legalLibrary: Record<string, LegalSection[]> = {
  theft: [
    {
      code: "IPC §378",
      title: "Theft",
      punishment: "Defines theft of movable property",
      fine: "—",
      explanation:
        "Whoever dishonestly takes any movable property out of the possession of any person without consent commits theft.",
    },
    {
      code: "IPC §379",
      title: "Punishment for Theft",
      punishment: "Up to 3 years imprisonment",
      fine: "Fine, or both",
      explanation:
        "Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.",
    },
    {
      code: "IPC §392",
      title: "Robbery",
      punishment: "Up to 10 years (rigorous)",
      fine: "Fine",
      explanation:
        "If theft is committed using force or fear of instant injury, it becomes robbery and attracts a higher punishment.",
    },
  ],
  cyber: [
    {
      code: "IT Act §66C",
      title: "Identity Theft",
      punishment: "Up to 3 years imprisonment",
      fine: "Up to ₹1,00,000",
      explanation:
        "Fraudulent or dishonest use of another person's electronic signature, password or any other unique identification feature.",
    },
    {
      code: "IT Act §66D",
      title: "Cheating by Personation (using computer)",
      punishment: "Up to 3 years imprisonment",
      fine: "Up to ₹1,00,000",
      explanation:
        "Cheating someone by pretending to be another person using a computer resource — common in UPI / OTP / phishing scams.",
    },
    {
      code: "IPC §420",
      title: "Cheating",
      punishment: "Up to 7 years imprisonment",
      fine: "Fine",
      explanation:
        "Cheating and dishonestly inducing the delivery of property — applicable to most online financial fraud.",
    },
  ],
  vehicle: [
    {
      code: "MV Act §184",
      title: "Dangerous Driving",
      punishment: "Up to 6 months (1st offence)",
      fine: "Up to ₹5,000",
      explanation:
        "Driving a vehicle in a manner dangerous to the public, including rash driving and jumping signals.",
    },
    {
      code: "MV Act §134",
      title: "Hit and Run / Duty after accident",
      punishment: "Up to 6 months",
      fine: "Up to ₹5,000",
      explanation:
        "Driver must stop, render medical aid and report the accident to the nearest police station.",
    },
  ],
  missing: [
    {
      code: "IPC §363",
      title: "Punishment for Kidnapping",
      punishment: "Up to 7 years imprisonment",
      fine: "Fine",
      explanation:
        "Whoever kidnaps any person from India or from lawful guardianship shall be punished.",
    },
    {
      code: "Cr.P.C. §154",
      title: "Mandatory FIR for Missing Person",
      punishment: "Procedural",
      fine: "—",
      explanation:
        "Police are duty-bound to register an FIR/Missing Person Report immediately — no waiting period required.",
    },
  ],
  domestic: [
    {
      code: "IPC §498A",
      title: "Cruelty by Husband or Relatives",
      punishment: "Up to 3 years imprisonment",
      fine: "Fine",
      explanation:
        "Subjecting a married woman to cruelty (mental or physical) by her husband or his relatives.",
    },
    {
      code: "PWDV Act, 2005",
      title: "Protection from Domestic Violence",
      punishment: "Protection orders, residence orders",
      fine: "Compensation orders",
      explanation:
        "Provides civil remedies — protection orders, monetary relief and residence rights to women facing domestic abuse.",
    },
    {
      code: "IPC §354",
      title: "Outraging Modesty",
      punishment: "1 to 5 years imprisonment",
      fine: "Fine",
      explanation:
        "Assault or use of criminal force against a woman with intent to outrage her modesty.",
    },
  ],
  fraud: [
    {
      code: "IPC §420",
      title: "Cheating & Dishonestly Inducing Delivery of Property",
      punishment: "Up to 7 years imprisonment",
      fine: "Fine",
      explanation:
        "The most commonly invoked section for financial fraud, forgery-linked cheating and Ponzi-style schemes.",
    },
    {
      code: "IPC §406",
      title: "Criminal Breach of Trust",
      punishment: "Up to 3 years imprisonment",
      fine: "Fine, or both",
      explanation:
        "Dishonest misappropriation of property entrusted to a person.",
    },
  ],
};

export const getLegalSections = (categoryId: string): LegalSection[] =>
  legalLibrary[categoryId] || [];

export const LEGAL_DISCLAIMER =
  "This platform provides assistance and guidance, not legal judgment. Final classification of offences, sections invoked and punishments are determined by the investigating authority and the courts.";
