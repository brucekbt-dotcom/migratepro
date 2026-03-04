import React, { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Server,
  ArrowLeftRight,
  ArrowRightLeft,
  Plus,
  Download,
  Trash2,
  Edit3,
  X,
  ChevronsLeft,
  ChevronsRight,
  PanelRightClose,
  PanelRightOpen,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User,
  Upload,
  Expand,
  Minimize,
  Shield,
  KeyRound,
  Save,
  Sparkles,
  FilePlus,
  Network,
  Camera,
  FileText
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ==========================================
   Firebase 雲端資料庫設定
========================================== */
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8S93vcDiSDmjCO24CSMGN6SyxuVJRiWQ",
  authDomain: "migratepro-12f40.firebaseapp.com",
  projectId: "migratepro-12f40",
  storageBucket: "migratepro-12f40.firebasestorage.app",
  messagingSenderId: "1009468318610",
  appId: "1:1009468318610:web:cc5709e71eba47d153574b",
  measurementId: "G-6PY6D3ZV35"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ==========================================
   型別定義 (Types)
========================================== */
type ThemeMode = "dark" | "light";
type ThemeStyle = "neon" | "horizon" | "nebula" | "matrix";
type PageKey = "dashboard" | "devices" | "before" | "after" | "admin";
type DeviceCategory = "Network" | "Storage" | "Server" | "Other";
type PlacementMode = "before" | "after";

type Role = "admin" | "vendor" | "cable";

type MigrationFlags = {
  racked: boolean;
  cabled: boolean;
  powered: boolean;
  tested: boolean;
};

type Rack = { id: string; name: string; units: number };

type Device = {
  id: string;
  category: DeviceCategory;
  deviceId: string;
  name: string;
  brand: string;
  model: string;
  ports: number;
  sizeU: number;
  ip?: string;
  serial?: string;
  portMap?: string;

  beforeRackId?: string;
  beforeStartU?: number;
  beforeEndU?: number;

  afterRackId?: string;
  afterStartU?: number;
  afterEndU?: number;

  migration: MigrationFlags;
};

type DeviceDraft = {
  category: DeviceCategory;
  deviceId: string;
  name: string;
  brand: string;
  model: string;
  ports: number;
  sizeU: number;
  ip?: string;
  serial?: string;
  portMap?: string;
};

type UiState = {
  sideCollapsed: boolean;
  unplacedCollapsedBefore: boolean;
  unplacedCollapsedAfter: boolean;
};

type LoginResult = { ok: boolean; message?: string };

type Account = {
  username: string;
  password: string;
  role: Role;
};

/* -----------------------------
  LocalStorage Keys
----------------------------- */
const LS = {
  theme: "migrate.theme",
  themeStyle: "migrate.themeStyle",
  devices: "migrate.devices",
  ui: "migrate.ui",
  auth: "migrate.auth",
  user: "migrate.user",
  accounts: "migrate.accounts",
} as const;

/* -----------------------------
  Fixed Colors
----------------------------- */
const FIXED_COLORS = {
  Network: "#22c55e",
  Server: "#3b82f6",
  Storage: "#64748b",
  Other: "#fb923c",
};

/* -----------------------------
  Rack Layouts
----------------------------- */
const BEFORE_RACKS: Rack[] = [
  ...["10", "09", "08", "07", "06"].map((n) => ({ id: `BEF_${n}`, name: n, units: 42 })),
  ...["05", "04", "03", "02", "01"].map((n) => ({ id: `BEF_${n}`, name: n, units: 42 })),
  ...["2F-A", "2F-B", "3F-A", "3F-B", "4F-A", "4F-B"].map((n) => ({ id: `BEF_${n}`, name: n, units: 42 })),
  ...["9F", "SmartHouseA", "SmartHouseB", "新購設備存放區"].map((n) => ({ id: `BEF_${n}`, name: n, units: 42 })),
];

const AFTER_RACKS: Rack[] = [
  ...["A1", "A2", "A3", "A4", "A5", "A6"].map((n) => ({ id: `AFT_${n}`, name: n, units: 42 })),
  ...["B1", "B2", "B3", "B4", "B5", "B6"].map((n) => ({ id: `AFT_${n}`, name: n, units: 42 })),
  ...["HUB 15L", "HUB 15R", "HUB 16L", "HUB 16R", "HUB 17L", "HUB 17R"].map((n) => ({ id: `AFT_${n}`, name: n, units: 42 })),
  ...["HUB 20F", "SmartHouse 20F", "不搬存放區A", "不搬存放區B", "不搬存放區C"].map((n) => ({ id: `AFT_${n}`, name: n, units: 42 })),
];

const mockDevices: Device[] = [
  {
    id: "dev-1",
    category: "Network",
    deviceId: "SW-CORE-001",
    name: "Core Switch",
    brand: "Cisco",
    model: "Catalyst 9500",
    ports: 48,
    sizeU: 2,
    ip: "10.0.0.1",
    serial: "",
    portMap: "A1/40-41U | Gi1/0/1 -> FW\nA1/40-41U | Gi1/0/2 -> Core-RTR",
    beforeRackId: "BEF_01",
    beforeStartU: 40,
    beforeEndU: 41,
    afterRackId: "AFT_A1",
    afterStartU: 40,
    afterEndU: 41,
    migration: { racked: true, cabled: true, powered: true, tested: true },
  },
  {
    id: "dev-2",
    category: "Storage",
    deviceId: "STO-001",
    name: "Primary Storage",
    brand: "NetApp",
    model: "FAS8200",
    ports: 8,
    sizeU: 4,
    ip: "10.0.0.21",
    serial: "",
    portMap: "",
    beforeRackId: "BEF_01",
    beforeStartU: 30,
    beforeEndU: 33,
    migration: { racked: false, cabled: false, powered: false, tested: false },
  },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { username: "admin", password: "migration123", role: "admin" },
  { username: "Vendor", password: "migration666", role: "vendor" },
];

/* -----------------------------
  權限與小工具 (Utils)
----------------------------- */
const canManageAssets = (role: Role) => role === "admin";
const canEditPortMap = (role: Role) => role === "admin" || role === "cable";
const canToggleFlags = (_role: Role) => true;

const clampU = (u: number) => Math.max(1, Math.min(42, u));
const rangesOverlap = (aS: number, aE: number, bS: number, bE: number) => Math.max(aS, bS) <= Math.min(aE, bE);
const isMigratedComplete = (m: MigrationFlags) => m.racked && m.cabled && m.powered && m.tested;

const readJson = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
};

const writeJson = (k: string, v: any) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
};

const syncToCloud = async (patch: any) => {
  try {
    const cleanPatch = JSON.parse(JSON.stringify(patch));
    await setDoc(doc(db, "migratePro", "mainState"), cleanPatch, { merge: true });
  } catch (e) {
    console.error("Cloud Sync Error:", e);
  }
};

/* -----------------------------
  ★ CSV 工具函式 (徹底回歸舊版最穩定的 URL encodeURI 寫法) ★
----------------------------- */
const escapeCSV = (str: string | number | undefined | null) => {
  if (str == null) return "";
  return `"${String(str).replace(/"/g, '""')}"`;
};

const CSV_HEADER = "id,category,deviceId,name,brand,model,ports,sizeU,ip,serial,portMap,beforeRackId,beforeStartU,beforeEndU,afterRackId,afterStartU,afterEndU,m_racked,m_cabled,m_powered,m_tested";

const downloadFullCSV = (devices: Device[]) => {
  const rows = devices.map(d => [
    d.id, d.category, d.deviceId, d.name, d.brand, d.model, d.ports, d.sizeU,
    d.ip || "", d.serial || "", d.portMap || "",
    d.beforeRackId || "", d.beforeStartU || "", d.beforeEndU || "",
    d.afterRackId || "", d.afterStartU || "", d.afterEndU || "",
    d.migration.racked ? "1" : "0", d.migration.cabled ? "1" : "0", d.migration.powered ? "1" : "0", d.migration.tested ? "1" : "0"
  ].map(escapeCSV).join(','));

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [CSV_HEADER, ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `MigratePro_完整備份_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadFullCSVTemplate = () => {
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + CSV_HEADER + "\n";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "MigratePro_完整還原範本.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const APPEND_CSV_HEADER = "category,deviceId,name,brand,model,ports,sizeU,ip,serial,portMap";
const APPEND_CSV_SAMPLE = "Server,SRV-001,範例伺服器,Dell,R740,4,2,192.168.1.100,SN12345,Eth1 -> Switch";

const downloadAppendCSVTemplate = () => {
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + APPEND_CSV_HEADER + "\n" + APPEND_CSV_SAMPLE + "\n";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "MigratePro_批量添加範本.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const parseCSV = (str: string): string[][] => {
  const arr: string[][] = [];
  let quote = false, row = 0, col = 0;
  for (let c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c+1];
    arr[row] = arr[row] || []; arr[row][col] = arr[row][col] || '';
    if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
    if (cc === '"') { quote = !quote; continue; }
    if (cc === ',' && !quote) { ++col; continue; }
    if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
    if (cc === '\n' && !quote) { ++row; col = 0; continue; }
    if (cc === '\r' && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }
  return arr;
};

const isProbablyOldRackId = (v: string) => !v.startsWith("BEF_") && !v.startsWith("AFT_");
const toBeforeRackId = (nameOrId: string) => {
  const s = String(nameOrId || "").trim();
  if (!s) return undefined;
  if (s.startsWith("BEF_")) return s;
  if (s.startsWith("AFT_")) return `BEF_${s.slice(4)}`;
  return `BEF_${s}`;
};
const toAfterRackId = (nameOrId: string) => {
  const s = String(nameOrId || "").trim();
  if (!s) return undefined;
  if (s.startsWith("AFT_")) return s;
  if (s.startsWith("BEF_")) return `AFT_${s.slice(4)}`;
  return `AFT_${s}`;
};

const normalizeDevices = (raw: any[]): Device[] => {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((d: any) => {
    const sizeU = Math.max(1, Math.min(42, Number(d?.sizeU ?? 1)));
    let beforeRackId = d?.beforeRackId ?? undefined;
    let afterRackId = d?.afterRackId ?? undefined;
    if (beforeRackId && isProbablyOldRackId(beforeRackId)) beforeRackId = toBeforeRackId(beforeRackId);
    if (afterRackId && isProbablyOldRackId(afterRackId)) afterRackId = toAfterRackId(afterRackId);
    return {
      id: String(d?.id ?? crypto.randomUUID()), category: (d?.category as DeviceCategory) || "Other",
      deviceId: String(d?.deviceId ?? ""), name: String(d?.name ?? ""), brand: String(d?.brand ?? ""), model: String(d?.model ?? ""),
      ports: Number(d?.ports ?? 0), sizeU, ip: String(d?.ip ?? ""), serial: String(d?.serial ?? ""), portMap: String(d?.portMap ?? ""),
      beforeRackId, beforeStartU: d?.beforeStartU ?? undefined, beforeEndU: d?.beforeEndU ?? undefined,
      afterRackId, afterStartU: d?.afterStartU ?? undefined, afterEndU: d?.afterEndU ?? undefined,
      migration: { racked: Boolean(d?.migration?.racked ?? false), cabled: Boolean(d?.migration?.cabled ?? false), powered: Boolean(d?.migration?.powered ?? false), tested: Boolean(d?.migration?.tested ?? false) },
    } as Device;
  });
};

/* -----------------------------
  Theme Tokens
----------------------------- */
const ThemeTokens = () => {
  const style = useStore((s) => s.themeStyle);
  const presets: Record<ThemeStyle, { light: string; dark: string }> = {
    neon: { light: ":root{--bg:#f7fafc;--panel:#ffffff;--panel2:#f1f5f9;--text:#0b1220;--muted:#475569;--border:#e2e8f0;--accent:#06b6d4;--accent2:#a855f7;--onColor:#f8fafc;}", dark: "html.dark{--bg:#05070d;--panel:#0b1220;--panel2:#1a2235;--text:#e5e7eb;--muted:#94a3b8;--border:#1e293b;--accent:#22d3ee;--accent2:#c084fc;--onColor:#f8fafc;}" },
    horizon: { light: ":root{--bg:#f6f9ff;--panel:#ffffff;--panel2:#eef3ff;--text:#0a1020;--muted:#5b6478;--border:#e6ebff;--accent:#2563eb;--accent2:#14b8a6;--onColor:#f8fafc;}", dark: "html.dark{--bg:#070a14;--panel:#0b1020;--panel2:#101a33;--text:#f1f5f9;--muted:#9aa4b2;--border:#1a2550;--accent:#60a5fa;--accent2:#2dd4bf;--onColor:#f8fafc;}" },
    nebula: { light: ":root{--bg:#fbf7ff;--panel:#ffffff;--panel2:#f6edff;--text:#140a20;--muted:#6b5b7a;--border:#f0e1ff;--accent:#7c3aed;--accent2:#ec4899;--onColor:#f8fafc;}", dark: "html.dark{--bg:#080614;--panel:#0f0b1f;--panel2:#1a1233;--text:#f8fafc;--muted:#a7a1b2;--border:#2a1f4d;--accent:#a78bfa;--accent2:#fb7185;--onColor:#f8fafc;}" },
    matrix: { light: ":root{--bg:#f7fbf9;--panel:#ffffff;--panel2:#edf7f2;--text:#07140f;--muted:#5a6b63;--border:#dff2e8;--accent:#10b981;--accent2:#06b6d4;--onColor:#07140f;}", dark: "html.dark{--bg:#050c09;--panel:#0a1410;--panel2:#0f1f18;--text:#eafff6;--muted:#9bb7ab;--border:#153026;--accent:#34d399;--accent2:#22d3ee;--onColor:#07140f;}" },
  };
  const css = presets[style] || presets.neon;
  return <style>{`${css.light}\n${css.dark}`}</style>;
};

function useApplyTheme() {
  const theme = useStore((s) => s.theme);
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);
}

const catColor = (cat: DeviceCategory) => FIXED_COLORS[cat] || FIXED_COLORS.Other;

const Lamp = ({ on }: { on: boolean }) => (
  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: on ? "rgb(0,255,0)" : "rgb(255,0,0)", boxShadow: on ? "0 0 10px rgba(0,255,0,0.85)" : "0 0 10px rgba(255,0,0,0.75)" }} />
);

const LampsRow = ({ m }: { m: MigrationFlags }) => (
  <div className="flex items-center gap-1"><Lamp on={m.racked} /><Lamp on={m.cabled} /><Lamp on={m.powered} /><Lamp on={m.tested} /></div>
);

/* -----------------------------
  Store (Zustand 狀態管理)
----------------------------- */
interface Store {
  beforeRacks: Rack[];
  afterRacks: Rack[];
  devices: Device[];

  theme: ThemeMode;
  themeStyle: ThemeStyle;
  page: PageKey;
  selectedDeviceId: string | null;
  ui: UiState;
  
  draggingDevice: Device | null;
  setDraggingDevice: (d: Device | null) => void;

  accounts: Account[];
  upsertAccount: (a: Account) => { ok: boolean; message?: string };
  deleteAccount: (username: string) => { ok: boolean; message?: string };

  isAuthed: boolean;
  userName: string | null;
  role: Role;
  login: (u: string, p: string) => LoginResult;
  logout: () => void;

  setPage: (p: PageKey) => void;
  toggleTheme: () => void;
  setThemeStyle: (s: ThemeStyle) => void;
  setSelectedDeviceId: (id: string | null) => void;
  setUi: (patch: Partial<UiState>) => void;

  addDevice: (draft: DeviceDraft) => string;
  updateDevice: (id: string, patch: Partial<DeviceDraft | {portMap: string}>) => void;
  deleteDeviceById: (id: string) => void;

  importFullCSV: (fileText: string) => { ok: boolean; message?: string };
  appendDevicesFromCSV: (fileText: string) => { ok: boolean; message?: string };

  clearPlacement: (mode: PlacementMode, id: string) => void;
  place: (mode: PlacementMode, deviceId: string, rackId: string, startU: number) => { ok: boolean; message?: string };

  setMigrationFlag: (id: string, patch: Partial<MigrationFlags>) => void;
  repairRackIds: () => void;
}

const DEFAULT_UI: UiState = { sideCollapsed: false, unplacedCollapsedBefore: false, unplacedCollapsedAfter: false };

function loadAccounts(): Account[] {
  const stored = readJson<Account[]>(LS.accounts, []);
  const valid = Array.isArray(stored) ? stored : [];
  if (valid.length === 0) { writeJson(LS.accounts, DEFAULT_ACCOUNTS); return DEFAULT_ACCOUNTS; }
  const hasAdmin = valid.some((a) => a.username === "admin");
  const patched = hasAdmin ? valid : [{ username: "admin", password: "migration123", role: "admin" as Role }, ...valid];
  const fixedAdmin = patched.map((a) => a.username === "admin" ? { ...a, role: "admin" as Role } : a);
  writeJson(LS.accounts, fixedAdmin);
  return fixedAdmin;
}

const useStore = create<Store>((set, get) => ({
  beforeRacks: BEFORE_RACKS,
  afterRacks: AFTER_RACKS,
  devices: normalizeDevices(readJson<Device[]>(LS.devices, mockDevices)),

  theme: (localStorage.getItem(LS.theme) as ThemeMode) || "dark",
  themeStyle: (localStorage.getItem(LS.themeStyle) as ThemeStyle) || "neon",
  page: "dashboard",
  selectedDeviceId: null,
  ui: { ...DEFAULT_UI, ...readJson<UiState>(LS.ui, DEFAULT_UI) },

  draggingDevice: null,
  setDraggingDevice: (d) => set({ draggingDevice: d }),

  accounts: loadAccounts(),

  upsertAccount: (a) => {
    const username = a.username.trim();
    if (!username) return { ok: false, message: "帳號不可為空" };
    if (username.includes(" ")) return { ok: false, message: "帳號不可包含空白" };
    if (!a.password) return { ok: false, message: "密碼不可為空" };
    if (a.username === "admin" && a.role !== "admin") return { ok: false, message: "admin 必須是 Admin 權限" };

    const accounts = get().accounts;
    const exists = accounts.some((x) => x.username === username);
    const next = exists ? accounts.map((x) => (x.username === username ? { ...a, username } : x)) : [...accounts, { ...a, username }];
    writeJson(LS.accounts, next); syncToCloud({ accounts: next }); set({ accounts: next }); return { ok: true };
  },

  deleteAccount: (username) => {
    if (username === "admin") return { ok: false, message: "admin 不能刪除" };
    const next = get().accounts.filter((a) => a.username !== username);
    writeJson(LS.accounts, next); syncToCloud({ accounts: next }); set({ accounts: next }); return { ok: true };
  },

  isAuthed: localStorage.getItem(LS.auth) === "1",
  userName: localStorage.getItem(LS.user) || null,
  role: (() => {
    const u = localStorage.getItem(LS.user);
    if (u === "admin") return "admin" as Role;
    const found = loadAccounts().find((a) => a.username === u);
    return found?.role ?? ("vendor" as Role);
  })(),

  login: (u, p) => {
    const username = u.trim();
    const found = get().accounts.find((a) => a.username === username && a.password === p);
    if (!found) return { ok: false, message: "帳號或密碼錯誤" };
    localStorage.setItem(LS.auth, "1"); localStorage.setItem(LS.user, username);
    set({ isAuthed: true, userName: username, role: found.role, page: "dashboard", selectedDeviceId: null });
    return { ok: true };
  },

  logout: () => {
    localStorage.removeItem(LS.auth); localStorage.removeItem(LS.user);
    set({ isAuthed: false, userName: null, role: "vendor", page: "dashboard", selectedDeviceId: null });
  },

  setPage: (page) => set({ page }),
  toggleTheme: () => set((s) => { const next = s.theme === "dark" ? "light" : "dark"; localStorage.setItem(LS.theme, next); return { theme: next }; }),
  setThemeStyle: (themeStyle) => { localStorage.setItem(LS.themeStyle, themeStyle); set({ themeStyle }); },
  setSelectedDeviceId: (selectedDeviceId) => set({ selectedDeviceId }),
  setUi: (patch) => set((s) => { const next = { ...s.ui, ...patch }; writeJson(LS.ui, next); return { ui: next }; }),

  addDevice: (draft) => {
    const id = crypto.randomUUID();
    set((s) => {
      const next: Device[] = [...s.devices, { ...draft, id, migration: { racked: false, cabled: false, powered: false, tested: false } } as Device];
      writeJson(LS.devices, next); syncToCloud({ devices: next }); return { devices: next };
    });
    return id;
  },

  updateDevice: (id, patch) => set((s) => {
    const next = s.devices.map((d) => d.id === id ? ({ ...d, ...patch } as Device) : d);
    writeJson(LS.devices, next); syncToCloud({ devices: next }); return { devices: next };
  }),

  deleteDeviceById: (id) => set((s) => {
    const next = s.devices.filter((d) => d.id !== id);
    writeJson(LS.devices, next); syncToCloud({ devices: next }); return { devices: next, selectedDeviceId: s.selectedDeviceId === id ? null : s.selectedDeviceId };
  }),

  importFullCSV: (fileText) => {
      try {
        const rows = parseCSV(fileText);
        if (rows.length < 2) return { ok: false, message: "CSV 內容不足" };
        const header = rows[0].map((x) => x.trim());
        const getv = (r: string[], k: string) => String(r[header.findIndex((h) => h === k)] ?? "").trim();
        const devices: Device[] = rows.slice(1).map((r) => {
          let beforeRackId = getv(r, "beforeRackId") || undefined; let afterRackId = getv(r, "afterRackId") || undefined;
          if (beforeRackId && isProbablyOldRackId(beforeRackId)) beforeRackId = toBeforeRackId(beforeRackId);
          if (afterRackId && isProbablyOldRackId(afterRackId)) afterRackId = toAfterRackId(afterRackId);
          return {
            id: getv(r, "id") || crypto.randomUUID(), category: (getv(r, "category") as DeviceCategory) || "Other",
            deviceId: getv(r, "deviceId"), name: getv(r, "name"), brand: getv(r, "brand"), model: getv(r, "model"),
            ports: Number(getv(r, "ports") || 0), sizeU: Math.max(1, Math.min(42, Number(getv(r, "sizeU") || 1))),
            ip: getv(r, "ip"), serial: getv(r, "serial"), portMap: getv(r, "portMap"),
            beforeRackId, beforeStartU: getv(r, "beforeStartU") ? Number(getv(r, "beforeStartU")) : undefined, beforeEndU: getv(r, "beforeEndU") ? Number(getv(r, "beforeEndU")) : undefined,
            afterRackId, afterStartU: getv(r, "afterStartU") ? Number(getv(r, "afterStartU")) : undefined, afterEndU: getv(r, "afterEndU") ? Number(getv(r, "afterEndU")) : undefined,
            migration: { racked: getv(r, "m_racked") === "1", cabled: getv(r, "m_cabled") === "1", powered: getv(r, "m_powered") === "1", tested: getv(r, "m_tested") === "1" },
          };
        });
        writeJson(LS.devices, devices); syncToCloud({ devices }); set({ devices }); return { ok: true };
      } catch (e: any) { return { ok: false, message: e?.message || "匯入失敗" }; }
  },

  appendDevicesFromCSV: (fileText) => {
    try {
      const rows = parseCSV(fileText);
      if (rows.length < 2) return { ok: false, message: "CSV 內容不足" };
      const header = rows[0].map((x) => x.trim());
      const getv = (r: string[], k: string) => String(r[header.findIndex((h) => h === k)] ?? "").trim();
      const newDevices: Device[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]; if (r.length < 3) continue;
        const deviceId = getv(r, "deviceId"), name = getv(r, "name");
        if (!deviceId || !name) continue;
        newDevices.push({
          id: crypto.randomUUID(), category: (getv(r, "category") as DeviceCategory) || "Other",
          deviceId, name, brand: getv(r, "brand"), model: getv(r, "model"),
          ports: Number(getv(r, "ports") || 0), sizeU: Math.max(1, Math.min(42, Number(getv(r, "sizeU") || 1))),
          ip: getv(r, "ip"), serial: getv(r, "serial"), portMap: getv(r, "portMap"),
          migration: { racked: false, cabled: false, powered: false, tested: false },
        });
      }
      if (newDevices.length === 0) return { ok: false, message: "找不到有效的設備資料" };
      const updated = [...get().devices, ...newDevices];
      writeJson(LS.devices, updated); syncToCloud({ devices: updated }); set({ devices: updated }); return { ok: true };
    } catch (e: any) { return { ok: false, message: e?.message || "匯入失敗" }; }
  },

  clearPlacement: (mode, id) => set((s) => {
    const next = s.devices.map((d) => d.id !== id ? d : mode === "before" ? { ...d, beforeRackId: undefined, beforeStartU: undefined, beforeEndU: undefined } : { ...d, afterRackId: undefined, afterStartU: undefined, afterEndU: undefined });
    writeJson(LS.devices, next); syncToCloud({ devices: next }); return { devices: next };
  }),

  place: (mode, deviceId, rackId, startU) => {
    const { devices } = get(); const dev = devices.find((d) => d.id === deviceId);
    if (!dev) return { ok: false, message: "找不到設備" };
    const sU = clampU(startU); const eU = sU + Math.max(1, Math.min(42, dev.sizeU)) - 1;
    if (eU > 42) return { ok: false, message: "超出機櫃高度限制 (42U)" };

    const collision = devices.find((d) => {
      if (d.id === deviceId) return false;
      const rId = mode === "before" ? d.beforeRackId : d.afterRackId;
      const s = mode === "before" ? d.beforeStartU : d.afterStartU;
      const e = mode === "before" ? d.beforeEndU : d.afterEndU;
      return rId === rackId && s != null && e != null && rangesOverlap(sU, eU, s, e);
    });
    if (collision) return { ok: false, message: `位置衝突: ${collision.deviceId} ${collision.name}` };

    const next = devices.map((d) => d.id === deviceId ? mode === "before" ? { ...d, beforeRackId: rackId, beforeStartU: sU, beforeEndU: eU } : { ...d, afterRackId: rackId, afterStartU: sU, afterEndU: eU } : d);
    writeJson(LS.devices, next); syncToCloud({ devices: next }); set({ devices: next }); return { ok: true };
  },

  setMigrationFlag: (id, patch) => set((s) => {
    const next = s.devices.map((d) => d.id === id ? { ...d, migration: { ...d.migration, ...patch } } : d);
    writeJson(LS.devices, next); syncToCloud({ devices: next }); return { devices: next };
  }),

  repairRackIds: () => set((s) => {
    const repaired = s.devices.map((d) => {
      let beforeRackId = d.beforeRackId; let afterRackId = d.afterRackId;
      if (beforeRackId && isProbablyOldRackId(beforeRackId)) beforeRackId = toBeforeRackId(beforeRackId);
      if (afterRackId && isProbablyOldRackId(afterRackId)) afterRackId = toAfterRackId(afterRackId);
      return { ...d, beforeRackId, afterRackId };
    });
    writeJson(LS.devices, repaired); syncToCloud({ devices: repaired }); return { devices: repaired };
  }),
}));

/* -----------------------------
  Components
----------------------------- */

function LoginPage() {
  const login = useStore((s) => s.login);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-6">
      <ThemeTokens />
      <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-3xl shadow-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", boxShadow: "0 0 18px rgba(34,211,238,0.25)" }}>
            <Server size={18} />
          </div>
          <div><div className="text-lg font-black">MigratePro</div><div className="text-xs text-[var(--muted)]">機房搬遷專案管理</div></div>
        </div>
        <div className="mt-5 space-y-3">
          <div><label className="text-xs text-[var(--muted)]">帳號</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" value={u} onChange={(e) => setU(e.target.value)} placeholder="請輸入帳號" /></div>
          <div><label className="text-xs text-[var(--muted)]">密碼</label><input type="password" className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" value={p} onChange={(e) => setP(e.target.value)} placeholder="請輸入密碼" /></div>
          {err && <div className="text-sm text-red-400">{err}</div>}
          <button onClick={() => { setErr(null); const res = login(u.trim(), p); if (!res.ok) setErr(res.message || "登入失敗"); }} className="w-full mt-2 bg-[var(--accent)] text-black font-extrabold py-3 rounded-xl hover:opacity-90">登入</button>
        </div>
      </div>
    </div>
  );
}

function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; }) {
  return (
    <button disabled={disabled} onClick={() => onChange(!on)} className={`w-11 h-6 rounded-full border transition-all ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${on ? "bg-[rgba(0,255,0,0.12)] border-[rgba(0,255,0,0.7)]" : "bg-black/20 border-[var(--border)]"}`} style={{ boxShadow: on ? "0 0 16px rgba(0,255,0,0.25)" : "none" }}>
      <span className="block w-5 h-5 rounded-full bg-white transition-all" style={{ transform: `translateX(${on ? "20px" : "2px"})` }} />
    </button>
  );
}

function DeviceDetailModal({ id, mode, onClose }: { id: string; mode: PlacementMode; onClose: () => void; }) {
  const d = useStore((s) => s.devices.find((x) => x.id === id));
  const setFlag = useStore((s) => s.setMigrationFlag);
  const clearPlacement = useStore((s) => s.clearPlacement);
  const updateDevice = useStore((s) => s.updateDevice);
  const role = useStore((s) => s.role);
  
  const [portMapStr, setPortMapStr] = useState(d?.portMap || "");

  if (!d) return null;

  const beforePos = d.beforeRackId && d.beforeStartU != null && d.beforeEndU != null ? `${d.beforeRackId.replace(/^BEF_/, "")} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
  const displayAfterId = d.afterRackId === "AFT_不搬存放區C" ? "AFT_搬遷不上架存放區" : d.afterRackId;
  const afterPos = displayAfterId && d.afterStartU != null && d.afterEndU != null ? `${displayAfterId.replace(/^AFT_/, "")} ${d.afterStartU}-${d.afterEndU}U` : "-";
  
  const allowLayout = canManageAssets(role);
  const allowEditPort = canEditPortMap(role);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
        <div className="p-4 md:p-6 border-b border-[var(--border)] shrink-0 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-[var(--muted)]">設備詳細</div>
            <div className="text-lg font-black truncate">{d.deviceId} · {d.name}</div>
            <div className="text-sm text-[var(--muted)] truncate">{d.brand} / {d.model} · {d.ports} ports · {d.sizeU}U</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button>
        </div>
        
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]"><div className="text-xs text-[var(--muted)]">搬遷前位置</div><div className="font-bold mt-1">{beforePos}</div></div>
            <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]"><div className="text-xs text-[var(--muted)]">搬遷後位置</div><div className="font-bold mt-1">{afterPos}</div></div>
            <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)] md:col-span-2">
              <div className="text-xs text-[var(--muted)]">IP / 序號</div><div className="mt-1 font-bold">{d.ip || "-"} / {d.serial || "-"}</div>
              
              <div className="flex items-center justify-between mt-3 mb-1">
                <div className="text-xs text-[var(--muted)]">Port對接備註</div>
                {!allowEditPort && <div className="text-[10px] text-[var(--muted)] border border-[var(--border)] px-1 rounded bg-black/10">Vendor (唯讀)</div>}
              </div>
              {allowEditPort ? (
                <div className="flex flex-col items-end gap-2">
                  <textarea className="w-full bg-[var(--panel)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" rows={4} value={portMapStr} onChange={e => setPortMapStr(e.target.value)} />
                  {portMapStr !== (d.portMap || "") && (
                    <button onClick={() => updateDevice(d.id, { portMap: portMapStr.trimEnd() })} className="bg-[var(--accent)] text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 flex items-center gap-1"><Save size={14} /> 儲存備註</button>
                  )}
                </div>
              ) : (<div className="mt-1 whitespace-pre-wrap break-words">{d.portMap || "-"}</div>)}
            </div>
          </div>
          <div className="mt-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
            <div className="flex items-center justify-between"><div className="font-black">搬遷狀態</div><LampsRow m={d.migration} /></div>
            {mode === "after" ? (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between"><div className="text-sm">已上架</div><Switch on={d.migration.racked} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { racked: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">已接線</div><Switch on={d.migration.cabled} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { cabled: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">已開機</div><Switch on={d.migration.powered} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { powered: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">已測試</div><Switch on={d.migration.tested} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { tested: v })} disabled={!canToggleFlags(role)} /></div>
              </div>
            ) : (<div className="text-xs text-[var(--muted)] mt-3">※ 僅在「搬遷後」頁面可切換狀態。</div>)}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-between items-center">
          {allowLayout ? (<button onClick={() => { if (confirm("確定清除此設備在本頁面的位置？")) clearPlacement(mode, d.id); onClose(); }} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-xs md:text-sm">清除本頁位置</button>) : (<div className="text-xs text-[var(--muted)]">{role === "cable" ? "Cable" : "Vendor"}：無法調整佈局</div>)}
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90">關閉</button>
        </div>
      </motion.div>
    </div>
  );
}

function DeviceModal({ title, initial, onClose, onSave }: { title: string; initial: DeviceDraft; onClose: () => void; onSave: (d: DeviceDraft) => void; }) {
  const [d, setD] = useState<DeviceDraft>(initial);
  const input = (k: keyof DeviceDraft) => (e: any) => setD((p) => ({ ...p, [k]: e.target.value } as any));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
        <div className="p-4 md:p-6 border-b border-[var(--border)] shrink-0 flex items-center justify-between gap-3">
          <div className="text-xl font-black text-[var(--text)]">{title}</div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button>
        </div>
        
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <form id="device-form" className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); if (!d.deviceId.trim() || !d.name.trim()) return alert("請填寫設備編號與設備名稱"); onSave({ ...d, ports: Number(d.ports) || 0, sizeU: Math.max(1, Math.min(42, Number(d.sizeU) || 1)), portMap: (d.portMap ?? "").trimEnd() }); }}>
            <div><label className="text-xs text-[var(--muted)]">類別</label><select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.category} onChange={input("category") as any}>{(["Network", "Storage", "Server", "Other"] as DeviceCategory[]).map((x) => (<option key={x} value={x}>{x}</option>))}</select></div>
            <div><label className="text-xs text-[var(--muted)]">設備編號</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" value={d.deviceId} onChange={input("deviceId")} placeholder="EX: SW-01" /></div>
            <div><label className="text-xs text-[var(--muted)]">設備名稱</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" value={d.name} onChange={input("name")} /></div>
            <div><label className="text-xs text-[var(--muted)]">廠牌</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.brand} onChange={input("brand")} /></div>
            <div><label className="text-xs text-[var(--muted)]">型號</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.model} onChange={input("model")} /></div>
            <div><label className="text-xs text-[var(--muted)]">Port數量</label><input type="number" min={0} className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.ports} onChange={(e) => setD((p) => ({ ...p, ports: Number(e.target.value) || 0 }))} /></div>
            <div><label className="text-xs text-[var(--muted)]">占用高度(U)</label><input type="number" min={1} max={42} className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.sizeU} onChange={(e) => setD((p) => ({ ...p, sizeU: Number(e.target.value) || 1 }))} /></div>
            <div><label className="text-xs text-[var(--muted)]">設備IP</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.ip ?? ""} onChange={input("ip")} placeholder="10.0.0.10" /></div>
            <div><label className="text-xs text-[var(--muted)]">序號</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.serial ?? ""} onChange={input("serial")} /></div>
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--muted)]">Port對接備註</label>
              <textarea className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none min-h-[140px] whitespace-pre" value={d.portMap ?? ""} onChange={(e) => { setD((p) => ({ ...p, portMap: e.target.value })); }} placeholder={"例：\n01/40U | Gi1/0/1 -> FW\nA1/20U | ETH1 -> TOR"} />
            </div>
          </form>
        </div>

        <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5">取消</button>
          <button type="submit" form="device-form" className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90">儲存</button>
        </div>
      </motion.div>
    </div>
  );
}

/* -----------------------------
  ★ Dashboard 輪播機櫃 (單排超大橫向滑動版) ★
----------------------------- */
const DashboardFullCarousel = ({ devices, racks }: { devices: Device[]; racks: Rack[] }) => {
  const [page, setPage] = useState(0);
  const p1 = useMemo(() => racks.filter((r) => r.id.includes("AFT_A") || r.id.includes("AFT_B")), [racks]);
  const p2 = useMemo(() => racks.filter((r) => !r.id.includes("AFT_A") && !r.id.includes("AFT_B")), [racks]);
  
  useEffect(() => {
    const timer = setInterval(() => setPage((v) => (v + 1) % 2), 10000);
    return () => clearInterval(timer);
  }, []);

  // 當前頁面的所有機櫃 (不再切成兩排)
  const curRacks = page === 0 ? p1 : p2;

  // 使用百分比計算，徹底移除 42 個網格的 DOM 渲染防當機
  const getPctStyle = (d: Device) => {
    const sU = clampU(d.afterStartU ?? 1); 
    const eU = clampU(d.afterEndU ?? sU);
    const start = Math.min(sU, eU); 
    const size = Math.abs(eU - sU) + 1;
    const bottomPct = ((start - 1) / 42) * 100;
    const heightPct = (size / 42) * 100;
    return { bottom: `${bottomPct}%`, height: `calc(${heightPct}% - 2px)` };
  };

  return (
    <div className="bg-[var(--panel)] border border-[var(--border)] p-4 md:p-8 rounded-2xl shadow-xl flex flex-col w-full lg:col-span-2">
      <div className="flex w-full justify-between items-center mb-6">
        <h3 className="text-xl font-black flex items-center gap-2"><Network className="text-[var(--accent)]" /> 搬遷後機櫃佈局現況 ({page === 0 ? "1/2" : "2/2"})</h3>
        <div className="flex gap-2">
          <button onClick={() => setPage(0)} className={`w-3 h-3 rounded-full transition-all ${page === 0 ? "bg-[var(--accent)] scale-110" : "bg-[var(--border)]"}`} />
          <button onClick={() => setPage(1)} className={`w-3 h-3 rounded-full transition-all ${page === 1 ? "bg-[var(--accent)] scale-110" : "bg-[var(--border)]"}`} />
        </div>
      </div>
      
      {/* ★ 單排橫向捲動，高度大幅拉伸 (min-h-[400px]) ★ */}
      <div className="flex gap-4 md:gap-6 overflow-x-auto w-full flex-1 min-h-[400px] pb-4 scrollbar-hide snap-x">
        {curRacks.map(rack => {
          const rackDevs = devices.filter(d => d.afterRackId === rack.id && d.afterStartU != null && d.afterEndU != null);
          const displayName = rack.name === "不搬存放區C" ? "搬遷不上架" : rack.name;
          const isRed = rack.name.startsWith("不搬存放區");

          return (
            <div key={rack.id} className="flex flex-col bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 snap-center border border-slate-700 min-w-[150px] max-w-[280px] flex-1">
              <div className={`px-2 py-2 md:py-3 text-center text-sm md:text-base font-bold text-white truncate ${isRed ? "bg-red-800" : "bg-emerald-600"}`} title={displayName}>{displayName}</div>
              
              <div className="relative w-full border-x-[6px] md:border-x-[10px] border-t-[6px] md:border-t-[10px] border-slate-600 bg-slate-800 shadow-inner flex-1">
                <div className="absolute left-0 top-0 bottom-0 w-4 md:w-8 bg-yellow-400/90 border-r border-slate-800 z-0 hidden sm:block" />
                <div className="absolute left-0 sm:left-8 right-0 top-0 bottom-0 pointer-events-none z-10">
                  {rackDevs.map(d => {
                    const style = getPctStyle(d);
                    const isDone = isMigratedComplete(d.migration);
                    return (
                      <div key={d.id} className="absolute left-[1px] right-[1px] rounded flex flex-col justify-center items-center px-1 md:px-2 overflow-hidden shadow-md"
                           style={{ ...style, backgroundColor: catColor(d.category), backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)" }}>
                        <div className="text-[10px] sm:text-[12px] xl:text-[14px] text-white font-bold truncate w-full text-center leading-tight hidden xl:block px-1 drop-shadow-md">{d.deviceId}</div>
                        <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mt-1 ${isDone ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"} shrink-0`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -----------------------------
  Dashboard (進度條)
----------------------------- */
const Dashboard = () => {
  const devices = useStore((s) => s.devices);
  const afterRacks = useStore((s) => s.afterRacks);
  
  const total = devices.length;
  const racked = devices.filter((d) => d.migration.racked).length;
  const cabled = devices.filter((d) => d.migration.cabled).length;
  const powered = devices.filter((d) => d.migration.powered).length;
  const tested = devices.filter((d) => d.migration.tested).length;
  const completed = devices.filter((d) => isMigratedComplete(d.migration)).length;
  const pending = Math.max(0, total - completed);

  const calcPct = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0;

  const chartData = [
    { name: "Network", count: devices.filter((d) => d.category === "Network").length, fill: FIXED_COLORS.Network },
    { name: "Storage", count: devices.filter((d) => d.category === "Storage").length, fill: FIXED_COLORS.Storage },
    { name: "Server", count: devices.filter((d) => d.category === "Server").length, fill: FIXED_COLORS.Server },
    { name: "Other", count: devices.filter((d) => d.category === "Other").length, fill: FIXED_COLORS.Other },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="text-[var(--muted)] font-bold mb-2">設備總數</div>
          <div className="text-5xl font-black text-[var(--accent)]">{total}</div>
        </div>
        <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1">
            <div className="text-[var(--muted)] font-bold">待處理</div>
            <div className="text-sm font-bold text-red-500 opacity-90">{calcPct(pending)}%</div>
          </div>
          <div className="text-4xl font-black text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]">{pending}</div>
          <div className="mt-3 w-full h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${calcPct(pending)}%` }} />
          </div>
        </div>
        <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1">
            <div className="text-[var(--muted)] font-bold">搬遷完成</div>
            <div className="text-sm font-bold text-green-500 opacity-90">{calcPct(completed)}%</div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-black text-green-500 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]">{completed}</div>
            <div className="text-lg text-[var(--muted)] font-bold">/ {total}</div>
          </div>
          <div className="mt-3 w-full h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${calcPct(completed)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: '已上架', val: racked }, { label: '已接線', val: cabled }, { label: '已開機', val: powered }, { label: '已測試', val: tested }].map((item, idx) => (
          <div key={idx} className="bg-[var(--panel2)] border border-[var(--border)] p-4 rounded-xl flex flex-col">
            <div className="text-sm font-black text-[var(--muted)] mb-2">{item.label}</div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-2xl font-black text-[var(--text)]">{item.val} <span className="text-xs text-[var(--muted)] font-bold">/ {total}</span></div>
              <div className="text-xs font-bold text-[var(--accent)]">{calcPct(item.val)}%</div>
            </div>
            <div className="w-full h-1 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${calcPct(item.val)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* 單排大機櫃輪播 */}
      <DashboardFullCarousel devices={devices} racks={afterRacks} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl flex flex-col h-[320px]">
          <h3 className="text-lg font-black mb-2">設備類別分佈</h3>
          <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} />
                <YAxis stroke="var(--muted)" fontSize={12} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "var(--panel2)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-[var(--border)]">
            {chartData.map(c => (
              <div key={c.name} className="text-center">
                <div className="text-[10px] text-[var(--muted)]">{c.name}</div>
                <div className="font-bold" style={{ color: c.fill }}>{c.count}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl flex flex-col h-[320px] overflow-y-auto">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Sparkles className="text-[var(--accent)]" /> 系統操作提示</h3>
          <ul className="text-sm text-[var(--muted)] space-y-3 flex-1">
            <li className="flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />在「設備管理」中可新增設備、匯出 CSV，Admin 可使用 CSV 進行覆蓋或批量添加。</li>
            <li className="flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />「搬遷前/後規劃」支援拖曳設備。向下滾動時，未放置面板會自動懸浮於頂部，方便跨機櫃拖放。</li>
            <li className="flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />拖曳設備進入機櫃時，會顯示藍色定位點預覽擺放位置。</li>
            <li className="flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />點擊機櫃內設備可查看詳情。Admin 與 Cable 權限可編輯 Port 備註；所有角色皆可切換搬遷後燈號。</li>
            <li className="flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />建議定期下載「完整 CSV 備份」以確保專案歷史資料安全。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/* -----------------------------
  匯入視窗
----------------------------- */
function FullCSVImportModal({ onClose }: { onClose: () => void }) {
  const importFullCSV = useStore((s) => s.importFullCSV);
  const [drag, setDrag] = useState(false);
  const handleFile = async (file: File) => {
    const text = await file.text(); const res = importFullCSV(text);
    if (!res.ok) alert(res.message || "匯入失敗"); else onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
        <div className="p-6 shrink-0 border-b border-[var(--border)]">
          <div className="flex items-center justify-between"><div className="text-xl font-black">完整 CSV 還原（含佈局/燈號）</div><button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button></div>
          <div className="mt-3 text-sm text-[var(--muted)] text-red-400">⚠️ 警告：此功能會覆蓋並清空現有所有資料，請確認您上傳的是完整的備份檔。</div>
          <div className="mt-4 flex gap-2 flex-wrap"><button onClick={downloadFullCSVTemplate} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2"><Download size={16} /> 下載完整範本</button></div>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <label onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDrag(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }} className={`block w-full rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${drag ? "border-[var(--accent)] bg-white/5" : "border-[var(--border)] bg-black/10"}`}>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))" }}><Upload className="text-black" /></div>
              <div className="font-black">拖曳「完整備份 CSV」到這裡上傳</div><div className="text-xs text-[var(--muted)]">或點擊選取檔案</div>
            </div>
          </label>
        </div>
      </motion.div>
    </div>
  );
}

function AppendCSVImportModal({ onClose }: { onClose: () => void }) {
  const appendDevicesFromCSV = useStore((s) => s.appendDevicesFromCSV);
  const [drag, setDrag] = useState(false);
  const handleFile = async (file: File) => {
    const text = await file.text(); const res = appendDevicesFromCSV(text);
    if (!res.ok) alert(res.message || "匯入失敗"); else onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
        <div className="p-6 shrink-0 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="text-xl font-black flex items-center gap-2 text-[var(--accent)]"><FilePlus /> CSV 批量添加設備</div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button>
          </div>
          <div className="mt-3 text-sm text-[var(--text)]">此功能會將 CSV 內的設備 <span className="font-bold text-[var(--accent2)]">加入到現有清單的尾端</span>，不會覆蓋或刪除目前的任何資料。</div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button onClick={downloadAppendCSVTemplate} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2"><Download size={16} /> 下載批量添加專用範本</button>
          </div>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <label onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDrag(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }} className={`block w-full rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${drag ? "border-[var(--accent)] bg-white/5" : "border-[var(--border)] bg-black/10"}`}>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--accent2),var(--accent))" }}><Plus className="text-black" size={24} /></div>
              <div className="font-black">拖曳「添加用 CSV」到這裡上傳</div><div className="text-xs text-[var(--muted)]">或點擊選取檔案</div>
            </div>
          </label>
        </div>
      </motion.div>
    </div>
  );
}

/* -----------------------------
  DevicesPage
----------------------------- */
type SortKey = "category" | "deviceId" | "name" | "brand" | "model" | "ports" | "sizeU" | "before" | "after" | "migration" | "complete";
type SortDir = "asc" | "desc";

const DevicesPage = () => {
  const devices = useStore((s) => s.devices);
  const addDevice = useStore((s) => s.addDevice);
  const updateDevice = useStore((s) => s.updateDevice);
  const deleteDeviceById = useStore((s) => s.deleteDeviceById);
  const clearPlacement = useStore((s) => s.clearPlacement);
  const setSelectedDeviceId = useStore((s) => s.setSelectedDeviceId);
  const role = useStore((s) => s.role);

  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [appendOpen, setAppendOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("deviceId");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const allowManage = canManageAssets(role);

  const sortToggle = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const sorted = useMemo(() => {
    const getBefore = (d: Device) => d.beforeRackId && d.beforeStartU != null ? `${d.beforeRackId.replace(/^BEF_/, "")}-${d.beforeStartU}` : "";
    const getAfter = (d: Device) => d.afterRackId && d.afterStartU != null ? `${(d.afterRackId === "AFT_不搬存放區C" ? "AFT_搬遷不上架存放區" : d.afterRackId).replace(/^AFT_/, "")}-${d.afterStartU}` : "";
    const getMigScore = (d: Device) => (d.migration.racked ? 1 : 0) + (d.migration.cabled ? 1 : 0) + (d.migration.powered ? 1 : 0) + (d.migration.tested ? 1 : 0);
    const getComplete = (d: Device) => (isMigratedComplete(d.migration) ? 1 : 0);
    const cmp = (a: any, b: any) => {
      if (a === b) return 0; if (a == null) return -1; if (b == null) return 1;
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b));
    };

    return [...devices].sort((a, b) => {
      let va: any; let vb: any;
      switch (sortKey) {
        case "category": va = a.category; vb = b.category; break;
        case "deviceId": va = a.deviceId; vb = b.deviceId; break;
        case "name": va = a.name; vb = b.name; break;
        case "brand": va = a.brand; vb = b.brand; break;
        case "model": va = a.model; vb = b.model; break;
        case "ports": va = a.ports; vb = b.ports; break;
        case "sizeU": va = a.sizeU; vb = b.sizeU; break;
        case "before": va = getBefore(a); vb = getBefore(b); break;
        case "after": va = getAfter(a); vb = getAfter(b); break;
        case "migration": va = getMigScore(a); vb = getMigScore(b); break;
        case "complete": va = getComplete(a); vb = getComplete(b); break;
        default: va = a.deviceId; vb = b.deviceId;
      }
      const c = cmp(va, vb); return sortDir === "asc" ? c : -c;
    });
  }, [devices, sortKey, sortDir]);

  const Th = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean; }) => (
    <th className={`px-4 py-4 font-semibold ${right ? "text-right" : ""}`}>
      <button onClick={() => sortToggle(k)} className="inline-flex items-center gap-2 hover:text-[var(--accent)] whitespace-nowrap" title="排序">
        {children} <span className="text-[10px] opacity-70">{sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-3 justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-[var(--accent)]">設備資產清單</h2>
          <p className="text-[var(--muted)] text-sm">{allowManage ? "新增/編輯/刪除設備；刪除會同步移除機櫃配置。" : "唯讀權限：可查看、可匯出 CSV、可切換狀態燈號，但不能調整清單。"}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* 回歸穩定版 CSV */}
          <button onClick={() => canExportCSV(role) && downloadFullCSV(devices)} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 font-bold"><Download size={16} /> 完整CSV匯出</button>

          {allowManage && (
            <>
              <button onClick={() => setAppendOpen(true)} className="px-4 py-2 rounded-xl border border-[var(--accent2)] text-[var(--accent2)] hover:bg-white/5 flex items-center gap-2 font-bold">
                <FilePlus size={16} /> CSV批量添加
              </button>
              <button onClick={() => setImportOpen(true)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-white/5 flex items-center gap-2 text-xs">
                <Upload size={14} /> 完整覆蓋還原
              </button>
              <button onClick={() => setIsAdding(true)} className="bg-[var(--accent)] text-black px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 hover:opacity-90">
                <Plus size={18} /> 新增單筆設備
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl overflow-hidden overflow-x-auto shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/20 text-[var(--muted)] text-xs uppercase tracking-wider">
            <tr>
              <Th k="category">分類</Th><Th k="deviceId">編號</Th><Th k="name">名稱</Th><Th k="brand">廠牌</Th>
              <Th k="model">型號</Th><Th k="ports">Ports</Th><Th k="sizeU">U</Th><Th k="before">搬遷前</Th>
              <Th k="after">搬遷後</Th><Th k="migration">搬遷狀態</Th><Th k="complete">完成/未完成</Th>
              <th className="px-4 py-4 font-semibold text-right whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.map((d) => {
              const before = d.beforeRackId && d.beforeStartU != null ? `${d.beforeRackId.replace(/^BEF_/, "")} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
              const displayAfterId = d.afterRackId === "AFT_不搬存放區C" ? "AFT_搬遷不上架存放區" : d.afterRackId;
              const after = displayAfterId && d.afterStartU != null ? `${displayAfterId.replace(/^AFT_/, "")} ${d.afterStartU}-${d.afterEndU}U` : "-";
              const done = isMigratedComplete(d.migration);

              return (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-[10px] font-extrabold px-2 py-1 rounded-md border whitespace-nowrap" style={{ color: "var(--onColor)", borderColor: "rgba(255,255,255,0.35)", backgroundColor: catColor(d.category) }}>{d.category}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap"><div className="font-black text-sm whitespace-nowrap">{d.deviceId}</div></td>
                  <td className="px-4 py-4 whitespace-nowrap"><button onClick={() => useStore.getState().setSelectedDeviceId(d.id)} className="text-sm text-[var(--muted)] hover:text-[var(--accent)] font-semibold whitespace-nowrap" title="查看詳細">{d.name}</button></td>
                  <td className="px-4 py-4 text-xs text-[var(--text)] whitespace-nowrap">{d.brand}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{d.model}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{d.ports}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{d.sizeU}U</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{before}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{after}</td>
                  <td className="px-4 py-4 whitespace-nowrap"><LampsRow m={d.migration} /></td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-xs font-extrabold px-2 py-1 rounded-lg border" style={{ borderColor: done ? "rgba(0,255,0,0.45)" : "rgba(255,0,0,0.45)", color: done ? "rgb(0,255,0)" : "rgb(255,0,0)", background: done ? "rgba(0,255,0,0.06)" : "rgba(255,0,0,0.06)" }}>{done ? "完成" : "未完成"}</span></td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {allowManage ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(d)} className="p-2 hover:bg-white/10 rounded-lg text-[var(--accent)]" title="編輯"><Edit3 size={16} /></button>
                        <button onClick={() => { clearPlacement("before", d.id); clearPlacement("after", d.id); }} className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs hover:bg-white/5 whitespace-nowrap" title="清除位置">清除</button>
                        <button onClick={() => { if (confirm(`確定刪除 ${d.deviceId} - ${d.name}？`)) deleteDeviceById(d.id); }} className="p-2 hover:bg-white/10 rounded-lg text-red-400" title="刪除"><Trash2 size={16} /></button>
                      </div>
                    ) : (<div className="text-xs text-[var(--muted)]">只讀</div>)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (<tr><td colSpan={12} className="px-6 py-10 text-center text-[var(--muted)]">目前沒有設備</td></tr>)}
          </tbody>
        </table>
      </div>

      {importOpen && <FullCSVImportModal onClose={() => setImportOpen(false)} />}
      {appendOpen && <AppendCSVImportModal onClose={() => setAppendOpen(false)} />}
      {isAdding && (<DeviceModal title="新增設備" initial={{ category: "Other", deviceId: "", name: "", brand: "", model: "", ports: 8, sizeU: 1, ip: "", serial: "", portMap: "" }} onClose={() => setIsAdding(false)} onSave={(d) => { addDevice(d); setIsAdding(false); }} />)}
      {editing && (<DeviceModal title="編輯設備" initial={{ category: editing.category, deviceId: editing.deviceId, name: editing.name, brand: editing.brand, model: editing.model, ports: editing.ports, sizeU: editing.sizeU, ip: editing.ip ?? "", serial: editing.serial ?? "", portMap: editing.portMap ?? "" }} onClose={() => setEditing(null)} onSave={(d) => { updateDevice(editing.id, d); setEditing(null); }} />)}
    </div>
  );
};

/* -----------------------------
  Hover Card (tooltip)
----------------------------- */
function HoverCard({ x, y, d, beforePos, afterPos }: { x: number; y: number; d: Device; beforePos: string; afterPos: string; }) {
  return (
    <div className="fixed z-[9999] pointer-events-none" style={{ left: x + 16, top: y + 16 }}>
      <div 
        className="rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-[320px] p-4 text-left text-white"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] text-gray-300 font-medium">設備資訊</div>
            <div className="font-black text-sm truncate text-white">{d.deviceId} · {d.name}</div>
            <div className="text-[11px] text-gray-300 truncate mt-0.5">{d.brand} / {d.model} · {d.sizeU}U · {d.ports} ports</div>
          </div>
          <div className="pt-1"><LampsRow m={d.migration} /></div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/10 p-2"><div className="text-[10px] text-gray-400">搬遷前</div><div className="font-bold truncate text-white">{beforePos}</div></div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-2"><div className="text-[10px] text-gray-400">搬遷後</div><div className="font-bold truncate text-white">{afterPos}</div></div>
        </div>
        <div className="mt-3 text-[11px] text-gray-400 truncate">IP：{d.ip || "-"}　SN：{d.serial || "-"}</div>
      </div>
    </div>
  );
}

function UnplacedPanel({ mode, unplaced, collapsed, setCollapsed, allowLayout }: { mode: PlacementMode; unplaced: Device[]; collapsed: boolean; setCollapsed: (v: boolean) => void; allowLayout: boolean; }) {
  const setDraggingDevice = useStore(s => s.setDraggingDevice);
  useEffect(() => { if (unplaced.length === 0 && !collapsed) setCollapsed(true); }, [unplaced.length]);

  const isSticky = unplaced.length > 0 && !collapsed;

  return (
    <div className={`border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden mb-6 transition-all duration-300 ${isSticky ? "sticky top-[80px] z-[40] bg-[var(--panel)]/95 backdrop-blur-xl" : "bg-[var(--panel)]"}`}>
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-black">未放置設備</div>
          <div className="text-xs text-[var(--muted)]">{unplaced.length === 0 ? "全部已放置（已自動收合）" : `${unplaced.length} 台`}</div>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 text-sm" title="收合/展開">
          {collapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />} {collapsed ? "展開" : "收合"}
        </button>
      </div>
      {!collapsed && (
        <div className="p-4">
          {unplaced.length === 0 ? (<div className="text-sm text-[var(--muted)]">✅ 沒有未放置設備</div>) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {unplaced.map((d) => (
                <div
                  key={d.id} draggable={allowLayout}
                  onDragStart={(ev) => { if (!allowLayout) return; ev.dataTransfer.setData("text/plain", d.id); setDraggingDevice(d); ev.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => setDraggingDevice(null)}
                  className={`min-w-[240px] p-3 rounded-xl shadow-md border border-white/10 transition-all ${allowLayout ? "cursor-grab active:cursor-grabbing hover:brightness-110 hover:scale-[1.02]" : "cursor-not-allowed opacity-90"}`}
                  style={{ backgroundColor: catColor(d.category), backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.15) 100%)", color: "white" }}
                  title={allowLayout ? "拖曳到機櫃" : "權限不足，不允許拖放"}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-black truncate drop-shadow-md">{d.deviceId}</div>
                      <div className="text-xs font-semibold opacity-90 truncate drop-shadow-sm mt-0.5">{d.name}</div>
                      <div className="text-[10px] opacity-80 mt-1.5 truncate drop-shadow-sm">{d.brand} · {d.model} · {d.sizeU}U</div>
                    </div>
                    <div className="pt-1 bg-black/20 p-1 rounded-md shadow-inner"><LampsRow m={d.migration} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 text-xs text-[var(--muted)]">{allowLayout ? `提示：把設備拖到機櫃（${mode === "before" ? "搬遷前" : "搬遷後"}）` : "唯讀：只能查看/切換搬遷後燈號，不能拖放"}</div>
        </div>
      )}
    </div>
  );
}

function AddAndPlaceModal({ mode, rackId, u, onClose }: { mode: PlacementMode; rackId: string; u: number; onClose: () => void; }) {
  const role = useStore((s) => s.role);
  const addDevice = useStore((s) => s.addDevice);
  const place = useStore((s) => s.place);
  if (role !== "admin") return null;
  const initial: DeviceDraft = { category: "Other", deviceId: "", name: "", brand: "", model: "", ports: 8, sizeU: 1, ip: "", serial: "", portMap: "" };
  const displayName = rackId === "AFT_不搬存放區C" ? "搬遷不上架存放區" : rackId.replace(/^(BEF_|AFT_)/, "");
  return (
    <DeviceModal title={`新增設備並放置：${displayName} / ${u}U`} initial={initial} onClose={onClose} onSave={(d) => { const id = addDevice(d); const res = place(mode, id, rackId, u); if (!res.ok) alert(res.message); onClose(); }} />
  );
}

/* -----------------------------
  ★ Rack Planner (包含機櫃佈局 超高畫質 PDF 匯出) ★
----------------------------- */
const RackPlanner = ({ mode }: { mode: PlacementMode }) => {
  const racks = useStore((s) => (mode === "before" ? s.beforeRacks : s.afterRacks));
  const devices = useStore((s) => s.devices);
  const place = useStore((s) => s.place);
  const clearPlacement = useStore((s) => s.clearPlacement);
  const setSelectedDeviceId = useStore((s) => s.setSelectedDeviceId);
  const ui = useStore((s) => s.ui);
  const setUi = useStore((s) => s.setUi);
  const repairRackIds = useStore((s) => s.repairRackIds);
  const role = useStore((s) => s.role);
  const draggingDevice = useStore((s) => s.draggingDevice);
  const setDraggingDevice = useStore((s) => s.setDraggingDevice);

  const allowLayout = canManageAssets(role);

  type HoverInfo = { x: number; y: number; d: Device; beforePos: string; afterPos: string };
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [addPlace, setAddPlace] = useState<{ rackId: string; u: number } | null>(null);
  const [dragHover, setDragHover] = useState<{ rackId: string, u: number } | null>(null);
  
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => { repairRackIds(); }, [mode]);

  const rackIdSet = useMemo(() => new Set(racks.map((r) => r.id)), [racks]);
  const isPlaced = (d: Device) => {
    const rid = mode === "before" ? d.beforeRackId : d.afterRackId;
    const s = mode === "before" ? d.beforeStartU : d.afterStartU;
    const e = mode === "before" ? d.beforeEndU : d.afterEndU;
    return !!rid && rackIdSet.has(rid) && s != null && e != null;
  };
  const unplaced = useMemo(() => devices.filter((d) => !isPlaced(d)), [devices, rackIdSet, mode]);
  const collapsed = mode === "before" ? ui.unplacedCollapsedBefore : ui.unplacedCollapsedAfter;
  const setCollapsed = (v: boolean) => setUi(mode === "before" ? { unplacedCollapsedBefore: v } : { unplacedCollapsedAfter: v });

  const rackRows = useMemo(() => {
    if (mode === "before") {
      const map = new Map(racks.map((r) => [r.name, r]));
      const spec: string[][] = [
        ["10", "09", "08", "07", "06"],
        ["05", "04", "03", "02", "01"],
        ["2F-A", "2F-B", "3F-A", "3F-B", "4F-A", "4F-B"],
        ["9F", "SmartHouseA", "SmartHouseB", "新購設備存放區"],
      ];
      return spec.map((row) => row.map((name) => map.get(name)!).filter(Boolean));
    }
    const out: Rack[][] = []; let cur: Rack[] = [];
    racks.forEach((r) => { cur.push(r); if (cur.length === 6) { out.push(cur); cur = []; } });
    if (cur.length) out.push(cur);
    return out;
  }, [racks, mode]);

  // ★ PDF 分頁：每兩排機櫃切成一頁
  const printPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < rackRows.length; i += 2) {
      pages.push(rackRows.slice(i, i + 2));
    }
    return pages;
  }, [rackRows]);

  const listForRack = (rackId: string) =>
    devices.filter((d) => (mode === "before" ? d.beforeRackId === rackId : d.afterRackId === rackId))
      .filter((d) => { const s = mode === "before" ? d.beforeStartU : d.afterStartU; const e = mode === "before" ? d.beforeEndU : d.afterEndU; return s != null && e != null; })
      .sort((a, b) => { const as = (mode === "before" ? a.beforeStartU : a.afterStartU) ?? 999; const bs = (mode === "before" ? b.beforeStartU : b.afterStartU) ?? 999; return as - bs; });

  const U_H = 22;

  const getBlockStyle = (d: Device) => {
    const sU = (mode === "before" ? d.beforeStartU : d.afterStartU) ?? 1;
    const eU = (mode === "before" ? d.beforeEndU : d.afterEndU) ?? sU;
    const start = clampU(Math.min(sU, eU));
    const end = clampU(Math.max(sU, eU));
    return { bottom: (start - 1) * U_H, height: (end - start + 1) * U_H };
  };

  const findDeviceAtU = (rackId: string, u: number) => {
    return devices.find((d) => {
      const rId = mode === "before" ? d.beforeRackId : d.afterRackId;
      const s = mode === "before" ? d.beforeStartU : d.afterStartU;
      const e = mode === "before" ? d.beforeEndU : d.afterEndU;
      if (rId !== rackId || s == null || e == null) return false;
      return u >= Math.min(s, e) && u <= Math.max(s, e);
    });
  };

  const onDrop = (e: React.DragEvent, rackId: string, u: number) => {
    e.preventDefault(); setDragHover(null);
    if (!allowLayout) return;
    const id = e.dataTransfer.getData("text/plain"); if (!id) return;
    const res = place(mode, id, rackId, u); setDraggingDevice(null);
    if (!res.ok) alert(res.message);
  };

  const onCellClick = (rackId: string, u: number) => {
    const found = findDeviceAtU(rackId, u);
    if (found) { setSelectedDeviceId(found.id); return; }
    if (role === "admin") setAddPlace({ rackId, u });
  };

  // ★ PDF 超高畫質匯出
  const handleExportRackPDF = () => {
    setIsExportingPDF(true);
    setTimeout(async () => {
      try {
        const pdf = new jsPDF("l", "mm", "a4");
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < printPages.length; i++) {
          const el = document.getElementById(`pdf-rack-page-${i}`);
          if (!el) continue;
          
          const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#0f172a" });
          const imgData = canvas.toDataURL("image/png");
          
          let finalH = (canvas.height * pdfW) / canvas.width;
          let finalW = pdfW;
          
          if (finalH > pdfH) {
             finalH = pdfH;
             finalW = (canvas.width * finalH) / canvas.height;
          }
          const x = (pdfW - finalW) / 2;
          const y = (pdfH - finalH) / 2;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", x, y, finalW, finalH);
        }
        pdf.save(`MigratePro_機櫃佈局_${mode === 'before' ? '搬遷前' : '搬遷後'}_${new Date().toISOString().slice(0,10)}.pdf`);
      } catch (error) {
        alert("匯出失敗：" + error);
      } finally {
        setIsExportingPDF(false);
      }
    }, 500);
  };

  const title = mode === "before" ? "搬遷前 機櫃佈局" : "搬遷後 機櫃佈局";

  return (
    <div className="p-6 relative">
      <div className="flex flex-wrap items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3 text-[var(--text)]"><ArrowRightLeft className="text-[var(--accent)]" /> {title}</h2>
          <p className="text-[var(--muted)] text-sm font-medium mt-1">{allowLayout ? "拖拉設備到機櫃；拖拉時會高亮顯示定位點。滾動畫面時未放置區會置頂" : "唯讀權限：只能查看（不可拖放/不可調整機櫃佈局）"}</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-3 bg-[var(--panel)] p-2.5 rounded-xl border border-[var(--border)] shadow-sm text-xs font-bold shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Network }}></div> Network</div>
            <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Server }}></div> Server</div>
            <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Storage }}></div> Storage</div>
            <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Other }}></div> Other</div>
          </div>
          <button onClick={handleExportRackPDF} disabled={isExportingPDF} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] font-bold transition-all flex items-center gap-2">
            <FileText size={16} /> {isExportingPDF ? "產生多頁 PDF 中..." : "匯出滿版 PDF (A4橫式)"}
          </button>
        </div>
      </div>

      <UnplacedPanel mode={mode} unplaced={unplaced} collapsed={collapsed} setCollapsed={setCollapsed} allowLayout={allowLayout} />

      <div className="space-y-8 overflow-hidden">
        {rackRows.map((row, idx) => (
          <div key={idx} className="flex gap-6 overflow-x-auto pb-4 items-start snap-x">
            {row.map((rack) => {
              const displayName = rack.name === "不搬存放區C" ? "搬遷不上架存放區" : rack.name;
              const isRed = rack.name.startsWith("不搬存放區") || rack.name === "新購設備存放區";

              return (
                <div key={rack.id} className="flex flex-col bg-[var(--panel)] rounded-xl shadow-lg border border-[var(--border)] overflow-hidden flex-shrink-0 snap-center min-w-[340px]">
                  <div className={`px-4 py-2 ${mode === "after" && isRed ? "bg-red-800" : mode === "before" && isRed ? "bg-red-800" : mode === "after" ? "bg-emerald-600" : "bg-slate-800"} text-white flex justify-between items-center`}>
                    <h2 className="font-bold text-sm flex items-center gap-2 truncate text-white"><Server size={16} />{displayName}</h2>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded whitespace-nowrap text-white">42U</span>
                  </div>

                  <div className="flex-1 overflow-y-hidden p-4 bg-slate-100 dark:bg-black/20 flex justify-center">
                    <div className="relative w-full border-x-[12px] border-t-[12px] border-slate-400 dark:border-slate-600 bg-slate-900 rounded-t-lg shadow-inner mb-4" style={{ height: 42 * U_H }}>
                      <div className="absolute left-0 top-0 bottom-0 w-7 sm:w-8 bg-yellow-400/90 border-r border-slate-800 z-0" />

                      {Array.from({ length: 42 }).map((_, i) => {
                        const u = i + 1;
                        const bottomPos = i * U_H;
                        const isThick = u % 5 === 0;
                        const isHoverTarget = allowLayout && dragHover?.rackId === rack.id && u >= dragHover.u && u < dragHover.u + (draggingDevice?.sizeU || 1);

                        return (
                          <React.Fragment key={`grid-${u}`}>
                            <div className="absolute left-0 w-7 sm:w-8 flex items-center justify-center text-slate-900 text-[8px] font-bold z-0" style={{ bottom: bottomPos, height: U_H }}>{u}</div>
                            <div className="absolute left-7 sm:left-8 right-0 z-0 group cursor-pointer" style={{ bottom: bottomPos, height: U_H }} 
                                 onDragOver={(e) => {
                                   allowLayout && e.preventDefault();
                                   if (allowLayout && (dragHover?.rackId !== rack.id || dragHover?.u !== u)) { setDragHover({ rackId: rack.id, u }); }
                                 }} 
                                 onDragLeave={() => {
                                   if (allowLayout && dragHover?.rackId === rack.id && dragHover?.u === u) { setDragHover(null); }
                                 }} 
                                 onDrop={(e) => onDrop(e, rack.id, u)} 
                                 onClick={() => onCellClick(rack.id, u)}>
                              <div className={`absolute inset-0 transition-colors ${isHoverTarget ? "bg-[var(--accent)]/40 border-y border-[var(--accent)] z-20" : "hover:bg-white/[0.05]"}`} />
                            </div>
                            {u < 42 && (<div className={`absolute left-7 sm:left-8 right-0 z-0 pointer-events-none ${isThick ? "bg-slate-500/80 h-[2px]" : "bg-slate-700/50 h-[1px]"}`} style={{ bottom: bottomPos + U_H }} />)}
                          </React.Fragment>
                        );
                      })}

                      <div className="absolute left-7 sm:left-8 right-0 top-0 bottom-0 pointer-events-none z-10">
                        {listForRack(rack.id).map((d) => {
                          const { bottom, height } = getBlockStyle(d);
                          const isHovered = hoverId === d.id;
                          const beforePos = d.beforeRackId && d.beforeStartU != null && d.beforeEndU != null ? `${d.beforeRackId.replace(/^BEF_/, "")} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
                          const dAfterId = d.afterRackId === "AFT_不搬存放區C" ? "AFT_搬遷不上架存放區" : d.afterRackId;
                          const afterPos = dAfterId && d.afterStartU != null && d.afterEndU != null ? `${dAfterId.replace(/^AFT_/, "")} ${d.afterStartU}-${d.afterEndU}U` : "-";

                          return (
                            <div key={d.id} draggable={allowLayout} onDragStart={(ev) => { if (!allowLayout) return; ev.dataTransfer.setData("text/plain", d.id); setDraggingDevice(d); ev.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDraggingDevice(null)} onClick={() => setSelectedDeviceId(d.id)} onMouseMove={(e) => { setHoverId(d.id); setHoverInfo({ x: e.clientX, y: e.clientY, d, beforePos, afterPos }); }} onMouseLeave={() => { setHoverId(null); setHoverInfo(null); }} className={`absolute left-[2px] right-[2px] rounded flex flex-row items-center px-2 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all pointer-events-auto overflow-hidden ${isHovered ? "brightness-125 scale-[1.01] z-20 shadow-[0_0_15px_rgba(56,189,248,0.4)]" : "z-10"}`} style={{ bottom: bottom + 1, height: height - 2, backgroundColor: catColor(d.category), backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)", cursor: allowLayout ? "grab" : "pointer" }}>
                              <div className="flex-1 h-full flex flex-col justify-center min-w-0 pr-14 drop-shadow-md">
                                {d.sizeU >= 2 ? (
                                  <><div className="truncate w-full font-bold text-[10px] sm:text-[11px] leading-tight tracking-wide">{d.deviceId} | {d.name}</div><div className="truncate w-full text-[9px] sm:text-[10px] opacity-90 font-medium leading-tight mt-0.5">{d.brand} | {d.model}</div></>
                                ) : (<div className="truncate w-full font-bold text-[9px] sm:text-[10px] leading-tight">{d.deviceId} | {d.name} | {d.model}</div>)}
                              </div>
                              <div className="absolute bottom-1 right-1 flex items-center bg-black/40 px-1 py-[2px] rounded shadow-inner pointer-events-none scale-[0.7] sm:scale-[0.8] origin-bottom-right"><LampsRow m={d.migration} /></div>
                              {allowLayout && isHovered && (<button onClick={(e) => { e.stopPropagation(); clearPlacement(mode, d.id); setHoverId(null); setHoverInfo(null); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-400 z-30 pointer-events-auto scale-75"><X size={12} /></button>)}
                            </div>
                          );
                        })}
                      </div>
                      <div className="absolute -bottom-4 left-[-12px] right-[-12px] h-4 bg-slate-500 dark:bg-slate-700 rounded-b-sm shadow-md"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ★ 隱藏的 PDF 超高畫質列印視圖 (每頁包含 2 排機櫃) ★ */}
      {isExportingPDF && (
        <div className="fixed top-[-9999px] left-[0] bg-[#0f172a] text-white z-[-1]">
          {printPages.map((pageRows, pageIndex) => (
            // w-[2800px] 強制將 DOM 撐開，確保 html2canvas 截取出高像素圖片，不擠壓文字
            <div id={`pdf-rack-page-${pageIndex}`} key={`pdf-page-${pageIndex}`} className="w-[2800px] p-16 flex flex-col justify-start bg-[#0f172a]">
              <h1 className="text-5xl font-black text-center mb-12 text-white border-b border-slate-700 pb-6">MigratePro {title} - 第 {pageIndex + 1} 頁</h1>
              <div className="flex flex-col gap-12 flex-1">
                {pageRows.map((row, rIdx) => (
                  <div key={`pdf-row-${rIdx}`} className="flex gap-8 justify-center w-full">
                    {row.map(rack => {
                      const displayName = rack.name === "不搬存放區C" ? "搬遷不上架存放區" : rack.name;
                      const isRed = rack.name.startsWith("不搬存放區") || rack.name === "新購設備存放區";
                      return (
                        <div key={`pdf-rack-${rack.id}`} className="flex flex-col bg-slate-800 rounded-xl shadow-xl border border-slate-700 flex-1">
                          <div className={`px-4 py-3 text-center text-2xl font-bold text-white truncate rounded-t-xl ${isRed ? "bg-red-800" : "bg-emerald-600"}`}>{displayName}</div>
                          <div className="p-4 bg-slate-900 rounded-b-xl flex justify-center">
                            {/* PDF 使用正常的 U_H=22 高度繪製，確保比例正確 */}
                            <div className="relative w-full border-x-[8px] border-t-[8px] border-slate-600 bg-[#0f172a] shadow-inner mb-4" style={{ height: 42 * U_H }}>
                              <div className="absolute left-0 top-0 bottom-0 w-12 bg-yellow-400/90 border-r border-slate-800 z-0" />
                              {Array.from({ length: 42 }).map((_, i) => (
                                <React.Fragment key={`p-grid-${i}`}>
                                  <div className="absolute left-0 w-12 flex items-center justify-center text-slate-900 text-[10px] font-bold z-0" style={{ bottom: i * U_H, height: U_H }}>{i + 1}</div>
                                  <div className={`absolute left-12 right-0 z-0 pointer-events-none ${i % 5 === 4 ? "bg-slate-500/80 h-[2px]" : "bg-slate-700/50 h-[1px]"}`} style={{ bottom: i * U_H + U_H }} />
                                </React.Fragment>
                              ))}
                              {listForRack(rack.id).map(d => {
                                 const { bottom, height } = getBlockStyle(d);
                                 return (
                                   <div key={`p-d-${d.id}`} className="absolute left-[2px] right-[2px] rounded-[4px] flex items-center px-4 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" style={{ bottom: bottom + 1, height: height - 2, backgroundColor: catColor(d.category) }}>
                                     <div className="flex-1 text-white pr-10">
                                       {d.sizeU >= 2 ? (
                                         <><div className="truncate w-full font-bold text-sm">{d.deviceId} | {d.name}</div><div className="truncate w-full text-xs opacity-90 mt-1">{d.brand} | {d.model}</div></>
                                       ) : (<div className="truncate w-full font-bold text-xs">{d.deviceId} | {d.name} | {d.model}</div>)}
                                     </div>
                                     <div className="absolute right-2"><LampsRow m={d.migration} /></div>
                                   </div>
                                 );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {addPlace && <AddAndPlaceModal mode={mode} rackId={addPlace.rackId} u={addPlace.u} onClose={() => setAddPlace(null)} />}
      {hoverInfo && !isExportingPDF && <HoverCard {...hoverInfo} />}
    </div>
  );
};

/* -----------------------------
  Admin Page（帳號管理）
----------------------------- */
const AdminPage = () => {
  const role = useStore((s) => s.role);
  const user = useStore((s) => s.userName);
  const accounts = useStore((s) => s.accounts);
  const upsertAccount = useStore((s) => s.upsertAccount);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const [editing, setEditing] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);

  if (role !== "admin") {
    return (<div className="p-6"><div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6"><div className="text-lg font-black text-[var(--accent)]">權限不足</div><div className="text-sm text-[var(--muted)] mt-2">此頁僅提供 Admin 使用。</div></div></div>);
  }

  const Modal = ({ title, initial, onClose }: { title: string; initial: Account; onClose: () => void; }) => {
    const [a, setA] = useState<Account>(initial);
    const isAdminAccount = a.username === "admin";
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
          <div className="p-4 md:p-6 border-b border-[var(--border)] shrink-0 flex items-center justify-between">
            <div className="text-xl font-black flex items-center gap-2"><KeyRound className="text-[var(--accent)]" /> {title}</div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button>
          </div>
          <div className="p-4 md:p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs text-[var(--muted)]">帳號</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" value={a.username} onChange={(e) => setA((p) => ({ ...p, username: e.target.value }))} disabled={!creating} />{!creating && (<div className="text-[11px] text-[var(--muted)] mt-1">編輯時不可更改帳號</div>)}</div>
            <div><label className="text-xs text-[var(--muted)]">權限</label>
              <select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={a.role} onChange={(e) => setA((p) => ({ ...p, role: e.target.value as Role }))} disabled={isAdminAccount}>
                <option value="admin">Admin</option>
                <option value="cable">Cable</option>
                <option value="vendor">Vendor</option>
              </select>
            {isAdminAccount && (<div className="text-[11px] text-[var(--muted)] mt-1">admin 必須保持 Admin</div>)}</div>
            <div className="md:col-span-2"><label className="text-xs text-[var(--muted)]">密碼</label><input type="password" className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" value={a.password} onChange={(e) => setA((p) => ({ ...p, password: e.target.value }))} /></div>
          </div>
          <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5">取消</button><button onClick={() => { const res = upsertAccount(a); if (!res.ok) return alert(res.message); onClose(); }} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 flex items-center gap-2"><Save size={16} /> 儲存</button></div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><div className="flex items-center gap-2"><Shield className="text-[var(--accent)]" /><div className="text-lg font-black">管理後台：帳號管理</div></div><div className="text-sm text-[var(--muted)] mt-2">目前登入：<span className="text-[var(--text)] font-bold">{user}</span>（Admin）</div></div>
          <button onClick={() => { setCreating(true); setEditing({ username: "", password: "", role: "vendor" }); }} className="bg-[var(--accent)] text-black px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 hover:opacity-90"><Plus size={18} /> 新增帳號</button>
        </div>
        <div className="mt-5 bg-[var(--panel2)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-[var(--muted)] text-xs uppercase tracking-wider"><tr><th className="px-4 py-3 font-semibold">帳號</th><th className="px-4 py-3 font-semibold">權限</th><th className="px-4 py-3 font-semibold">操作</th></tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {accounts.slice().sort((a, b) => a.username === "admin" ? -1 : b.username === "admin" ? 1 : a.username.localeCompare(b.username)).map((a) => (
                <tr key={a.username} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3"><div className="font-black">{a.username}</div>{a.username === "admin" && <div className="text-xs text-[var(--muted)]">admin 不能刪除</div>}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--muted)] capitalize">{a.role}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-2 flex-wrap"><button onClick={() => { setCreating(false); setEditing(a); }} className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 text-sm"><Edit3 size={16} /> 修改</button><button onClick={() => { const res = deleteAccount(a.username); if (!res.ok) return alert(res.message); }} disabled={a.username === "admin"} className={`px-3 py-2 rounded-xl border border-[var(--border)] flex items-center gap-2 text-sm ${a.username === "admin" ? "opacity-50 cursor-not-allowed" : "hover:bg-white/5 text-red-300"}`}><Trash2 size={16} /> 刪除</button></div></td>
                </tr>
              ))}
              {accounts.length === 0 && (<tr><td colSpan={3} className="px-4 py-8 text-center text-[var(--muted)]">沒有帳號資料</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <Modal title={creating ? "新增帳號" : "修改帳號"} initial={editing} onClose={() => { setEditing(null); setCreating(false); }} />}
    </div>
  );
};

/* -----------------------------
  Fullscreen helper
----------------------------- */
function useFullscreen() {
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggle = async () => { try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch {} };
  return { isFs, toggle };
}

/* -----------------------------
  Main App
----------------------------- */
export default function App() {
  useApplyTheme();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "migratePro", "mainState"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.devices) {
          const normalized = normalizeDevices(data.devices);
          useStore.setState({ devices: normalized });
          writeJson(LS.devices, normalized);
        }
        if (data.accounts) {
          useStore.setState({ accounts: data.accounts });
          writeJson(LS.accounts, data.accounts);
        }
      } else {
        const currentStore = useStore.getState();
        syncToCloud({ devices: currentStore.devices, accounts: currentStore.accounts });
      }
    });
    return () => unsub();
  }, []);

  const isAuthed = useStore((s) => s.isAuthed);
  const userName = useStore((s) => s.userName);
  const role = useStore((s) => s.role);
  const logout = useStore((s) => s.logout);
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const themeStyle = useStore((s) => s.themeStyle);
  const setThemeStyle = useStore((s) => s.setThemeStyle);
  const ui = useStore((s) => s.ui);
  const setUi = useStore((s) => s.setUi);
  const selectedDeviceId = useStore((s) => s.selectedDeviceId);
  const setSelectedDeviceId = useStore((s) => s.setSelectedDeviceId);
  const { isFs, toggle: toggleFs } = useFullscreen();

  const navItems = useMemo(() => {
    const base = [
      { id: "dashboard" as const, label: "儀表板", icon: <LayoutDashboard size={20} /> },
      { id: "devices" as const, label: "設備管理", icon: <Server size={20} /> },
      { id: "before" as const, label: "搬遷前規劃", icon: <ArrowLeftRight size={20} /> },
      { id: "after" as const, label: "搬遷後規劃", icon: <ArrowRightLeft size={20} /> },
    ];
    if (role === "admin") base.push({ id: "admin" as const, label: "管理後台", icon: <Shield size={20} /> });
    return base;
  }, [role]);

  if (!isAuthed) return <LoginPage />;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans transition-colors duration-300">
      <ThemeTokens />

      <header className="h-16 border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-black" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", boxShadow: "0 0 18px rgba(34,211,238,0.25)" }}>
            <Server size={18} />
          </div>
          <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic">Migrate<span className="text-[var(--accent)]">Pro</span></h1>
          <div className="hidden md:flex items-center gap-2 text-xs text-[var(--muted)]"><Sparkles size={14} className="text-[var(--accent)]" />機房搬遷專案管理</div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={toggleFs} className="p-2 hover:bg-white/5 rounded-xl" title={isFs ? "離開全螢幕" : "全螢幕"}>{isFs ? <Minimize size={18} /> : <Expand size={18} />}</button>
          <select value={themeStyle} onChange={(e) => setThemeStyle(e.target.value as ThemeStyle)} className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-xs px-2 py-1 outline-none hidden sm:block">
            <option value="neon">Neon</option><option value="horizon">Horizon</option><option value="nebula">Nebula</option><option value="matrix">Matrix</option>
          </select>
          <button onClick={toggleTheme} className="p-2 hover:bg-white/5 rounded-xl" title="切換深/淺色">{theme === "dark" ? "🌙" : "☀️"}</button>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-black/10">
            <User size={16} className="text-[var(--muted)]" />
            <span className="text-sm font-bold">{userName || "-"}</span>
            <span className="text-xs px-2 py-0.5 rounded-lg border border-[var(--border)] text-[var(--muted)] capitalize">{role}</span>
            <button onClick={logout} className="ml-1 p-1 rounded-lg hover:bg-white/10" title="登出"><LogOut size={16} className="text-[var(--muted)]" /></button>
          </div>
          <button onClick={logout} className="md:hidden p-2 hover:bg-white/5 rounded-xl" title="登出"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="flex">
        <nav className={`border-r border-[var(--border)] h-[calc(100vh-64px)] sticky top-16 p-4 bg-[var(--panel)] hidden lg:block transition-all ${ui.sideCollapsed ? "w-20" : "w-64"}`}>
          <div className="flex justify-end mb-3"><button onClick={() => setUi({ sideCollapsed: !ui.sideCollapsed })} className="p-2 rounded-xl hover:bg-white/5" title={ui.sideCollapsed ? "展開選單" : "收合選單"}>{ui.sideCollapsed ? <ChevronsRight /> : <ChevronsLeft />}</button></div>
          <div className="space-y-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setPage(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${page === item.id ? "bg-[var(--panel2)] text-[var(--accent)] border border-[var(--border)] shadow-[0_0_20px_rgba(34,211,238,0.1)] font-black" : "text-[var(--muted)] hover:bg-white/[0.03]"}`} title={item.label}>{item.icon}{!ui.sideCollapsed && item.label}</button>
            ))}
          </div>
        </nav>

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              {page === "dashboard" && <Dashboard />}
              {page === "devices" && <DevicesPage />}
              {page === "before" && <RackPlanner mode="before" />}
              {page === "after" && <RackPlanner mode="after" />}
              {page === "admin" && <AdminPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--panel)] border border-[var(--border)] rounded-2xl px-4 py-2 flex gap-6 shadow-2xl z-50">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setPage(item.id)} className={`p-2 rounded-lg ${page === item.id ? "text-[var(--accent)] bg-[var(--panel2)]" : "text-[var(--muted)]"}`} title={item.label}>{item.icon}</button>
        ))}
      </div>

      {selectedDeviceId && <DeviceDetailModal id={selectedDeviceId} mode={page === "after" ? "after" : "before"} onClose={() => setSelectedDeviceId(null)} />}
    </div>
  );
}