import { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from "react";
import {
  FileText, Plus, Users, Settings, LayoutDashboard, ChevronRight,
  Trash2, Download, Search, ArrowUpRight, ArrowDownRight,
  DollarSign, Clock, CheckCircle, AlertCircle, X, Save,
  Building2, Mail, Phone, MapPin, Edit, Hash, Percent,
  CreditCard, UserPlus, ChevronLeft, LogOut, Lock, Loader2,
  Upload, Image, ZoomIn, ZoomOut,
  Palette, Database, AlertTriangle, Paintbrush, Check, Receipt, Paperclip, Tag
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';


const THEME_PRESETS = [
  { name: "Terracotta", hex: "#C8553D" },
  { name: "Ocean",      hex: "#2563EB" },
  { name: "Forest",     hex: "#16A34A" },
  { name: "Violet",     hex: "#7C3AED" },
  { name: "Slate",      hex: "#475569" },
  { name: "Rose",       hex: "#E11D48" },
  { name: "Amber",      hex: "#D97706" },
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function makeTheme(accent = "#C8553D") {
  const { r, g, b } = hexToRgb(accent);
  return {
    font: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontMono: "ui-monospace, 'SFMono-Regular', monospace",
    bg: "#F7F6F3", surface: "#FFFFFF", border: "#E5E2DC", borderLight: "#EFECEA",
    text: "#1A1916", textSec: "#6B6860", textTer: "#9C9890",
    accent, accentBg: `rgba(${r},${g},${b},0.07)`, accentBorder: `rgba(${r},${g},${b},0.2)`,
    success: "#3A7D44", successBg: "rgba(58,125,68,0.08)",
    warning: "#B8860B", warningBg: "rgba(184,134,11,0.08)",
    danger: "#DC2626", dangerBg: "rgba(220,38,38,0.08)",
    muted: "#8B8680", mutedBg: "rgba(139,134,128,0.08)",
    sidebar: "#1A1916",
  };
}

const ThemeCtx = createContext(makeTheme());
function useTheme() { return useContext(ThemeCtx); }

 //  SUPABASE CLIENT

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

   // SUPABASE DATABASE LAYER
   
const supabaseDb = {

  auth: {
    signIn: (email, pw) => supabase.auth.signInWithPassword({ email, password: pw }),
    signUp: (email, pw, meta) => supabase.auth.signUp({ email, password: pw, options: { data: meta } }),
    signOut: () => supabase.auth.signOut(),
    getSession: () => supabase.auth.getSession(),
    onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),
  },

  profiles: {
    get: async (uid) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (!data) return null;
      return {
        businessName: data.business_name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip: data.zip || "",
        country: data.country || "",
        logoUrl: data.logo_url || "",
        logoSize: data.logo_size || 48,
        themeColor: data.theme_color || "#C8553D",
        taxRate: Number(data.tax_rate) || 0,
        currency: data.currency || "USD",
        defaultNotes: data.default_notes || "",
        bankName: data.bank_name || "",
        accountNumber: data.account_number || "",
        routingNumber: data.routing_number || "",
        lateFeeEnabled: data.late_fee_enabled || false,
        lateFeeType: data.late_fee_type || "percentage",
        lateFeeValue: Number(data.late_fee_value) || 5,
        lateFeeGraceDays: Number(data.late_fee_grace_days) || 7,
        reminderBeforeDays: Number(data.reminder_before_days) || 3,
        reminderAfterDays: data.reminder_after_days || [1, 7, 14],
      };
    },
    update: async (uid, d) => {
      await supabase.from('profiles').update({
        business_name: d.businessName,
        email: d.email,
        phone: d.phone,
        address: d.address,
        city: d.city,
        state: d.state,
        zip: d.zip,
        country: d.country,
        logo_url: d.logoUrl,
        logo_size: d.logoSize,
        theme_color: d.themeColor,
        tax_rate: d.taxRate,
        currency: d.currency,
        default_notes: d.defaultNotes,
        bank_name: d.bankName,
        account_number: d.accountNumber,
        routing_number: d.routingNumber,
        late_fee_enabled: d.lateFeeEnabled,
        late_fee_type: d.lateFeeType,
        late_fee_value: d.lateFeeValue,
        late_fee_grace_days: d.lateFeeGraceDays,
        reminder_before_days: d.reminderBeforeDays,
        reminder_after_days: d.reminderAfterDays,
      }).eq('id', uid);
      return d;
    },
  },

    clients: {
    list: async (uid) => {
      const { data } = await supabase.from('clients').select('*').eq('user_id', uid).order('created_at');
      return (data || []).map(c => ({
        id: c.id,
        userId: c.user_id,
        name: c.name || "",
        company: c.company || "",
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        city: c.city || "",
        state: c.state || "",
        zip: c.zip || "",
        createdAt: c.created_at,
      }));
    },
    create: async (d) => {
      const { userId, createdAt, id, ...rest } = d;
      const { data, error } = await supabase.from('clients').insert({ ...rest, user_id: userId }).select().single();
      if (error || !data) throw new Error(error?.message || 'Failed to create client');
      return { ...data, userId: data.user_id, createdAt: data.created_at };
    },
    update: async (id, d) => {
      const { userId, createdAt, ...rest } = d;
      const { data } = await supabase.from('clients').update(rest).eq('id', id).select().single();
      return data ? { ...data, userId: data.user_id, createdAt: data.created_at } : d;
    },
    delete: async (id) => {
      await supabase.from('clients').delete().eq('id', id);
    },
  },

  invoices: {
    list: async (uid) => {
      const { data } = await supabase
        .from('invoices')
        .select('*, line_items(*)')
        .eq('user_id', uid)
        .order('issue_date', { ascending: false });
      return (data || []).map(i => ({
        id: i.id,
        userId: i.user_id,
        clientId: i.client_id,
        invoiceNumber: i.invoice_number,
        status: i.status,
        issueDate: i.issue_date,
        dueDate: i.due_date,
        taxRate: Number(i.tax_rate),
        notes: i.notes || "",
        createdAt: i.created_at,
        sentAt: i.sent_at || null,
        viewedAt: i.viewed_at || null,
        paidAt: i.paid_at || null,
        lineItems: (i.line_items || []).map(li => ({
          id: li.id,
          description: li.description,
          quantity: Number(li.quantity),
          unitPrice: Number(li.unit_price),
        })),
      }));
    },
    create: async (d) => {
      const { lineItems, userId, clientId, invoiceNumber, issueDate, dueDate, taxRate, createdAt, id, ...rest } = d;
      const { data: created, error } = await supabase.from('invoices').insert({
        user_id: userId,
        client_id: clientId,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate,
        tax_rate: taxRate,
        status: rest.status || 'draft',
        notes: rest.notes || '',
      }).select().single();
      if (error || !created) throw new Error(error?.message || 'Failed to create invoice');
      if (lineItems?.length) {
        await supabase.from('line_items').insert(
          lineItems.map(li => ({
            invoice_id: created.id,
            description: li.description,
            quantity: li.quantity,
            unit_price: li.unitPrice,
          }))
        );
      }
      return {
        id: created.id,
        userId, clientId, invoiceNumber, issueDate, dueDate, taxRate,
        status: created.status,
        notes: created.notes,
        createdAt: created.created_at,
        lineItems: lineItems || [],
      };
    },
    update: async (id, d) => {
      const { lineItems, userId, clientId, invoiceNumber, issueDate, dueDate, taxRate, createdAt, ...rest } = d;
      const updateData = {};
      if (clientId !== undefined) updateData.client_id = clientId;
      if (invoiceNumber !== undefined) updateData.invoice_number = invoiceNumber;
      if (issueDate !== undefined) updateData.issue_date = issueDate;
      if (dueDate !== undefined) updateData.due_date = dueDate;
      if (taxRate !== undefined) updateData.tax_rate = taxRate;
      if (rest.status !== undefined) updateData.status = rest.status;
      if (rest.notes !== undefined) updateData.notes = rest.notes;
      if (rest.sentAt !== undefined) updateData.sent_at = rest.sentAt;
      if (rest.viewedAt !== undefined) updateData.viewed_at = rest.viewedAt;
      if (rest.paidAt !== undefined) updateData.paid_at = rest.paidAt;
      if (Object.keys(updateData).length > 0) {
        await supabase.from('invoices').update(updateData).eq('id', id);
      }
      if (lineItems) {
        await supabase.from('line_items').delete().eq('invoice_id', id);
        if (lineItems.length > 0) {
          await supabase.from('line_items').insert(
            lineItems.map(li => ({
              invoice_id: id,
              description: li.description,
              quantity: li.quantity,
              unit_price: li.unitPrice,
            }))
          );
        }
      }
      return { id, ...d };
    },
    delete: async (id) => {
      await supabase.from('invoices').delete().eq('id', id);
    },
  },
};

const db = supabaseDb;

const genId = () => "id_" + Math.random().toString(36).substr(2, 8);
const fmtC = (n, c = "CAD") => { const loc = c === "NGN" ? "en-NG" : "en-CA"; return new Intl.NumberFormat(loc, { style: "currency", currency: c }).format(n); };
const fmtD = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "";
const calcT = (items, rate) => { const s = (items || []).reduce((a, l) => a + l.quantity * l.unitPrice, 0); const tx = s * (rate / 100); return { subtotal: s, taxAmount: tx, total: s + tx }; };
const nextNum = (invs) => { const ns = invs.map(i => parseInt(i.invoiceNumber.split("-").pop())).filter(n => !isNaN(n)); return `KS-2026-${String((ns.length ? Math.max(...ns) : 0) + 1).padStart(3, "0")}`; };

const AuthCtx = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user || null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, pw) => {
    setError(null); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (err) setError(err.message);
    setLoading(false);
  };

  const signUp = async (email, pw) => {
    setError(null); setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password: pw });
    if (err) setError(err.message);
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, loading, error, signIn, signUp, signOut, setError }}>{children}</AuthCtx.Provider>;
}
const useAuth = () => useContext(AuthCtx);

const DataCtx = createContext(null);
function DataProvider({ children }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [invs, cls, prof] = await Promise.all([
          db.invoices.list(user.id),
          db.clients.list(user.id),
          db.profiles.get(user.id),
        ]);
        if (!cancelled) {
          setInvoices(invs || []);
          setClients(cls || []);
          setSettings(prof || {});
          setReady(true);
        }
      } catch (e) {
        console.error("Data hydration error:", e);
        if (!cancelled) { setSettings({}); setReady(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const scheduleReminders = async (invoiceId, dueDate, sett) => {
    const reminders = [];
    const due = new Date(dueDate + "T00:00:00Z");

    const beforeDays = sett?.reminderBeforeDays ?? 3;
    if (beforeDays > 0) {
      const before = new Date(due);
      before.setDate(before.getDate() - beforeDays);
      reminders.push({
        invoice_id: invoiceId,
        type: "before_due",
        scheduled_at: before.toISOString(),
        message: "Friendly reminder: your invoice is due soon.",
      });
    }

    const afterDays = sett?.reminderAfterDays || [1, 7, 14];
    for (const days of afterDays) {
      const after = new Date(due);
      after.setDate(after.getDate() + days);
      reminders.push({
        invoice_id: invoiceId,
        type: "after_due",
        scheduled_at: after.toISOString(),
        message: `Your invoice is ${days} day${days > 1 ? "s" : ""} overdue.`,
      });
    }

    if (reminders.length > 0) {
      await supabase.from("reminders").insert(reminders);
    }
  };

  const acts = useMemo(() => ({
    addInvoice: async (d) => {
      const inv = await db.invoices.create({ ...d, userId: user?.id });
      setInvoices(p => [...p, inv]);
    
      if (d.status && d.status !== "draft" && inv.id && d.dueDate) {
        try { await scheduleReminders(inv.id, d.dueDate, settings); } catch (e) { console.error("Reminder scheduling failed:", e); }
      }
      return inv;
    },
    updateInvoice: async (id, d) => {
      setInvoices(p => p.map(i => i.id === id ? { ...i, ...d } : i));
      await db.invoices.update(id, d);
    },
    deleteInvoice: async (id) => {
      setInvoices(p => p.filter(i => i.id !== id));
      await db.invoices.delete(id);
    },
    addClient: async (d) => {
      const c = await db.clients.create({ ...d, userId: user?.id });
      setClients(p => [...p, c]);
      return c;
    },
    updateClient: async (id, d) => {
      setClients(p => p.map(c => c.id === id ? { ...c, ...d } : c));
      await db.clients.update(id, d);
    },
    deleteClient: async (id) => {
      setClients(p => p.filter(c => c.id !== id));
      await db.clients.delete(id);
    },
    updateSettings: async (d) => {
      setSettings(d);
      await db.profiles.update(user?.id, d);
    },
  }), [user, settings]);

  return <DataCtx.Provider value={{ invoices, clients, settings, ready, ...acts }}>{children}</DataCtx.Provider>;
}
const useData = () => useContext(DataCtx);

 
const RouterCtx = createContext(null);
function RouterProvider({ children }) {
  const [route, setRoute] = useState("/");
  const [hist, setHist] = useState(["/"]);
  const nav = useCallback((p) => { setRoute(p); setHist(h => [...h.slice(-19), p]); }, []);
  const back = useCallback(() => setHist(h => { if (h.length < 2) return h; const n = h.slice(0, -1); setRoute(n[n.length - 1]); return n; }), []);
  const match = useMemo(() => {
    if (route === "/") return { page: "dash" };
    if (route === "/invoices") return { page: "invList" };
    if (route === "/invoices/new") return { page: "invForm", id: null };
    if (route.startsWith("/invoices/edit/")) return { page: "invForm", id: route.split("/").pop() };
    if (route.startsWith("/invoices/")) return { page: "invDetail", id: route.split("/").pop() };
    if (route === "/clients") return { page: "clients" };
    if (route === "/recurring") return { page: "recurring" };
    if (route === "/expenses") return { page: "expenses" };
    if (route === "/audit") return { page: "audit" };
    if (route === "/settings") return { page: "settings" };
    return { page: "dash" };
  }, [route]);
  return <RouterCtx.Provider value={{ route, nav, back, match }}>{children}</RouterCtx.Provider>;
}
const useRouter = () => useContext(RouterCtx);

function Btn({ children, variant = "primary", size = "md", icon: Ic, loading: ld, onClick, style: sx }) {
  const T = useTheme();
  const v = { primary: { background: T.accent, color: "#fff", border: "none" }, secondary: { background: T.surface, color: T.text, border: `1px solid ${T.border}` }, ghost: { background: "transparent", color: T.textSec, border: "none" }, success: { background: T.success, color: "#fff", border: "none" } };
  const s = { sm: { padding: "5px 11px", fontSize: 12 }, md: { padding: "8px 16px", fontSize: 13 }, lg: { padding: "10px 22px", fontSize: 14 } };
  return <button onClick={onClick} disabled={ld} style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8, fontWeight: 600, cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap", transition: "all .15s", ...v[variant], ...s[size], ...sx }}>{ld ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : Ic ? <Ic size={14} /> : null}{children}</button>;
}

function Inp({ label, error, icon: Ic, style: sx, ...p }) {
  const T = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {Ic && <Ic size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textTer }} />}
        <input style={{ width: "100%", padding: Ic ? "8px 10px 8px 32px" : "8px 12px", borderRadius: 7, border: `1px solid ${error ? T.danger : T.border}`, fontSize: 13, fontFamily: T.font, color: T.text, background: error ? T.dangerBg : T.surface, outline: "none", boxSizing: "border-box", ...sx }} {...p} />
      </div>
      {error && <span style={{ fontSize: 10.5, color: T.danger }}>{error}</span>}
    </div>
  );
}

function Card({ children, p: pad = 22, style: sx, onClick }) {
  const T = useTheme();
  return <div onClick={onClick} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: pad, cursor: onClick ? "pointer" : undefined, ...sx }}>{children}</div>;
}

function Badge({ status }) {
  const T = useTheme();
  const c = { draft: { bg: T.mutedBg, color: T.muted, ic: Edit, l: "Draft" }, pending: { bg: T.warningBg, color: T.warning, ic: Clock, l: "Pending" }, paid: { bg: T.successBg, color: T.success, ic: CheckCircle, l: "Paid" }, overdue: { bg: T.dangerBg, color: T.danger, ic: AlertCircle, l: "Overdue" } }[status] || { bg: T.mutedBg, color: T.muted, ic: Hash, l: status };
  return <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><c.ic size={12} /> {c.l}</span>;
}


function AuthScreen() {
  const T = useTheme();
  const { signIn, signUp, loading, error, setError } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, fontFamily: T.font }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, margin: "0 auto 14px", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={22} color="#fff" /></div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>InvoiceKit</h1>
          <p style={{ color: T.textTer, fontSize: 13, marginTop: 5 }}>Micro-SaaS Invoicing Platform</p>
        </div>
        <Card>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: T.text, margin: "0 0 3px" }}>{mode === "signin" ? "Welcome back" : "Create account"}</h2>
          <p style={{ fontSize: 12.5, color: T.textTer, margin: "0 0 20px" }}>{mode === "signin" ? "Sign in to your workspace" : "Start your free trial"}</p>
          {error && <div style={{ padding: "8px 12px", borderRadius: 7, background: T.dangerBg, display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 12, color: T.danger, fontWeight: 500 }}><AlertTriangle size={13} /> {error} <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}><X size={13} color={T.danger} /></button></div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
            <Inp label="Email" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
            <Inp label="Password" icon={Lock} type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Min 6 characters" />
          </div>
          <Btn variant="primary" size="lg" loading={loading} onClick={() => mode === "signin" ? signIn(email, pw) : signUp(email, pw)} style={{ width: "100%" }}>{mode === "signin" ? "Sign In" : "Create Account"}</Btn>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: T.textTer }}>{mode === "signin" ? "No account?" : "Have an account?"} <span onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }} style={{ color: T.accent, fontWeight: 600, cursor: "pointer" }}>{mode === "signin" ? "Sign up" : "Sign in"}</span></div>
        </Card>
      </div>
    </div>
  );
}
   
function Sidebar() {
  const T = useTheme();
  const { route, nav } = useRouter();
  const { signOut, user } = useAuth();
  const items = [{ p: "/", ic: LayoutDashboard, l: "Dashboard" }, { p: "/invoices", ic: FileText, l: "Invoices" }, { p: "/clients", ic: Users, l: "Clients" }, { p: "/recurring", ic: Clock, l: "Recurring" }, { p: "/expenses", ic: Receipt, l: "Expenses" }, { p: "/audit", ic: Search, l: "Audit Trail" }, { p: "/settings", ic: Settings, l: "Settings" }];
  return (
    <div data-no-print style={{ width: 220, minHeight: "100vh", background: T.sidebar, borderRight: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", fontFamily: T.font, flexShrink: 0 }}>
      <div style={{ padding: "22px 18px 18px" }}><div style={{ display: "flex", alignItems: "center", gap: 9 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={15} color="#fff" /></div><div><div style={{ color: "#E8E5DF", fontWeight: 700, fontSize: 14 }}>InvoiceKit</div><div style={{ color: "#6B6860", fontSize: 9.5, letterSpacing: "0.06em", fontWeight: 600 }}>MICRO-SAAS</div></div></div></div>
      <nav style={{ flex: 1, padding: "6px 8px" }}>
        {items.map(it => { const a = route === it.p || (it.p !== "/" && route.startsWith(it.p)); return <button key={it.p} onClick={() => nav(it.p)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 1, borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontFamily: T.font, fontWeight: a ? 600 : 400, background: a ? `${T.accent}18` : "transparent", color: a ? T.accent : "#A8A49C", transition: "all .12s" }}><it.ic size={16} /> {it.l}</button>; })}
      </nav>
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{(user?.email?.[0] || "U").toUpperCase()}</div><div><div style={{ color: "#D4D0C8", fontSize: 12 }}>{user?.email?.split("@")[0]}</div><div style={{ color: "#6B6860", fontSize: 10 }}>Free</div></div></div>
        <button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6860", padding: 3 }}><LogOut size={14} /></button>
      </div>
    </div>
  );
}

function DashPage() {
  const T = useTheme();
  const { invoices, clients, settings } = useData();
  const { nav } = useRouter();
  const tr = settings?.taxRate || 0; const cur = settings?.currency;
  const stats = useMemo(() => { const by = { paid: [], pending: [], overdue: [], draft: [] }; invoices.forEach(i => by[i.status]?.push(i)); const sum = a => a.reduce((s, i) => s + calcT(i.lineItems, i.taxRate ?? tr).total, 0); return { rev: sum(by.paid), pend: sum(by.pending), over: sum(by.overdue), pc: by.paid.length, pnc: by.pending.length, oc: by.overdue.length }; }, [invoices, tr]);
  const cards = [{ l: "Revenue", v: fmtC(stats.rev, cur), ic: DollarSign, color: T.success, bg: T.successBg, trend: "+12%", up: true }, { l: "Pending", v: fmtC(stats.pend, cur), ic: Clock, color: T.warning, bg: T.warningBg }, { l: "Overdue", v: fmtC(stats.over, cur), ic: AlertCircle, color: T.danger, bg: T.dangerBg, trend: `${stats.oc} past due`, up: false }, { l: "Clients", v: clients.length, ic: Users, color: T.accent, bg: T.accentBg, trend: `+${Math.max(1, Math.floor(clients.length / 3))} qtr`, up: true }];
  const recent = [...invoices].sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || "")).slice(0, 5);
  return (
    <div>
      <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Dashboard</h1><p style={{ color: T.textTer, fontSize: 13, marginTop: 4 }}>Financial overview for {settings?.businessName || "your business"}.</p></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {cards.map((c, i) => <Card key={i} p={18}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}><div style={{ width: 36, height: 36, borderRadius: 9, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><c.ic size={17} color={c.color} /></div>{c.trend && <span style={{ fontSize: 11, fontWeight: 600, color: c.up ? T.success : T.danger, display: "flex", alignItems: "center", gap: 2 }}>{c.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {c.trend}</span>}</div><div style={{ fontSize: 24, fontWeight: 700, color: T.text, marginBottom: 1 }}>{c.v}</div><div style={{ fontSize: 12, color: T.textTer }}>{c.l}</div></Card>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card p={0}><div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Recent Invoices</span><button onClick={() => nav("/invoices")} style={{ fontSize: 11.5, color: T.accent, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: T.font }}>View all →</button></div>
          {recent.length === 0 && <div style={{ padding: "30px 20px", textAlign: "center", color: T.textTer, fontSize: 13 }}>No invoices yet. Create your first one!</div>}
          {recent.map(inv => { const cl = clients.find(c => c.id === inv.clientId); const tot = calcT(inv.lineItems, inv.taxRate ?? tr); return <div key={inv.id} onClick={() => nav(`/invoices/${inv.id}`)} style={{ padding: "10px 20px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}><div><div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{inv.invoiceNumber}</div><div style={{ fontSize: 11.5, color: T.textTer }}>{cl?.company || cl?.name || ""}</div></div><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{fmtC(tot.total, cur)}</span><Badge status={inv.status} /></div></div>; })}
        </Card>
        <Card><div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, marginBottom: 18 }}>Revenue by Status</div>{[{ l: "Paid", a: stats.rev, c: T.success }, { l: "Pending", a: stats.pend, c: T.warning }, { l: "Overdue", a: stats.over, c: T.danger }].map((item, i) => { const all = stats.rev + stats.pend + stats.over; const pct = all > 0 ? Math.round((item.a / all) * 100) : 0; return <div key={i} style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12.5, color: T.textSec }}>{item.l}</span><span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{fmtC(item.a, cur)}</span></div><div style={{ height: 6, background: T.borderLight, borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: item.c, borderRadius: 3, transition: "width .5s" }} /></div></div>; })}</Card>
      </div>
    </div>
  );
}

function InvListPage() { const T = useTheme(); const { invoices, clients, settings } = useData(); const { nav } = useRouter(); const [search, setSearch] = useState(""); const [filter, setFilter] = useState("all"); const filtered = useMemo(() => invoices.filter(inv => { const cl = clients.find(c => c.id === inv.clientId); const q = search.toLowerCase(); return (!q || (inv.invoiceNumber || "").toLowerCase().includes(q) || (cl?.name || "").toLowerCase().includes(q) || (cl?.company || "").toLowerCase().includes(q)) && (filter === "all" || inv.status === filter); }).sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || "")), [invoices, clients, search, filter]); return (<div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}><div><h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Invoices</h1><p style={{ color: T.textTer, fontSize: 13, marginTop: 4 }}>{invoices.length} total</p></div><Btn variant="secondary" icon={Download} onClick={() => { const rows = [["Invoice","Client","Date","Due","Status","Subtotal","Tax","Total"]]; filtered.forEach(inv => { const cl = clients.find(c => c.id === inv.clientId); const t = calcT(inv.lineItems, inv.taxRate ?? settings?.taxRate ?? 0); rows.push([inv.invoiceNumber, cl?.name||"", inv.issueDate, inv.dueDate, inv.status, t.subtotal.toFixed(2), t.taxAmount.toFixed(2), t.total.toFixed(2)]); }); const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n"); const blob = new Blob([csv],{type:"text/csv"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "invoices.csv"; a.click(); }}>Export CSV</Btn><Btn icon={Plus} onClick={() => nav("/invoices/new")}>New Invoice</Btn></div><div style={{ display: "flex", gap: 8, marginBottom: 16 }}><div style={{ flex: 1 }}><Inp icon={Search} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>{["all", "draft", "pending", "paid", "overdue"].map(s => <Btn key={s} variant={filter === s ? "primary" : "secondary"} size="sm" onClick={() => setFilter(s)} style={{ textTransform: "capitalize" }}>{s}</Btn>)}</div><Card p={0}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ borderBottom: `1px solid ${T.borderLight}` }}>{["Invoice", "Client", "Date", "Amount", "Status", ""].map((h, i) => <th key={i} style={{ padding: "10px 18px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: T.textTer, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>)}</tr></thead><tbody>{filtered.map(inv => { const cl = clients.find(c => c.id === inv.clientId); const tot = calcT(inv.lineItems, inv.taxRate ?? settings?.taxRate ?? 0); return <tr key={inv.id} onClick={() => nav(`/invoices/${inv.id}`)} style={{ borderBottom: `1px solid ${T.borderLight}`, cursor: "pointer" }}><td style={{ padding: "12px 18px", fontSize: 13, fontWeight: 600, color: T.text }}>{inv.invoiceNumber}</td><td style={{ padding: "12px 18px" }}><div style={{ fontSize: 12.5, fontWeight: 500, color: T.text }}>{cl?.name}</div><div style={{ fontSize: 11.5, color: T.textTer }}>{cl?.company}</div></td><td style={{ padding: "12px 18px", fontSize: 12.5, color: T.textSec }}>{fmtD(inv.issueDate)}</td><td style={{ padding: "12px 18px", fontSize: 13, fontWeight: 600, color: T.text }}>{fmtC(tot.total, settings?.currency)}</td><td style={{ padding: "12px 18px" }}><Badge status={inv.status} /></td><td style={{ padding: "12px 18px", textAlign: "right" }}><ChevronRight size={14} color={T.textTer} /></td></tr>; })}{filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: T.textTer }}>No invoices found.</td></tr>}</tbody></table></Card></div>); }

  
function InvFormPage() { const T = useTheme(); const { invoices, clients, settings, addInvoice, updateInvoice } = useData(); const { nav, back, match } = useRouter(); const existing = match.id ? invoices.find(i => i.id === match.id) : null; const [form, setForm] = useState({ clientId: existing?.clientId || "", invoiceNumber: existing?.invoiceNumber || nextNum(invoices), status: existing?.status || "draft", issueDate: existing?.issueDate || new Date().toISOString().split("T")[0], dueDate: existing?.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0], notes: existing?.notes || settings?.defaultNotes || "", taxRate: existing?.taxRate ?? settings?.taxRate ?? 12 }); const [items, setItems] = useState(existing?.lineItems?.length ? existing.lineItems : [{ id: genId(), description: "", quantity: 1, unitPrice: 0 }]); const [errors, setErrors] = useState({}); const [saving, setSaving] = useState(false); const addItem = () => setItems(p => [...p, { id: genId(), description: "", quantity: 1, unitPrice: 0 }]); const rmItem = (id) => setItems(p => p.length > 1 ? p.filter(l => l.id !== id) : p); const upItem = (id, f, v) => setItems(p => p.map(l => l.id === id ? { ...l, [f]: f === "description" ? v : parseFloat(v) || 0 } : l)); const totals = calcT(items, form.taxRate); const validate = () => { const e = {}; if (!form.clientId) e.clientId = "Required"; if (items.some(l => !l.description.trim())) e.items = "All need descriptions"; setErrors(e); return !Object.keys(e).length; }; const save = async (st) => { if (!validate()) return; setSaving(true); try { const d = { ...form, status: st || form.status, lineItems: items }; if (st === "pending") d.sentAt = new Date().toISOString(); if (existing) await updateInvoice(existing.id, d); else await addInvoice(d); nav("/invoices"); } catch (e) { console.error(e); setErrors({ save: e.message }); } finally { setSaving(false); } }; const selClient = clients.find(c => c.id === form.clientId); return (<div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}><Btn variant="ghost" icon={ChevronLeft} onClick={back}>{""}</Btn><div><h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>{existing ? "Edit Invoice" : "New Invoice"}</h1><p style={{ color: T.textTer, fontSize: 12.5, marginTop: 2 }}>{form.invoiceNumber}</p></div></div>{errors.save && <div style={{ padding: "8px 12px", borderRadius: 7, background: T.dangerBg, fontSize: 12, color: T.danger, marginBottom: 16 }}>{errors.save}</div>}<div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><Card><div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, marginBottom: 16 }}>Details</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec }}>Client *</label><select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${errors.clientId ? T.danger : T.border}`, fontSize: 13, fontFamily: T.font, cursor: "pointer", boxSizing: "border-box" }}><option value="">Select…</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}</select></div><div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec }}>Status</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, cursor: "pointer", boxSizing: "border-box" }}>{["draft", "pending", "paid", "overdue"].map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></div><Inp label="Issue Date" type="date" value={form.issueDate} onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))} /><Inp label="Due Date" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /><Inp label="Tax Rate (%)" type="number" min="0" step="0.1" value={form.taxRate} onChange={e => setForm(p => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))} /></div></Card><Card><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Line Items</span><Btn variant="ghost" size="sm" icon={Plus} onClick={addItem} style={{ color: T.accent }}>Add</Btn></div>{errors.items && <div style={{ padding: "6px 10px", borderRadius: 6, background: T.dangerBg, fontSize: 11.5, color: T.danger, marginBottom: 10 }}>{errors.items}</div>}<div style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px 90px 28px", gap: "6px 8px", marginBottom: 6 }}>{["Description", "Qty", "Price", "Total", ""].map((h, i) => <div key={i} style={{ fontSize: 10, fontWeight: 600, color: T.textTer, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>)}</div>{items.map(li => <div key={li.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px 90px 28px", gap: "6px 8px", alignItems: "center", marginBottom: 6 }}><input value={li.description} onChange={e => upItem(li.id, "description", e.target.value)} placeholder="Service…" style={{ padding: "7px 9px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12.5, fontFamily: T.font, outline: "none", boxSizing: "border-box" }} /><input type="number" min="0" value={li.quantity || ""} onChange={e => upItem(li.id, "quantity", e.target.value)} style={{ padding: "7px 9px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12.5, fontFamily: T.font, outline: "none", textAlign: "right", boxSizing: "border-box" }} /><input type="number" min="0" step="0.01" value={li.unitPrice || ""} onChange={e => upItem(li.id, "unitPrice", e.target.value)} style={{ padding: "7px 9px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12.5, fontFamily: T.font, outline: "none", textAlign: "right", boxSizing: "border-box" }} /><div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, textAlign: "right" }}>{fmtC(li.quantity * li.unitPrice, settings?.currency)}</div><button onClick={() => rmItem(li.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textTer, padding: 1 }}><Trash2 size={13} /></button></div>)}</Card><Card><div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, marginBottom: 8 }}>Notes</div><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, outline: "none", resize: "vertical", boxSizing: "border-box" }} /></Card></div><div style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}><Card><div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, marginBottom: 16 }}>Summary</div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12.5, color: T.textSec }}>Subtotal</span><span style={{ fontSize: 13, fontWeight: 500 }}>{fmtC(totals.subtotal, settings?.currency)}</span></div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12.5, color: T.textSec }}>Tax ({form.taxRate}%)</span><span style={{ fontSize: 13, fontWeight: 500 }}>{fmtC(totals.taxAmount, settings?.currency)}</span></div><div style={{ height: 1, background: T.border, margin: "6px 0" }} /><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 14, fontWeight: 700 }}>Total</span><span style={{ fontSize: 19, fontWeight: 700 }}>{fmtC(totals.total, settings?.currency)}</span></div><div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}><Btn icon={Save} loading={saving} onClick={() => save("pending")} style={{ width: "100%" }}>Save & Send</Btn><Btn variant="secondary" onClick={() => save("draft")} style={{ width: "100%" }}>Save Draft</Btn></div></Card>{selClient && <Card><div style={{ fontSize: 10.5, fontWeight: 600, color: T.textTer, letterSpacing: "0.04em", marginBottom: 8 }}>BILL TO</div><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{selClient.name}</div><div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>{selClient.company}<br />{selClient.address}<br />{selClient.city}, {selClient.state} {selClient.zip}</div><div style={{ fontSize: 12, color: T.accent, marginTop: 4 }}>{selClient.email}</div></Card>}</div></div></div>); }


function InvoiceTimeline({ invoice }) {
  const T = useTheme();
  const events = [
    { label: "Created", date: invoice.createdAt, done: true, icon: FileText },
    { label: "Sent", date: invoice.sentAt, done: !!invoice.sentAt, icon: Mail },
    { label: "Viewed", date: invoice.viewedAt, done: !!invoice.viewedAt, icon: Search },
    { label: "Paid", date: invoice.paidAt, done: !!invoice.paidAt, icon: CheckCircle },
  ];
  return (
    <div data-no-print style={{ maxWidth: 780, margin: "0 auto 20px", padding: "18px 24px", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 16, left: "12%", right: "12%", height: 2, background: T.borderLight, zIndex: 0 }} />
        <div style={{ position: "absolute", top: 16, left: "12%", height: 2, background: T.accent, zIndex: 1, width: `${Math.max(0, (events.filter(e => e.done).length - 1)) / (events.length - 1) * 76}%`, transition: "width 0.5s ease" }} />
        {events.map((e, i) => {
          const Ic = e.icon;
          return (
            <div key={i} style={{ flex: 1, textAlign: "center", position: "relative", zIndex: 2 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", margin: "0 auto 8px",
                background: e.done ? T.accent : T.surface,
                border: e.done ? "none" : `2px solid ${T.borderLight}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
                boxShadow: e.done ? `0 2px 8px ${T.accentBorder}` : "none",
              }}>
                {e.done ? <Ic size={14} color="#fff" /> : <Ic size={14} color={T.textTer} />}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: e.done ? T.text : T.textTer }}>{e.label}</div>
              {e.done && e.date && (
                <div style={{ fontSize: 10, color: T.textTer, marginTop: 2 }}>
                  {new Date(e.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function InvDetailPage() {
  const T = useTheme();
  const { invoices, clients, settings, updateInvoice } = useData();
  const { nav, back, match } = useRouter();
  const inv = invoices.find(i => i.id === match.id);

  if (!inv) return (
    <Card><div style={{ padding: 40, textAlign: "center", color: T.textTer }}>
      Invoice not found. <button onClick={() => nav("/invoices")} style={{ color: T.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Back</button>
    </div></Card>
  );

  const cl = clients.find(c => c.id === inv.clientId);
  const invTax = inv.taxRate ?? settings?.taxRate ?? 0;
  const tot = calcT(inv.lineItems, invTax);
  const logoSz = settings?.logoSize || 48;
  const cur = settings?.currency;
  const items = inv.lineItems || [];

  return (
    <div>
      <div data-no-print style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Btn variant="ghost" icon={ChevronLeft} onClick={back}>{""}</Btn>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>{inv.invoiceNumber}</h1>
              <Badge status={inv.status} />
            </div>
            <p style={{ color: T.textTer, fontSize: 12.5, marginTop: 2 }}>Issued {fmtD(inv.issueDate)}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {inv.status !== "paid" && <Btn variant="success" size="sm" icon={CheckCircle} onClick={() => updateInvoice(inv.id, { status: "paid", paidAt: new Date().toISOString() })}>Mark Paid</Btn>}
          {inv.status === "paid" && <Btn variant="secondary" size="sm" icon={AlertCircle} onClick={() => updateInvoice(inv.id, { status: "pending", paidAt: null })}>Mark Unpaid</Btn>}
          <Btn variant="secondary" size="sm" icon={Edit} onClick={() => nav(`/invoices/edit/${inv.id}`)}>Edit</Btn>
          <Btn size="sm" icon={Download} onClick={() => window.print()}>PDF</Btn>
          <Btn variant="secondary" size="sm" icon={Download} onClick={() => { const rows = [["Description","Qty","Price","Amount"]]; (inv.lineItems||[]).forEach(li => rows.push([li.description, li.quantity, li.unitPrice, (li.quantity*li.unitPrice).toFixed(2)])); rows.push([]); rows.push(["","","Subtotal",tot.subtotal.toFixed(2)]); rows.push(["","","Tax",tot.taxAmount.toFixed(2)]); rows.push(["","","Total",tot.total.toFixed(2)]); const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${inv.invoiceNumber}.csv`; a.click(); }}>CSV</Btn>
        </div>
      </div>

      <InvoiceTimeline invoice={inv} />

      {/* INVOICE DOCUMENT */}
      <div style={{
        maxWidth: 780, margin: "0 auto", background: "#fff",
        borderRadius: 4, border: `1px solid ${T.border}`,
        boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
        padding: "52px 56px 48px",
        fontFamily: T.font, color: T.text,
      }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" style={{ height: logoSz, width: "auto", maxWidth: logoSz * 3, objectFit: "contain" }} />
            ) : (
              <div style={{ fontSize: 10, color: T.textTer, textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.5 }}>
                Your<br />Logo
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1 }}>INVOICE</div>
            <div style={{ fontSize: 12.5, color: T.textSec, marginTop: 6 }}>No: {inv.invoiceNumber}</div>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Date: </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{fmtD(inv.issueDate)}</span>
          <span style={{ fontSize: 12, color: T.textSec, marginLeft: 24 }}>Due: </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{fmtD(inv.dueDate)}</span>
        </div>

         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 36 }}>
          {/* Billed To card */}
          <div style={{ background: "#F8F7F4", borderRadius: 10, padding: "18px 22px", border: `1px solid ${T.borderLight}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, paddingBottom: 8, borderBottom: `1.5px solid ${T.border}` }}>
              Billed To
            </div>
            {cl ? (
              <div style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.9 }}>
                <div style={{ fontWeight: 600, color: T.text, fontSize: 13.5, marginBottom: 2 }}>{cl.name}</div>
                {cl.company && <div style={{ color: T.accent, fontWeight: 500, marginBottom: 4 }}>{cl.company}</div>}
                {cl.address && <div>{cl.address}</div>}
                {cl.city && <div>{cl.city}, {cl.state} {cl.zip}</div>}
                {cl.email && <div>{cl.email}</div>}
                {cl.phone && <div>{cl.phone}</div>}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: T.textTer }}>—</div>
            )}
          </div>

          <div style={{ background: "#F8F7F4", borderRadius: 10, padding: "18px 22px", border: `1px solid ${T.borderLight}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, paddingBottom: 8, borderBottom: `1.5px solid ${T.border}` }}>
              From
            </div>
            <div style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.9 }}>
              <div style={{ fontWeight: 600, color: T.text, fontSize: 13.5, marginBottom: 2 }}>{settings?.businessName || "Your Business"}</div>
              {settings?.address && <div>{settings.address}</div>}
              {settings?.city && <div>{settings.city}, {settings.state} {settings.zip}</div>}
              {settings?.email && <div>{settings.email}</div>}
              {settings?.phone && <div>{settings.phone}</div>}
            </div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0 }}>
          <thead>
            <tr style={{ background: "#F0EFEC" }}>
              <th style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "0.04em" }}>Description</th>
              <th style={{ padding: "11px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "0.04em", width: 60 }}>Qty</th>
              <th style={{ padding: "11px 14px", textAlign: "right", fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "0.04em", width: 110 }}>Price</th>
              <th style={{ padding: "11px 14px", textAlign: "right", fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "0.04em", width: 110 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((li, idx) => (
              <tr key={li.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                <td style={{ padding: "12px 14px", fontSize: 13, color: T.text }}>{li.description}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: T.textSec, textAlign: "center" }}>{li.quantity}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: T.textSec, textAlign: "right" }}>{fmtC(li.unitPrice, cur)}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: T.text, textAlign: "right" }}>{fmtC(li.quantity * li.unitPrice, cur)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 28, textAlign: "center", color: T.textTer, fontSize: 13 }}>No line items</td></tr>
            )}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 260, borderTop: `2px solid ${T.text}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", fontSize: 12.5 }}>
              <span style={{ color: T.textSec }}>Subtotal</span>
              <span style={{ fontWeight: 500, color: T.text }}>{fmtC(tot.subtotal, cur)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 14px 10px", fontSize: 12.5, borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{ color: T.textSec }}>Tax ({invTax}%)</span>
              <span style={{ fontWeight: 500, color: T.text }}>{fmtC(tot.taxAmount, cur)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", alignItems: "baseline" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>{fmtC(tot.total, cur)}</span>
            </div>
          </div>
        </div>

         <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 28, marginBottom: 0 }}>
          <div style={{
            background: "#F8F7F4", borderRadius: 10, padding: "20px 24px",
            border: `1px solid ${T.borderLight}`,
            display: "grid",
            gridTemplateColumns: (inv.notes && settings?.bankName) ? "1fr 1fr" : "1fr",
            gap: 28,
          }}>
            {settings?.bankName && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Payment Method</div>
                <div style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.9 }}>
                  <div style={{ fontWeight: 600, color: T.text }}>{settings.bankName}</div>
                  {settings.accountNumber && <div>Account: {settings.accountNumber}</div>}
                  {settings.routingNumber && <div>Routing: {settings.routingNumber}</div>}
                </div>
              </div>
            )}
            {inv.notes && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Notes</div>
                <div style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.8 }}>{inv.notes}</div>
              </div>
            )}
            {!inv.notes && !settings?.bankName && (
              <div style={{ fontSize: 12.5, color: T.textTer, textAlign: "center", padding: "8px 0" }}>
                Thank you for your business.
              </div>
            )}
          </div>
        </div>

      <div style={{ height: 28 }} />
      </div>

       <div style={{
        maxWidth: 780, margin: "-1px auto 0", overflow: "hidden",
        borderRadius: "0 0 4px 4px", position: "relative", height: 80,
      }}>
        
        <svg viewBox="0 0 780 80" style={{ width: "100%", height: 80, display: "block" }} preserveAspectRatio="none">
          <path d={`M 780 0 L 780 80 L 0 80 L 0 40 Q 200 -10 420 30 Q 580 55 780 0 Z`} fill={T.sidebar} />
          <path d={`M 780 10 L 780 80 L 0 80 L 0 50 Q 180 5 400 40 Q 570 60 780 10 Z`} fill={T.textSec} opacity="0.15" />
        </svg>
        
        <div style={{
          position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center",
          fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: "0.04em",
        }}>
          Thank you for your business — {settings?.businessName || "InvoiceKit"}
        </div>
      </div>
    </div>
  );
}

function ClientsPage() { const T = useTheme(); const { clients, invoices, settings, addClient, updateClient } = useData(); const [show, setShow] = useState(false); const [edit, setEdit] = useState(null); const [f, setF] = useState({ name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", company: "" }); const openNew = () => { setF({ name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", company: "" }); setEdit(null); setShow(true); }; const openEd = (c) => { setF({ name: c.name || "", email: c.email || "", phone: c.phone || "", address: c.address || "", city: c.city || "", state: c.state || "", zip: c.zip || "", company: c.company || "" }); setEdit(c); setShow(true); }; const doSave = async () => { if (!f.name.trim()) return; try { if (edit) await updateClient(edit.id, f); else await addClient(f); setShow(false); } catch (e) { console.error(e); } }; return (<div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}><div><h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Clients</h1><p style={{ color: T.textTer, fontSize: 13, marginTop: 4 }}>{clients.length} active</p></div><Btn icon={UserPlus} onClick={openNew}>Add Client</Btn></div>{show && <Card style={{ marginBottom: 18 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{edit ? "Edit" : "New"} Client</span><button onClick={() => setShow(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={15} color={T.textTer} /></button></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{[["name", "Full Name *"], ["company", "Company"], ["email", "Email"], ["phone", "Phone"], ["address", "Address"], ["city", "City"], ["state", "Province"], ["zip", "Postal Code"]].map(([k, l]) => <Inp key={k} label={l} value={f[k]} onChange={e => setF(p => ({ ...p, [k]: e.target.value }))} />)}</div><div style={{ display: "flex", gap: 6, marginTop: 14, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setShow(false)}>Cancel</Btn><Btn onClick={doSave}>{edit ? "Update" : "Create"}</Btn></div></Card>}<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{clients.map(c => { const ci = invoices.filter(i => i.clientId === c.id); const tot = ci.reduce((s, i) => s + calcT(i.lineItems, i.taxRate ?? settings?.taxRate ?? 0).total, 0); return <Card key={c.id}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><div><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{c.name}</div><div style={{ fontSize: 12.5, color: T.accent, fontWeight: 500 }}>{c.company}</div></div><button onClick={() => openEd(c)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textTer }}><Edit size={13} /></button></div><div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.8, marginBottom: 12 }}>{c.email && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={11} /> {c.email}</div>}{c.phone && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={11} /> {c.phone}</div>}{c.city && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={11} /> {c.city}, {c.state}</div>}</div><div style={{ display: "flex", gap: 20, paddingTop: 10, borderTop: `1px solid ${T.borderLight}` }}><div><div style={{ fontSize: 9.5, fontWeight: 600, color: T.textTer, letterSpacing: "0.05em" }}>INVOICES</div><div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{ci.length}</div></div><div><div style={{ fontSize: 9.5, fontWeight: 600, color: T.textTer, letterSpacing: "0.05em" }}>BILLED</div><div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{fmtC(tot, settings?.currency)}</div></div></div><div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.borderLight}` }}><button onClick={async (e) => { e.stopPropagation(); const token = crypto.randomUUID(); await supabase.from('clients').update({ portal_token: token, portal_enabled: true }).eq('id', c.id); const link = `${window.location.origin}/portal/${token}`; try { await navigator.clipboard.writeText(link); alert('Portal link copied to clipboard!\n\n' + link); } catch (_e) { prompt('Copy this portal link:', link); } }} style={{ width: "100%", padding: "7px 0", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, fontSize: 11.5, fontWeight: 600, color: T.accent, cursor: "pointer", fontFamily: T.font, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><CreditCard size={12} /> Generate Portal Link</button></div></Card>; })}</div></div>); }



function RecurringSimPage() {
  const T = useTheme();
  const { invoices, clients, settings, addInvoice } = useData();
  const { nav } = useRouter();
  const cur = settings?.currency || "CAD";
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientId: "", title: "", frequency: "monthly", amount: "", description: "" });
  const [generating, setGenerating] = useState(null);

  const addTemplate = () => {
    if (!form.clientId || !form.title.trim() || !form.amount) return;
    setTemplates(p => [...p, { ...form, id: genId(), amount: parseFloat(form.amount) || 0, createdAt: new Date().toISOString(), lastGenerated: null }]);
    setForm({ clientId: "", title: "", frequency: "monthly", amount: "", description: "" });
    setShowForm(false);
  };

  const removeTemplate = (id) => setTemplates(p => p.filter(t => t.id !== id));

  const simulate = async (tmpl) => {
    setGenerating(tmpl.id);
    const inv = {
      clientId: tmpl.clientId,
      invoiceNumber: nextNum(invoices),
      status: "pending",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      taxRate: settings?.taxRate || 0,
      notes: settings?.defaultNotes || "",
      lineItems: [{ id: genId(), description: tmpl.description || tmpl.title, quantity: 1, unitPrice: tmpl.amount }],
      sentAt: new Date().toISOString(),
    };
    await addInvoice(inv);
    setTemplates(p => p.map(t => t.id === tmpl.id ? { ...t, lastGenerated: new Date().toISOString() } : t));
    setGenerating(null);
  };

  const freqLabel = { weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div><h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Recurring Simulation</h1><p style={{ color: T.textTer, fontSize: 13, marginTop: 4 }}>{templates.length} template{templates.length !== 1 ? "s" : ""} — simulate recurring invoice generation</p></div>
        <Btn icon={Plus} onClick={() => setShowForm(true)}>New Template</Btn>
      </div>
      <Card style={{ marginBottom: 18, padding: "14px 20px", background: T.accentBg, border: `1px dashed ${T.accentBorder}` }}>
        <div style={{ fontSize: 12.5, color: T.accent, lineHeight: 1.6 }}>Templates are stored in-memory for simulation. Click "Generate Invoice" to create a real invoice from a template. In production, this would run automatically on a schedule via a cron job.</div>
      </Card>
      {showForm && <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>New Recurring Template</span><button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={15} color={T.textTer} /></button></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <Inp label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Monthly Retainer" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec }}>Client *</label><select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, cursor: "pointer", boxSizing: "border-box" }}><option value="">Select…</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}</select></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec }}>Frequency</label><select value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, cursor: "pointer", boxSizing: "border-box" }}>{Object.entries(freqLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <Inp label="Amount *" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
          <Inp label="Line Item Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Service description" />
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn><Btn onClick={addTemplate}>Create Template</Btn></div>
      </Card>}
      {templates.length === 0 && !showForm && <Card><div style={{ padding: 30, textAlign: "center", color: T.textTer, fontSize: 13 }}>No recurring templates yet. Create one to simulate automatic invoice generation.</div></Card>}
      {templates.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {templates.map(t => { const cl = clients.find(c => c.id === t.clientId); return <Card key={t.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.title}</div><div style={{ fontSize: 12.5, color: T.accent, fontWeight: 500 }}>{cl?.company || cl?.name || ""}</div></div>
            <button onClick={() => removeTemplate(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textTer }}><Trash2 size={13} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><div style={{ fontSize: 10, fontWeight: 600, color: T.textTer }}>FREQUENCY</div><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{freqLabel[t.frequency]}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 600, color: T.textTer }}>AMOUNT</div><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{fmtC(t.amount, cur)}</div></div>
          </div>
          {t.lastGenerated && <div style={{ fontSize: 11, color: T.success, marginBottom: 10 }}>Last generated: {new Date(t.lastGenerated).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}
          <Btn size="sm" loading={generating === t.id} onClick={() => simulate(t)} style={{ width: "100%" }}>Generate Invoice</Btn>
        </Card>; })}
      </div>}
    </div>
  );
}

function ExpensesPage() {
  const T = useTheme();
  const { clients, settings } = useData();
  const { user } = useAuth();
  const { nav } = useRouter();
  const cur = settings?.currency || "CAD";
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [filterCat, setFilterCat] = useState("all");
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    description: "", amount: "", category: "general",
    clientId: "", expenseDate: new Date().toISOString().split("T")[0],
    isBillable: true, receiptUrl: "",
  });

  const CATEGORIES = [
    { value: "general", label: "General", color: T.muted },
    { value: "travel", label: "Travel", color: "#2563EB" },
    { value: "software", label: "Software", color: "#7C3AED" },
    { value: "supplies", label: "Supplies", color: "#D97706" },
    { value: "meals", label: "Meals", color: "#16A34A" },
    { value: "equipment", label: "Equipment", color: "#E11D48" },
    { value: "other", label: "Other", color: T.textSec },
  ];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("expense_date", { ascending: false });
      setExpenses((data || []).map(e => ({
        id: e.id, description: e.description, amount: Number(e.amount),
        category: e.category, clientId: e.client_id, expenseDate: e.expense_date,
        isBillable: e.is_billable, isBilled: e.is_billed, receiptUrl: e.receipt_url,
        createdAt: e.created_at,
      })));
      setLoading(false);
    })();
  }, [user]);

  const handleReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File must be under 5 MB"); return; }
    const path = `receipts/${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file);
    if (error) { alert("Upload failed: " + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(path);
    setForm(p => ({ ...p, receiptUrl: publicUrl }));
  };

  const saveExpense = async () => {
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    const { data, error } = await supabase.from("expenses").insert({
      user_id: user.id,
      client_id: form.clientId || null,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      expense_date: form.expenseDate,
      is_billable: form.isBillable,
      receipt_url: form.receiptUrl,
    }).select().single();
    if (!error && data) {
      setExpenses(p => [{
        id: data.id, description: data.description, amount: Number(data.amount),
        category: data.category, clientId: data.client_id, expenseDate: data.expense_date,
        isBillable: data.is_billable, isBilled: false, receiptUrl: data.receipt_url,
        createdAt: data.created_at,
      }, ...p]);
      setForm({ description: "", amount: "", category: "general", clientId: "", expenseDate: new Date().toISOString().split("T")[0], isBillable: true, receiptUrl: "" });
      setShowForm(false);
    }
    setSaving(false);
  };

   const deleteExpense = async (id) => {
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses(p => p.filter(e => e.id !== id));
    setSelected(p => p.filter(s => s !== id));
  };

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const billSelected = () => {
    const sel = expenses.filter(e => selected.includes(e.id) && e.isBillable && !e.isBilled);
    if (sel.length === 0) return;
  
    const lineItems = sel.map(e => ({
      id: genId(), description: `Expense: ${e.description}`, quantity: 1, unitPrice: e.amount,
    }));
    const clientId = sel[0].clientId || "";
    sessionStorage.setItem("invoicekit_prefill", JSON.stringify({ lineItems, clientId }));
       sel.forEach(e => {
      supabase.from("expenses").update({ is_billed: true }).eq("id", e.id);
    });
    setExpenses(p => p.map(e => selected.includes(e.id) ? { ...e, isBilled: true } : e));
    setSelected([]);
    nav("/invoices/new");
  };

  const filtered = filterCat === "all" ? expenses : expenses.filter(e => e.category === filterCat);
  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);
  const billableTotal = filtered.filter(e => e.isBillable && !e.isBilled).reduce((s, e) => s + e.amount, 0);
  const catColor = (cat) => CATEGORIES.find(c => c.value === cat)?.color || T.muted;

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: T.textTer }} /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Expenses</h1>
          <p style={{ color: T.textTer, fontSize: 13, marginTop: 4 }}>{expenses.length} total — {fmtC(totalExpenses, cur)} tracked</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selected.length > 0 && (
            <Btn variant="success" icon={FileText} onClick={billSelected}>
              Bill {selected.length} to Invoice
            </Btn>
          )}
          <Btn icon={Plus} onClick={() => setShowForm(true)}>Add Expense</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
        <Card p={18}>
          <div style={{ fontSize: 12, color: T.textTer, marginBottom: 4 }}>Total Expenses</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{fmtC(totalExpenses, cur)}</div>
        </Card>
        <Card p={18}>
          <div style={{ fontSize: 12, color: T.textTer, marginBottom: 4 }}>Unbilled Billable</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.accent }}>{fmtC(billableTotal, cur)}</div>
        </Card>
        <Card p={18}>
          <div style={{ fontSize: 12, color: T.textTer, marginBottom: 4 }}>Billed</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.success }}>{fmtC(filtered.filter(e => e.isBilled).reduce((s, e) => s + e.amount, 0), cur)}</div>
        </Card>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>New Expense</span>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={15} color={T.textTer} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Inp label="Description *" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What was this for?" />
            <Inp label="Amount *" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec }}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, cursor: "pointer", boxSizing: "border-box" }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec }}>Client (optional)</label>
              <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, cursor: "pointer", boxSizing: "border-box" }}>
                <option value="">No client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
              </select>
            </div>
            <Inp label="Date" type="date" value={form.expenseDate} onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec }}>Receipt</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="file" accept="image/*,.pdf" ref={fileRef} onChange={handleReceipt} style={{ display: "none" }} id="receipt-up" />
                <label htmlFor="receipt-up" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, fontSize: 12, fontWeight: 600, color: T.text, cursor: "pointer" }}>
                  <Paperclip size={12} /> {form.receiptUrl ? "Replace" : "Attach"}
                </label>
                {form.receiptUrl && <span style={{ fontSize: 11, color: T.success, fontWeight: 500 }}>Attached</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.text, cursor: "pointer" }}>
              <input type="checkbox" checked={form.isBillable} onChange={e => setForm(p => ({ ...p, isBillable: e.target.checked }))} style={{ width: 16, height: 16, accentColor: T.accent }} />
              <span style={{ fontWeight: 500 }}>Billable to client</span>
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn loading={saving} onClick={saveExpense}>Save Expense</Btn>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        <Btn variant={filterCat === "all" ? "primary" : "secondary"} size="sm" onClick={() => setFilterCat("all")}>All</Btn>
        {CATEGORIES.map(c => (
          <Btn key={c.value} variant={filterCat === c.value ? "primary" : "secondary"} size="sm" onClick={() => setFilterCat(c.value)}>{c.label}</Btn>
        ))}
      </div>

      <Card p={0}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.borderLight}` }}>
              <th style={{ padding: "10px 14px", width: 32 }}></th>
              {["Description", "Category", "Client", "Date", "Amount", "Status", ""].map((h, i) => (
                <th key={i} style={{ padding: "10px 14px", textAlign: i === 5 ? "right" : "left", fontSize: 10.5, fontWeight: 600, color: T.textTer, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(exp => {
              const cl = clients.find(c => c.id === exp.clientId);
              const isSelected = selected.includes(exp.id);
              return (
                <tr key={exp.id} style={{ borderBottom: `1px solid ${T.borderLight}`, background: isSelected ? T.accentBg : "transparent" }}>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    {exp.isBillable && !exp.isBilled && (
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(exp.id)} style={{ width: 15, height: 15, accentColor: T.accent, cursor: "pointer" }} />
                    )}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{exp.description}</div>
                    {exp.receiptUrl && <a href={exp.receiptUrl} target="_blank" rel="noopener" style={{ fontSize: 11, color: T.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><Paperclip size={10} /> Receipt</a>}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: catColor(exp.category), background: `${catColor(exp.category)}12`, padding: "3px 10px", borderRadius: 12 }}>
                      <Tag size={10} /> {exp.category}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12.5, color: T.textSec }}>{cl?.company || cl?.name || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12.5, color: T.textSec }}>{fmtD(exp.expenseDate)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: T.text, textAlign: "right" }}>{fmtC(exp.amount, cur)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {exp.isBilled ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.success, background: T.successBg, padding: "3px 10px", borderRadius: 12 }}>Billed</span>
                    ) : exp.isBillable ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.warning, background: T.warningBg, padding: "3px 10px", borderRadius: 12 }}>Billable</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, background: T.mutedBg, padding: "3px 10px", borderRadius: 12 }}>Non-billable</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <button onClick={() => deleteExpense(exp.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textTer, padding: 2 }}><Trash2 size={13} /></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: T.textTer, fontSize: 13 }}>
                No expenses yet. Click "Add Expense" to track one.
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}



  
function AuditTrailPage() {
  const T = useTheme();
  const { user } = useAuth();
  const { settings } = useData();
  const cur = settings?.currency || "CAD";
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    if (!user) return;
    supabase.from("audit_log")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) console.error("Audit log fetch error:", error);
        setLogs(data || []);
        setLoading(false);
      })
      .catch((err) => { console.error("Audit log error:", err); setLoading(false); });
  }, [user]);

  const actionConfig = {
    created: { color: T.success, bg: T.successBg, icon: Plus, label: "Created" },
    updated: { color: "#2563EB", bg: "rgba(37,99,235,0.08)", icon: Edit, label: "Updated" },
    status_changed: { color: "#D97706", bg: "rgba(217,119,6,0.08)", icon: ChevronRight, label: "Status changed" },
    deleted: { color: T.danger, bg: T.dangerBg, icon: Trash2, label: "Deleted" },
    auto_generated: { color: "#7C3AED", bg: "rgba(124,58,237,0.08)", icon: Clock, label: "Auto-generated" },
    late_fee_applied: { color: T.danger, bg: T.dangerBg, icon: AlertTriangle, label: "Late fee" },
  };

  const filtered = filterAction === "all" ? logs : logs.filter(l => l.action === filterAction);
  const actions = [...new Set(logs.map(l => l.action))];

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: T.textTer }} /></div>;

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Audit Trail</h1>
        <p style={{ color: T.textTer, fontSize: 13, marginTop: 4 }}>Complete log of every action — {logs.length} events recorded.</p>
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 18, flexWrap: "wrap" }}>
        <Btn variant={filterAction === "all" ? "primary" : "secondary"} size="sm" onClick={() => setFilterAction("all")}>All ({logs.length})</Btn>
        {actions.map(a => {
          const cfg = actionConfig[a] || { label: a, color: T.muted };
          const count = logs.filter(l => l.action === a).length;
          return <Btn key={a} variant={filterAction === a ? "primary" : "secondary"} size="sm" onClick={() => setFilterAction(a)}>{cfg.label} ({count})</Btn>;
        })}
      </div>

      <Card p={0}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textTer, fontSize: 13 }}>No audit events yet. Actions are logged automatically when invoices are created, updated, or deleted.</div>
        ) : (
          <div>
            {filtered.map((log, i) => {
              const cfg = actionConfig[log.action] || { color: T.muted, bg: T.mutedBg, icon: Hash, label: log.action };
              const Ic = cfg.icon;
              const details = (() => { try { return typeof log.details === "string" ? JSON.parse(log.details) : (log.details || {}); } catch (_e) { return {}; } })();
              const time = new Date(log.created_at);
              const timeStr = time.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) + " at " + time.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });

              return (
                <div key={log.id} style={{ display: "flex", gap: 14, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
              
                  <div style={{ flexShrink: 0, position: "relative" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Ic size={14} color={cfg.color} />
                    </div>
                    {i < filtered.length - 1 && (
                      <div style={{ position: "absolute", top: 36, left: 15, width: 2, height: "calc(100% - 4px)", background: T.borderLight }} />
                    )}
                  </div>
              
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{cfg.label}</span>
                        <span style={{ fontSize: 12.5, color: T.textSec, marginLeft: 8 }}>{log.entity_type}</span>
                      </div>
                      <span style={{ fontSize: 11, color: T.textTer, flexShrink: 0 }}>{timeStr}</span>
                    </div>
                 
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {details.invoice_number && (
                        <span style={{ fontSize: 11, background: T.bg, padding: "2px 8px", borderRadius: 6, color: T.textSec }}>{details.invoice_number}</span>
                      )}
                      {details.from && details.to && (
                        <span style={{ fontSize: 11, background: cfg.bg, padding: "2px 8px", borderRadius: 6, color: cfg.color, fontWeight: 500 }}>{details.from} → {details.to}</span>
                      )}
                      {details.client_name && (
                        <span style={{ fontSize: 11, background: T.bg, padding: "2px 8px", borderRadius: 6, color: T.textSec }}>{details.client_name}</span>
                      )}
                      {details.amount && (
                        <span style={{ fontSize: 11, background: T.bg, padding: "2px 8px", borderRadius: 6, color: T.textSec }}>{fmtC(details.amount, cur)}</span>
                      )}
                      {details.frequency && (
                        <span style={{ fontSize: 11, background: T.bg, padding: "2px 8px", borderRadius: 6, color: T.textSec }}>{details.frequency}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}


   
function SettingsPage() {
  const T = useTheme();
  const { settings, updateSettings } = useData();
  const [f, setF] = useState(settings || {});
  const [saved, setSaved] = useState(false);
  const [customHex, setCustomHex] = useState("");
  const fileRef = useRef(null);
  useEffect(() => { if (settings) { setF(settings); setCustomHex(settings.themeColor || "#C8553D"); } }, [settings]);
  const save = () => { updateSettings(f); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleLogo = (e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) return; if (!file.type.startsWith("image/")) return; const reader = new FileReader(); reader.onload = (ev) => setF(p => ({ ...p, logoUrl: ev.target.result })); reader.readAsDataURL(file); };
  const removeLogo = () => setF(p => ({ ...p, logoUrl: "" }));
  const setTheme = (hex) => setF(p => ({ ...p, themeColor: hex }));
  if (!settings) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: T.textTer }} /></div>;
  const logoSz = f.logoSize || 48;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div><h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Settings</h1><p style={{ color: T.textTer, fontSize: 13, marginTop: 4 }}>Branding, invoicing defaults & database.</p></div>
        <Btn icon={saved ? CheckCircle : Save} variant={saved ? "success" : "primary"} onClick={save}>{saved ? "Saved!" : "Save Changes"}</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}><Palette size={15} color={T.accent} /><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Theme Color</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {THEME_PRESETS.map(p => (
                <button key={p.hex} onClick={() => { setTheme(p.hex); setCustomHex(p.hex); }} title={p.name}
                  style={{ width: 38, height: 38, borderRadius: 10, background: p.hex, border: f.themeColor === p.hex ? `3px solid ${T.text}` : "3px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", outline: f.themeColor === p.hex ? `2px solid ${T.surface}` : "none", outlineOffset: -5 }}>
                  {f.themeColor === p.hex && <Check size={16} color="#fff" strokeWidth={3} />}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Paintbrush size={14} color={T.textTer} />
              <span style={{ fontSize: 12, color: T.textSec }}>Custom:</span>
              <input type="color" value={customHex} onChange={e => { setCustomHex(e.target.value); setTheme(e.target.value); }} style={{ width: 32, height: 28, border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer", padding: 0 }} />
              <input value={customHex} onChange={e => { setCustomHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setTheme(e.target.value); }} style={{ width: 80, padding: "5px 8px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.fontMono, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: f.themeColor || T.accent, display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={16} color="#fff" /><span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Preview — buttons, links, and accents use this color</span>
            </div>
          </Card>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}><Image size={15} color={T.accent} /><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Company Logo</span></div>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ width: 110, height: 110, borderRadius: 10, border: `2px dashed ${f.logoUrl ? T.border : T.accent}`, background: f.logoUrl ? T.surface : T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                {f.logoUrl ? (<><img src={f.logoUrl} alt="Logo" style={{ width: logoSz * 2, height: logoSz * 2, objectFit: "contain" }} /><button onClick={removeLogo} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={11} color="#fff" /></button></>) : (<div style={{ textAlign: "center" }}><Upload size={20} color={T.accent} style={{ marginBottom: 4 }} /><div style={{ fontSize: 10, color: T.textSec }}>No logo</div></div>)}
              </div>
              <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={handleLogo} ref={fileRef} style={{ display: "none" }} id="logo-up" />
                <label htmlFor="logo-up" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, fontSize: 12, fontWeight: 600, color: T.text, cursor: "pointer", marginBottom: 10 }}><Upload size={12} /> {f.logoUrl ? "Replace" : "Upload"}</label>
                <div style={{ fontSize: 10.5, color: T.textTer, marginBottom: 12 }}>PNG, JPG, SVG. Max 2 MB.</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><label style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>Size on invoice</label><span style={{ fontSize: 11, fontWeight: 600, color: T.accent }}>{logoSz}px</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><ZoomOut size={12} color={T.textTer} /><input type="range" min={24} max={96} step={4} value={logoSz} onChange={e => setF(p => ({ ...p, logoSize: parseInt(e.target.value) }))} style={{ flex: 1, accentColor: T.accent }} /><ZoomIn size={12} color={T.textTer} /></div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}><Building2 size={15} color={T.accent} /><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Business Information</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}><Inp label="Business Name" value={f.businessName || ""} onChange={e => setF(p => ({ ...p, businessName: e.target.value }))} /><Inp label="Email" value={f.email || ""} onChange={e => setF(p => ({ ...p, email: e.target.value }))} /><Inp label="Phone" value={f.phone || ""} onChange={e => setF(p => ({ ...p, phone: e.target.value }))} /><Inp label="Country" value={f.country || ""} onChange={e => setF(p => ({ ...p, country: e.target.value }))} /></div>
            <div style={{ marginBottom: 10 }}><Inp label="Street Address" value={f.address || ""} onChange={e => setF(p => ({ ...p, address: e.target.value }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}><Inp label="City" value={f.city || ""} onChange={e => setF(p => ({ ...p, city: e.target.value }))} /><Inp label="Province" value={f.state || ""} onChange={e => setF(p => ({ ...p, state: e.target.value }))} /><Inp label="Postal Code" value={f.zip || ""} onChange={e => setF(p => ({ ...p, zip: e.target.value }))} /></div>
          </Card>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}><Percent size={15} color={T.accent} /><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Tax & Currency</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <Inp label="Default Tax (%)" type="number" step="0.1" min="0" value={f.taxRate || 0} onChange={e => setF(p => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec }}>Currency</label><select value={f.currency || "CAD"} onChange={e => setF(p => ({ ...p, currency: e.target.value }))} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, cursor: "pointer", boxSizing: "border-box" }}>{["CAD", "USD", "EUR", "GBP", "AUD", "JPY", "CHF", "NGN"].map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 7, background: T.accentBg, fontSize: 11.5, color: T.accent, lineHeight: 1.5 }}>Default tax applied to new invoices. Override per invoice in the form.</div>
          </Card>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><FileText size={15} color={T.accent} /><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Default Notes</span></div>
            <textarea value={f.defaultNotes || ""} onChange={e => setF(p => ({ ...p, defaultNotes: e.target.value }))} rows={3} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </Card>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}><CreditCard size={15} color={T.accent} /><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Payment Details</span></div>
            {[["bankName", "Bank"], ["accountNumber", "Account"], ["routingNumber", "Routing"]].map(([k, l]) => <div key={k} style={{ marginBottom: 10 }}><Inp label={l} value={f[k] || ""} onChange={e => setF(p => ({ ...p, [k]: e.target.value }))} /></div>)}
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}><AlertTriangle size={15} color={T.accent} /><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Late Fee Policy</span></div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer" }}>
              <div onClick={() => setF(p => ({ ...p, lateFeeEnabled: !p.lateFeeEnabled }))} style={{
                width: 40, height: 22, borderRadius: 11, padding: 2, cursor: "pointer",
                background: f.lateFeeEnabled ? T.accent : T.border, transition: "background .2s",
                display: "flex", alignItems: "center",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  transform: f.lateFeeEnabled ? "translateX(18px)" : "translateX(0)",
                  transition: "transform .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>Enable automatic late fees</span>
            </label>
            {f.lateFeeEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 18px", borderRadius: 9, background: T.bg, border: `1px solid ${T.borderLight}` }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec, display: "block", marginBottom: 5 }}>Fee Type</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[{ v: "percentage", l: "% of subtotal" }, { v: "flat", l: "Flat amount" }].map(opt => (
                      <button key={opt.v} onClick={() => setF(p => ({ ...p, lateFeeType: opt.v }))} style={{
                        flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, fontFamily: T.font, cursor: "pointer",
                        border: f.lateFeeType === opt.v ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                        background: f.lateFeeType === opt.v ? T.accentBg : T.surface,
                        color: f.lateFeeType === opt.v ? T.accent : T.textSec,
                      }}>{opt.l}</button>
                    ))}
                  </div>
                </div>
                <Inp label={f.lateFeeType === "percentage" ? "Late Fee Percentage (%)" : "Late Fee Amount"} type="number" min="0" step="0.5" value={f.lateFeeValue || 5} onChange={e => setF(p => ({ ...p, lateFeeValue: parseFloat(e.target.value) || 0 }))} />
                <Inp label="Grace Period (days after due date)" type="number" min="0" value={f.lateFeeGraceDays || 7} onChange={e => setF(p => ({ ...p, lateFeeGraceDays: parseInt(e.target.value) || 0 }))} />
                <div style={{ fontSize: 11.5, color: T.textSec, lineHeight: 1.6, padding: "8px 0" }}>
                  {f.lateFeeType === "percentage"
                    ? `A ${f.lateFeeValue || 5}% late fee will be applied to the invoice subtotal after ${f.lateFeeGraceDays || 7} days past the due date.`
                    : `A flat ${fmtC(f.lateFeeValue || 5, settings?.currency)} late fee will be applied after ${f.lateFeeGraceDays || 7} days past the due date.`
                  }
                </div>
              </div>
            )}
          </Card>
   
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}><Clock size={15} color={T.accent} /><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Automatic Reminders</span></div>
            <Inp label="Send reminder X days before due date" type="number" min="0" max="30" value={f.reminderBeforeDays ?? 3} onChange={e => setF(p => ({ ...p, reminderBeforeDays: parseInt(e.target.value) || 0 }))} />
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: T.textSec, display: "block", marginBottom: 6 }}>Send overdue reminders after (days)</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 3, 7, 14, 30].map(d => {
                  const active = (f.reminderAfterDays || [1, 7, 14]).includes(d);
                  return (
                    <button key={d} onClick={() => {
                      const curr = f.reminderAfterDays || [1, 7, 14];
                      setF(p => ({ ...p, reminderAfterDays: active ? curr.filter(x => x !== d) : [...curr, d].sort((a, b) => a - b) }));
                    }} style={{
                      padding: "6px 14px", borderRadius: 7, fontSize: 12.5, fontWeight: 600, fontFamily: T.font, cursor: "pointer",
                      border: active ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                      background: active ? T.accentBg : T.surface,
                      color: active ? T.accent : T.textSec,
                    }}>{d}d</button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 7, background: T.accentBg, fontSize: 11.5, color: T.accent, lineHeight: 1.5 }}>
              Reminders are auto-scheduled when you send an invoice (Save & Send). Drafts don't trigger reminders.
            </div>
          </Card>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><Database size={15} color={T.accent} /><span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>Supabase Status</span></div>
            <div style={{ padding: "8px 12px", borderRadius: 7, background: T.successBg, fontSize: 12, color: T.success, fontWeight: 500 }}>
              Connected - data persists to Supabase
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

  
function AppShell() {
  const { ready, settings } = useData();
  const { match } = useRouter();
  const theme = useMemo(() => makeTheme(settings?.themeColor || "#C8553D"), [settings?.themeColor]);
  if (!ready) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F6F3", fontFamily: "system-ui" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "#9C9890" }} /></div>;
  const pages = { dash: DashPage, invList: InvListPage, invForm: InvFormPage, invDetail: InvDetailPage, clients: ClientsPage, recurring: RecurringSimPage, expenses: ExpensesPage, audit: AuditTrailPage, settings: SettingsPage };
  const Page = pages[match.page] || DashPage;
  return (
    <ThemeCtx.Provider value={theme}>
      <style>{`::selection{background:${theme.accent}22}input:focus,select:focus,textarea:focus{border-color:${theme.accent}!important;outline:none}`}</style>
      <div style={{ display: "flex", minHeight: "100vh", fontFamily: theme.font, background: theme.bg }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "24px 32px", overflowY: "auto", maxHeight: "100vh", minWidth: 0 }}><Page /></main>
      </div>
    </ThemeCtx.Provider>
  );
}

export default function App() {
  return (
    <>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}*{margin:0;padding:0;box-sizing:border-box}body{background:#F7F6F3}button{font-family:system-ui}button:active{transform:scale(.98)}@media print{[data-no-print]{display:none!important}main{padding:0!important;max-height:none!important;overflow:visible!important}body,html{background:#fff!important}div[style*="minHeight: \\"100vh\\""],div[style*="min-height"]{background:#fff!important}main>div>div[style*="max-width"]{max-width:100%!important;border:none!important;box-shadow:none!important;border-radius:0!important;padding:32px 24px!important}main>div>div[style*="height: 80"]{height:60px!important}@page{margin:0.4in}}`}</style>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F6F3" }}><Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: "#9C9890" }} /></div>;
  if (!user) return <ThemeCtx.Provider value={makeTheme()}><AuthScreen /></ThemeCtx.Provider>;
  return <RouterProvider><DataProvider><AppShell /></DataProvider></RouterProvider>;
}