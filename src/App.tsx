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
  Globe
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
type Lang = "zh" | "en" | "ko";

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
  lang: "migrate.lang",
} as const;

/* -----------------------------
  ★ 多語系字典 (i18n) 終極擴充版 ★
----------------------------- */
const DICT = {
  zh: {
    navDashboard: "儀表板", navDevices: "設備管理", navBefore: "搬遷前 機櫃配置", navAfter: "搬遷後 機櫃配置", navAdmin: "管理後台",
    totalDevices: "設備總數", pending: "待處理", completed: "搬遷完成",
    racked: "已上架", cabled: "已接線", powered: "已開機", tested: "已測試",
    rackStatus: "搬遷後機櫃佈局現況", categoryDist: "設備類別分佈", sysTips: "系統操作提示",
    unplaced: "未放置設備", allPlaced: "全部已放置（已自動收合）",
    exportCsv: "完整CSV匯出", appendCsv: "CSV批量添加", importCsv: "完整覆蓋還原", addDevice: "新增單筆設備",
    deviceList: "設備資產清單",
    sysTipsText1: "在「設備管理」中可新增設備、匯出 CSV，Admin 可使用 CSV 進行覆蓋或批量添加。",
    sysTipsText2: "「搬遷前/後規劃」支援拖曳設備。向下滾動時，未放置面板會自動懸浮於頂部，方便跨機櫃拖放。",
    sysTipsText3: "拖曳設備進入機櫃時，會顯示藍色定位點預覽擺放位置。",
    sysTipsText4: "點擊機櫃內設備可查看詳情。Admin 與 Cable 權限可編輯 Port 備註；所有角色皆可切換搬遷後燈號。",
    sysTipsText5: "建議定期下載「完整 CSV 備份」以確保專案歷史資料安全。",
    // Table Headers
    cat: "分類", devId: "編號", name: "名稱", brand: "廠牌", model: "型號", ports: "Ports", sizeU: "U", before: "搬遷前", after: "搬遷後", status: "狀態", done: "完成", action: "操作",
    // Buttons & Status
    btnEdit: "編輯", btnClear: "清除", btnDel: "刪除", btnSave: "儲存", btnCancel: "取消", btnClose: "關閉",
    statusDone: "完成", statusUndone: "未完成",
    // Modals
    addDeviceTitle: "新增設備", editDeviceTitle: "編輯設備", addPlaceTitle: "新增設備並放置",
    fCat: "類別", fId: "設備編號", fName: "設備名稱", fBrand: "廠牌", fModel: "型號", fPorts: "Port數量", fU: "占用高度(U)", fIp: "設備IP", fSn: "序號", fNote: "Port對接備註",
    // Detail Modal
    detailTitle: "設備詳細", detailBefore: "搬遷前位置", detailAfter: "搬遷後位置", detailStatus: "搬遷狀態",
    btnSaveNote: "儲存備註", readOnly: "唯讀", onlyAfterToggle: "※ 僅在「搬遷後」頁面可切換狀態。",
    btnClearPlace: "清除本頁位置", cantLayout: "無法調整佈局",
    // Hover Card
    hoverInfo: "設備資訊", hoverBefore: "搬遷前", hoverAfter: "搬遷後",
    // Admin
    account: "帳號", role: "權限", password: "密碼", addAccount: "新增帳號", editAccount: "修改帳號",
    // Tooltips
    noDevices: "目前沒有設備", dragHere: "拖曳「完整備份 CSV」到這裡上傳", orClick: "或點擊選取檔案", template: "下載範本",
    warningImport: "⚠️ 警告：此功能會覆蓋並清空現有所有資料，請確認您上傳的是完整的備份檔。",
    warningAppend: "此功能會將 CSV 內的設備 加入到現有清單的尾端，不會覆蓋或刪除目前的任何資料。",
    expand: "展開", collapse: "收合", dragToRack: "提示：把設備拖到機櫃", noDrag: "唯讀：只能查看/切換搬遷後燈號，不能拖放",
    noUnplaced: "✅ 沒有未放置設備", langToggle: "繁中"
  },
  en: {
    navDashboard: "Dashboard", navDevices: "Devices", navBefore: "Before Rack Config", navAfter: "After Rack Config", navAdmin: "Admin Panel",
    totalDevices: "Total Devices", pending: "Pending", completed: "Completed",
    racked: "Racked", cabled: "Cabled", powered: "Powered", tested: "Tested",
    rackStatus: "Post-Migration Rack Status", categoryDist: "Device Categories", sysTips: "System Tips",
    unplaced: "Unplaced Devices", allPlaced: "All placed (Auto-collapsed)",
    exportCsv: "Export Full CSV", appendCsv: "Append CSV", importCsv: "Import CSV (Overwrite)", addDevice: "Add Device",
    deviceList: "Device Asset List",
    sysTipsText1: "Manage devices and export CSV in 'Devices'. Admins can import/append CSV.",
    sysTipsText2: "Drag and drop supported in Layout pages. Unplaced panel sticks to top while scrolling.",
    sysTipsText3: "A blue highlight will preview the placement when dragging into a rack.",
    sysTipsText4: "Click a device to view details. Admins/Cables can edit Port maps; all roles can toggle status lamps.",
    sysTipsText5: "Regularly download 'Full CSV Backup' to secure your project data.",
    cat: "Category", devId: "ID", name: "Name", brand: "Brand", model: "Model", ports: "Ports", sizeU: "U", before: "Before", after: "After", status: "Status", done: "Done", action: "Action",
    btnEdit: "Edit", btnClear: "Clear", btnDel: "Del", btnSave: "Save", btnCancel: "Cancel", btnClose: "Close",
    statusDone: "V", statusUndone: "X",
    addDeviceTitle: "Add Device", editDeviceTitle: "Edit Device", addPlaceTitle: "Add & Place",
    fCat: "Category", fId: "Device ID", fName: "Device Name", fBrand: "Brand", fModel: "Model", fPorts: "Ports", fU: "Size (U)", fIp: "IP Address", fSn: "Serial Number", fNote: "Port Map Note",
    detailTitle: "Device Details", detailBefore: "Before Position", detailAfter: "After Position", detailStatus: "Migration Status",
    btnSaveNote: "Save Note", readOnly: "Read Only", onlyAfterToggle: "※ Status can only be toggled in 'After' page.",
    btnClearPlace: "Clear Placement", cantLayout: "Cannot Layout",
    hoverInfo: "Info", hoverBefore: "Before", hoverAfter: "After",
    account: "Account", role: "Role", password: "Password", addAccount: "Add Account", editAccount: "Edit Account",
    noDevices: "No Devices", dragHere: "Drag CSV Here", orClick: "or click to select file", template: "Download Template",
    warningImport: "⚠️ Warning: This will overwrite ALL existing data. Please make sure you are uploading a full backup.",
    warningAppend: "This will append devices to the end of the current list. No existing data will be overwritten.",
    expand: "Expand", collapse: "Collapse", dragToRack: "Tip: Drag devices to the rack", noDrag: "Read-only: Cannot drag and drop",
    noUnplaced: "✅ No unplaced devices", langToggle: "EN"
  },
  ko: {
    navDashboard: "대시보드", navDevices: "장치 관리", navBefore: "이전 전 랙 구성", navAfter: "이전 후 랙 구성", navAdmin: "관리자 설정",
    totalDevices: "총 장치 수", pending: "대기 중", completed: "완료됨",
    racked: "랙 장착됨", cabled: "케이블 연결됨", powered: "전원 켜짐", tested: "테스트 완료",
    rackStatus: "마이그레이션 후 랙 상태", categoryDist: "장치 카테고리 분포", sysTips: "시스템 팁",
    unplaced: "배치되지 않은 장치", allPlaced: "모두 배치됨 (자동 축소)",
    exportCsv: "전체 CSV 내보내기", appendCsv: "CSV 일괄 추가", importCsv: "전체 복원 (CSV)", addDevice: "단일 장치 추가",
    deviceList: "장치 자산 목록",
    sysTipsText1: "장치 관리에서 장치를 추가하고 CSV를 내보낼 수 있습니다. 관리자는 CSV를 덮어쓰거나 추가할 수 있습니다.",
    sysTipsText2: "레이아웃 페이지에서 드래그 앤 드롭을 지원합니다. 스크롤 시 미배치 패널이 상단에 고정됩니다.",
    sysTipsText3: "랙으로 드래그할 때 파란색 강조 표시가 배치 위치를 미리 보여줍니다.",
    sysTipsText4: "장치를 클릭하여 세부 정보를 확인하세요. 관리자와 Cable 권한은 포트 맵을 편집할 수 있습니다.",
    sysTipsText5: "프로젝트 기록을 안전하게 보관하기 위해 정기적으로 '전체 CSV 백업'을 다운로드하세요.",
    cat: "카테고리", devId: "ID", name: "이름", brand: "브랜드", model: "모델", ports: "포트", sizeU: "U", before: "이전 전", after: "이전 후", status: "상태", done: "완료", action: "작업",
    btnEdit: "편집", btnClear: "지우기", btnDel: "삭제", btnSave: "저장", btnCancel: "취소", btnClose: "닫기",
    statusDone: "완료", statusUndone: "미완료",
    addDeviceTitle: "장치 추가", editDeviceTitle: "장치 편집", addPlaceTitle: "장치 추가 및 배치",
    fCat: "카테고리", fId: "장치 ID", fName: "장치 이름", fBrand: "브랜드", fModel: "모델", fPorts: "포트 수", fU: "크기(U)", fIp: "IP 주소", fSn: "일련번호", fNote: "포트 연결 메모",
    detailTitle: "장치 세부 정보", detailBefore: "이전 전 위치", detailAfter: "이전 후 위치", detailStatus: "마이그레이션 상태",
    btnSaveNote: "메모 저장", readOnly: "읽기 전용", onlyAfterToggle: "※ '이전 후' 페이지에서만 상태 전환 가능.",
    btnClearPlace: "현재 위치 지우기", cantLayout: "레이아웃 변경 불가",
    hoverInfo: "장치 정보", hoverBefore: "이전 전", hoverAfter: "이전 후",
    account: "계정", role: "권한", password: "비밀번호", addAccount: "계정 추가", editAccount: "계정 편집",
    noDevices: "장치 없음", dragHere: "여기로 CSV 드래그", orClick: "또는 클릭하여 파일 선택", template: "템플릿 다운로드",
    warningImport: "⚠️ 경고: 이 기능은 모든 기존 데이터를 덮어씁니다. 전체 백업 파일인지 확인하세요.",
    warningAppend: "이 기능은 장치를 현재 목록의 끝에 추가합니다. 기존 데이터는 덮어쓰지 않습니다.",
    expand: "펼치기", collapse: "접기", dragToRack: "팁: 장치를 랙으로 드래그하세요", noDrag: "읽기 전용: 드래그 앤 드롭 불가",
    noUnplaced: "✅ 미배치 장치 없음", langToggle: "한국어"
  }
};

const t = (key: keyof typeof DICT.zh, lang: Lang) => DICT[lang]?.[key] || DICT.zh[key];

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

const mockDevices: Device[] = [];

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
const canExportCSV = (_role: Role) => true;

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
  CSV 工具函式 (最穩定的 encodeURIComponent 防彈版)
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

  const csvContent = "\uFEFF" + [CSV_HEADER, ...rows].join("\n");
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `MigratePro_完整備份_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadFullCSVTemplate = () => {
  const csvContent = "\uFEFF" + CSV_HEADER + "\n";
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
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
  const csvContent = "\uFEFF" + APPEND_CSV_HEADER + "\n" + APPEND_CSV_SAMPLE + "\n";
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
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
  Theme Tokens (引入韓國 Pretendard 字型)
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
  return (
    <style>
      {`@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css");\n${css.light}\n${css.dark}`}
    </style>
  );
};

function useApplyTheme() {
  const theme = useStore((s) => s.theme);
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);
}

const catColor = (cat: DeviceCategory) => FIXED_COLORS[cat] || FIXED_COLORS.Other;

const Lamp = ({ on }: { on: boolean }) => (
  <span className="inline-block w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: on ? "rgb(0,255,0)" : "rgb(255,0,0)", boxShadow: on ? "0 0 10px rgba(0,255,0,0.85)" : "0 0 10px rgba(255,0,0,0.75)" }} />
);

const LampsRow = ({ m }: { m: MigrationFlags }) => (
  <div className="flex items-center gap-1.5"><Lamp on={m.racked} /><Lamp on={m.cabled} /><Lamp on={m.powered} /><Lamp on={m.tested} /></div>
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
  lang: Lang;
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
  setLang: (l: Lang) => void;
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
  devices: normalizeDevices(readJson<Device[]>(LS.devices, [])),

  theme: (localStorage.getItem(LS.theme) as ThemeMode) || "dark",
  themeStyle: (localStorage.getItem(LS.themeStyle) as ThemeStyle) || "neon",
  lang: (localStorage.getItem(LS.lang) as Lang) || "zh",
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
  setLang: (lang: Lang) => { localStorage.setItem(LS.lang, lang); set({ lang }); },
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
  const lang = useStore((s) => s.lang);
  
  const [portMapStr, setPortMapStr] = useState(d?.portMap || "");

  if (!d) return null;

  const beforePos = d.beforeRackId && d.beforeStartU != null && d.beforeEndU != null ? `${d.beforeRackId.replace(/^BEF_/, "")} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
  const displayAfterId = d.afterRackId === "AFT_不搬存放區C" ? t("unplaced", lang) : d.afterRackId;
  const afterPos = displayAfterId && d.afterStartU != null && d.afterEndU != null ? `${displayAfterId.replace(/^AFT_/, "")} ${d.afterStartU}-${d.afterEndU}U` : "-";
  
  const allowLayout = canManageAssets(role);
  const allowEditPort = canEditPortMap(role);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
        <div className="p-4 md:p-6 border-b border-[var(--border)] shrink-0 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-[var(--muted)]">{t("detailTitle", lang)}</div>
            <div className="text-lg font-black truncate">{d.deviceId} · {d.name}</div>
            <div className="text-sm text-[var(--muted)] truncate">{d.brand} / {d.model} · {d.ports} ports · {d.sizeU}U</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button>
        </div>
        
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]"><div className="text-xs text-[var(--muted)]">{t("detailBefore", lang)}</div><div className="font-bold mt-1">{beforePos}</div></div>
            <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]"><div className="text-xs text-[var(--muted)]">{t("detailAfter", lang)}</div><div className="font-bold mt-1">{afterPos}</div></div>
            <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)] md:col-span-2">
              <div className="text-xs text-[var(--muted)]">IP / SN</div><div className="mt-1 font-bold">{d.ip || "-"} / {d.serial || "-"}</div>
              
              <div className="flex items-center justify-between mt-3 mb-1">
                <div className="text-xs text-[var(--muted)]">{t("fNote", lang)}</div>
                {!allowEditPort && <div className="text-[10px] text-[var(--muted)] border border-[var(--border)] px-1 rounded bg-black/10">Vendor ({t("readOnly", lang)})</div>}
              </div>
              {allowEditPort ? (
                <div className="flex flex-col items-end gap-2">
                  <textarea className="w-full bg-[var(--panel)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" rows={4} value={portMapStr} onChange={e => setPortMapStr(e.target.value)} />
                  {portMapStr !== (d.portMap || "") && (
                    <button onClick={() => updateDevice(d.id, { portMap: portMapStr.trimEnd() })} className="bg-[var(--accent)] text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 flex items-center gap-1"><Save size={14} /> {t("btnSaveNote", lang)}</button>
                  )}
                </div>
              ) : (<div className="mt-1 whitespace-pre-wrap break-words">{d.portMap || "-"}</div>)}
            </div>
          </div>
          <div className="mt-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
            <div className="flex items-center justify-between"><div className="font-black">{t("detailStatus", lang)}</div><LampsRow m={d.migration} /></div>
            {mode === "after" ? (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between"><div className="text-sm">{t("racked", lang)}</div><Switch on={d.migration.racked} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { racked: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">{t("cabled", lang)}</div><Switch on={d.migration.cabled} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { cabled: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">{t("powered", lang)}</div><Switch on={d.migration.powered} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { powered: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">{t("tested", lang)}</div><Switch on={d.migration.tested} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { tested: v })} disabled={!canToggleFlags(role)} /></div>
              </div>
            ) : (<div className="text-xs text-[var(--muted)] mt-3">{t("onlyAfterToggle", lang)}</div>)}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-between items-center">
          {allowLayout ? (<button onClick={() => { if (confirm("Are you sure?")) clearPlacement(mode, d.id); onClose(); }} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-xs md:text-sm">{t("btnClearPlace", lang)}</button>) : (<div className="text-xs text-[var(--muted)]">{role === "cable" ? "Cable" : "Vendor"}：{t("cantLayout", lang)}</div>)}
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90">{t("btnClose", lang)}</button>
        </div>
      </motion.div>
    </div>
  );
}

function DeviceModal({ title, initial, onClose, onSave }: { title: string; initial: DeviceDraft; onClose: () => void; onSave: (d: DeviceDraft) => void; }) {
  const lang = useStore((s) => s.lang);
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
          <form id="device-form" className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); if (!d.deviceId.trim() || !d.name.trim()) return alert("Error"); onSave({ ...d, ports: Number(d.ports) || 0, sizeU: Math.max(1, Math.min(42, Number(d.sizeU) || 1)), portMap: (d.portMap ?? "").trimEnd() }); }}>
            <div><label className="text-xs text-[var(--muted)]">{t("fCat", lang)}</label><select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.category} onChange={input("category") as any}>{(["Network", "Storage", "Server", "Other"] as DeviceCategory[]).map((x) => (<option key={x} value={x}>{x}</option>))}</select></div>
            <div><label className="text-xs text-[var(--muted)]">{t("fId", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" value={d.deviceId} onChange={input("deviceId")} placeholder="EX: SW-01" /></div>
            <div><label className="text-xs text-[var(--muted)]">{t("fName", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" value={d.name} onChange={input("name")} /></div>
            <div><label className="text-xs text-[var(--muted)]">{t("fBrand", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.brand} onChange={input("brand")} /></div>
            <div><label className="text-xs text-[var(--muted)]">{t("fModel", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.model} onChange={input("model")} /></div>
            <div><label className="text-xs text-[var(--muted)]">{t("fPorts", lang)}</label><input type="number" min={0} className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.ports} onChange={(e) => setD((p) => ({ ...p, ports: Number(e.target.value) || 0 }))} /></div>
            <div><label className="text-xs text-[var(--muted)]">{t("fU", lang)}</label><input type="number" min={1} max={42} className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.sizeU} onChange={(e) => setD((p) => ({ ...p, sizeU: Number(e.target.value) || 1 }))} /></div>
            <div><label className="text-xs text-[var(--muted)]">{t("fIp", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.ip ?? ""} onChange={input("ip")} placeholder="10.0.0.10" /></div>
            <div><label className="text-xs text-[var(--muted)]">{t("fSn", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={d.serial ?? ""} onChange={input("serial")} /></div>
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--muted)]">{t("fNote", lang)}</label>
              <textarea className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none min-h-[140px] whitespace-pre" value={d.portMap ?? ""} onChange={(e) => { setD((p) => ({ ...p, portMap: e.target.value })); }} placeholder={"例：\n01/40U | Gi1/0/1 -> FW\nA1/20U | ETH1 -> TOR"} />
            </div>
          </form>
        </div>

        <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5">{t("btnCancel", lang)}</button>
          <button type="submit" form="device-form" className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90">{t("btnSave", lang)}</button>
        </div>
      </motion.div>
    </div>
  );
}

/* -----------------------------
  Dashboard 輪播機櫃 
----------------------------- */
const DashboardFullCarousel = ({ devices, racks }: { devices: Device[]; racks: Rack[] }) => {
  const [page, setPage] = useState(0);
  const lang = useStore((s) => s.lang);
  const p1 = useMemo(() => racks.filter((r) => r.id.includes("AFT_A") || r.id.includes("AFT_B")), [racks]);
  const p2 = useMemo(() => racks.filter((r) => !r.id.includes("AFT_A") && !r.id.includes("AFT_B")), [racks]);
  
  useEffect(() => {
    const timer = setInterval(() => setPage((v) => (v + 1) % 2), 10000);
    return () => clearInterval(timer);
  }, []);

  const curRacks = page === 0 ? p1 : p2;

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
    <div className="bg-[var(--panel)] border border-[var(--border)] p-4 md:p-6 rounded-2xl shadow-xl flex flex-col w-full lg:col-span-2">
      <div className="flex w-full justify-between items-center mb-4">
        <h3 className="text-xl font-black flex items-center gap-2"><Network className="text-[var(--accent)]" /> {t("rackStatus", lang)} ({page === 0 ? "1/2" : "2/2"})</h3>
        <div className="flex gap-2">
          <button onClick={() => setPage(0)} className={`w-3 h-3 rounded-full transition-all ${page === 0 ? "bg-[var(--accent)] scale-110" : "bg-[var(--border)]"}`} />
          <button onClick={() => setPage(1)} className={`w-3 h-3 rounded-full transition-all ${page === 1 ? "bg-[var(--accent)] scale-110" : "bg-[var(--border)]"}`} />
        </div>
      </div>
      
      <div className="flex gap-1.5 md:gap-2 lg:gap-3 overflow-x-auto w-full flex-1 min-h-[500px] xl:min-h-[600px] pb-2 scrollbar-hide snap-x">
        {curRacks.map(rack => {
          const rackDevs = devices.filter(d => d.afterRackId === rack.id && d.afterStartU != null && d.afterEndU != null);
          const isRed = rack.name.startsWith("不搬存放區");
          let displayName = rack.name;
          if (displayName === "不搬存放區C") displayName = t("unplaced", lang);

          return (
            <div key={rack.id} className="flex flex-col bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 snap-center border border-slate-700 min-w-[120px] lg:min-w-0 flex-1">
              <div className={`px-1 py-2 text-center text-xs xl:text-sm font-bold text-white truncate ${isRed ? "bg-red-800" : "bg-emerald-600"}`} title={displayName}>{displayName}</div>
              
              <div className="relative w-full border-x-[4px] xl:border-x-[6px] border-t-[4px] xl:border-t-[6px] border-slate-600 bg-[#0b1220] shadow-inner flex-1">
                <div className="absolute inset-0 pointer-events-none z-10">
                  {rackDevs.map(d => {
                    const style = getPctStyle(d);
                    return (
                      <div key={d.id} className="absolute left-[2px] right-[2px] rounded flex flex-row justify-between items-center pl-1.5 md:pl-2 overflow-hidden shadow-md"
                           style={{ ...style, backgroundColor: catColor(d.category), backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)" }}>
                        
                        <div className="flex-1 text-[9px] xl:text-[11px] 2xl:text-[13px] text-white font-medium truncate text-left drop-shadow-md pr-1" title={d.deviceId}>{d.deviceId}</div>
                        
                        <div className="flex shrink-0 items-center bg-black/40 rounded-md shadow-inner p-1 mr-1 transform origin-right scale-[0.55] xl:scale-[0.65]">
                          <LampsRow m={d.migration} />
                        </div>
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
  Dashboard
----------------------------- */
const Dashboard = () => {
  const devices = useStore((s) => s.devices);
  const afterRacks = useStore((s) => s.afterRacks);
  const lang = useStore((s) => s.lang);
  
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
          <div className="text-lg md:text-xl font-extrabold text-[var(--muted)] mb-2">{t("totalDevices", lang)}</div>
          <div className="text-5xl font-black text-[var(--accent)]">{total}</div>
        </div>
        <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1">
            <div className="text-lg md:text-xl font-extrabold text-[var(--muted)]">{t("pending", lang)}</div>
            <div className="text-sm font-bold text-red-500 opacity-90">{calcPct(pending)}%</div>
          </div>
          <div className="text-4xl font-black text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]">{pending}</div>
          <div className="mt-3 w-full h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${calcPct(pending)}%` }} />
          </div>
        </div>
        <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1">
            <div className="text-lg md:text-xl font-extrabold text-[var(--muted)]">{t("completed", lang)}</div>
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
        {[
          { label: t("racked", lang), val: racked }, 
          { label: t("cabled", lang), val: cabled }, 
          { label: t("powered", lang), val: powered }, 
          { label: t("tested", lang), val: tested }
        ].map((item, idx) => (
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

      <DashboardFullCarousel devices={devices} racks={afterRacks} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl flex flex-col h-[320px]">
          <h3 className="text-lg font-black mb-2">{t("categoryDist", lang)}</h3>
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
          <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Sparkles className="text-[var(--accent)]" /> {t("sysTips", lang)}</h3>
          <ul className="text-sm text-[var(--muted)] space-y-3 flex-1">
            <li className="flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />{t("sysTipsText1", lang)}</li>
            <li className="flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />{t("sysTipsText2", lang)}</li>
            <li className="flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />{t("sysTipsText3", lang)}</li>
            <li className="flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />{t("sysTipsText4", lang)}</li>
            <li className="flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />{t("sysTipsText5", lang)}</li>
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
  const lang = useStore((s) => s.lang);
  const [drag, setDrag] = useState(false);
  const handleFile = async (file: File) => {
    const text = await file.text(); const res = importFullCSV(text);
    if (!res.ok) alert(res.message || "匯入失敗"); else onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
        <div className="p-6 shrink-0 border-b border-[var(--border)]">
          <div className="flex items-center justify-between"><div className="text-xl font-black">{t("importCsv", lang)}</div><button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button></div>
          <div className="mt-3 text-sm text-[var(--muted)] text-red-400">{t("warningImport", lang)}</div>
          <div className="mt-4 flex gap-2 flex-wrap"><button onClick={downloadFullCSVTemplate} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2"><Download size={16} /> {t("template", lang)}</button></div>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <label onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDrag(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }} className={`block w-full rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${drag ? "border-[var(--accent)] bg-white/5" : "border-[var(--border)] bg-black/10"}`}>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))" }}><Upload className="text-black" /></div>
              <div className="font-black">{t("dragHere", lang)}</div><div className="text-xs text-[var(--muted)]">{t("orClick", lang)}</div>
            </div>
          </label>
        </div>
      </motion.div>
    </div>
  );
}

function AppendCSVImportModal({ onClose }: { onClose: () => void }) {
  const appendDevicesFromCSV = useStore((s) => s.appendDevicesFromCSV);
  const lang = useStore((s) => s.lang);
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
            <div className="text-xl font-black flex items-center gap-2 text-[var(--accent)]"><FilePlus /> {t("appendCsv", lang)}</div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button>
          </div>
          <div className="mt-3 text-sm text-[var(--text)]">{t("warningAppend", lang)}</div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button onClick={downloadAppendCSVTemplate} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2"><Download size={16} /> {t("template", lang)}</button>
          </div>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <label onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDrag(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }} className={`block w-full rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${drag ? "border-[var(--accent)] bg-white/5" : "border-[var(--border)] bg-black/10"}`}>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--accent2),var(--accent))" }}><Plus className="text-black" size={24} /></div>
              <div className="font-black">{t("dragHere", lang)}</div><div className="text-xs text-[var(--muted)]">{t("orClick", lang)}</div>
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
  const lang = useStore((s) => s.lang);

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
    const getAfter = (d: Device) => d.afterRackId && d.afterStartU != null ? `${(d.afterRackId === "AFT_不搬存放區C" ? t("unplaced", lang) : d.afterRackId).replace(/^AFT_/, "")}-${d.afterStartU}` : "";
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
  }, [devices, sortKey, sortDir, lang]);

  const Th = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean; }) => (
    <th className={`px-4 py-4 font-semibold ${right ? "text-right" : ""}`}>
      <button onClick={() => sortToggle(k)} className="inline-flex items-center gap-2 hover:text-[var(--accent)] whitespace-nowrap" title="Sort">
        {children} <span className="text-[10px] opacity-70">{sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-3 justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-[var(--accent)]">{t("deviceList", lang)}</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => canExportCSV(role) && downloadFullCSV(devices)} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] hover:text-black transition-colors flex items-center gap-2 font-bold"><Download size={16} /> {t("exportCsv", lang)}</button>

          {allowManage && (
            <>
              <button onClick={() => setAppendOpen(true)} className="px-4 py-2 rounded-xl border border-[var(--accent2)] text-[var(--accent2)] hover:bg-white/5 flex items-center gap-2 font-bold">
                <FilePlus size={16} /> {t("appendCsv", lang)}
              </button>
              <button onClick={() => setImportOpen(true)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-white/5 flex items-center gap-2 text-xs">
                <Upload size={14} /> {t("importCsv", lang)}
              </button>
              <button onClick={() => setIsAdding(true)} className="bg-[var(--accent)] text-black px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 hover:opacity-90">
                <Plus size={18} /> {t("addDevice", lang)}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl overflow-hidden overflow-x-auto shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/20 text-[var(--muted)] text-xs uppercase tracking-wider">
            <tr>
              <Th k="category">{t("cat", lang)}</Th><Th k="deviceId">{t("devId", lang)}</Th><Th k="name">{t("name", lang)}</Th><Th k="brand">{t("brand", lang)}</Th>
              <Th k="model">{t("model", lang)}</Th><Th k="ports">{t("ports", lang)}</Th><Th k="sizeU">{t("sizeU", lang)}</Th><Th k="before">{t("before", lang)}</Th>
              <Th k="after">{t("after", lang)}</Th><Th k="migration">{t("status", lang)}</Th><Th k="complete">{t("done", lang)}</Th>
              <th className="px-4 py-4 font-semibold text-right whitespace-nowrap">{t("action", lang)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.map((d) => {
              const before = d.beforeRackId && d.beforeStartU != null ? `${d.beforeRackId.replace(/^BEF_/, "")} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
              const displayAfterId = d.afterRackId === "AFT_不搬存放區C" ? t("unplaced", lang) : d.afterRackId;
              const after = displayAfterId && d.afterStartU != null ? `${displayAfterId.replace(/^AFT_/, "")} ${d.afterStartU}-${d.afterEndU}U` : "-";
              const done = isMigratedComplete(d.migration);

              return (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-[10px] font-extrabold px-2 py-1 rounded-md border whitespace-nowrap" style={{ color: "var(--onColor)", borderColor: "rgba(255,255,255,0.35)", backgroundColor: catColor(d.category) }}>{d.category}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap"><div className="font-black text-sm whitespace-nowrap">{d.deviceId}</div></td>
                  <td className="px-4 py-4 whitespace-nowrap"><button onClick={() => useStore.getState().setSelectedDeviceId(d.id)} className="text-sm text-[var(--muted)] hover:text-[var(--accent)] font-semibold whitespace-nowrap" title="Detail">{d.name}</button></td>
                  <td className="px-4 py-4 text-xs text-[var(--text)] whitespace-nowrap">{d.brand}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{d.model}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{d.ports}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{d.sizeU}U</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{before}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{after}</td>
                  <td className="px-4 py-4 whitespace-nowrap"><LampsRow m={d.migration} /></td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-xs font-extrabold px-2 py-1 rounded-lg border" style={{ borderColor: done ? "rgba(0,255,0,0.45)" : "rgba(255,0,0,0.45)", color: done ? "rgb(0,255,0)" : "rgb(255,0,0)", background: done ? "rgba(0,255,0,0.06)" : "rgba(255,0,0,0.06)" }}>{done ? t("statusDone", lang) : t("statusUndone", lang)}</span></td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {allowManage ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(d)} className="p-2 hover:bg-white/10 rounded-lg text-[var(--accent)]"><Edit3 size={16} /></button>
                        <button onClick={() => { clearPlacement("before", d.id); clearPlacement("after", d.id); }} className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs hover:bg-white/5 whitespace-nowrap">{t("btnClear", lang)}</button>
                        <button onClick={() => { if (confirm(`Delete ${d.deviceId}?`)) deleteDeviceById(d.id); }} className="p-2 hover:bg-white/10 rounded-lg text-red-400"><Trash2 size={16} /></button>
                      </div>
                    ) : (<div className="text-xs text-[var(--muted)]">-</div>)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (<tr><td colSpan={12} className="px-6 py-10 text-center text-[var(--muted)]">{t("noDevices", lang)}</td></tr>)}
          </tbody>
        </table>
      </div>

      {importOpen && <FullCSVImportModal onClose={() => setImportOpen(false)} />}
      {appendOpen && <AppendCSVImportModal onClose={() => setAppendOpen(false)} />}
      {isAdding && (<DeviceModal title={t("addDeviceTitle", lang)} initial={{ category: "Other", deviceId: "", name: "", brand: "", model: "", ports: 8, sizeU: 1, ip: "", serial: "", portMap: "" }} onClose={() => setIsAdding(false)} onSave={(d) => { addDevice(d); setIsAdding(false); }} />)}
      {editing && (<DeviceModal title={t("editDeviceTitle", lang)} initial={{ category: editing.category, deviceId: editing.deviceId, name: editing.name, brand: editing.brand, model: editing.model, ports: editing.ports, sizeU: editing.sizeU, ip: editing.ip ?? "", serial: editing.serial ?? "", portMap: editing.portMap ?? "" }} onClose={() => setEditing(null)} onSave={(d) => { updateDevice(editing.id, d); setEditing(null); }} />)}
    </div>
  );
};

/* -----------------------------
  Hover Card (tooltip)
----------------------------- */
function HoverCard({ x, y, d, beforePos, afterPos }: { x: number; y: number; d: Device; beforePos: string; afterPos: string; }) {
  const lang = useStore((s) => s.lang);
  return (
    <div className="fixed z-[9999] pointer-events-none" style={{ left: x + 16, top: y + 16 }}>
      <div 
        className="rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-[320px] p-4 text-left text-white"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] text-gray-300 font-medium">{t("hoverInfo", lang)}</div>
            <div className="font-black text-sm truncate text-white">{d.deviceId} · {d.name}</div>
            <div className="text-[11px] text-gray-300 truncate mt-0.5">{d.brand} / {d.model} · {d.sizeU}U · {d.ports} ports</div>
          </div>
          <div className="pt-1"><LampsRow m={d.migration} /></div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/10 p-2"><div className="text-[10px] text-gray-400">{t("hoverBefore", lang)}</div><div className="font-bold truncate text-white">{beforePos}</div></div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-2"><div className="text-[10px] text-gray-400">{t("hoverAfter", lang)}</div><div className="font-bold truncate text-white">{afterPos}</div></div>
        </div>
        <div className="mt-3 text-[11px] text-gray-400 truncate">IP：{d.ip || "-"}　SN：{d.serial || "-"}</div>
      </div>
    </div>
  );
}

function UnplacedPanel({ mode, unplaced, collapsed, setCollapsed, allowLayout }: { mode: PlacementMode; unplaced: Device[]; collapsed: boolean; setCollapsed: (v: boolean) => void; allowLayout: boolean; }) {
  const setDraggingDevice = useStore(s => s.setDraggingDevice);
  const lang = useStore(s => s.lang);
  useEffect(() => { if (unplaced.length === 0 && !collapsed) setCollapsed(true); }, [unplaced.length]);

  const isSticky = unplaced.length > 0 && !collapsed;

  return (
    <div className={`border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden mb-6 transition-all duration-300 ${isSticky ? "sticky top-[80px] z-[40] bg-[var(--panel)]/95 backdrop-blur-xl" : "bg-[var(--panel)]"}`}>
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-black">{t("unplaced", lang)}</div>
          <div className="text-xs text-[var(--muted)]">{unplaced.length === 0 ? t("allPlaced", lang) : `${unplaced.length}`}</div>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 text-sm">
          {collapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />} {collapsed ? t("expand", lang) : t("collapse", lang)}
        </button>
      </div>
      {!collapsed && (
        <div className="p-4">
          {unplaced.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {unplaced.map((d) => (
                <div
                  key={d.id} draggable={allowLayout}
                  onDragStart={(ev) => { if (!allowLayout) return; ev.dataTransfer.setData("text/plain", d.id); setDraggingDevice(d); ev.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => setDraggingDevice(null)}
                  className={`min-w-[240px] p-3 rounded-xl shadow-md border border-white/10 transition-all ${allowLayout ? "cursor-grab active:cursor-grabbing hover:brightness-110 hover:scale-[1.02]" : "cursor-not-allowed opacity-90"}`}
                  style={{ backgroundColor: catColor(d.category), backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.15) 100%)", color: "white" }}
                  title={allowLayout ? t("dragToRack", lang) : t("noDrag", lang)}
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
          ) : (<div className="text-sm text-[var(--muted)]">{t("noUnplaced", lang)}</div>)}
        </div>
      )}
    </div>
  );
}

function AddAndPlaceModal({ mode, rackId, u, onClose }: { mode: PlacementMode; rackId: string; u: number; onClose: () => void; }) {
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);
  const addDevice = useStore((s) => s.addDevice);
  const place = useStore((s) => s.place);
  if (role !== "admin") return null;
  const initial: DeviceDraft = { category: "Other", deviceId: "", name: "", brand: "", model: "", ports: 8, sizeU: 1, ip: "", serial: "", portMap: "" };
  const displayName = rackId === "AFT_不搬存放區C" ? t("unplaced", lang) : rackId.replace(/^(BEF_|AFT_)/, "");
  return (
    <DeviceModal title={`${t("addPlaceTitle", lang)}：${displayName} / ${u}U`} initial={initial} onClose={onClose} onSave={(d) => { const id = addDevice(d); const res = place(mode, id, rackId, u); if (!res.ok) alert(res.message); onClose(); }} />
  );
}

/* -----------------------------
  Rack Planner 
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
  const lang = useStore((s) => s.lang);
  const draggingDevice = useStore((s) => s.draggingDevice);
  const setDraggingDevice = useStore((s) => s.setDraggingDevice);

  const allowLayout = canManageAssets(role);

  type HoverInfo = { x: number; y: number; d: Device; beforePos: string; afterPos: string };
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [addPlace, setAddPlace] = useState<{ rackId: string; u: number } | null>(null);
  const [dragHover, setDragHover] = useState<{ rackId: string, u: number } | null>(null);

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

  const title = mode === "before" ? t("navBefore", lang) : t("navAfter", lang);

  return (
    <div className="p-6 relative">
      <div className="flex flex-wrap items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3 text-[var(--text)]"><ArrowRightLeft className="text-[var(--accent)]" /> {title}</h2>
        </div>
        <div className="flex gap-3 bg-[var(--panel)] p-2.5 rounded-xl border border-[var(--border)] shadow-sm text-xs font-bold shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Network }}></div> Network</div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Server }}></div> Server</div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Storage }}></div> Storage</div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Other }}></div> Other</div>
        </div>
      </div>

      <UnplacedPanel mode={mode} unplaced={unplaced} collapsed={collapsed} setCollapsed={setCollapsed} allowLayout={allowLayout} />

      <div className="space-y-8 overflow-hidden">
        {rackRows.map((row, idx) => (
          <div key={idx} className="flex gap-6 overflow-x-auto pb-4 items-start snap-x">
            {row.map((rack) => {
              let displayName = rack.name;
              if (displayName === "不搬存放區C") displayName = t("unplaced", lang);
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
                          const dAfterId = d.afterRackId === "AFT_不搬存放區C" ? t("unplaced", lang) : d.afterRackId;
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
      {addPlace && <AddAndPlaceModal mode={mode} rackId={addPlace.rackId} u={addPlace.u} onClose={() => setAddPlace(null)} />}
      {hoverInfo && <HoverCard {...hoverInfo} />}
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
  const lang = useStore((s) => s.lang);
  const [editing, setEditing] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);

  if (role !== "admin") return null;

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
            <div><label className="text-xs text-[var(--muted)]">{t("account", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" value={a.username} onChange={(e) => setA((p) => ({ ...p, username: e.target.value }))} disabled={!creating} /></div>
            <div><label className="text-xs text-[var(--muted)]">{t("role", lang)}</label>
              <select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none" value={a.role} onChange={(e) => setA((p) => ({ ...p, role: e.target.value as Role }))} disabled={isAdminAccount}>
                <option value="admin">Admin</option>
                <option value="cable">Cable</option>
                <option value="vendor">Vendor</option>
              </select></div>
            <div className="md:col-span-2"><label className="text-xs text-[var(--muted)]">{t("password", lang)}</label><input type="password" className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" value={a.password} onChange={(e) => setA((p) => ({ ...p, password: e.target.value }))} /></div>
          </div>
          <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5">{t("btnCancel", lang)}</button><button onClick={() => { const res = upsertAccount(a); if (!res.ok) return alert(res.message); onClose(); }} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 flex items-center gap-2"><Save size={16} /> {t("btnSave", lang)}</button></div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><div className="flex items-center gap-2"><Shield className="text-[var(--accent)]" /><div className="text-lg font-black">{t("navAdmin", lang)}</div></div></div>
          <button onClick={() => { setCreating(true); setEditing({ username: "", password: "", role: "vendor" }); }} className="bg-[var(--accent)] text-black px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 hover:opacity-90"><Plus size={18} /> {t("addAccount", lang)}</button>
        </div>
        <div className="mt-5 bg-[var(--panel2)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-[var(--muted)] text-xs uppercase tracking-wider"><tr><th className="px-4 py-3 font-semibold">{t("account", lang)}</th><th className="px-4 py-3 font-semibold">{t("role", lang)}</th><th className="px-4 py-3 font-semibold">{t("action", lang)}</th></tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {accounts.slice().sort((a, b) => a.username === "admin" ? -1 : b.username === "admin" ? 1 : a.username.localeCompare(b.username)).map((a) => (
                <tr key={a.username} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3"><div className="font-black">{a.username}</div></td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--muted)] capitalize">{a.role}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-2 flex-wrap"><button onClick={() => { setCreating(false); setEditing(a); }} className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 text-sm"><Edit3 size={16} /> {t("btnEdit", lang)}</button><button onClick={() => { const res = deleteAccount(a.username); if (!res.ok) return alert(res.message); }} disabled={a.username === "admin"} className={`px-3 py-2 rounded-xl border border-[var(--border)] flex items-center gap-2 text-sm ${a.username === "admin" ? "opacity-50 cursor-not-allowed" : "hover:bg-white/5 text-red-300"}`}><Trash2 size={16} /> {t("btnDel", lang)}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <Modal title={creating ? t("addAccount", lang) : t("editAccount", lang)} initial={editing} onClose={() => { setEditing(null); setCreating(false); }} />}
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
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const ui = useStore((s) => s.ui);
  const setUi = useStore((s) => s.setUi);
  const selectedDeviceId = useStore((s) => s.selectedDeviceId);
  const setSelectedDeviceId = useStore((s) => s.setSelectedDeviceId);
  const { isFs, toggle: toggleFs } = useFullscreen();

  const navItems = useMemo(() => {
    const base = [
      { id: "dashboard" as const, label: t("navDashboard", lang), icon: <LayoutDashboard size={20} /> },
      { id: "devices" as const, label: t("navDevices", lang), icon: <Server size={20} /> },
      { id: "before" as const, label: t("navBefore", lang), icon: <ArrowLeftRight size={20} /> },
      { id: "after" as const, label: t("navAfter", lang), icon: <ArrowRightLeft size={20} /> },
    ];
    if (role === "admin") base.push({ id: "admin" as const, label: t("navAdmin", lang), icon: <Shield size={20} /> });
    return base;
  }, [role, lang]);

  if (!isAuthed) return <LoginPage />;

  return (
    <div 
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300"
      style={{ fontFamily: lang === 'ko' ? '"Pretendard", sans-serif' : undefined }}
    >
      <ThemeTokens />

      <header className="h-16 border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-black" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", boxShadow: "0 0 18px rgba(34,211,238,0.25)" }}>
            <Server size={18} />
          </div>
          <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic">Migrate<span className="text-[var(--accent)]">Pro</span></h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={toggleFs} className="p-2 hover:bg-white/5 rounded-xl" title="Full Screen">{isFs ? <Minimize size={18} /> : <Expand size={18} />}</button>
          
          <button 
            onClick={() => {
              if (lang === "zh") setLang("en");
              else if (lang === "en") setLang("ko");
              else setLang("zh");
            }} 
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--panel2)] border border-[var(--border)] hover:bg-white/5 transition-colors"
            title="Switch Language"
          >
            <Globe size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-bold w-9 text-center text-[var(--text)]">
              {t("langToggle", lang)}
            </span>
          </button>

          <select value={themeStyle} onChange={(e) => setThemeStyle(e.target.value as ThemeStyle)} className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-xs px-2 py-1 outline-none hidden md:block">
            <option value="neon">Neon</option><option value="horizon">Horizon</option><option value="nebula">Nebula</option><option value="matrix">Matrix</option>
          </select>
          <button onClick={toggleTheme} className="p-2 hover:bg-white/5 rounded-xl" title="Dark/Light Mode">{theme === "dark" ? "🌙" : "☀️"}</button>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-black/10">
            <User size={16} className="text-[var(--muted)]" />
            <span className="text-sm font-bold">{userName || "-"}</span>
            <span className="text-xs px-2 py-0.5 rounded-lg border border-[var(--border)] text-[var(--muted)] capitalize">{role}</span>
            <button onClick={logout} className="ml-1 p-1 rounded-lg hover:bg-white/10" title="Logout"><LogOut size={16} className="text-[var(--muted)]" /></button>
          </div>
          <button onClick={logout} className="md:hidden p-2 hover:bg-white/5 rounded-xl" title="Logout"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="flex">
        <nav className={`border-r border-[var(--border)] h-[calc(100vh-64px)] sticky top-16 p-4 bg-[var(--panel)] hidden lg:block transition-all ${ui.sideCollapsed ? "w-20" : "w-64"}`}>
          <div className="flex justify-end mb-3"><button onClick={() => setUi({ sideCollapsed: !ui.sideCollapsed })} className="p-2 rounded-xl hover:bg-white/5">{ui.sideCollapsed ? <ChevronsRight /> : <ChevronsLeft />}</button></div>
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