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
  Globe,
  Link2
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
type DeviceCategory = "Network" | "Storage" | "Server" | "Accessory" | "Other";
type PlacementMode = "before" | "after";

type Role = "admin" | "vendor" | "cable";
type Lang = "zh" | "en" | "ko";

type MigrationFlags = { racked: boolean; cabled: boolean; powered: boolean; tested: boolean; };

type Rack = { id: string; name: string; units: number };

type Connection = {
  id: string;
  localPort: string;
  targetId: string;
  targetPort: string;
};

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
  connections: Connection[];

  beforeRackId?: string;
  beforeStartU?: number;
  beforeEndU?: number;

  afterRackId?: string;
  afterStartU?: number;
  afterEndU?: number;

  migration: MigrationFlags;
};

type DeviceDraft = Omit<Device, "id" | "beforeRackId" | "beforeStartU" | "beforeEndU" | "afterRackId" | "afterStartU" | "afterEndU" | "migration">;

type UiState = { sideCollapsed: boolean; unplacedCollapsedBefore: boolean; unplacedCollapsedAfter: boolean; };

type LoginResult = { ok: boolean; message?: string };
type Account = { username: string; password: string; role: Role; };

/* -----------------------------
  LocalStorage Keys
----------------------------- */
const LS = {
  theme: "migrate.theme", themeStyle: "migrate.themeStyle", devices: "migrate.devices",
  ui: "migrate.ui", auth: "migrate.auth", user: "migrate.user", accounts: "migrate.accounts", lang: "migrate.lang",
} as const;

/* -----------------------------
  ★ 多語系字典 (i18n) ★
----------------------------- */
const DICT = {
  zh: {
    navDashboard: "儀表板", navDevices: "設備管理", navBefore: "搬遷前 機櫃配置", navAfter: "搬遷後 機櫃配置", navAdmin: "管理後台",
    totalDevices: "設備總數", pending: "待處理", completed: "搬遷完成",
    racked: "已上架", cabled: "已接線", powered: "已開機", tested: "已測試",
    rackStatus: "搬遷後機櫃佈局現況", categoryDist: "設備類別分佈", sysTips: "系統操作提示",
    unplaced: "未放置設備", allPlaced: "全部已放置（已自動收合）",
    exportCsv: "完整CSV匯出", appendCsv: "CSV批量添加", importCsv: "完整覆蓋還原", addDevice: "新增單筆設備",
    deviceList: "設備資產清單", exportLabels: "匯出線路標籤",
    sysTipsText1: "在「設備管理」可新增設備。Accessory (層板/配件) 不會計入搬遷進度。",
    sysTipsText2: "在編輯設備時可建立「線路對接表」，系統會自動計算對應的機櫃與U數標籤。",
    sysTipsText3: "點擊「匯出線路標籤」即可下載標籤機專用的 CSV，供現場接線使用。",
    sysTipsText4: "在機櫃圖點開設備，Admin/Cable 可直接編輯線路與備註，享受絲滑體驗。",
    sysTipsText5: "建議定期下載「完整 CSV 備份」以確保專案歷史資料安全。",
    cat: "分類", devId: "編號", name: "名稱", brand: "廠牌", model: "型號", ports: "Ports", sizeU: "U", before: "搬遷前", after: "搬遷後", status: "狀態", done: "完成", action: "操作", connections: "線路",
    btnEdit: "編輯", btnClear: "清除", btnDel: "刪除", btnSave: "儲存", btnCancel: "取消", btnClose: "關閉", btnSaveChanges: "儲存變更",
    statusDone: "完成", statusUndone: "未完成",
    addDeviceTitle: "新增設備", editDeviceTitle: "編輯設備", addPlaceTitle: "新增設備並放置",
    fCat: "類別", fId: "設備編號", fName: "設備名稱", fBrand: "廠牌", fModel: "型號", fPorts: "Port數量", fU: "占用高度(U)", fIp: "設備IP", fSn: "序號", fNote: "一般備註",
    detailTitle: "設備詳細", detailBefore: "搬遷前位置", detailAfter: "搬遷後位置", detailStatus: "搬遷狀態",
    readOnly: "唯讀", onlyAfterToggle: "※ 僅在「搬遷後」頁面可切換狀態。",
    btnClearPlace: "清除本頁位置", cantLayout: "無法調整佈局", accessoryNoLamp: "※ 配件類別 (Accessory) 無須追蹤搬遷狀態",
    hoverInfo: "設備資訊", hoverBefore: "搬遷前", hoverAfter: "搬遷後",
    account: "帳號", role: "權限", password: "密碼", addAccount: "新增帳號", editAccount: "修改帳號",
    noDevices: "目前沒有設備", dragHere: "拖曳「完整備份 CSV」到這裡上傳", orClick: "或點擊選取檔案", template: "下載範本",
    warningImport: "⚠️ 警告：此功能會覆蓋並清空現有所有資料，請確認您上傳的是完整的備份檔。",
    warningAppend: "此功能會將 CSV 內的設備 加入到現有清單的尾端，不會覆蓋或刪除目前的任何資料。",
    expand: "展開", collapse: "收合", dragToRack: "提示：把設備拖到機櫃", noDrag: "唯讀：只能查看/切換搬遷後燈號，不能拖放", noUnplaced: "✅ 沒有未放置設備", langToggle: "繁中",
    cableRouting: "智慧線路對接表", autoGenLabels: "動態標籤預覽", addConnection: "新增對接",
    localPort: "本機 Port", targetDevice: "目標設備", selectDevice: "選擇目標設備...", targetPort: "目標 Port", unknownDev: "未知設備",
    lblSrcDev: "來源設備", lblTgtDev: "目的設備", lblBefSrc: "搬遷前-來源標籤", lblBefTgt: "搬遷前-目的標籤", lblAftSrc: "搬遷後-來源標籤", lblAftTgt: "搬遷後-目的標籤",
    rackNewDevice: "新購設備存放區", rackUnmovedA: "不搬存放區A", rackUnmovedB: "不搬存放區B", rackUnmovedC: "搬遷不上架存放區", rackSmartHouse: "SmartHouse 20F",
    // Accessories
    accCable1U: "1U 理線槽", accCable2U: "2U 理線槽", accBlank1U: "1U 盲板", accBlank2U: "2U 盲板", accShelf1U: "1U 層板", accShelf2U: "2U 層板", accPdu1U: "1U 電源排插", accPdu2U: "2U 電源排插", accFan1U: "1U 散熱風扇組", accKvm1U: "1U KVM 抽屜"
  },
  en: {
    navDashboard: "Dashboard", navDevices: "Devices", navBefore: "Before Rack Config", navAfter: "After Rack Config", navAdmin: "Admin Panel",
    totalDevices: "Total Devices", pending: "Pending", completed: "Completed",
    racked: "Racked", cabled: "Cabled", powered: "Powered", tested: "Tested",
    rackStatus: "Post-Migration Rack Status", categoryDist: "Device Categories", sysTips: "System Tips",
    unplaced: "Unplaced Devices", allPlaced: "All placed (Auto-collapsed)",
    exportCsv: "Export Full CSV", appendCsv: "Append CSV", importCsv: "Import CSV (Overwrite)", addDevice: "Add Device",
    deviceList: "Device Asset List", exportLabels: "Export Cable Labels",
    sysTipsText1: "Manage devices in 'Devices'. Accessories do not affect migration progress.",
    sysTipsText2: "Create connections in Device Edit to auto-generate routing labels.",
    sysTipsText3: "Click 'Export Cable Labels' to download CSV for label printers.",
    sysTipsText4: "Admins/Cables can edit routes and notes directly inside the Detail Modal.",
    sysTipsText5: "Regularly download 'Full CSV Backup' to secure your project data.",
    cat: "Category", devId: "ID", name: "Name", brand: "Brand", model: "Model", ports: "Ports", sizeU: "U", before: "Before", after: "After", status: "Status", done: "Done", action: "Action", connections: "Links",
    btnEdit: "Edit", btnClear: "Clear", btnDel: "Del", btnSave: "Save", btnCancel: "Cancel", btnClose: "Close", btnSaveChanges: "Save Changes",
    statusDone: "V", statusUndone: "X",
    addDeviceTitle: "Add Device", editDeviceTitle: "Edit Device", addPlaceTitle: "Add & Place",
    fCat: "Category", fId: "Device ID", fName: "Device Name", fBrand: "Brand", fModel: "Model", fPorts: "Ports", fU: "Size (U)", fIp: "IP Address", fSn: "Serial Number", fNote: "General Note",
    detailTitle: "Device Details", detailBefore: "Before Position", detailAfter: "After Position", detailStatus: "Migration Status",
    readOnly: "Read Only", onlyAfterToggle: "※ Status can only be toggled in 'After' page.",
    btnClearPlace: "Clear Placement", cantLayout: "Cannot Layout", accessoryNoLamp: "※ Accessories do not require status tracking.",
    hoverInfo: "Info", hoverBefore: "Before", hoverAfter: "After",
    account: "Account", role: "Role", password: "Password", addAccount: "Add Account", editAccount: "Edit Account",
    noDevices: "No Devices", dragHere: "Drag CSV Here", orClick: "or click to select file", template: "Download Template",
    warningImport: "⚠️ Warning: This will overwrite ALL existing data.",
    warningAppend: "This will append devices to the end of the current list.",
    expand: "Expand", collapse: "Collapse", dragToRack: "Tip: Drag devices to the rack", noDrag: "Read-only", noUnplaced: "✅ No unplaced devices", langToggle: "EN",
    cableRouting: "Smart Cable Routing", autoGenLabels: "Label Preview", addConnection: "Add Link",
    localPort: "Local Port", targetDevice: "Target Device", selectDevice: "Select Device...", targetPort: "Target Port", unknownDev: "Unknown Device",
    lblSrcDev: "Source Device", lblTgtDev: "Target Device", lblBefSrc: "Before: Source Lbl", lblBefTgt: "Before: Target Lbl", lblAftSrc: "After: Source Lbl", lblAftTgt: "After: Target Lbl",
    rackNewDevice: "New Device Area", rackUnmovedA: "Unmoved Area A", rackUnmovedB: "Unmoved Area B", rackUnmovedC: "Unmoved Area C", rackSmartHouse: "SmartHouse 20F",
    accCable1U: "1U Cable Manager", accCable2U: "2U Cable Manager", accBlank1U: "1U Blanking Panel", accBlank2U: "2U Blanking Panel", accShelf1U: "1U Fixed Shelf", accShelf2U: "2U Fixed Shelf", accPdu1U: "1U PDU", accPdu2U: "2U PDU", accFan1U: "1U Fan Unit", accKvm1U: "1U KVM Console"
  },
  ko: {
    navDashboard: "대시보드", navDevices: "장치 관리", navBefore: "이전 전 랙 구성", navAfter: "이전 후 랙 구성", navAdmin: "관리자 설정",
    totalDevices: "총 장치 수", pending: "대기 중", completed: "완료됨",
    racked: "랙 장착됨", cabled: "케이블 연결됨", powered: "전원 켜짐", tested: "테스트 완료",
    rackStatus: "마이그레이션 후 랙 상태", categoryDist: "장치 카테고리 분포", sysTips: "시스템 팁",
    unplaced: "배치되지 않은 장치", allPlaced: "모두 배치됨",
    exportCsv: "전체 CSV 내보내기", appendCsv: "CSV 일괄 추가", importCsv: "전체 복원 (CSV)", addDevice: "단일 장치 추가",
    deviceList: "장치 자산 목록", exportLabels: "케이블 라벨 내보내기",
    sysTipsText1: "장치 관리에서 장치를 추가하세요. Accessory(액세서리)는 진행률에 포함되지 않습니다.",
    sysTipsText2: "장치 편집에서 연결을 생성하면 랙 라벨이 자동 계산됩니다.",
    sysTipsText3: "'케이블 라벨 내보내기'를 클릭하여 라벨 프린터용 CSV를 다운로드하세요.",
    sysTipsText4: "관리자/케이블 담당자는 랙 다이어그램에서 직접 라벨과 메모를 편집할 수 있습니다.",
    sysTipsText5: "프로젝트를 안전하게 보관하기 위해 정기적으로 CSV 백업을 다운로드하세요.",
    cat: "카테고리", devId: "ID", name: "이름", brand: "브랜드", model: "모델", ports: "포트", sizeU: "U", before: "이전 전", after: "이전 후", status: "상태", done: "완료", action: "작업", connections: "연결",
    btnEdit: "편집", btnClear: "지우기", btnDel: "삭제", btnSave: "저장", btnCancel: "취소", btnClose: "닫기", btnSaveChanges: "변경사항 저장",
    statusDone: "완료", statusUndone: "미완료",
    addDeviceTitle: "장치 추가", editDeviceTitle: "장치 편집", addPlaceTitle: "장치 추가 및 배치",
    fCat: "카테고리", fId: "장치 ID", fName: "장치 이름", fBrand: "브랜드", fModel: "모델", fPorts: "포트 수", fU: "크기(U)", fIp: "IP 주소", fSn: "일련번호", fNote: "일반 메모",
    detailTitle: "장치 세부 정보", detailBefore: "이전 전 위치", detailAfter: "이전 후 위치", detailStatus: "마이그레이션 상태",
    readOnly: "읽기 전용", onlyAfterToggle: "※ '이전 후' 페이지에서만 상태 전환 가능.",
    btnClearPlace: "위치 지우기", cantLayout: "레이아웃 불가", accessoryNoLamp: "※ 액세서리는 상태 추적이 필요하지 않습니다.",
    hoverInfo: "장치 정보", hoverBefore: "이전 전", hoverAfter: "이전 후",
    account: "계정", role: "권한", password: "비밀번호", addAccount: "계정 추가", editAccount: "계정 편집",
    noDevices: "장치 없음", dragHere: "여기로 CSV 드래그", orClick: "또는 파일 선택", template: "템플릿",
    warningImport: "⚠️ 경고: 모든 데이터가 덮어씌워집니다.",
    warningAppend: "기존 데이터의 끝에 장치를 추가합니다.",
    expand: "펼치기", collapse: "접기", dragToRack: "랙으로 드래그", noDrag: "읽기 전용", noUnplaced: "✅ 미배치 장치 없음", langToggle: "한국어",
    cableRouting: "스마트 케이블 라우팅", autoGenLabels: "라벨 미리보기", addConnection: "연결 추가",
    localPort: "로컬 포트", targetDevice: "대상 장치", selectDevice: "장치 선택...", targetPort: "대상 포트", unknownDev: "알 수 없는 장치",
    lblSrcDev: "소스 장치", lblTgtDev: "대상 장치", lblBefSrc: "이전전: 소스 라벨", lblBefTgt: "이전전: 대상 라벨", lblAftSrc: "이전후: 소스 라벨", lblAftTgt: "이전후: 대상 라벨",
    rackNewDevice: "신규 장치 구역", rackUnmovedA: "미이전 구역 A", rackUnmovedB: "미이전 구역 B", rackUnmovedC: "미이전 구역 C", rackSmartHouse: "SmartHouse 20F",
    accCable1U: "1U 케이블 매니저", accCable2U: "2U 케이블 매니저", accBlank1U: "1U 블랭킹 패널", accBlank2U: "2U 블랭킹 패널", accShelf1U: "1U 선반", accShelf2U: "2U 선반", accPdu1U: "1U PDU", accPdu2U: "2U PDU", accFan1U: "1U 팬 유닛", accKvm1U: "1U KVM 콘솔"
  }
};

const t = (key: keyof typeof DICT.zh, lang: Lang) => DICT[lang]?.[key] || DICT.zh[key];

// 獲取配件清單
const getAccessoryOptions = (lang: Lang) => [
  t("accCable1U", lang), t("accCable2U", lang), t("accBlank1U", lang), t("accBlank2U", lang),
  t("accShelf1U", lang), t("accShelf2U", lang), t("accPdu1U", lang), t("accPdu2U", lang),
  t("accFan1U", lang), t("accKvm1U", lang)
];

/* -----------------------------
  Fixed Colors (★ 更新 Storage 顏色)
----------------------------- */
const FIXED_COLORS = {
  Network: "#22c55e",
  Server: "#3b82f6",
  Storage: "#8b5cf6", // ★ 科技紫
  Accessory: "#64748b", // ★ 配件低調鐵灰
  Other: "#fb923c",
};

/* -----------------------------
  Rack Layouts
----------------------------- */
const BEFORE_RACKS: Rack[] = [
  ...["10", "09", "08", "07", "06", "05", "04", "03", "02", "01"].map((n) => ({ id: `BEF_${n}`, name: n, units: 42 })),
  ...["2F-A", "2F-B", "3F-A", "3F-B", "4F-A", "4F-B", "9F", "SmartHouseA", "SmartHouseB"].map((n) => ({ id: `BEF_${n}`, name: n, units: 42 })),
  { id: "BEF_New_Device", name: "rackNewDevice", units: 42 }
];

const AFTER_RACKS: Rack[] = [
  ...["A1", "A2", "A3", "A4", "A5", "A6", "B1", "B2", "B3", "B4", "B5", "B6", "HUB 15L", "HUB 15R", "HUB 16L", "HUB 16R", "HUB 17L", "HUB 17R", "HUB 20F"].map((n) => ({ id: `AFT_${n}`, name: n, units: 42 })),
  { id: "AFT_SmartHouse_20F", name: "rackSmartHouse", units: 42 },
  { id: "AFT_Unmoved_A", name: "rackUnmovedA", units: 42 },
  { id: "AFT_Unmoved_B", name: "rackUnmovedB", units: 42 },
  { id: "AFT_Unmoved_C", name: "rackUnmovedC", units: 42 }
];

const getRackName = (id: string, lang: Lang) => {
  if(!id) return "-";
  const clean = id.replace(/^(BEF_|AFT_)/, "");
  if (clean === "New_Device") return t("rackNewDevice", lang);
  if (clean === "Unmoved_A") return t("rackUnmovedA", lang);
  if (clean === "Unmoved_B") return t("rackUnmovedB", lang);
  if (clean === "Unmoved_C") return t("rackUnmovedC", lang);
  if (clean === "SmartHouse_20F") return t("rackSmartHouse", lang);
  return clean;
};

/* -----------------------------
  權限與小工具
----------------------------- */
const canManageAssets = (role: Role) => role === "admin";
const canEditPortMap = (role: Role) => role === "admin" || role === "cable";
const canToggleFlags = (_role: Role) => true;
const canExportCSV = (_role: Role) => true;

const clampU = (u: number) => Math.max(1, Math.min(42, u));
const rangesOverlap = (aS: number, aE: number, bS: number, bE: number) => Math.max(aS, bS) <= Math.min(aE, bE);
const isMigratedComplete = (m: MigrationFlags) => m.racked && m.cabled && m.powered && m.tested;

const readJson = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } };
const writeJson = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const syncToCloud = async (patch: any) => {
  try { const cleanPatch = JSON.parse(JSON.stringify(patch)); await setDoc(doc(db, "migratePro", "mainState"), cleanPatch, { merge: true }); } catch (e) {}
};

/* -----------------------------
  CSV 工具函式
----------------------------- */
const escapeCSV = (str: string | number | undefined | null) => {
  if (str == null) return "";
  return `"${String(str).replace(/"/g, '""')}"`;
};

const CSV_HEADER = "id,category,deviceId,name,brand,model,ports,sizeU,ip,serial,portMap,connections,beforeRackId,beforeStartU,beforeEndU,afterRackId,afterStartU,afterEndU,m_racked,m_cabled,m_powered,m_tested";

const downloadFullCSV = (devices: Device[]) => {
  const rows = devices.map(d => [
    d.id, d.category, d.deviceId, d.name, d.brand, d.model, d.ports, d.sizeU,
    d.ip || "", d.serial || "", d.portMap || "",
    d.connections ? JSON.stringify(d.connections) : "[]",
    d.beforeRackId || "", d.beforeStartU || "", d.beforeEndU || "",
    d.afterRackId || "", d.afterStartU || "", d.afterEndU || "",
    d.migration.racked ? "1" : "0", d.migration.cabled ? "1" : "0", d.migration.powered ? "1" : "0", d.migration.tested ? "1" : "0"
  ].map(escapeCSV).join(','));

  const csvContent = "\uFEFF" + [CSV_HEADER, ...rows].join("\n");
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `MigratePro_FullBackup_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const downloadCableLabelsCSV = (devices: Device[], lang: Lang) => {
  const rows: string[] = [];
  const header = [t("lblSrcDev", lang), t("lblTgtDev", lang), t("lblBefSrc", lang), t("lblBefTgt", lang), t("lblAftSrc", lang), t("lblAftTgt", lang)];
  rows.push(header.map(escapeCSV).join(","));

  devices.forEach(d => {
    if (!d.connections) return;
    d.connections.forEach(c => {
      const target = devices.find(x => x.id === c.targetId);
      if (!target) return;
      const getRack = (rId: string | undefined) => rId ? getRackName(rId, lang) : "-";
      const bSrc = `${getRack(d.beforeRackId)}/${d.beforeStartU||"-"}U/${d.name}/${c.localPort||"-"}`;
      const bTgt = `${getRack(target.beforeRackId)}/${target.beforeStartU||"-"}U/${target.name}/${c.targetPort||"-"}`;
      const aSrc = `${getRack(d.afterRackId)}/${d.afterStartU||"-"}U/${d.name}/${c.localPort||"-"}`;
      const aTgt = `${getRack(target.afterRackId)}/${target.afterStartU||"-"}U/${target.name}/${c.targetPort||"-"}`;
      rows.push([d.name, target.name, bSrc, bTgt, aSrc, aTgt].map(escapeCSV).join(","));
    });
  });

  const csvContent = "\uFEFF" + rows.join("\n");
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `CableLabels_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const downloadFullCSVTemplate = () => {
  const csvContent = "\uFEFF" + CSV_HEADER + "\n";
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "MigratePro_Template.csv");
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const APPEND_CSV_HEADER = "category,deviceId,name,brand,model,ports,sizeU,ip,serial,portMap";
const APPEND_CSV_SAMPLE = "Server,SRV-001,範例伺服器,Dell,R740,4,2,192.168.1.100,SN12345,Eth1 -> Switch";

const downloadAppendCSVTemplate = () => {
  const csvContent = "\uFEFF" + APPEND_CSV_HEADER + "\n" + APPEND_CSV_SAMPLE + "\n";
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "MigratePro_批量添加範本.csv");
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const parseCSV = (str: string): string[][] => {
  const delimiter = str.includes('\t') && (!str.includes(',') || str.indexOf('\t') < str.indexOf(',')) ? '\t' : ',';
  const arr: string[][] = []; let quote = false, row = 0, col = 0;
  for (let c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c+1];
    arr[row] = arr[row] || []; arr[row][col] = arr[row][col] || '';
    if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
    if (cc === '"') { quote = !quote; continue; }
    if (cc === delimiter && !quote) { ++col; continue; }
    if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
    if (cc === '\n' && !quote) { ++row; col = 0; continue; }
    if (cc === '\r' && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }
  return arr;
};

const backwardCompatRackId = (val: string | undefined): string | undefined => {
  if (!val) return undefined;
  if (val.includes("新購設備存放區")) return "BEF_New_Device";
  if (val.includes("不搬存放區A")) return "AFT_Unmoved_A";
  if (val.includes("不搬存放區B")) return "AFT_Unmoved_B";
  if (val.includes("不搬存放區C") || val.includes("搬遷不上架存放區")) return "AFT_Unmoved_C";
  if (val.includes("SmartHouse 20F")) return "AFT_SmartHouse_20F";
  if (!val.startsWith("BEF_") && !val.startsWith("AFT_")) {
    // 嘗試推斷
    if (val === "10" || val === "09" || val.includes("F")) return `BEF_${val}`;
    if (val.includes("A") || val.includes("B") || val.includes("HUB")) return `AFT_${val}`;
  }
  return val;
};

const normalizeDevices = (raw: any[]): Device[] => {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((d: any) => {
    const sizeU = Math.max(1, Math.min(42, Number(d?.sizeU ?? 1)));
    let beforeRackId = backwardCompatRackId(d?.beforeRackId);
    let afterRackId = backwardCompatRackId(d?.afterRackId);
    let connections = []; try { connections = typeof d?.connections === 'string' ? JSON.parse(d.connections) : (d?.connections || []); } catch(e){}

    return {
      id: String(d?.id ?? crypto.randomUUID()), category: (d?.category as DeviceCategory) || "Other",
      deviceId: String(d?.deviceId ?? ""), name: String(d?.name ?? ""), brand: String(d?.brand ?? ""), model: String(d?.model ?? ""),
      ports: Number(d?.ports ?? 0), sizeU, ip: String(d?.ip ?? ""), serial: String(d?.serial ?? ""), portMap: String(d?.portMap ?? ""),
      connections: Array.isArray(connections) ? connections : [],
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

const LampsRow = ({ m, isAccessory }: { m: MigrationFlags, isAccessory?: boolean }) => {
  if (isAccessory) return null;
  return (<div className="flex items-center gap-1.5"><Lamp on={m.racked} /><Lamp on={m.cabled} /><Lamp on={m.powered} /><Lamp on={m.tested} /></div>);
};

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
  updateDevice: (id: string, patch: Partial<DeviceDraft | {portMap?: string, connections?: Connection[]}>) => void;
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
    if (!username || username.includes(" ") || !a.password) return { ok: false, message: "Error" };
    if (a.username === "admin" && a.role !== "admin") return { ok: false, message: "Error" };

    const accounts = get().accounts;
    const exists = accounts.some((x) => x.username === username);
    const next = exists ? accounts.map((x) => (x.username === username ? { ...a, username } : x)) : [...accounts, { ...a, username }];
    writeJson(LS.accounts, next); syncToCloud({ accounts: next }); set({ accounts: next }); return { ok: true };
  },

  deleteAccount: (username) => {
    if (username === "admin") return { ok: false, message: "admin Cannot be deleted" };
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
    if (!found) return { ok: false, message: "Login Failed" };
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
        if (rows.length < 2) return { ok: false, message: "CSV Empty" };
        const header = rows[0].map((x) => x.trim());
        const getv = (r: string[], k: string) => String(r[header.findIndex((h) => h === k)] ?? "").trim();
        const devices: Device[] = rows.slice(1).map((r) => {
          let beforeRackId = backwardCompatRackId(getv(r, "beforeRackId") || undefined);
          let afterRackId = backwardCompatRackId(getv(r, "afterRackId") || undefined);
          let connections = []; try { connections = JSON.parse(getv(r, "connections")); } catch(e) {}

          return {
            id: getv(r, "id") || crypto.randomUUID(), category: (getv(r, "category") as DeviceCategory) || "Other",
            deviceId: getv(r, "deviceId"), name: getv(r, "name"), brand: getv(r, "brand"), model: getv(r, "model"),
            ports: Number(getv(r, "ports") || 0), sizeU: Math.max(1, Math.min(42, Number(getv(r, "sizeU") || 1))),
            ip: getv(r, "ip"), serial: getv(r, "serial"), portMap: getv(r, "portMap"),
            connections: Array.isArray(connections) ? connections : [],
            beforeRackId, beforeStartU: getv(r, "beforeStartU") ? Number(getv(r, "beforeStartU")) : undefined, beforeEndU: getv(r, "beforeEndU") ? Number(getv(r, "beforeEndU")) : undefined,
            afterRackId, afterStartU: getv(r, "afterStartU") ? Number(getv(r, "afterStartU")) : undefined, afterEndU: getv(r, "afterEndU") ? Number(getv(r, "afterEndU")) : undefined,
            migration: { racked: getv(r, "m_racked") === "1", cabled: getv(r, "m_cabled") === "1", powered: getv(r, "m_powered") === "1", tested: getv(r, "m_tested") === "1" },
          };
        });
        writeJson(LS.devices, devices); syncToCloud({ devices }); set({ devices }); return { ok: true };
      } catch (e: any) { return { ok: false, message: e?.message || "Import Failed" }; }
  },

  appendDevicesFromCSV: (fileText) => {
    try {
      const rows = parseCSV(fileText);
      if (rows.length < 2) return { ok: false, message: "CSV Empty" };
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
          ip: getv(r, "ip"), serial: getv(r, "serial"), portMap: getv(r, "portMap"), connections: [],
          migration: { racked: false, cabled: false, powered: false, tested: false },
        });
      }
      if (newDevices.length === 0) return { ok: false, message: "No Valid Devices" };
      const updated = [...get().devices, ...newDevices];
      writeJson(LS.devices, updated); syncToCloud({ devices: updated }); set({ devices: updated }); return { ok: true };
    } catch (e: any) { return { ok: false, message: e?.message || "Import Failed" }; }
  },

  clearPlacement: (mode, id) => set((s) => {
    const next = s.devices.map((d) => d.id !== id ? d : mode === "before" ? { ...d, beforeRackId: undefined, beforeStartU: undefined, beforeEndU: undefined } : { ...d, afterRackId: undefined, afterStartU: undefined, afterEndU: undefined });
    writeJson(LS.devices, next); syncToCloud({ devices: next }); return { devices: next };
  }),

  place: (mode, deviceId, rackId, startU) => {
    const { devices } = get(); const dev = devices.find((d) => d.id === deviceId);
    if (!dev) return { ok: false, message: "Not Found" };
    const sU = clampU(startU); const eU = sU + Math.max(1, Math.min(42, dev.sizeU)) - 1;
    if (eU > 42) return { ok: false, message: "Exceeds 42U" };

    const collision = devices.find((d) => {
      if (d.id === deviceId) return false;
      const rId = mode === "before" ? d.beforeRackId : d.afterRackId;
      const s = mode === "before" ? d.beforeStartU : d.afterStartU;
      const e = mode === "before" ? d.beforeEndU : d.afterEndU;
      return rId === rackId && s != null && e != null && rangesOverlap(sU, eU, s, e);
    });
    if (collision) return { ok: false, message: `Collision: ${collision.deviceId}` };

    const next = devices.map((d) => d.id === deviceId ? mode === "before" ? { ...d, beforeRackId: rackId, beforeStartU: sU, beforeEndU: eU } : { ...d, afterRackId: rackId, afterStartU: sU, afterEndU: eU } : d);
    writeJson(LS.devices, next); syncToCloud({ devices: next }); set({ devices: next }); return { ok: true };
  },

  setMigrationFlag: (id, patch) => set((s) => {
    const next = s.devices.map((d) => d.id === id ? { ...d, migration: { ...d.migration, ...patch } } : d);
    writeJson(LS.devices, next); syncToCloud({ devices: next }); return { devices: next };
  }),

  repairRackIds: () => set((s) => {
    const repaired = s.devices.map((d) => {
      let beforeRackId = backwardCompatRackId(d.beforeRackId);
      let afterRackId = backwardCompatRackId(d.afterRackId);
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
          <div><label className="text-xs text-[var(--muted)]">Account</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={u} onChange={(e) => setU(e.target.value)} /></div>
          <div><label className="text-xs text-[var(--muted)]">Password</label><input type="password" className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={p} onChange={(e) => setP(e.target.value)} /></div>
          {err && <div className="text-sm text-red-400">{err}</div>}
          <button onClick={() => { setErr(null); const res = login(u.trim(), p); if (!res.ok) setErr(res.message); }} className="w-full mt-2 bg-[var(--accent)] text-black font-extrabold py-3 rounded-xl hover:opacity-90">Login</button>
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

/* -----------------------------
  ★ Device Detail Modal (支援直接編輯線路與備註)
----------------------------- */
function DeviceDetailModal({ id, mode, onClose }: { id: string; mode: PlacementMode; onClose: () => void; }) {
  const d = useStore((s) => s.devices.find((x) => x.id === id));
  const devices = useStore((s) => s.devices);
  const setFlag = useStore((s) => s.setMigrationFlag);
  const clearPlacement = useStore((s) => s.clearPlacement);
  const updateDevice = useStore((s) => s.updateDevice);
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);
  
  // ★ 引入 Local State 讓工程師在彈窗內直接編輯
  const [localNote, setLocalNote] = useState(d?.portMap || "");
  const [localConns, setLocalConns] = useState<Connection[]>(d?.connections || []);

  if (!d) return null;

  const isAccessory = d.category === "Accessory";
  const beforePos = d.beforeRackId && d.beforeStartU != null && d.beforeEndU != null ? `${getRackName(d.beforeRackId, lang)} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
  const afterPos = d.afterRackId && d.afterStartU != null && d.afterEndU != null ? `${getRackName(d.afterRackId, lang)} ${d.afterStartU}-${d.afterEndU}U` : "-";
  
  const allowLayout = canManageAssets(role);
  const allowEditPort = canEditPortMap(role);

  const isModified = localNote !== (d.portMap || "") || JSON.stringify(localConns) !== JSON.stringify(d.connections || []);

  const addConn = () => setLocalConns(p => [...p, { id: crypto.randomUUID(), localPort: '', targetId: '', targetPort: '' }]);
  const updateConn = (i: number, k: keyof Connection, v: string) => {
    const next = [...localConns]; next[i] = { ...next[i], [k]: v };
    setLocalConns(next);
  };
  const removeConn = (i: number) => {
    const next = [...localConns]; next.splice(i, 1);
    setLocalConns(next);
  };

  const saveChanges = () => {
    updateDevice(d.id, { portMap: localNote.trimEnd(), connections: localConns });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-4 md:p-6 border-b border-[var(--border)] shrink-0 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-[var(--muted)]">{t("detailTitle", lang)} {isAccessory && " (Accessory)"}</div>
            <div className="text-lg md:text-xl font-black truncate text-[var(--text)]">{d.deviceId} · {d.name}</div>
            <div className="text-sm text-[var(--muted)] truncate">{d.brand} / {d.model} {isAccessory ? "" : `· ${d.ports} ports`} · {d.sizeU}U</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button>
        </div>
        
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]"><div className="text-xs text-[var(--muted)]">{t("detailBefore", lang)}</div><div className="font-bold mt-1 text-[var(--text)]">{beforePos}</div></div>
            <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]"><div className="text-xs text-[var(--muted)]">{t("detailAfter", lang)}</div><div className="font-bold mt-1 text-[var(--text)]">{afterPos}</div></div>
            
            {!isAccessory && (
              <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)] md:col-span-2">
                <div className="text-xs text-[var(--muted)]">IP / SN</div><div className="mt-1 font-bold text-[var(--text)]">{d.ip || "-"} / {d.serial || "-"}</div>
              </div>
            )}
          </div>

          {/* ★ 直覺編輯：智慧線路對接表 */}
          {!isAccessory && (
            <div className="mt-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 font-black text-[var(--text)]"><Link2 size={16} className="text-[var(--accent)]" /> {t("cableRouting", lang)} <span className="text-xs font-medium text-[var(--muted)] ml-2 border border-[var(--border)] px-2 py-0.5 rounded-full">{t("autoGenLabels", lang)}</span></div>
                {allowEditPort && <button type="button" onClick={addConn} className="text-xs bg-[var(--accent)] text-black px-3 py-1.5 rounded-lg font-bold hover:opacity-90 flex items-center gap-1"><Plus size={14} /> {t("addConnection", lang)}</button>}
              </div>

              {localConns.length === 0 ? (
                <div className="text-xs text-[var(--muted)] italic">No Connections.</div>
              ) : (
                <div className="space-y-4">
                  {localConns.map((c, i) => {
                    const target = devices.find(x => x.id === c.targetId);
                    const targetName = target ? target.name : t("unknownDev", lang);
                    const rId = mode === "before" ? d.beforeRackId : d.afterRackId;
                    const u = mode === "before" ? d.beforeStartU : d.afterStartU;
                    const trId = mode === "before" ? target?.beforeRackId : target?.afterRackId;
                    const tu = mode === "before" ? target?.beforeStartU : target?.afterStartU;
                    const myLabel = `${rId ? getRackName(rId, lang) : "-"}/${u||"-"}U/${d.name}/${c.localPort||"-"}`;
                    const tLabel = `${trId ? getRackName(trId, lang) : "-"}/${tu||"-"}U/${targetName}/${c.targetPort||"-"}`;

                    return (
                      <div key={c.id} className="flex flex-col gap-2 bg-[var(--panel)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
                        {/* 編輯器 (僅有權限者可見) */}
                        {allowEditPort && (
                          <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                            <input placeholder={t("localPort", lang)} value={c.localPort} onChange={e => updateConn(i, 'localPort', e.target.value)} className="w-full md:w-1/4 bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                            <span className="text-[var(--muted)] text-xs hidden md:block">{'->'}</span>
                            <select value={c.targetId} onChange={e => updateConn(i, 'targetId', e.target.value)} className="flex-1 w-full md:w-0 bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-xs p-1 outline-none text-[var(--text)]">
                              <option value="">{t("selectDevice", lang)}</option>
                              {devices.filter(x => x.id !== d.id).map(x => <option key={x.id} value={x.id}>{x.deviceId} - {x.name}</option>)}
                            </select>
                            <input placeholder={t("targetPort", lang)} value={c.targetPort} onChange={e => updateConn(i, 'targetPort', e.target.value)} className="w-full md:w-1/4 bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                            <button type="button" onClick={() => removeConn(i)} className="p-1 text-red-400 hover:bg-white/10 rounded w-full md:w-auto flex justify-center"><X size={16}/></button>
                          </div>
                        )}
                        {/* 動態標籤預覽 */}
                        <div className="flex flex-col md:flex-row gap-2 items-center text-[11px] mt-1 opacity-90">
                          <div className="flex-1 w-full bg-black/10 dark:bg-white/5 border border-[var(--border)] px-2 py-1.5 rounded text-center font-mono text-[var(--accent)] font-bold truncate">{myLabel}</div>
                          <div className="text-[var(--muted)] shrink-0 hidden md:block">{'⇄'}</div>
                          <div className="flex-1 w-full bg-black/10 dark:bg-white/5 border border-[var(--border)] px-2 py-1.5 rounded text-center font-mono text-[var(--accent2)] font-bold truncate">{tLabel}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ★ 直覺編輯：一般備註 */}
          <div className="mt-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-[var(--text)]">{t("fNote", lang)}</div>
              {!allowEditPort && <div className="text-[10px] text-[var(--muted)] border border-[var(--border)] px-1 rounded bg-black/10">Vendor ({t("readOnly", lang)})</div>}
            </div>
            {allowEditPort ? (
              <textarea className="w-full bg-[var(--panel)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" rows={2} value={localNote} onChange={e => setLocalNote(e.target.value)} />
            ) : (<div className="text-sm whitespace-pre-wrap break-words text-[var(--text)]">{d.portMap || "-"}</div>)}
          </div>

          {/* 全域儲存按鈕 (如果備註或線路有修改) */}
          {allowEditPort && isModified && (
            <div className="mt-3 flex justify-end">
              <button onClick={saveChanges} className="bg-[var(--accent)] text-black px-6 py-2 rounded-xl text-sm font-extrabold hover:opacity-90 shadow-lg flex items-center gap-2"><Save size={16} /> {t("btnSaveChanges", lang)}</button>
            </div>
          )}

          {/* 搬遷狀態切換區 */}
          <div className="mt-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
            <div className="flex items-center justify-between"><div className="font-black text-[var(--text)]">{t("detailStatus", lang)}</div><LampsRow m={d.migration} isAccessory={isAccessory} /></div>
            {isAccessory ? (
              <div className="text-xs text-[var(--muted)] mt-3">{t("accessoryNoLamp", lang)}</div>
            ) : mode === "after" ? (
              <div className="mt-4 grid grid-cols-1 gap-3 text-[var(--text)]">
                <div className="flex items-center justify-between"><div className="text-sm">{t("racked", lang)}</div><Switch on={d.migration.racked} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { racked: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">{t("cabled", lang)}</div><Switch on={d.migration.cabled} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { cabled: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">{t("powered", lang)}</div><Switch on={d.migration.powered} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { powered: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">{t("tested", lang)}</div><Switch on={d.migration.tested} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { tested: v })} disabled={!canToggleFlags(role)} /></div>
              </div>
            ) : (<div className="text-xs text-[var(--muted)] mt-3">{t("onlyAfterToggle", lang)}</div>)}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-between items-center">
          {allowLayout ? (<button onClick={() => { if (confirm("Clear position?")) clearPlacement(mode, d.id); onClose(); }} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-xs md:text-sm text-[var(--text)]">{t("btnClearPlace", lang)}</button>) : (<div className="text-xs text-[var(--muted)]">{role === "cable" ? "Cable" : "Vendor"}：{t("cantLayout", lang)}</div>)}
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-white/5 font-extrabold">{t("btnClose", lang)}</button>
        </div>
      </motion.div>
    </div>
  );
}

function DeviceModal({ title, initial, onClose, onSave }: { title: string; initial: DeviceDraft; onClose: () => void; onSave: (d: DeviceDraft) => void; }) {
  const lang = useStore((s) => s.lang);
  const devices = useStore((s) => s.devices);
  const accOptions = getAccessoryOptions(lang);
  
  const [d, setD] = useState<DeviceDraft>({ ...initial, connections: initial.connections || [] });
  const input = (k: keyof DeviceDraft) => (e: any) => setD((p) => ({ ...p, [k]: e.target.value } as any));

  const isAcc = d.category === "Accessory";

  // 配件選擇時自動推算 U 數
  const handleAccSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    let autoU = 1;
    if (val.includes("2U")) autoU = 2;
    setD(p => ({ ...p, name: val, sizeU: autoU }));
  };

  const addConn = () => setD(p => ({ ...p, connections: [...p.connections, { id: crypto.randomUUID(), localPort: '', targetId: '', targetPort: '' }] }));
  const updateConn = (i: number, k: keyof Connection, v: string) => {
    const next = [...d.connections]; next[i] = { ...next[i], [k]: v };
    setD(p => ({ ...p, connections: next }));
  };
  const removeConn = (i: number) => {
    const next = [...d.connections]; next.splice(i, 1);
    setD(p => ({ ...p, connections: next }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalD = { ...d };
    if (isAcc) {
      if (!finalD.name) finalD.name = accOptions[0]; // 防呆預設值
      if (!finalD.deviceId) finalD.deviceId = `ACC-${Math.floor(Math.random() * 9000) + 1000}`;
    } else {
      if (!finalD.deviceId.trim() || !finalD.name.trim()) return alert("ID and Name are required.");
    }
    onSave({ ...finalD, ports: Number(finalD.ports) || 0, sizeU: Math.max(1, Math.min(42, Number(finalD.sizeU) || 1)), portMap: (finalD.portMap ?? "").trimEnd() });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-4 md:p-6 border-b border-[var(--border)] shrink-0 flex items-center justify-between gap-3">
          <div className="text-xl font-black text-[var(--text)]">{title}</div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button>
        </div>
        
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <form id="device-form" className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs text-[var(--muted)]">{t("fCat", lang)}</label>
              <select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.category} onChange={input("category") as any}>
                {(["Network", "Storage", "Server", "Accessory", "Other"] as DeviceCategory[]).map((x) => (<option key={x} value={x}>{x}</option>))}
              </select>
            </div>
            
            {/* ★ 配件專屬下拉選單 vs 一般設備名稱輸入框 */}
            <div>
              <label className="text-xs text-[var(--muted)]">{t("fName", lang)}</label>
              {isAcc ? (
                <select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={d.name} onChange={handleAccSelect}>
                  <option value="" disabled>Select Accessory...</option>
                  {accOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  {/* 如果舊資料的名稱不在預設清單內，保留顯示 */}
                  {d.name && !accOptions.includes(d.name) && <option value={d.name}>{d.name} (Custom)</option>}
                </select>
              ) : (
                <input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={d.name} onChange={input("name")} />
              )}
            </div>

            {/* 非配件才顯示的欄位 */}
            {!isAcc && (
              <>
                <div><label className="text-xs text-[var(--muted)]">{t("fId", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={d.deviceId} onChange={input("deviceId")} placeholder="EX: SW-01" /></div>
                <div><label className="text-xs text-[var(--muted)]">{t("fBrand", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.brand} onChange={input("brand")} /></div>
                <div><label className="text-xs text-[var(--muted)]">{t("fModel", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.model} onChange={input("model")} /></div>
                <div><label className="text-xs text-[var(--muted)]">{t("fPorts", lang)}</label><input type="number" min={0} className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.ports} onChange={(e) => setD((p) => ({ ...p, ports: Number(e.target.value) || 0 }))} /></div>
              </>
            )}

            {/* U數 (所有人都有) */}
            <div><label className="text-xs text-[var(--muted)]">{t("fU", lang)}</label><input type="number" min={1} max={42} className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.sizeU} onChange={(e) => setD((p) => ({ ...p, sizeU: Number(e.target.value) || 1 }))} /></div>
            
            {/* IP / SN */}
            {!isAcc && (
              <>
                <div><label className="text-xs text-[var(--muted)]">{t("fIp", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.ip ?? ""} onChange={input("ip")} placeholder="10.0.0.10" /></div>
                <div className="md:col-span-2"><label className="text-xs text-[var(--muted)]">{t("fSn", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.serial ?? ""} onChange={input("serial")} /></div>
              </>
            )}
            
            {/* ★ 智慧線路對接編輯區 (配件隱藏) */}
            {!isAcc && (
              <div className="md:col-span-2 mt-2 p-4 bg-[var(--panel2)] border border-[var(--border)] rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-[var(--text)] flex items-center gap-2"><Link2 size={16} className="text-[var(--accent)]" /> {t("cableRouting", lang)}</label>
                  <button type="button" onClick={addConn} className="text-xs bg-[var(--accent)] text-black px-3 py-1.5 rounded-lg font-bold hover:opacity-90 flex items-center gap-1"><Plus size={14} /> {t("addConnection", lang)}</button>
                </div>
                {d.connections.length === 0 ? (
                  <div className="text-xs text-[var(--muted)] italic">No Connections.</div>
                ) : (
                  <div className="space-y-2">
                    {d.connections.map((c, i) => (
                      <div key={c.id} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-[var(--panel)] p-2 rounded-xl border border-[var(--border)]">
                        <input placeholder={t("localPort", lang)} value={c.localPort} onChange={e => updateConn(i, 'localPort', e.target.value)} className="w-full md:w-1/4 bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                        <span className="text-[var(--muted)] text-xs hidden md:block">{'->'}</span>
                        {/* ★ Dark Mode Fix: bg-[var(--panel2)] text-[var(--text)] */}
                        <select value={c.targetId} onChange={e => updateConn(i, 'targetId', e.target.value)} className="flex-1 w-full md:w-0 bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-xs p-1 outline-none text-[var(--text)]">
                          <option value="">{t("selectDevice", lang)}</option>
                          {/* 過濾掉自己和配件 */}
                          {devices.filter(x => x.id !== d.id && x.category !== "Accessory").map(x => <option key={x.id} value={x.id}>{x.deviceId} - {x.name}</option>)}
                        </select>
                        <input placeholder={t("targetPort", lang)} value={c.targetPort} onChange={e => updateConn(i, 'targetPort', e.target.value)} className="w-full md:w-1/4 bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                        <button type="button" onClick={() => removeConn(i)} className="p-1 text-red-400 hover:bg-white/10 rounded w-full md:w-auto flex justify-center"><X size={16}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 一般備註 */}
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--muted)]">{t("fNote", lang)}</label>
              <textarea className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" rows={2} value={d.portMap ?? ""} onChange={(e) => { setD((p) => ({ ...p, portMap: e.target.value })); }} />
            </div>
          </form>
        </div>

        <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--text)]">{t("btnCancel", lang)}</button>
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
    const sU = clampU(d.afterStartU ?? 1); const eU = clampU(d.afterEndU ?? sU);
    const start = Math.min(sU, eU); const size = Math.abs(eU - sU) + 1;
    const bottomPct = ((start - 1) / 42) * 100; const heightPct = (size / 42) * 100;
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
          const isRed = rack.id.includes("Unmoved");
          const displayName = getRackName(rack.id, lang);

          return (
            <div key={rack.id} className="flex flex-col bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 snap-center border border-slate-700 min-w-[120px] lg:min-w-0 flex-1">
              <div className={`px-1 py-2 text-center text-xs xl:text-sm font-bold text-white truncate ${isRed ? "bg-red-800" : "bg-emerald-600"}`} title={displayName}>{displayName}</div>
              
              <div className="relative w-full border-x-[4px] xl:border-x-[6px] border-t-[4px] xl:border-t-[6px] border-slate-600 bg-[#0b1220] shadow-inner flex-1">
                <div className="absolute inset-0 pointer-events-none z-10">
                  {rackDevs.map(d => {
                    const style = getPctStyle(d);
                    const isAcc = d.category === "Accessory";
                    return (
                      <div key={d.id} className="absolute left-[2px] right-[2px] rounded flex flex-row justify-between items-center pl-1.5 md:pl-2 overflow-hidden shadow-md"
                           style={{ ...style, backgroundColor: catColor(d.category), backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)" }}>
                        <div className="flex-1 text-[9px] xl:text-[11px] 2xl:text-[13px] text-white font-medium truncate text-left drop-shadow-md pr-1" title={d.deviceId || d.name}>{isAcc ? d.name : d.deviceId}</div>
                        {!isAcc && (
                          <div className="flex shrink-0 items-center bg-black/40 rounded-md shadow-inner p-1 mr-1 transform origin-right scale-[0.55] xl:scale-[0.65]">
                            <LampsRow m={d.migration} />
                          </div>
                        )}
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
  
  const validDevs = devices.filter(d => d.category !== "Accessory");
  const total = validDevs.length;
  const racked = validDevs.filter((d) => d.migration.racked).length;
  const cabled = validDevs.filter((d) => d.migration.cabled).length;
  const powered = validDevs.filter((d) => d.migration.powered).length;
  const tested = validDevs.filter((d) => d.migration.tested).length;
  const completed = validDevs.filter((d) => isMigratedComplete(d.migration)).length;
  const pending = Math.max(0, total - completed);

  const calcPct = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0;

  const chartData = [
    { name: "Network", count: devices.filter((d) => d.category === "Network").length, fill: FIXED_COLORS.Network },
    { name: "Storage", count: devices.filter((d) => d.category === "Storage").length, fill: FIXED_COLORS.Storage },
    { name: "Server", count: devices.filter((d) => d.category === "Server").length, fill: FIXED_COLORS.Server },
    { name: "Other", count: devices.filter((d) => d.category === "Other").length, fill: FIXED_COLORS.Other },
    { name: "Acc", count: devices.filter((d) => d.category === "Accessory").length, fill: FIXED_COLORS.Accessory },
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
          { label: t("racked", lang), val: racked }, { label: t("cabled", lang), val: cabled }, 
          { label: t("powered", lang), val: powered }, { label: t("tested", lang), val: tested }
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
        </div>
        
        <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl flex flex-col h-[320px] overflow-y-auto">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Sparkles className="text-[var(--accent)]" /> {t("sysTips", lang)}</h3>
          <ul className="text-sm text-[var(--muted)] space-y-3 flex-1 pr-2">
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
    if (!res.ok) alert(res.message); else onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
        <div className="p-6 shrink-0 border-b border-[var(--border)]">
          <div className="flex items-center justify-between"><div className="text-xl font-black text-[var(--text)]">{t("importCsv", lang)}</div><button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button></div>
          <div className="mt-3 text-sm text-[var(--muted)] text-red-400">{t("warningImport", lang)}</div>
          <div className="mt-4 flex gap-2 flex-wrap"><button onClick={downloadFullCSVTemplate} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 text-[var(--text)]"><Download size={16} /> {t("template", lang)}</button></div>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <label onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDrag(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }} className={`block w-full rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${drag ? "border-[var(--accent)] bg-white/5" : "border-[var(--border)] bg-black/10"}`}>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))" }}><Upload className="text-black" /></div>
              <div className="font-black text-[var(--text)]">{t("dragHere", lang)}</div><div className="text-xs text-[var(--muted)]">{t("orClick", lang)}</div>
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
    if (!res.ok) alert(res.message); else onClose();
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
            <button onClick={downloadAppendCSVTemplate} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 text-[var(--text)]"><Download size={16} /> {t("template", lang)}</button>
          </div>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <label onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDrag(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }} className={`block w-full rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${drag ? "border-[var(--accent)] bg-white/5" : "border-[var(--border)] bg-black/10"}`}>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--accent2),var(--accent))" }}><Plus className="text-black" size={24} /></div>
              <div className="font-black text-[var(--text)]">{t("dragHere", lang)}</div><div className="text-xs text-[var(--muted)]">{t("orClick", lang)}</div>
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
    const getBefore = (d: Device) => d.beforeRackId && d.beforeStartU != null ? `${getRackName(d.beforeRackId, lang)}-${d.beforeStartU}` : "";
    const getAfter = (d: Device) => d.afterRackId && d.afterStartU != null ? `${getRackName(d.afterRackId, lang)}-${d.afterStartU}` : "";
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

  const Th = ({ k, children, right }: { k: SortKey | "action" | "connections", children: React.ReactNode; right?: boolean; }) => (
    <th className={`px-4 py-4 font-semibold ${right ? "text-right" : ""}`}>
      {k === "action" || k === "connections" ? (
        <span className="whitespace-nowrap">{children}</span>
      ) : (
        <button onClick={() => sortToggle(k)} className="inline-flex items-center gap-2 hover:text-[var(--accent)] whitespace-nowrap" title="Sort">
          {children} <span className="text-[10px] opacity-70">{sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
        </button>
      )}
    </th>
  );

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-3 justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-[var(--accent)]">{t("deviceList", lang)}</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => downloadCableLabelsCSV(devices, lang)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent2)] hover:text-black transition-colors flex items-center gap-2 font-bold bg-black/20"><Link2 size={16} /> {t("exportLabels", lang)}</button>
          
          <button onClick={() => canExportCSV(role) && downloadFullCSV(devices)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent)] hover:text-black transition-colors flex items-center gap-2 font-bold"><Download size={16} /> {t("exportCsv", lang)}</button>

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
              <Th k="model">{t("model", lang)}</Th><Th k="ports">{t("ports", lang)}</Th><Th k="sizeU">{t("sizeU", lang)}</Th>
              <Th k="connections">🔗</Th> {/* ★ 新增線路 Badge 欄位 */}
              <Th k="before">{t("before", lang)}</Th><Th k="after">{t("after", lang)}</Th><Th k="migration">{t("status", lang)}</Th><Th k="complete">{t("done", lang)}</Th>
              <Th k="action" right>{t("action", lang)}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.map((d) => {
              const before = d.beforeRackId && d.beforeStartU != null ? `${getRackName(d.beforeRackId, lang)} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
              const after = d.afterRackId && d.afterStartU != null ? `${getRackName(d.afterRackId, lang)} ${d.afterStartU}-${d.afterEndU}U` : "-";
              const done = isMigratedComplete(d.migration);
              const isAcc = d.category === "Accessory";
              const connCount = d.connections?.length || 0;

              return (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-[10px] font-extrabold px-2 py-1 rounded-md border whitespace-nowrap" style={{ color: "var(--onColor)", borderColor: "rgba(255,255,255,0.35)", backgroundColor: catColor(d.category) }}>{d.category}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap"><div className="font-black text-sm whitespace-nowrap">{isAcc ? "-" : d.deviceId}</div></td>
                  <td className="px-4 py-4 whitespace-nowrap"><button onClick={() => useStore.getState().setSelectedDeviceId(d.id)} className="text-sm text-[var(--muted)] hover:text-[var(--accent)] font-semibold whitespace-nowrap" title="Detail">{d.name}</button></td>
                  <td className="px-4 py-4 text-xs text-[var(--text)] whitespace-nowrap">{isAcc ? "-" : d.brand}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{isAcc ? "-" : d.model}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{isAcc ? "-" : d.ports}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{d.sizeU}U</td>
                  
                  {/* ★ 線路數量 Badge */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {connCount > 0 ? (
                       <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[var(--accent)] text-[var(--accent)] bg-black/20">🔗 {connCount}</span>
                    ) : <span className="text-xs text-[var(--muted)]">-</span>}
                  </td>

                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{before}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{after}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{isAcc ? <span className="text-[10px] text-[var(--muted)]">-</span> : <LampsRow m={d.migration} />}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{isAcc ? <span className="text-[10px] text-[var(--muted)]">-</span> : <span className="text-xs font-extrabold px-2 py-1 rounded-lg border" style={{ borderColor: done ? "rgba(0,255,0,0.45)" : "rgba(255,0,0,0.45)", color: done ? "rgb(0,255,0)" : "rgb(255,0,0)", background: done ? "rgba(0,255,0,0.06)" : "rgba(255,0,0,0.06)" }}>{done ? t("statusDone", lang) : t("statusUndone", lang)}</span>}</td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {allowManage ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(d)} className="p-2 hover:bg-white/10 rounded-lg text-[var(--accent)]"><Edit3 size={16} /></button>
                        <button onClick={() => { clearPlacement("before", d.id); clearPlacement("after", d.id); }} className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] text-xs hover:bg-white/5 whitespace-nowrap">{t("btnClear", lang)}</button>
                        <button onClick={() => { if (confirm(`Delete ${d.deviceId || d.name}?`)) deleteDeviceById(d.id); }} className="p-2 hover:bg-white/10 rounded-lg text-red-400"><Trash2 size={16} /></button>
                      </div>
                    ) : (<div className="text-xs text-[var(--muted)]">-</div>)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (<tr><td colSpan={13} className="px-6 py-10 text-center text-[var(--muted)]">{t("noDevices", lang)}</td></tr>)}
          </tbody>
        </table>
      </div>

      {importOpen && <FullCSVImportModal onClose={() => setImportOpen(false)} />}
      {appendOpen && <AppendCSVImportModal onClose={() => setAppendOpen(false)} />}
      {isAdding && (<DeviceModal title={t("addDeviceTitle", lang)} initial={{ category: "Other", deviceId: "", name: "", brand: "", model: "", ports: 8, sizeU: 1, ip: "", serial: "", portMap: "", connections: [] }} onClose={() => setIsAdding(false)} onSave={(d) => { addDevice(d); setIsAdding(false); }} />)}
      {editing && (<DeviceModal title={t("editDeviceTitle", lang)} initial={{ category: editing.category, deviceId: editing.deviceId, name: editing.name, brand: editing.brand, model: editing.model, ports: editing.ports, sizeU: editing.sizeU, ip: editing.ip ?? "", serial: editing.serial ?? "", portMap: editing.portMap ?? "", connections: editing.connections ?? [] }} onClose={() => setEditing(null)} onSave={(d) => { updateDevice(editing.id, d); setEditing(null); }} />)}
    </div>
  );
};

/* -----------------------------
  Hover Card (tooltip)
----------------------------- */
function HoverCard({ x, y, d, beforePos, afterPos }: { x: number; y: number; d: Device; beforePos: string; afterPos: string; }) {
  const lang = useStore((s) => s.lang);
  const isAcc = d.category === "Accessory";
  return (
    <div className="fixed z-[9999] pointer-events-none" style={{ left: x + 16, top: y + 16 }}>
      <div 
        className="rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-[320px] p-4 text-left text-white"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] text-gray-300 font-medium">{t("hoverInfo", lang)} {isAcc && "(Acc)"}</div>
            <div className="font-black text-sm truncate text-white">{isAcc ? d.name : d.deviceId + " · " + d.name}</div>
            <div className="text-[11px] text-gray-300 truncate mt-0.5">{isAcc ? "-" : `${d.brand} / ${d.model}`} · {d.sizeU}U {isAcc ? "" : `· ${d.ports} ports`}</div>
          </div>
          <div className="pt-1">{!isAcc && <LampsRow m={d.migration} />}</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/10 p-2"><div className="text-[10px] text-gray-400">{t("hoverBefore", lang)}</div><div className="font-bold truncate text-white">{beforePos}</div></div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-2"><div className="text-[10px] text-gray-400">{t("hoverAfter", lang)}</div><div className="font-bold truncate text-white">{afterPos}</div></div>
        </div>
        {!isAcc && <div className="mt-3 text-[11px] text-gray-400 truncate">IP：{d.ip || "-"}　SN：{d.serial || "-"}</div>}
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
        <button onClick={() => setCollapsed(!collapsed)} className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 text-sm text-[var(--text)]">
          {collapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
        </button>
      </div>
      {!collapsed && (
        <div className="p-4">
          {unplaced.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {unplaced.map((d) => {
                const isAcc = d.category === "Accessory";
                return (
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
                        <div className="text-sm font-black truncate drop-shadow-md">{isAcc ? d.name : d.deviceId}</div>
                        {!isAcc && <div className="text-xs font-semibold opacity-90 truncate drop-shadow-sm mt-0.5">{d.name}</div>}
                        <div className="text-[10px] opacity-80 mt-1.5 truncate drop-shadow-sm">{isAcc ? "-" : `${d.brand} · ${d.model}`} · {d.sizeU}U</div>
                      </div>
                      <div className="pt-1 bg-black/20 p-1 rounded-md shadow-inner">
                        {isAcc ? <div className="text-[10px] px-1 opacity-70">Acc</div> : <LampsRow m={d.migration} />}
                      </div>
                    </div>
                  </div>
                );
              })}
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
  const initial: DeviceDraft = { category: "Other", deviceId: "", name: "", brand: "", model: "", ports: 8, sizeU: 1, ip: "", serial: "", portMap: "", connections: [] };
  const displayName = getRackName(rackId, lang);
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
      const map = new Map(racks.map((r) => [r.name || r.id.replace("BEF_",""), r]));
      const spec: string[][] = [
        ["10", "09", "08", "07", "06", "05", "04", "03", "02", "01"],
        ["2F-A", "2F-B", "3F-A", "3F-B", "4F-A", "4F-B", "9F", "SmartHouseA", "SmartHouseB", "New_Device"],
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
        <div className="flex gap-3 bg-[var(--panel)] p-2.5 rounded-xl border border-[var(--border)] shadow-sm text-xs font-bold shrink-0 flex-wrap text-[var(--text)]">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Network }}></div> Network</div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Server }}></div> Server</div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Storage }}></div> Storage</div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Accessory }}></div> Accessory</div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: FIXED_COLORS.Other }}></div> Other</div>
        </div>
      </div>

      <UnplacedPanel mode={mode} unplaced={unplaced} collapsed={collapsed} setCollapsed={setCollapsed} allowLayout={allowLayout} />

      <div className="space-y-8 overflow-hidden">
        {rackRows.map((row, idx) => (
          <div key={idx} className="flex gap-6 overflow-x-auto pb-4 items-start snap-x">
            {row.map((rack) => {
              const displayName = getRackName(rack.id, lang);
              const isRed = rack.id.includes("Unmoved") || rack.id.includes("New_Device");

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
                          const beforePos = d.beforeRackId && d.beforeStartU != null && d.beforeEndU != null ? `${getRackName(d.beforeRackId, lang)} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
                          const afterPos = d.afterRackId && d.afterStartU != null && d.afterEndU != null ? `${getRackName(d.afterRackId, lang)} ${d.afterStartU}-${d.afterEndU}U` : "-";
                          const isAcc = d.category === "Accessory";

                          return (
                            <div key={d.id} draggable={allowLayout} onDragStart={(ev) => { if (!allowLayout) return; ev.dataTransfer.setData("text/plain", d.id); setDraggingDevice(d); ev.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDraggingDevice(null)} onClick={() => setSelectedDeviceId(d.id)} onMouseMove={(e) => { setHoverId(d.id); setHoverInfo({ x: e.clientX, y: e.clientY, d, beforePos, afterPos }); }} onMouseLeave={() => { setHoverId(null); setHoverInfo(null); }} className={`absolute left-[2px] right-[2px] rounded flex flex-row items-center px-2 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all pointer-events-auto overflow-hidden ${isHovered ? "brightness-125 scale-[1.01] z-20 shadow-[0_0_15px_rgba(56,189,248,0.4)]" : "z-10"}`} style={{ bottom: bottom + 1, height: height - 2, backgroundColor: catColor(d.category), backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)", cursor: allowLayout ? "grab" : "pointer" }}>
                              <div className="flex-1 h-full flex flex-col justify-center min-w-0 pr-14 drop-shadow-md">
                                {d.sizeU >= 2 ? (
                                  <><div className="truncate w-full font-bold text-[10px] sm:text-[11px] leading-tight tracking-wide">{isAcc ? d.name : d.deviceId}</div>{!isAcc && <div className="truncate w-full text-[9px] sm:text-[10px] opacity-90 font-medium leading-tight mt-0.5">{d.brand} | {d.model}</div>}</>
                                ) : (<div className="truncate w-full font-bold text-[9px] sm:text-[10px] leading-tight">{isAcc ? d.name : `${d.deviceId} | ${d.name}`}</div>)}
                              </div>
                              {!isAcc && (
                                <div className="absolute bottom-1 right-1 flex items-center bg-black/40 px-1 py-[2px] rounded shadow-inner pointer-events-none scale-[0.7] sm:scale-[0.8] origin-bottom-right"><LampsRow m={d.migration} /></div>
                              )}
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
            <div><label className="text-xs text-[var(--muted)]">{t("account", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={a.username} onChange={(e) => setA((p) => ({ ...p, username: e.target.value }))} disabled={!creating} /></div>
            <div><label className="text-xs text-[var(--muted)]">{t("role", lang)}</label>
              <select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={a.role} onChange={(e) => setA((p) => ({ ...p, role: e.target.value as Role }))} disabled={isAdminAccount}>
                <option value="admin">Admin</option>
                <option value="cable">Cable</option>
                <option value="vendor">Vendor</option>
              </select></div>
            <div className="md:col-span-2"><label className="text-xs text-[var(--muted)]">{t("password", lang)}</label><input type="password" className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={a.password} onChange={(e) => setA((p) => ({ ...p, password: e.target.value }))} /></div>
          </div>
          <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--text)]">{t("btnCancel", lang)}</button><button onClick={() => { const res = upsertAccount(a); if (!res.ok) return alert(res.message); onClose(); }} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 flex items-center gap-2"><Save size={16} /> {t("btnSave", lang)}</button></div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><div className="flex items-center gap-2"><Shield className="text-[var(--accent)]" /><div className="text-lg font-black text-[var(--text)]">{t("navAdmin", lang)}</div></div></div>
          <button onClick={() => { setCreating(true); setEditing({ username: "", password: "", role: "vendor" }); }} className="bg-[var(--accent)] text-black px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 hover:opacity-90"><Plus size={18} /> {t("addAccount", lang)}</button>
        </div>
        <div className="mt-5 bg-[var(--panel2)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-[var(--muted)] text-xs uppercase tracking-wider"><tr><th className="px-4 py-3 font-semibold">{t("account", lang)}</th><th className="px-4 py-3 font-semibold">{t("role", lang)}</th><th className="px-4 py-3 font-semibold">{t("action", lang)}</th></tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {accounts.slice().sort((a, b) => a.username === "admin" ? -1 : b.username === "admin" ? 1 : a.username.localeCompare(b.username)).map((a) => (
                <tr key={a.username} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3"><div className="font-black text-[var(--text)]">{a.username}</div></td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--muted)] capitalize">{a.role}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-2 flex-wrap"><button onClick={() => { setCreating(false); setEditing(a); }} className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 text-sm text-[var(--text)]"><Edit3 size={16} /> {t("btnEdit", lang)}</button><button onClick={() => { const res = deleteAccount(a.username); if (!res.ok) return alert(res.message); }} disabled={a.username === "admin"} className={`px-3 py-2 rounded-xl border border-[var(--border)] flex items-center gap-2 text-sm ${a.username === "admin" ? "opacity-50 cursor-not-allowed text-[var(--muted)]" : "hover:bg-white/5 text-red-400"}`}><Trash2 size={16} /> {t("btnDel", lang)}</button></div></td>
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

          <select value={themeStyle} onChange={(e) => setThemeStyle(e.target.value as ThemeStyle)} className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-xs px-2 py-1 outline-none hidden md:block text-[var(--text)]">
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