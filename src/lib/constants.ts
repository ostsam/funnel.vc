export const SECTORS = [
  "B2B SaaS",
  "Fintech",
  "Consumer (B2C)",
  "Marketplace",
  "Healthtech & Digital Health",
  "BioTech & Life Sciences",
  "Deep Tech & Frontier",
  "Artificial Intelligence (AI) & ML",
  "Crypto & Web3",
  "Climate & CleanTech",
  "Proptech",
  "EdTech",
  "E-commerce & DTC",
  "Hardware & Robotics",
  "Cybersecurity",
  "DevOps & Developer Tools",
  "Gaming & Interactive Media",
  "Mobility & Logistics",
  "LegalTech",
  "InsurTech",
  "AgTech",
  "SpaceTech",
  "GovTech",
  "Industrial & Manufacturing",
  "Social & Community"
] as const;

export type Sector = typeof SECTORS[number];
