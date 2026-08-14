
// export default App
import React, { useState, useEffect, useMemo, useRef } from "react";
import Home from "./Home";
import "./Landing.css";
import {
  Check, MapPin, ArrowRight, ArrowLeft, ShieldCheck, Landmark,
  Building2, Users, Info, Clock, Tag, HeartHandshake, BadgeCheck, Star,
  Bookmark, BookmarkCheck, GraduationCap, Wallet, FileText, Search,
  LayoutDashboard, Link2, Medal, ChevronRight, CircleDollarSign, Bell, Layers, Mail, HelpCircle, Play, ChevronDown, Target, Eye, Lightbulb
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

/* Social brand icons (not included in lucide-react) */
function LinkedInIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z" />
    </svg>
  );
}
function XIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
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

/* ---------------------------------------------------------------- Contact form backend
   Delivers "Send Us a Message" submissions to support@prequaly.ai via the
   submit-contact Supabase Edge Function, which sends through Mailjet — the
   same email provider already wired up for the interest-list confirmations.
   The endpoint is deployed with verify_jwt disabled (like submit-interest),
   so no anon key is required to call it. */
const CONTACT_FUNCTION_URL = "https://qpwmfbviwpjtwcqbpkky.supabase.co/functions/v1/submit-contact";

async function sendContactMessage({ name, email, message }) {
  const res = await fetch(CONTACT_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error(body.error || "Failed to send message. Please try again.");
  return body;
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      await sendContactMessage(form);
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <form className="pq-contact-form" onSubmit={handleSubmit}>
      <div className="pq-field">
        <label>Your Name *</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={form.name}
          onChange={update("name")}
          required
        />
      </div>
      <div className="pq-field">
        <label>Your Email *</label>
        <input
          type="email"
          placeholder="Enter your email address"
          value={form.email}
          onChange={update("email")}
          required
        />
      </div>
      <div className="pq-field">
        <label>Your Message</label>
        <textarea
          rows={7}
          placeholder="Write your message here..."
          value={form.message}
          onChange={update("message")}
          required
        />
      </div>
      <button className="pq-cta" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
      {status === "success" && (
        <p className="pq-form-status pq-form-status-success" role="status">
          Thanks — your message has been sent. We'll get back to you within 1–2 business days.
        </p>
      )}
      {status === "error" && (
        <p className="pq-form-status pq-form-status-error" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  );
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
    { icon: FileText, label: "Programs & Assistance" },
    { icon: HeartHandshake, label: "Community Organizations" },
    { icon: Building2, label: "Trusted Partners" },
    { icon: Landmark, label: "Government Resources" },
  ];
  const period = 46;
  return (
    <div className="pq-orbit" aria-hidden="true">
      <div className="pq-orbit-dash" />
      <div className="pq-orbit-center">
        <div className="pq-float"><Keyhole size={84} /></div>
        <span>People Like You</span>
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
function InterestList() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [sending, setSending] = useState(false);
  const [joinError, setJoinError] = useState(false);

  const emailOk = /.+@.+\..+/.test(email);

  async function submitInterest() {
    setSending(true);
    setJoinError(false);

    const r = await joinInterestList(email);

    setSending(false);

    if (r.ok) setJoined(true);
    else setJoinError(true);
  }

  return (
    <main className="pq-interest-page">
      <div className="pq-interest-card">
        <h1>Be the first to know when we launch near you.</h1>

        <p>
          Join the interest list for early access, product updates,
          and ways to get involved.
        </p>

        {!joined ? (
          <>
            <div className="pq-interest-row">
              <input
                className="pq-input"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                className="pq-cta"
                disabled={!emailOk || sending}
                onClick={submitInterest}
              >
                {sending ? "Joining..." : "Join the Interest List"}
              </button>
            </div>

            {joinError && (
              <p className="pq-join-error">
                Something went wrong. Please try again.
              </p>
            )}

            <p className="pq-privacy">
              We respect your privacy. Your email is never sold.
            </p>
          </>
        ) : (
          <p className="pq-joined">
            ✓ Thanks! We'll keep you updated.
          </p>
        )}
      </div>
    </main>
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
        <button className="pq-brand" aria-label="PreQualy home" onClick={() => go("home")}>
          <img src="/PreQualy%20Logo.png" alt="PreQualy" className="pq-brand-logo"/>
        </button>
        <nav className="pq-nav" aria-label="Main">
          <NavBtn on={tab === "home"} onClick={() => go("home")} icon={Home} label="Home" />
          {/* <NavBtn on={tab === "about"} onClick={() => go("about")} icon={Info} label="About" /> */}
          <NavBtn on={tab === "whoserve"} onClick={() => go("whoserve")} icon={Search} label="Who We Serve" />
          <NavBtn on={tab === "partners"} onClick={() => go("partners")} icon={LayoutDashboard} label="For Partners" dropdown>
            <button onClick={() => go("partners-gov")}>Government Agencies</button>
            <button onClick={() => go("partners-nonprofit")}>Nonprofits</button>
            <button onClick={() => go("partners-lender")}>Lenders</button>
            <button onClick={() => go("partners-realestate")}>Real Estate Professionals</button>
          </NavBtn>
          <NavBtn on={tab === "faqs" || tab === "news"} icon={LayoutDashboard} label="Resources" dropdown>
            <button onClick={() => go("faqs")}>FAQs</button>
            <button onClick={() => go("news")}>News</button>
          </NavBtn>
          <NavBtn on={tab === "contact"} onClick={() => go("contact")} icon={Users} label="Contact" />
        </nav>
        <button className="pq-nav-cta" onClick={() => go("interest")}> Join the Interest List </button> 
      </header>

      {tab === "home" && <Home go={go} />}

      {tab === "news" && (
        <main className="pq-news">
          {/* NEWS HERO */}
          <section className="pq-news-hero">
            <span className="pq-section-tag">News & Updates</span>
            <h1>What's Happening at <span>PreQualy</span></h1>
            <p>Stay up to date with PreQualy announcements, milestones,
              partnerships, and stories as we work to make affordable
              homeownership more accessible.</p>
          </section>
          {/* FEATURED UPDATE */}
          <section className="pq-news-featured">
            <div className="pq-news-featured-label">
              Latest Update
            </div>
            <div className="pq-news-featured-content">
              <div className="pq-news-date">
                August 2026
              </div>
              <h2>PreQualy Advances in the ACE Pitch Program</h2>
              <p>PreQualy is continuing to develop its vision for a more
                accessible homeownership ecosystem, helping first-time and
                working-class homebuyers better identify affordable
                homeownership opportunities and resources.</p>
              <a
                href="https://www.instagram.com/p/DTOBxKXjzfM/"
                target="_blank"
                rel="noopener noreferrer"
                className="pq-news-link"
              >View the announcement →</a>
            </div>
          </section>
          {/* PRESS RELEASES */}
          <section className="pq-news-section">
            <div className="pq-news-section-heading">
              <span className="pq-section-tag">Press</span>
              <h2>Press Releases</h2>
              <p>
                Official announcements and company updates from PreQualy
                will appear here as they become available.
              </p>
            </div>
            <div className="pq-news-empty">
              <div className="pq-news-empty-icon">✦</div>
              <h3>More updates coming soon</h3>
              <p>PreQualy is growing, and we're just getting started.
                Check back here for company announcements, partnerships,
                milestones, and other updates.</p>
              <button
                className="pq-nav-cta"
                onClick={() => go("contact")}
              >Get in Touch</button>
            </div>
          </section>
          {/* BOTTOM CTA */}
          <section className="pq-news-cta">
            <h2>Want to stay in the loop?</h2>
            <p>Join the PreQualy interest list to hear about new
              developments and opportunities as we grow.</p>
            <button
              className="pq-nav-cta"
              onClick={() => go("interest")}
            >Join the Interest List</button>
          </section>
        </main>
      )}

      {tab === "faqs" && (
        <main className="pq-faq-page">
          <section className="pq-faq-hero">
            <span className="pq-section-tag">Frequently Asked Questions</span>
            <h1>Questions?</h1>
            <h1><span>We've got answers.</span></h1>
            <p>
              Learn more about PreQualy, how the platform works, and how we help
              make homeownership resources easier to understand and access.
            </p>
          </section>
          <section className="pq-faq-list" aria-label="Frequently asked questions">
            <details className="pq-faq-item">
              <summary>
                <span>What is PreQualy?</span>
                <span className="pq-faq-icon">+</span>
              </summary>
              <div className="pq-faq-answer">
                <p>
                  PreQualy is a centralized platform that helps connect future
                  homebuyers with lenders, real estate professionals, nonprofits,
                  developers, and public agencies. By bringing housing programs,
                  grants, and financing resources into one place, PreQualy helps
                  people better understand their potential homeownership options
                  before applying for a loan.
                </p>
              </div>
            </details>
            <details className="pq-faq-item">
              <summary>
                <span>Who can benefit from using PreQualy?</span>
                <span className="pq-faq-icon">+</span>
              </summary>
              <div className="pq-faq-answer">
                <p>
                  PreQualy supports multiple groups across the housing ecosystem,
                  including future homebuyers, real estate professionals, lenders,
                  nonprofits, developers, and public agencies. By improving
                  coordination between these groups, the platform helps expand
                  access to affordable homeownership.
                </p>
              </div>
            </details>
            <details className="pq-faq-item">
              <summary>
                <span>How does PreQualy improve access to homeownership programs?</span>
                <span className="pq-faq-icon">+</span>
              </summary>
              <div className="pq-faq-answer">
                <p>
                  Many assistance programs and housing resources already exist,
                  but they are often scattered across different organizations and
                  systems. PreQualy centralizes this information and aligns it with
                  factors like location, income, and household size, helping users
                  identify programs that may be available to them more easily.
                </p>
              </div>
            </details>
            <details className="pq-faq-item">
              <summary>
                <span>Does using PreQualy affect my credit score?</span>
                <span className="pq-faq-icon">+</span>
              </summary>
              <div className="pq-faq-answer">
                <p>
                  No. PreQualy allows users to explore potential housing programs,
                  grants, and financing opportunities without a credit check. The
                  platform is designed to provide clarity and information without
                  creating any obligation or commitment to a lender.
                </p>
              </div>
            </details>
          </section>
          <section className="pq-faq-cta">
            <div>
              <span className="pq-faq-cta-label">Still have questions?</span>
              <h2>We're here to help.</h2>
              <p>
                If you can't find what you're looking for, reach out to our team
                and we'll be happy to help.
              </p>
            </div>
            <button
              className="pq-nav-cta"
              onClick={() => go("contact")}
            >
              Contact Us
            </button>
          </section>
        </main>
      )}

      {tab === "programs" && (
        intakeStep > 0
          ? <Intake f={f} setF={setF} step={intakeStep} setStep={setIntakeStep} onFinish={finishIntake} onCancel={() => { setIntakeStep(0); go("home"); }} />
          : hasProfile
            ? <Results hh={hh} r={results} f={f} setF={setF} rerun={rerun}
                saved={saved} toggleSave={toggleSave}
                onEdit={() => setIntakeStep(1)} onConnect={() => go("connect")} onHomes={() => go("homes")} />
            : <EmptyState title="Let's find your programs" body="Answer nine quick questions — no credit pull, nothing shared — and see every down-payment program, grant, and below-market home you match in your county." cta="Check my eligibility" onCta={startIntake} />
      )}

      {tab === "overview" && (
        <main className="pq-emptypage">
          <h1>Overview</h1>
        </main>
      )}

      {tab === "contact" && (
        <main className="pq-contact">
          <section className="pq-contact-hero">
            <h1>Let's Build Smarter Housing Access Together</h1>
            <p>
              Whether you're a prospective partner, housing professional,
              nonprofit, public agency, or simply exploring PreQualy,
              we'd welcome the conversation.
            </p>
          </section>
          <section className="pq-contact-grid">
            <section className="pq-contact-card">
              <h2>Send Us a Message</h2>
              <ContactForm />
            </section>
            <div className="pq-info-card">
              <h3>Follow Us</h3>
              <a
                className="pq-social-link"
                href="https://www.linkedin.com/company/prequaly"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedInIcon size={18} />
                <span>LinkedIn</span>
              </a>
              <a
                className="pq-social-link"
                href="https://x.com/PreQualyInc"
                target="_blank"
                rel="noopener noreferrer"
              >
                <XIcon size={18} />
                <span>@PreQualyInc</span>
              </a>
              <a
                className="pq-social-link"
                href="https://www.instagram.com/_prequaly/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon size={18} />
                <span>@_prequaly</span>
              </a>
            </div>
          </section>
          <section className="pq-partner-banner">
            <h2>Interested in Partnering With PreQualy?</h2>
            <p>
              If you represent a public agency, nonprofit, lender,
              foundation, or housing organization, we'd love to explore
              opportunities to expand equitable access to affordable
              homeownership together.
            </p>
            <button
              className="pq-nav-cta"
              onClick={() => go("partners")}
            >
              Explore Partnerships
            </button>
          </section>
        </main>
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

      {tab === "interest" && <InterestList />}

      {tab === "whoserve" || tab === "whoserve-buyers" || tab === "whoserve-pro" || tab === "whoserve-nonprofit" || tab === "whoserve-gov" ? (
        <main className="pq-whoserve">
          <section className="pq-whoserve-hero">
            <span className="pq-section-tag">Who PreQualy Is For</span>
            <h1>Expanding Access to the <span>Homeownership Ecosystem</span></h1>
            <p>
              PreQualy is designed for the people and organizations working to make homeownership more accessible. By bringing fragmented housing information into one centralized platform, PreQualy helps future homebuyers explore possible pathways to purchasing a home while helping housing professionals and community partners reach, prepare, and support more buyers.
            </p>
          </section>

          <nav className="pq-whoserve-tabs">
            <button 
              className={"pq-whoserve-tab " + (tab === "whoserve" || tab === "whoserve-buyers" ? "active" : "")}
              onClick={() => setTab("whoserve-buyers")}
            >
              Future Homebuyers
            </button>
            <button 
              className={"pq-whoserve-tab " + (tab === "whoserve-pro" ? "active" : "")}
              onClick={() => setTab("whoserve-pro")}
            >
              Real Estate Professionals
            </button>
            <button 
              className={"pq-whoserve-tab " + (tab === "whoserve-nonprofit" ? "active" : "")}
              onClick={() => setTab("whoserve-nonprofit")}
            >
              Nonprofits
            </button>
            <button 
              className={"pq-whoserve-tab " + (tab === "whoserve-gov" ? "active" : "")}
              onClick={() => setTab("whoserve-gov")}
            >
              Government Agencies
            </button>
          </nav>

          {(tab === "whoserve" || tab === "whoserve-buyers") && (
            <section className="pq-whoserve-content">
              <h2>Future Homebuyers</h2>
              <p>
                Finding a path to homeownership can be overwhelming. Loan products, down payment assistance, closing cost support, homebuyer grants, and income-restricted housing opportunities are often offered by different organizations, governed by different requirements, and published in different places.
              </p>
              <p>
                PreQualy helps future homebuyers explore potential resources based on factors such as where they want to buy, household size, household income, and other relevant information. Instead of searching across numerous websites or learning about an opportunity after it has closed, buyers can gain a clearer view of programs that may align with their circumstances and homeownership goals.
              </p>
              <p>
                Exploring potential options through PreQualy does not require a hard credit inquiry and does not lock a buyer into a particular lender, real estate professional, or financial product. PreQualy is not a lender and does not make loan approval or underwriting decisions. Instead, it helps buyers become more informed, better prepared, and better positioned to take the next step with qualified housing and financial professionals.
              </p>
              <h3>Through PreQualy, future homebuyers may be able to:</h3>
              <ul className="pq-whoserve-list">
                <li>Explore potential mortgage products, grants, and homebuyer assistance programs in one place</li>
                <li>Identify programs that may align with their location, income, household composition, or intended purchase</li>
                <li>Better understand the requirements, deadlines, and next steps associated with different opportunities</li>
                <li>Discover potential ways to combine available resources when program rules allow</li>
                <li>Prepare for more productive conversations with lenders, housing counselors, and real estate professionals</li>
                <li>Move forward with greater clarity, confidence, and control</li>
              </ul>
              <p>
                PreQualy is especially valuable for first-generation buyers, first-time homebuyers, working- and middle-income households, and people who may be closer to homeownership than they realize but lack access to clear, coordinated information.
              </p>
            </section>
          )}

          {tab === "whoserve-pro" && (
            <section className="pq-whoserve-content">
              <h2>Real Estate Professionals, Developers, and Lenders</h2>
              <p>
                Many prospective buyers are capable of becoming homeowners but need additional preparation, the right loan product, access to financial assistance, or a home that aligns with specific affordability requirements. Real estate professionals, developers, and lenders often encounter these barriers after the home search or financing process has already begun.
              </p>
              <p>
                PreQualy is designed to help agents, brokers, developers, loan officers, and financial institutions identify and address potential affordability or readiness gaps earlier. By increasing awareness of available programs, financing products, and affordable homeownership opportunities, PreQualy can support stronger buyer preparation and more efficient transactions.
              </p>
              <h3>For professionals across the homeownership ecosystem, PreQualy can help:</h3>
              <ul className="pq-whoserve-list">
                <li>Expand the pool of prospective buyers by identifying additional pathways to homeownership</li>
                <li>Connect buyers with loan products, assistance programs, and available homes that may complement their financial profiles</li>
                <li>Build stronger pipelines of informed and better-prepared buyers</li>
                <li>Increase visibility for affordable, workforce, mixed-income, and income-restricted homes</li>
                <li>Reduce avoidable delays caused by missing information, program deadlines, or financing surprises</li>
                <li>Lower the risk of transactions falling through because affordability requirements or assistance options were identified too late</li>
                <li>Improve coordination among buyers, lenders, agents, developers, housing counselors, and assistance providers</li>
                <li>Support more informed and consistent communication throughout the purchasing process</li>
                <li>Advance responsible outreach and fair housing practices by making information more broadly accessible</li>
              </ul>
              <p>
                PreQualy does not replace professional advice, underwriting, income verification, or required eligibility determinations. It provides an additional layer of housing intelligence that helps professionals guide buyers and coordinate resources more effectively.
              </p>
            </section>
          )}

          {tab === "whoserve-nonprofit" && (
            <section className="pq-whoserve-content">
              <h2>Nonprofits and Foundations</h2>
              <p>
                Nonprofits, community-based organizations, and philanthropic institutions invest significant resources in housing stability, financial capability, down payment assistance, and equitable access to homeownership. Yet many programs remain underutilized because the people who could benefit from them do not know they exist or cannot easily determine where to begin.
              </p>
              <p>
                PreQualy helps mission-driven organizations increase the visibility and reach of their programs. By connecting program information with households actively exploring homeownership, PreQualy can help close the gap between funding availability and community participation.
              </p>
              <h3>Nonprofits and foundations can use PreQualy to:</h3>
              <ul className="pq-whoserve-list">
                <li>Increase awareness of homeownership programs and financial resources</li>
                <li>Reach prospective participants beyond their existing networks</li>
                <li>Improve the utilization of available funds and services</li>
                <li>Direct households toward relevant programs earlier in their homeownership journey</li>
                <li>Strengthen referral relationships across the housing ecosystem</li>
                <li>Identify recurring barriers that prevent eligible households from accessing assistance</li>
                <li>Better understand how resources translate into applications, referrals, and potential homeownership outcomes</li>
                <li>Demonstrate the reach and impact of housing-related investments</li>
              </ul>
              <p>
                PreQualy serves as both a distribution channel and a partnership platform, helping mission-driven organizations extend their impact without having to build separate technology or outreach infrastructure.
              </p>
            </section>
          )}

          {tab === "whoserve-gov" && (
            <section className="pq-whoserve-content">
              <h2>Government Agencies</h2>
              <p>
                Cities, counties, housing authorities, and other public agencies administer programs intended to expand access to safe, stable, and affordable housing. These programs may include down payment assistance, closing cost assistance, affordable mortgage products, income-restricted homes, homebuyer education, and other locally funded opportunities.
              </p>
              <p>
                However, fragmented information, limited outreach capacity, complex eligibility requirements, and manual administrative processes can make it difficult for residents to find and navigate these resources.
              </p>
              <p>
                PreQualy is designed to help public agencies improve how housing opportunities are communicated, accessed, and monitored. By centralizing program information and helping residents identify potentially relevant resources, PreQualy supports a more proactive and transparent approach to public program delivery.
              </p>
              <h3>Public agencies can benefit from:</h3>
              <ul className="pq-whoserve-list">
                <li>Increased visibility and utilization of publicly funded housing programs</li>
                <li>Broader and more equitable community outreach</li>
                <li>Clearer communication of eligibility requirements, deadlines, and available funding</li>
                <li>Reduced administrative burden associated with repetitive inquiries and initial program navigation</li>
                <li>Better coordination with lenders, nonprofits, developers, and real estate professionals</li>
                <li>Greater insight into demand, participation barriers, and unmet community needs</li>
                <li>Stronger documentation to support program monitoring, reporting, and planning</li>
                <li>Improved transparency around the availability and use of public resources</li>
              </ul>
              <p>
                PreQualy does not replace an agency's formal application, eligibility review, or compliance processes. It helps agencies make opportunities easier to discover and navigate while supporting more informed program administration.
              </p>
            </section>
          )}
        </main>
      ) : null}

      {tab === "partners" || tab === "partners-gov" || tab === "partners-nonprofit" || tab === "partners-lender" || tab === "partners-realestate" ? (
        <main className="pq-partners">
          <section className="pq-partners-hero">
            <span className="pq-section-tag">Partners</span>
            <h1>Built to Align <span>Incentives Across the Homeownership Ecosystem</span></h1>
            <p>
              The path to homeownership rarely depends on one organization. A successful purchase may involve a public assistance program, a nonprofit housing counselor, a participating lender, a real estate professional, a developer, and one or more sources of financial support.
            </p>
            <p>
              Yet these participants often operate through separate systems, timelines, and requirements. The result is fragmented information, duplicated work, missed opportunities, and unnecessary delays for both buyers and professionals.
            </p>
            <p>
              PreQualy is designed as shared housing infrastructure that connects these parts of the ecosystem. The platform helps partners improve coordination, increase transparency, and connect future homebuyers with resources that may strengthen their ability to purchase a home.
            </p>
            <p>
              Our partnership model is built around a shared objective: helping more households move from interest in homeownership to informed preparation and, ultimately, a sustainable purchase.
            </p>
          </section>

          <nav className="pq-partners-tabs">
            <button 
              className={"pq-partners-tab " + (tab === "partners" || tab === "partners-gov" ? "active" : "")}
              onClick={() => setTab("partners-gov")}
            >
              Government Agencies
            </button>
            <button 
              className={"pq-partners-tab " + (tab === "partners-nonprofit" ? "active" : "")}
              onClick={() => setTab("partners-nonprofit")}
            >
              Nonprofits
            </button>
            <button 
              className={"pq-partners-tab " + (tab === "partners-lender" ? "active" : "")}
              onClick={() => setTab("partners-lender")}
            >
              Lenders
            </button>
            <button 
              className={"pq-partners-tab " + (tab === "partners-realestate" ? "active" : "")}
              onClick={() => setTab("partners-realestate")}
            >
              Real Estate Professionals
            </button>
          </nav>

          {(tab === "partners" || tab === "partners-gov") && (
            <section className="pq-partners-content">
              <h2>Government Agencies and Housing Authorities</h2>
              <p>
                PreQualy helps public agencies make housing programs more visible, accessible, and easier to navigate. By placing program information where future homebuyers and housing professionals can find it, agencies can extend their reach beyond traditional outreach channels.
              </p>
              <h3>PreQualy can support agencies in:</h3>
              <ul className="pq-partners-list">
                <li>Promoting down payment assistance, closing cost assistance, affordable mortgage, and homeownership programs</li>
                <li>Reaching residents who may qualify but are not currently connected to an agency or service provider</li>
                <li>Communicating program requirements, application periods, funding availability, and other updates</li>
                <li>Supporting fair and consistent access to publicly funded opportunities</li>
                <li>Identifying patterns in demand, participation, and program utilization</li>
                <li>Strengthening coordination with community organizations, lenders, developers, and real estate professionals</li>
                <li>Supporting reporting, planning, and program improvement with clearer participation insights</li>
              </ul>
              <p>
                The goal is to help agencies move from waiting for residents to find individual programs toward proactively connecting residents with potential homeownership pathways.
              </p>
            </section>
          )}

          {tab === "partners-nonprofit" && (
            <section className="pq-partners-content">
              <h2>Nonprofits and Foundations</h2>
              <p>
                PreQualy helps nonprofits and foundations increase the reach and practical impact of their housing investments. Whether an organization provides grants, counseling, education, financial coaching, or direct homebuyer assistance, PreQualy can help connect those resources with households actively seeking a path to ownership.
              </p>
              <p>
                As a distribution and impact amplifier, PreQualy can help partners:
              </p>
              <ul className="pq-partners-list">
                <li>Increase awareness of available services and funding</li>
                <li>Reach communities that may be underserved by traditional outreach</li>
                <li>Improve referrals to homebuyer education, counseling, and assistance programs</li>
                <li>Reduce the gap between a program's intended audience and its actual participants</li>
                <li>Identify opportunities for collaborative funding and program development</li>
                <li>Strengthen partnerships across the public, nonprofit, and private sectors</li>
                <li>Capture information that supports learning, evaluation, and impact reporting</li>
              </ul>
              <p>
                For foundations, this creates a stronger connection between funding intent and real-world outcomes. For nonprofit service providers, it provides a pathway to reach more households without significantly expanding administrative or marketing capacity.
              </p>
            </section>
          )}

          {tab === "partners-lender" && (
            <section className="pq-partners-content">
              <h2>Lenders and Financial Institutions</h2>
              <p>
                Lenders and financial institutions play a critical role in transforming homeownership goals into sustainable financing. However, prospective borrowers are not always aware of the loan products, flexible underwriting options, or external assistance programs that may support their purchase.
              </p>
              <p>
                PreQualy helps participating lenders place appropriate products in front of prospective buyers while supporting better alignment between private financing and public or philanthropic resources.
              </p>
              <h3>Potential benefits include:</h3>
              <ul className="pq-partners-list">
                <li>Reaching prospective borrowers who are actively exploring homeownership</li>
                <li>Increasing awareness of specialized, affordable, and community-focused mortgage products</li>
                <li>Helping buyers identify complementary grants or assistance programs</li>
                <li>Supporting stronger buyer preparation before formal underwriting begins</li>
                <li>Reducing fallout caused by preventable information or affordability gaps</li>
                <li>Strengthening relationships with public agencies, nonprofit organizations, developers, and real estate professionals</li>
                <li>Supporting responsible lending, community development, and financial inclusion goals</li>
              </ul>
              <p>
                PreQualy does not make credit decisions or guarantee borrower eligibility. Formal qualification, underwriting, disclosures, and loan approval remain the responsibility of the participating financial institution.
              </p>
            </section>
          )}

          {tab === "partners-realestate" && (
            <section className="pq-partners-content">
              <h2>Real Estate Professionals and Developers</h2>
              <p>
                Real estate professionals and developers share a common goal: connecting prepared buyers with homes they can realistically and sustainably purchase. Yet fragmented program information, affordability requirements, and financing barriers can delay transactions, limit buyer access, and increase the risk that otherwise viable sales will fall through.
              </p>
              <p>
                PreQualy helps agents, brokers, and developers connect prospective buyers with potential loan products, grants, down payment assistance, and affordable homeownership opportunities earlier in the purchasing process. This creates a more coordinated path between buyer preparation, available housing, and financing resources.
              </p>
              <p>
                For agents and brokers, PreQualy can strengthen buyer readiness by helping clients explore potential resources before financing barriers disrupt a transaction. For developers, particularly those building affordable, workforce, mixed-income, or inclusionary housing, PreQualy can increase the visibility of available homes and support outreach to households whose profiles may align with applicable affordability requirements.
              </p>
              <h3>Through partnership with PreQualy, real estate professionals and developers can:</h3>
              <ul className="pq-partners-list">
                <li>Connect prospective buyers with potential financing and assistance resources earlier</li>
                <li>Build stronger pipelines of informed and better-prepared buyers</li>
                <li>Increase visibility for affordable, workforce, mixed-income, and income-restricted homes</li>
                <li>Reach households that may align with targeted income ranges or program requirements</li>
                <li>Reduce financing surprises and affordability barriers discovered late in the transaction</li>
                <li>Lower the risk of sales falling through because available assistance was not identified in time</li>
                <li>Support outreach, documentation, and reporting associated with affordability commitments</li>
                <li>Coordinate more effectively with lenders, public agencies, housing counselors, and nonprofit organizations</li>
                <li>Reduce the time required to identify potentially aligned buyers for available properties</li>
                <li>Accelerate sales and absorption while preserving affordability and community objectives</li>
                <li>Expand responsible access to homeownership for first-time, first-generation, and historically underserved buyers</li>
              </ul>
              <p>
                PreQualy does not act as a real estate brokerage or make formal buyer qualification or eligibility decisions. All lending, income verification, underwriting, regulatory compliance, and program eligibility determinations remain with the appropriate licensed professionals, agencies, developers, and program administrators. PreQualy improves discovery and early alignment so those professionals can guide prospective buyers more efficiently.
              </p>
            </section>
          )}

          <section className="pq-partners-forward">
            <h2>A Shared Path Forward</h2>
            <p>
              PreQualy is more than a directory of housing programs. It is being built as connective infrastructure for a homeownership system that is currently fragmented across sectors, organizations, and jurisdictions.
            </p>
            <p>
              By helping partners share opportunities, reach prospective buyers, and coordinate resources more effectively, PreQualy can strengthen the entire pathway to homeownership without requiring any one organization to solve the problem alone.
            </p>
          </section>
        </main>
      ) : null}

      {tab === "about" && (
        <main className="pq-about">

          {/* Hero */}
          <section className="pq-about-hero">
            <p className="pq-eyebrow">ABOUT PREQUALY</p>
            <h1>A Centralized Infrastructure for Affordable Homeownership</h1>
            <p>
              PreQualy brings housing resources, programs, and partners together
              to create clearer pathways to affordable homeownership.
            </p>
          </section>

          {/* Our Process */}
          <section className="pq-about-section">
            <div className="pq-section-heading">
              <p className="pq-eyebrow">OUR PROCESS</p>
              <h2>From Idea to Reality</h2>
            </div>

            <div className="pq-process-grid">

              <article className="pq-process-card">
                <div className="pq-process-number">01</div>
                <h3>Discover</h3>
                <p>
                  We start with a one-on-one discussion to understand your goals,
                  preferences, and expectations, ensuring every detail is aligned
                  with your vision.
                </p>
              </article>

              <article className="pq-process-card">
                <div className="pq-process-number">02</div>
                <h3>Plan</h3>
                <p>
                  Our team develops a clear, customized plan with thoughtful details
                  and practical solutions, shared with you for feedback and approval.
                </p>
              </article>

              <article className="pq-process-card">
                <div className="pq-process-number">03</div>
                <h3>Deliver</h3>
                <p>
                  We bring the plan to life with expert execution, quality
                  workmanship, and attention to every finishing touch.
                </p>
              </article>

            </div>
          </section>

          {/* Mission + Vision */}
          <section className="pq-about-section pq-about-mission">
            <div className="pq-about-two-column">

              <article className="pq-about-info-card">
                <div className="pq-about-icon">
                  <Target size={28} />
                </div>
                <p className="pq-eyebrow">OUR MISSION</p>
                <h2>Bringing Clarity to a Fragmented System</h2>
                <p>
                  PreQualy exists to bring clarity to a fragmented system. By
                  centralizing housing resources and aligning them with real-world
                  buyer profiles - such as location, income, household size, and
                  goals - we help future homebuyers understand what opportunities may
                  be available to them before applying, before a credit check, and
                  before committing to a lender.
                </p>
              </article>

              <article className="pq-about-info-card">
                <div className="pq-about-icon">
                  <Eye size={28} />
                </div>
                <p className="pq-eyebrow">OUR VISION</p>
                <h2>A More Connected Housing Ecosystem</h2>
                <p>
                  We envision a future where public agencies, nonprofits, lenders,
                  developers, and real estate professionals operate through shared
                  infrastructure-reducing inefficiencies, increasing program
                  utilization, and improving outcomes for buyers and communities
                  alike.
                </p>
                <p>
                  PreQualy is not a lender or broker, but the connective layer that
                  allows affordable homeownership systems to work better together.
                </p>
              </article>

            </div>
          </section>

          {/* Growing Homeownership Together */}
          <section className="pq-about-growth">
            <div className="pq-about-growth-inner">
              <p className="pq-eyebrow">GROWING HOMEOWNERSHIP TOGETHER</p>

              <h2>Affordable Homeownership Is Built Together</h2>

              <p>
                Affordable homeownership is built through collaboration, care, and
                long-term commitment. Across communities, public agencies,
                nonprofits, lenders, and developers invest deeply in housing
                solutions - but without coordination, much of that effort falls short
                of its potential.
              </p>

              <p>
                PreQualy brings these partners together by centralizing program
                visibility and aligning resources with real-world buyer profiles.
                Using a tri-sector model, we connect public agencies, private
                industry, and nonprofit organizations to create clearer pathways
                and stronger outcomes across the housing ecosystem.
              </p>

              <p>
                PreQualy is not a lender, broker, or real estate agency. It is the
                connective infrastructure that helps communities grow sustainable and
                accessible homeownership together.
              </p>

              <button
                className="pq-nav-cta pq-about-button"
                onClick={() => go("interest")}
              >
                Join the Interest List
                <ArrowRight size={17} />
              </button>
            </div>
          </section>

        </main>
      )}

      {tab === "careers" && (
        <main className="pq-careers">
          <section className="pq-careers-hero">
            <p className="pq-eyebrow">CAREERS AT PREQUALY</p>
            <h1>Help Build the Future of Homeownership.</h1>
            <p>
              We're building the infrastructure that makes affordable homeownership
              easier to understand, access, and navigate. While we don't have any
              open positions right now, we'd love for you to check back as we grow.
            </p>
          </section>

          <section className="pq-careers-values">
            <div className="pq-careers-value">
              <div className="pq-careers-icon">
                <Users size={26} />
              </div>
              <h3>People First</h3>
              <p>
                We believe better housing outcomes start with understanding the
                people and communities we serve.
              </p>
            </div>

            <div className="pq-careers-value">
              <div className="pq-careers-icon">
                <Target size={26} />
              </div>
              <h3>Purpose Driven</h3>
              <p>
                We're solving a real problem by creating clearer pathways to
                affordable homeownership.
              </p>
            </div>

            <div className="pq-careers-value">
              <div className="pq-careers-icon">
                <Layers size={26} />
              </div>
              <h3>Build Together</h3>
              <p>
                Housing is a shared ecosystem. We collaborate across sectors to
                create solutions that work better together.
              </p>
            </div>
          </section>

          <section className="pq-careers-openings">
            <div className="pq-careers-openings-inner">
              <p className="pq-eyebrow">OPEN POSITIONS</p>
              <h2>We're Not Hiring Just Yet</h2>
              <p>
                We don't currently have any open positions. As PreQualy grows, this
                is where you'll find opportunities to join our team and help shape
                the future of housing access.
              </p>

              <button
                className="pq-nav-cta pq-careers-button"
                onClick={() => go("contact")}
              >
                Get in Touch
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
        </main>
      )}

      {tab === "founderstory" && (
        <main className="pq-founder">

          {/* Hero */}
          <section className="pq-founder-hero">
            <p className="pq-eyebrow">Founder Story</p>
            <h1>Built at the Intersection of Policy, Property, and Possibility</h1>
            <p className="pq-founder-hero-copy">
              PreQualy was born from a firsthand understanding of how fragmented
              housing systems can prevent people from accessing opportunities that
              already exist.
            </p>

            <button className="pq-button pq-founder-cta" onClick={() => go("contact")}>
              Make an Inquiry <ArrowRight size={17} />
            </button>
          </section>

          {/* Founder Introduction */}
          <section className="pq-founder-intro pq-founder-section">
            <div className="pq-founder-intro-grid">

              <div className="pq-founder-profile">
                <div className="pq-founder-avatar">
                  <img src="/lashonda.webp" alt="LaShonda Smith, Founder and CEO of PreQualy" />
                </div>

                <p className="pq-eyebrow">Founder & CEO</p>
                <h2>LaShonda Smith</h2>
                <p>
                  Housing strategist, advisor, and systems-level innovator working
                  at the intersection of real estate, public finance, philanthropy,
                  and technology.
                </p>
              </div>

              <div className="pq-founder-insight">
                <p className="pq-eyebrow">The Insight Behind PreQualy</p>
                <h2>Redefining Access to Affordable Homeownership</h2>

                <p>
                  LaShonda Smith is the Founder and CEO of PreQualy, a mobile-first,
                  AI-powered platform designed to unlock pathways to homeownership
                  by aligning government, business, and nonprofit sectors.
                </p>

                <p>
                  Her work sits at the intersection of housing equity, technology
                  innovation, and systems-level strategy.
                </p>
              </div>

            </div>
          </section>

          {/* Story */}
          <section className="pq-founder-story pq-founder-section">
            <div className="pq-founder-story-inner">

              <p className="pq-eyebrow">The Story</p>
              <h2>Turning a Recurring Problem Into a New Possibility</h2>

              <p>
                PreQualy was founded by LaShonda Smith, a longtime advisor working
                at the intersection of real estate, public finance, and philanthropy.
              </p>

              <p>
                Throughout her career advising on property tax, sales tax, and
                philanthropic strategy, LaShonda repeatedly encountered a common
                challenge. Resources designed to expand opportunity existed, but
                were not accessible to the people who needed them most.
              </p>

              <p>
                With a professional background in client advisory services spanning
                property tax, sales tax, and philanthropic strategy, LaShonda has
                spent her career helping organizations navigate complex regulatory
                and funding environments.
              </p>

              <p>
                She is also a Global Social Impact Fellow, holds a master’s degree
                in public administration, and has led strategic development
                initiatives supporting nonprofits, municipalities, and
                mission-driven enterprises.
              </p>

            </div>
          </section>

          {/* The Idea */}
          <section className="pq-founder-idea">
            <div className="pq-founder-idea-inner">

              <div className="pq-founder-idea-icon">
                <Lightbulb size={30} />
              </div>

              <p className="pq-eyebrow">Why PreQualy</p>

              <h2>
                What if the resources already existed
                but people simply couldn't find them?
              </h2>

              <p>
                PreQualy was born from LaShonda's firsthand recognition that
                billions of dollars in housing assistance remain underutilized
                each year due to fragmentation, lack of visibility, and
                misalignment across sectors.
              </p>

              <p>
                Rather than creating another housing program, LaShonda envisioned
                infrastructure that strengthens existing systems by centralizing
                resources, improving coordination, and empowering individuals with
                actionable information.
              </p>

            </div>
          </section>

          {/* Tri-sector model */}
          <section className="pq-founder-section pq-founder-model">
            <div className="pq-section-heading">
              <p className="pq-eyebrow">A Different Approach</p>
              <h2>Building Shared Value Across the Housing Ecosystem</h2>
              <p>
                PreQualy brings together the people and organizations that influence
                the homeownership journey.
              </p>
            </div>

            <div className="pq-founder-model-grid">

              <div className="pq-founder-model-card">
                <div className="pq-founder-model-icon">
                  <Landmark size={26} />
                </div>
                <h3>Public Sector</h3>
                <p>
                  Public agencies and municipalities working to make housing
                  resources more visible and accessible.
                </p>
              </div>

              <div className="pq-founder-model-card">
                <div className="pq-founder-model-icon">
                  <Building2 size={26} />
                </div>
                <h3>Private Industry</h3>
                <p>
                  Real estate professionals, developers, and lenders contributing
                  expertise and resources to the housing ecosystem.
                </p>
              </div>

              <div className="pq-founder-model-card">
                <div className="pq-founder-model-icon">
                  <HeartHandshake size={26} />
                </div>
                <h3>Nonprofit Sector</h3>
                <p>
                  Mission-driven organizations helping communities navigate
                  programs, resources, and pathways toward homeownership.
                </p>
              </div>

            </div>
          </section>

          {/* Vision */}
          <section className="pq-founder-vision">
            <div className="pq-founder-vision-inner">

              <p className="pq-eyebrow">The Vision</p>

              <h2>
                Modernizing access to homeownership nationwide.
              </h2>

              <p>
                LaShonda’s leadership is grounded in justice, transparency, and
                collective power. Her long-term vision is to modernize access to
                homeownership nationwide, ensuring opportunity is not determined by
                race, income, or zip code, but by equitable access to information,
                technology, and coordinated community action.
              </p>

              <button
                className="pq-button pq-founder-vision-button"
                onClick={() => go("contact")}
              >
                Connect With PreQualy <ArrowRight size={17} />
              </button>

            </div>
          </section>

        </main>
      )}

      <footer className="pq-foot">
        <div className="pq-foot-grid">
            {/* Brand */}
            <div className="pq-foot-brand">
              <div className="pq-foot-logo">
                <img src="/PreQualy%20Logo.png" alt="PreQualy" className="pq-brand-logo"/>
              </div>

              <p className="pq-foot-desc">
                Building a future where everyone has the opportunity to call home.
              </p>
            </div>

            {/* Homebuyers */}
            <div className="pq-foot-col">
              <h4>For Homebuyers</h4>
              <button onClick={() => go("programs")}>Overview</button>
              <button onClick={() => go("programs")}>How It Works</button>
            </div>

            {/* Partners */}
            <div className="pq-foot-col">
              <h4>For Partners</h4>
              <button onClick={() => go("programs")}>Nonprofits</button>
              <button onClick={() => go("programs")}>Government Agencies</button>
              <button onClick={() => go("homes")}>Real Estate Professionals</button>
            </div>

            {/* Resources */}
            <div className="pq-foot-col">
              <h4>Resources</h4>
              <button onClick={() => go("faqs")}>FAQs</button>
              <button onClick={() => go("news")}>News</button>
            </div>

            {/* Company */}
            <div className="pq-foot-col">
              <h4>Company</h4>
              <button onClick={() => go("about")}>About Us</button>
              <button onClick={() => go("founderstory")}>Founder Story</button>
              <button onClick={() => go("careers")}>Careers</button>
            </div>

            {/* Newsletter */}
            <div className="pq-foot-col">
              <h4>Stay Connected</h4>

              <p className="pq-foot-news">
                Subscribe to our newsletter for updates.
              </p>

              <div className="pq-foot-subscribe">
                <input
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email address"
                />

                <button aria-label="Subscribe">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="pq-foot-bottom">
            <p>© 2026 PreQualy. All rights reserved.</p>
          </div>
      </footer>
    </div>
  );
}

function NavBtn({ on, onClick, icon: Icon, label, dropdown = false, children }) {
  return (
    <div className="pq-nav-item">
      <button
        className={"pq-navbtn" + (on ? " on" : "")}
        onClick={onClick}
        aria-current={on ? "page" : undefined}
      >
        <span className={on ? "pq-navlabel on" : "pq-navlabel"}>
          {label}
          {dropdown && <ChevronDown size={14} className="pq-arrow" />}
        </span>
      </button>

      {dropdown && (
        <div className="pq-dropdown">
          {children}
        </div>
      )}
    </div>
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
function Landing({ onStart }) {
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
  function scrollToWaitlist() {
    document.getElementById("pq-waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return (
    <main className="pq-landing">
      <section className="pq-hero-grid">
        <div className="pq-hero-copy">
          <p className="pq-eyebrow">Opportunity. Access. Home.</p>
          <h1 className="pq-hero">Unlock homeownership opportunities you may not even know exist.</h1>
          <p className="pq-sub">
            PreQualy connects people to housing programs, down payment assistance, and trusted
            partners - making homeownership more accessible for everyone.
          </p>
          <div className="pq-hero-ctas">
            <button className="pq-cta" onClick={scrollToWaitlist}>
              Join the Interest List <ArrowRight size={18} />
            </button>
            <button className="pq-ghost" type="button">
              <Play size={16} fill="currentColor" /> See Our Vision
            </button>
          </div>
        </div>
        <div className="pq-hero-art" aria-hidden="true">
          <img src="/PreQualy Logo.svg" alt="" className="pq-hero-img" />
        </div>
      </section>

      <FadeIn><section className="pq-problem">
        <h3>The path to homeownership is more complicated than it should be.</h3>
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

      <FadeIn><section className="pq-solution">
        <div className="pq-solution-copy">
          <h2>PreQualy brings opportunity within reach.</h2>
          <p>
            Our technology and data bring together housing programs, community resources,
            and trusted partners - so you can discover what's already yours.
          </p>
          <ul className="pq-solution-list">
            {[
              "Personalized opportunity matching",
              "Interactive maps & real-time insights",
              "Trusted community connections",
              "Tools to understand eligibility",
            ].map((item) => (
              <li key={item}><span className="pq-check-dot"><Check size={12} /></span>{item}</li>
            ))}
          </ul>
        </div>
        <TriOrbit />
        <div className="pq-opp-card">
          <p className="pq-opp-label">Example Opportunity</p>
          <h3>CalHFA FHA Loan</h3>
          <p className="pq-opp-est">Est. Savings</p>
          <div className="pq-opp-amt">$24,500</div>
          <span className="pq-flag reach"><BadgeCheck size={12} /> Down Payment Assistance</span>
          <p className="pq-opp-est">Reduced Monthly Payment</p>
          <div className="pq-opp-amt sm">$320<span> est.</span></div>
          <button className="pq-link-btn" onClick={onStart}>Learn More <ArrowRight size={14} /></button>
        </div>
      </section></FadeIn>

      <FadeIn><section className="pq-interest" id="pq-waitlist">
        <span className="pq-icircle big"><Mail size={22} /></span>
        <h3>Be the first to know when we launch!</h3>
        <p>Join our interest list to get early access, product updates, and ways to get involved.</p>
        {joined ? (
          <p className="pq-joined"><Check size={15} /> You're on the list - welcome to PreQualy.</p>
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
        <p className="pq-privacy">We respect your privacy. <button type="button" className="pq-inline-link">See our Privacy Policy</button></p>
      </section></FadeIn>

      <FadeIn><section className="pq-proof">
        {[
          [Layers, "250+", "Programs & Resources Mapped"],
          [Users, "50+", "Community Partners Engaged"],
          [Home, "1 Goal", "Stronger Pathways to Sustainable Homeownership"],
          [HeartHandshake, "1 Community", "Stronger Together"],
        ].map(([Icon, num, label]) => (
          <div className="pq-proof-item" key={label}>
            <span className="pq-proof-icon"><Icon size={22} strokeWidth={1.5} /></span>
            <strong>{num}</strong>
            <span>{label}</span>
          </div>
        ))}
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
            <Choice options={["no", "yes"]} value={f.first_generation === "yes" ? "no" : "yes"}
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
  // --navy:#0A2540; --navy-2:#143A5C; --cyan:#2BE3E0; --cyan-soft:#DFF8F8;
  // --teal:#0E7C86; --teal-dark:#208d94; --mist:#E9F5F7; --bg:#FFFFFF;
  // --panel:#F5FAFB; --shadow:0 1px 3px rgba(10,37,64,.06),0 8px 22px rgba(10,37,64,.05);
  // --surface:#FFFFFF; --line:#E3EEF1; --ink:#16324A; --muted:#5A7184;
  // --good:#0E8A5F; --good-soft:#E3F4EC; --amber-ink:#8A6116; --amber-soft:#FBF1DC;
  // --bad:#A34040; --bad-soft:#F9E9E9;
  /* PreQualy brand system */
  --navy: #0A2233;
  --navy-2: #0D2E45;

  /* Primary cyan / teal */
  --cyan: #19C9DB;
  --cyan-soft: #E4F8FB;
  --teal: #0FA6B8;
  --teal-dark: #0FA6B8;
  --teal-bright: #41DCEC;

  /* Backgrounds / surfaces */
  --mist: #E4F8FB;
  --bg: #FFFFFF;
  --panel: #F4F7F9;
  --surface: #FFFFFF;
  --fog: #F4F7F9;
  --white: #FFFFFF;

  /* Borders / text */
  --line: #DFE9EF;
  --ink: #1F2933;
  --muted: #61708F;

  /* Status colors */
  --good: #1FB980;
  --good-soft: #E7F7EE;

  --amber-ink: #8A6116;
  --amber-soft: #FBF1DC;

  --bad: #A34040;
  --bad-soft: #F9E9E9;

  /* Supporting brand colors */
  --purple: #6544D9;
  --blue: #2468D9;
  --green: #1FB980;
  --success: #1FB980;

  /* Shared UI */
  --shadow: 0 18px 50px rgba(10, 34, 51, 0.10);
  --radius: 22px;
}
*{box-sizing:border-box}
.pq-root{min-height:100vh;background:var(--bg);color:var(--ink);
  font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.5;
  display:flex;flex-direction:column;text-align:left}
button{font-family:inherit}
:focus-visible{outline:2.5px solid var(--teal);outline-offset:2px;border-radius:6px}

/* keyhole mark glow */
.pq-key.glow circle:nth-of-type(2), .pq-key.glow path:nth-of-type(2){filter:drop-shadow(0 0 5px var(--cyan))}

/* header */
.pq-head{position:sticky;top:0;z-index:20;background:var(--navy);backdrop-filter:blur(8px);
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center;
  padding:12px 24px;gap:16px;border-bottom:1px solid var(--line)}
.pq-brand{display:flex;align-items:center;gap:8px;background:none;border:0;cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:19px;color:var(--navy);letter-spacing:-.01em;
  justify-self:start}
.pq-brand b{color:var(--teal)}
.pq-nav{display:flex;gap:2px;justify-self:center;flex-wrap:wrap;justify-content:center}
.pq-navbtn{display:flex;align-items:center;gap:5px;background:none;border:0;cursor:pointer;
  font-size:13.5px;font-weight:600;color:#fff;padding:8px 12px;border-radius:0}
.pq-navbtn.on{color:var(--teal-dark);}
.pq-navbtn:hover{color:var(--teal-dark)}
.pq-navlabel{
  display:inline-flex;
  align-items:center;
  gap:4px;
  padding-bottom:3px;
}
.pq-navlabel.on{
  border-bottom:2px solid var(--teal-dark);
  color:var(--teal-dark);
}
.pq-logo{
  height:44px;
  width:auto;
  display:block;
}
.pq-nav-cta{
  background:var(--teal);
  color:#fff;
  border:none;
  border-radius:10px;
  padding:10px 18px;
  font-size:14px;
  font-weight:600;
  cursor:pointer;
  transition:background .15s;
  justify-self:end;
  white-space:nowrap;
}
.pq-nav-cta:hover{
  background:var(--teal-dark);
}
.pq-interest-page{
  flex:1;
  display:flex;
  justify-content:center;
  align-items:center;
  padding:80px 24px;
}
.pq-interest-card{
  width:100%;
  max-width:650px;
  background:#fff;
  border:1px solid var(--line);
  border-radius:24px;
  padding:48px;
  box-shadow:var(--shadow);
  text-align:center;
}
.pq-interest-card h1{
  font-family:'Plus Jakarta Sans',sans-serif;
  color:var(--navy);
  font-size:36px;
  margin-bottom:16px;
}
.pq-interest-card p{
  margin-bottom:24px;
}
.pq-interest-row{
  display:flex;
  gap:12px;
  margin-bottom:16px;
}
.pq-interest-row .pq-input{
  flex:1;
}

.pq-nav-item{
  position:relative;
}

.pq-dropdown{
  position:absolute;
  top:100%;
  left:0;
  min-width:220px;
  background:#fff;
  border:1px solid var(--line);
  border-radius:12px;
  box-shadow:var(--shadow);
  display:none;
  padding:8px 0;
  z-index:100;
}

.pq-nav-item:hover .pq-dropdown{
  display:block;
}

.pq-dropdown button{
  width:100%;
  background:none;
  border:none;
  text-align:left;
  padding:12px 16px;
  cursor:pointer;
  font-size:14px;
  color:var(--ink);
}

.pq-dropdown button:hover{
  background:var(--mist);
}

.pq-arrow{margin-left:2px;color:var(--muted);flex-shrink:0}
@media(max-width:900px){
  .pq-head{grid-template-columns:1fr auto;padding:10px 16px}
  .pq-nav{display:none}
  .pq-nav-cta{justify-self:end;font-size:13px;padding:9px 14px}
}
@media(max-width:560px){.pq-navbtn span{display:none}.pq-navbtn{padding:8px}}

/* landing */
.pq-landing{flex:1;width:100%;max-width:1280px;margin:0 auto;padding:48px 24px 40px}
.pq-hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;margin-bottom:56px}
@media(max-width:800px){.pq-hero-grid{grid-template-columns:1fr}.pq-hero-art{order:-1;min-height:220px}}
.pq-eyebrow{font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin:0 0 14px}
.pq-hero{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(32px,4.5vw,48px);line-height:1.12;
  letter-spacing:-.02em;color:var(--navy);margin:0 0 18px;max-width:560px}
.pq-sub{font-size:16px;color:#3E5666;line-height:1.65;margin:0 0 28px;max-width:520px}
.pq-hero-ctas{display:flex;gap:12px;flex-wrap:wrap}
.pq-ghost{display:inline-flex;align-items:center;gap:8px;background:#fff;color:var(--teal-dark);
  border:1.5px solid var(--teal);border-radius:10px;padding:13px 22px;font-size:14.5px;font-weight:700;cursor:pointer}
.pq-ghost:hover{background:var(--mist)}
.pq-hero-art{position:relative;display:flex;align-items:center;justify-content:center;min-height:320px}
.pq-hero-img{width:100%;max-width:580px;height:300px;object-fit:cover;object-position:center 18%;border-radius:12px}

.pq-problem{text-align:center;margin-bottom:56px;padding:0 8px}
.pq-problem h2{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:clamp(22px,3vw,32px);
  color:var(--navy);margin:0 auto 36px;max-width:720px;line-height:1.25}
.pq-prob-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;position:relative;max-width:1100px;margin:0 auto}
.pq-prob-grid:before{content:"";position:absolute;top:26px;left:12%;right:12%;height:0;
  border-top:2px dotted #B8D4DC;z-index:0}
@media(max-width:800px){
  .pq-prob-grid{grid-template-columns:1fr 1fr;gap:20px}
  .pq-prob-grid:before{display:none}
}
@media(max-width:480px){.pq-prob-grid{grid-template-columns:1fr}}
.pq-prob-item{position:relative;z-index:1}
.pq-cta{display:inline-flex;align-items:center;gap:8px;background:var(--teal);color:#fff;border:0;
  border-radius:10px;padding:14px 24px;font-size:15px;font-weight:700;cursor:pointer;
  box-shadow:0 4px 14px rgba(14,124,134,.24);transition:background .15s}
.pq-cta:hover{background:var(--teal-dark)}
.pq-cta:disabled{opacity:.45;cursor:not-allowed}
.pq-cta.full{width:100%;justify-content:center;margin-top:8px}
.pq-ghost.slim{padding:9px 16px;font-size:13px;align-self:flex-start;margin-top:14px}
.pq-link-btn{display:inline-flex;align-items:center;gap:6px;background:none;border:0;padding:0;margin-top:14px;
  font-size:14px;font-weight:700;color:var(--teal-dark);cursor:pointer}
.pq-link-btn:hover{color:var(--teal)}
.pq-inline-link{background:none;border:0;padding:0;font:inherit;font-weight:600;color:var(--teal-dark);
  text-decoration:underline;cursor:pointer}
.pq-inline-link:hover{color:var(--teal)}

.pq-solution{display:grid;grid-template-columns:1fr 1.1fr .95fr;gap:28px;align-items:center;
  margin-bottom:56px;padding:0 4px}
@media(max-width:1000px){.pq-solution{grid-template-columns:1fr;gap:32px}}
.pq-solution-copy h2{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:clamp(22px,2.8vw,30px);
  color:var(--navy);margin:0 0 14px;line-height:1.2}
.pq-solution-copy>p{font-size:14.5px;color:#3E5666;line-height:1.6;margin:0 0 18px}
.pq-solution-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
.pq-solution-list li{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:var(--ink)}
.pq-check-dot{width:22px;height:22px;border-radius:50%;background:var(--teal);color:#fff;
  display:grid;place-items:center;flex-shrink:0}

.pq-problem{background:transparent;border:0;border-radius:0;padding:0;box-shadow:none}
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
  display:flex;flex-direction:column;align-items:flex-start;max-width:320px;margin:0 auto;width:100%}
.pq-opp-label{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 6px}
.pq-opp-card h3{font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;color:var(--navy);margin:0 0 6px}
.pq-opp-est{font-size:11px;font-weight:700;color:var(--muted);margin:10px 0 2px;text-transform:uppercase;letter-spacing:.05em}
.pq-opp-amt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:30px;color:var(--teal-dark);line-height:1.1}
.pq-opp-amt.sm{font-size:22px}
.pq-opp-amt span{font-size:13px;font-weight:600;color:var(--muted)}
.pq-interest{background:var(--mist);border-radius:20px;padding:36px 28px;text-align:center;margin-bottom:48px;max-width:900px;margin-left:auto;margin-right:auto}
.pq-interest h3{font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(20px,2.5vw,26px);font-weight:800;color:var(--navy);margin:12px 0 8px}
.pq-interest p{font-size:14px;color:#3E5666;line-height:1.55;margin:0 0 20px}
.pq-interest-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;max-width:560px;margin:0 auto}
.pq-interest-row .pq-input{flex:1;min-width:220px;border-radius:10px;padding:13px 18px;background:#fff;border:1px solid var(--line)}
.pq-interest-row .pq-cta{border-radius:10px;padding:13px 22px;white-space:nowrap}
.pq-joined{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:14px;color:var(--good) !important}
.pq-privacy{font-size:11.5px !important;color:var(--muted) !important;margin:12px 0 0 !important}
.pq-join-error{font-size:12.5px !important;font-weight:600;color:var(--bad) !important;margin:10px 0 0 !important}

.pq-proof{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;background:transparent;
  border:0;border-radius:0;padding:8px 0 24px;text-align:center;box-shadow:none}
@media(max-width:800px){.pq-proof{grid-template-columns:1fr 1fr;gap:24px}}
@media(max-width:480px){.pq-proof{grid-template-columns:1fr}}
.pq-proof-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:0 12px}
.pq-proof-icon{color:var(--teal);margin-bottom:4px;opacity:.85}
.pq-proof strong{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:28px;color:var(--teal-dark);line-height:1.1}
.pq-proof span{font-size:13px;color:var(--navy);font-weight:600;line-height:1.35;max-width:200px}

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
.pq-foot{
  margin-top:60px;
  border-top:1px solid var(--line);
  background:var(--navy);
  padding:44px 24px 18px;
}

.pq-foot-grid{
  max-width:1280px;
  margin:0 auto;
  display:grid;
  grid-template-columns:1.2fr repeat(4,1fr) 1.1fr;
  gap:32px;
  align-items:flex-start;
}

.pq-foot-logo{
  display:flex;
  align-items:center;
  gap:10px;
  font-family:'Plus Jakarta Sans',sans-serif;
  font-weight:700;
  font-size:20px;
  color:var(--navy);
  margin-bottom:14px;
}

.pq-foot-logo b{
  color:var(--teal);
}

.pq-foot-tag{
  font-weight:600;
  color:var(--navy);
  margin:0 0 8px;
}

.pq-foot-desc{
  color:#fff;
  font-size:14px;
  line-height:1.6;
  max-width:280px;
  margin:0;
}

.pq-foot-col h4{
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:15px;
  font-weight:700;
  color:#fff;
  margin:0 0 16px;
}

.pq-foot-col button{
  display:block;
  background:none;
  border:0;
  padding:0;
  margin:0 0 12px;
  font-size:14px;
  color:#fff;
  cursor:pointer;
  text-align:left;
}

.pq-foot-col button:hover{
  color:var(--teal-dark);
}

.pq-foot-news{
  font-size:14px;
  color:#fff;
  line-height:1.6;
  margin:0 0 16px;
}

.pq-foot-subscribe{
  display:flex;
  align-items:center;
  border:1px solid var(--line);
  border-radius:999px;
  padding:4px 4px 4px 16px;
  gap:10px;
  background:#fff;
}

.pq-foot-subscribe input{
  flex:1;
  border:0;
  outline:none;
  font-size:14px;
  background:transparent;
  color:var(--ink);
}

.pq-foot-subscribe button{
  width:34px;
  height:34px;
  border-radius:50%;
  border:0;
  background:var(--teal);
  color:#fff;
  display:grid;
  place-items:center;
  cursor:pointer;
  margin:0;
}

.pq-foot-subscribe button:hover{
  background:var(--teal-dark);
}

.pq-foot-bottom{
  max-width:1180px;
  margin:32px auto 0;
  padding-top:18px;
  border-top:1px solid var(--line);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  flex-wrap:wrap;
}

.pq-foot-bottom p{
  margin:0;
  font-size:13px;
  color:#fff;
}

.pq-foot-legal{
  display:flex;
  gap:18px;
  flex-wrap:wrap;
}

.pq-foot-legal button{
  background:none;
  border:0;
  padding:0;
  font-size:13px;
  color:var(--muted);
  cursor:pointer;
}

.pq-foot-legal button:hover{
  color:var(--teal-dark);
}

@media(max-width:900px){
  .pq-foot-grid{
    grid-template-columns:1fr 1fr;
    gap:32px;
  }
}

@media(max-width:560px){
  .pq-foot{
    padding:36px 20px 18px;
  }

  .pq-foot-grid{
    grid-template-columns:1fr;
    gap:28px;
  }

  .pq-foot-bottom{
    flex-direction:column;
    align-items:flex-start;
  }
}


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

//contact pg
.pq-contact{
    width:100%;
    max-width:1000px;
    margin:0 auto;
    padding:70px 40px 90px;
}
.pq-contact-hero{
    text-align:center;
    max-width:760px;
    margin:80px auto 60px;
}
.pq-section-tag{
    display:inline-block;
    padding:8px 18px;
    border-radius:999px;
    background:var(--cyan-soft);
    color:var(--teal-dark);
    font-size:.82rem;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
    margin-bottom:18px;
}
.pq-contact-hero h1{
    font-family:"Manrope",sans-serif;
    color:var(--navy);
    font-size:clamp(2.5rem,5vw,4rem);
    line-height:1.05;
    letter-spacing:-.04em;
    margin-bottom:20px;
}
.pq-contact-hero p{
    color:var(--muted);
    font-size:1.08rem;
    line-height:1.8;
    max-width:700px;
    margin:auto;
}
.pq-contact-grid{
    display:flex;
    flex-direction:column;
    gap:28px;
    max-width:760px;
    margin:0 auto 60px;
}
.pq-info-card,
.pq-contact-card{
    background:#fff;
    border:1px solid var(--line);
    border-radius:var(--radius);
    box-shadow:var(--shadow);
    padding:36px;
    width:100%;
}
.pq-info-card h3,
.pq-contact-card h2{
    margin:0 0 24px;
    color:var(--navy);
    font-family:"Manrope",sans-serif;
    font-size:1.45rem;
}
.pq-contact-item{
    display:flex;
    gap:14px;
    align-items:flex-start;
    margin-bottom:22px;
}
.pq-contact-item svg{
    color:var(--teal-dark);
    margin-top:3px;
}
.pq-contact-item strong{
    display:block;
    color:var(--navy);
    margin-bottom:4px;
}
.pq-contact-item a,
.pq-contact-item span{
    color:var(--muted);
}
.pq-social-link{
    display:flex;
    align-items:center;
    gap:12px;
    padding:14px 16px;
    border-radius:14px;
    background:var(--fog);
    border:1px solid var(--line);
    color:var(--navy);
    font-weight:700;
    transition:.2s ease;
}
.pq-social-link + .pq-social-link{
    margin-top:10px;
}
.pq-social-link svg{
    flex-shrink:0;
}
.pq-social-link:hover{
    border-color:var(--teal);
    background:var(--cyan-soft);
    color:var(--teal-dark);
    transform:translateY(-2px);
}
.pq-contact-form{
    display:flex;
    flex-direction:column;
    gap:20px;
}
.pq-field{
    display:flex;
    flex-direction:column;
}
.pq-field label{
    color:var(--navy);
    font-weight:700;
    margin-bottom:8px;
}
.pq-field input,
.pq-field textarea{
    width:100%;
    border:1px solid var(--line);
    border-radius:12px;
    padding:14px 16px;
    background:#fff;
    color:var(--ink);
    transition:.2s;
}
.pq-field input::placeholder,
.pq-field textarea::placeholder{
    color:#8b98ad;
}
.pq-field input:focus,
.pq-field textarea:focus{
    outline:none;
    border-color:var(--teal);
    box-shadow:0 0 0 4px rgba(25,201,219,.14);
}
.pq-field textarea{
    resize:vertical;
    min-height:170px;
}
.pq-form-status{
    margin:-4px 0 0;
    font-size:.92rem;
    line-height:1.6;
}
.pq-form-status-success{
    color:var(--teal-dark);
}
.pq-form-status-error{
    color:#c0392b;
}
.pq-partner-banner{
    background:var(--navy);
    border-radius:28px;
    padding:60px 50px;
    text-align:center;
    color:#fff;
    box-shadow:var(--shadow);
    position:relative;
    overflow:hidden;
    margin:0 350px;
}
.pq-partner-banner::before{
    content:"";
    position:absolute;
    width:260px;
    height:260px;
    border-radius:50%;
    background:rgba(25,201,219,.12);
    top:-120px;
    right:-80px;
}
.pq-partner-banner::after{
    content:"";
    position:absolute;
    width:180px;
    height:180px;
    border-radius:50%;
    background:rgba(65,220,236,.08);
    bottom:-90px;
    left:-60px;
}
.pq-partner-banner>*{
    position:relative;
    z-index:2;
}
.pq-partner-banner h2{
    color:#fff;
    font-family:"Manrope",sans-serif;
    font-size:2.2rem;
    margin:0 0 18px;
}
.pq-partner-banner p{
    color:rgba(255,255,255,.82);
    max-width:700px;
    margin:0 auto 30px;
    line-height:1.8;
}
.pq-partner-banner .pq-nav-cta{
    background:linear-gradient(135deg,var(--teal),var(--teal-dark));
    color:#fff;
    box-shadow:0 10px 25px rgba(25,201,219,.3);
}
.pq-partner-banner .pq-nav-cta:hover{
    transform:translateY(-2px);
}
@media (max-width:900px){
    .pq-contact{
        padding:50px 18px 70px;
    }
    .pq-contact-hero{
        margin-bottom:45px;
    }
    .pq-contact-hero h1{
        font-size:2.5rem;
    }
    .pq-partner-banner{
        padding:40px 25px;
    }
    .pq-partner-banner h2{
        font-size:1.8rem;
    }
}

/* faqs pg */
.pq-faq-page {
  width: min(100% - 40px, 1000px);
  margin: 0 auto;
  padding: 76px 0 90px;
}
.pq-faq-hero { /* Hero */
  text-align: center;
  max-width: 760px;
  margin: 0 auto 54px;
}
.pq-faq-hero h1 {
  font-family: "Manrope", sans-serif;
  color: var(--navy);
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 1.05;
  letter-spacing: -.045em;
  margin: 0 0 20px;
}
.pq-faq-hero h1 span {
  color: var(--teal-dark);
}
.pq-faq-hero p {
  max-width: 680px;
  margin: 0 auto;
  color: var(--muted);
  font-size: 1.06rem;
  line-height: 1.8;
}
.pq-faq-list { /* FAQ list */
  display: grid;
  gap: 14px;
  max-width: 860px;
  margin: 0 auto;
}
.pq-faq-item {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 8px 26px rgba(10, 34, 51, .055);
  overflow: hidden;
  transition:
    border-color .2s ease,
    box-shadow .2s ease,
    transform .2s ease;
}
.pq-faq-item:hover {
  border-color: rgba(25, 201, 219, .45);
  box-shadow: 0 12px 32px rgba(10, 34, 51, .08);
}
.pq-faq-item[open] {
  border-color: var(--teal);
  box-shadow: 0 14px 36px rgba(10, 34, 51, .09);
}
.pq-faq-item summary { /* Question */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 23px 26px;
  cursor: pointer;
  list-style: none;
  color: var(--navy);
  font-family: "Manrope", sans-serif;
  font-size: 1rem;
  font-weight: 750;
  line-height: 1.45;
}
.pq-faq-item summary::-webkit-details-marker {
  display: none;
}
.pq-faq-item summary:focus-visible {
  outline: 3px solid rgba(25, 201, 219, .25);
  outline-offset: -3px;
}
.pq-faq-icon { /* Plus / minus icon */
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--cyan-soft);
  color: var(--teal-dark);
  font-size: 1.35rem;
  font-weight: 500;
  line-height: 1;
  transition:
    transform .2s ease,
    background .2s ease,
    color .2s ease;
}
.pq-faq-item[open] .pq-faq-icon {
  background: var(--teal);
  color: #fff;
  transform: rotate(45deg);
}
.pq-faq-answer { /* Answer */
  padding: 0 26px 26px;
}
.pq-faq-answer p {
  margin: 0;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: .95rem;
  line-height: 1.8;
}
.pq-faq-cta { /* Bottom CTA */
  max-width: 860px;
  margin: 58px auto 0;
  padding: 34px 38px;
  border-radius: 22px;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(65, 220, 236, .18),
      transparent 35%
    ),
    var(--navy);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}
.pq-faq-cta-label {
  display: block;
  margin-bottom: 7px;
  color: var(--teal-bright);
  font-size: .78rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.pq-faq-cta h2 {
  margin: 0 0 8px;
  color: #fff;
  font-family: "Manrope", sans-serif;
  font-size: 1.7rem;
  letter-spacing: -.025em;
}
.pq-faq-cta p {
  margin: 0;
  max-width: 570px;
  color: rgba(255, 255, 255, .72);
  font-size: .9rem;
  line-height: 1.6;
}
.pq-faq-cta .pq-nav-cta {
  flex-shrink: 0;
  background: linear-gradient(
    135deg,
    var(--teal),
    var(--teal-dark)
  );
  color: #fff;
  box-shadow: 0 10px 25px rgba(25, 201, 219, .25);
}
@media (max-width: 720px) { /* Responsive */
  .pq-faq-page {
    width: min(100% - 24px, 1000px);
    padding: 50px 0 70px;
  }
  .pq-faq-hero {
    margin-bottom: 38px;
  }
  .pq-faq-hero h1 {
    font-size: 2.45rem;
  }
  .pq-faq-hero p {
    font-size: .98rem;
  }
  .pq-faq-item summary {
    padding: 20px;
    font-size: .95rem;
  }
  .pq-faq-answer {
    padding: 0 20px 22px;
  }
  .pq-faq-answer p {
    font-size: .9rem;
  }
  .pq-faq-cta {
    margin-top: 42px;
    padding: 28px 24px;
    flex-direction: column;
    align-items: flex-start;
  }
  .pq-faq-cta .pq-nav-cta {
    width: 100%;
  }
}

//news pg
.pq-news{width:100%;max-width:1000px;margin:0 auto;padding:70px 40px 90px}
.pq-news-hero{text-align:center;max-width:760px;margin:70px auto 55px}
.pq-news-hero h1{font-family:"Manrope",sans-serif;color:var(--navy);font-size:clamp(2.5rem,5vw,4rem);line-height:1.05;letter-spacing:-.04em;margin:0 0 20px}
.pq-news-hero h1 span{color:var(--teal-dark)}
.pq-news-hero p{color:var(--muted);font-size:1.08rem;line-height:1.8;max-width:700px;margin:0 auto}
.pq-news-featured{position:relative;overflow:hidden;display:grid;grid-template-columns:170px 1fr;gap:30px;max-width:1050px;background:radial-gradient(circle at 100% 0%,rgba(65,220,236,.14),transparent 45%),linear-gradient(135deg,#fff,var(--cyan-soft));border:1px solid var(--line);border-radius:var(--radius);padding:34px;box-shadow:var(--shadow);margin:0 auto 70px}
.pq-news-featured::after{content:"";position:absolute;width:180px;height:180px;border-radius:50%;background:rgba(25,201,219,.07);right:-80px;bottom:-90px}
.pq-news-featured-label{align-self:start;display:inline-flex;justify-content:center;align-items:center;padding:9px 15px;border-radius:999px;background:var(--navy);color:#fff;font-size:.76rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;width:max-content}
.pq-news-featured-content{position:relative;z-index:2}
.pq-news-date{color:var(--teal-dark);font-size:.8rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:9px}
.pq-news-featured h2{font-family:"Manrope",sans-serif;color:var(--navy);font-size:1.8rem;line-height:1.2;margin:0 0 14px}
.pq-news-featured p{color:var(--muted);line-height:1.7;margin:0 0 18px;max-width:650px}
.pq-news-link{display:inline-flex;align-items:center;gap:6px;color:var(--teal-dark);font-weight:800;text-decoration:underline;text-underline-offset:3px;transition:.2s ease}
.pq-news-link:hover{color:var(--navy)}
.pq-news-section{width:100%;margin:0 auto 70px}
.pq-news-section-heading{text-align:center;max-width:700px;margin:0 auto 28px}
.pq-news-section-heading .pq-section-tag{margin-bottom:14px}
.pq-news-section-heading h2{font-family:"Manrope",sans-serif;color:var(--navy);font-size:2rem;margin:0 0 10px}
.pq-news-section-heading p{color:var(--muted);line-height:1.7;margin:0}
.pq-news-empty{text-align:center;width:100%;max-width:760px;background:#fff;border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:45px 30px;margin:0 auto}
.pq-news-empty-icon{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;margin:0 auto 18px;background:var(--cyan-soft);color:var(--teal-dark);font-size:1.4rem;font-weight:800}
.pq-news-empty h3{font-family:"Manrope",sans-serif;color:var(--navy);font-size:1.35rem;margin:0 0 10px}
.pq-news-empty p{max-width:580px;margin:0 auto 24px;color:var(--muted);line-height:1.7}
.pq-news-cta{position:relative;overflow:hidden;max-width:1050px;background:var(--navy);color:#fff;border-radius:28px;padding:55px 40px;text-align:center;box-shadow:var(--shadow);margin:0 auto}
.pq-news-cta::before{content:"";position:absolute;width:250px;height:250px;border-radius:50%;background:rgba(25,201,219,.12);top:-130px;right:-70px}
.pq-news-cta::after{content:"";position:absolute;width:180px;height:180px;border-radius:50%;background:rgba(65,220,236,.07);bottom:-100px;left:-60px}
.pq-news-cta>*{position:relative;z-index:2}
.pq-news-cta h2{font-family:"Manrope",sans-serif;color:#fff;font-size:2rem;margin:0 0 12px}
.pq-news-cta p{color:rgba(255,255,255,.8);line-height:1.7;max-width:620px;margin:0 auto 25px}
.pq-news-cta .pq-nav-cta{background:linear-gradient(135deg,var(--teal),var(--teal-dark));color:#fff;box-shadow:0 10px 25px rgba(25,201,219,.3)}
@media(max-width:900px){.pq-news{padding:50px 18px 70px}.pq-news-featured{grid-template-columns:1fr;gap:18px;padding:26px}.pq-news-featured-label{width:max-content}.pq-news-hero{margin-bottom:45px}.pq-news-hero h1{font-size:2.5rem}.pq-news-featured h2{font-size:1.5rem}.pq-news-cta{padding:42px 25px}.pq-news-cta h2{font-size:1.7rem}}

.pq-brand-logo{height:46px;display:block}

//about us pg
.pq-about{min-height:100%;}
/* Hero */
.pq-about-hero{text-align:center;max-width:900px;margin:0 auto;padding:90px 24px 70px;}
.pq-about-hero h1{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(38px,5vw,64px);line-height:1.05;letter-spacing:-.045em;margin:0 0 22px;}
.pq-about-hero > p:last-child{max-width:700px;margin:0 auto;color:var(--muted);font-size:17px;line-height:1.75;}
/* Shared section */
.pq-about-section{max-width:1180px;margin:0 auto;padding:70px 24px;}
.pq-section-heading{text-align:center;max-width:700px;margin:0 auto 40px;}
.pq-section-heading h2{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(30px,4vw,44px);letter-spacing:-.035em;margin:0;}
/* Eyebrow */
.pq-eyebrow{color:var(--teal-dark);font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin:0 0 12px;}
/* Process */
.pq-process-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.pq-process-card{background:#fff;border:1px solid var(--line);border-radius:22px;padding:30px;min-height:280px;box-shadow:var(--shadow);transition:transform .2s ease,box-shadow .2s ease;}
.pq-process-card:hover{transform:translateY(-5px);box-shadow:0 18px 40px rgba(10,34,51,.13);}
.pq-process-number{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;background:var(--cyan-soft);color:var(--teal-dark);font-size:14px;font-weight:800;margin-bottom:26px;}
.pq-process-card h3{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:22px;margin:0 0 12px;}
.pq-process-card p{color:var(--muted);font-size:14px;line-height:1.7;margin:0;}
/* Mission / Vision */
.pq-about-mission{padding-top:30px;}
.pq-about-two-column{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;}
.pq-about-info-card{background:#fff;border:1px solid var(--line);border-radius:26px;padding:34px;box-shadow:var(--shadow);}
.pq-about-icon{width:58px;height:58px;border-radius:16px;background:var(--cyan-soft);color:var(--teal-dark);display:grid;place-items:center;margin-bottom:24px;}
.pq-about-info-card h2{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:27px;line-height:1.2;letter-spacing:-.025em;margin:0 0 18px;}
.pq-about-info-card p:not(.pq-eyebrow){color:var(--muted);font-size:14px;line-height:1.75;margin:0 0 15px;}
.pq-about-info-card p:last-child{margin-bottom:0;}
/* Growth section */
.pq-about-growth{margin-top:40px;background:var(--navy);color:#fff;padding:90px 24px; margin-left:350px;margin-right:350px;border-radius:20px}
.pq-about-growth-inner{max-width:850px;margin:0 auto;text-align:center;}
.pq-about-growth .pq-eyebrow{color:var(--teal-bright);}
.pq-about-growth h2{font-family:'Plus Jakarta Sans',sans-serif;color:#fff;font-size:clamp(32px,4vw,48px);line-height:1.1;letter-spacing:-.035em;margin:0 0 26px;}
.pq-about-growth p:not(.pq-eyebrow){color:rgba(255,255,255,.78);font-size:15px;line-height:1.8;margin:0 auto 18px;}
.pq-about-button{margin-top:18px;display:inline-flex;align-items:center;gap:8px;}
/* Responsive */
@media(max-width:800px){.pq-about-hero{padding:65px 20px 50px;}.pq-process-grid,.pq-about-two-column{grid-template-columns:1fr;}.pq-about-section{padding:50px 20px;}.pq-about-info-card{padding:28px;}.pq-about-growth{padding:65px 20px;}}

//careers pg
.pq-careers{min-height:100%;}
.pq-careers-hero{text-align:center;max-width:850px;margin:0 auto;padding:90px 24px 70px;}
.pq-careers-hero h1{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(38px,5vw,62px);line-height:1.05;letter-spacing:-.045em;margin:0 0 22px;}
.pq-careers-hero > p:last-child{max-width:700px;margin:0 auto;color:var(--muted);font-size:17px;line-height:1.75;}
.pq-careers-values{max-width:1180px;margin:0 auto;padding:20px 24px 80px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.pq-careers-value{background:#fff;border:1px solid var(--line);border-radius:22px;padding:30px;box-shadow:var(--shadow);transition:transform .2s ease,box-shadow .2s ease;}
.pq-careers-value:hover{transform:translateY(-5px);box-shadow:0 18px 40px rgba(10,34,51,.13);}
.pq-careers-icon{width:58px;height:58px;border-radius:16px;background:var(--cyan-soft);color:var(--teal-dark);display:grid;place-items:center;margin-bottom:22px;}
.pq-careers-value h3{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:21px;margin:0 0 10px;}
.pq-careers-value p{color:var(--muted);font-size:14px;line-height:1.7;margin:0;}
.pq-careers-openings{max-width:1080px;margin:0 auto 80px;padding:0 24px;}
.pq-careers-openings-inner{background:var(--navy);color:#fff;border-radius:28px;padding:75px 40px;text-align:center;box-shadow:var(--shadow);}
.pq-careers-openings .pq-eyebrow{color:var(--teal-bright);}
.pq-careers-openings h2{font-family:'Plus Jakarta Sans',sans-serif;color:#fff;font-size:clamp(30px,4vw,44px);letter-spacing:-.035em;margin:0 0 18px;}
.pq-careers-openings p:not(.pq-eyebrow){max-width:650px;margin:0 auto;color:rgba(255,255,255,.78);font-size:15px;line-height:1.8;}
.pq-careers-button{margin-top:28px;}
@media(max-width:800px){.pq-careers-hero{padding:65px 20px 50px;}.pq-careers-values{grid-template-columns:1fr;padding:20px 20px 60px;}.pq-careers-openings{padding:0 20px;margin-bottom:60px;}.pq-careers-openings-inner{padding:60px 24px;}}

//founder story pg
.pq-founder h1{text-align:center}
.pq-founder-hero{text-align:center;max-width:920px;margin:0 auto;padding:90px 24px 75px}
.pq-founder-hero h1{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(40px,5vw,68px);line-height:1.04;letter-spacing:-.05em;margin:0 0 24px;text-align:center}
.pq-founder-hero-copy{max-width:720px;margin:0 auto 28px;color:var(--muted);font-size:17px;line-height:1.75;text-align:center}
.pq-founder-hero .pq-eyebrow{text-align:center}
.pq-founder-cta{display:inline-flex;margin:8px auto 0}
.pq-founder-cta{margin-top:8px}
.pq-founder-section{max-width:1180px;margin:0 auto;padding:75px 24px}
.pq-founder-intro{padding-top:30px}
.pq-founder-intro-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:30px;align-items:stretch}
.pq-founder-profile{background:#fff;border:1px solid var(--line);border-radius:26px;padding:36px;box-shadow:var(--shadow)}
.pq-founder-avatar{width:86px;height:86px;border-radius:22px;background:var(--cyan-soft);color:var(--teal-dark);display:grid;place-items:center;margin-bottom:40px}
.pq-founder-profile h2{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:30px;letter-spacing:-.03em;margin:0 0 14px}
.pq-founder-profile>p:not(.pq-eyebrow){color:var(--muted);font-size:14px;line-height:1.75;margin:0}
.pq-founder-insight{background:var(--navy);border-radius:26px;padding:42px;color:#fff;box-shadow:var(--shadow);display:flex;flex-direction:column;justify-content:center}
.pq-founder-insight .pq-eyebrow{color:var(--teal-bright)}
.pq-founder-insight h2{font-family:'Plus Jakarta Sans',sans-serif;color:#fff;font-size:clamp(30px,4vw,46px);line-height:1.1;letter-spacing:-.04em;margin:0 0 22px}
.pq-founder-insight p:not(.pq-eyebrow){color:rgba(255,255,255,.78);font-size:15px;line-height:1.8;margin:0 0 16px}
.pq-founder-insight p:last-child{margin-bottom:0}
.pq-founder-story{padding-top:60px}
.pq-founder-story-inner{max-width:820px;margin:0 auto}
.pq-founder-story-inner h2{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(30px,4vw,46px);line-height:1.12;letter-spacing:-.04em;margin:0 0 28px}
.pq-founder-story-inner p:not(.pq-eyebrow){color:var(--muted);font-size:15px;line-height:1.85;margin:0 0 20px}
.pq-founder-story-inner p:last-child{margin-bottom:0}
.pq-founder-idea{margin:20px 24px 0;background:var(--cyan-soft);border:1px solid rgba(25,201,219,.2);border-radius:30px;padding:85px 24px;margin-left:350px;margin-right:350px}
.pq-founder-idea-inner{max-width:850px;margin:0 auto;text-align:center}
.pq-founder-idea-icon{width:68px;height:68px;border-radius:20px;background:#fff;color:var(--teal-dark);display:grid;place-items:center;margin:0 auto 24px;box-shadow:0 10px 28px rgba(10,34,51,.08)}
.pq-founder-idea h2{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(32px,4vw,50px);line-height:1.1;letter-spacing:-.04em;margin:0 0 26px}
.pq-founder-idea p:not(.pq-eyebrow){max-width:760px;margin:0 auto 18px;color:var(--muted);font-size:15px;line-height:1.8}
.pq-founder-idea p:last-child{margin-bottom:0}
.pq-founder-model{padding-top:85px;padding-bottom:85px}
.pq-founder-model .pq-section-heading{max-width:780px;margin:0 auto 42px;text-align:center}
.pq-founder-model .pq-section-heading h2{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(30px,4vw,44px);line-height:1.1;letter-spacing:-.035em;margin:0 0 14px}
.pq-founder-model .pq-section-heading>p:last-child{color:var(--muted);font-size:15px;line-height:1.7;margin:0}
.pq-founder-model-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.pq-founder-model-card{background:#fff;border:1px solid var(--line);border-radius:22px;padding:32px;box-shadow:var(--shadow);transition:transform .2s ease,box-shadow .2s ease}
.pq-founder-model-card:hover{transform:translateY(-5px);box-shadow:0 18px 40px rgba(10,34,51,.13)}
.pq-founder-model-icon{width:58px;height:58px;border-radius:16px;background:var(--cyan-soft);color:var(--teal-dark);display:grid;place-items:center;margin-bottom:24px}
.pq-founder-model-card h3{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:21px;margin:0 0 12px}
.pq-founder-model-card p{color:var(--muted);font-size:14px;line-height:1.75;margin:0}
.pq-founder-vision{margin:20px 24px 0;background:var(--navy);color:#fff;border-radius:30px;padding:90px 24px;margin-left:350px;margin-right:350px}
.pq-founder-vision-inner{max-width:850px;margin:0 auto;text-align:center}
.pq-founder-vision .pq-eyebrow{color:var(--teal-bright)}
.pq-founder-vision h2{font-family:'Plus Jakarta Sans',sans-serif;color:#fff;font-size:clamp(34px,4.5vw,54px);line-height:1.08;letter-spacing:-.04em;margin:0 0 26px}
.pq-founder-vision p:not(.pq-eyebrow){color:rgba(255,255,255,.78);font-size:15px;line-height:1.85;margin:0 auto 24px;max-width:760px}
.pq-founder-vision-button{margin-top:8px}
.pq-button{border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 20px;border-radius:10px;font-weight:700;font-family:inherit;background:var(--teal);color:#fff;transition:transform .2s ease,background .2s ease,box-shadow .2s ease}
.pq-button:hover{transform:translateY(-2px);background:var(--teal-dark);box-shadow:0 10px 24px rgba(25,201,219,.22)}
.pq-button:focus-visible{outline:3px solid var(--teal);outline-offset:2px}
@media(max-width:900px){.pq-founder-intro-grid{grid-template-columns:1fr}.pq-founder-model-grid{grid-template-columns:1fr 1fr}.pq-founder-section{padding:60px 20px}}
@media(max-width:650px){.pq-founder-hero{padding:65px 20px 50px}.pq-founder-hero h1{font-size:clamp(36px,10vw,52px)}.pq-founder-section{padding:50px 20px}.pq-founder-profile,.pq-founder-insight{padding:28px}.pq-founder-model-grid{grid-template-columns:1fr}.pq-founder-idea{margin:10px 12px 0;padding:65px 20px}.pq-founder-vision{margin:10px 12px 0;padding:65px 20px}.pq-founder-idea h2,.pq-founder-vision h2{font-size:34px}}

/* Who We Serve Page */
.pq-whoserve{min-height:100%;background:var(--bg)}
.pq-whoserve-hero{text-align:center;max-width:820px;margin:0 auto;padding:90px 24px 70px}
.pq-whoserve-hero h1{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(38px,5vw,64px);line-height:1.05;letter-spacing:-.045em;margin:0 0 22px}
.pq-whoserve-hero h1 span{color:var(--teal)}
.pq-whoserve-hero>p{max-width:700px;margin:0 auto;color:var(--muted);font-size:17px;line-height:1.75}
.pq-whoserve-tabs{display:flex;gap:12px;max-width:820px;margin:0 auto;padding:0 24px 32px;border-bottom:1px solid var(--line);justify-content:center;flex-wrap:wrap}
.pq-whoserve-tab{background:none;border:none;padding:12px 0;font-size:15px;font-weight:600;color:var(--muted);cursor:pointer;border-bottom:3px solid transparent;transition:color .2s,border-color .2s}
.pq-whoserve-tab:hover{color:var(--teal)}
.pq-whoserve-tab.active{color:var(--teal);border-bottom-color:var(--teal)}
.pq-whoserve-content{max-width:820px;margin:0 auto;padding:50px 24px}
.pq-whoserve-content h2{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(28px,4vw,42px);line-height:1.15;letter-spacing:-.03em;margin:0 0 24px}
.pq-whoserve-content p{color:var(--muted);font-size:16px;line-height:1.8;margin:0 0 20px}
.pq-whoserve-content h3{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:18px;font-weight:600;margin:24px 0 16px}
.pq-whoserve-list{list-style:none;padding:0;margin:0 0 20px}
.pq-whoserve-list li{color:var(--muted);font-size:16px;line-height:1.8;margin:0 0 12px;padding-left:28px;position:relative}
.pq-whoserve-list li:before{content:'✓';position:absolute;left:0;color:var(--teal);font-weight:700}
@media(max-width:800px){.pq-whoserve-hero{padding:65px 20px 50px}.pq-whoserve-tabs{padding:0 20px 24px}.pq-whoserve-content{padding:40px 20px}}

/* Partners Page */
.pq-partners{min-height:100%;background:var(--bg)}
.pq-partners-hero{text-align:center;max-width:820px;margin:0 auto;padding:90px 24px 70px}
.pq-partners-hero h1{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(36px,4vw,52px);line-height:1.05;letter-spacing:-.045em;margin:0 0 22px}
.pq-partners-hero h1 span{color:var(--teal)}
.pq-partners-hero p{max-width:700px;margin:0 auto 16px;color:var(--muted);font-size:16px;line-height:1.8}
.pq-partners-tabs{display:flex;gap:12px;max-width:820px;margin:0 auto;padding:0 24px 32px;border-bottom:1px solid var(--line);justify-content:center;flex-wrap:wrap}
.pq-partners-tab{background:none;border:none;padding:12px 0;font-size:15px;font-weight:600;color:var(--muted);cursor:pointer;border-bottom:3px solid transparent;transition:color .2s,border-color .2s}
.pq-partners-tab:hover{color:var(--teal)}
.pq-partners-tab.active{color:var(--teal);border-bottom-color:var(--teal)}
.pq-partners-content{max-width:820px;margin:0 auto;padding:50px 24px}
.pq-partners-content h2{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(28px,4vw,42px);line-height:1.15;letter-spacing:-.03em;margin:0 0 24px}
.pq-partners-content p{color:var(--muted);font-size:16px;line-height:1.8;margin:0 0 20px}
.pq-partners-content h3{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:18px;font-weight:600;margin:24px 0 16px}
.pq-partners-list{list-style:none;padding:0;margin:0 0 20px}
.pq-partners-list li{color:var(--muted);font-size:16px;line-height:1.8;margin:0 0 12px;padding-left:28px;position:relative}
.pq-partners-list li:before{content:'•';position:absolute;left:0;color:var(--teal);font-weight:700}
.pq-partners-forward{max-width:820px;margin:0 auto;padding:50px 24px;background:var(--panel);border-radius:22px;text-align:center}
.pq-partners-forward h2{font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);font-size:clamp(28px,4vw,42px);line-height:1.15;letter-spacing:-.03em;margin:0 0 24px}
.pq-partners-forward p{color:var(--muted);font-size:16px;line-height:1.8;margin:0 0 16px}
.pq-partners-forward p:last-child{margin-bottom:0}
@media(max-width:800px){.pq-partners-hero{padding:65px 20px 50px}.pq-partners-content{padding:40px 20px}.pq-partners-tabs{padding:0 20px 24px}.pq-partners-forward{padding:40px 20px}}
`;

