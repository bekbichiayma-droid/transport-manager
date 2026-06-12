import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─── Firebase ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyARYKf4Pb_dqCK5LNdXy7O0Qc9m5dBAmQw",
  authDomain: "transport-manager-ad237.firebaseapp.com",
  projectId: "transport-manager-ad237",
  storageBucket: "transport-manager-ad237.firebasestorage.app",
  messagingSenderId: "860986135089",
  appId: "1:860986135089:web:34f06d2b7c6c2014ba7b10",
  measurementId: "G-7HHPV2PCK0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const BRAND_BANNER = "/figeac-banner.png";

// ─── Master Data ─────────────────────────────────────────────────────────────
const TIMELINE_STEPS = ["Créé", "Prêt à expédier", "Expédié", "Douane", "Livré"];
const STATUTS = [...TIMELINE_STEPS, "Bloqué", "Annulé"];
const TRANSPORTS = ["AERIEN", "Routier", "Maritime", "Express"];
const PRIORITES = ["Normale", "Haute", "Urgente"];
const DOUANE = ["N/A", "En cours", "Dédouané", "Bloqué douane"];
const ENTITES = ["FIGEAC AERO", "Casablanca Aéronautique", "Autre"];
const uniqueList = (items) => Array.from(new Set(items.map((x) => String(x).trim()).filter(Boolean)));

// Change these lists any time you want.
const FOURNISSEURS = uniqueList(["AUVERGNE AERONAUTIQUE",
"FARO EUROPE GMBH & CO. KG",
"PPG AEROSPACE",
"ACCEL",
"ANAL",
"AMPERE INDUSTRIE S.A.S",
"ANFRAY - LE HAVRE",
"ASTHEO TECHNOLOGIES",
"SCEI - BEZY",
"BOREL FRANCE SAS",
"BOUTMY SA",
"BRENNTAG",
"BROSSES DE METALLISATION PYRENEES",

"CORELEC",
"COURBIS",
"LE CRENEAU INDUSTRIEL",
"CREUZET AERONAUTIQUE",
"DASSAULT AVIATION FALCON SPARES",
"DELTECH",
"LABORATOIRE ECCI",
"ETUDE CONCEPTION OUTILLAGE TRAITEMENT",
"ERICHSEN",
"GACHES CHIMIE SPECIALITES",
"GANTOIS INDUSTRIES SAS",
"SOCIETE HUMEAU",
"JEAN BREL",
"BARAT LHOTELLIER",
"L'HOTELLIER - UTC AEROSPACE SYSTEMS",
"DAHER AEROSPACE - INDUSTRIE",
"RESSORTS MASSELIN",
"MCA NUMRIC",
"MECALASER",
"OVIO INSTRUMENTS",
"PAULSTRA SNC",
"SATAIR FRANCE",
"SERVICE CENTRE AERO",
"SERVI MECA",
"SHERWIN BABB CO",
"SLETI",
"SOLSI-TEC",
"THYSSENKRUPP MATERIALS <FRANCE>",
"INTERTURBINE AVIATION LOGISTICS GMBH",
"VINK FRANCE",
"YELLOZ COMPONENTS",
"PAOLO ASTORI SPA",
"KATTAN AEROSERVICES",
"RUBAN DE NORMANDIE",
"TRISTONE FLOWTECH FRANCE",
"UAC EUROPE SRL",
"AKZO NOBEL AEROSPACE COATINGS BV",
"ALL METAL SERVICES LTD",
"ALCAN CMIC",
"AERO NEGOCE INTERNATIONAL",
"ARESLASER S.A.S",
"ARM",
"SHERWIN BABB CO",
"BVQI FRANCE",
"C.B.A.",
"PPG COATING S.A.",
"PTP",
"COMPTOIR GENERAL DES METAUX",
"COMPTOIR  GENERAL DU RESSORT",
"CORSE COMPOSITE AERONAUTIQUE",
"JPR",
"JV COATING",
"EJM",
"L'ELECTROLYSE",
"EQUIPEMENTS SPECIAUX POUR L'AVIATION",
"ANIXTER FRANCE",
"ALCOA FASTENING SYSTEMS",
"HAVER & BOECKER OHG",
"INDRAERO - SIREN",
"JACOTTET INDUSTRIE",
"JAVAUX",
"KDI KMS AERO",
"LAMECO",
"LPO",
"MANKIEWICZ FRANCE",
"MAPAERO S.A.",
"MECAPROTEC",
"MOULAGE PLASTIQUE DU MIDI",
"OCCITANIE PLASTIQUES",
"OXYGRAVURE",
"INCORA",
"P.M.A",
"POLYSPACE TRELLEBORG",      
"PSD ACIERS",
"ROSLER-FRANCE",
"S.E.E.",
"SMN",
"SNECMA",
"SOCOMOR",  
"SOFRANEL",
"SPECITUBES",
"CASTLE METALS FRANCE",
"TW.METALS",
"VARENNE ", 
"LE VULCAIN",
"WEBER METAUX",
"ADHETEC",
"NYCO",
"AIRCELLE LE HAVRE",
"SIMAIR",
"CMP SAS GROUPE B/E AEROSPACE",
"E.S.M.",
"HOWMET AEROSPACE",
"MAP COATING",
"EADS COMPOSITE AQUITAINE",
"ETS SOMECO",
"CONSTELLIUM AVIATBE",
"MPQ ELECTRONIQUE",
"SONACA ENGINEERING SERVICES",
"MECANUMERIC",
"AUBRY-NTV",
"SOCIETE SPECIALISTE DE SOUDAGE",
"PAINT SERVICES  GROUP LTD",
"3P PERFORMANCE PLASTICS PRODUCTS",
"TRIUMPH CONTROLS FRANCE",
"SABCA",
"AUVERGNE AERONAUTIQUE GROUPE",
"EUROCOPTER",
"AIR COST CONTROL",
"PIRAMIDE",
"APPLUS + LABORATORIES",
"LISI FRANCE",
"CMP SAS GROUPE B/E AEROSPACE",
"OMYA SAS",
"TESTWELL S.A.S",
"TIMET SAVOIE SERVICE CENTER",
"STARPLAST",
"TEAM PLASTIQUE",
"BRANT INDUSTRIE",
"EADS SOGERMA",
"VEREINIGTE ELEKTRONIKWERKSTATTEN GMBH",
"ALIGN AEROSPACE",
"ATELIERS DE LA HAUTE GARONNE",
"SREM TECHNOLOGIES",
"RUBIX FRANCE",
"AALBERTS SURFACE TREATMENT",
"MESURE",
"EUROP3D",
"FIT - ESIC",
"CETIM FRANCE",
"RAPID TIMBRE",
"AEROLIA SAS AH 34287450",
"EDMOND ALLAIN & SUCCESSEURS",
"REHAU SA",
"AIRBUS HELICOPTERS",
"NUM SAS",
" SODIP",
"ACORE INDUSTRIE",
"SONACA",
"3P PERFORMANCE PLASTICS PRODUCTS",
"C.M.I.C",
"AREF",
"SLTS",
"GRAVOTECH MARKING",
"FORTERRO FRANCE",
"STELIA AEROSPACE TOULOUSE",
"LE JOINT FRANÇAIS",
"AIRBUS GMBH",
"CADNUM",
"CENTRO DE ANÁLISIS AGROPECUARIOS",
"ON.ING.SARL",
"SEALANTS EUROPE SAS",
"FIGEAC AERO AUXERRE",
"WULFMEYER AIRCRAFT INTERIOR",
"STELIA AEROSPACE COMPOSITES",
"ABICOM INFORMATIQUE",
"MECAHERS",
"STEN",
"RS BEFI",
"TURCO ESPAÑOLA, S.A.",
"FRANCE MAROC MANTENANCE",
"ATELIERS LE MAUFF S.A.S",
"SAFRAN NACELLE LE HAVRE",
"FIGEAC AERO",
"STELIA AEROSPACE (STNZ)",
"ECKO TECH",
"HG AEROSPACE ENGINEERING LTD",
"ARENIUS TESTS ET ESSAIS INDUSTRIELS",
"STRUCTIL  SAFRAN",
"CONSTELLIUM",
"PORTELLI PRODUCTIONS",
"VWR INTERNATIONAL S.A.S",
"NORELEM",
"MECABRIVE INDUSTRIES",
"FIGEAC AÉRO TUNISIE",
"DOSAGE 2000",
"ATEMA",
"ACTEMIUM",
"VERO SOFTWARE",
"SN AUVERGNE AERONAUTIQUE",
"INGENIERIE.CHAUDRONERIE.AERONAUTIQUE",
" AIRBUS ATLANTIC",
"BERGERET JEANNET",
"BUREAU VERITAS",
"FREUDENBERG",
"LVD S.A",
"SMN",
"HOFFMANN GROUP",
"MANUFACTURING PROCESS SPECIFICATION",
"TITANIA, ENSAYOS Y PROYECTOS IND. S.L.",
"SPECITUBES S.A.S",
"AGILEA CONSIEL",
"NU-PRO LIMITED TS",
"SCEI SAS",
"WHITFORD-LTD",
"STELIA AEROSPACE SKY PARK BUILDING",
"COMPOSITES DISTRIBUTION",
"ALMA",
"GARDCO",
"SASU IMSC, INDUSTRIE",
"SMITHS METAL CENTRES",
"TRADE ADVERTISING SERVICES LTD",
"SIL-MID LTD",
"AMADA",
"ANALYSES SUFACE",
"INTEC.AIR",
"IPS LASER",
"TWINBIN HURST GREEN PLASTICS LTD",
"LAFI",
"E.R.P.O.",
"BOSSARD AEROSPACE",
"MÉCANIQUE DE PRÉCISION",
"ROLHION ET CIE SA",
"HOWMET AEROSPACE",
"BALTEAU NDT",
"SOCLAM",
"ILP LASER",
"SPI AERO",
"HUTCHINSON",
"AQMO-ISSA",
"OTTO FUCHS",
"TRATAMIENTOS TÉRMICOS TTT, S.A",
"PFW AEROSPACE GMBH",
"MERCK CHIMIE S.A.S.",
"AGICOM",
"TEBALDI EURL",
"TESTIA FRANCE",
"AERO METALLIC",
"FERONYL",
"SAFRAN AIRCRAFT ENGINES",
"CENTRE DE VERIFICATION DE METZ",
"SPITFIRE",
"KASTENS & KNAUER GMBH & CO. INTERNATIONA",
"ATI METALS",
"NORMADOC",
"AEROMETALS & ALLOYS",
"ARRK SHAPERS FRANCE",
"BOLLHOFF GILLIS",
"MEGGER",
"BODO MOLLER CHEMIE",
"INTEGRA SYSTEME",
"EYRAUD SAS",
"DIS RELAITING SOLUTIONS",
"SFS INTEC GMBH",
"ALERIS ROLLED PRODUCTS",
"BARCELONES DE DROGAS Y PRODUCTOS QUIMICO",
"MABEO INDUSTRIE",
"SCC",
"PRECITEC",
"ADMI INDUSTRIE (GROUPE MACMAS)",
"GAZC",
"SGS FRANCE - LABORATOIRE D'ESSAIS / TEST",
"AVIATEC GLOBAL AVIATION",
"INFORMATIQUE MAINTENANCE SERVICES",
"SOCAT",
"METAVIA BRAMI",
"HAYNES INTERNATIONAL SARL",
"CIN MONOPOL SAS",
"FUNDACION CENTRO TECNOLOGICO DE MIRANDA",
"PRIMES GMBH",
"INTEC AIR SL",
"AFNOR CERTIFICATION",
"AUBERT & DUVAL",
"AEROSPACE METAL FINISHERS",
"ELEMENT MATERIALS TECHNOLOGY",
"BARTHELEMY",
"SELECTARC",
"NEXAM",
"AOS FRANCE",
"WOLFRAM- INDUSTRIE MBH",
"NIMROD AEROSTRUCTURES",
"ALA FRANCE",
"AB SERVE",
"MAKINO SAS",
"BET CEI",
"SOGEMA",
"WENZEL",
"TECHNIFILTRE",
"RENISHAW",
"ZOLLER",
"HUTCHINSON",
"FM2I",
"UNCETA",
"SHYMAT",
"GALVATEC",
"MANUTAN SA",
"SFH",
"NEUJKF",
"METROLOGIC GROUP S.A.S",
"SETAM",
"CNDT SOLUTION",
"HAAS-SUDFRANCE",
"INTECH AUTOMAZIONE SRL",
"MGP LACAN",
"SCHUNK INTEC",
"KLEENEZE KOTI LIMITED",
"ADDEV MATERIALS AEROSPACE SAS",
"THERMIDOR",
"JACOMEX",
"EGCI",
"WALTER FRANCE SAS",
"APOLLO AEROSPACE COMPONENTS",
"P.M. TITANIO S.R.L.",
"SCHILTZ",
"MICROPULSE PLATING CONCEPTS",
"BOURDIN SARL",
"SAS AIR FORMATION",
"HEXAGON METROLOGY SAS",
"MAPAL FRANCE",
"ARKANIA GROUP",
"HOWMET AEROSPACE",
"HOWMET AEROSPACE",
"EYNARD ROBIN",
"CINCINNATIVR",
"MULTISTATION",
"MACH AERO",
"SWIFT AEROSPACE FRANCE",
"GMAPSA",
"BSI",
"FORAMAG",
"CGRS",
"SEBIM",
"AEROCOM METALS LTD.",
"ECHOLINE",
"AVIATUBE",
"CGR LPI",
"MP USICAP",
"SMAC",
"RECAERO",
"IBAG HSC TECHNOLOGY",
"AEROTRADE",
"ACCESSOIRES MATÉRIELS DIFFUSION SERVICES",
"JOUANIN-MARCHAND",
"SAT EQUIPEMENTS THERMIQUES INDUSTRIELS",
"SMOT 47",
"SANDVIK TOOLING",
"MMC METAL FRANCE",
"AEROLEAN SUPPLY",
"S+D METALS GMBH",
"SUPRAERO",
"NEHLSEN-BWB FLUGZEUG-GALVANIK DRESDEN",
"NMB MINEBEA SARL",
"TECHNICIS",
"SIEBEC",
"ALUMINIUMWERK UNNA AG",
"ELCO",
"AIR COST CONTROL",
"ALL METAL SERVICES LTD",
"ALLIANCE AUTOMOTIVE GRAND SUD",
"SKILL PARTNER BORDEAUX",
"DEVATECH",
"AFNOR COMPETENCES",
"SMITHS ADVANCED METALS",
"MECANUMERIC INDUSTRIES SAS",
"TRANSTEC MACHINES OUTILS",
"KENNAMETAL FRANCE SAS",
"PRECISE FRANCE",
"STAR PROGETTI",
"AAF FRANCE SAS",]);
const CLIENTS = uniqueList(["ABIPA",
"AirBus Blondel",
"AirBus MERIGNAC",
"AirBus MONTOIR",
"Airbus Rochefort",
"Airbus st Nazaire",
"AIRBUS TUNISIE",
"CANAGROSA",
"CREUZET" ,
"DMG MORI",
"Figeac France",
"Figeac Tunisie",
"HEXAGON METROLOGY",
"IDEA LOGISTIQUE", 
"MECABRIVE",
"PFW AEROSPACE",
"PICARDIE",
"PORTELLI",
"PSD",
"RF",
"Safran  Cramayel",
"Safran  EVERY",
"SN Auvergne",
]);

const APPROVISIONNEURS = ["Yassmin El Fathani", "Fatiha ET-TAGRY", "Ahmed Benzari", "Autre"];
const CHARGES_AFFAIRE = ["Ahmed Benzari", "Karim El Amrani", "Sara Alaoui", "Autre"];
const TRANSPORTEURS = ["Chronopost", "Dachser", "DHL", "FedEx", "UPS", "Autre"];
const MARCHANDISES = ["Pièces méca", "Composants", "Outillage", "Structures", "Pièces finies", "Sous-ensembles", "Autre"];

const STATUS_COLORS = {
  "Créé": { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" },
  "Prêt à expédier": { bg: "#e0f2fe", text: "#0369a1", dot: "#0284c7" },
  "Expédié": { bg: "#dbeafe", text: "#1d4ed8", dot: "#3b82f6" },
  "Douane": { bg: "#f3e8ff", text: "#7e22ce", dot: "#9333ea" },
  "Livré": { bg: "#dcfce7", text: "#15803d", dot: "#16a34a" },
  "Bloqué": { bg: "#fee2e2", text: "#dc2626", dot: "#b91c1c" },
  "Annulé": { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
  // Compatibility with old records
  "En attente": { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" },
  "En transit": { bg: "#fef9c3", text: "#854d0e", dot: "#eab308" },
};
const CHART_PALETTE = ["#1e3a5f", "#16a34a", "#b45309", "#b91c1c", "#475569", "#0284c7"];
const TRANSPORT_ICONS = { AERIEN: "✈", Routier: "🚚", Maritime: "🚢", Express: "⚡" };

// ─── Utils ───────────────────────────────────────────────────────────────────
function localDateString(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function now() {
  const d = new Date();
  return `${localDateString(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function today() {
  return localDateString();
}

function calculateDatePrevue(dateExpedition, typeTransport) {
  if (!dateExpedition) return "";
  const daysByTransport = { AERIEN: 3, Express: 1, Routier: 7, Maritime: 30 };
  const d = new Date(`${dateExpedition}T00:00:00`);
  d.setDate(d.getDate() + (daysByTransport[typeTransport] ?? 0));
  return localDateString(d);
}

function calculateRetard(datePrevue, dateLivraison) {
  if (!datePrevue || !dateLivraison) return 0;
  const a = new Date(`${datePrevue}T00:00:00`);
  const b = new Date(`${dateLivraison}T00:00:00`);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function makeId(type) {
  const prefix = type === "import" ? "IMP" : "EXP";
  const stamp = Date.now();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

function canModify(role, type) {
  return role === "admin" || role === type;
}

function normalizeStatus(status) {
  const aliases = {
    "En attente": "Créé",
    "En transit": "Expédié",
  };
  return aliases[status] || status || "Créé";
}

function getTimelineIndex(status) {
  const normalized = normalizeStatus(status);
  const index = TIMELINE_STEPS.indexOf(normalized);
  return index >= 0 ? index : -1;
}

const AUDIT_FIELDS = [
  "entite",
  "fournisseur",
  "approvisionneur",
  "client",
  "chargeAffaire",
  "typeTransport",
  "transporteur",
  "tracking",
  "dateDemande",
  "dateEnlevement",
  "dateExpedition",
  "datePrevue",
  "dateLivraison",
  "statut",
  "typeMarchandise",
  "priorite",
  "retard",
  "statutDouane",
  "observations",
];

function cleanShipment(form) {
  const { firebaseId, createdAt, updatedAt, ...clean } = form;
  return clean;
}

function getChanges(before = {}, after = {}) {
  return AUDIT_FIELDS
    .filter((field) => String(before[field] ?? "") !== String(after[field] ?? ""))
    .map((field) => ({
      field,
      before: String(before[field] ?? ""),
      after: String(after[field] ?? ""),
    }));
}

async function addHistory(user, action, direction, id, label, detail = "", changes = []) {
  await addDoc(collection(db, "history"), {
    action,
    direction,
    id,
    label,
    detail,
    changes,
    ts: now(),
    userEmail: user?.email || "unknown",
    userUid: user?.uid || "unknown",
    createdAt: serverTimestamp(),
  });
}

function formatDateForReport(value) {
  return value ? String(value).slice(0, 10) : "—";
}

function buildReportRows(rows, direction) {
  return rows.map((r) => [
    direction,
    r.id || "—",
    formatDateForReport(r.dateDemande),
    r.entite || "—",
    direction === "Import" ? (r.fournisseur || "—") : (r.client || "—"),
    r.typeTransport || "—",
    r.transporteur || "—",
    r.tracking || "—",
    formatDateForReport(r.dateExpedition),
    formatDateForReport(r.datePrevue),
    formatDateForReport(r.dateLivraison),
    String(r.retard ?? 0),
    r.statut || "—",
    r.priorite || "—",
    r.statutDouane || "—",
  ]);
}

function generatePdfReport({ imports, exports, user, reportType = "all" }) {
  const docPdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const generatedAt = new Date().toLocaleString("fr-FR");

  const selectedImports = reportType === "exports" ? [] : imports;
  const selectedExports = reportType === "imports" ? [] : exports;
  const all = [...selectedImports, ...selectedExports];

  const titleByType = {
    all: "Rapport Global des Shipments",
    imports: "Rapport des Imports",
    exports: "Rapport des Exports",
    delayed: "Rapport des Retards",
  };

  const delayedRows = all.filter((r) => Number(r.retard) > 0 || r.statutDouane === "Bloqué douane");
  const finalImports = reportType === "delayed" ? selectedImports.filter((r) => Number(r.retard) > 0 || r.statutDouane === "Bloqué douane") : selectedImports;
  const finalExports = reportType === "delayed" ? selectedExports.filter((r) => Number(r.retard) > 0 || r.statutDouane === "Bloqué douane") : selectedExports;
  const finalAll = reportType === "delayed" ? delayedRows : all;

  const kpi = {
    total: finalAll.length,
    imports: finalImports.length,
    exports: finalExports.length,
    livres: finalAll.filter((r) => r.statut === "Livré").length,
    retardes: finalAll.filter((r) => Number(r.retard) > 0).length,
    urgents: finalAll.filter((r) => r.priorite === "Urgente").length,
    douane: finalAll.filter((r) => r.statutDouane === "Bloqué douane").length,
  };

  docPdf.setFillColor(15, 23, 42);
  docPdf.rect(0, 0, 297, 27, "F");
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFontSize(18);
  docPdf.text("FIGEAC AERO", 14, 11);
  docPdf.setFontSize(9);
  docPdf.setTextColor(100);
  docPdf.text("Rapport logistique import / export", 14, 17);
  docPdf.setTextColor(0);
  docPdf.setFontSize(11);
  docPdf.text(titleByType[reportType] || titleByType.all, 14, 19);
  docPdf.setFontSize(9);
  docPdf.text(`Généré par: ${user?.email || "unknown"}`, 205, 11);
  docPdf.text(`Date: ${generatedAt}`, 205, 18);

  docPdf.setTextColor(15, 23, 42);
  docPdf.setFontSize(12);
  docPdf.text("Résumé", 14, 38);

  autoTable(docPdf, {
    startY: 42,
    head: [["Total", "Imports", "Exports", "Livrés", "Retards", "Urgents", "Bloqués Douane"]],
    body: [[kpi.total, kpi.imports, kpi.exports, kpi.livres, kpi.retardes, kpi.urgents, kpi.douane]],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    theme: "grid",
  });

  const body = [
    ...buildReportRows(finalImports, "Import"),
    ...buildReportRows(finalExports, "Export"),
  ];

  autoTable(docPdf, {
    startY: docPdf.lastAutoTable.finalY + 10,
    head: [["Direction", "ID", "Date demande", "Entité", "Fournisseur/Client", "Transport", "Transporteur", "Tracking", "Expédition", "Prévue", "Livraison", "Retard", "Statut", "Priorité", "Douane"]],
    body: body.length ? body : [["—", "Aucune donnée", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"]],
    styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: "striped",
    margin: { left: 8, right: 8 },
  });

  const pageCount = docPdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    docPdf.setPage(i);
    docPdf.setFontSize(8);
    docPdf.setTextColor(100, 116, 139);
    docPdf.text(`Page ${i}/${pageCount}`, 270, 202);
  }

  const safeDate = localDateString();
  docPdf.save(`transport-manager-${reportType}-${safeDate}.pdf`);
}


function buildExcelRows(rows, direction) {
  return rows.map((r) => ({
    Direction: direction,
    ID: r.id || "",
    "Date demande d'enlèvement": formatDateForReport(r.dateDemande),
    Entité: r.entite || "",
    "Fournisseur/Client": direction === "Import" ? (r.fournisseur || "") : (r.client || ""),
    Approvisionneur: r.approvisionneur || "",
    "Chargé d'affaire": r.chargeAffaire || "",
    "Type transport": r.typeTransport || "",
    Transporteur: r.transporteur || "",
    Tracking: r.tracking || "",
    "Date enlèvement": formatDateForReport(r.dateEnlevement),
    "Date expédition": formatDateForReport(r.dateExpedition),
    "Date prévue": formatDateForReport(r.datePrevue),
    "Date livraison": formatDateForReport(r.dateLivraison),
    "Retard (jours)": Number(r.retard || 0),
    Statut: normalizeStatus(r.statut),
    Priorité: r.priorite || "",
    Douane: r.statutDouane || "",
    Marchandise: r.typeMarchandise || "",
    Observations: r.observations || "",
  }));
}

function excelColumnName(index) {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    name = String.fromCharCode(65 + r) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function applyExcelLayout(ws, headerRowIndex, rowCount, colCount) {
  const lastCol = excelColumnName(Math.max(colCount - 1, 0));
  const headerRow = headerRowIndex + 1;
  const lastRow = headerRow + Math.max(rowCount, 1);

  ws["!cols"] = Array.from({ length: colCount }, (_, index) => {
    const defaultWidths = [12, 16, 24, 22, 32, 24, 24, 18, 22, 22, 18, 18, 18, 18, 14, 18, 16, 18, 22, 35];
    return { wch: defaultWidths[index] || 18 };
  });

  ws["!autofilter"] = { ref: `A${headerRow}:${lastCol}${lastRow}` };
  ws["!freeze"] = { xSplit: 0, ySplit: headerRow, topLeftCell: `A${headerRow + 1}`, activePane: "bottomLeft", state: "frozen" };
}

function createProfessionalDataSheet({ rows, title, subtitle, emptyMessage }) {
  const headers = rows.length ? Object.keys(rows[0]) : ["Message"];
  const colCount = headers.length;
  const generatedAt = new Date().toLocaleString("fr-FR");

  const ws = XLSX.utils.aoa_to_sheet([
    ["FIGEAC AERO"],
    [title],
    [`${subtitle} · Généré le ${generatedAt}`],
    [],
  ]);

  if (rows.length) {
    XLSX.utils.sheet_add_json(ws, rows, { origin: "A5" });
    applyExcelLayout(ws, 4, rows.length, colCount);
  } else {
    XLSX.utils.sheet_add_aoa(ws, [[emptyMessage]], { origin: "A5" });
    applyExcelLayout(ws, 4, 1, 1);
  }

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(colCount - 1, 0) } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(colCount - 1, 0) } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: Math.max(colCount - 1, 0) } },
  ];

  return ws;
}

function countBy(rows, getter, limit = 5) {
  const counts = {};
  rows.forEach((row) => {
    const key = getter(row);
    if (!key || key === "Autre") return;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => [name, value]);
}

function createSummarySheet({ imports, exports }) {
  const all = [...imports, ...exports];
  const delivered = all.filter((r) => normalizeStatus(r.statut) === "Livré" || r.dateLivraison);
  const delayed = all.filter((r) => Number(r.retard || 0) > 0);
  const onTimeDelivered = delivered.filter((r) => Number(r.retard || 0) <= 0).length;
  const onTimeRate = delivered.length ? Math.round((onTimeDelivered / delivered.length) * 100) : 0;
  const avgDelay = all.length
    ? (all.reduce((sum, r) => sum + Math.max(Number(r.retard || 0), 0), 0) / all.length).toFixed(1)
    : 0;

  const summaryRows = [
    ["FIGEAC AERO"],
    ["Résumé Excel Transport Management System"],
    [`Généré le ${new Date().toLocaleString("fr-FR")}`],
    [],
    ["Indicateur", "Valeur"],
    ["Total opérations", all.length],
    ["Imports", imports.length],
    ["Exports", exports.length],
    ["Livrés", delivered.length],
    ["Retards", delayed.length],
    ["Taux de livraison à temps", `${onTimeRate}%`],
    ["Retard moyen", `${avgDelay} jour(s)`],
    ["Urgents", all.filter((r) => r.priorite === "Urgente").length],
    ["Bloqués douane", all.filter((r) => r.statutDouane === "Bloqué douane").length],
    [],
    ["Top Transporteurs", "Nombre"],
    ...countBy(all, (r) => r.transporteur),
    [],
    ["Top Fournisseurs", "Nombre"],
    ...countBy(imports, (r) => r.fournisseur),
    [],
    ["Top Clients", "Nombre"],
    ...countBy(exports, (r) => r.client),
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryRows);
  ws["!cols"] = [{ wch: 36 }, { wch: 18 }];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
  ];
  return ws;
}

function exportToExcel({ imports = [], exports = [], type = "all" }) {
  const wb = XLSX.utils.book_new();
  const safeDate = localDateString();

  const importRows = buildExcelRows(imports, "Import");
  const exportRows = buildExcelRows(exports, "Export");

  if (type === "all") {
    XLSX.utils.book_append_sheet(wb, createSummarySheet({ imports, exports }), "Résumé");
  }

  if (type === "all" || type === "imports") {
    XLSX.utils.book_append_sheet(
      wb,
      createProfessionalDataSheet({
        rows: importRows,
        title: "Rapport des Imports",
        subtitle: `${importRows.length} import(s)`,
        emptyMessage: "Aucune donnée import",
      }),
      "Imports"
    );
  }

  if (type === "all" || type === "exports") {
    XLSX.utils.book_append_sheet(
      wb,
      createProfessionalDataSheet({
        rows: exportRows,
        title: "Rapport des Exports",
        subtitle: `${exportRows.length} export(s)`,
        emptyMessage: "Aucune donnée export",
      }),
      "Exports"
    );
  }

  const nameByType = {
    all: `FIGEAC-AERO-rapport-global-${safeDate}.xlsx`,
    imports: `FIGEAC-AERO-rapport-imports-${safeDate}.xlsx`,
    exports: `FIGEAC-AERO-rapport-exports-${safeDate}.xlsx`,
  };

  XLSX.writeFile(wb, nameByType[type] || nameByType.all);
}

// ─── UI Components ───────────────────────────────────────────────────────────
function Badge({ label, bg, text, dot }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, backgroundColor: bg, color: text, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: dot }} />
      {label}
    </span>
  );
}

function ShipmentTimeline({ status, compact = false }) {
  const currentIndex = getTimelineIndex(status);
  const isSpecial = currentIndex === -1;
  return (
    <div style={{ width: compact ? 170 : "100%", marginTop: compact ? 6 : 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${TIMELINE_STEPS.length}, 1fr)`, alignItems: "center", gap: 4 }}>
        {TIMELINE_STEPS.map((step, index) => {
          const done = !isSpecial && index <= currentIndex;
          return (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{
                width: compact ? 9 : 13,
                height: compact ? 9 : 13,
                borderRadius: "50%",
                background: done ? "#1e3a5f" : "#cbd5e1",
                border: done ? "2px solid #1e3a5f" : "2px solid #e2e8f0",
                flexShrink: 0
              }} />
              {index < TIMELINE_STEPS.length - 1 && (
                <div style={{ height: 2, flex: 1, background: !isSpecial && index < currentIndex ? "#1e3a5f" : "#e2e8f0" }} />
              )}
            </div>
          );
        })}
      </div>
      {!compact && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${TIMELINE_STEPS.length}, 1fr)`, gap: 4, marginTop: 6 }}>
          {TIMELINE_STEPS.map((step, index) => (
            <div key={step} style={{ fontSize: 10, color: index <= currentIndex ? "#1e3a5f" : "#94a3b8", fontWeight: index === currentIndex ? 900 : 700, textAlign: "center" }}>
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", borderRadius: 22, padding: "22px 24px", boxShadow: "0 18px 45px rgba(15,23,42,.08)", border: "1px solid rgba(226,232,240,.9)", borderTop: `4px solid ${accent}`, flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError("Email or password incorrect, or the user does not exist in Firebase Authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc 0%,#eef2f7 100%)", display: "grid", gridTemplateColumns: "minmax(320px, 1.1fr) minmax(320px, .9fr)", fontFamily: "Segoe UI, system-ui, sans-serif" }}>
      <div style={{ position: "relative", background: "linear-gradient(135deg,#06111f,#0b2a47)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minHeight: "100vh" }}>
        <img src={BRAND_BANNER} alt="FIGEAC AERO" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .42 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(6,17,31,.76),rgba(6,17,31,.38),rgba(255,115,0,.16))" }} />
        <div style={{ position: "relative", zIndex: 2, padding: 44, color: "#fff", maxWidth: 620 }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "#fb923c", marginBottom: 14 }}>Aerospace Logistics Platform</div>
          <h1 style={{ fontSize: 46, lineHeight: 1.05, margin: 0, fontWeight: 950 }}>FIGEAC AERO</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.82)", lineHeight: 1.6, marginTop: 18 }}>Transport Management System for import/export operations, shipment tracking, audit control and PDF reporting.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <span style={{ ...pillStyle, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.18)" }}>☁ Cloud database</span>
            <span style={{ ...pillStyle, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.18)" }}>🔐 Secure access</span>
            <span style={{ ...pillStyle, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.18)" }}>📊 Real-time dashboard</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
        <form onSubmit={login} style={{ width: "min(430px,100%)", background: "#fff", borderRadius: 28, padding: 34, boxShadow: "0 30px 90px rgba(15,23,42,.12)", border: "1px solid #e5e7eb" }}>
          <div style={{ marginBottom: 24 }}>
            <img src={BRAND_BANNER} alt="FIGEAC AERO" style={{ width: "100%", height: 74, objectFit: "cover", borderRadius: 18, marginBottom: 18 }} />
            <h2 style={{ margin: "0 0 6px", color: "#0f172a", fontSize: 26 }}>Welcome back</h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Sign in to access the transport dashboard.</p>
          </div>

          <label style={labelStyle}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@figeac-aero.com" style={loginInputStyle} />

          <label style={labelStyle}>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" style={loginInputStyle} />

          {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: 12, borderRadius: 12, fontSize: 13, marginTop: 12 }}>{error}</div>}

          <button disabled={loading} type="submit" style={{ width: "100%", marginTop: 18, padding: "13px 18px", border: "none", borderRadius: 14, background: loading ? "#94a3b8" : "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff", fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 16px 32px rgba(234,88,12,.22)" }}>
            {loading ? "Signing in..." : "Login"}
          </button>

          <div style={{ marginTop: 18, fontSize: 12, color: "#64748b", background: "#f8fafc", padding: 12, borderRadius: 12 }}>
            Access is managed by Firebase Authentication and Firestore roles: admin, import, or export.
          </div>
        </form>
      </div>
    </div>
  );
}
function Modal({ mode, type, record, onClose, onSave, masterData }) {
  const isImport = type === "import";
  const fournisseursList = masterData?.fournisseurs?.length ? masterData.fournisseurs : FOURNISSEURS;
  const clientsList = masterData?.clients?.length ? masterData.clients : CLIENTS;
  const transporteursList = masterData?.transporteurs?.length ? masterData.transporteurs : TRANSPORTEURS;
  const entitesList = masterData?.entites?.length ? masterData.entites : ENTITES;
  const approvisionneursList = masterData?.approvisionneurs?.length ? masterData.approvisionneurs : APPROVISIONNEURS;
  const chargesAffaireList = masterData?.chargesAffaire?.length ? masterData.chargesAffaire : CHARGES_AFFAIRE;
  const [form, setForm] = useState(record || {
    entite: entitesList[0] || "FIGEAC AERO",
    fournisseur: fournisseursList[0] || "",
    approvisionneur: approvisionneursList[0] || "",
    client: clientsList[0] || "",
    chargeAffaire: chargesAffaireList[0] || "",
    typeTransport: "Routier",
    transporteur: transporteursList[0] || "",
    tracking: "",
    dateDemande: today(),
    dateEnlevement: "",
    dateExpedition: "",
    datePrevue: "",
    dateLivraison: "",
    statut: "Créé",
    typeMarchandise: MARCHANDISES[0],
    priorite: "Normale",
    retard: 0,
    statutDouane: "N/A",
    observations: "",
  });

  const set = (k, v) => {
    setForm((old) => {
      const updated = { ...old, [k]: v };
      if (k === "typeTransport" || k === "dateExpedition") {
        updated.datePrevue = calculateDatePrevue(updated.dateExpedition, updated.typeTransport);
      }
      if (["typeTransport", "dateExpedition", "datePrevue", "dateLivraison"].includes(k)) {
        updated.retard = calculateRetard(updated.datePrevue, updated.dateLivraison);
      }
      if (k === "dateLivraison" && v && updated.statut !== "Annulé") {
        updated.statut = "Livré";
      }
      return updated;
    });
  };

  const field = (label, k, typeInput = "text", opts = null, readOnly = false) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{label}</label>
      {opts ? (
        <select value={form[k] || ""} onChange={(e) => set(k, e.target.value)} style={inputStyle}>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={typeInput} value={form[k] ?? ""} readOnly={readOnly} onChange={(e) => set(k, e.target.value)} style={{ ...inputStyle, background: readOnly ? "#f1f5f9" : "#f8fafc" }} />
      )}
    </div>
  );

  const submit = () => {
    if (!form.entite || !form.typeTransport || !form.transporteur || !form.tracking) {
      alert("Please fill Entité, Type Transport, Transporteur, and Tracking.");
      return;
    }
    onSave(form);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", padding: 12 }}>
      <div style={{ background: "#fff", borderRadius: 26, width: "min(95vw,820px)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 30px 90px rgba(15,23,42,.28)", border: "1px solid rgba(226,232,240,.9)" }}>
        <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: isImport ? "#1e3a5f" : "#b45309", letterSpacing: 1 }}>{isImport ? "IMPORT" : "EXPORT"}</div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{mode === "add" ? "Nouveau shipment" : "Modifier shipment"}</h2>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {field("Entité", "entite", "text", entitesList)}
          {isImport ? <>{field("Fournisseur", "fournisseur", "text", fournisseursList)}{field("Approvisionneur", "approvisionneur", "text", approvisionneursList)}</> : <>{field("Client", "client", "text", clientsList)}{field("Chargé d'affaire", "chargeAffaire", "text", chargesAffaireList)}</>}
          {field("Type de transport", "typeTransport", "text", TRANSPORTS)}
          {field("Transporteur", "transporteur", "text", transporteursList)}
          {field("N° Tracking", "tracking")}
          {field("Type Marchandise", "typeMarchandise", "text", MARCHANDISES)}
          {field("Priorité", "priorite", "text", PRIORITES)}
          {field("Statut", "statut", "text", STATUTS)}
          <div style={{ gridColumn: "1/-1", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 4 }}>Timeline shipment</div>
            <ShipmentTimeline status={form.statut} />
          </div>
          {field("Statut Douane", "statutDouane", "text", DOUANE)}
          {field("Date demande enlèvement", "dateDemande", "date")}
          {field("Date enlèvement", "dateEnlevement", "date")}
          {field("Date expédition", "dateExpedition", "date")}
          {field("Date prévue", "datePrevue", "date", null, true)}
          {field("Date livraison", "dateLivraison", "date")}
          {field("Retard (jours)", "retard", "number", null, true)}
          <div style={{ gridColumn: "1/-1" }}>{field("Observations", "observations")}</div>
        </div>

        <div style={{ padding: "0 28px 24px", display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={secondaryBtn}>Annuler</button>
          <button onClick={submit} style={{ ...primaryBtn, background: isImport ? "#1e3a5f" : "#b45309" }}>{mode === "add" ? "Ajouter" : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

function ShipmentTable({ rows, type, role, onEdit, onDelete, selectedIds = [], onToggleSelect, onToggleAll }) {
  const isImport = type === "import";
  const allowed = canModify(role, type);
  const cols = ["", "Date demande", "Entité", isImport ? "Fournisseur" : "Client", "Transport", "Tracking", "Exp.", "Prévue", "Livraison", "Retard", "Statut", "Douane", "Actions"];
  const allChecked = allowed && rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  return (
    <div style={{ overflowX: "auto", borderRadius: 22, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 16px 36px rgba(15,23,42,.06)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: isImport ? "#f0f9ff" : "#fffbeb" }}>
            {cols.map((c, index) => (
              <th key={`${c}-${index}`} style={{ padding: "12px 14px", textAlign: "left", color: isImport ? "#0369a1" : "#b45309", fontSize: 12, whiteSpace: "nowrap" }}>
                {index === 0 ? (
                  <input
                    type="checkbox"
                    disabled={!allowed || rows.length === 0}
                    checked={allChecked}
                    onChange={(e) => onToggleAll && onToggleAll(e.target.checked)}
                    title="Select all visible rows"
                  />
                ) : c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={cols.length} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucun shipment trouvé</td></tr>}
          {rows.map((row, i) => {
            const sc = STATUS_COLORS[row.statut] || STATUS_COLORS["En attente"];
            const retard = Number(row.retard || 0);
            return (
              <tr key={row.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                <td style={td}>
                  <input
                    type="checkbox"
                    disabled={!allowed}
                    checked={selectedIds.includes(row.id)}
                    onChange={() => onToggleSelect && onToggleSelect(row.id)}
                    title="Select this shipment"
                  />
                </td>
                <td style={td}><b>{formatDateForReport(row.dateDemande)}</b></td>
                <td style={td}>{row.entite}</td>
                <td style={td}>{isImport ? row.fournisseur : row.client}</td>
                <td style={td}>{TRANSPORT_ICONS[row.typeTransport] || "📦"} {row.transporteur}</td>
                <td style={td}><code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 5 }}>{row.tracking}</code></td>
                <td style={td}>{row.dateExpedition || "—"}</td>
                <td style={td}>{row.datePrevue || "—"}</td>
                <td style={td}>{row.dateLivraison || "—"}</td>
                <td style={td}>{retard !== 0 ? <span style={{ color: retard > 0 ? "#dc2626" : "#16a34a", fontWeight: 800 }}>{retard > 0 ? `+${retard}j` : `${retard}j`}</span> : "—"}</td>
                <td style={td}><Badge label={normalizeStatus(row.statut)} {...sc} /><ShipmentTimeline status={row.statut} compact /></td>
                <td style={td}>{row.statutDouane}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <button disabled={!allowed} onClick={() => onEdit(row)} style={actionBtn("#e0f2fe", "#0369a1", !allowed)}>✎</button>
                  <button disabled={!allowed} onClick={() => onDelete(row.id)} style={actionBtn("#fee2e2", "#dc2626", !allowed)}>🗑</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Charts({ imports, exports }) {
  const all = [...imports, ...exports];
  const statusDataRaw = TIMELINE_STEPS.map((s) => ({
    name: s,
    value: all.filter((r) => normalizeStatus(r.statut) === s).length,
  })).filter((d) => d.value > 0);
  const statusData = statusDataRaw.length ? statusDataRaw : [
    { name: "Créé", value: 1 },
    { name: "Prêt à expédier", value: 1 },
    { name: "Expédié", value: 1 },
    { name: "Douane", value: 1 },
    { name: "Livré", value: 1 },
  ];

  const transportRaw = TRANSPORTS.map((t) => ({
    name: t,
    Imports: imports.filter((r) => r.typeTransport === t).length,
    Exports: exports.filter((r) => r.typeTransport === t).length,
  })).filter((d) => d.Imports + d.Exports > 0);
  const transportData = transportRaw.length ? transportRaw : [
    { name: "AERIEN", Imports: 0, Exports: 0 },
    { name: "Routier", Imports: 0, Exports: 0 },
    { name: "Maritime", Imports: 0, Exports: 0 },
    { name: "Express", Imports: 0, Exports: 0 },
  ];
  const pieColors = ["#94a3b8", "#1d4ed8", "#f97316", "#7c3aed", "#22c55e"];

  return (
    <>
      <div className="tm-chart-card">
        <h3>Répartition par statut</h3>
        <div className="tm-chart-split">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={90} paddingAngle={2}>
                {statusData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="tm-chart-legend">
            {statusData.map((d, i) => (
              <div key={d.name} className="tm-legend-row">
                <span className="tm-legend-dot" style={{ background: pieColors[i % pieColors.length] }} />
                <span>{d.name}</span>
                <b>{statusDataRaw.length ? d.value : "—"}</b>
              </div>
            ))}
          </div>
        </div>
        {!statusDataRaw.length && <div className="tm-empty-note">Ajoutez des opérations pour alimenter ce graphique.</div>}
      </div>

      <div className="tm-chart-card">
        <h3>Volume par transport</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={transportData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Imports" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Exports" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {!transportRaw.length && <div className="tm-empty-note">Aucune donnée import/export pour le moment.</div>}
      </div>
    </>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [imports, setImports] = useState([]);
  const [exports, setExports] = useState([]);
  const [history, setHistory] = useState([]);
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [filterTransport, setFilterTransport] = useState("Tous");
  const [filterFournisseur, setFilterFournisseur] = useState("Tous");
  const [filterClient, setFilterClient] = useState("Tous");
  const [filterTransporteur, setFilterTransporteur] = useState("Tous");
  const [filterPriorite, setFilterPriorite] = useState("Tous");
  const [filterDouane, setFilterDouane] = useState("Tous");
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const [selectedImports, setSelectedImports] = useState([]);
  const [selectedExports, setSelectedExports] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [masterData, setMasterData] = useState({
    fournisseurs: FOURNISSEURS,
    clients: CLIENTS,
    transporteurs: TRANSPORTEURS,
    entites: ENTITES,
    approvisionneurs: APPROVISIONNEURS,
    chargesAffaire: CHARGES_AFFAIRE,
  });
  const [masterDrafts, setMasterDrafts] = useState({
    fournisseurs: FOURNISSEURS.join("\n"),
    clients: CLIENTS.join("\n"),
    transporteurs: TRANSPORTEURS.join("\n"),
    entites: ENTITES.join("\n"),
    approvisionneurs: APPROVISIONNEURS.join("\n"),
    chargesAffaire: CHARGES_AFFAIRE.join("\n"),
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setRole(null);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setRole(snap.exists() ? snap.data().role : "viewer");
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubImports = onSnapshot(collection(db, "imports"), (snap) => setImports(snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))));
    const unsubExports = onSnapshot(collection(db, "exports"), (snap) => setExports(snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))));
    const unsubHistory = onSnapshot(collection(db, "history"), (snap) => setHistory(snap.docs.map((d) => ({ firebaseId: d.id, ...d.data() }))));
    return () => { unsubImports(); unsubExports(); unsubHistory(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const defaults = {
      fournisseurs: FOURNISSEURS,
      clients: CLIENTS,
      transporteurs: TRANSPORTEURS,
      entites: ENTITES,
      approvisionneurs: APPROVISIONNEURS,
      chargesAffaire: CHARGES_AFFAIRE,
    };
    const unsubs = Object.keys(defaults).map((key) =>
      onSnapshot(doc(db, "masterData", key), (snap) => {
        const items = snap.exists() && Array.isArray(snap.data().items) ? snap.data().items : defaults[key];
        setMasterData((prev) => ({ ...prev, [key]: items }));
      })
    );
    return () => unsubs.forEach((unsub) => unsub());
  }, [user]);

  useEffect(() => {
    setMasterDrafts({
      fournisseurs: (masterData.fournisseurs || []).join("\n"),
      clients: (masterData.clients || []).join("\n"),
      transporteurs: (masterData.transporteurs || []).join("\n"),
      entites: (masterData.entites || []).join("\n"),
      approvisionneurs: (masterData.approvisionneurs || []).join("\n"),
      chargesAffaire: (masterData.chargesAffaire || []).join("\n"),
    });
  }, [masterData]);

  useEffect(() => {
    setSelectedImports((prev) => prev.filter((id) => imports.some((r) => r.id === id)));
  }, [imports]);

  useEffect(() => {
    setSelectedExports((prev) => prev.filter((id) => exports.some((r) => r.id === id)));
  }, [exports]);

  useEffect(() => {
    setSelectedHistory((prev) => prev.filter((id) => history.some((h) => h.firebaseId === id)));
  }, [history]);

  const kpis = useMemo(() => {
    const all = [...imports, ...exports];
    return {
      total: all.length,
      retardes: all.filter((r) => Number(r.retard) > 0).length,
      livres: all.filter((r) => r.statut === "Livré").length,
      urgents: all.filter((r) => r.priorite === "Urgente").length,
      douaneBloque: all.filter((r) => r.statutDouane === "Bloqué douane").length,
      imports: imports.length,
      exports: exports.length,
    };
  }, [imports, exports]);

  const filterRows = (rows) => rows.filter((r) => {
    const q = search.toLowerCase().trim();
    const text = [r.id, r.entite, r.fournisseur, r.client, r.transporteur, r.tracking, r.typeMarchandise, r.observations].join(" ").toLowerCase();
    const demandDate = r.dateDemande || r.dateExpedition || "";
    return (
      (!q || text.includes(q)) &&
      (filterStatut === "Tous" || normalizeStatus(r.statut) === filterStatut || r.statut === filterStatut) &&
      (filterTransport === "Tous" || r.typeTransport === filterTransport) &&
      (filterFournisseur === "Tous" || r.fournisseur === filterFournisseur) &&
      (filterClient === "Tous" || r.client === filterClient) &&
      (filterTransporteur === "Tous" || r.transporteur === filterTransporteur) &&
      (filterPriorite === "Tous" || r.priorite === filterPriorite) &&
      (filterDouane === "Tous" || r.statutDouane === filterDouane) &&
      (!filterDateDebut || demandDate >= filterDateDebut) &&
      (!filterDateFin || demandDate <= filterDateFin)
    );
  });

  const saveShipment = async (form) => {
    const type = modal.type;
    if (!canModify(role, type)) return alert("You do not have permission for this action.");
    const collectionName = type === "import" ? "imports" : "exports";
    const direction = type === "import" ? "Import" : "Export";
    const cleanForm = cleanShipment(form);
    const payload = { ...cleanForm, updatedBy: user.email, updatedAt: serverTimestamp() };

    if (modal.mode === "add") {
      const newId = makeId(type);
      await setDoc(doc(db, collectionName, newId), { ...payload, id: newId, createdBy: user.email, createdAt: serverTimestamp() });
      await addHistory(
        user,
        "Ajout",
        direction,
        newId,
        `${form.entite} · ${form.fournisseur || form.client || ""}`,
        "Nouveau shipment créé",
        getChanges({}, { ...cleanForm, id: newId })
      );
    } else {
      const currentRows = type === "import" ? imports : exports;
      const before = currentRows.find((r) => r.id === form.id || r.firebaseId === form.firebaseId) || {};
      const changes = getChanges(before, cleanForm);

      await updateDoc(doc(db, collectionName, form.firebaseId || form.id), payload);
      await addHistory(
        user,
        "Modification",
        direction,
        form.id,
        `${form.entite} · ${form.fournisseur || form.client || ""}`,
        changes.length ? `${changes.length} champ(s) modifié(s)` : "Aucun changement détecté",
        changes
      );
    }
    setModal(null);
  };

  const deleteShipment = async (id, type) => {
    if (!canModify(role, type)) return alert("You do not have permission for this action.");
    if (!window.confirm("Supprimer ce shipment ?")) return;
    const collectionName = type === "import" ? "imports" : "exports";
    const rows = type === "import" ? imports : exports;
    const deleted = rows.find((r) => r.id === id || r.firebaseId === id) || {};
    const docId = deleted.firebaseId || deleted.id || id;
    await deleteDoc(doc(db, collectionName, docId));
    await addHistory(
      user,
      "Suppression",
      type === "import" ? "Import" : "Export",
      docId,
      `${deleted.entite || ""} · ${deleted.fournisseur || deleted.client || ""}`,
      `Shipment supprimé · Tracking: ${deleted.tracking || "N/A"}`,
      getChanges(deleted, {})
    );
  };

  const toggleShipmentSelection = (type, id) => {
    const setter = type === "import" ? setSelectedImports : setSelectedExports;
    setter((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAllVisibleShipments = (type, visibleRows, checked) => {
    const setter = type === "import" ? setSelectedImports : setSelectedExports;
    const visibleIds = visibleRows.map((r) => r.id);
    setter((prev) => checked ? Array.from(new Set([...prev, ...visibleIds])) : prev.filter((id) => !visibleIds.includes(id)));
  };

  const bulkDeleteShipments = async (type, rowsToDelete, label) => {
    if (!canModify(role, type)) return alert("You do not have permission for this action.");
    if (!rowsToDelete.length) return alert("No shipments selected.");

    const direction = type === "import" ? "Import" : "Export";
    const collectionName = type === "import" ? "imports" : "exports";
    const ok = window.confirm(`${label}?

This will permanently delete ${rowsToDelete.length} ${direction.toLowerCase()} shipment(s).`);
    if (!ok) return;

    try {
      await Promise.all(rowsToDelete.map(async (r) => {
        await deleteDoc(doc(db, collectionName, r.firebaseId || r.id));
        await addHistory(
          user,
          "Suppression",
          direction,
          r.id,
          `${r.entite || ""} · ${r.fournisseur || r.client || ""}`,
          `Shipment supprimé par action groupée · Tracking: ${r.tracking || "N/A"}`,
          getChanges(r, {})
        );
      }));
      if (type === "import") setSelectedImports([]);
      else setSelectedExports([]);
      alert(`${rowsToDelete.length} shipment(s) deleted successfully.`);
    } catch (error) {
      console.error(error);
      alert("Delete failed. Check permissions and try again.");
    }
  };

  const selectedRowsFor = (type) => {
    const rows = type === "import" ? imports : exports;
    const selected = type === "import" ? selectedImports : selectedExports;
    return rows.filter((r) => selected.includes(r.id));
  };

  const deleteSelectedHistory = async () => {
    if (role !== "admin") return alert("Only admin can delete audit history.");
    const rows = history.filter((h) => selectedHistory.includes(h.firebaseId));
    if (!rows.length) return alert("No history records selected.");
    const ok = window.confirm(`Delete ${rows.length} selected audit history record(s)?`);
    if (!ok) return;
    try {
      await Promise.all(rows.map((h) => deleteDoc(doc(db, "history", h.firebaseId))));
      setSelectedHistory([]);
      alert("Selected history records deleted successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to delete selected history records.");
    }
  };

  const toggleHistorySelection = (id) => {
    setSelectedHistory((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const clearHistory = async () => {
    if (role !== "admin") return alert("Only admin can clear the audit history.");
    if (!history.length) return alert("History is already empty.");

    const ok = window.confirm(
      `Delete all audit history records?\n\nThis will remove ${history.length} record(s) permanently.`
    );
    if (!ok) return;

    try {
      await Promise.all(
        history
          .filter((h) => h.firebaseId)
          .map((h) => deleteDoc(doc(db, "history", h.firebaseId)))
      );
      setSelectedHistory([]);
      alert("Audit history cleared successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to clear history. Check Firestore rules and try again.");
    }
  };

  const saveMasterDataList = async (key, label) => {
    if (role !== "admin") return alert("Only admin can update master data.");
    const raw = masterDrafts[key] || "";
    const items = uniqueList(raw.split("\n"));

    if (!items.length) {
      alert(`La liste ${label} ne peut pas être vide.`);
      return;
    }

    try {
      await setDoc(doc(db, "masterData", key), {
        items,
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await addHistory(user, "Master Data", "Settings", key, label, `${items.length} élément(s) enregistré(s)`, []);
      alert(`${label} mis à jour avec succès.`);
    } catch (error) {
      console.error(error);
      alert("Erreur pendant la mise à jour. Vérifie les règles Firestore.");
    }
  };

  const resetMasterDraft = (key, fallback) => {
    setMasterDrafts((prev) => ({ ...prev, [key]: (fallback || []).join("\n") }));
  };

  const masterSections = [
    { key: "fournisseurs", label: "Fournisseurs", fallback: FOURNISSEURS, description: "Liste utilisée dans le formulaire Import." },
    { key: "clients", label: "Clients", fallback: CLIENTS, description: "Liste utilisée dans le formulaire Export." },
    { key: "transporteurs", label: "Transporteurs", fallback: TRANSPORTEURS, description: "Liste utilisée dans Import et Export." },
    { key: "entites", label: "Entités", fallback: ENTITES, description: "Liste des entités internes." },
    { key: "approvisionneurs", label: "Approvisionneurs", fallback: APPROVISIONNEURS, description: "Liste utilisée dans le formulaire Import." },
    { key: "chargesAffaire", label: "Chargés d'affaire", fallback: CHARGES_AFFAIRE, description: "Liste utilisée dans le formulaire Export." },
  ];

  const createRoleDocHelp = (
    <div style={{ ...panelStyle, borderLeft: "4px solid #f59e0b" }}>
      <h3 style={{ marginTop: 0 }}>Role missing or viewer access</h3>
      <p style={{ color: "#64748b" }}>Your Firebase user exists, but the app needs a role document in Firestore.</p>
      <p style={{ color: "#0f172a", fontWeight: 700 }}>Firestore path:</p>
      <code style={codeBox}>users / {user?.uid}</code>
      <p style={{ color: "#0f172a", fontWeight: 700 }}>Field:</p>
      <code style={codeBox}>role: "admin"</code>
      <p style={{ color: "#64748b" }}>Use one of these roles: admin, import, export.</p>
    </div>
  );

  if (authLoading) return <div style={centerPage}>Loading...</div>;
  if (!user) return <LoginScreen />;

  const fournisseursList = masterData?.fournisseurs?.length ? masterData.fournisseurs : FOURNISSEURS;
  const clientsList = masterData?.clients?.length ? masterData.clients : CLIENTS;
  const transporteursList = masterData?.transporteurs?.length ? masterData.transporteurs : TRANSPORTEURS;
  const entitesList = masterData?.entites?.length ? masterData.entites : ENTITES;
  const approvisionneursList = masterData?.approvisionneurs?.length ? masterData.approvisionneurs : APPROVISIONNEURS;
  const chargesAffaireList = masterData?.chargesAffaire?.length ? masterData.chargesAffaire : CHARGES_AFFAIRE;

  const filterControl = (label, control) => (
    <div className="tm-filter-group">
      <label>{label}</label>
      {control}
    </div>
  );

  const tabStyle = (t) => ({
    padding: "10px 18px", border: "none", background: activeTab === t ? "linear-gradient(135deg,#ffffff,#f0f9ff)" : "transparent", fontWeight: activeTab === t ? 900 : 700, color: activeTab === t ? "#0f172a" : "#64748b", cursor: "pointer", borderRadius: 999, fontSize: 13, border: activeTab === t ? "1px solid #c7d2fe" : "1px solid transparent", boxShadow: activeTab === t ? "0 8px 20px rgba(99,102,241,.16)" : "none", whiteSpace: "nowrap"
  });

  const filterBar = (
    <div className="tm-filter-grid">
      {filterControl("🔍 Recherche", <input placeholder="Rechercher tracking, fournisseur, client…" value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} />)}
      {filterControl("📦 Statut", <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={inputStyle}><option>Tous</option>{STATUTS.map((s) => <option key={s}>{s}</option>)}</select>)}
      {filterControl("🚚 Transport", <select value={filterTransport} onChange={(e) => setFilterTransport(e.target.value)} style={inputStyle}><option>Tous</option>{TRANSPORTS.map((t) => <option key={t}>{t}</option>)}</select>)}
      {filterControl("🏭 Fournisseur", <select value={filterFournisseur} onChange={(e) => setFilterFournisseur(e.target.value)} style={inputStyle}><option>Tous</option>{fournisseursList.map((f) => <option key={f}>{f}</option>)}</select>)}
      {filterControl("🏢 Client", <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} style={inputStyle}><option>Tous</option>{clientsList.map((c) => <option key={c}>{c}</option>)}</select>)}
      {filterControl("🚛 Transporteur", <select value={filterTransporteur} onChange={(e) => setFilterTransporteur(e.target.value)} style={inputStyle}><option>Tous</option>{transporteursList.map((t) => <option key={t}>{t}</option>)}</select>)}
      {filterControl("⚡ Priorité", <select value={filterPriorite} onChange={(e) => setFilterPriorite(e.target.value)} style={inputStyle}><option>Tous</option>{PRIORITES.map((p) => <option key={p}>{p}</option>)}</select>)}
      {filterControl("🛃 Douane", <select value={filterDouane} onChange={(e) => setFilterDouane(e.target.value)} style={inputStyle}><option>Tous</option>{DOUANE.map((d) => <option key={d}>{d}</option>)}</select>)}
      {filterControl("📅 Date début", <input type="date" value={filterDateDebut} onChange={(e) => setFilterDateDebut(e.target.value)} style={inputStyle} />)}
      {filterControl("📅 Date fin", <input type="date" value={filterDateFin} onChange={(e) => setFilterDateFin(e.target.value)} style={inputStyle} />)}
      <div className="tm-filter-group tm-filter-reset">
        <label>&nbsp;</label>
        <button onClick={() => { setSearch(""); setFilterStatut("Tous"); setFilterTransport("Tous"); setFilterFournisseur("Tous"); setFilterClient("Tous"); setFilterTransporteur("Tous"); setFilterPriorite("Tous"); setFilterDouane("Tous"); setFilterDateDebut(""); setFilterDateFin(""); }} style={secondaryBtn}>↺ Reset</button>
      </div>
    </div>
  );

  const filteredImports = filterRows(imports);
  const filteredExports = filterRows(exports);
  const selectedImportRows = selectedRowsFor("import");
  const selectedExportRows = selectedRowsFor("export");

  const shipmentBulkBar = (type, allRows, filteredRows, selectedRows) => {
    const allowed = canModify(role, type);
    const isImport = type === "import";
    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        <button onClick={() => generatePdfReport({ imports: isImport ? filteredRows : [], exports: isImport ? [] : filteredRows, user, reportType: isImport ? "imports" : "exports" })} style={{ ...primaryBtn, background: isImport ? "#1e3a5f" : "#b45309" }}>
          📄 Exporter {isImport ? "Imports" : "Exports"} PDF
        </button>
        <button onClick={() => exportToExcel({ imports: isImport ? filteredRows : [], exports: isImport ? [] : filteredRows, type: isImport ? "imports" : "exports" })} style={secondaryBtn}>
          📊 Exporter Excel
        </button>
        {allowed && (
          <>
            <button
              onClick={() => bulkDeleteShipments(type, selectedRows, `Delete selected ${isImport ? "imports" : "exports"}`)}
              disabled={!selectedRows.length}
              style={{ ...secondaryBtn, background: selectedRows.length ? "#fee2e2" : "#f1f5f9", color: selectedRows.length ? "#b91c1c" : "#94a3b8", cursor: selectedRows.length ? "pointer" : "not-allowed", borderColor: selectedRows.length ? "#fecaca" : "#e2e8f0" }}
            >
              🗑 Delete Selected ({selectedRows.length})
            </button>
            <button
              onClick={() => bulkDeleteShipments(type, allRows, `Clear all ${isImport ? "imports" : "exports"}`)}
              disabled={!allRows.length}
              style={{ ...secondaryBtn, background: allRows.length ? "#fff7ed" : "#f1f5f9", color: allRows.length ? "#c2410c" : "#94a3b8", cursor: allRows.length ? "pointer" : "not-allowed", borderColor: allRows.length ? "#fed7aa" : "#e2e8f0" }}
            >
              🧹 Clear All {isImport ? "Imports" : "Exports"}
            </button>
          </>
        )}
      </div>
    );
  };

  const visibleAlerts = [...imports, ...exports].filter((r) => Number(r.retard) > 0 || r.statutDouane === "Bloqué douane" || r.priorite === "Urgente");
  const recentShipments = [...imports.map((r) => ({ ...r, direction: "Import" })), ...exports.map((r) => ({ ...r, direction: "Export" }))]
    .sort((a, b) => String(b.updatedAt?.seconds || b.createdAt?.seconds || b.id).localeCompare(String(a.updatedAt?.seconds || a.createdAt?.seconds || a.id)))
    .slice(0, 6);
  const recentHistory = [...history].sort((a, b) => String(b.ts).localeCompare(String(a.ts))).slice(0, 6);
  const onTimeRate = kpis.total ? Math.round(((kpis.total - kpis.retardes) / kpis.total) * 100) : 0;
  const avgDelay = (() => {
    const delayed = [...imports, ...exports].filter((r) => Number(r.retard) > 0);
    if (!delayed.length) return 0;
    return (delayed.reduce((sum, r) => sum + Number(r.retard || 0), 0) / delayed.length).toFixed(1);
  })();

  // Advanced dashboard KPI calculations
  const allShipments = [...imports, ...exports];
  const deliveredShipments = allShipments.filter((r) => normalizeStatus(r.statut) === "Livré" || r.dateLivraison);
  const onTimeDelivered = deliveredShipments.filter((r) => Number(r.retard || 0) <= 0).length;
  const onTimeDeliveryRate = deliveredShipments.length ? Math.round((onTimeDelivered / deliveredShipments.length) * 100) : 0;
  const averageDelayAll = allShipments.length
    ? (allShipments.reduce((sum, r) => sum + Math.max(Number(r.retard || 0), 0), 0) / allShipments.length).toFixed(1)
    : 0;
  const activeInCustoms = allShipments.filter((r) => r.statutDouane === "En cours" || normalizeStatus(r.statut) === "Douane").length;
  const criticalShipments = allShipments.filter((r) => Number(r.retard || 0) >= 3 || r.priorite === "Urgente" || r.statutDouane === "Bloqué douane").length;

  const topBy = (rows, getKey, limit = 5) => {
    const counts = {};
    rows.forEach((row) => {
      const key = getKey(row);
      if (!key || key === "Autre") return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, value]) => ({ name, value }));
  };

  const topTransporteurs = topBy(allShipments, (r) => r.transporteur);
  const topFournisseurs = topBy(imports, (r) => r.fournisseur);
  const topClients = topBy(exports, (r) => r.client);

  const monthlyVolume = (() => {
    const counts = {};
    allShipments.forEach((row) => {
      const date = row.dateExpedition || row.dateDemande || row.createdAt?.toDate?.()?.toISOString?.().slice(0, 10) || "";
      const month = String(date).slice(0, 7) || "No date";
      if (!counts[month]) counts[month] = { month, Imports: 0, Exports: 0, Total: 0 };
      if (imports.some((item) => item.id === row.id)) counts[month].Imports += 1;
      else counts[month].Exports += 1;
      counts[month].Total += 1;
    });
    return Object.values(counts).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  })();

  const ListStat = ({ title, data, emptyText }) => (
    <div className="tm-advanced-list">
      <h4>{title}</h4>
      {data.length === 0 && <div className="tm-advanced-empty">{emptyText}</div>}
      {data.map((item, index) => (
        <div key={`${title}-${item.name}`} className="tm-rank-row">
          <span className="tm-rank-number">{index + 1}</span>
          <span className="tm-rank-name">{item.name}</span>
          <b>{item.value}</b>
        </div>
      ))}
    </div>
  );

  const pageTitles = {
    dashboard: ["Tableau de bord", "Vue d’ensemble des opérations de transport"],
    imports: ["Importations", "Gestion des flux entrants et documents de suivi"],
    exports: ["Exportations", "Gestion des expéditions client et livraisons"],
    graphiques: ["Rapports", "Analyse visuelle des volumes, statuts et retards"],
    alertes: ["Alertes", "Retards, urgences et blocages douaniers"],
    historique: ["Audit Log", "Traçabilité des actions utilisateurs"],
    settings: ["Master Data", "Gestion des listes déroulantes de l’application"],
  };
  const [pageTitle, pageSub] = pageTitles[activeTab] || pageTitles.dashboard;

  const navItems = [
    ["dashboard", "⌂", "Tableau de bord"],
    ["imports", "⇩", `Importations (${imports.length})`],
    ["exports", "⇧", `Exportations (${exports.length})`],
    ["graphiques", "▥", "Rapports"],
    ["alertes", "!", `Alertes (${visibleAlerts.length})`],
    ["historique", "☷", `Audit Log (${history.length})`],
    ["settings", "⚙", "Master Data"],
  ];

  const navButton = (key, icon, label) => (
    <button key={key} onClick={() => setActiveTab(key)} className={`tm-nav-item ${activeTab === key ? "active" : ""}`}>
      <span className="tm-nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );

  const metricCard = ({ icon, label, value, sub, tone = "blue" }) => (
    <div className={`tm-metric tm-${tone}`}>
      <div className="tm-metric-icon">{icon}</div>
      <div>
        <div className="tm-metric-label">{label}</div>
        <div className="tm-metric-value">{value}</div>
        {sub && <div className="tm-metric-sub">{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="tm-app">
      <header className="tm-brand-header">
        <div className="tm-header-overlay" />
        <div className="tm-header-title-wrap">
          <div className="tm-header-divider" />
          <div className="tm-header-title">Transport Management System</div>
        </div>
        <div className="tm-brand-user">
          <div className="tm-avatar tm-brand-avatar">{(user.email || "A").slice(0, 1).toUpperCase()}</div>
          <div>
            <div className="tm-brand-user-name">{role === "admin" ? "Admin" : role === "import" ? "Import User" : role === "export" ? "Export User" : "Viewer"}</div>
            <div className="tm-brand-user-email">{user.email}</div>
          </div>
        </div>
      </header>
      <div className="tm-shell">
      <style>{`
        :root { --navy:#07213d; --navy2:#0b3358; --orange:#f97316; --orange2:#ea580c; --soft:#f6f8fb; --line:#e5e7eb; --text:#0f172a; --muted:#64748b; }
        * { box-sizing: border-box; }
        html, body, #root { margin:0; padding:0; width:100%; min-height:100%; } body { margin:0; overflow-x:hidden; }
        .tm-app { height:100vh; overflow:hidden; background:#f5f7fb; color:var(--text); font-family:Segoe UI, system-ui, sans-serif; }
        .tm-brand-header { height:96px; width:100vw; position:relative; overflow:hidden; background-image:url('/figeac-banner.png'); background-size:100% 100%; background-position:center; background-repeat:no-repeat; border-bottom:4px solid #07213d; display:flex; align-items:center; justify-content:space-between; padding:0 34px; box-shadow:0 2px 18px rgba(15,23,42,.08); }
        .tm-header-overlay { position:absolute; inset:0; background:linear-gradient(90deg,rgba(7,33,61,.08),rgba(7,33,61,.00) 48%,rgba(7,33,61,.20)); pointer-events:none; }
        .tm-header-title-wrap { position:relative; z-index:1; margin-left:390px; display:flex; align-items:center; gap:22px; color:#fff; text-shadow:0 3px 12px rgba(0,0,0,.35); }
        .tm-header-divider { width:1px; height:48px; background:rgba(255,255,255,.72); }
        .tm-header-title { font-size:24px; font-weight:900; white-space:nowrap; letter-spacing:.2px; }
        .tm-brand-user { position:relative; z-index:1; display:flex; align-items:center; gap:12px; color:#0b2545; flex-shrink:0; background:rgba(255,255,255,.88); padding:10px 18px; border-radius:999px; box-shadow:0 12px 28px rgba(15,23,42,.12); backdrop-filter:blur(8px); }
        .tm-brand-avatar { width:46px; height:46px; background:#08213e; }
        .tm-brand-user-name { font-weight:950; font-size:17px; }
        .tm-brand-user-email { font-size:13px; color:#475569; margin-top:2px; }
        .tm-shell { height:calc(100vh - 96px); width:100vw; display:grid; grid-template-columns:220px minmax(0,1fr); background:#f5f7fb; color:var(--text); overflow:hidden; }
        .tm-sidebar { background:linear-gradient(180deg,#08213e 0%,#0b355d 72%,#061526 100%); color:#fff; position:relative; height:calc(100vh - 96px); display:flex; flex-direction:column; box-shadow:18px 0 50px rgba(2,8,23,.14); z-index:20; overflow:hidden; }
        .tm-brand-img { display:none; }
        .tm-brand-block { padding:24px 18px 20px; border-bottom:1px solid rgba(255,255,255,.10); text-align:center; }
        .tm-brand-title { font-size:19px; font-weight:950; letter-spacing:.5px; }
        .tm-brand-sub { color:#cbd5e1; font-size:11px; margin-top:4px; }
        .tm-nav { padding:16px 12px; display:flex; flex-direction:column; gap:8px; }
        .tm-nav-item { display:flex; align-items:center; gap:12px; color:#e2e8f0; width:100%; padding:13px 14px; border:none; border-radius:12px; background:transparent; cursor:pointer; font-weight:800; font-size:14px; text-align:left; transition:.18s ease; }
        .tm-nav-item:hover { background:rgba(255,255,255,.08); transform:translateX(2px); }
        .tm-nav-item.active { background:linear-gradient(135deg,var(--orange),var(--orange2)); color:#fff; box-shadow:0 12px 28px rgba(249,115,22,.28); }
        .tm-nav-icon { width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-weight:950; font-size:17px; }
        .tm-sidebar-footer { margin-top:auto; padding:16px 14px; border-top:1px solid rgba(255,255,255,.12); }
        .tm-logout { width:100%; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.07); color:#fff; padding:12px 14px; border-radius:12px; font-weight:900; cursor:pointer; }
        .tm-main { min-width:0; height:calc(100vh - 96px); overflow-y:auto; overflow-x:hidden; }
        .tm-topbar { height:82px; background:rgba(255,255,255,.92); backdrop-filter:blur(16px); border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:0 26px; position:sticky; top:0; z-index:10; }
        .tm-page-title { font-size:25px; font-weight:950; margin:0; }
        .tm-page-sub { color:var(--muted); font-size:13px; margin-top:4px; }
        .tm-user { display:none; align-items:center; gap:12px; }
        .tm-avatar { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,#1d4ed8,#0f172a); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:950; }
        .tm-content { padding:18px 24px 28px; width:100%; max-width:none; margin:0; box-sizing:border-box; }
        .tm-card { background:#fff; border:1px solid var(--line); border-radius:18px; box-shadow:0 10px 28px rgba(15,23,42,.06); }
        .tm-hero { display:none; }
        .tm-hero-kicker { font-size:12px; font-weight:950; color:var(--orange2); letter-spacing:1.5px; text-transform:uppercase; }
        .tm-hero h2 { margin:6px 0 6px; font-size:28px; }
        .tm-hero p { margin:0; color:var(--muted); font-size:14px; }
        .tm-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
        .tm-btn { border:none; border-radius:12px; padding:11px 14px; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 10px 22px rgba(15,23,42,.08); }
        .tm-btn.orange { background:linear-gradient(135deg,var(--orange),var(--orange2)); color:#fff; }
        .tm-btn.navy { background:linear-gradient(135deg,#0b3358,#061526); color:#fff; }
        .tm-btn.white { background:#fff; color:#0f172a; border:1px solid var(--line); }
        .tm-btn.red { background:#fee2e2; color:#b91c1c; border:1px solid #fecaca; }
        .tm-btn:disabled { background:#e5e7eb !important; color:#94a3b8 !important; cursor:not-allowed; box-shadow:none; }
        .tm-metrics { display:grid; grid-template-columns:repeat(5,minmax(150px,1fr)); gap:14px; margin-bottom:18px; }
        .tm-metric { background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px; display:flex; gap:14px; align-items:center; box-shadow:0 8px 22px rgba(15,23,42,.055); min-height:112px; }
        .tm-metric-icon { width:54px; height:54px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:26px; }
        .tm-blue .tm-metric-icon{background:#dbeafe;color:#1d4ed8}.tm-green .tm-metric-icon{background:#dcfce7;color:#15803d}.tm-orange .tm-metric-icon{background:#ffedd5;color:#ea580c}.tm-purple .tm-metric-icon{background:#f3e8ff;color:#7e22ce}.tm-red .tm-metric-icon{background:#fee2e2;color:#b91c1c}
        .tm-metric-label { color:#475569; font-weight:800; font-size:13px; }
        .tm-metric-value { font-size:30px; font-weight:950; margin-top:3px; }
        .tm-metric-sub { font-size:12px; color:#64748b; margin-top:3px; }
        .tm-dashboard-main { display:grid; grid-template-columns:minmax(0,2fr) minmax(330px,.95fr); gap:16px; align-items:start; }
        .tm-charts-area { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .tm-chart-card { background:#fff; border:1px solid var(--line); border-radius:18px; padding:18px; box-shadow:0 10px 28px rgba(15,23,42,.06); min-height:310px; }
        .tm-chart-card h3 { margin:0 0 12px; font-size:16px; }
        .tm-chart-split { display:grid; grid-template-columns:minmax(0,1fr) 190px; gap:8px; align-items:center; }
        .tm-chart-legend { display:flex; flex-direction:column; gap:12px; font-size:13px; color:#475569; }
        .tm-legend-row { display:grid; grid-template-columns:14px 1fr auto; gap:8px; align-items:center; }
        .tm-legend-dot { width:12px; height:12px; border-radius:4px; display:inline-block; }
        .tm-empty-note { margin-top:8px; color:#94a3b8; font-size:12px; text-align:center; }
        .tm-grid-2 { display:grid; grid-template-columns:1.15fr .85fr; gap:18px; align-items:start; }
        .tm-panel { background:#fff; border:1px solid var(--line); border-radius:18px; padding:20px; box-shadow:0 10px 28px rgba(15,23,42,.06); }
        .tm-panel h3 { margin:0 0 14px; font-size:16px; }
        .tm-list-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid #f1f5f9; }
        .tm-list-row:last-child{border-bottom:none}
        .tm-list-title { font-weight:900; font-size:13px; }
        .tm-list-sub { color:#64748b; font-size:12px; margin-top:2px; }
        .tm-toolbar { display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom:16px; }
        .tm-filter-card { background:#fff; border:1px solid var(--line); border-radius:18px; padding:18px; box-shadow:0 10px 28px rgba(15,23,42,.05); margin-bottom:16px; }
        .tm-filter-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:14px; align-items:end; }
        .tm-filter-group { display:flex; flex-direction:column; gap:7px; min-width:0; }
        .tm-filter-group label { font-size:11px; font-weight:950; color:#64748b; text-transform:uppercase; letter-spacing:.55px; }
        .tm-filter-group input, .tm-filter-group select { width:100%; }
        .tm-filter-reset button { width:100%; min-height:39px; }
        .tm-advanced-kpis { display:grid; grid-template-columns:repeat(4,minmax(180px,1fr)); gap:14px; margin-bottom:18px; }
        .tm-advanced-card { background:#fff; border:1px solid var(--line); border-radius:18px; padding:18px; box-shadow:0 10px 28px rgba(15,23,42,.06); }
        .tm-advanced-card .label { font-size:12px; color:#64748b; font-weight:900; text-transform:uppercase; letter-spacing:.7px; }
        .tm-advanced-card .value { font-size:28px; font-weight:950; color:#0f172a; margin-top:8px; }
        .tm-advanced-card .sub { font-size:12px; color:#64748b; margin-top:4px; }
        .tm-advanced-grid { display:grid; grid-template-columns:1.25fr .75fr; gap:16px; margin-bottom:18px; }
        .tm-advanced-lists { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .tm-advanced-list h4 { margin:0 0 12px; color:#0f172a; font-size:14px; }
        .tm-rank-row { display:grid; grid-template-columns:28px 1fr auto; gap:10px; align-items:center; padding:9px 0; border-bottom:1px solid #f1f5f9; font-size:13px; }
        .tm-rank-row:last-child { border-bottom:none; }
        .tm-rank-number { width:24px; height:24px; border-radius:8px; background:#eef2ff; color:#1e3a5f; display:inline-flex; align-items:center; justify-content:center; font-weight:950; font-size:12px; }
        .tm-rank-name { font-weight:800; color:#334155; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .tm-advanced-empty { color:#94a3b8; font-size:13px; padding:10px 0; }
        @media(max-width:1100px){.tm-app{height:auto;overflow:auto}.tm-brand-header{height:84px;padding:0 18px}.tm-header-title-wrap{margin-left:260px}.tm-header-title{font-size:18px}.tm-header-divider{height:38px}.tm-brand-user-email{display:none}.tm-shell{grid-template-columns:1fr;height:auto;min-height:auto;overflow:visible}.tm-sidebar{position:relative;height:auto;overflow:visible}.tm-main{height:auto;overflow:visible;width:100%;margin-left:0}.tm-nav{flex-direction:row;overflow:auto}.tm-sidebar-footer{display:none}.tm-metrics{grid-template-columns:repeat(2,1fr)}.tm-advanced-kpis{grid-template-columns:repeat(2,1fr)}.tm-advanced-grid{grid-template-columns:1fr}.tm-advanced-lists{grid-template-columns:1fr}.tm-grid-2{grid-template-columns:1fr}.tm-dashboard-main{grid-template-columns:1fr}.tm-charts-area{grid-template-columns:1fr}.tm-topbar{position:relative}.tm-brand-img{height:80px}}
        @media(max-width:700px){.tm-brand-header{height:74px;padding:0 12px;background-size:cover}.tm-header-title-wrap{display:none}.tm-brand-user{padding:8px 12px}.tm-brand-avatar{width:38px;height:38px}.tm-content{padding:14px}.tm-topbar{height:auto;padding:16px;align-items:flex-start;gap:12px;flex-direction:column}.tm-metrics{grid-template-columns:1fr}.tm-advanced-kpis{grid-template-columns:1fr}.tm-advanced-grid{grid-template-columns:1fr}.tm-advanced-lists{grid-template-columns:1fr}.tm-hero{align-items:flex-start;flex-direction:column}.tm-actions{justify-content:flex-start}.tm-page-title{font-size:22px}}
      `}</style>

      <aside className="tm-sidebar">
        <div className="tm-brand-block">
          <div className="tm-brand-title">FIGEAC AERO</div>
          <div className="tm-brand-sub">Transport Management System</div>
        </div>
        <nav className="tm-nav">{navItems.map(([key, icon, label]) => navButton(key, icon, label))}</nav>
        <div className="tm-sidebar-footer">
          <button onClick={() => signOut(auth)} className="tm-logout">⇥ Déconnexion</button>
        </div>
      </aside>

      <main className="tm-main">
        <header className="tm-topbar">
          <div>
            <h1 className="tm-page-title">{pageTitle}</h1>
            <div className="tm-page-sub">{pageSub}</div>
          </div>
          <div className="tm-user">
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 950 }}>{role === "admin" ? "Admin" : role === "import" ? "Import User" : role === "export" ? "Export User" : "Viewer"}</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>{user.email}</div>
            </div>
            <div className="tm-avatar">{(user.email || "U").slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        <section className="tm-content">
          {role === "viewer" && createRoleDocHelp}

          {activeTab === "dashboard" && (
            <>
              <div className="tm-hero">
                <div>
                  <div className="tm-hero-kicker">Operations Control Center</div>
                  <h2>Transport Management System</h2>
                  <p>Real-time import/export tracking, audit control, PDF reports and secure role-based collaboration.</p>
                </div>
                <div className="tm-actions">
                  <button onClick={() => generatePdfReport({ imports, exports, user, reportType: "all" })} className="tm-btn white">📄 PDF Global</button>
                  <button onClick={() => exportToExcel({ imports, exports, type: "all" })} className="tm-btn white">📊 Excel Global</button>
                  <button onClick={() => generatePdfReport({ imports, exports, user, reportType: "delayed" })} className="tm-btn red">⚠ PDF Retards</button>
                  <button disabled={!canModify(role, "import")} onClick={() => setModal({ mode: "add", type: "import" })} className="tm-btn navy">＋ Import</button>
                  <button disabled={!canModify(role, "export")} onClick={() => setModal({ mode: "add", type: "export" })} className="tm-btn orange">＋ Export</button>
                </div>
              </div>

              <div className="tm-metrics">
                {metricCard({ icon: "⇩", label: "Importations", value: kpis.imports, sub: `${kpis.total} opérations au total`, tone: "blue" })}
                {metricCard({ icon: "⇧", label: "Exportations", value: kpis.exports, sub: "Flux sortants", tone: "orange" })}
                {metricCard({ icon: "✓", label: "Livrées", value: kpis.livres, sub: `${onTimeRate}% on-time rate`, tone: "green" })}
                {metricCard({ icon: "!", label: "Retards", value: kpis.retardes, sub: `Moyenne: ${avgDelay} j`, tone: "red" })}
                {metricCard({ icon: "▣", label: "Douane", value: kpis.douaneBloque, sub: "Blocages actifs", tone: "purple" })}
              </div>

              <div className="tm-advanced-kpis">
                <div className="tm-advanced-card">
                  <div className="label">On-time delivery</div>
                  <div className="value">{onTimeDeliveryRate}%</div>
                  <div className="sub">{onTimeDelivered}/{deliveredShipments.length} livraisons à temps</div>
                </div>
                <div className="tm-advanced-card">
                  <div className="label">Average delay</div>
                  <div className="value">{averageDelayAll} j</div>
                  <div className="sub">Moyenne sur toutes les opérations</div>
                </div>
                <div className="tm-advanced-card">
                  <div className="label">Customs in progress</div>
                  <div className="value">{activeInCustoms}</div>
                  <div className="sub">Dossiers en douane ou étape Douane</div>
                </div>
                <div className="tm-advanced-card">
                  <div className="label">Critical shipments</div>
                  <div className="value">{criticalShipments}</div>
                  <div className="sub">Urgent, bloqué ou retard ≥ 3 jours</div>
                </div>
              </div>

              <div className="tm-advanced-grid">
                <div className="tm-panel">
                  <h3>Volume mensuel import/export</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyVolume.length ? monthlyVolume : [{ month: "No data", Imports: 0, Exports: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Imports" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Exports" fill="#f97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="tm-panel">
                  <h3>Performance rapide</h3>
                  <div className="tm-list-row">
                    <div><div className="tm-list-title">Livraisons à temps</div><div className="tm-list-sub">Basé sur les shipments livrés</div></div>
                    <b>{onTimeDeliveryRate}%</b>
                  </div>
                  <div className="tm-list-row">
                    <div><div className="tm-list-title">Retard moyen</div><div className="tm-list-sub">Retards positifs uniquement</div></div>
                    <b>{avgDelay} j</b>
                  </div>
                  <div className="tm-list-row">
                    <div><div className="tm-list-title">Dossiers critiques</div><div className="tm-list-sub">Urgents / douane / retards</div></div>
                    <b>{criticalShipments}</b>
                  </div>
                </div>
              </div>

              <div className="tm-advanced-lists" style={{ marginBottom: 18 }}>
                <div className="tm-panel"><ListStat title="Top Transporteurs" data={topTransporteurs} emptyText="Aucun transporteur pour le moment." /></div>
                <div className="tm-panel"><ListStat title="Top Fournisseurs" data={topFournisseurs} emptyText="Aucun fournisseur pour le moment." /></div>
                <div className="tm-panel"><ListStat title="Top Clients" data={topClients} emptyText="Aucun client pour le moment." /></div>
              </div>

              <div className="tm-dashboard-main">
                <div className="tm-charts-area"><Charts imports={imports} exports={exports} /></div>
                <div className="tm-panel tm-activity-card">
                  <h3>Activité récente</h3>
                  {recentHistory.length === 0 && <div style={{ color: "#64748b" }}>Aucune activité récente.</div>}
                  {recentHistory.map((h) => (
                    <div key={h.firebaseId} className="tm-list-row">
                      <div>
                        <div className="tm-list-title">{h.action} · {h.direction} {h.id}</div>
                        <div className="tm-list-sub">{h.userEmail} · {h.ts}</div>
                      </div>
                      <Badge label={h.action} {...(h.action === "Suppression" ? STATUS_COLORS.Bloqué : h.action === "Ajout" ? STATUS_COLORS.Livré : STATUS_COLORS.Expédié)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="tm-panel" style={{ marginTop: 18 }}>
                <h3>Dernières opérations</h3>
                {recentShipments.length === 0 && <div style={{ color: "#64748b" }}>Aucune opération récente.</div>}
                {recentShipments.map((r) => (
                  <div key={`${r.direction}-${r.id}`} className="tm-list-row">
                    <div>
                      <div className="tm-list-title">{r.id} · {r.direction}</div>
                      <div className="tm-list-sub">{r.fournisseur || r.client || "—"} · {r.transporteur || "—"} · {r.tracking || "—"}</div>
                    </div>
                    <Badge label={r.statut || "Créé"} {...(STATUS_COLORS[r.statut] || STATUS_COLORS[normalizeStatus(r.statut)] || STATUS_COLORS["Créé"])} />
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "imports" && (
            <>
              <div className="tm-toolbar">
                <div><h2 style={{ margin: 0 }}>Importations</h2><div style={{ color: "#64748b", fontSize: 13 }}>Gestion des shipments import</div></div>
                <div className="tm-actions">
                  <button onClick={() => generatePdfReport({ imports: filteredImports, exports: [], user, reportType: "imports" })} className="tm-btn white">📄 Exporter PDF</button>
                  <button onClick={() => exportToExcel({ imports: filteredImports, exports: [], type: "imports" })} className="tm-btn white">📊 Exporter Excel</button>
                  <button disabled={!canModify(role, "import")} onClick={() => setModal({ mode: "add", type: "import" })} className="tm-btn navy">＋ Nouvelle Importation</button>
                </div>
              </div>
              <div className="tm-filter-card">{filterBar}</div>
              {shipmentBulkBar("import", imports, filteredImports, selectedImportRows)}
              <ShipmentTable rows={filteredImports} type="import" role={role} selectedIds={selectedImports} onToggleSelect={(id) => toggleShipmentSelection("import", id)} onToggleAll={(checked) => toggleAllVisibleShipments("import", filteredImports, checked)} onEdit={(r) => setModal({ mode: "edit", type: "import", record: r })} onDelete={(id) => deleteShipment(id, "import")} />
            </>
          )}

          {activeTab === "exports" && (
            <>
              <div className="tm-toolbar">
                <div><h2 style={{ margin: 0 }}>Exportations</h2><div style={{ color: "#64748b", fontSize: 13 }}>Gestion des shipments export</div></div>
                <div className="tm-actions">
                  <button onClick={() => generatePdfReport({ imports: [], exports: filteredExports, user, reportType: "exports" })} className="tm-btn white">📄 Exporter PDF</button>
                  <button onClick={() => exportToExcel({ imports: [], exports: filteredExports, type: "exports" })} className="tm-btn white">📊 Exporter Excel</button>
                  <button disabled={!canModify(role, "export")} onClick={() => setModal({ mode: "add", type: "export" })} className="tm-btn orange">＋ Nouvelle Exportation</button>
                </div>
              </div>
              <div className="tm-filter-card">{filterBar}</div>
              {shipmentBulkBar("export", exports, filteredExports, selectedExportRows)}
              <ShipmentTable rows={filteredExports} type="export" role={role} selectedIds={selectedExports} onToggleSelect={(id) => toggleShipmentSelection("export", id)} onToggleAll={(checked) => toggleAllVisibleShipments("export", filteredExports, checked)} onEdit={(r) => setModal({ mode: "edit", type: "export", record: r })} onDelete={(id) => deleteShipment(id, "export")} />
            </>
          )}

          {activeTab === "graphiques" && (
            <>
              <div className="tm-toolbar">
                <div><h2 style={{ margin: 0 }}>Rapports & Analyse</h2><div style={{ color: "#64748b", fontSize: 13 }}>Indicateurs opérationnels et export PDF</div></div>
                <div className="tm-actions">
                  <button onClick={() => generatePdfReport({ imports, exports, user, reportType: "all" })} className="tm-btn white">📄 PDF Global</button>
                  <button onClick={() => exportToExcel({ imports, exports, type: "all" })} className="tm-btn white">📊 Excel Global</button>
                  <button onClick={() => generatePdfReport({ imports, exports, user, reportType: "delayed" })} className="tm-btn red">⚠ PDF Retards</button>
                </div>
              </div>
              <Charts imports={imports} exports={exports} />
            </>
          )}

          {activeTab === "alertes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {visibleAlerts.length === 0 && <div className="tm-panel" style={{ color: "#64748b" }}>Aucune alerte active.</div>}
              {visibleAlerts.map((r) => (
                <div key={r.id} className="tm-panel" style={{ borderLeft: `4px solid ${Number(r.retard) > 0 ? "#b91c1c" : "#f97316"}` }}>
                  <b>{r.id}</b> — {r.entite} · {r.fournisseur || r.client} · {r.tracking}
                  <div style={{ color: "#64748b", marginTop: 5 }}>Retard: {r.retard} jours · Douane: {r.statutDouane} · Priorité: {r.priorite}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "historique" && (
            <div className="tm-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ marginTop: 0 }}>Audit Log</h3>
                  <p style={{ color: "#64748b", marginTop: -8 }}>Tracks who changed shipments, when, and exactly what fields changed.</p>
                </div>
                {role === "admin" && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={deleteSelectedHistory} disabled={!selectedHistory.length} className="tm-btn red">🗑 Delete Selected ({selectedHistory.length})</button>
                    <button onClick={clearHistory} disabled={!history.length} className="tm-btn white">🧹 Clear All History</button>
                  </div>
                )}
              </div>
              {history.length === 0 && <div style={{ padding: 20, background: "#f8fafc", borderRadius: 14, color: "#64748b" }}>No audit history records.</div>}
              {[...history].sort((a, b) => String(b.ts).localeCompare(String(a.ts))).map((h) => (
                <div key={h.firebaseId} style={{ padding: 14, background: "#f8fafc", borderRadius: 12, marginBottom: 12, borderLeft: `4px solid ${h.action === "Ajout" ? "#16a34a" : h.action === "Suppression" ? "#b91c1c" : "#3b82f6"}` }}>
                  {role === "admin" && (
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                      <input type="checkbox" checked={selectedHistory.includes(h.firebaseId)} onChange={() => toggleHistorySelection(h.firebaseId)} />
                      Select log
                    </label>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div><b>{h.action}</b> [{h.direction}] {h.id} — {h.label}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{h.ts}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>User: {h.userEmail}</div>
                  {h.detail && <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{h.detail}</div>}
                  {Array.isArray(h.changes) && h.changes.length > 0 && (
                    <div style={{ marginTop: 10, overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead><tr style={{ background: "#e2e8f0" }}><th style={{ textAlign: "left", padding: 8 }}>Field</th><th style={{ textAlign: "left", padding: 8 }}>Before</th><th style={{ textAlign: "left", padding: 8 }}>After</th></tr></thead>
                        <tbody>
                          {h.changes.slice(0, 8).map((c, i) => (
                            <tr key={`${c.field}-${i}`}><td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>{c.field}</td><td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", color: "#b91c1c" }}>{c.before || "—"}</td><td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", color: "#16a34a" }}>{c.after || "—"}</td></tr>
                          ))}
                        </tbody>
                      </table>
                      {h.changes.length > 8 && <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>+{h.changes.length - 8} more changes</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}


          {activeTab === "settings" && (
            <div style={{ display: "grid", gap: 18 }}>
              <div className="tm-panel">
                <h3>⚙ Master Data Management</h3>
                <p style={{ color: "#64748b", marginTop: 0 }}>
                  Gérez ici les listes déroulantes sans modifier le code. Une valeur par ligne.
                </p>
                {role !== "admin" && (
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c", padding: 12, borderRadius: 12, marginBottom: 16, fontWeight: 800 }}>
                    Seul l’admin peut modifier ces listes.
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 16 }}>
                  {masterSections.map((section) => {
                    const count = (masterData[section.key] || []).length;
                    return (
                      <div key={section.key} style={{ border: "1px solid #e2e8f0", borderRadius: 18, padding: 16, background: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <h4 style={{ margin: 0, color: "#0f172a" }}>{section.label}</h4>
                            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{section.description}</div>
                          </div>
                          <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 900 }}>
                            {count} items
                          </span>
                        </div>
                        <textarea
                          value={masterDrafts[section.key] || ""}
                          disabled={role !== "admin"}
                          onChange={(e) => setMasterDrafts((prev) => ({ ...prev, [section.key]: e.target.value }))}
                          style={{
                            width: "100%",
                            minHeight: 230,
                            resize: "vertical",
                            border: "1px solid #cbd5e1",
                            borderRadius: 14,
                            padding: 12,
                            fontFamily: "Consolas, Monaco, monospace",
                            fontSize: 12,
                            outline: "none",
                            background: role === "admin" ? "#f8fafc" : "#f1f5f9",
                          }}
                        />
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12, flexWrap: "wrap" }}>
                          <button
                            disabled={role !== "admin"}
                            onClick={() => resetMasterDraft(section.key, masterData[section.key] || section.fallback)}
                            style={{ ...secondaryBtn, opacity: role === "admin" ? 1 : 0.5 }}
                          >
                            ↺ Annuler
                          </button>
                          <button
                            disabled={role !== "admin"}
                            onClick={() => saveMasterDataList(section.key, section.label)}
                            style={{ ...primaryBtn, background: role === "admin" ? "#1e3a5f" : "#94a3b8", cursor: role === "admin" ? "pointer" : "not-allowed" }}
                          >
                            💾 Enregistrer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {modal && <Modal mode={modal.mode} type={modal.type} record={modal.record} masterData={masterData} onClose={() => setModal(null)} onSave={saveShipment} />}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const inputStyle = { padding: "9px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, background: "#fff", outline: "none", color: "#0f172a", fontFamily: "inherit" , boxShadow: "0 1px 2px rgba(15,23,42,.04)" };
const loginInputStyle = { ...inputStyle, width: "100%", boxSizing: "border-box", marginBottom: 12 };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 5 };
const td = { padding: "11px 14px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" };
const primaryBtn = { padding: "10px 22px", borderRadius: 999, border: "none", color: "#fff", cursor: "pointer", fontWeight: 900, fontSize: 14, boxShadow: "0 10px 22px rgba(15,23,42,.12)" };
const secondaryBtn = { padding: "9px 14px", borderRadius: 999, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 800, color: "#64748b", boxShadow: "0 6px 16px rgba(15,23,42,.06)" };
const closeBtn = { background: "#f1f5f9", border: "none", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 18 };
const headerBtn = { color: "#fff", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "9px 15px", cursor: "pointer", fontWeight: 900, fontSize: 13, boxShadow: "0 10px 24px rgba(0,0,0,.18)" };
const panelStyle = { background: "rgba(255,255,255,.92)", borderRadius: 24, padding: 24, boxShadow: "0 18px 45px rgba(15,23,42,.08)", border: "1px solid rgba(226,232,240,.95)", backdropFilter: "blur(10px)" };
const pillStyle = { display: "inline-flex", alignItems: "center", padding: "8px 12px", borderRadius: 999, fontSize: 12, fontWeight: 900 };
const codeBox = { display: "block", background: "#f1f5f9", padding: 12, borderRadius: 10, marginBottom: 10 };
const centerPage = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, system-ui, sans-serif" };
const actionBtn = (bg, col, disabled) => ({ background: disabled ? "#e5e7eb" : bg, border: "none", color: disabled ? "#9ca3af" : col, borderRadius: 7, padding: "5px 9px", cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 800, marginRight: 4 });
