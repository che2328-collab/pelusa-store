import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection, onSnapshot, doc, setDoc, addDoc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "firebase/auth";

// ═══════════════════════════════════════════════════════════════
//  DATOS INICIALES
// ═══════════════════════════════════════════════════════════════
const ADMIN_CREDENTIALS = { email: "admin@pelusastore.com", password: "pelusa123" };
const LOGO_URL = "/logo.jpeg";
const STORE_NAME = "Pelusa Store";

const CATEGORIES = ["Todo", "Perfumes", "Ropa", "Calzado", "Belleza", "Consumibles", "Hogar", "Otros"];

const initProducts = [
  { id: 1, name: "Perfume Elegance 100ml", category: "Perfumes", priceContado: 320, priceCredito: 420, stock: 20, image: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=400&fit=crop", description: "Fragancia floral con notas de jazmín y vainilla.", active: true, offer: true },
  { id: 2, name: "Tenis Sport Air", category: "Calzado", priceContado: 650, priceCredito: 820, stock: 12, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", description: "Comodidad y estilo para el día a día.", active: true, offer: false },
  { id: 3, name: "Blusa Casual Flores", category: "Ropa", priceContado: 280, priceCredito: 360, stock: 15, image: "https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=400&h=400&fit=crop", description: "Tela suave, colores vivos, tallas S-XL.", active: true, offer: false },
  { id: 4, name: "Crema Hidratante Premium", category: "Belleza", priceContado: 180, priceCredito: 240, stock: 30, image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop", description: "Hidratación profunda para todo tipo de piel.", active: true, offer: true },
  { id: 5, name: "Café Premium 250g", category: "Consumibles", priceContado: 120, priceCredito: 155, stock: 50, image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop", description: "Café de origen 100% mexicano.", active: true, offer: false },
];

const initUsers = [
  { id: "u1", name: "María López", email: "maria@mail.com", password: "123456", phone: "9981234567", address: "Calle 10 #25, Col. Centro", joinDate: "2026-04-01", role: "user" },
  { id: "u2", name: "Carlos Pérez", email: "carlos@mail.com", password: "123456", phone: "9987654321", address: "Av. Insurgentes #88", joinDate: "2026-04-15", role: "user" },
];

const initOrders = [
  {
    id: "ORD-001", userId: "u1", customerName: "María López",
    items: [{ productId: 1, name: "Perfume Elegance 100ml", qty: 1, price: 420, type: "credito" }],
    total: 420, type: "credito", status: "activo", date: "2026-05-01",
    abonos: [{ date: "2026-05-08", amount: 100, note: "Pago semana 1" }],
    saldoPendiente: 320, semanasTotal: 5, semanaActual: 1,
  },
  {
    id: "ORD-002", userId: "u2", customerName: "Carlos Pérez",
    items: [{ productId: 4, name: "Crema Hidratante Premium", qty: 2, price: 240, type: "contado" }],
    total: 480, type: "contado", status: "pagado", date: "2026-05-10",
    abonos: [{ date: "2026-05-10", amount: 480, note: "Pago completo contado" }],
    saldoPendiente: 0, semanasTotal: 1, semanaActual: 1,
  },
];

// ═══════════════════════════════════════════════════════════════
//  TEMA — Pelusa Store: negro elegante + dorado
// ═══════════════════════════════════════════════════════════════
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E2C06A";
const GOLD_DIM = "rgba(201,168,76,0.13)";
const WA_NUMBER = "5219981234567"; // ← CAMBIA POR TU NÚMERO
const buildWALink = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

const C = {
  bg: "#070707",
  surface: "#111111",
  border: "#2a2410",
  accent: GOLD,
  accentDim: GOLD_DIM,
  accentHover: GOLD_LIGHT,
  green: "#4ade80",
  greenDim: "rgba(74,222,128,0.12)",
  blue: "#93c5fd",
  blueDim: "rgba(147,197,253,0.12)",
  red: "#f87171",
  redDim: "rgba(248,113,113,0.12)",
  yellow: GOLD_LIGHT,
  yellowDim: GOLD_DIM,
  text: "#f5f0e8",
  muted: "#7a7060",
  subtle: "#1e1c14",
};

const G = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:${C.surface};}
::-webkit-scrollbar-thumb{background:#2a2410;border-radius:4px;}
input,textarea,select{
  background:#0a0a0a !important;color:${C.text} !important;
  border:1px solid ${C.border} !important;border-radius:8px !important;
  padding:10px 14px !important;font-family:'DM Sans',sans-serif !important;
  font-size:14px !important;width:100%;outline:none;transition:border-color .2s;
}
input:focus,textarea:focus,select:focus{border-color:${GOLD} !important;}
button{cursor:pointer;font-family:'DM Sans',sans-serif;}
a{color:inherit;text-decoration:none;}
`;

// ═══════════════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════════════
const uid = () => "u" + Date.now();
const ordId = () => "ORD-" + String(Date.now()).slice(-5);
const fmt = n => "$" + Number(n).toLocaleString("es-MX");
const today = () => new Date().toISOString().slice(0, 10);
const weekAbono = (total, weeks) => Math.ceil(total / weeks);

// ═══════════════════════════════════════════════════════════════
//  COMPONENTES BASE
// ═══════════════════════════════════════════════════════════════
const Chip = ({ children, color = C.accent, small }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 999, padding: small ? "2px 8px" : "3px 12px",
    fontSize: small ? 10 : 12, fontWeight: 700, whiteSpace: "nowrap",
    letterSpacing: "0.04em",
  }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, full, style: sx = {} }) => {
  const map = {
    primary: { bg: C.accent, color: "#fff", border: "none" },
    ghost: { bg: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    danger: { bg: C.redDim, color: C.red, border: `1px solid ${C.red}44` },
    success: { bg: C.greenDim, color: C.green, border: `1px solid ${C.green}44` },
    blue: { bg: C.blueDim, color: C.blue, border: `1px solid ${C.blue}44` },
  };
  const v = map[variant];
  return (
    <button disabled={disabled} onClick={onClick} style={{
      background: v.bg, color: v.color, border: v.border,
      borderRadius: 9, padding: size === "sm" ? "6px 14px" : size === "lg" ? "14px 28px" : "9px 20px",
      fontSize: size === "sm" ? 12 : 14, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 6,
      width: full ? "100%" : "auto", justifyContent: full ? "center" : "flex-start",
      opacity: disabled ? 0.5 : 1, transition: "opacity .2s, transform .15s",
      ...sx,
    }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = "0.82")}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = "1")}
    >{children}</button>
  );
};

const Card = ({ children, style: sx = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 14, padding: 20, ...sx,
    cursor: onClick ? "pointer" : "default",
    transition: onClick ? "border-color .2s, transform .2s" : "none",
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = C.accent)}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = C.border)}
  >{children}</div>
);

const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 18, padding: 28, width: "100%",
        maxWidth: wide ? 780 : 460, maxHeight: "92vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontFamily: "Cinzel", fontSize: 20, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

const Divider = () => <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0" }} />;

const StatCard = ({ label, value, color = C.accent, sub, icon }) => (
  <Card>
    <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
    <div style={{ fontFamily: "JetBrains Mono", fontSize: 26, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
  </Card>
);

// Progress bar for credit
const CreditBar = ({ paid, total }) => {
  const pct = Math.min(100, Math.round((paid / total) * 100));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 4 }}>
        <span>Pagado: {fmt(paid)}</span><span>{pct}%</span>
      </div>
      <div style={{ background: C.border, borderRadius: 999, height: 7 }}>
        <div style={{ background: pct >= 100 ? C.green : C.accent, width: pct + "%", height: "100%", borderRadius: 999, transition: "width .5s" }} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  AUTH — Login / Registro
// ═══════════════════════════════════════════════════════════════
const AuthScreen = ({ onLogin, onRegister, users, setUsers }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    setErr(""); setLoading(true);
    try {
      await onLogin(form.email, form.password);
    } catch (e) {
      setErr("Correo o contraseña incorrectos.");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setErr(""); setLoading(true);
    if (!form.name || !form.email || !form.password || !form.phone) {
      setErr("Completa todos los campos."); setLoading(false); return;
    }
    try {
      await onRegister(form);
    } catch (e) {
      setErr(e.code === "auth/email-already-in-use" ? "Este correo ya está registrado." : "Error al registrar. Intenta de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse at 60% 20%, ${C.accent}18 0%, transparent 60%), ${C.bg}`,
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 110, height: 110, background: "#000",
            border: `2px solid ${GOLD}55`, borderRadius: 24, overflow: "hidden", marginBottom: 14,
          }}>
            <img src={LOGO_URL} alt="Pelusa Store" style={{ width: "90%", height: "90%", objectFit: "contain" }} />
          </div>
          <h1 style={{ fontFamily: "Cinzel", fontSize: 26, fontWeight: 800,
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT}, ${GOLD})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PELUSA STORE
          </h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4, letterSpacing: "0.12em" }}>TIENDA EXCLUSIVA PARA MIEMBROS</p>
        </div>

        <Card style={{ padding: 28 }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: C.bg, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {[["login", "Iniciar sesión"], ["register", "Registrarme"]].map(([m, l]) => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{
                flex: 1, background: mode === m ? C.accent : "transparent",
                border: "none", color: mode === m ? "#fff" : C.muted,
                borderRadius: 7, padding: "8px", fontSize: 13, fontWeight: 600,
              }}>{l}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <>
                <Field label="Nombre completo"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Tu nombre" /></Field>
                <Field label="Teléfono / WhatsApp"><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="9981234567" /></Field>
                <Field label="Dirección de entrega"><input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Calle, colonia, número" /></Field>
              </>
            )}
            <Field label="Correo electrónico"><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="tu@correo.com" /></Field>
            <Field label="Contraseña"><input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" /></Field>

            {err && <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red }}>{err}</div>}

            <Btn full size="lg" onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "⏳ Cargando..." : mode === "login" ? "🔑 Entrar" : "✨ Crear mi cuenta"}
            </Btn>
          </div>

          {mode === "login" && (
            <div style={{ marginTop: 18, padding: 14, background: C.accentDim, borderRadius: 10, fontSize: 12, color: C.muted }}>
              <strong style={{ color: C.accent }}>Admin:</strong> admin@pelusastore.com / pelusa123<br />
              <strong style={{ color: C.accent }}>Cliente demo:</strong> Regístrate con tu correo
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  CATÁLOGO (vista cliente)
// ═══════════════════════════════════════════════════════════════
const Catalog = ({ products, onAddToCart, cart }) => {
  const [cat, setCat] = useState("Todo");
  const [search, setSearch] = useState("");
  const [priceMode, setPriceMode] = useState("contado");
  const [detail, setDetail] = useState(null);

  const visible = products.filter(p => p.active &&
    (cat === "Todo" || p.category === cat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const cartCount = (id) => cart.find(i => i.productId === id)?.qty || 0;

  return (
    <div>
      {/* Header catálogo */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar producto..." style={{ maxWidth: 240 }} />
        <div style={{ display: "flex", background: C.bg, borderRadius: 9, padding: 3, gap: 0 }}>
          {["contado", "credito"].map(m => (
            <button key={m} onClick={() => setPriceMode(m)} style={{
              background: priceMode === m ? C.accent : "transparent",
              border: "none", color: priceMode === m ? "#fff" : C.muted,
              borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, textTransform: "capitalize",
            }}>{m === "contado" ? "💵 Contado" : "📅 Crédito"}</button>
          ))}
        </div>
      </div>

      {/* Categorías */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            background: cat === c ? C.accent : C.surface,
            border: `1px solid ${cat === c ? C.accent : C.border}`,
            color: cat === c ? "#fff" : C.muted,
            borderRadius: 999, padding: "5px 16px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
          }}>{c}</button>
        ))}
      </div>

      {/* Grid productos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {visible.map(p => {
          const price = priceMode === "contado" ? p.priceContado : p.priceCredito;
          const inCart = cartCount(p.id);
          return (
            <Card key={p.id} style={{ padding: 0, overflow: "hidden", position: "relative" }}>
              {p.offer && (
                <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1,
                  background: C.red, color: "#fff", borderRadius: 999, padding: "2px 10px",
                  fontSize: 10, fontWeight: 800 }}>🔥 OFERTA</div>
              )}
              {inCart > 0 && (
                <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1,
                  background: C.accent, color: "#fff", borderRadius: 999,
                  width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800 }}>{inCart}</div>
              )}
              <img src={p.image} alt={p.name}
                style={{ width: "100%", height: 180, objectFit: "cover", cursor: "pointer" }}
                onClick={() => setDetail({ ...p, priceMode })} />
              <div style={{ padding: "14px 16px 16px" }}>
                <Chip color={C.blue} small>{p.category}</Chip>
                <div style={{ fontFamily: "Cinzel", fontSize: 15, fontWeight: 700,
                  margin: "8px 0 4px", lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700,
                  color: C.accent, marginBottom: 4 }}>{fmt(price)}</div>
                {priceMode === "credito" && (
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
                    ≈ {fmt(weekAbono(p.priceCredito, 5))}/sem · 5 semanas
                  </div>
                )}
                <div style={{ fontSize: 11, color: p.stock > 0 ? C.green : C.red, marginBottom: 12 }}>
                  {p.stock > 0 ? `✓ ${p.stock} disponibles` : "✗ Agotado"}
                </div>
                <Btn full disabled={p.stock === 0}
                  onClick={() => onAddToCart(p, priceMode)}>
                  {p.stock === 0 ? "Sin stock" : inCart > 0 ? "➕ Agregar otro" : "🛒 Agregar"}
                </Btn>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal detalle */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} wide>
        {detail && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <img src={detail.image} alt={detail.name} style={{ width: "100%", borderRadius: 12, objectFit: "cover", height: 280 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Chip color={C.blue}>{detail.category}</Chip>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{detail.description}</p>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>PRECIO CONTADO</div>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 24, fontWeight: 700, color: C.green }}>{fmt(detail.priceContado)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>PRECIO A CRÉDITO (5 sem.)</div>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 24, fontWeight: 700, color: C.accent }}>{fmt(detail.priceCredito)}</div>
                <div style={{ fontSize: 12, color: C.muted }}>≈ {fmt(weekAbono(detail.priceCredito, 5))} por semana</div>
              </div>
              <Btn full onClick={() => { onAddToCart(detail, detail.priceMode || "contado"); setDetail(null); }}>
                🛒 Agregar al carrito
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  CARRITO + CHECKOUT
// ═══════════════════════════════════════════════════════════════
const Cart = ({ cart, setCart, user, orders, setOrders, onClose }) => {
  const [step, setStep] = useState("cart"); // cart | confirm
  const [payType, setPayType] = useState("contado");
  const [weeks, setWeeks] = useState(5);
  const [note, setNote] = useState("");

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const abonoSem = payType === "credito" ? weekAbono(total, weeks) : total;

  const updateQty = (id, delta) => {
    setCart(c => c.map(i => i.productId === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };
  const remove = (id) => setCart(c => c.filter(i => i.productId !== id));

  const confirm = () => {
    const order = {
      id: ordId(), userId: user.id, customerName: user.name,
      items: cart.map(i => ({ ...i, type: payType })),
      total, type: payType, status: payType === "contado" ? "pagado" : "activo",
      date: today(),
      abonos: payType === "contado" ? [{ date: today(), amount: total, note: "Pago contado" }] : [],
      saldoPendiente: payType === "contado" ? 0 : total,
      semanasTotal: payType === "contado" ? 1 : weeks,
      semanaActual: payType === "contado" ? 1 : 0,
      note,
    };
    setOrders(o => [order, ...o]);
    setCart([]);
    setStep("done");
  };

  if (step === "done") return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <h3 style={{ fontFamily: "Cinzel", fontSize: 20, marginBottom: 8, color: GOLD }}>¡Pedido registrado!</h3>
      <p style={{ color: C.muted, marginBottom: 24 }}>
        {payType === "contado"
          ? "Tu pedido está marcado como pagado."
          : `Abono semanal de ${fmt(abonoSem)} por ${weeks} semanas.`}
      </p>
      {/* Botón WA: avisar al admin del pedido */}
      {(() => {
        const itemsText = cart.length > 0
          ? cart.map(i => `• ${i.name} x${i.qty} — $${(i.price * i.qty).toLocaleString()}`).join("\n")
          : "Ver detalle en la app";
        const msg = payType === "contado"
          ? `¡Hola Pelusa Store! 🛍️\n\nAcabo de realizar un pedido:\n\n${itemsText}\n\n💵 *Total contado: $${total.toLocaleString()} MXN*\n\n¿Me confirman el pedido? Gracias 🙏`
          : `¡Hola Pelusa Store! 🛍️\n\nAcabo de realizar un pedido a crédito:\n\n${itemsText}\n\n📅 *Total: $${total.toLocaleString()} MXN*\n💰 Abono semanal: $${abonoSem.toLocaleString()} MXN x ${weeks} semanas\n\n¿Me confirman? Gracias 🙏`;
        return (
          <a href={buildWALink(msg)} target="_blank" rel="noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#25D366", color: "#fff", borderRadius: 10,
            padding: "12px 24px", fontSize: 14, fontWeight: 700, textDecoration: "none",
            marginBottom: 16,
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Confirmar por WhatsApp
          </a>
        );
      })()}
      <br />
      <Btn variant="ghost" onClick={onClose}>Ver mis pedidos →</Btn>
    </div>
  );

  if (step === "confirm") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: C.accentDim, borderRadius: 10, padding: 16 }}>
        {cart.map(i => (
          <div key={i.productId} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
            <span style={{ fontSize: 14 }}>{i.name} × {i.qty}</span>
            <span style={{ fontFamily: "JetBrains Mono", color: C.accent }}>{fmt(i.price * i.qty)}</span>
          </div>
        ))}
        <Divider />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Total</span><span style={{ fontFamily: "JetBrains Mono", color: C.accent }}>{fmt(total)}</span>
        </div>
      </div>

      <Field label="Forma de pago">
        <div style={{ display: "flex", gap: 8 }}>
          {[["contado", "💵 Contado"], ["credito", "📅 Crédito semanal"]].map(([v, l]) => (
            <button key={v} onClick={() => setPayType(v)} style={{
              flex: 1, background: payType === v ? C.accent : C.surface,
              border: `1px solid ${payType === v ? C.accent : C.border}`,
              color: payType === v ? "#fff" : C.muted,
              borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600,
            }}>{l}</button>
          ))}
        </div>
      </Field>

      {payType === "credito" && (
        <Field label={`Semanas para pagar (abono: ${fmt(weekAbono(total, weeks))}/sem)`}>
          <div style={{ display: "flex", gap: 8 }}>
            {[3, 4, 5, 6, 8].map(w => (
              <button key={w} onClick={() => setWeeks(w)} style={{
                flex: 1, background: weeks === w ? C.accent : C.surface,
                border: `1px solid ${weeks === w ? C.accent : C.border}`,
                color: weeks === w ? "#fff" : C.muted,
                borderRadius: 8, padding: "8px", fontSize: 13, fontWeight: 700,
              }}>{w}</button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Nota (opcional)">
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Indicaciones de entrega..." />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="ghost" onClick={() => setStep("cart")}>← Atrás</Btn>
        <Btn full onClick={confirm}>✅ Confirmar pedido</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {cart.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px 0", color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          Tu carrito está vacío
        </div>
      )}
      {cart.map(i => (
        <div key={i.productId} style={{ display: "flex", alignItems: "center", gap: 12,
          padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
          <img src={i.image} alt={i.name} style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{i.name}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{i.type === "credito" ? "Crédito" : "Contado"}</div>
            <div style={{ fontFamily: "JetBrains Mono", color: C.accent, fontSize: 14 }}>{fmt(i.price)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => updateQty(i.productId, -1)} style={{ background: C.border, border: "none", color: C.text, borderRadius: 6, width: 26, height: 26, fontWeight: 700 }}>−</button>
            <span style={{ fontFamily: "JetBrains Mono", minWidth: 20, textAlign: "center" }}>{i.qty}</span>
            <button onClick={() => updateQty(i.productId, 1)} style={{ background: C.border, border: "none", color: C.text, borderRadius: 6, width: 26, height: 26, fontWeight: 700 }}>+</button>
          </div>
          <button onClick={() => remove(i.productId)} style={{ background: "none", border: "none", color: C.red, fontSize: 18 }}>✕</button>
        </div>
      ))}
      {cart.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontWeight: 700, fontSize: 16 }}>
            <span>Total</span>
            <span style={{ fontFamily: "JetBrains Mono", color: C.accent }}>{fmt(total)}</span>
          </div>
          <Btn full size="lg" onClick={() => setStep("confirm")}>Continuar →</Btn>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  MIS PEDIDOS (vista cliente)
// ═══════════════════════════════════════════════════════════════
const MyOrders = ({ orders, userId }) => {
  const myOrders = orders.filter(o => o.userId === userId);
  const [sel, setSel] = useState(null);

  const statusColor = { activo: C.accent, pagado: C.green, cancelado: C.red };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {myOrders.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
          Aún no tienes pedidos
        </div>
      )}
      {myOrders.map(o => (
        <Card key={o.id} onClick={() => setSel(o)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 13, color: C.muted }}>{o.id}</div>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>{o.date}</div>
            </div>
            <Chip color={statusColor[o.status] || C.muted}>
              {o.status === "activo" ? "⏳ En crédito" : o.status === "pagado" ? "✅ Pagado" : "❌ Cancelado"}
            </Chip>
          </div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, color: C.accent, marginBottom: 8 }}>
            {fmt(o.total)}
          </div>
          {o.type === "credito" && (
            <CreditBar paid={o.total - o.saldoPendiente} total={o.total} />
          )}
          {o.type === "credito" && o.saldoPendiente > 0 && (
            <div style={{ marginTop: 10, fontSize: 13, color: C.muted }}>
              Pendiente: <strong style={{ color: C.red }}>{fmt(o.saldoPendiente)}</strong>
              {" · "}Abono sem: <strong style={{ color: C.accent }}>{fmt(weekAbono(o.total, o.semanasTotal))}</strong>
            </div>
          )}
        </Card>
      ))}

      <Modal open={!!sel} onClose={() => setSel(null)} title={`Pedido ${sel?.id}`} wide>
        {sel && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Chip color={statusColor[sel.status]}>{sel.status}</Chip>
              <Chip color={sel.type === "credito" ? C.accent : C.green}>
                {sel.type === "credito" ? "Crédito semanal" : "Contado"}
              </Chip>
            </div>
            {sel.items.map((i, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between",
                padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <span>{i.name} × {i.qty}</span>
                <span style={{ fontFamily: "JetBrains Mono", color: C.accent }}>{fmt(i.price * i.qty)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
              <span>Total</span>
              <span style={{ fontFamily: "JetBrains Mono", color: C.accent }}>{fmt(sel.total)}</span>
            </div>
            {sel.type === "credito" && (
              <>
                <CreditBar paid={sel.total - sel.saldoPendiente} total={sel.total} />
                <div style={{ fontSize: 13, color: C.muted }}>
                  Saldo pendiente: <strong style={{ color: C.red }}>{fmt(sel.saldoPendiente)}</strong>
                  {" · "}Abono semanal: <strong style={{ color: C.accent }}>{fmt(weekAbono(sel.total, sel.semanasTotal))}</strong>
                </div>
              </>
            )}
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Historial de pagos</div>
              {sel.abonos.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0",
                  borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{a.date} — {a.note}</span>
                  <span style={{ fontFamily: "JetBrains Mono", color: C.green }}>+{fmt(a.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN: PRODUCTOS
// ═══════════════════════════════════════════════════════════════
const AdminProducts = ({ products, setProducts }) => {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => {
    setForm({ name: "", category: "Perfumes", priceContado: "", priceCredito: "", stock: "", image: "", description: "", active: true, offer: false });
    setModal("new");
  };
  const openEdit = (p) => { setForm({ ...p }); setModal("edit"); };

  const save = () => {
    const p = { ...form, priceContado: +form.priceContado, priceCredito: +form.priceCredito, stock: +form.stock };
    if (modal === "new") setProducts(ps => [...ps, { ...p, id: Date.now() }]);
    else setProducts(ps => ps.map(x => x.id === p.id ? p : x));
    setModal(null);
  };

  const del = (id) => { if (confirm("¿Eliminar?")) setProducts(ps => ps.filter(p => p.id !== id)); };
  const toggle = (id) => setProducts(ps => ps.map(p => p.id === id ? { ...p, active: !p.active } : p));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <Btn onClick={openNew}>＋ Nuevo producto</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {products.map(p => (
          <Card key={p.id} style={{ opacity: p.active ? 1 : 0.5, padding: 0, overflow: "hidden" }}>
            <div style={{ position: "relative" }}>
              <img src={p.image || "https://via.placeholder.com/400"} alt={p.name}
                style={{ width: "100%", height: 150, objectFit: "cover" }} />
              {p.offer && <div style={{ position: "absolute", top: 8, left: 8, background: C.red, color: "#fff",
                borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>OFERTA</div>}
            </div>
            <div style={{ padding: "14px 16px" }}>
              <Chip color={C.blue} small>{p.category}</Chip>
              <div style={{ fontFamily: "Cinzel", fontSize: 15, fontWeight: 700, margin: "8px 0 6px" }}>{p.name}</div>
              <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                <div><div style={{ fontSize: 10, color: C.muted }}>CONTADO</div>
                  <div style={{ fontFamily: "JetBrains Mono", color: C.green, fontWeight: 700 }}>{fmt(p.priceContado)}</div></div>
                <div><div style={{ fontSize: 10, color: C.muted }}>CRÉDITO</div>
                  <div style={{ fontFamily: "JetBrains Mono", color: C.accent, fontWeight: 700 }}>{fmt(p.priceCredito)}</div></div>
                <div><div style={{ fontSize: 10, color: C.muted }}>STOCK</div>
                  <div style={{ fontFamily: "JetBrains Mono", color: p.stock < 5 ? C.red : C.text, fontWeight: 700 }}>{p.stock}</div></div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Btn size="sm" onClick={() => openEdit(p)}>✏️ Editar</Btn>
                <Btn size="sm" variant={p.active ? "ghost" : "success"} onClick={() => toggle(p.id)}>
                  {p.active ? "Ocultar" : "Publicar"}
                </Btn>
                <Btn size="sm" variant="danger" onClick={() => del(p.id)}>🗑️</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Nuevo Producto" : "Editar Producto"} wide>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Nombre" ><input value={form.name || ""} onChange={e => set("name", e.target.value)} /></Field>
          <Field label="Categoría">
            <select value={form.category || ""} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.filter(c => c !== "Todo").map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Precio contado"><input type="number" value={form.priceContado || ""} onChange={e => set("priceContado", e.target.value)} /></Field>
          <Field label="Precio crédito"><input type="number" value={form.priceCredito || ""} onChange={e => set("priceCredito", e.target.value)} /></Field>
          <Field label="Stock"><input type="number" value={form.stock || ""} onChange={e => set("stock", e.target.value)} /></Field>
          <div style={{ display: "flex", gap: 16, alignItems: "center", paddingTop: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, textTransform: "none", fontSize: 14, color: C.text }}>
              <input type="checkbox" checked={!!form.active} onChange={e => set("active", e.target.checked)} style={{ width: "auto !important" }} />
              Publicado
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, textTransform: "none", fontSize: 14, color: C.text }}>
              <input type="checkbox" checked={!!form.offer} onChange={e => set("offer", e.target.checked)} style={{ width: "auto !important" }} />
              Oferta
            </label>
          </div>
          <Field label="URL Imagen" ><input value={form.image || ""} onChange={e => set("image", e.target.value)} placeholder="https://..." /></Field>
          <Field label="Descripción"><textarea rows={3} value={form.description || ""} onChange={e => set("description", e.target.value)} style={{ resize: "vertical" }} /></Field>
        </div>
        {form.image && <img src={form.image} alt="preview" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginTop: 12 }} />}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Guardar</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN: PEDIDOS + ABONOS
// ═══════════════════════════════════════════════════════════════
const AdminOrders = ({ orders, setOrders, users }) => {
  const [filter, setFilter] = useState("todos");
  const [sel, setSel] = useState(null);
  const [abonoAmt, setAbonoAmt] = useState("");
  const [abonoNote, setAbonoNote] = useState("");

  const filtered = filter === "todos" ? orders : orders.filter(o =>
    filter === "credito" ? o.type === "credito" && o.status === "activo" : o.status === filter
  );

  const addAbono = (orderId) => {
    const amt = +abonoAmt;
    if (!amt || amt <= 0) return;
    setOrders(os => os.map(o => {
      if (o.id !== orderId) return o;
      const newSaldo = Math.max(0, o.saldoPendiente - amt);
      return {
        ...o,
        saldoPendiente: newSaldo,
        status: newSaldo === 0 ? "pagado" : "activo",
        semanaActual: o.semanaActual + 1,
        abonos: [...o.abonos, { date: today(), amount: amt, note: abonoNote || `Abono semana ${o.semanaActual + 1}` }],
      };
    }));
    // update sel
    setSel(prev => {
      if (!prev || prev.id !== orderId) return prev;
      const newSaldo = Math.max(0, prev.saldoPendiente - amt);
      return {
        ...prev, saldoPendiente: newSaldo,
        status: newSaldo === 0 ? "pagado" : "activo",
        semanaActual: prev.semanaActual + 1,
        abonos: [...prev.abonos, { date: today(), amount: amt, note: abonoNote || `Abono semana ${prev.semanaActual + 1}` }],
      };
    });
    setAbonoAmt(""); setAbonoNote("");
  };

  const statusColor = { activo: C.accent, pagado: C.green, cancelado: C.red };
  const totalCredito = orders.filter(o => o.type === "credito" && o.status === "activo").reduce((s, o) => s + o.saldoPendiente, 0);

  return (
    <div>
      {totalCredito > 0 && (
        <div style={{ background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 12,
          padding: "14px 18px", marginBottom: 20, fontSize: 14 }}>
          💰 Cartera de crédito activa: <strong style={{ fontFamily: "JetBrains Mono", color: C.accent }}>{fmt(totalCredito)}</strong>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[["todos", "Todos"], ["activo", "En crédito"], ["pagado", "Pagados"], ["cancelado", "Cancelados"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            background: filter === v ? C.accent : C.surface,
            border: `1px solid ${filter === v ? C.accent : C.border}`,
            color: filter === v ? "#fff" : C.muted,
            borderRadius: 999, padding: "5px 16px", fontSize: 12, fontWeight: 600,
          }}>{l} ({v === "todos" ? orders.length : orders.filter(o => v === "activo" ? o.type === "credito" && o.status === "activo" : o.status === v).length})</button>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Pedido", "Cliente", "Total", "Tipo", "Saldo", "Estado", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10,
                  color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => (
              <tr key={o.id} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 16px", fontFamily: "JetBrains Mono", fontSize: 12, color: C.muted }}>{o.id}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>{o.customerName}</td>
                <td style={{ padding: "12px 16px", fontFamily: "JetBrains Mono", color: C.accent, fontWeight: 700 }}>{fmt(o.total)}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Chip color={o.type === "credito" ? C.accent : C.green} small>
                    {o.type === "credito" ? "Crédito" : "Contado"}
                  </Chip>
                </td>
                <td style={{ padding: "12px 16px", fontFamily: "JetBrains Mono", color: o.saldoPendiente > 0 ? C.red : C.green, fontSize: 13 }}>
                  {fmt(o.saldoPendiente)}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Chip color={statusColor[o.status] || C.muted} small>{o.status}</Chip>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Btn size="sm" onClick={() => setSel(o)}>Ver</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!sel} onClose={() => setSel(null)} title={`Pedido ${sel?.id}`} wide>
        {sel && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <Chip color={statusColor[sel.status]}>{sel.status}</Chip>
              <Chip color={sel.type === "credito" ? C.accent : C.green}>{sel.type === "credito" ? "Crédito" : "Contado"}</Chip>
            </div>
            <div style={{ fontSize: 14 }}>
              <strong>{sel.customerName}</strong> · {sel.date}
            </div>

            {sel.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 14 }}>{item.name} × {item.qty}</span>
                <span style={{ fontFamily: "JetBrains Mono", color: C.accent }}>{fmt(item.price * item.qty)}</span>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ fontFamily: "JetBrains Mono", color: C.accent }}>{fmt(sel.total)}</span>
            </div>

            {sel.type === "credito" && (
              <>
                <CreditBar paid={sel.total - sel.saldoPendiente} total={sel.total} />
                <div style={{ fontSize: 13, color: C.muted }}>
                  Saldo: <strong style={{ color: C.red }}>{fmt(sel.saldoPendiente)}</strong>
                  {" · "}Abono/sem: <strong style={{ color: C.accent }}>{fmt(weekAbono(sel.total, sel.semanasTotal))}</strong>
                  {" · "}Semana {sel.semanaActual}/{sel.semanasTotal}
                </div>

                {sel.status === "activo" && (
                  <div style={{ background: C.accentDim, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: GOLD }}>💰 Registrar abono</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <input type="number" value={abonoAmt} onChange={e => setAbonoAmt(e.target.value)}
                        placeholder={`Sugerido: ${weekAbono(sel.total, sel.semanasTotal)}`} style={{ flex: 1, minWidth: 120 }} />
                      <input value={abonoNote} onChange={e => setAbonoNote(e.target.value)}
                        placeholder="Nota (opcional)" style={{ flex: 1, minWidth: 120 }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      <Btn onClick={() => addAbono(sel.id)}>✅ Registrar abono</Btn>
                      {/* WhatsApp: recordatorio de pago */}
                      {(() => {
                        const user = sel;
                        const sugerido = weekAbono(sel.total, sel.semanasTotal);
                        const msgRecordatorio = `Hola ${sel.customerName} 👋\n\nTe recordamos que tienes un abono pendiente de tu pedido *${sel.id}* en *Pelusa Store* 🛍️\n\n💰 Abono semanal: $${sugerido.toLocaleString()} MXN\n📊 Saldo pendiente: $${sel.saldoPendiente.toLocaleString()} MXN\n\n¡Gracias por tu confianza! 🙏`;
                        const msgConfirmacion = abonoAmt
                          ? `Hola ${sel.customerName} ✅\n\nHemos registrado tu abono de *$${Number(abonoAmt).toLocaleString()} MXN* para el pedido *${sel.id}* en *Pelusa Store* 🛍️\n\n📊 Nuevo saldo pendiente: *$${Math.max(0, sel.saldoPendiente - +abonoAmt).toLocaleString()} MXN*\n\n¡Muchas gracias por tu pago! 🙌`
                          : null;
                        return (
                          <>
                            <a href={buildWALink(msgRecordatorio)} target="_blank" rel="noreferrer" style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              background: "#25D36622", border: "1px solid #25D36644", color: "#25D366",
                              borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none",
                            }}>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              Recordatorio de pago
                            </a>
                            {msgConfirmacion && (
                              <a href={buildWALink(msgConfirmacion)} target="_blank" rel="noreferrer" style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                background: "#25D36622", border: "1px solid #25D36644", color: "#25D366",
                                borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none",
                              }}>
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Confirmar abono ({fmt(abonoAmt)})
                              </a>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                      💡 Los botones de WhatsApp abren una conversación con el mensaje listo para enviar
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Historial de pagos</div>
              {sel.abonos.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0",
                  borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{a.date} — {a.note}</span>
                  <span style={{ fontFamily: "JetBrains Mono", color: C.green }}>+{fmt(a.amount)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {sel.status !== "cancelado" && (
                <Btn variant="danger" size="sm" onClick={() => {
                  setOrders(os => os.map(o => o.id === sel.id ? { ...o, status: "cancelado" } : o));
                  setSel(null);
                }}>❌ Cancelar pedido</Btn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN: CLIENTES
// ═══════════════════════════════════════════════════════════════
const AdminUsers = ({ users, orders }) => {
  const [sel, setSel] = useState(null);

  const userStats = (uid) => {
    const uOrders = orders.filter(o => o.userId === uid);
    const total = uOrders.reduce((s, o) => s + o.total, 0);
    const pendiente = uOrders.filter(o => o.type === "credito" && o.status === "activo").reduce((s, o) => s + o.saldoPendiente, 0);
    return { orders: uOrders.length, total, pendiente, uOrders };
  };

  return (
    <div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Cliente", "Teléfono", "Pedidos", "Total comprado", "Deuda activa", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10,
                  color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const s = userStats(u.id);
              return (
                <tr key={u.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>{u.phone}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "JetBrains Mono", textAlign: "center" }}>{s.orders}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "JetBrains Mono", color: C.accent, fontWeight: 700 }}>{fmt(s.total)}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "JetBrains Mono", color: s.pendiente > 0 ? C.red : C.green, fontWeight: 700 }}>
                    {fmt(s.pendiente)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Btn size="sm" onClick={() => setSel({ user: u, ...s })}>Ver</Btn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.user?.name} wide>
        {sel && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Correo", v: sel.user.email },
                { label: "Teléfono", v: sel.user.phone },
                { label: "Dirección", v: sel.user.address },
                { label: "Miembro desde", v: sel.user.joinDate },
              ].map(x => (
                <div key={x.label}>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", marginBottom: 3 }}>{x.label}</div>
                  <div style={{ fontSize: 14 }}>{x.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <StatCard label="Pedidos" value={sel.orders} icon="📋" />
              <StatCard label="Total comprado" value={fmt(sel.total)} color={C.accent} icon="💰" />
              <StatCard label="Deuda activa" value={fmt(sel.pendiente)} color={sel.pendiente > 0 ? C.red : C.green} icon="⏳" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: "uppercase" }}>Pedidos</div>
              {sel.uOrders.map(o => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0",
                  borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{o.id} · {o.date}</span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Chip color={o.type === "credito" ? C.accent : C.green} small>{o.type}</Chip>
                    <span style={{ fontFamily: "JetBrains Mono", color: C.accent }}>{fmt(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN: ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════
const AdminStats = ({ orders, products, users }) => {
  const totalIngresos = orders.filter(o => o.status === "pagado").reduce((s, o) => s + o.total, 0);
  const totalCredito = orders.filter(o => o.type === "credito" && o.status === "activo").reduce((s, o) => s + o.saldoPendiente, 0);
  const totalPedidos = orders.length;
  const pedidosCredito = orders.filter(o => o.type === "credito").length;
  const pedidosContado = orders.filter(o => o.type === "contado").length;

  // Top clientes
  const topClientes = users.map(u => ({
    ...u,
    total: orders.filter(o => o.userId === u.id).reduce((s, o) => s + o.total, 0),
    count: orders.filter(o => o.userId === u.id).length,
  })).sort((a, b) => b.total - a.total).slice(0, 5);

  // Top productos
  const prodSales = {};
  orders.forEach(o => o.items.forEach(i => {
    prodSales[i.name] = (prodSales[i.name] || 0) + i.qty;
  }));
  const topProductos = Object.entries(prodSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Por categoría
  const catSales = {};
  orders.forEach(o => o.items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (prod) catSales[prod.category] = (catSales[prod.category] || 0) + item.price * item.qty;
  }));

  const maxCat = Math.max(...Object.values(catSales));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
        <StatCard label="Ingresos cobrados" value={fmt(totalIngresos)} color={C.green} icon="✅" sub="pagados completos" />
        <StatCard label="Cartera crédito" value={fmt(totalCredito)} color={C.accent} icon="⏳" sub="por cobrar" />
        <StatCard label="Total pedidos" value={totalPedidos} color={C.blue} icon="📦" />
        <StatCard label="Clientes" value={users.length} color={C.yellow} icon="👥" />
        <StatCard label="Contado" value={pedidosContado} color={C.green} icon="💵" sub="pedidos" />
        <StatCard label="Crédito" value={pedidosCredito} color={C.accent} icon="📅" sub="pedidos" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top clientes */}
        <Card>
          <h3 style={{ fontFamily: "Cinzel", fontWeight: 700, marginBottom: 16 }}>🏆 Top clientes</h3>
          {topClientes.map((u, i) => (
            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: C.muted, width: 18 }}>#{i + 1}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{u.count} pedido{u.count !== 1 ? "s" : ""}</div>
                </div>
              </div>
              <span style={{ fontFamily: "JetBrains Mono", color: C.accent, fontWeight: 700 }}>{fmt(u.total)}</span>
            </div>
          ))}
        </Card>

        {/* Top productos */}
        <Card>
          <h3 style={{ fontFamily: "Cinzel", fontWeight: 700, marginBottom: 16 }}>🔥 Productos más vendidos</h3>
          {topProductos.map(([name, qty], i) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: C.muted, width: 18 }}>#{i + 1}</div>
                <div style={{ fontSize: 14 }}>{name}</div>
              </div>
              <Chip color={C.accent} small>{qty} uds</Chip>
            </div>
          ))}
        </Card>
      </div>

      {/* Ventas por categoría */}
      <Card>
        <h3 style={{ fontFamily: "Cinzel", fontWeight: 700, marginBottom: 20 }}>📊 Ventas por categoría</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(catSales).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                <span>{cat}</span>
                <span style={{ fontFamily: "JetBrains Mono", color: C.accent }}>{fmt(amt)}</span>
              </div>
              <div style={{ background: C.border, borderRadius: 999, height: 8 }}>
                <div style={{ background: C.accent, width: (amt / maxCat * 100) + "%", height: "100%", borderRadius: 999, transition: "width .5s" }} />
              </div>
            </div>
          ))}
          {Object.keys(catSales).length === 0 && <div style={{ color: C.muted, textAlign: "center" }}>Sin datos aún</div>}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const ADMIN_TABS = [
  { id: "stats", label: "📊 Estadísticas" },
  { id: "products", label: "📦 Productos" },
  { id: "orders", label: "📋 Pedidos" },
  { id: "users", label: "👥 Clientes" },
];

const USER_TABS = [
  { id: "catalog", label: "🛍️ Catálogo" },
  { id: "orders", label: "📋 Mis pedidos" },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState(initProducts);
  const [users, setUsers] = useState(initUsers);
  const [orders, setOrders] = useState(initOrders);
  const [tab, setTab] = useState("catalog");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const tabs = isAdmin ? ADMIN_TABS : USER_TABS;

  // ── Firebase Auth listener ──────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fireUser) => {
      if (fireUser) {
        if (fireUser.email === ADMIN_CREDENTIALS.email) {
          setCurrentUser({ id: "admin", name: "Administrador", email: fireUser.email, role: "admin" });
        } else {
          // Find user profile in Firestore
          const snap = await import("firebase/firestore").then(m =>
            m.getDoc(m.doc(db, "users", fireUser.uid))
          );
          if (snap.exists()) {
            setCurrentUser({ id: fireUser.uid, ...snap.data() });
          }
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── Firestore: productos en tiempo real ─────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      if (!snap.empty) {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
    return unsub;
  }, []);

  // ── Firestore: pedidos en tiempo real ───────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "orders"), orderBy("date", "desc")),
      (snap) => {
        if (!snap.empty) {
          setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      }
    );
    return unsub;
  }, []);

  // ── Firestore: usuarios en tiempo real ──────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      if (!snap.empty) {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isAdmin) setTab("stats");
    else setTab("catalog");
  }, [currentUser]);

  // ── Handlers Firebase ───────────────────────────────────────
  const handleLogin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleRegister = async (userData) => {
    const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const { password, ...safeData } = userData;
    await setDoc(doc(db, "users", cred.user.uid), {
      ...safeData, role: "user", joinDate: today(),
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCart([]);
  };

  const setProductsFirebase = async (updater) => {
    const updated = typeof updater === "function" ? updater(products) : updater;
    // Sync each product to Firestore
    for (const p of updated) {
      const { id, ...data } = p;
      await setDoc(doc(db, "products", String(id)), data);
    }
  };

  const setOrdersFirebase = async (updater) => {
    const updated = typeof updater === "function" ? updater(orders) : updater;
    for (const o of updated) {
      const { id, ...data } = o;
      await setDoc(doc(db, "orders", String(id)), data);
    }
  };

  const addToCart = (product, priceMode) => {
    const price = priceMode === "credito" ? product.priceCredito : product.priceContado;
    setCart(c => {
      const exists = c.find(i => i.productId === product.id && i.type === priceMode);
      if (exists) return c.map(i => i.productId === product.id && i.type === priceMode ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { productId: product.id, name: product.name, image: product.image, price, type: priceMode, qty: 1 }];
    });
  };

  if (authLoading) return (
    <>
      <style>{G}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070707" }}>
        <div style={{ textAlign: "center" }}>
          <img src={LOGO_URL} alt="Pelusa Store" style={{ width: 80, marginBottom: 20, opacity: 0.8 }} />
          <div style={{ color: GOLD, fontFamily: "Cinzel", fontSize: 14, letterSpacing: "0.2em" }}>CARGANDO...</div>
        </div>
      </div>
    </>
  );

  if (!currentUser) return (
    <>
      <style>{G}</style>
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        users={users}
        setUsers={setUsers}
      />
    </>
  );

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <>
      <style>{G}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>
        {/* NAV */}
        <nav style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: "0 20px", position: "sticky", top: 0, zIndex: 500,
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 4, overflowX: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "10px 0", marginRight: 16, whiteSpace: "nowrap" }}>
              <div style={{ width: 36, height: 36, background: "#000",
                border: `1px solid ${GOLD}44`, borderRadius: 8, overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={LOGO_URL} alt="Pelusa Store" style={{ width: "90%", height: "90%", objectFit: "contain" }} />
              </div>
              <span style={{ fontFamily: "Cinzel", fontSize: 15, fontWeight: 700,
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {isAdmin ? "PELUSA · ADMIN" : "PELUSA STORE"}
              </span>
            </div>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: "none",
                borderBottom: `2px solid ${tab === t.id ? GOLD : "transparent"}`,
                border: "none", borderBottom: `2px solid ${tab === t.id ? GOLD : "transparent"}`,
                color: tab === t.id ? GOLD : C.muted,
                padding: "18px 14px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
              }}>{t.label}</button>
            ))}
            <div style={{ flex: 1 }} />
            {!isAdmin && (
              <button onClick={() => setCartOpen(true)} style={{
                background: cart.length > 0 ? GOLD : C.surface,
                border: `1px solid ${cart.length > 0 ? GOLD : C.border}`,
                color: cart.length > 0 ? "#000" : C.muted,
                borderRadius: 999, padding: "6px 16px", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6, marginRight: 8,
              }}>
                🛒 {cart.length > 0 ? `${cart.length} · ${fmt(cartTotal)}` : "Carrito"}
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, background: GOLD_DIM, border: `1px solid ${GOLD}44`,
                borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, color: GOLD,
              }}>{currentUser.name[0]}</div>
              <button onClick={handleLogout} style={{
                background: "none", border: `1px solid ${C.border}`,
                color: C.muted, borderRadius: 6, padding: "5px 10px", fontSize: 12,
              }}>Salir</button>
            </div>
          </div>
        </nav>

        {/* CONTENIDO */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px" }}>
          {!isAdmin && tab === "catalog" && (
            <div style={{ marginBottom: 28 }}>
              <div style={{
                background: `linear-gradient(135deg, #000 60%, #1a1400)`,
                border: `1px solid ${GOLD}33`,
                borderRadius: 20, padding: "28px 32px",
                display: "flex", alignItems: "center", gap: 24, marginBottom: 8,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -40, right: -40, width: 200, height: 200,
                  background: `radial-gradient(circle, ${GOLD}22 0%, transparent 70%)`,
                  pointerEvents: "none",
                }} />
                <img src={LOGO_URL} alt="Pelusa Store" style={{ width: 80, height: 80, objectFit: "contain", flexShrink: 0 }} />
                <div>
                  <h1 style={{
                    fontFamily: "Cinzel", fontSize: 22, fontWeight: 800,
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT}, ${GOLD})`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6,
                  }}>
                    Bienvenid@, {currentUser.name.split(" ")[0]} ✨
                  </h1>
                  <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                    Catálogo exclusivo Pelusa Store · Precios contado y crédito semanal
                  </p>
                </div>
              </div>
            </div>
          )}
          {isAdmin && (
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "Cinzel", fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
                {tabs.find(t => t.id === tab)?.label}
              </h1>
            </div>
          )}

          {tab === "catalog" && <Catalog products={products} onAddToCart={addToCart} cart={cart} />}
          {tab === "orders" && !isAdmin && <MyOrders orders={orders} userId={currentUser.id} />}
          {tab === "stats" && isAdmin && <AdminStats orders={orders} products={products} users={users} />}
          {tab === "products" && isAdmin && <AdminProducts products={products} setProducts={setProductsFirebase} />}
          {tab === "orders" && isAdmin && <AdminOrders orders={orders} setOrders={setOrdersFirebase} users={users} />}
          {tab === "users" && isAdmin && <AdminUsers users={users} orders={orders} />}
        </div>

        <Modal open={cartOpen} onClose={() => setCartOpen(false)} title="Tu carrito" wide>
          <Cart
            cart={cart} setCart={setCart}
            user={currentUser} orders={orders} setOrders={setOrdersFirebase}
            onClose={() => { setCartOpen(false); setTab("orders"); }}
          />
        </Modal>

        {!isAdmin && (
          <a href={buildWALink(`Hola Pelusa Store 👋 Soy ${currentUser.name}, me gustaría hacer una consulta sobre su catálogo.`)}
            target="_blank" rel="noreferrer"
            style={{
              position: "fixed", bottom: 24, right: 24, zIndex: 900,
              width: 56, height: 56, borderRadius: 999, background: "#25D366",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(37,211,102,0.45)", transition: "transform .2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <svg width={26} height={26} viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}
      </div>
    </>
  );
}

  const addToCart = (product, priceMode) => {
    const price = priceMode === "credito" ? product.priceCredito : product.priceContado;
    setCart(c => {
      const exists = c.find(i => i.productId === product.id && i.type === priceMode);
      if (exists) return c.map(i => i.productId === product.id && i.type === priceMode ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { productId: product.id, name: product.name, image: product.image, price, type: priceMode, qty: 1 }];
    });
  };

  if (!currentUser) return (
    <>
      <style>{G}</style>
      <AuthScreen onLogin={setCurrentUser} users={users} setUsers={setUsers} />
    </>
  );

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <>
      <style>{G}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>
        {/* NAV */}
        <nav style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: "0 20px", position: "sticky", top: 0, zIndex: 500,
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 4, overflowX: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "10px 0", marginRight: 16, whiteSpace: "nowrap" }}>
              <div style={{ width: 36, height: 36, background: "#000",
                border: `1px solid ${GOLD}44`, borderRadius: 8, overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={LOGO_URL} alt="Pelusa Store" style={{ width: "90%", height: "90%", objectFit: "contain" }} />
              </div>
              <span style={{ fontFamily: "Cinzel", fontSize: 15, fontWeight: 700,
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {isAdmin ? "PELUSA · ADMIN" : "PELUSA STORE"}
              </span>
            </div>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: "none",
                borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`,
                border: "none", borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`,
                color: tab === t.id ? C.accent : C.muted,
                padding: "18px 14px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
              }}>{t.label}</button>
            ))}
            <div style={{ flex: 1 }} />
            {!isAdmin && (
              <button onClick={() => setCartOpen(true)} style={{
                background: cart.length > 0 ? C.accent : C.surface,
                border: `1px solid ${cart.length > 0 ? C.accent : C.border}`,
                color: cart.length > 0 ? "#fff" : C.muted,
                borderRadius: 999, padding: "6px 16px", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6, marginRight: 8,
              }}>
                🛒 {cart.length > 0 ? `${cart.length} · ${fmt(cartTotal)}` : "Carrito"}
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, background: C.accentDim, border: `1px solid ${C.accent}44`,
                borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, color: C.accent,
              }}>{currentUser.name[0]}</div>
              <div style={{ display: "none", fontSize: 13, color: C.muted }}>{currentUser.name}</div>
              <button onClick={() => { setCurrentUser(null); setCart([]); }} style={{
                background: "none", border: `1px solid ${C.border}`,
                color: C.muted, borderRadius: 6, padding: "5px 10px", fontSize: 12,
              }}>Salir</button>
            </div>
          </div>
        </nav>

        {/* CONTENIDO */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px" }}>
          {/* Bienvenida */}
          {!isAdmin && tab === "catalog" && (
            <div style={{ marginBottom: 28 }}>
              {/* Hero banner */}
              <div style={{
                background: `linear-gradient(135deg, #000 60%, #1a1400)`,
                border: `1px solid ${GOLD}33`,
                borderRadius: 20, padding: "28px 32px",
                display: "flex", alignItems: "center", gap: 24, marginBottom: 8,
                position: "relative", overflow: "hidden",
              }}>
                {/* Glow dorado detrás */}
                <div style={{
                  position: "absolute", top: -40, right: -40, width: 200, height: 200,
                  background: `radial-gradient(circle, ${GOLD}22 0%, transparent 70%)`,
                  pointerEvents: "none",
                }} />
                <img src={LOGO_URL} alt="Pelusa Store"
                  style={{ width: 80, height: 80, objectFit: "contain", flexShrink: 0 }} />
                <div>
                  <h1 style={{
                    fontFamily: "Cinzel", fontSize: 22, fontWeight: 800,
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT}, ${GOLD})`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    marginBottom: 6,
                  }}>
                    Bienvenid@, {currentUser.name.split(" ")[0]} ✨
                  </h1>
                  <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                    Catálogo exclusivo Pelusa Store · Precios contado y crédito semanal
                  </p>
                </div>
              </div>
            </div>
          )}
          {isAdmin && (
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "Cinzel", fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
                {tabs.find(t => t.id === tab)?.label}
              </h1>
            </div>
          )}

          {/* Vistas */}
          {tab === "catalog" && <Catalog products={products} onAddToCart={addToCart} cart={cart} />}
          {tab === "orders" && !isAdmin && <MyOrders orders={orders} userId={currentUser.id} />}
          {tab === "stats" && isAdmin && <AdminStats orders={orders} products={products} users={users} />}
          {tab === "products" && isAdmin && <AdminProducts products={products} setProducts={setProducts} />}
          {tab === "orders" && isAdmin && <AdminOrders orders={orders} setOrders={setOrders} users={users} />}
          {tab === "users" && isAdmin && <AdminUsers users={users} orders={orders} />}
        </div>

        {/* Modal carrito */}
        <Modal open={cartOpen} onClose={() => setCartOpen(false)} title="Tu carrito" wide>
          <Cart
            cart={cart} setCart={setCart}
            user={currentUser} orders={orders} setOrders={setOrders}
            onClose={() => { setCartOpen(false); setTab("orders"); }}
          />
        </Modal>

        {/* Botón flotante WhatsApp (solo clientes) */}
        {!isAdmin && (
          <a href={buildWALink(`Hola Pelusa Store 👋 Soy ${currentUser.name}, me gustaría hacer una consulta sobre su catálogo.`)}
            target="_blank" rel="noreferrer"
            title="Contactar a Pelusa Store"
            style={{
              position: "fixed", bottom: 24, right: 24, zIndex: 900,
              width: 56, height: 56, borderRadius: 999, background: "#25D366",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(37,211,102,0.45)",
              transition: "transform .2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <svg width={26} height={26} viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}
      </div>
    </>
  );
}
