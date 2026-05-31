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
} from "firebase/auth";

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

// ─── Master Data ─────────────────────────────────────────────────────────────
const STATUTS = ["En attente", "En transit", "Expédié", "Livré", "Bloqué", "Annulé"];
const TRANSPORTS = ["AERIEN", "Routier", "Maritime", "Express"];
const PRIORITES = ["Normale", "Haute", "Urgente"];
const DOUANE = ["N/A", "En cours", "Dédouané", "Bloqué douane"];
const ENTITES = ["Casablanca Aeronautique", "Figeacaero", "Autre"];
const SEMAINES = ["S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20"];

// Change these lists any time you want.
const FOURNISSEURS = ["SNAA", "Mecaprotec", "Thales", "Safran", "Airbus", "Autre"];
const CLIENTS = ["AirBus MONTOIR", "Safran CRAMAYEL", "Picardie", "Boeing", "Autre"];
const APPROVISIONNEURS = ["Yassmin El Fathani", "Fatiha ET-TAGRY", "Ahmed Benzari", "Autre"];
const CHARGES_AFFAIRE = ["Ahmed Benzari", "Karim El Amrani", "Sara Alaoui", "Autre"];
const TRANSPORTEURS = ["Chronopost", "Dachser", "DHL", "FedEx", "UPS", "Autre"];
const MARCHANDISES = ["Pièces méca", "Composants", "Outillage", "Structures", "Pièces finies", "Sous-ensembles", "Autre"];

const STATUS_COLORS = {
  "Livré": { bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
  "En transit": { bg: "#fef9c3", text: "#854d0e", dot: "#eab308" },
  "Expédié": { bg: "#dbeafe", text: "#1d4ed8", dot: "#3b82f6" },
  "En attente": { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" },
  "Bloqué": { bg: "#fee2e2", text: "#dc2626", dot: "#ef4444" },
  "Annulé": { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
};
const CHART_PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const TRANSPORT_ICONS = { AERIEN: "✈", Routier: "🚚", Maritime: "🚢", Express: "⚡" };

// ─── Utils ───────────────────────────────────────────────────────────────────
function now() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function calculateDatePrevue(dateExpedition, typeTransport) {
  if (!dateExpedition) return "";
  const daysByTransport = { AERIEN: 3, Express: 1, Routier: 7, Maritime: 30 };
  const d = new Date(`${dateExpedition}T00:00:00`);
  d.setDate(d.getDate() + (daysByTransport[typeTransport] ?? 0));
  return d.toISOString().slice(0, 10);
}

function calculateRetard(datePrevue, dateLivraison) {
  if (!datePrevue || !dateLivraison) return 0;
  const a = new Date(`${datePrevue}T00:00:00`);
  const b = new Date(`${dateLivraison}T00:00:00`);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function makeId(type) {
  const prefix = type === "import" ? "IMP" : "EXP";
  const stamp = Date.now().toString().slice(-6);
  return `${prefix}-${stamp}`;
}

function canModify(role, type) {
  if (role === "admin") return true;
  if (role === "import" && type === "import") return true;
  if (role === "export" && type === "export") return true;
  return false;
}

const AUDIT_FIELDS = [
  "semaine",
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

// ─── UI Components ───────────────────────────────────────────────────────────
function Badge({ label, bg, text, dot }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, backgroundColor: bg, color: text, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: dot }} />
      {label}
    </span>
  );
}

function KpiCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,.06)", borderTop: `3px solid ${accent}`, flex: 1, minWidth: 150 }}>
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
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError("Email or password incorrect, or the user does not exist in Firebase Authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a,#1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, system-ui, sans-serif", padding: 20 }}>
      <form onSubmit={login} style={{ width: "min(420px,100%)", background: "#fff", borderRadius: 22, padding: 30, boxShadow: "0 30px 80px rgba(0,0,0,.25)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✈</div>
          <h1 style={{ margin: "14px 0 4px", color: "#0f172a", fontSize: 24 }}>Transport Manager</h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Firebase Authentication Login</p>
        </div>

        <label style={labelStyle}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="ahmed@transport.com" style={loginInputStyle} />

        <label style={labelStyle}>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" style={loginInputStyle} />

        {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: 12, borderRadius: 10, fontSize: 13, marginTop: 12 }}>{error}</div>}

        <button disabled={loading} type="submit" style={{ width: "100%", marginTop: 18, padding: "12px 18px", border: "none", borderRadius: 12, background: loading ? "#94a3b8" : "#6366f1", color: "#fff", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <div style={{ marginTop: 18, fontSize: 12, color: "#64748b", background: "#f8fafc", padding: 12, borderRadius: 12 }}>
          Create users in Firebase Authentication, then create a document in Firestore collection <b>users</b> using the user UID with field <b>role</b>: admin, import, or export.
        </div>
      </form>
    </div>
  );
}

function Modal({ mode, type, record, onClose, onSave }) {
  const isImport = type === "import";
  const [form, setForm] = useState(record || {
    semaine: "S18",
    entite: "Casablanca Aeronautique",
    fournisseur: FOURNISSEURS[0],
    approvisionneur: APPROVISIONNEURS[0],
    client: CLIENTS[0],
    chargeAffaire: CHARGES_AFFAIRE[0],
    typeTransport: "Routier",
    transporteur: TRANSPORTEURS[0],
    tracking: "",
    dateDemande: today(),
    dateEnlevement: "",
    dateExpedition: "",
    datePrevue: "",
    dateLivraison: "",
    statut: "En attente",
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
      <div style={{ background: "#fff", borderRadius: 20, width: "min(95vw,760px)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}>
        <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: isImport ? "#6366f1" : "#f59e0b", letterSpacing: 1 }}>{isImport ? "IMPORT" : "EXPORT"}</div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{mode === "add" ? "Nouveau shipment" : "Modifier shipment"}</h2>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {field("Semaine", "semaine", "text", SEMAINES)}
          {field("Entité", "entite", "text", ENTITES)}
          {isImport ? <>{field("Fournisseur", "fournisseur", "text", FOURNISSEURS)}{field("Approvisionneur", "approvisionneur", "text", APPROVISIONNEURS)}</> : <>{field("Client", "client", "text", CLIENTS)}{field("Chargé d'affaire", "chargeAffaire", "text", CHARGES_AFFAIRE)}</>}
          {field("Type de transport", "typeTransport", "text", TRANSPORTS)}
          {field("Transporteur", "transporteur", "text", TRANSPORTEURS)}
          {field("N° Tracking", "tracking")}
          {field("Type Marchandise", "typeMarchandise", "text", MARCHANDISES)}
          {field("Priorité", "priorite", "text", PRIORITES)}
          {field("Statut", "statut", "text", STATUTS)}
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
          <button onClick={submit} style={{ ...primaryBtn, background: isImport ? "#6366f1" : "#f59e0b" }}>{mode === "add" ? "Ajouter" : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

function ShipmentTable({ rows, type, role, onEdit, onDelete }) {
  const isImport = type === "import";
  const allowed = canModify(role, type);
  const cols = ["Semaine", "Entité", isImport ? "Fournisseur" : "Client", "Transport", "Tracking", "Exp.", "Prévue", "Livraison", "Retard", "Statut", "Douane", "Actions"];
  return (
    <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: isImport ? "#eef2ff" : "#fffbeb" }}>
            {cols.map((c) => <th key={c} style={{ padding: "12px 14px", textAlign: "left", color: isImport ? "#4f46e5" : "#b45309", fontSize: 12, whiteSpace: "nowrap" }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={cols.length} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucun shipment trouvé</td></tr>}
          {rows.map((row, i) => {
            const sc = STATUS_COLORS[row.statut] || STATUS_COLORS["En attente"];
            const retard = Number(row.retard || 0);
            return (
              <tr key={row.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                <td style={td}><b>{row.semaine}</b></td>
                <td style={td}>{row.entite}</td>
                <td style={td}>{isImport ? row.fournisseur : row.client}</td>
                <td style={td}>{TRANSPORT_ICONS[row.typeTransport] || "📦"} {row.transporteur}</td>
                <td style={td}><code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 5 }}>{row.tracking}</code></td>
                <td style={td}>{row.dateExpedition || "—"}</td>
                <td style={td}>{row.datePrevue || "—"}</td>
                <td style={td}>{row.dateLivraison || "—"}</td>
                <td style={td}>{retard !== 0 ? <span style={{ color: retard > 0 ? "#dc2626" : "#16a34a", fontWeight: 800 }}>{retard > 0 ? `+${retard}j` : `${retard}j`}</span> : "—"}</td>
                <td style={td}><Badge label={row.statut} {...sc} /></td>
                <td style={td}>{row.statutDouane}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <button disabled={!allowed} onClick={() => onEdit(row)} style={actionBtn("#e0e7ff", "#4f46e5", !allowed)}>✎</button>
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
  const statusData = Object.keys(STATUS_COLORS).map((s) => ({ name: s, value: all.filter((r) => r.statut === s).length })).filter((d) => d.value > 0);
  const transportData = TRANSPORTS.map((t) => ({ name: t, Imports: imports.filter((r) => r.typeTransport === t).length, Exports: exports.filter((r) => r.typeTransport === t).length })).filter((d) => d.Imports + d.Exports > 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div style={panelStyle}>
        <h3>Répartition par Statut</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
              {statusData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={panelStyle}>
        <h3>Volume par Transport</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={transportData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Imports" fill="#6366f1" />
            <Bar dataKey="Exports" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
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
    const text = [r.id, r.entite, r.fournisseur, r.client, r.transporteur, r.tracking, r.typeMarchandise].join(" ").toLowerCase();
    return (!q || text.includes(q)) && (filterStatut === "Tous" || r.statut === filterStatut) && (filterTransport === "Tous" || r.typeTransport === filterTransport);
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
    await deleteDoc(doc(db, collectionName, id));
    await addHistory(
      user,
      "Suppression",
      type === "import" ? "Import" : "Export",
      id,
      `${deleted.entite || ""} · ${deleted.fournisseur || deleted.client || ""}`,
      `Shipment supprimé · Tracking: ${deleted.tracking || "N/A"}`,
      getChanges(deleted, {})
    );
  };

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

  const tabStyle = (t) => ({
    padding: "10px 18px", border: "none", background: activeTab === t ? "#fff" : "transparent", fontWeight: activeTab === t ? 800 : 600, color: activeTab === t ? "#0f172a" : "#64748b", cursor: "pointer", borderRadius: 10, fontSize: 13, boxShadow: activeTab === t ? "0 2px 8px rgba(0,0,0,.08)" : "none", whiteSpace: "nowrap"
  });

  const filterBar = (
    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
      <input placeholder="🔍 Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, minWidth: 220 }} />
      <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={inputStyle}><option>Tous</option>{STATUTS.map((s) => <option key={s}>{s}</option>)}</select>
      <select value={filterTransport} onChange={(e) => setFilterTransport(e.target.value)} style={inputStyle}><option>Tous</option>{TRANSPORTS.map((t) => <option key={t}>{t}</option>)}</select>
      <button onClick={() => { setSearch(""); setFilterStatut("Tous"); setFilterTransport("Tous"); }} style={secondaryBtn}>↺ Reset</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "Segoe UI, system-ui, sans-serif", background: "#f1f5f9", minHeight: "100vh", color: "#0f172a" }}>
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 70, boxShadow: "0 4px 20px rgba(0,0,0,.2)", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✈</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>Transport Manager</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{user.email} · role: {role || "loading"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button disabled={!canModify(role, "import")} onClick={() => setModal({ mode: "add", type: "import" })} style={{ ...headerBtn, background: canModify(role, "import") ? "#6366f1" : "#64748b" }}>＋ Import</button>
          <button disabled={!canModify(role, "export")} onClick={() => setModal({ mode: "add", type: "export" })} style={{ ...headerBtn, background: canModify(role, "export") ? "#f59e0b" : "#64748b" }}>＋ Export</button>
          <button onClick={() => signOut(auth)} style={{ ...headerBtn, background: "#ef4444" }}>Logout</button>
        </div>
      </div>

      <div style={{ background: "#e2e8f0", padding: "0 32px" }}>
        <div style={{ display: "flex", gap: 4, padding: "8px 0", overflowX: "auto" }}>
          {[["dashboard", "📊 Dashboard"], ["imports", `📥 Imports (${imports.length})`], ["exports", `📤 Exports (${exports.length})`], ["graphiques", "📈 Graphiques"], ["alertes", `🚨 Alertes (${kpis.retardes + kpis.douaneBloque})`], ["historique", `🕒 Historique (${history.length})`]].map(([t, l]) => <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>{l}</button>)}
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>
        {role === "viewer" && createRoleDocHelp}

        {activeTab === "dashboard" && (
          <>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
              <KpiCard icon="📦" label="Total Shipments" value={kpis.total} sub={`${kpis.imports} imports · ${kpis.exports} exports`} accent="#6366f1" />
              <KpiCard icon="✅" label="Livrés" value={kpis.livres} sub={kpis.total ? `${Math.round((kpis.livres / kpis.total) * 100)}% du total` : "-"} accent="#22c55e" />
              <KpiCard icon="⚠️" label="En Retard" value={kpis.retardes} sub="Nécessite action" accent="#ef4444" />
              <KpiCard icon="🔴" label="Urgents" value={kpis.urgents} sub="Priorité urgente" accent="#f59e0b" />
              <KpiCard icon="🛃" label="Bloqués Douane" value={kpis.douaneBloque} sub="Intervention requise" accent="#8b5cf6" />
            </div>
            <Charts imports={imports} exports={exports} />
          </>
        )}

        {activeTab === "imports" && <>{filterBar}<ShipmentTable rows={filterRows(imports)} type="import" role={role} onEdit={(r) => setModal({ mode: "edit", type: "import", record: r })} onDelete={(id) => deleteShipment(id, "import")} /></>}
        {activeTab === "exports" && <>{filterBar}<ShipmentTable rows={filterRows(exports)} type="export" role={role} onEdit={(r) => setModal({ mode: "edit", type: "export", record: r })} onDelete={(id) => deleteShipment(id, "export")} /></>}
        {activeTab === "graphiques" && <Charts imports={imports} exports={exports} />}

        {activeTab === "alertes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[...imports, ...exports].filter((r) => Number(r.retard) > 0 || r.statutDouane === "Bloqué douane" || r.priorite === "Urgente").map((r) => (
              <div key={r.id} style={{ ...panelStyle, borderLeft: `4px solid ${Number(r.retard) > 0 ? "#ef4444" : "#f59e0b"}` }}>
                <b>{r.id}</b> — {r.entite} · {r.fournisseur || r.client} · {r.tracking}
                <div style={{ color: "#64748b", marginTop: 5 }}>Retard: {r.retard} jours · Douane: {r.statutDouane} · Priorité: {r.priorite}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "historique" && (
          <div style={panelStyle}>
            <h3>🕒 Audit Log</h3>
            <p style={{ color: "#64748b", marginTop: -8 }}>Tracks who changed shipments, when, and exactly what fields changed.</p>
            {[...history].sort((a, b) => String(b.ts).localeCompare(String(a.ts))).map((h) => (
              <div key={h.firebaseId} style={{ padding: 14, background: "#f8fafc", borderRadius: 12, marginBottom: 12, borderLeft: `4px solid ${h.action === "Ajout" ? "#22c55e" : h.action === "Suppression" ? "#ef4444" : "#3b82f6"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div><b>{h.action}</b> [{h.direction}] {h.id} — {h.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{h.ts}</div>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>User: {h.userEmail}</div>
                {h.detail && <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{h.detail}</div>}
                {Array.isArray(h.changes) && h.changes.length > 0 && (
                  <div style={{ marginTop: 10, overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#e2e8f0" }}>
                          <th style={{ textAlign: "left", padding: 8 }}>Field</th>
                          <th style={{ textAlign: "left", padding: 8 }}>Before</th>
                          <th style={{ textAlign: "left", padding: 8 }}>After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {h.changes.slice(0, 8).map((c, i) => (
                          <tr key={`${c.field}-${i}`}>
                            <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>{c.field}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", color: "#ef4444" }}>{c.before || "—"}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", color: "#16a34a" }}>{c.after || "—"}</td>
                          </tr>
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
      </div>

      {modal && <Modal mode={modal.mode} type={modal.type} record={modal.record} onClose={() => setModal(null)} onSave={saveShipment} />}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const inputStyle = { padding: "9px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, background: "#fff", outline: "none", color: "#0f172a", fontFamily: "inherit" };
const loginInputStyle = { ...inputStyle, width: "100%", boxSizing: "border-box", marginBottom: 12 };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 5 };
const td = { padding: "11px 14px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" };
const primaryBtn = { padding: "10px 22px", borderRadius: 10, border: "none", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 14 };
const secondaryBtn = { padding: "9px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 700, color: "#64748b" };
const closeBtn = { background: "#f1f5f9", border: "none", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 18 };
const headerBtn = { color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 800, fontSize: 13 };
const panelStyle = { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)" };
const codeBox = { display: "block", background: "#f1f5f9", padding: 12, borderRadius: 10, marginBottom: 10 };
const centerPage = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, system-ui, sans-serif" };
const actionBtn = (bg, col, disabled) => ({ background: disabled ? "#e5e7eb" : bg, border: "none", color: disabled ? "#9ca3af" : col, borderRadius: 7, padding: "5px 9px", cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 800, marginRight: 4 });
const STATUS_COLORS = { "En attente": { background: "#fef3c7", color: "#b45309" }, "Livré": { background: "#d1fae5", color: "#16a34a" }, "Annulé": { background: "#fee2e2", color: "#dc2626" }, "Bloqué douane": { background: "#e0e7ff", color: "#4f46e5" } };