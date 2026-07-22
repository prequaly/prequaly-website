
// export default App
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, Check, MapPin, ArrowRight, ArrowLeft, ShieldCheck, Landmark,
  Building2, Users, Info, Clock, Tag, HeartHandshake, BadgeCheck, Star,
  Bookmark, BookmarkCheck, GraduationCap, Wallet, FileText, Search,
  LayoutDashboard, Link2, Medal, ChevronRight, CircleDollarSign, Bell, Layers, Mail, HelpCircle,
} from "lucide-react";

/* =====================================================================
   PREQUALY — Southern California MVP (LA · Orange · Riverside ·
   San Bernardino · San Diego). One platform: programs, eligibility,
   affordable-home discovery, action plan, and professional referrals.
   Screening only — a matched pro verifies everything.
   ===================================================================== */

/* ------------------------------------------------ Income-limit tables
   2026 planning figures. Every program card carries a "verified" stamp;
   the admin console (production) updates these without code changes. */
const TABLES = {
  calhfa_myhome: { "Los Angeles": 172800, Orange: 202000, Riverside: 155000, "San Bernardino": 155000, "San Diego": 190000, default: 150000 },
  calhfa_dream_for_all: { "Los Angeles": 172800, Orange: 216000, Riverside: 155000, "San Bernardino": 155000, "San Diego": 190000, default: 150000 },
  calhfa_febl_80ami: { "Los Angeles": 85360, Orange: 88400, Riverside: 83120, "San Bernardino": 83120, "San Diego": 91550, default: 80000 },
  gsfa_platinum: { "Los Angeles": 172800, Orange: 202000, Riverside: 155000, "San Bernardino": 155000, "San Diego": 190000, default: 150000 },
  la_lipa_low: { 1: 76800, 2: 87750, 3: 98700, 4: 109650, 5: 118450, default: 118450 },
  long_beach_80ami: { 1: 74650, 2: 85300, 3: 95950, 4: 106600, 5: 115150, default: 115150 },
  oc_map_80ami: { 1: 88400, 2: 101000, 3: 113650, 4: 126250, 5: 136350, default: 136350 },
  orange_80ami: { 1: 88400, 2: 101000, 3: 113650, 4: 126250, 5: 136350, default: 136350 },
  riverside_plha_120ami: { 1: 87300, 2: 99760, 3: 112230, 4: 124680, 5: 134680, default: 134680 },
  riverside_home_80ami: { 1: 62650, 2: 71600, 3: 80550, 4: 89500, 5: 96700, default: 96700 },
  ie_80ami: { 1: 62650, 2: 71600, 3: 80550, 4: 89500, 5: 96700, default: 96700 },
  ie_120ami: { 1: 87300, 2: 99760, 3: 112230, 4: 124680, 5: 134680, default: 134680 },
  san_diego_80ami: { 1: 77250, 2: 88250, 3: 99300, 4: 110300, 5: 119150, default: 119150 },
  san_diego_120ami: { 1: 116000, 2: 132600, 3: 149150, 4: 165700, 5: 179000, default: 179000 },
  county_ami_100: {
    "Los Angeles": { 1: 74650, 2: 85300, 3: 95950, 4: 106600, 5: 115150, default: 115150 },
    Orange: { 1: 95350, 2: 108950, 3: 122600, 4: 136200, 5: 147100, default: 147100 },
    Riverside: { 1: 68800, 2: 78650, 3: 88450, 4: 98300, 5: 106150, default: 106150 },
    "San Bernardino": { 1: 68800, 2: 78650, 3: 88450, 4: 98300, 5: 106150, default: 106150 },
    "San Diego": { 1: 91550, 2: 104650, 3: 117700, 4: 130800, 5: 141250, default: 141250 },
    default: { 1: 74650, 2: 85300, 3: 95950, 4: 106600, default: 106600 },
  },
};

/* ------------------------------------------------ Rule shorthand */
const R = {
  ft: { id: "ft", fact: "first_time", op: "==", value: true, msg: "be a first-time buyer (no home owned in 3 years)" },
  fg: { id: "fg", fact: "first_generation", op: "==", value: true, msg: "be a first-generation buyer" },
  vet: { id: "vet", fact: "veteran", op: "==", value: true, msg: "be a veteran or active-duty service member" },
  prim: { id: "prim", fact: "occupancy", op: "==", value: "primary", msg: "live in the home as your primary residence" },
  edu: { id: "edu", fact: "education", op: "==", value: true, msg: "finish a homebuyer education class" },
  inc: (t, by, msg) => ({ id: "inc", fact: "income", op: "<=", value: { table: t, by }, msg }),
  amiInc: (pct, msg) => ({ id: "inc", fact: "income", op: "<=", value: { ami_pct: pct, table: "county_ami_100", by: "size" }, msg }),
  own: (p) => ({ id: "own", fact: "own_funds_pct", op: ">=", value: p, msg: `contribute ${Math.round(p * 100)}% of your own funds` }),
};

/* ------------------------------------------------ Program registry (28)
   src: government | nonprofit | lender | developer
   status: active | active_verify | lottery_closed */
const PROGRAMS = [
  // ============ STATEWIDE
  { id: "myhome", name: "CalHFA MyHome Assistance", admin: "CalHFA", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ county: "*" }] }, benefit: { type: "deferred_second", amount_rule: "0.035*price" },
    rules: [R.ft, R.prim, R.edu, R.inc("calhfa_myhome", "county", "meet CalHFA county income limits")],
    incompatible_with: ["dream"], blurb: "Deferred down-payment loan up to 3.5% of the price. No monthly payments — repaid when you sell or refinance." },
  { id: "zip", name: "CalPLUS + ZIP Closing Help", admin: "CalHFA", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ county: "*" }] }, benefit: { type: "deferred_second_closing", amount_rule: "0.03*loan" },
    rules: [R.ft, R.prim, R.edu], incompatible_with: [],
    blurb: "Zero-interest help with closing costs, paired with a CalPLUS first mortgage." },
  { id: "dream", name: "Dream For All Shared Appreciation", admin: "CalHFA", src: "government", status: "lottery_closed", verified: "May 2026",
    geo: { inc: [{ county: "*" }] }, benefit: { type: "shared_appreciation", amount_rule: "min(0.20*price,150000)" },
    rules: [R.ft, R.fg, R.prim, R.inc("calhfa_dream_for_all", "county", "meet Dream For All income limits")],
    incompatible_with: ["myhome"], blurb: "Up to 20% (max $150k) toward your down payment as a shared-appreciation loan. Lottery-based — currently closed; we watch for the next round." },
  { id: "febl", name: "Forgivable Equity Builder Loan", admin: "CalHFA", src: "government", status: "active_verify", verified: "Apr 2026",
    geo: { inc: [{ county: "*" }] }, benefit: { type: "forgivable_loan", amount_rule: "0.10*price" },
    rules: [R.ft, R.prim, R.inc("calhfa_febl_80ami", "county", "earn under ~80% of area median income")],
    incompatible_with: [], blurb: "Up to 10% of the price, fully forgiven if you live in the home 5 years. Funding-dependent." },
  { id: "gsfa", name: "GSFA Platinum Grant", admin: "Golden State Finance Authority", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ county: "*" }] }, benefit: { type: "grant", amount_rule: "0.055*loan" },
    rules: [R.prim, R.inc("gsfa_platinum", "county", "meet GSFA income limits")], incompatible_with: [],
    blurb: "Up to 5.5% toward down payment and closing costs — and you do NOT have to be a first-time buyer." },
  { id: "mcc", name: "Mortgage Credit Certificate (MCC)", admin: "County issuers", src: "government", status: "active_verify", verified: "Mar 2026",
    geo: { inc: [{ county: "*" }] }, benefit: { type: "tax_credit" },
    rules: [R.ft, R.prim], incompatible_with: [],
    blurb: "A federal tax credit worth up to 20% of your yearly mortgage interest — real money back every year you own." },
  // ============ VETERAN PATHWAYS
  { id: "va", name: "VA Home Loan — $0 Down", admin: "U.S. Dept. of Veterans Affairs", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ county: "*" }] }, benefit: { type: "financing" },
    rules: [R.vet, R.prim], incompatible_with: [],
    blurb: "Zero down payment, no mortgage insurance, competitive rates. The strongest financing tool in the country — and it stacks with assistance programs." },
  { id: "calvet", name: "CalVet Home Loan", admin: "CalVet", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ county: "*" }] }, benefit: { type: "financing" },
    rules: [R.vet, R.prim], incompatible_with: [],
    blurb: "Below-market financing for California veterans, with low-cost disaster coverage included." },
  // ============ LOS ANGELES COUNTY
  { id: "la-lipa", name: "LA Low Income Purchase Assistance (LIPA)", admin: "City of Los Angeles LAHD", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ city: "Los Angeles", county: "Los Angeles" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_140000" },
    rules: [R.ft, R.prim, R.edu, R.inc("la_lipa_low", "size", "meet LIPA low-income limits")], incompatible_with: [],
    blurb: "Up to $140,000 in deferred down-payment and closing help inside the City of LA." },
  { id: "la-mipa", name: "LA Moderate Income Purchase Assistance", admin: "City of Los Angeles LAHD", src: "government", status: "active_verify", verified: "May 2026",
    geo: { inc: [{ city: "Los Angeles", county: "Los Angeles" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_115000" },
    rules: [R.ft, R.prim, R.edu, R.amiInc(150, "earn under ~150% of area median income")], incompatible_with: ["la-lipa"],
    blurb: "Up to $115,000 for moderate-income buyers in the City of LA — for households above the LIPA limits." },
  { id: "lacda", name: "LA County Affordable Homeownership", admin: "LACDA", src: "government", status: "active_verify", verified: "Apr 2026",
    geo: { inc: [{ county: "Los Angeles" }], exc: [{ city: "Los Angeles" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_75000" },
    rules: [R.ft, R.prim, R.edu], incompatible_with: [],
    blurb: "Down-payment help for LA County communities outside the City of LA." },
  { id: "long-beach", name: "Long Beach First-Time Homebuyer", admin: "City of Long Beach", src: "government", status: "active_verify", verified: "Mar 2026",
    geo: { inc: [{ city: "Long Beach", county: "Los Angeles" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_50000" },
    rules: [R.ft, R.prim, R.edu, R.inc("long_beach_80ami", "size", "meet Long Beach income limits")], incompatible_with: [],
    blurb: "Deferred second loan for buyers purchasing in Long Beach." },
  // ============ ORANGE COUNTY
  { id: "oc-map", name: "Orange County Mortgage Assistance (MAP)", admin: "OC Housing & Community Development", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ city: "Yorba Linda", county: "Orange" }, { city: "Placentia" }, { city: "Brea" }, { city: "Other city in Orange County" }] },
    benefit: { type: "deferred_second", amount_rule: "min(0.20*price,80000)" },
    rules: [R.ft, R.prim, R.edu, R.own(0.01), R.inc("oc_map_80ami", "size", "meet OC MAP income limits")], incompatible_with: [],
    blurb: "Silent second loan up to $80,000 in participating Orange County cities." },
  { id: "oc-santaana", name: "Santa Ana Down Payment Assistance", admin: "City of Santa Ana", src: "government", status: "active_verify", verified: "Apr 2026",
    geo: { inc: [{ city: "Santa Ana", county: "Orange" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_40000" },
    rules: [R.ft, R.prim, R.own(0.03), R.inc("orange_80ami", "size", "meet Santa Ana income limits")], incompatible_with: [],
    blurb: "Up to $40,000 for buyers purchasing in Santa Ana." },
  { id: "oc-irvine-clt", name: "Irvine Community Land Trust Home", admin: "Irvine CLT", src: "developer", status: "active_verify", verified: "May 2026", bmr: true,
    geo: { inc: [{ city: "Irvine", county: "Orange" }] }, benefit: { type: "bmr_ownership" },
    rules: [R.ft, R.prim, R.inc("orange_80ami", "size", "meet the community's income limits")], incompatible_with: [],
    blurb: "Buy a home well below market price; resale limits keep it affordable for the next family too." },
  // ============ RIVERSIDE COUNTY
  { id: "riv-homestarter", name: "Riverside HomeStarter", admin: "City of Riverside", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ city: "Riverside", county: "Riverside" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_50000" },
    rules: [R.ft, R.prim, R.edu], incompatible_with: [],
    blurb: "City down-payment help for homes inside Riverside city limits." },
  { id: "riv-plha", name: "Riverside County PLHA Assistance", admin: "Riverside County HWS", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ county: "Riverside" }], exc: [{ city: "Riverside" }] }, benefit: { type: "deferred_second", amount_rule: "min(0.20*price,100000)" },
    rules: [R.ft, R.prim, R.edu, R.inc("riverside_plha_120ami", "size", "earn under ~120% of area median income")], incompatible_with: [],
    blurb: "Up to $100,000, forgiven after 30 years in the home. (County areas outside the City of Riverside.)" },
  { id: "riv-home", name: "Riverside County HOME Program", admin: "Riverside County HWS", src: "government", status: "active", verified: "May 2026",
    geo: { inc: [{ county: "Riverside" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_60000" },
    rules: [R.ft, R.prim, R.edu, R.inc("riverside_home_80ami", "size", "earn under ~80% of area median income")], incompatible_with: [],
    blurb: "Up to 20% of the price, forgiven after 15 years." },
  { id: "mor-valley", name: "Moreno Valley Homebuyer Assistance", admin: "City of Moreno Valley", src: "government", status: "active_verify", verified: "Feb 2026",
    geo: { inc: [{ city: "Moreno Valley", county: "Riverside" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_50000" },
    rules: [R.ft, R.prim, R.edu, R.inc("ie_80ami", "size", "meet the city's income limits")], incompatible_with: [],
    blurb: "Deferred-payment second loan for homes in Moreno Valley." },
  // ============ SAN BERNARDINO / INLAND EMPIRE
  { id: "sb-nhsie", name: "NHSIE CalHome Assistance", admin: "Neighborhood Housing Services IE", src: "nonprofit", status: "active", verified: "Jun 2026",
    geo: { inc: [{ county: "San Bernardino" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_55000" },
    rules: [R.ft, R.prim, R.edu, R.inc("ie_80ami", "size", "earn under ~80% of area median income")], incompatible_with: [],
    blurb: "Up to $55,000 through a HUD-approved nonprofit lender." },
  { id: "ie-iedpa", name: "Inland Empire DPA (IEDPA)", admin: "NPHS", src: "nonprofit", status: "active", verified: "Jun 2026",
    geo: { inc: [{ county: "San Bernardino" }, { county: "Riverside" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_40000" },
    rules: [R.ft, R.prim, R.edu, R.inc("ie_120ami", "size", "earn under ~120% of area median income")], incompatible_with: [],
    blurb: "Up to $40,000 at 0% interest, deferred 30 years, across the Inland Empire." },
  { id: "ontario-hb", name: "Ontario Homebuyer Assistance (CHDO)", admin: "City of Ontario / NPHS", src: "nonprofit", status: "active_verify", verified: "Mar 2026",
    geo: { inc: [{ city: "Ontario", county: "San Bernardino" }] }, benefit: { type: "deferred_second", amount_rule: "up_to_60000" },
    rules: [R.ft, R.prim, R.edu, R.inc("ie_80ami", "size", "meet the city's income limits")], incompatible_with: [],
    blurb: "Down-payment help for buyers purchasing in Ontario." },
  // ============ SAN DIEGO COUNTY
  { id: "sd-city-low", name: "SDHC First-Time Homebuyer", admin: "San Diego Housing Commission", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ city: "San Diego", county: "San Diego" }] }, benefit: { type: "deferred_second", amount_rule: "0.19*price" },
    rules: [R.ft, R.prim, R.edu, R.own(0.03), R.inc("san_diego_80ami", "size", "meet SDHC income limits")], incompatible_with: ["sd-afs"],
    blurb: "Up to 19% of the price plus a $10,000 closing-cost grant in the City of San Diego." },
  { id: "sd-dcca", name: "County of San Diego DCCA", admin: "County of San Diego", src: "government", status: "active", verified: "Jun 2026",
    geo: { inc: [{ county: "San Diego" }], exc: [{ city: "San Diego" }] }, benefit: { type: "deferred_second", amount_rule: "0.22*price" },
    rules: [R.ft, R.prim, R.edu, R.own(0.03), R.inc("san_diego_80ami", "size", "meet DCCA income limits")], incompatible_with: [],
    blurb: "Up to 22% of the price plus closing help outside the City of San Diego." },
  { id: "sd-afs", name: "SDHC Affordable For-Sale Home", admin: "San Diego Housing Commission", src: "government", status: "active_verify", verified: "May 2026", bmr: true,
    geo: { inc: [{ county: "San Diego" }] }, benefit: { type: "bmr_ownership" },
    rules: [R.ft, R.prim, R.edu, R.amiInc(120, "earn under ~120% of area median income")], incompatible_with: ["sd-city-low"],
    blurb: "Buy a deed-restricted home at a below-market price. Limited inventory — move fast when one appears." },
];

/* ------------------------------------------------ Home discovery layer
   MLS-style listings with PreQualy affordability flags. flag:
   bmr (deed-restricted) | new_construction | standard */
const LISTINGS = [
  { id: "h1", address: "3125 Juniper St #4", city: "San Diego", county: "San Diego", price: 355000, market: 615000, beds: 2, baths: 1, sqft: 940, flag: "bmr", cap: "san_diego_120ami", note: "Deed-restricted condo, resale-capped" },
  { id: "h2", address: "7042 Mission Gorge Rd #118", city: "San Diego", county: "San Diego", price: 410000, market: 690000, beds: 3, baths: 2, sqft: 1180, flag: "bmr", cap: "san_diego_120ami", note: "Deed-restricted, HOA includes water" },
  { id: "h3", address: "152 Native Spring", city: "Irvine", county: "Orange", price: 425000, market: 815000, beds: 2, baths: 2, sqft: 1050, flag: "bmr", cap: "orange_80ami", note: "Irvine Community Land Trust home" },
  { id: "h4", address: "1436 W 84th Pl", city: "Los Angeles", county: "Los Angeles", price: 545000, beds: 3, baths: 1, sqft: 1120, flag: "standard", note: "Priced under LA median — LIPA-eligible zone" },
  { id: "h5", address: "6211 Cherry Ave", city: "Long Beach", county: "Los Angeles", price: 585000, beds: 2, baths: 1, sqft: 900, flag: "standard", note: "Starter bungalow near transit" },
  { id: "h6", address: "2814 Mary St", city: "Riverside", county: "Riverside", price: 465000, beds: 3, baths: 2, sqft: 1350, flag: "standard", note: "Inside city limits — HomeStarter eligible" },
  { id: "h7", address: "24610 Eucalyptus Ave", city: "Moreno Valley", county: "Riverside", price: 435000, beds: 4, baths: 2, sqft: 1500, flag: "standard", note: "FHA-friendly, large lot" },
  { id: "h8", address: "1577 N Lilac Ave", city: "Ontario", county: "San Bernardino", price: 470000, beds: 3, baths: 2, sqft: 1280, flag: "standard", note: "Eligible for Ontario CHDO assistance" },
  { id: "h9", address: "875 S Shaffer St", city: "Santa Ana", county: "Orange", price: 620000, beds: 3, baths: 2, sqft: 1210, flag: "standard", note: "Santa Ana DPA-eligible area" },
  { id: "h10", address: "3420 E Avalon St", city: "San Bernardino", county: "San Bernardino", price: 395000, beds: 3, baths: 1, sqft: 1090, flag: "standard", note: "Below IE median price" },
  { id: "h11", address: "1208 Hemlock Ave", city: "Chula Vista", county: "San Diego", price: 610000, beds: 3, baths: 2, sqft: 1300, flag: "standard", note: "DCCA-eligible (outside City of SD)" },
  { id: "h12", address: "44 Bright Meadow (Novara Walk)", city: "Fontana", county: "San Bernardino", price: 489000, beds: 3, baths: 2.5, sqft: 1420, flag: "new_construction", note: "Builder credits available for closing costs" },
];

/* ------------------------------------------------ Verified professionals */
const PROS = {
  "Los Angeles": [
    { name: "Angela Brooks", org: "LA Metro Lending", role: "Lender", langs: "English, Spanish, Korean", rating: 4.9, deals: 214 },
    { name: "Derrick Cole", org: "NeighborWorks LA", role: "HUD Counselor", langs: "English, Spanish", rating: 4.8, deals: 130 },
  ],
  Orange: [
    { name: "Kevin Tran", org: "Orange Coast Mortgage", role: "Lender", langs: "English, Vietnamese", rating: 4.9, deals: 188 },
    { name: "Sofia Reyes", org: "OC Realty Collective", role: "Realtor", langs: "English, Spanish", rating: 4.7, deals: 96 },
  ],
  Riverside: [
    { name: "Maria Fuentes", org: "Inland Empire Home Loans", role: "Lender", langs: "English, Spanish", rating: 4.8, deals: 240 },
    { name: "James Okafor", org: "NPHS Homeownership Center", role: "HUD Counselor", langs: "English", rating: 4.9, deals: 175 },
  ],
  "San Bernardino": [
    { name: "Maria Fuentes", org: "Inland Empire Home Loans", role: "Lender", langs: "English, Spanish", rating: 4.8, deals: 240 },
    { name: "James Okafor", org: "NPHS Homeownership Center", role: "HUD Counselor", langs: "English", rating: 4.9, deals: 175 },
  ],
  "San Diego": [
    { name: "Priya Nair", org: "San Diego Home Loans", role: "Lender", langs: "English, Hindi, Mandarin", rating: 4.9, deals: 205 },
    { name: "Luis Herrera", org: "SDHC Partner Network", role: "Realtor", langs: "English, Spanish", rating: 4.8, deals: 112 },
  ],
};

const CITIES = {
  "Los Angeles": ["Los Angeles", "Long Beach", "Pomona", "Palmdale", "Other city in LA County"],
  Orange: ["Santa Ana", "Anaheim", "Irvine", "Yorba Linda", "Other city in Orange County"],
  Riverside: ["Riverside", "Moreno Valley", "Menifee", "Corona", "Other city in Riverside County"],
  "San Bernardino": ["San Bernardino", "Fontana", "Ontario", "Victorville", "Other city in San Bernardino County"],
  "San Diego": ["San Diego", "Chula Vista", "Oceanside", "El Cajon", "Other city in San Diego County"],
};

const RESOURCES = [
  { title: "Free homebuyer education (eHome America)", desc: "The class most programs require. Online, self-paced, certificate on completion — usually done in a weekend.", tag: "Required by most programs" },
  { title: "HUD-approved housing counselors", desc: "Free, unbiased one-on-one guidance from a federally approved counselor in your county.", tag: "Free" },
  { title: "Credit-building basics", desc: "Most programs need a 640–680 score. Paying down cards below 30% and disputing errors are the fastest levers.", tag: "Guide" },
  { title: "Documents lenders will ask for", desc: "2 years of W-2s or tax returns, 2 months of paystubs and bank statements, and photo ID. Gathering them early saves weeks.", tag: "Checklist" },
  { title: "Understanding deferred 'silent second' loans", desc: "How $0/month assistance loans work, when they're repaid, and what forgiveness schedules mean.", tag: "Guide" },
];

/* =====================================================================
   ELIGIBILITY ENGINE — deterministic, transparent, auditable.
   Every result carries the rule that produced it. */
const num = (n) => Number(n) || 0;

function resolveValue(v, hh) {
  if (typeof v !== "object" || v == null) return v;
  if ("ami_pct" in v) {
    const t = TABLES[v.table || "county_ami_100"]; if (!t) return null;
    let node = t[hh.county] ?? t.default;
    if (node && typeof node === "object") node = node[hh.size] ?? node.default;
    return node == null ? null : Math.round((node * v.ami_pct) / 100);
  }
  if (!("table" in v)) return v;
  const t = TABLES[v.table]; if (t == null) return null; if (typeof t !== "object") return t;
  let node; const by = v.by || "flat";
  if (by === "county") node = t[hh.county] ?? t.default;
  else if (by === "size") node = t[hh.size] ?? t.default;
  else node = t.default ?? t;
  if (node && typeof node === "object") node = node[hh.size] ?? node.default;
  return node;
}
function entryMatch(e, hh) {
  const cty = e.county === "*" ? true : e.county ? hh.county === e.county : true;
  const city = e.city ? hh.city === e.city : true;
  return cty && city;
}
function geoGate(p, hh) {
  const inc = (p.geo.inc || []).some((e) => entryMatch(e, hh));
  const exc = (p.geo.exc || []).some((e) => entryMatch(e, hh));
  return inc && !exc;
}
function applyOp(op, a, b) {
  if (a == null || b == null) return false;
  if (op === "==") return a === b;
  if (op === "<=") return a <= b;
  if (op === ">=") return a >= b;
  return false;
}
function estimateBenefit(p, price) {
  const rule = (p.benefit.amount_rule || "").toLowerCase();
  if (!rule) return 0;
  const loan = price * 0.965;
  const coeff = (x) => { const m = x.trim().match(/^([0-9]*\.?[0-9]+)\s*\*\s*(price|appraised|loan)$/); if (!m) return null; const base = { price, appraised: price, loan }[m[2]]; return parseFloat(m[1]) * base; };
  const mm = rule.match(/^min\((.+),(.+)\)$/);
  if (mm) { const vals = [mm[1], mm[2]].map((x) => { let v = coeff(x); if (v == null) { const n = parseFloat(x.replace(/[^0-9.]/g, "")); v = isNaN(n) ? null : n; } return v; }).filter((v) => v != null); return vals.length ? Math.min(...vals) : 0; }
  const r = rule.replace("up_to_", ""); const v = coeff(r); if (v != null) return v;
  const n = parseFloat(r.replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n;
}

/* One-step logic: the ONLY blockers are things a buyer can fix quickly —
   homebuyer education and/or a small own-funds contribution. */
const FIXABLE = new Set(["edu", "own"]);

function evalProgram(p, hh) {
  if (!geoGate(p, hh)) return { result: "not_in_area" };
  const missing = [], failed = [];
  for (const rule of p.rules) {
    const actual = hh[rule.fact];
    const target = resolveValue(rule.value, hh);
    if (actual == null || actual === "") { missing.push(rule); continue; }
    if (!applyOp(rule.op, actual, target)) failed.push({ rule, actual, target });
  }
  const price = hh.price || 500000;
  const est = estimateBenefit(p, price);
  const base = { id: p.id, name: p.name, admin: p.admin, src: p.src, status: p.status, verified: p.verified, bmr: !!p.bmr, blurb: p.blurb, benefit: p.benefit, est };
  const hardFail = failed.filter((x) => !FIXABLE.has(x.rule.id));
  const hardMiss = missing.filter((m) => !FIXABLE.has(m.id));
  const fixables = [...failed.filter((x) => FIXABLE.has(x.rule.id)).map((x) => x.rule), ...missing.filter((m) => FIXABLE.has(m.id))];
  if (hardFail.length === 0 && hardMiss.length === 0 && fixables.length)
    return { ...base, result: "one_step", steps: fixables.map((r) => r.msg) };
  if (missing.length) return { ...base, result: "needs_info", asks: missing.map((m) => m.msg) };
  if (failed.length) return { ...base, result: "not_eligible", why: failed[0].rule.msg };
  const unfunded = ["lottery_closed", "funds_exhausted", "closed"].includes(p.status);
  return { ...base, result: unfunded ? "watching" : "eligible" };
}

/* Realistic stacking: ONE primary DPA source (the largest), plus grants,
   closing-cost help, tax credits, and financing tools that layer on. */
function buildStack(eligible) {
  const cash = eligible.filter((r) => !r.bmr);
  const primaryTypes = new Set(["deferred_second", "forgivable_loan", "shared_appreciation"]);
  const primaries = cash.filter((r) => primaryTypes.has(r.benefit.type)).sort((a, b) => b.est - a.est);
  const chosen = [];
  if (primaries.length) chosen.push(primaries[0]);
  for (const r of cash) {
    if (["deferred_second_closing", "tax_credit", "grant", "financing"].includes(r.benefit.type)) chosen.push(r);
  }
  return chosen;
}

/* Homeownership Opportunity Score — transparent components */
function computeHOS(hh, eligible) {
  const c = { baseline: 35 };
  c.programs = Math.min(eligible.length * 7, 28);
  c.credit = hh.credit_score >= 720 ? 12 : hh.credit_score >= 680 ? 10 : hh.credit_score >= 640 ? 6 : 2;
  c.funds = (hh.own_funds_pct || 0) >= 0.05 ? 12 : (hh.own_funds_pct || 0) >= 0.03 ? 10 : 3;
  c.education = hh.education ? 8 : 0;
  c.veteran = hh.veteran ? 5 : 0;
  const score = Math.min(Object.values(c).reduce((a, b) => a + b, 0), 100);
  return { score, c };
}

/* Buying power — with vs. without the assistance stack.
   6.5% / 30yr; tax 1.1%/yr; ins 0.35%/yr; MI 0.6%/yr on loan. */
const M_RATE = 0.065 / 12, N_MONTHS = 360;
const PAY_PER_LOAN = (M_RATE * Math.pow(1 + M_RATE, N_MONTHS)) / (Math.pow(1 + M_RATE, N_MONTHS) - 1) + 0.006 / 12;
const COST_PER_PRICE = (0.011 + 0.0035) / 12;
function buyingPower(hh, assist, debts) {
  const mi = (hh.income || 0) / 12;
  const budget = Math.max(mi * 0.43 - num(debts), 0);
  const ofp = hh.own_funds_pct || 0;
  const denom = (1 - ofp) * PAY_PER_LOAN + COST_PER_PRICE;
  const without = budget / denom;
  const withPQ = (budget + assist * PAY_PER_LOAN) / denom;
  return { without: Math.max(without, 0), withPQ: Math.max(withPQ, 0), budget };
}
function monthlyFor(price, ofp, assist, extraDown = 0) {
  const loan = Math.max(price * (1 - (ofp || 0)) - assist - extraDown, 0);
  return loan * PAY_PER_LOAN + price * COST_PER_PRICE;
}

/* Home discovery: attach affordability + program flags to each listing */
function flagListings(hh, assist) {
  const bp = buyingPower(hh, assist, hh.debts || 0);
  return LISTINGS.filter((h) => h.county === hh.county).map((h) => {
    let incomeOk = true, cap = null;
    if (h.flag === "bmr" && h.cap) {
      cap = resolveValue({ table: h.cap, by: "size" }, hh);
      incomeOk = hh.income != null && cap != null && hh.income <= cap;
    }
    const monthly = monthlyFor(h.price, hh.own_funds_pct, h.flag === "bmr" ? 0 : assist);
    const withinReach = h.price <= bp.withPQ * 1.02;
    const withoutHelp = h.price <= bp.without;
    const cityMatch = hh.city === h.city || (hh.city || "").startsWith("Other");
    return { ...h, cap, incomeOk, monthly, withinReach, withoutHelp, cityMatch, discount: h.market ? h.market - h.price : 0 };
  }).sort((a, b) => (b.cityMatch - a.cityMatch) || (b.discount - a.discount) || (a.price - b.price));
}

function runEngine(hh) {
  const results = PROGRAMS.map((p) => evalProgram(p, hh));
  const bucket = (k) => results.filter((r) => r.result === k);
  const eligible = bucket("eligible");
  const stack = buildStack(eligible);
  const stackIds = new Set(stack.map((s) => s.id));
  const extra = eligible.filter((r) => !r.bmr && !stackIds.has(r.id));
  const totalAssist = stack.reduce((a, r) => a + r.est, 0);
  const homes = flagListings(hh, totalAssist);
  const bestBmr = homes.filter((h) => h.flag === "bmr" && h.incomeOk).sort((a, b) => b.discount - a.discount)[0];
  const power = buyingPower(hh, totalAssist, hh.debts || 0);
  return {
    eligible, watching: bucket("watching"), oneStep: bucket("one_step"),
    needsInfo: bucket("needs_info"), notEligible: bucket("not_eligible"),
    homes, bestBmr, stack, extra, totalAssist, power,
    hos: computeHOS(hh, eligible),
  };
}

/* Action plan generated from the profile + results */
function buildPlan(hh, r, connected) {
  const items = [];
  if (!hh.education) items.push({ id: "edu", label: "Finish a free homebuyer education class", why: `Unlocks ${r ? r.oneStep.length : "several"} more program${r && r.oneStep.length === 1 ? "" : "s"} and is required by most assistance.` });
  if ((hh.own_funds_pct || 0) < 0.03) items.push({ id: "save", label: "Save toward 1–3% of your own funds", why: "Several programs ask you to contribute a small share — even $3,000–$5,000 opens doors." });
  if (hh.credit_score < 640) items.push({ id: "credit", label: "Build credit toward 640+", why: "Most program lenders need a 640–680 score. Paying cards below 30% moves fastest." });
  items.push({ id: "docs", label: "Gather your documents", why: "W-2s, 2 months of paystubs and bank statements, photo ID. Having them ready saves weeks." });
  if (!connected) items.push({ id: "pro", label: "Connect with a program-certified pro", why: "A lender or counselor who knows your exact programs confirms numbers and reserves funds." });
  items.push({ id: "preapproval", label: "Get pre-approved with your assistance stack", why: "Sellers take offers seriously when assistance is already underwritten." });
  return items;
}

/* ===================================================================== */
const fmt = (n) => "$" + Math.round(n).toLocaleString();
const fmtK = (n) => (n >= 1000 ? "$" + Math.round(n / 1000) + "K" : fmt(n));
const SRC = {
  government: { label: "Government", icon: Landmark, color: "var(--teal)" },
  nonprofit: { label: "Nonprofit", icon: HeartHandshake, color: "#7A5AA6" },
  lender: { label: "Lender", icon: Building2, color: "#2C6E8F" },
  developer: { label: "Below-market home", icon: Tag, color: "var(--amber-ink)" },
};
const CREDIT = { "Excellent (740+)": 760, "Good (680–739)": 700, "Fair (640–679)": 650, "Rebuilding (<640)": 600 };
const SAVE = { "Not yet": 0, "About 1%": 0.01, "About 3%": 0.03, "5% or more": 0.06 };

function useCountUp(target, run) {
  const [v, setV] = useState(0);
  const ref = useRef();
  useEffect(() => {
    if (!run) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setV(target); return; }
    const start = performance.now(), dur = 950;
    const tick = (t) => {
      const p = Math.min((t - start) / dur, 1);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [target, run]);
  return v;
}

/* Brand mark — the glowing keyhole Q */
function Keyhole({ size = 44, glow = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={glow ? "pq-key glow" : "pq-key"}>
      <circle cx="24" cy="22" r="19" fill="var(--navy)" />
      <path d="M14 44 q10 -7 22 -1 l-2 4 q-10 -5 -18 1 z" fill="var(--navy)" />
      <circle cx="24" cy="17" r="5.2" fill="none" stroke="var(--cyan)" strokeWidth="2.1" />
      <path d="M21.4 20.5 L18.2 31 h11.6 L26.6 20.5 Z" fill="none" stroke="var(--cyan)" strokeWidth="2.1" strokeLinejoin="round" />
    </svg>
  );
}


/* ---------------------------------------------------------------- Interest list backend
   Wire-up: set these two values (Supabase → Settings → API). The anon key is
   DESIGNED to be public — row-level security (migration 003) makes the table
   insert-only, so visitors can join the list but nobody can read it via the API.
   NEVER put the service_role key here. Left blank, the form runs in demo mode.
   Note: inside Claude's artifact sandbox external requests are blocked, so the
   live insert activates once this file is hosted (e.g., on Loveable). */
const SUPABASE_URL = "";        // e.g. "https://abcd1234.supabase.co"
const SUPABASE_ANON_KEY = "";   // the public anon key, never service_role

async function joinInterestList(email) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { ok: true, demo: true };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/interest_list`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=ignore-duplicates",
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), source: "prototype", audience: "homebuyer" }),
    });
    return { ok: res.ok || res.status === 409, demo: false };
  } catch {
    return { ok: false, demo: false };
  }
}

/* Scroll-reveal wrapper (no-op under prefers-reduced-motion) */
function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={"pq-fade" + (inView ? " in" : "")} style={{ transitionDelay: delay + "ms" }}>
      {children}
    </div>
  );
}

/* Animated tri-sector orbit — the ecosystem circling the buyer */
function TriOrbit() {
  const nodes = [
    { icon: Landmark, label: "Government resources" },
    { icon: HeartHandshake, label: "Community organizations" },
    { icon: Building2, label: "Trusted partners" },
    { icon: FileText, label: "Programs & assistance" },
  ];
  const period = 46;
  return (
    <div className="pq-orbit" aria-hidden="true">
      <div className="pq-orbit-dash" />
      <div className="pq-orbit-center">
        <div className="pq-float"><Keyhole size={84} /></div>
        <span>People like you</span>
      </div>
      {nodes.map((n, i) => {
        const Icon = n.icon;
        const a = (360 / nodes.length) * i;
        return (
          <div className="pq-orbit-node" key={n.label}
            style={{ transform: `rotate(${a}deg) translate(var(--r)) rotate(${-a}deg)`, animationDelay: `${-(period / nodes.length) * i}s` }}>
            <span className="pq-icircle"><Icon size={18} /></span>
            <em>{n.label}</em>
          </div>
        );
      })}
    </div>
  );
}

/* =====================================================================
   APP SHELL */
export default function PreQualyApp() {
  const [tab, setTab] = useState("home");            // home | programs | homes | dashboard | connect | resources
  const [intakeStep, setIntakeStep] = useState(0);   // 0=not started, 1..3 wizard
  const [f, setF] = useState({
    county: "", city: "", size: 3, income: "", first_time: "yes",
    first_generation: "no", veteran: "no", credit: "Good (680–739)",
    savings: "About 3%", education: "no", price: "", debts: "",
  });
  const [results, setResults] = useState(null);
  const [saved, setSaved] = useState([]);            // saved program ids
  const [savedHomes, setSavedHomes] = useState([]);
  const [planDone, setPlanDone] = useState([]);
  const [consent, setConsent] = useState(false);
  const [referral, setReferral] = useState(null);    // {pro, at} once requested
  const [homeFilter, setHomeFilter] = useState("all");

  useEffect(() => {
    const id = "pq-fonts";
    if (!document.getElementById(id)) {
      const l = document.createElement("link");
      l.id = id; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  const hh = useMemo(() => ({
    county: f.county, city: f.city, size: Number(f.size),
    income: f.income === "" ? null : Number(f.income),
    first_time: f.first_time === "yes", first_generation: f.first_generation === "yes",
    veteran: f.veteran === "yes", occupancy: "primary",
    credit_score: CREDIT[f.credit], own_funds_pct: SAVE[f.savings],
    education: f.education === "yes",
    price: f.price === "" ? null : Number(f.price),
    debts: f.debts === "" ? 0 : Number(f.debts),
  }), [f]);

  const hasProfile = !!results;
  const go = (t) => { setTab(t); window.scrollTo(0, 0); };
  const startIntake = () => { setIntakeStep(1); go("programs"); };
  const finishIntake = () => { setResults(runEngine(hh)); setIntakeStep(0); window.scrollTo(0, 0); };
  const rerun = () => setResults(runEngine(hh));
  const toggleSave = (id) => setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleSaveHome = (id) => setSavedHomes((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const togglePlan = (id) => setPlanDone((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const plan = useMemo(() => buildPlan(hh, results, !!referral), [hh, results, referral]);

  return (
    <div className="pq-root">
      <style>{CSS}</style>
      <header className="pq-head">
        <button className="pq-brand" aria-label="PreQualy home">
          <Keyhole size={30} glow={false} />
          <span>Pre<b>Q</b>ualy</span>
          {/* <img src="/PreQualy Logo.svg" className="pq-logo"/> */}
        </button>
        <nav className="pq-nav" aria-label="Main">
          <NavBtn on={tab === "homes"} onClick={() => go("homes")} icon={Home} label="Homes" />
          <NavBtn on={tab === "home"} onClick={() => go("home")} icon={Home} label="About" /> {/*TODO: need to create this pg*/}
          <NavBtn on={tab === "homebuyers"} onClick={() => go("programs")} icon={Search} label="For Homebuyers" /> {/*TODO: need to create this pg*/}
          <NavBtn on={tab === "partners"} onClick={() => go("dashboard")} icon={LayoutDashboard} label="For Partners" dropdown/> {/*TODO: need to create this pg*/}
            <NavBtn on={tab === "resources"} onClick={() => go("resources")} icon={LayoutDashboard} label="Resources" /> {/*TODO: need to create this pg*/}
          <NavBtn on={tab === "contact"} onClick={() => go("connect")} icon={Users} label="Contact" /> {/*TODO: need to create this pg*/}
        </nav>
      </header>

      {tab === "home" && <Landing onStart={startIntake} onBrowse={() => go("resources")} hasProfile={hasProfile} onResults={() => go("programs")} />}

      {tab === "programs" && (
        intakeStep > 0
          ? <Intake f={f} setF={setF} step={intakeStep} setStep={setIntakeStep} onFinish={finishIntake} onCancel={() => { setIntakeStep(0); go("home"); }} />
          : hasProfile
            ? <Results hh={hh} r={results} f={f} setF={setF} rerun={rerun}
                saved={saved} toggleSave={toggleSave}
                onEdit={() => setIntakeStep(1)} onConnect={() => go("connect")} onHomes={() => go("homes")} />
            : <EmptyState title="Let's find your programs" body="Answer nine quick questions — no credit pull, nothing shared — and see every down-payment program, grant, and below-market home you match in your county." cta="Check my eligibility" onCta={startIntake} />
      )}

      {tab === "homes" && (
        hasProfile
          ? <Homes hh={hh} r={results} filter={homeFilter} setFilter={setHomeFilter}
              savedHomes={savedHomes} toggleSaveHome={toggleSaveHome} onConnect={() => go("connect")} />
          : <EmptyState title="Homes, flagged for you" body="Once we know your county, income, and household, every listing gets a PreQualy flag: within reach with assistance, below-market, or income-restricted homes you qualify to buy." cta="Build my profile first" onCta={startIntake} />
      )}

      {tab === "dashboard" && (
        hasProfile
          ? <Dashboard hh={hh} r={results} saved={saved} toggleSave={toggleSave}
              savedHomes={savedHomes} plan={plan} planDone={planDone} togglePlan={togglePlan}
              referral={referral} onConnect={() => go("connect")} onPrograms={() => go("programs")} />
          : <EmptyState title="Your homeownership plan" body="Your dashboard tracks eligible programs, saved homes, an action plan built for your situation, and your referral status — all in one place." cta="Get started" onCta={startIntake} />
      )}

      {tab === "connect" && (
        hasProfile
          ? <Connect hh={hh} r={results} consent={consent} setConsent={setConsent}
              referral={referral} setReferral={setReferral} onBack={() => go("programs")} />
          : <EmptyState title="Meet a pro who knows your programs" body="We match you with verified lenders, Realtors, and HUD counselors certified in the exact programs you qualify for. Free for you, always." cta="Check eligibility first" onCta={startIntake} />
      )}

      {tab === "resources" && <Resources onStart={startIntake} />}

      <footer className="pq-foot">
        <div className="pq-foot-in">
          <p><Keyhole size={20} glow={false} /> <strong>PreQualy</strong> — Opportunity. Access. Home.</p>
          <p>Screening only — not a loan approval, credit decision, or legal advice. Program figures are 2026 planning estimates verified on the date shown; a matched professional confirms specifics before you rely on them. Always free for homebuyers.</p>
          <p className="pq-foot-links">
            {/* <button onClick={() => go("resources")}>Resources</button>· */}
            <span>Serving Los Angeles, Orange, Riverside, San Bernardino & San Diego counties</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavBtn({ on, onClick, icon: Icon, label, dropdown = false }) {
  return (
    <button className={"pq-navbtn" + (on ? " on" : "")} onClick={onClick} aria-current={on ? "page" : undefined}>
      <span className={on ? "pq-navlabel on" : "pq-navlabel"}>{label}{dropdown && " ∨"}</span>
    </button>
  );
}

function EmptyState({ title, body, cta, onCta }) {
  return (
    <main className="pq-emptypage">
      <Keyhole size={64} />
      <h2>{title}</h2>
      <p>{body}</p>
      <button className="pq-cta" onClick={onCta}>{cta} <ArrowRight size={17} /></button>
    </main>
  );
}

/* ---------------------------------------------------------------- Landing */
function Landing({ onStart, onBrowse, hasProfile, onResults }) {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [sending, setSending] = useState(false);
  const [joinError, setJoinError] = useState(false);
  const emailOk = /.+@.+\..+/.test(email);
  async function submitInterest() {
    setSending(true); setJoinError(false);
    const r = await joinInterestList(email);
    setSending(false);
    if (r.ok) setJoined(true); else setJoinError(true);
  }
  return (
    <main className="pq-landing">
      <section className="pq-hero-grid">
        <div className="pq-hero-copy">
          <p className="pq-eyebrow">Opportunity. Access. Home.</p>
          <h1 className="pq-hero">Unlock homeownership opportunities <em>you may not even know exist.</em></h1>
          <p className="pq-sub">
            PreQualy connects you to housing programs, assistance dollars, and trusted
            partners — so more families can find what's already theirs and achieve the
            dream of homeownership. Free, two minutes, no credit pull.
          </p>
          <div className="pq-hero-ctas">
            {hasProfile
              ? <button className="pq-cta" onClick={onResults}>See my results <ArrowRight size={18} /></button>
              : <button className="pq-cta" onClick={onStart}>Check my eligibility <ArrowRight size={18} /></button>}
            <button className="pq-ghost" onClick={onBrowse}>Browse free resources</button>
          </div>
          <div className="pq-trust">
            <span><Landmark size={14} /> Government</span>
            <span><HeartHandshake size={14} /> Nonprofit</span>
            <span><Building2 size={14} /> Lender</span>
            <span><Tag size={14} /> Below-market homes</span>
          </div>
        </div>
        <div className="pq-hero-art" aria-hidden="true">
          <div className="pq-hero-glow pulse" />
          <div className="pq-float"><Keyhole size={190} /></div>
        </div>
      </section>

      <FadeIn><section className="pq-problem">
        <h2>The path to homeownership is more complicated than it should be.</h2>
        <div className="pq-prob-grid">
          {[
            [Layers, "Too many programs", "Hundreds of programs with different rules, eligibility requirements, and deadlines."],
            [Search, "Hard to find", "Information is scattered across dozens of websites, agencies, and organizations."],
            [FileText, "Opportunities missed", "Many who qualify never find the programs that could make them homeowners."],
            [HelpCircle, "Confusing process", "It's overwhelming to know where to start or who to trust."],
          ].map(([Icon, t, d]) => (
            <div className="pq-prob-item" key={t}>
              <span className="pq-icircle"><Icon size={20} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section></FadeIn>

      <FadeIn><section className="pq-tri">
        <div className="pq-tri-copy">
          <p className="pq-eyebrow">A tri-sector venture</p>
          <h2>Government. Community. Industry.<br /><em>All working for you.</em></h2>
          <p>
            Homeownership help lives in three separate worlds — public agencies,
            community nonprofits, and private professionals. PreQualy is the first
            platform built to bring all three together around one person: you.
          </p>
          <ul className="pq-tri-list">
            <li><Check size={14} /> Public programs and funding, verified at the source</li>
            <li><Check size={14} /> Community organizations and HUD-approved counselors</li>
            <li><Check size={14} /> Vetted lenders, Realtors, and builders who know these programs</li>
          </ul>
          <div className="pq-tri-goal">
            <strong>1 goal</strong><span>stronger pathways to sustainable homeownership</span>
            <strong>1 community</strong><span>stronger together</span>
          </div>
        </div>
        <TriOrbit />
      </section></FadeIn>

      <FadeIn><section className="pq-how">
        <h2>PreQualy brings opportunity within reach.</h2>
        <div className="pq-how-grid">
          <div className="pq-how-card"><span className="pq-how-k">1</span><h3>Tell us about you</h3><p>Nine questions — county, income, household. Nothing hits your credit, nothing is shared without your say-so.</p></div>
          <div className="pq-how-card"><span className="pq-how-k">2</span><h3>See what's yours</h3><p>Our eligibility engine screens {PROGRAMS.length} programs across 5 counties and shows exactly why you match — or what one step would unlock.</p></div>
          <div className="pq-how-card"><span className="pq-how-k">3</span><h3>Find reachable homes</h3><p>Listings flagged with your real buying power — including deed-restricted homes sold far below market.</p></div>
          <div className="pq-how-card"><span className="pq-how-k">4</span><h3>Move with a pro</h3><p>When you're ready, we connect you free with a lender or counselor certified in your exact programs.</p></div>
        </div>
      </section></FadeIn>

      <FadeIn><section className="pq-two">
        <div className="pq-opp-card">
          <p className="pq-opp-label">Example opportunity</p>
          <h3>CalHFA MyHome Assistance</h3>
          <p className="pq-opp-est">Est. assistance</p>
          <div className="pq-opp-amt">$24,500</div>
          <span className="pq-flag reach"><BadgeCheck size={12} /> Down Payment Assistance</span>
          <p className="pq-opp-est">Reduced monthly payment</p>
          <div className="pq-opp-amt sm">$320<span> /mo est.</span></div>
          <button className="pq-ghost slim" onClick={onStart}>See what you match <ArrowRight size={14} /></button>
        </div>
        <div className="pq-interest">
          <span className="pq-icircle big"><Mail size={22} /></span>
          <h3>Be the first to know when we launch near you.</h3>
          <p>Join the interest list for early access, product updates, and ways to get involved.</p>
          {joined ? (
            <p className="pq-joined"><Check size={15} /> You're on the list — welcome to PreQualy.</p>
          ) : (
            <div className="pq-interest-row">
              <input className="pq-input" type="email" placeholder="Enter your email address"
                value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
              <button className="pq-cta" disabled={!emailOk || sending} onClick={submitInterest}>
                {sending ? "Joining…" : "Join the Interest List"}
              </button>
            </div>
          )}
          {joinError && <p className="pq-join-error">Something went wrong on our end — please try again in a moment.</p>}
          <p className="pq-privacy">We respect your privacy. Your email is never sold.</p>
        </div>
      </section></FadeIn>

      <FadeIn><section className="pq-proof">
        <div><strong>{PROGRAMS.length}+</strong><span>programs & resources mapped</span></div>
        <div><strong>5</strong><span>SoCal counties covered</span></div>
        <div><strong>$140K+</strong><span>largest single program match</span></div>
        <div><strong>$0</strong><span>cost to homebuyers, ever</span></div>
      </section></FadeIn>
    </main>
  );
}

/* ---------------------------------------------------------------- Intake (3-step wizard) */
function Field({ label, hint, children }) {
  return (
    <label className="pq-field">
      <span className="pq-label">{label}{hint && <em>{hint}</em>}</span>
      {children}
    </label>
  );
}
function Choice({ options, value, onChange }) {
  return (
    <div className="pq-choice" role="group">
      {options.map((o) => (
        <button key={o} type="button" className={"pq-chip" + (value === o ? " on" : "")} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}
function Intake({ f, setF, step, setStep, onFinish, onCancel }) {
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const cities = f.county ? CITIES[f.county] : [];
  const can1 = f.county && f.city;
  const can2 = f.income !== "";
  const titles = ["Where are you buying?", "Your household", "Money & readiness"];
  const subs = [
    "Programs are tied to counties and cities — this is the single biggest factor in what you qualify for.",
    "Household size sets your income limits, and veteran or first-generation status unlocks dedicated programs.",
    "Rough numbers are fine. The more you share, the more accurate your matches — and nothing here touches your credit.",
  ];
  return (
    <main className="pq-form">
      <button className="pq-back" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
        <ArrowLeft size={16} /> {step === 1 ? "Cancel" : "Back"}
      </button>
      <div className="pq-steps" aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((n) => <span key={n} className={"pq-step-dot" + (n <= step ? " on" : "")} />)}
        <span className="pq-step-txt">Step {step} of 3</span>
      </div>
      <h2 className="pq-h2">{titles[step - 1]}</h2>
      <p className="pq-formsub">{subs[step - 1]}</p>

      {step === 1 && (
        <>
          <Field label="County">
            <select className="pq-input" value={f.county} onChange={(e) => setF((s) => ({ ...s, county: e.target.value, city: "" }))}>
              <option value="">Choose your county</option>
              {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          {f.county && (
            <Field label="City you want to buy in" hint="pick 'Other' if yours isn't listed">
              <select className="pq-input" value={f.city} onChange={(e) => set("city")(e.target.value)}>
                <option value="">Choose a city</option>
                {cities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          )}
          <button className="pq-cta full" disabled={!can1} onClick={() => setStep(2)}>Continue <ArrowRight size={17} /></button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="pq-row">
            <Field label="Household size">
              <select className="pq-input" value={f.size} onChange={(e) => set("size")(e.target.value)}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>)}
              </select>
            </Field>
            <Field label="Yearly household income" hint="before taxes">
              <input className="pq-input" inputMode="numeric" placeholder="$85,000" value={f.income ? Number(f.income).toLocaleString() : ""}
                onChange={(e) => set("income")(e.target.value.replace(/[^0-9]/g, ""))} />
            </Field>
          </div>
          <Field label="Owned a home in the last 3 years?">
            <Choice options={["no", "yes"]} value={f.first_time === "yes" ? "no" : "yes"}
              onChange={(v) => set("first_time")(v === "no" ? "yes" : "no")} />
          </Field>
          <Field label="Did your parents own a home?" hint="'no' unlocks first-generation programs">
            <Choice options={["no", "yes"]} value={f.first_generation === "yes" ? "yes" : "no"}
              onChange={(v) => set("first_generation")(v === "yes" ? "no" : "yes")} />
          </Field>
          <Field label="Veteran or active-duty service member?" hint="unlocks VA & CalVet pathways">
            <Choice options={["no", "yes"]} value={f.veteran} onChange={set("veteran")} />
          </Field>
          <button className="pq-cta full" disabled={!can2} onClick={() => setStep(3)}>Continue <ArrowRight size={17} /></button>
          {!can2 && <p className="pq-need">Add your income to continue.</p>}
        </>
      )}

      {step === 3 && (
        <>
          <Field label="Target home price" hint="a rough guess is fine — we'll show your real buying power">
            <input className="pq-input" inputMode="numeric" placeholder="$500,000" value={f.price ? Number(f.price).toLocaleString() : ""}
              onChange={(e) => set("price")(e.target.value.replace(/[^0-9]/g, ""))} />
          </Field>
          <Field label="Monthly debt payments" hint="cards, car, student loans — optional">
            <input className="pq-input" inputMode="numeric" placeholder="$400" value={f.debts ? Number(f.debts).toLocaleString() : ""}
              onChange={(e) => set("debts")(e.target.value.replace(/[^0-9]/g, ""))} />
          </Field>
          <Field label="Credit">
            <Choice options={Object.keys(CREDIT)} value={f.credit} onChange={set("credit")} />
          </Field>
          <Field label="Saved for a down payment?">
            <Choice options={Object.keys(SAVE)} value={f.savings} onChange={set("savings")} />
          </Field>
          <Field label="Finished a homebuyer education class?" hint="often required — it's free online">
            <Choice options={["no", "yes"]} value={f.education} onChange={set("education")} />
          </Field>
          <button className="pq-cta full" onClick={onFinish}>Unlock my results <ArrowRight size={17} /></button>
        </>
      )}
    </main>
  );
}

/* ---------------------------------------------------------------- Results */
function Ring({ score }) {
  const r = 34, C = 2 * Math.PI * r, off = C - (score / 100) * C;
  return (
    <svg className="pq-ring" viewBox="0 0 80 80" width="80" height="80" role="img" aria-label={`Opportunity score ${score} of 100`}>
      <circle cx="40" cy="40" r={r} className="pq-ring-bg" />
      <circle cx="40" cy="40" r={r} className="pq-ring-fg" strokeDasharray={C} strokeDashoffset={off} />
      <text x="40" y="45" className="pq-ring-num">{score}</text>
    </svg>
  );
}
function SaveBtn({ on, onClick }) {
  const Icon = on ? BookmarkCheck : Bookmark;
  return (
    <button className={"pq-save" + (on ? " on" : "")} onClick={onClick} aria-pressed={on} aria-label={on ? "Remove from saved" : "Save to my plan"}>
      <Icon size={15} /> {on ? "Saved" : "Save"}
    </button>
  );
}
function ProgramCard({ p, saved, toggleSave, muted, footer }) {
  const meta = SRC[p.src] || SRC.government;
  const Icon = meta.icon;
  return (
    <div className={"pq-card" + (muted ? " muted" : "")}>
      <div className="pq-card-top">
        <span className="pq-badge" style={{ "--c": meta.color }}><Icon size={12} /> {meta.label}</span>
        {p.est > 0 && <span className="pq-amt">{fmt(p.est)}</span>}
        {p.benefit.type === "tax_credit" && <span className="pq-amt sm">yearly tax credit</span>}
        {p.benefit.type === "financing" && <span className="pq-amt sm">{p.id === "va" ? "$0 down" : "low-rate loan"}</span>}
      </div>
      <h4 className="pq-card-name">{p.name}</h4>
      <p className="pq-card-blurb">{p.blurb}</p>
      <div className="pq-card-foot">
        <p className="pq-card-admin">{p.admin} · <span className="pq-verified-txt"><ShieldCheck size={11} /> verified {p.verified}</span></p>
        {toggleSave && <SaveBtn on={saved.includes(p.id)} onClick={() => toggleSave(p.id)} />}
      </div>
      {footer}
    </div>
  );
}
function Group({ title, note, children }) {
  return (
    <section className="pq-group">
      <div className="pq-group-head"><h3>{title}</h3><p>{note}</p></div>
      <div className="pq-cards">{children}</div>
    </section>
  );
}

function Results({ hh, r, saved, toggleSave, onEdit, onConnect, onHomes }) {
  const heroVal = r.totalAssist > 0 ? r.totalAssist : (r.bestBmr ? r.bestBmr.discount : 0);
  const opp = useCountUp(heroVal, true);
  const hasAny = r.eligible.length || r.watching.length || r.oneStep.length || r.homes.some((h) => h.flag === "bmr" && h.incomeOk);
  const powerGain = Math.max(r.power.withPQ - r.power.without, 0);
  return (
    <main className="pq-results">
      <button className="pq-back" onClick={onEdit}><ArrowLeft size={16} /> Edit my answers</button>

      {hasAny ? (
        <section className="pq-oppo">
          <div className="pq-oppo-key"><Keyhole size={54} /></div>
          <p className="pq-oppo-label">{r.totalAssist > 0 ? "Unlocked — based on your answers, you could combine" : "Unlocked — you qualify to buy"}</p>
          <div className="pq-oppo-num">{fmt(opp)}</div>
          <p className="pq-oppo-sub">
            {r.totalAssist > 0
              ? <>in assistance toward your home{r.bestBmr && <>, plus deed-restricted homes up to {fmt(r.bestBmr.discount)} below market</>}.</>
              : <>below market — a deed-restricted home at a reduced price.</>}
          </p>
          {r.power.budget > 0 && (
            <div className="pq-power">
              <div><span>Buying power on your own</span><strong>{fmtK(r.power.without)}</strong></div>
              <div className="pq-power-arrow"><ArrowRight size={16} /></div>
              <div className="pq-power-with"><span>With your PreQualy stack</span><strong>{fmtK(r.power.withPQ)}</strong></div>
              {powerGain > 5000 && <em>+{fmtK(powerGain)} further reach</em>}
            </div>
          )}
          <div className="pq-hos">
            <Ring score={r.hos.score} />
            <div>
              <strong>Homeownership Opportunity Score</strong>
              <span>Higher means more doors open. Homebuyer education{!hh.education && " (+8)"} and 3% saved{(hh.own_funds_pct || 0) < 0.03 && " (+7)"} raise it fastest.</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="pq-emptypage inpage">
          <h3>Let's widen the search</h3>
          <p>Nothing matched at these exact numbers, but small changes often help — a nearby city, a homebuyer class, or a different price point. Edit your answers and run it again.</p>
          <button className="pq-cta" onClick={onEdit}>Edit answers <ArrowRight size={16} /></button>
        </section>
      )}

      {r.stack.length > 0 && (
        <Group title="Your best combination" note="One main down-payment source, plus grants, closing help, financing tools, and tax credits that layer on top.">
          {r.stack.map((p) => <ProgramCard key={p.id} p={p} saved={saved} toggleSave={toggleSave} />)}
          {r.extra.length > 0 && (
            <p className="pq-extra"><Info size={13} /> Plus {r.extra.length} other eligible {r.extra.length === 1 ? "program" : "programs"} you could swap in for the main one — your matched pro helps you pick the best fit.</p>
          )}
        </Group>
      )}

      {r.extra.length > 0 && (
        <Group title="Also eligible" note="Alternatives to the main program above — you'd choose one, not stack them.">
          {r.extra.map((p) => <ProgramCard key={p.id} p={p} saved={saved} toggleSave={toggleSave} />)}
        </Group>
      )}

      {r.homes.some((h) => h.flag === "bmr" && h.incomeOk) && (
        <Group title="Below-market homes you qualify for" note="Deed-restricted homes sold at a reduced price to income-qualified buyers.">
          {r.homes.filter((h) => h.flag === "bmr" && h.incomeOk).map((h) => (
            <div className="pq-home" key={h.id}>
              <div className="pq-home-disc">{fmtK(h.discount)}<span>below market</span></div>
              <div className="pq-home-body">
                <h4>{h.address}</h4>
                <p><MapPin size={12} /> {h.city} · {h.beds} bed · {h.baths} bath</p>
                <p className="pq-home-price">{fmt(h.price)} <s>{fmt(h.market)}</s></p>
              </div>
            </div>
          ))}
          <button className="pq-ghost slim" onClick={onHomes}>See all flagged homes <ChevronRight size={15} /></button>
        </Group>
      )}

      {r.oneStep.length > 0 && (
        <Group title="One step away" note="Fixable in weeks, not years — finish the step and these unlock.">
          {r.oneStep.map((p) => (
            <ProgramCard key={p.id} p={p} saved={saved} toggleSave={toggleSave}
              footer={<p className="pq-unlock"><GraduationCap size={13} /> To unlock: {p.steps.join(" · ")}</p>} />
          ))}
        </Group>
      )}

      {r.watching.length > 0 && (
        <Group title="Worth watching" note="You qualify, but these aren't funding right now. Your dashboard flags them when they reopen.">
          {r.watching.map((p) => (
            <div className="pq-card muted" key={p.id}>
              <div className="pq-card-top">
                <span className="pq-badge watch"><Clock size={12} /> Reopens later</span>
                {p.est > 0 && <span className="pq-amt">{fmt(p.est)}</span>}
              </div>
              <h4 className="pq-card-name">{p.name}</h4>
              <p className="pq-card-blurb">{p.blurb}</p>
              <div className="pq-card-foot">
                <p className="pq-card-admin">{p.admin}</p>
                <SaveBtn on={saved.includes(p.id)} onClick={() => toggleSave(p.id)} />
              </div>
            </div>
          ))}
        </Group>
      )}

      {r.notEligible.length > 0 && (
        <Group title="Not a match right now" note="And exactly why — so nothing feels like a mystery.">
          {r.notEligible.map((p) => (
            <div className="pq-card muted" key={p.id}>
              <h4 className="pq-card-name dim">{p.name}</h4>
              <p className="pq-card-blurb">Requires you to {p.why}.</p>
            </div>
          ))}
        </Group>
      )}

      {hasAny && hh.price > 0 && (
        <section className="pq-monthly">
          <h3 className="pq-h3">What a {fmtK(hh.price)} home would cost monthly</h3>
          <div className="pq-monthly-row">
            <div><span>Without assistance</span><strong>{fmt(monthlyFor(hh.price, hh.own_funds_pct, 0))}/mo</strong></div>
            <div className="pq-monthly-with"><span>With your {fmtK(r.totalAssist)} stack</span><strong>{fmt(monthlyFor(hh.price, hh.own_funds_pct, r.totalAssist))}/mo</strong></div>
          </div>
          <p className="pq-fine">Estimate at 6.5% / 30-yr incl. taxes, insurance & MI. A lender confirms real numbers.</p>
        </section>
      )}

      {hasAny && (
        <section className="pq-connect-cta">
          <Keyhole size={34} glow={false} />
          <h3>Ready to move on one of these?</h3>
          <p>We'll connect you — free — with a verified lender or counselor certified in these exact programs in {hh.county} County.</p>
          <button className="pq-cta" onClick={onConnect}>Connect me with a pro <ArrowRight size={18} /></button>
        </section>
      )}
    </main>
  );
}

/* ---------------------------------------------------------------- Homes (discovery layer) */
function Homes({ hh, r, filter, setFilter, savedHomes, toggleSaveHome, onConnect }) {
  const homes = r.homes.filter((h) => {
    if (filter === "reach") return h.withinReach || (h.flag === "bmr" && h.incomeOk);
    if (filter === "bmr") return h.flag === "bmr";
    return true;
  });
  return (
    <main className="pq-results">
      <h2 className="pq-h2">Homes in {hh.county} County, flagged for you</h2>
      <p className="pq-formsub">
        Every listing carries a PreQualy flag based on your buying power of <strong>{fmtK(r.power.withPQ)}</strong> (with your {fmtK(r.totalAssist)} assistance stack). Sample inventory for the pilot — production syncs with MLS daily.
      </p>
      <div className="pq-filters" role="group" aria-label="Filter homes">
        {[["all", "All homes"], ["reach", "Within my reach"], ["bmr", "Below-market only"]].map(([k, l]) => (
          <button key={k} className={"pq-chip" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      <div className="pq-cards">
        {homes.length === 0 && <p className="pq-formsub">No homes match this filter yet — try "All homes," or edit your profile to widen the search.</p>}
        {homes.map((h) => {
          const bmrOk = h.flag === "bmr" && h.incomeOk;
          const bmrNo = h.flag === "bmr" && !h.incomeOk;
          return (
            <div className="pq-listing" key={h.id}>
              <div className="pq-listing-head">
                <div>
                  <h4>{h.address}</h4>
                  <p><MapPin size={12} /> {h.city} · {h.beds} bd · {h.baths} ba · {h.sqft.toLocaleString()} sqft</p>
                </div>
                <div className="pq-listing-price">
                  <strong>{fmt(h.price)}</strong>
                  {h.market && <s>{fmt(h.market)}</s>}
                </div>
              </div>
              <div className="pq-flags">
                {bmrOk && <span className="pq-flag good"><Tag size={11} /> Income-restricted — you qualify · {fmtK(h.discount)} below market</span>}
                {bmrNo && <span className="pq-flag bad"><Tag size={11} /> Income-restricted — over the {fmtK(h.cap)} limit</span>}
                {h.flag === "new_construction" && <span className="pq-flag build"><Building2 size={11} /> New construction · builder credits</span>}
                {h.flag !== "bmr" && h.withoutHelp && <span className="pq-flag good"><Check size={11} /> Affordable even without assistance</span>}
                {h.flag !== "bmr" && !h.withoutHelp && h.withinReach && <span className="pq-flag reach"><Keyhole size={12} glow={false} /> Within reach with your assistance stack</span>}
                {h.flag !== "bmr" && !h.withinReach && <span className="pq-flag bad"><Info size={11} /> Above your current buying power</span>}
                {h.cityMatch && <span className="pq-flag city"><MapPin size={11} /> Your target area</span>}
              </div>
              <p className="pq-listing-note">{h.note} · est. <strong>{fmt(h.monthly)}/mo</strong>{h.flag !== "bmr" && r.totalAssist > 0 && " with assistance"}</p>
              <div className="pq-card-foot">
                <button className="pq-ghost slim" onClick={onConnect}>Ask a pro about this home</button>
                <SaveBtn on={savedHomes.includes(h.id)} onClick={() => toggleSaveHome(h.id)} />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- Dashboard */
function Dashboard({ hh, r, saved, toggleSave, savedHomes, plan, planDone, togglePlan, referral, onConnect, onPrograms }) {
  const savedProgs = PROGRAMS.filter((p) => saved.includes(p.id)).map((p) => r.eligible.concat(r.oneStep, r.watching, r.extra || []).find((x) => x.id === p.id) || { ...p, est: estimateBenefit(p, hh.price || 500000) });
  const savedHomeObjs = r.homes.filter((h) => savedHomes.includes(h.id));
  const doneCount = plan.filter((s) => planDone.includes(s.id)).length;
  const pct = plan.length ? Math.round((doneCount / plan.length) * 100) : 0;
  return (
    <main className="pq-results">
      <h2 className="pq-h2">My homeownership plan</h2>
      <p className="pq-formsub">{hh.city}, {hh.county} County · household of {hh.size} · {fmt(hh.income || 0)}/yr</p>

      <section className="pq-dash-stats">
        <div><strong>{r.eligible.length}</strong><span>eligible programs</span></div>
        <div><strong>{fmtK(r.totalAssist)}</strong><span>assistance stack</span></div>
        <div><strong>{r.hos.score}</strong><span>opportunity score</span></div>
        <div><strong>{fmtK(r.power.withPQ)}</strong><span>buying power</span></div>
      </section>

      <section className="pq-group">
        <div className="pq-group-head">
          <h3>Action plan — {pct}% complete</h3>
          <p>Built from your answers. Check items off as you go; your matched pro sees the same list.</p>
        </div>
        <div className="pq-progress"><div className="pq-progress-fill" style={{ width: pct + "%" }} /></div>
        <div className="pq-cards">
          {plan.map((s) => {
            const done = planDone.includes(s.id);
            return (
              <button key={s.id} className={"pq-plan-item" + (done ? " done" : "")} onClick={() => togglePlan(s.id)} aria-pressed={done}>
                <span className="pq-plan-check">{done && <Check size={14} />}</span>
                <span className="pq-plan-body">
                  <strong>{s.label}</strong>
                  <em>{s.why}</em>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="pq-group">
        <div className="pq-group-head">
          <h3>Referral status</h3>
          <p>Where things stand with your professional match.</p>
        </div>
        {referral ? (
          <div className="pq-timeline">
            <div className="pq-tl-item on"><span /><div><strong>Request sent</strong><em>Profile shared with {referral.pro.name} ({referral.pro.org}) with your consent</em></div></div>
            <div className="pq-tl-item on"><span /><div><strong>Matched</strong><em>{referral.pro.role} certified in your {hh.county} County programs</em></div></div>
            <div className="pq-tl-item"><span /><div><strong>First conversation</strong><em>{referral.pro.name.split(" ")[0]} reaches out within 1 business day</em></div></div>
            <div className="pq-tl-item"><span /><div><strong>Pre-approval with your stack</strong><em>Your assistance programs get underwritten into the offer</em></div></div>
          </div>
        ) : (
          <div className="pq-card muted">
            <p className="pq-card-blurb">No pro connected yet. When you're ready, we match you free with someone certified in your exact programs.</p>
            <button className="pq-ghost slim" onClick={onConnect}>Find my match <ChevronRight size={15} /></button>
          </div>
        )}
      </section>

      <section className="pq-group">
        <div className="pq-group-head">
          <h3>Saved programs ({savedProgs.length})</h3>
          <p>{savedProgs.length ? "You and your pro work from this shortlist." : "Tap 'Save' on any program to build your shortlist."}</p>
        </div>
        <div className="pq-cards">
          {savedProgs.map((p) => <ProgramCard key={p.id} p={p} saved={saved} toggleSave={toggleSave} />)}
          {!savedProgs.length && <button className="pq-ghost slim" onClick={onPrograms}>Browse my matches <ChevronRight size={15} /></button>}
        </div>
      </section>

      {savedHomeObjs.length > 0 && (
        <section className="pq-group">
          <div className="pq-group-head"><h3>Saved homes ({savedHomeObjs.length})</h3><p>Flagged listings you're tracking.</p></div>
          <div className="pq-cards">
            {savedHomeObjs.map((h) => (
              <div className="pq-home" key={h.id}>
                <div className="pq-home-disc">{h.discount > 0 ? <>{fmtK(h.discount)}<span>below market</span></> : <>{fmt(h.monthly)}<span>est. / month</span></>}</div>
                <div className="pq-home-body">
                  <h4>{h.address}</h4>
                  <p><MapPin size={12} /> {h.city} · {h.beds} bed</p>
                  <p className="pq-home-price">{fmt(h.price)} {h.market && <s>{fmt(h.market)}</s>}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {r.watching.length > 0 && (
        <section className="pq-group">
          <div className="pq-group-head"><h3><Bell size={16} style={{ verticalAlign: "-2px" }} /> Watching for you</h3><p>We flag these the moment funding reopens.</p></div>
          <div className="pq-cards">
            {r.watching.map((p) => (
              <div className="pq-card muted" key={p.id}>
                <div className="pq-card-top">
                  <span className="pq-badge watch"><Clock size={12} /> Reopens later</span>
                  {p.est > 0 && <span className="pq-amt">{fmt(p.est)}</span>}
                </div>
                <h4 className="pq-card-name">{p.name}</h4>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/* ---------------------------------------------------------------- Connect */
function Connect({ hh, r, consent, setConsent, referral, setReferral, onBack }) {
  const pros = PROS[hh.county] || [];
  const [picked, setPicked] = useState(0);
  if (referral) {
    const pro = referral.pro;
    return (
      <main className="pq-connectpage">
        <div className="pq-done">
          <div className="pq-done-check"><Check size={30} /></div>
          <h2>You're connected</h2>
          <p><strong>{pro.name}</strong> at {pro.org} has your profile and your {r.eligible.length} program matches. Expect a call or email within one business day.</p>
          <p className="pq-done-note">Track everything under <strong>My plan</strong>. You can withdraw consent anytime — your data is never sold.</p>
        </div>
      </main>
    );
  }
  return (
    <main className="pq-connectpage">
      <button className="pq-back" onClick={onBack}><ArrowLeft size={16} /> Back to results</button>
      <h2 className="pq-h2">Verified pros in {hh.county} County</h2>
      <p className="pq-formsub">Every pro is vetted and certified in the programs you matched. Always free for you — pros pay PreQualy for qualified introductions, never the buyer.</p>
      {pros.map((pro, i) => (
        <button key={pro.name + pro.role} className={"pq-pro" + (picked === i ? " picked" : "")} onClick={() => setPicked(i)} aria-pressed={picked === i}>
          <div className="pq-pro-avatar">{pro.name.split(" ").map((x) => x[0]).join("")}</div>
          <div className="pq-pro-info">
            <h4>{pro.name} <span className="pq-role">{pro.role}</span></h4>
            <p>{pro.org}</p>
            <p className="pq-pro-langs"><Users size={12} /> {pro.langs} · <Star size={12} /> {pro.rating} · {pro.deals} families helped</p>
          </div>
          <span className="pq-verified"><ShieldCheck size={12} /> Verified</span>
        </button>
      ))}
      <label className="pq-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>Share my profile and program matches with <strong>{pros[picked]?.name}</strong> so they can help me. I can withdraw anytime, and my information is never sold.</span>
      </label>
      <button className="pq-cta full" disabled={!consent} onClick={() => setReferral({ pro: pros[picked], at: Date.now() })}>
        Send my request <ArrowRight size={18} />
      </button>
    </main>
  );
}

/* ---------------------------------------------------------------- Resources */
function Resources({ onStart }) {
  return (
    <main className="pq-results">
      <h2 className="pq-h2">Free resources</h2>
      <p className="pq-formsub">The essentials most buyers wish they'd known sooner — no signup needed.</p>
      <div className="pq-cards">
        {RESOURCES.map((res) => (
          <div className="pq-card" key={res.title}>
            <div className="pq-card-top">
              <span className="pq-badge" style={{ "--c": "var(--teal)" }}><GraduationCap size={12} /> {res.tag}</span>
            </div>
            <h4 className="pq-card-name">{res.title}</h4>
            <p className="pq-card-blurb">{res.desc}</p>
          </div>
        ))}
      </div>
      <section className="pq-connect-cta">
        <Keyhole size={34} glow={false} />
        <h3>Two minutes to see what's yours</h3>
        <p>Free, no credit pull, nothing shared without your consent.</p>
        <button className="pq-cta" onClick={onStart}>Check my eligibility <ArrowRight size={18} /></button>
      </section>
    </main>
  );
}

/* =====================================================================
  BRAND CSS — deep navy, glowing keyhole cyan, teal actions.
  Display: Plus Jakarta Sans · Body: Inter */
const CSS = `
:root{
  --navy:#0A2540; --navy-2:#143A5C; --cyan:#2BE3E0; --cyan-soft:#DFF8F8;
  --teal:#0E7C86; --teal-dark:#208d94; --mist:#E9F5F7; --bg:#FFFFFF;
  --panel:#F5FAFB; --shadow:0 1px 3px rgba(10,37,64,.06),0 8px 22px rgba(10,37,64,.05);
  --surface:#FFFFFF; --line:#E3EEF1; --ink:#16324A; --muted:#282d80;
  --good:#0E8A5F; --good-soft:#E3F4EC; --amber-ink:#8A6116; --amber-soft:#FBF1DC;
  --bad:#A34040; --bad-soft:#F9E9E9;
}
*{box-sizing:border-box}
.pq-root{min-height:100vh;background:var(--bg);color:var(--ink);
  font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.5;
  display:flex;flex-direction:column}
button{font-family:inherit}
:focus-visible{outline:2.5px solid var(--teal);outline-offset:2px;border-radius:6px}

/* keyhole mark glow */
.pq-key.glow circle:nth-of-type(2), .pq-key.glow path:nth-of-type(2){filter:drop-shadow(0 0 5px var(--cyan))}

/* header */
.pq-head{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.9);backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 18px;gap:10px}
.pq-brand{display:flex;align-items:center;gap:8px;background:none;border:0;cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:19px;color:var(--navy);letter-spacing:-.01em}
.pq-brand b{color:var(--teal)}
.pq-nav{display:flex;gap:4px}
.pq-navbtn{display:flex;align-items:center;gap:5px;background:none;border:0;cursor:pointer;
  font-size:13px;font-weight:600;color:var(--muted);padding:8px 11px;border-radius:0}
.pq-navbtn.on{color:var(--teal-dark);}
.pq-navbtn:hover{color:var(--teal-dark)}
.pq-navlabel{
  display:inline-block;
  padding-bottom:3px;
}
.pq-navlabel.on{
  border-bottom:2px solid var(--teal-dark);
}
.pq-logo{
  height:44px;
  width:auto;
  display:block;
}
@media(max-width:560px){.pq-navbtn span{display:none}.pq-navbtn{padding:8px}}

/* landing */
.pq-landing{flex:1;width:100%;max-width:960px;margin:0 auto;padding:42px 22px 34px}
.pq-hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:24px;align-items:center;margin-bottom:44px}
@media(max-width:700px){.pq-hero-grid{grid-template-columns:1fr}.pq-hero-art{order:-1;min-height:190px}}
.pq-eyebrow{font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin:0 0 14px}
.pq-hero{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(30px,5.5vw,44px);line-height:1.14;
  letter-spacing:-.02em;color:var(--navy);margin:0 0 16px}
.pq-hero em{font-style:normal;color:var(--teal)}
.pq-sub{font-size:16px;color:#3E5666;line-height:1.65;margin:0 0 24px;max-width:520px}
.pq-hero-ctas{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}
.pq-cta{display:inline-flex;align-items:center;gap:8px;background:var(--teal);color:#fff;border:0;
  border-radius:999px;padding:14px 26px;font-size:15.5px;font-weight:700;cursor:pointer;
  box-shadow:0 4px 14px rgba(14,124,134,.24);transition:background .15s}
.pq-cta:hover{background:var(--teal-dark)}
.pq-cta:disabled{opacity:.45;cursor:not-allowed}
.pq-cta.full{width:100%;justify-content:center;margin-top:8px}
.pq-ghost{display:inline-flex;align-items:center;gap:6px;background:#fff;color:var(--teal-dark);
  border:1.5px solid var(--line);border-radius:999px;padding:13px 22px;font-size:14.5px;font-weight:700;cursor:pointer}
.pq-ghost:hover{border-color:var(--teal)}
.pq-ghost.slim{padding:9px 16px;font-size:13px;align-self:flex-start;margin-top:14px}
.pq-trust{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;font-weight:600;color:var(--muted)}
.pq-trust span{display:inline-flex;align-items:center;gap:5px}
.pq-hero-art{position:relative;display:flex;align-items:center;justify-content:center;min-height:250px}
.pq-hero-glow{position:absolute;width:300px;height:300px;border-radius:50%;
  background:radial-gradient(circle,rgba(43,227,224,.30),rgba(43,227,224,.07) 55%,transparent 72%)}

.pq-problem{background:var(--panel);border:1px solid var(--line);border-radius:24px;padding:30px 26px;margin-bottom:38px;text-align:center}
.pq-problem h2{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:21px;color:var(--navy);margin:0 0 24px}
.pq-prob-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:18px}
.pq-icircle{width:52px;height:52px;border-radius:50%;background:#fff;border:1px solid var(--line);
  display:inline-grid;place-items:center;color:var(--teal);margin:0 auto 10px;box-shadow:var(--shadow)}
.pq-icircle.big{width:56px;height:56px}
.pq-prob-item h3{font-size:14.5px;font-weight:700;color:var(--navy);margin:0 0 5px}
.pq-prob-item p{font-size:12.5px;color:var(--muted);line-height:1.55;margin:0}

.pq-how{margin:0 0 38px}
.pq-how h2{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:22px;text-align:center;color:var(--navy);margin:0 0 20px}
.pq-how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
.pq-how-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:var(--shadow)}
.pq-how-k{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;
  background:var(--mist);color:var(--teal-dark);font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:14px;margin-bottom:10px}
.pq-how-card h3{font-size:15px;font-weight:700;margin:0 0 6px;color:var(--navy)}
.pq-how-card p{font-size:13px;color:var(--muted);line-height:1.55;margin:0}

.pq-two{display:grid;grid-template-columns:1fr 1.15fr;gap:14px;margin-bottom:38px}
@media(max-width:640px){.pq-two{grid-template-columns:1fr}}
.pq-opp-card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:var(--shadow);
  display:flex;flex-direction:column;align-items:flex-start}
.pq-opp-label{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 6px}
.pq-opp-card h3{font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;color:var(--navy);margin:0 0 6px}
.pq-opp-est{font-size:11px;font-weight:700;color:var(--muted);margin:10px 0 2px;text-transform:uppercase;letter-spacing:.05em}
.pq-opp-amt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:30px;color:var(--teal-dark);line-height:1.1}
.pq-opp-amt.sm{font-size:22px}
.pq-opp-amt span{font-size:13px;font-weight:600;color:var(--muted)}
.pq-interest{background:var(--mist);border-radius:20px;padding:28px 26px;text-align:center}
.pq-interest h3{font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;font-weight:800;color:var(--navy);margin:12px 0 8px}
.pq-interest p{font-size:13.5px;color:#3E5666;line-height:1.5;margin:0 0 16px}
.pq-interest-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.pq-interest-row .pq-input{flex:1;min-width:200px;border-radius:999px;padding:12px 18px;background:#fff}
.pq-joined{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:14px;color:var(--good) !important}
.pq-privacy{font-size:11.5px !important;color:var(--muted) !important;margin:12px 0 0 !important}
.pq-join-error{font-size:12.5px !important;font-weight:600;color:var(--bad) !important;margin:10px 0 0 !important}

.pq-proof{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;background:#fff;
  border:1px solid var(--line);border-radius:20px;padding:24px 20px;text-align:center;box-shadow:var(--shadow)}
.pq-proof strong{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:26px;color:var(--teal-dark)}
.pq-proof span{font-size:12px;color:var(--muted);font-weight:600}

/* generic page shells */
.pq-form,.pq-results,.pq-connectpage{flex:1;width:100%;max-width:640px;margin:0 auto;padding:26px 20px 44px}
.pq-back{display:inline-flex;align-items:center;gap:6px;background:none;border:0;cursor:pointer;
  font-size:13.5px;font-weight:600;color:var(--muted);padding:4px 0;margin-bottom:14px}
.pq-back:hover{color:var(--teal-dark)}
.pq-h2{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:26px;color:var(--navy);letter-spacing:-.01em;margin:0 0 6px}
.pq-h3{font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:19px;color:var(--navy);margin:0 0 4px}
.pq-formsub{font-size:14px;color:var(--muted);line-height:1.55;margin:0 0 20px}
.pq-need{font-size:13px;color:var(--muted);text-align:center;margin:10px 0 0}
.pq-fine{font-size:12px;color:var(--muted);margin:10px 0 0}

/* wizard */
.pq-steps{display:flex;align-items:center;gap:6px;margin-bottom:16px}
.pq-step-dot{width:26px;height:5px;border-radius:3px;background:var(--line)}
.pq-step-dot.on{background:var(--teal)}
.pq-step-txt{font-size:12px;font-weight:600;color:var(--muted);margin-left:6px}
.pq-field{display:block;margin-bottom:16px}
.pq-label{display:block;font-size:13.5px;font-weight:600;color:var(--navy);margin-bottom:7px}
.pq-label em{font-style:normal;font-weight:500;color:var(--muted);margin-left:6px;font-size:12.5px}
.pq-input{width:100%;background:var(--surface);border:1.5px solid var(--line);border-radius:11px;
  padding:12px 14px;font-size:15px;font-family:inherit;color:var(--ink)}
.pq-input:focus{border-color:var(--teal);outline:none}
.pq-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:460px){.pq-row{grid-template-columns:1fr}}
.pq-choice{display:flex;gap:8px;flex-wrap:wrap}
.pq-chip{background:var(--surface);border:1.5px solid var(--line);border-radius:999px;padding:9px 17px;
  font-size:13.5px;font-weight:600;color:var(--ink);cursor:pointer;transition:all .12s}
.pq-chip.on{background:var(--navy);border-color:var(--navy);color:var(--cyan)}
.pq-chip:hover:not(.on){border-color:var(--teal)}
.pq-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}

/* results hero */
.pq-oppo{background:var(--navy);border-radius:24px;padding:30px 24px 26px;text-align:center;
  margin-bottom:26px;position:relative;overflow:hidden}
.pq-oppo:before{content:"";position:absolute;top:-70px;left:50%;transform:translateX(-50%);
  width:340px;height:220px;background:radial-gradient(ellipse,rgba(40,225,222,.22),transparent 65%);pointer-events:none}
.pq-oppo-key{margin-bottom:6px}
.pq-oppo-label{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9FC4CF;margin:0 0 6px}
.pq-oppo-num{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:clamp(40px,9vw,56px);color:var(--cyan);
  letter-spacing:-.02em;text-shadow:0 0 26px rgba(40,225,222,.4)}
.pq-oppo-sub{font-size:14.5px;color:#C7DBE2;line-height:1.55;max-width:420px;margin:8px auto 0}
.pq-power{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:14px;
  padding:14px 16px;margin:18px auto 0;max-width:460px}
.pq-power div{text-align:center}
.pq-power span{display:block;font-size:11px;font-weight:600;color:#9FC4CF;text-transform:uppercase;letter-spacing:.04em}
.pq-power strong{font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;color:#E8F4F6}
.pq-power-with strong{color:var(--cyan)}
.pq-power-arrow{color:#9FC4CF;display:flex}
.pq-power em{flex-basis:100%;font-style:normal;font-size:12.5px;font-weight:600;color:var(--cyan)}
.pq-hos{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px 16px;margin:14px auto 0;
  max-width:460px;text-align:left}
.pq-hos strong{display:block;font-size:13.5px;color:#E8F4F6;margin-bottom:2px}
.pq-hos span{font-size:12px;color:#9FC4CF;line-height:1.5}
.pq-ring{flex-shrink:0}
.pq-ring-bg{fill:none;stroke:rgba(255,255,255,.14);stroke-width:7}
.pq-ring-fg{fill:none;stroke:var(--cyan);stroke-width:7;stroke-linecap:round;
  transform:rotate(-90deg);transform-origin:center;transition:stroke-dashoffset .8s ease}
.pq-ring-num{fill:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:21px;text-anchor:middle}

/* groups + program cards */
.pq-group{margin-bottom:26px}
.pq-group-head{margin-bottom:12px}
.pq-group-head h3{font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:19px;color:var(--navy);margin:0 0 3px}
.pq-group-head p{font-size:13px;color:var(--muted);margin:0;line-height:1.45}
.pq-cards{display:flex;flex-direction:column;gap:11px}
.pq-card{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:var(--shadow)}
.pq-card.muted{background:#F2F6F7}
.pq-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;gap:10px}
.pq-badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--c);
  background:color-mix(in srgb,var(--c) 11%,#fff);padding:4px 10px;border-radius:999px}
.pq-badge.watch{color:var(--amber-ink);background:var(--amber-soft)}
.pq-amt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:18px;color:var(--teal-dark);white-space:nowrap}
.pq-amt.sm{font-size:12.5px;font-family:Inter;font-weight:700}
.pq-card-name{font-size:15.5px;font-weight:700;color:var(--navy);margin:0 0 4px}
.pq-card-name.dim{color:var(--muted);font-weight:600}
.pq-card-blurb{font-size:13.5px;color:#33484F;line-height:1.5;margin:0 0 8px}
.pq-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px}
.pq-card-admin{font-size:12px;color:var(--muted);margin:0}
.pq-verified-txt{display:inline-flex;align-items:center;gap:3px;color:var(--good)}
.pq-save{display:inline-flex;align-items:center;gap:5px;background:none;border:1.5px solid var(--line);
  border-radius:999px;padding:6px 13px;font-size:12.5px;font-weight:600;color:var(--muted);cursor:pointer;flex-shrink:0}
.pq-save.on{color:var(--teal-dark);border-color:var(--teal);background:var(--mist)}
.pq-extra{display:flex;align-items:flex-start;gap:6px;font-size:12.5px;color:var(--muted);line-height:1.45;margin:4px 2px 0}
.pq-extra svg{flex-shrink:0;margin-top:2px;color:var(--teal)}
.pq-unlock{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--teal-dark);
  background:var(--mist);border-radius:9px;padding:8px 10px;margin:8px 0 0}

/* home cards + listings */
.pq-home{display:flex;background:var(--surface);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:var(--shadow)}
.pq-home-disc{background:var(--cyan-soft);color:var(--teal-dark);font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;
  font-size:18px;display:flex;flex-direction:column;justify-content:center;align-items:center;
  padding:0 14px;min-width:118px;text-align:center}
.pq-home-disc span{font-family:Inter;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}
.pq-home-body{padding:14px}
.pq-home-body h4{font-size:15px;font-weight:700;color:var(--navy);margin:0 0 4px}
.pq-home-body p{font-size:12.5px;color:var(--muted);display:flex;align-items:center;gap:4px;margin:0 0 3px}
.pq-home-price{font-size:15px !important;color:var(--ink) !important;font-weight:700}
.pq-home-price s{color:var(--muted);font-weight:400;margin-left:6px}
.pq-listing{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:var(--shadow)}
.pq-listing-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px}
.pq-listing-head h4{font-size:15.5px;font-weight:700;color:var(--navy);margin:0 0 4px}
.pq-listing-head p{font-size:12.5px;color:var(--muted);display:flex;align-items:center;gap:4px;margin:0}
.pq-listing-price{text-align:right}
.pq-listing-price strong{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;color:var(--navy)}
.pq-listing-price s{font-size:12.5px;color:var(--muted)}
.pq-flags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}
.pq-flag{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;
  padding:4px 10px;border-radius:999px;background:var(--mist);color:var(--teal-dark)}
.pq-flag.good{background:var(--good-soft);color:var(--good)}
.pq-flag.bad{background:var(--bad-soft);color:var(--bad)}
.pq-flag.reach{background:var(--cyan-soft);color:var(--teal-dark)}
.pq-flag.build{background:var(--amber-soft);color:var(--amber-ink)}
.pq-flag.city{background:#EDF1F6;color:var(--navy-2)}
.pq-listing-note{font-size:13px;color:#33484F;margin:0 0 10px}

/* monthly compare */
.pq-monthly{background:var(--mist);border-radius:16px;padding:20px;margin:4px 0 24px}
.pq-monthly-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}
.pq-monthly-row div{flex:1;min-width:180px;background:#fff;border-radius:12px;padding:13px 15px}
.pq-monthly-row span{display:block;font-size:11.5px;font-weight:600;color:var(--muted);
  text-transform:uppercase;letter-spacing:.03em;margin-bottom:3px}
.pq-monthly-row strong{font-family:'Plus Jakarta Sans',sans-serif;font-size:19px;color:var(--navy)}
.pq-monthly-with strong{color:var(--teal-dark)}
.pq-monthly-with{border:1.5px solid var(--teal)}

/* dashboard */
.pq-dash-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:26px}
.pq-dash-stats div{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 12px;text-align:center}
.pq-dash-stats strong{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:21px;color:var(--teal-dark)}
.pq-dash-stats span{font-size:11.5px;color:var(--muted);font-weight:600}
.pq-progress{height:7px;border-radius:4px;background:var(--line);margin-bottom:12px;overflow:hidden}
.pq-progress-fill{height:100%;background:linear-gradient(90deg,var(--teal),var(--cyan));border-radius:4px;transition:width .4s ease}
.pq-plan-item{display:flex;gap:12px;align-items:flex-start;text-align:left;background:var(--surface);
  border:1px solid var(--line);border-radius:13px;padding:13px 14px;cursor:pointer;width:100%}
.pq-plan-item.done{background:#F2F6F7}
.pq-plan-check{width:22px;height:22px;border-radius:7px;border:2px solid var(--line);flex-shrink:0;
  display:grid;place-items:center;color:#fff;margin-top:1px}
.pq-plan-item.done .pq-plan-check{background:var(--good);border-color:var(--good)}
.pq-plan-body strong{display:block;font-size:14px;color:var(--navy);margin-bottom:2px}
.pq-plan-item.done .pq-plan-body strong{text-decoration:line-through;color:var(--muted)}
.pq-plan-body em{font-style:normal;font-size:12.5px;color:var(--muted);line-height:1.45}
.pq-timeline{display:flex;flex-direction:column;gap:0;padding-left:4px}
.pq-tl-item{display:flex;gap:12px;padding-bottom:18px;position:relative}
.pq-tl-item span{width:14px;height:14px;border-radius:50%;background:var(--line);flex-shrink:0;margin-top:3px;position:relative;z-index:1}
.pq-tl-item.on span{background:var(--teal);box-shadow:0 0 0 3px var(--cyan-soft)}
.pq-tl-item:not(:last-child):before{content:"";position:absolute;left:6px;top:17px;bottom:-3px;width:2px;background:var(--line)}
.pq-tl-item strong{display:block;font-size:13.5px;color:var(--navy)}
.pq-tl-item em{font-style:normal;font-size:12.5px;color:var(--muted);line-height:1.45}

/* connect */
.pq-pro{display:flex;align-items:center;gap:13px;background:var(--surface);border:1.5px solid var(--line);
  border-radius:15px;padding:16px;margin-bottom:12px;position:relative;width:100%;text-align:left;cursor:pointer}
.pq-pro.picked{border-color:var(--teal);background:var(--mist)}
.pq-pro-avatar{width:48px;height:48px;border-radius:12px;background:var(--navy);color:var(--cyan);
  display:grid;place-items:center;font-weight:700;font-size:15px;flex-shrink:0;font-family:'Plus Jakarta Sans',sans-serif}
.pq-pro-info{flex:1}
.pq-pro h4{font-size:15.5px;font-weight:700;color:var(--navy);margin:0 0 2px}
.pq-role{font-size:11px;font-weight:700;color:var(--teal-dark);background:var(--cyan-soft);
  border-radius:6px;padding:2px 7px;margin-left:6px;vertical-align:1px}
.pq-pro p{font-size:13px;color:var(--muted);margin:0}
.pq-pro-langs{display:flex;align-items:center;gap:5px;margin-top:4px !important;flex-wrap:wrap}
.pq-verified{position:absolute;top:14px;right:14px;display:inline-flex;align-items:center;gap:4px;
  font-size:11px;font-weight:700;color:var(--good);background:var(--good-soft);padding:4px 8px;border-radius:7px}
.pq-consent{display:flex;gap:11px;align-items:flex-start;background:var(--surface);border:1px solid var(--line);
  border-radius:13px;padding:14px;margin:16px 0;cursor:pointer}
.pq-consent input{margin-top:2px;width:18px;height:18px;accent-color:var(--teal);flex-shrink:0}
.pq-consent span{font-size:13.5px;color:#33484F;line-height:1.5}
.pq-done{text-align:center;padding:36px 16px}
.pq-done-check{width:64px;height:64px;border-radius:50%;background:var(--teal);color:#fff;display:grid;place-items:center;margin:0 auto 18px}
.pq-done h2{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:26px;color:var(--navy);margin:0 0 10px}
.pq-done p{font-size:15px;color:#33484F;line-height:1.55;margin:0 auto 12px;max-width:400px}
.pq-done-note{font-size:13.5px !important;color:var(--muted) !important}

/* connect cta + empty */
.pq-connect-cta{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:26px;text-align:center;margin-top:8px}
.pq-connect-cta h3{font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:21px;color:var(--navy);margin:10px 0 6px}
.pq-connect-cta p{font-size:14px;color:var(--muted);line-height:1.5;margin:0 0 16px}
.pq-emptypage{flex:1;width:100%;max-width:480px;margin:0 auto;padding:60px 20px;text-align:center}
.pq-emptypage.inpage{padding:36px 16px;max-width:none;flex:none}
.pq-emptypage h2,.pq-emptypage h3{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:24px;color:var(--navy);margin:14px 0 10px}
.pq-emptypage p{font-size:14.5px;color:var(--muted);line-height:1.6;margin:0 0 20px}

/* footer */
.pq-foot{border-top:1px solid var(--line);background:var(--surface);margin-top:auto}
.pq-foot-in{max-width:880px;margin:0 auto;padding:22px 20px}
.pq-foot-in p{font-size:12.5px;color:var(--muted);line-height:1.55;margin:0 0 8px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.pq-foot-in p:first-child{font-size:13.5px;color:var(--navy)}
.pq-foot-links{gap:8px}
.pq-foot-links button{background:none;border:0;color:var(--teal-dark);font-weight:600;font-size:12.5px;cursor:pointer;padding:0}


/* motion */
@media(prefers-reduced-motion:no-preference){
  .pq-fade{opacity:0;transform:translateY(16px);transition:opacity .55s ease,transform .55s ease}
  .pq-fade.in{opacity:1;transform:none}
  .pq-cta{transition:background .15s,transform .15s,box-shadow .15s}
  .pq-cta:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 18px rgba(14,124,134,.32)}
  .pq-cta svg{transition:transform .15s}
  .pq-cta:hover:not(:disabled) svg{transform:translateX(3px)}
  .pq-ghost{transition:border-color .15s,transform .15s}
  .pq-ghost:hover{transform:translateY(-1px)}
}
.pq-float{animation:pqfloat 6s ease-in-out infinite}
.pq-hero-glow.pulse{animation:pqpulse 5s ease-in-out infinite}
@keyframes pqfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pqpulse{0%,100%{opacity:.72;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
@keyframes pqorbit{from{transform:rotate(0deg) translate(var(--r)) rotate(0deg)}to{transform:rotate(360deg) translate(var(--r)) rotate(-360deg)}}

/* tri-sector */
.pq-tri{display:grid;grid-template-columns:1.05fr .95fr;gap:26px;align-items:center;background:#fff;
  border:1px solid var(--line);border-radius:24px;padding:32px 30px;margin-bottom:38px;box-shadow:var(--shadow)}
@media(max-width:700px){.pq-tri{grid-template-columns:1fr;padding:26px 20px}}
.pq-tri h2{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:24px;color:var(--navy);margin:0 0 12px;line-height:1.22}
.pq-tri h2 em{font-style:normal;color:var(--teal)}
.pq-tri-copy>p{font-size:14px;color:#3E5666;line-height:1.6;margin:0 0 14px}
.pq-tri-list{list-style:none;padding:0;margin:0 0 16px;display:flex;flex-direction:column;gap:8px}
.pq-tri-list li{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--ink)}
.pq-tri-list svg{color:var(--good);flex-shrink:0}
.pq-tri-goal{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;background:var(--panel);
  border:1px solid var(--line);border-radius:14px;padding:12px 16px;font-size:12px;color:var(--muted);align-items:center}
.pq-tri-goal strong{font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;color:var(--teal-dark);white-space:nowrap}
.pq-orbit{--r:132px;position:relative;width:340px;height:340px;margin:0 auto;flex-shrink:0}
@media(max-width:420px){.pq-orbit{--r:102px;width:266px;height:266px}}
.pq-orbit-dash{position:absolute;inset:26px;border:1.5px dashed #BFDCE2;border-radius:50%}
.pq-orbit-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center}
.pq-orbit-center span{font-size:12px;font-weight:800;color:var(--navy)}
.pq-orbit-node{position:absolute;top:50%;left:50%;margin:-38px 0 0 -37px;width:74px;display:flex;flex-direction:column;
  align-items:center;gap:4px;text-align:center;animation:pqorbit 46s linear infinite}
.pq-orbit-node .pq-icircle{margin:0;width:44px;height:44px}
.pq-orbit-node em{font-style:normal;font-size:10px;font-weight:700;color:var(--muted);line-height:1.25;
  background:rgba(255,255,255,.92);border-radius:8px;padding:2px 5px}

@media(prefers-reduced-motion:reduce){*{transition:none !important;animation:none !important}}
`;