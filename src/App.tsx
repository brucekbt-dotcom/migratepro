// ==========================================
// --- Part 1 開始 (約 第 1 ~ 420 行) ---
// ==========================================
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
  Link2,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  CalendarClock,
  Play,
  Check,
  Tv
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
type PageKey = "dashboard" | "devices" | "before" | "after" | "runbook" | "issues" | "guide" | "admin";
type DeviceCategory = "Network" | "Storage" | "Server" | "Accessory" | "Other";
type PlacementMode = "before" | "after";

type Role = "admin" | "vendor" | "cable";
type Lang = "zh" | "en" | "ko";

type MigrationFlags = { 
  racked: boolean; 
  cabled: boolean; 
  powered: boolean; 
  tested: boolean; 
};

type Rack = { 
  id: string; 
  name: string; 
  units: number; 
};

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

// 問題回報資料結構 (Issues Tracking)
type IssueReply = { 
  id: string; 
  text: string; 
  author: string; 
  createdAt: number; 
};
type IssueStatus = "open" | "resolved";
type Issue = { 
  id: string; 
  title: string; 
  description: string; 
  author: string; 
  createdAt: number; 
  status: IssueStatus; 
  replies: IssueReply[]; 
};

// 專案劇本資料結構 (Runbook / Gantt Chart)
type TaskStatus = "pending" | "in_progress" | "done" | "verified";
type Task = { 
  id: string; 
  title: string; 
  vendor: string; 
  dayIndex: number; 
  startHH: number; 
  endHH: number; 
  status: TaskStatus; 
};
type ProjectInfo = { 
  startDate: string; 
  days: number; 
};

type UiState = { 
  sideCollapsed: boolean; 
  unplacedCollapsedBefore: boolean; 
  unplacedCollapsedAfter: boolean; 
};
type LoginResult = { ok: boolean; message?: string };
type Account = { username: string; password: string; role: Role; };

/* -----------------------------
  LocalStorage Keys & Utils
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
  issues: "migrate.issues", 
  tasks: "migrate.tasks", 
  projectInfo: "migrate.projInfo"
} as const;

/* -----------------------------
  ★ 多語系字典 (i18n) ★
----------------------------- */
const DICT = {
  zh: {
    navDashboard: "儀表板", navDevices: "設備管理", navBefore: "搬遷前 配置", navAfter: "搬遷後 配置", navRunbook: "專案劇本", navIssues: "問題回報", navGuide: "系統說明", navAdmin: "管理後台",
    totalDevices: "設備總數", pending: "待處理", completed: "完成", racked: "已上架", cabled: "已接線", powered: "已開機", tested: "已測試",
    rackStatus: "機櫃佈局現況", unplaced: "未放置設備", allPlaced: "全部已放置", exportCsv: "完整CSV匯出", appendCsv: "批量添加", importCsv: "覆蓋還原", addDevice: "新增設備", deviceList: "設備資產清單", exportLabels: "匯出線路標籤",
    cat: "分類", devId: "編號", name: "名稱", brand: "廠牌", model: "型號", ports: "Ports", sizeU: "U", before: "搬遷前", after: "搬遷後", status: "狀態", done: "完成", action: "操作", connections: "線路",
    btnEdit: "編輯", btnClear: "清除", btnDel: "刪除", btnSave: "儲存", btnCancel: "取消", btnClose: "關閉", btnSaveChanges: "儲存變更", statusDone: "完成", statusUndone: "未完成",
    addDeviceTitle: "新增設備", editDeviceTitle: "編輯設備", addPlaceTitle: "新增並放置",
    fCat: "類別", fId: "設備編號", fName: "設備名稱", fBrand: "廠牌", fModel: "型號", fPorts: "Port數量", fU: "佔用高度(U)", fIp: "設備IP", fSn: "序號", fNote: "一般備註",
    detailTitle: "設備詳細", detailBefore: "搬遷前位置", detailAfter: "搬遷後位置", detailStatus: "搬遷狀態", readOnly: "唯讀", onlyAfterToggle: "※ 僅在「搬遷後」可切換狀態。", btnClearPlace: "清除本頁位置", cantLayout: "無法調整佈局", accessoryNoLamp: "※ 配件無須追蹤狀態",
    hoverInfo: "設備資訊", hoverBefore: "搬遷前", hoverAfter: "搬遷後", account: "帳號", role: "權限", password: "密碼", addAccount: "新增帳號", editAccount: "修改帳號",
    noDevices: "無設備", dragHere: "拖曳 CSV 上傳", orClick: "或點擊檔案", template: "範本", warningImport: "⚠️ 會覆蓋所有資料", warningAppend: "將加入到清單尾端",
    cableRouting: "智慧線路對接表", autoGenLabels: "動態標籤", addConnection: "新增對接", localPort: "本機Port", targetDevice: "目標設備", selectDevice: "選擇...", targetPort: "目標Port", unknownDev: "未知",
    outgoingConn: "➡️ 連出", incomingConn: "⬅️ 來自他台", lblSrcDev: "來源設備", lblTgtDev: "目的設備", lblBefSrc: "搬前-來源", lblBefTgt: "搬前-目的", lblAftSrc: "搬後-來源", lblAftTgt: "搬後-目的",
    rackNewDevice: "新購存放區", rackUnmovedA: "不搬區A", rackUnmovedB: "不搬區B", rackUnmovedC: "不上架存放區", rackSmartHouse: "SmartHouse",
    accCable1U: "1U 理線槽", accCable2U: "2U 理線槽", accBlank1U: "1U 盲板", accBlank2U: "2U 盲板", accShelf1U: "1U 層板", accShelf2U: "2U 層板", accPdu1U: "1U PDU", accPdu2U: "2U PDU", accFan1U: "1U 風扇", accKvm1U: "1U KVM",
    issuesTitle: "問題回報", addIssue: "回報新問題", issueTitle: "標題", issueDesc: "描述", issueSubmit: "送出", issueOpen: "未解決", issueResolved: "已解決", issueReplies: "則回覆", replyText: "輸入回覆...", replySubmit: "留言", markResolved: "標記已解決", reopenIssue: "重新開啟", deleteIssue: "刪除", author: "發布者", time: "時間", noIssues: "目前無問題！",
    rbTitle: "搬遷專案劇本", rbSetup: "專案設定", rbStart: "專案起日", rbDays: "總天數", rbAddTask: "新增任務", rbTaskName: "任務名稱", rbVendor: "負責廠商", rbStartTime: "開始時間", rbEndTime: "結束時間",
    rbPending: "未開始", rbProgress: "進行中", rbDone: "已完成", rbVerified: "已驗證", btnStart: "開始執行", btnDone: "回報完成", btnVerify: "驗證結案", tvModeOn: "退出輪播", tvModeOff: "戰情室輪播"
  },
  en: {
    navDashboard: "Dashboard", navDevices: "Devices", navBefore: "Before Config", navAfter: "After Config", navRunbook: "Runbook", navIssues: "Issues", navGuide: "Guide", navAdmin: "Admin",
    totalDevices: "Total Devices", pending: "Pending", completed: "Completed", racked: "Racked", cabled: "Cabled", powered: "Powered", tested: "Tested",
    rackStatus: "Rack Layout", unplaced: "Unplaced", allPlaced: "All placed", exportCsv: "Export CSV", appendCsv: "Append CSV", importCsv: "Import CSV", addDevice: "Add Device", deviceList: "Asset List", exportLabels: "Export Labels",
    cat: "Category", devId: "ID", name: "Name", brand: "Brand", model: "Model", ports: "Ports", sizeU: "U", before: "Before", after: "After", status: "Status", done: "Done", action: "Action", connections: "Links",
    btnEdit: "Edit", btnClear: "Clear", btnDel: "Del", btnSave: "Save", btnCancel: "Cancel", btnClose: "Close", btnSaveChanges: "Save", statusDone: "V", statusUndone: "X",
    addDeviceTitle: "Add Device", editDeviceTitle: "Edit", addPlaceTitle: "Add & Place",
    fCat: "Category", fId: "ID", fName: "Name", fBrand: "Brand", fModel: "Model", fPorts: "Ports", fU: "Size(U)", fIp: "IP", fSn: "SN", fNote: "Note",
    detailTitle: "Details", detailBefore: "Before Pos", detailAfter: "After Pos", detailStatus: "Status", readOnly: "Read Only", onlyAfterToggle: "※ Status toggles in 'After' page.", btnClearPlace: "Clear Pos", cantLayout: "Can't Layout", accessoryNoLamp: "※ Accessories have no status.",
    hoverInfo: "Info", hoverBefore: "Before", hoverAfter: "After", account: "Account", role: "Role", password: "Password", addAccount: "Add Account", editAccount: "Edit",
    noDevices: "No Devices", dragHere: "Drag CSV", orClick: "or click", template: "Template", warningImport: "⚠️ Overwrites ALL", warningAppend: "Appends to end",
    cableRouting: "Cable Routing", autoGenLabels: "Labels", addConnection: "Add Link", localPort: "Local Port", targetDevice: "Target", selectDevice: "Select...", targetPort: "Target Port", unknownDev: "Unknown",
    outgoingConn: "➡️ Out", incomingConn: "⬅️ In", lblSrcDev: "Src Dev", lblTgtDev: "Tgt Dev", lblBefSrc: "Bef Src", lblBefTgt: "Bef Tgt", lblAftSrc: "Aft Src", lblAftTgt: "Aft Tgt",
    rackNewDevice: "New Area", rackUnmovedA: "Unmoved A", rackUnmovedB: "Unmoved B", rackUnmovedC: "Unmoved C", rackSmartHouse: "SmartHouse",
    accCable1U: "1U Cable Mgr", accCable2U: "2U Cable Mgr", accBlank1U: "1U Blank", accBlank2U: "2U Blank", accShelf1U: "1U Shelf", accShelf2U: "2U Shelf", accPdu1U: "1U PDU", accPdu2U: "2U PDU", accFan1U: "1U Fan", accKvm1U: "1U KVM",
    issuesTitle: "Issues", addIssue: "New Issue", issueTitle: "Title", issueDesc: "Desc", issueSubmit: "Submit", issueOpen: "Open", issueResolved: "Resolved", issueReplies: "replies", replyText: "Reply...", replySubmit: "Send", markResolved: "Resolve", reopenIssue: "Reopen", deleteIssue: "Delete", author: "By", time: "Time", noIssues: "No issues!",
    rbTitle: "Project Runbook", rbSetup: "Setup", rbStart: "Start Date", rbDays: "Total Days", rbAddTask: "Add Task", rbTaskName: "Task Name", rbVendor: "Vendor", rbStartTime: "Start", rbEndTime: "End",
    rbPending: "Pending", rbProgress: "In Progress", rbDone: "Done", rbVerified: "Verified", btnStart: "Start", btnDone: "Mark Done", btnVerify: "Verify", tvModeOn: "Exit TV Mode", tvModeOff: "TV Mode"
  },
  ko: {
    navDashboard: "대시보드", navDevices: "장치 관리", navBefore: "이전 전 구성", navAfter: "이전 후 구성", navRunbook: "런북(일정)", navIssues: "이슈", navGuide: "가이드", navAdmin: "관리자",
    totalDevices: "총 장치", pending: "대기중", completed: "완료", racked: "랙 장착", cabled: "케이블", powered: "전원", tested: "테스트",
    rackStatus: "랙 레이아웃", unplaced: "미배치", allPlaced: "모두 배치됨", exportCsv: "CSV 내보내기", appendCsv: "CSV 추가", importCsv: "CSV 복원", addDevice: "장치 추가", deviceList: "장치 목록", exportLabels: "라벨 내보내기",
    cat: "분류", devId: "ID", name: "이름", brand: "브랜드", model: "모델", ports: "포트", sizeU: "U", before: "이전 전", after: "이전 후", status: "상태", done: "완료", action: "작업", connections: "연결",
    btnEdit: "편집", btnClear: "지우기", btnDel: "삭제", btnSave: "저장", btnCancel: "취소", btnClose: "닫기", btnSaveChanges: "변경 저장", statusDone: "V", statusUndone: "X",
    addDeviceTitle: "장치 추가", editDeviceTitle: "편집", addPlaceTitle: "추가 및 배치",
    fCat: "분류", fId: "ID", fName: "이름", fBrand: "브랜드", fModel: "모델", fPorts: "포트", fU: "크기(U)", fIp: "IP", fSn: "SN", fNote: "메모",
    detailTitle: "상세 정보", detailBefore: "이전 전 위치", detailAfter: "이전 후 위치", detailStatus: "상태", readOnly: "읽기 전용", onlyAfterToggle: "※ 이전 후 페이지에서만 변경 가능", btnClearPlace: "위치 지우기", cantLayout: "레이아웃 불가", accessoryNoLamp: "※ 액세서리는 상태 없음",
    hoverInfo: "정보", hoverBefore: "이전 전", hoverAfter: "이전 후", account: "계정", role: "역할", password: "비밀번호", addAccount: "계정 추가", editAccount: "편집",
    noDevices: "장치 없음", dragHere: "CSV 드래그", orClick: "또는 클릭", template: "템플릿", warningImport: "⚠️ 덮어쓰기", warningAppend: "끝에 추가",
    cableRouting: "스마트 라우팅", autoGenLabels: "라벨", addConnection: "연결 추가", localPort: "로컬 포트", targetDevice: "대상 장치", selectDevice: "선택...", targetPort: "대상 포트", unknownDev: "알 수 없음",
    outgoingConn: "➡️ 발신", incomingConn: "⬅️ 수신", lblSrcDev: "소스 장치", lblTgtDev: "대상 장치", lblBefSrc: "이전전 소스", lblBefTgt: "이전전 대상", lblAftSrc: "이전후 소스", lblAftTgt: "이전후 대상",
    rackNewDevice: "신규 구역", rackUnmovedA: "미이전 A", rackUnmovedB: "미이전 B", rackUnmovedC: "미이전 C", rackSmartHouse: "SmartHouse",
    accCable1U: "1U 케이블 매니저", accCable2U: "2U 케이블 매니저", accBlank1U: "1U 블랭크", accBlank2U: "2U 블랭크", accShelf1U: "1U 선반", accShelf2U: "2U 선반", accPdu1U: "1U PDU", accPdu2U: "2U PDU", accFan1U: "1U 팬", accKvm1U: "1U KVM",
    issuesTitle: "이슈", addIssue: "새 이슈", issueTitle: "제목", issueDesc: "설명", issueSubmit: "제출", issueOpen: "미해결", issueResolved: "해결됨", issueReplies: "답변", replyText: "답변...", replySubmit: "보내기", markResolved: "해결 표시", reopenIssue: "다시 열기", deleteIssue: "삭제", author: "작성자", time: "시간", noIssues: "이슈 없음!",
    rbTitle: "런북 (일정)", rbSetup: "설정", rbStart: "시작일", rbDays: "총 일수", rbAddTask: "작업 추가", rbTaskName: "작업명", rbVendor: "담당", rbStartTime: "시작", rbEndTime: "종료",
    rbPending: "대기", rbProgress: "진행중", rbDone: "완료", rbVerified: "검증됨", btnStart: "시작", btnDone: "완료보고", btnVerify: "검증", tvModeOn: "TV 모드 끄기", tvModeOff: "TV 모드 켜기"
  }
};

const t = (key: keyof typeof DICT.zh, lang: Lang) => DICT[lang]?.[key] || DICT.zh[key];
const getAccessoryOptions = (lang: Lang) => [
  t("accCable1U", lang), t("accCable2U", lang), t("accBlank1U", lang), t("accBlank2U", lang),
  t("accShelf1U", lang), t("accShelf2U", lang), t("accPdu1U", lang), t("accPdu2U", lang),
  t("accFan1U", lang), t("accKvm1U", lang)
];

/* -----------------------------
  Fixed Colors & Racks
----------------------------- */
const FIXED_COLORS = { 
  Network: "#22c55e", 
  Server: "#3b82f6", 
  Storage: "#8b5cf6", // ★ 科技紫 
  Accessory: "#64748b", 
  Other: "#fb923c" 
};

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
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } 
};
const writeJson = (k: string, v: any) => { 
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {} 
};

// 雲端同步唯一入口
const syncToCloudFull = async (s: any) => {
  try { await setDoc(doc(db, "migratePro", "mainState"), JSON.parse(JSON.stringify(s)), { merge: true }); } catch (e) {}
};

// 時間戳工具
const getTimestamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatHH = (hh: number) => {
  return `${String(Math.floor(hh/2)).padStart(2,'0')}:${hh%2===0?'00':'30'}`;
};

// 廠商自動分配智慧色盤
const getVendorColor = (name: string) => {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f43f5e", "#84cc16", "#14b8a6", "#d946ef"];
  let hash = 0; 
  for(let i=0; i<name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
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
  const link = document.createElement("a"); 
  link.setAttribute("href", encodedUri); 
  link.setAttribute("download", `MigratePro_FullBackup_${getTimestamp()}.csv`); // ★ 動態時間戳
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
  const link = document.createElement("a"); 
  link.setAttribute("href", encodedUri); 
  link.setAttribute("download", `CableLabels_${getTimestamp()}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const downloadFullCSVTemplate = () => {
  const csvContent = "\uFEFF" + CSV_HEADER + "\n";
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a"); 
  link.setAttribute("href", encodedUri); 
  link.setAttribute("download", "MigratePro_Template.csv");
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
    let connections = []; 
    try { connections = typeof d?.connections === 'string' ? JSON.parse(d.connections) : (d?.connections || []); } catch(e){}

    return {
      id: String(d?.id ?? crypto.randomUUID()), 
      category: (d?.category as DeviceCategory) || "Other",
      deviceId: String(d?.deviceId ?? ""), 
      name: String(d?.name ?? ""), 
      brand: String(d?.brand ?? ""), 
      model: String(d?.model ?? ""),
      ports: Number(d?.ports ?? 0), 
      sizeU, 
      ip: String(d?.ip ?? ""), 
      serial: String(d?.serial ?? ""), 
      portMap: String(d?.portMap ?? ""),
      connections: Array.isArray(connections) ? connections : [],
      beforeRackId, 
      beforeStartU: d?.beforeStartU ?? undefined, 
      beforeEndU: d?.beforeEndU ?? undefined,
      afterRackId, 
      afterStartU: d?.afterStartU ?? undefined, 
      afterEndU: d?.afterEndU ?? undefined,
      migration: { 
        racked: Boolean(d?.migration?.racked ?? false), 
        cabled: Boolean(d?.migration?.cabled ?? false), 
        powered: Boolean(d?.migration?.powered ?? false), 
        tested: Boolean(d?.migration?.tested ?? false) 
      },
    } as Device;
  });
};
// ==========================================
// --- Part 1 結束 ---
// ==========================================
// ==========================================
// --- Part 2 開始 (約 第 421 ~ 750 行) ---
// ==========================================

/* -----------------------------
  Store Definition
----------------------------- */
interface Store {
  devices: Device[];
  issues: Issue[];
  tasks: Task[];
  projectInfo: ProjectInfo;

  theme: ThemeMode;
  themeStyle: ThemeStyle;
  lang: Lang;
  page: PageKey;
  selectedDeviceId: string | null;
  ui: UiState;
  draggingDevice: Device | null;

  accounts: Account[];
  isAuthed: boolean;
  userName: string | null;
  role: Role;

  setDraggingDevice: (d: Device | null) => void;
  upsertAccount: (a: Account) => { ok: boolean; message?: string };
  deleteAccount: (username: string) => { ok: boolean; message?: string };
  login: (u: string, p: string) => LoginResult;
  logout: () => void;

  setPage: (p: PageKey) => void;
  toggleTheme: () => void;
  setThemeStyle: (s: ThemeStyle) => void;
  setLang: (l: Lang) => void;
  setSelectedDeviceId: (id: string | null) => void;
  setUi: (patch: Partial<UiState>) => void;

  addDevice: (draft: DeviceDraft) => string;
  updateDevice: (id: string, patch: Partial<DeviceDraft | { portMap?: string; connections?: Connection[] }>) => void;
  deleteDeviceById: (id: string) => void;

  importFullCSV: (fileText: string) => { ok: boolean; message?: string };
  appendDevicesFromCSV: (fileText: string) => { ok: boolean; message?: string };

  clearPlacement: (mode: PlacementMode, id: string) => void;
  place: (mode: PlacementMode, deviceId: string, rackId: string, startU: number) => { ok: boolean; message?: string };

  setMigrationFlag: (id: string, patch: Partial<MigrationFlags>) => void;
  repairRackIds: () => void;

  addIssue: (title: string, desc: string) => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  deleteIssue: (id: string) => void;
  addIssueReply: (id: string, text: string) => void;

  updateProjectInfo: (info: ProjectInfo) => void;
  addTask: (task: Omit<Task, "id" | "status">) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
}

const DEFAULT_UI: UiState = {
  sideCollapsed: false,
  unplacedCollapsedBefore: false,
  unplacedCollapsedAfter: false
};

function loadAccounts(): Account[] {
  const v = readJson<Account[]>(LS.accounts, []);
  if (!Array.isArray(v) || v.length === 0) {
    const d = [{ username: "admin", password: "123", role: "admin" as Role }];
    writeJson(LS.accounts, d);
    return d;
  }
  const a = v.some((x) => x.username === "admin") ? v : [{ username: "admin", password: "123", role: "admin" as Role }, ...v];
  return a.map(x => x.username === "admin" ? { ...x, role: "admin" } : x);
}

const useStore = create<Store>((set, get) => ({
  devices: normalizeDevices(readJson<Device[]>(LS.devices, [])),
  issues: readJson<Issue[]>(LS.issues, []),
  tasks: readJson<Task[]>(LS.tasks, []),
  projectInfo: readJson<ProjectInfo>(LS.projectInfo, { startDate: getTimestamp().slice(0, 10), days: 3 }),

  theme: (localStorage.getItem(LS.theme) as ThemeMode) || "dark",
  themeStyle: (localStorage.getItem(LS.themeStyle) as ThemeStyle) || "neon",
  lang: (localStorage.getItem(LS.lang) as Lang) || "zh",
  page: "dashboard",
  selectedDeviceId: null,
  ui: { ...DEFAULT_UI, ...readJson<UiState>(LS.ui, {} as UiState) },
  draggingDevice: null,
  accounts: loadAccounts(),

  isAuthed: localStorage.getItem(LS.auth) === "1",
  userName: localStorage.getItem(LS.user) || null,
  role: (() => {
    const u = localStorage.getItem(LS.user);
    if (u === "admin") return "admin";
    return loadAccounts().find((a) => a.username === u)?.role ?? "vendor";
  })(),

  setDraggingDevice: (d) => set({ draggingDevice: d }),

  upsertAccount: (a) => {
    const username = a.username.trim();
    if (!username || username.includes(" ") || !a.password) return { ok: false };
    const next = get().accounts.some((x) => x.username === username)
      ? get().accounts.map((x) => (x.username === username ? { ...a, username } : x))
      : [...get().accounts, { ...a, username }];
    writeJson(LS.accounts, next);
    syncToCloudFull({ accounts: next });
    set({ accounts: next });
    return { ok: true };
  },

  deleteAccount: (username) => {
    if (username === "admin") return { ok: false };
    const next = get().accounts.filter((a) => a.username !== username);
    writeJson(LS.accounts, next);
    syncToCloudFull({ accounts: next });
    set({ accounts: next });
    return { ok: true };
  },

  login: (u, p) => {
    const f = get().accounts.find((a) => a.username === u.trim() && a.password === p);
    if (!f) return { ok: false };
    localStorage.setItem(LS.auth, "1");
    localStorage.setItem(LS.user, u.trim());
    set({ isAuthed: true, userName: u.trim(), role: f.role, page: "dashboard", selectedDeviceId: null });
    return { ok: true };
  },

  logout: () => {
    localStorage.removeItem(LS.auth);
    localStorage.removeItem(LS.user);
    set({ isAuthed: false, userName: null, role: "vendor", page: "dashboard", selectedDeviceId: null });
  },

  setPage: (page) => set({ page }),
  
  toggleTheme: () => set((s) => {
    const next = s.theme === "dark" ? "light" : "dark";
    localStorage.setItem(LS.theme, next);
    return { theme: next };
  }),

  setThemeStyle: (themeStyle) => {
    localStorage.setItem(LS.themeStyle, themeStyle);
    set({ themeStyle });
  },

  setLang: (lang) => {
    localStorage.setItem(LS.lang, lang);
    set({ lang });
  },

  setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),

  setUi: (p) => set((s) => {
    const next = { ...s.ui, ...p };
    writeJson(LS.ui, next);
    return { ui: next };
  }),

  addDevice: (draft) => {
    const id = crypto.randomUUID();
    set((s) => {
      const next = [
        ...s.devices,
        { ...draft, id, migration: { racked: false, cabled: false, powered: false, tested: false } } as Device
      ];
      writeJson(LS.devices, next);
      syncToCloudFull({ devices: next });
      return { devices: next };
    });
    return id;
  },

  updateDevice: (id, patch) => set((s) => {
    const next = s.devices.map((d) => d.id === id ? ({ ...d, ...patch } as Device) : d);
    writeJson(LS.devices, next);
    syncToCloudFull({ devices: next });
    return { devices: next };
  }),

  deleteDeviceById: (id) => set((s) => {
    const next = s.devices.filter((d) => d.id !== id);
    writeJson(LS.devices, next);
    syncToCloudFull({ devices: next });
    return { devices: next, selectedDeviceId: s.selectedDeviceId === id ? null : s.selectedDeviceId };
  }),

  importFullCSV: (fileText) => {
    try {
      const rows = parseCSV(fileText);
      if (rows.length < 2) return { ok: false, message: "CSV Empty" };
      const header = rows[0].map((x) => x.trim());
      const getv = (r: string[], k: string) => String(r[header.indexOf(k)] || "").trim();

      const devs: Device[] = rows.slice(1).map(row => ({
        id: getv(row, "id") || crypto.randomUUID(),
        category: (getv(row, "category") as DeviceCategory) || "Other",
        deviceId: getv(row, "deviceId"),
        name: getv(row, "name"),
        brand: getv(row, "brand"),
        model: getv(row, "model"),
        ports: Number(getv(row, "ports")) || 0,
        sizeU: Math.max(1, Math.min(42, Number(getv(row, "sizeU")) || 1)),
        ip: getv(row, "ip"),
        serial: getv(row, "serial"),
        portMap: getv(row, "portMap"),
        connections: (() => {
          try {
            return JSON.parse(getv(row, "connections"));
          } catch (e) {
            return [];
          }
        })(),
        beforeRackId: backwardCompatRackId(getv(row, "beforeRackId") || undefined),
        beforeStartU: getv(row, "beforeStartU") ? Number(getv(row, "beforeStartU")) : undefined,
        beforeEndU: getv(row, "beforeEndU") ? Number(getv(row, "beforeEndU")) : undefined,
        afterRackId: backwardCompatRackId(getv(row, "afterRackId") || undefined),
        afterStartU: getv(row, "afterStartU") ? Number(getv(row, "afterStartU")) : undefined,
        afterEndU: getv(row, "afterEndU") ? Number(getv(row, "afterEndU")) : undefined,
        migration: {
          racked: getv(row, "m_racked") === "1",
          cabled: getv(row, "m_cabled") === "1",
          powered: getv(row, "m_powered") === "1",
          tested: getv(row, "m_tested") === "1"
        }
      }));

      writeJson(LS.devices, devs);
      syncToCloudFull({ devices: devs });
      set({ devices: devs });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, message: "Import Failed" };
    }
  },

  appendDevicesFromCSV: (fileText) => {
    try {
      const rows = parseCSV(fileText);
      if (rows.length < 2) return { ok: false, message: "CSV Empty" };
      const header = rows[0].map((x) => x.trim());
      const getv = (r: string[], k: string) => String(r[header.indexOf(k)] || "").trim();
      
      const newDevs: Device[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3) continue;
        const dId = getv(row, "deviceId");
        const nm = getv(row, "name");
        if (!dId || !nm) continue;
        newDevs.push({
          id: crypto.randomUUID(),
          category: (getv(row, "category") as DeviceCategory) || "Other",
          deviceId: dId,
          name: nm,
          brand: getv(row, "brand"),
          model: getv(row, "model"),
          ports: Number(getv(row, "ports")) || 0,
          sizeU: Math.max(1, Math.min(42, Number(getv(row, "sizeU")) || 1)),
          ip: getv(row, "ip"),
          serial: getv(row, "serial"),
          portMap: getv(row, "portMap"),
          connections: [],
          migration: { racked: false, cabled: false, powered: false, tested: false }
        });
      }
      
      const updated = [...get().devices, ...newDevs];
      writeJson(LS.devices, updated);
      syncToCloudFull({ devices: updated });
      set({ devices: updated });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, message: "Append Failed" };
    }
  },

  clearPlacement: (mode, id) => set((s) => {
    const next = s.devices.map(d => {
      if (d.id !== id) return d;
      return mode === "before" 
        ? { ...d, beforeRackId: undefined, beforeStartU: undefined, beforeEndU: undefined } 
        : { ...d, afterRackId: undefined, afterStartU: undefined, afterEndU: undefined };
    });
    writeJson(LS.devices, next);
    syncToCloudFull({ devices: next });
    return { devices: next };
  }),

  place: (mode, deviceId, rackId, startU) => {
    const devs = get().devices;
    const d = devs.find(x => x.id === deviceId);
    if (!d) return { ok: false };
    const s = clampU(startU);
    const e = s + Math.max(1, Math.min(42, d.sizeU)) - 1;
    if (e > 42) return { ok: false, message: "Exceeds 42U" };

    const collision = devs.find(x => {
      if (x.id === deviceId) return false;
      const xr = mode === "before" ? x.beforeRackId : x.afterRackId;
      const xs = mode === "before" ? x.beforeStartU : x.afterStartU;
      const xe = mode === "before" ? x.beforeEndU : x.afterEndU;
      return xr === rackId && xs != null && xe != null && rangesOverlap(s, e, xs, xe);
    });

    if (collision) return { ok: false, message: `Collision: ${collision.deviceId || collision.name}` };

    const next = devs.map(x => {
      if (x.id !== deviceId) return x;
      return mode === "before" 
        ? { ...x, beforeRackId: rackId, beforeStartU: s, beforeEndU: e } 
        : { ...x, afterRackId: rackId, afterStartU: s, afterEndU: e };
    });

    writeJson(LS.devices, next);
    syncToCloudFull({ devices: next });
    set({ devices: next });
    return { ok: true };
  },

  setMigrationFlag: (id, patch) => set((s) => {
    const next = s.devices.map(d => d.id === id ? { ...d, migration: { ...d.migration, ...patch } } : d);
    writeJson(LS.devices, next);
    syncToCloudFull({ devices: next });
    return { devices: next };
  }),

  repairRackIds: () => set((s) => {
    const next = s.devices.map(d => ({
      ...d,
      beforeRackId: backwardCompatRackId(d.beforeRackId),
      afterRackId: backwardCompatRackId(d.afterRackId)
    }));
    writeJson(LS.devices, next);
    syncToCloudFull({ devices: next });
    return { devices: next };
  }),

  addIssue: (title, description) => set((s) => {
    const newIssue: Issue = {
      id: crypto.randomUUID(),
      title,
      description,
      author: s.userName || "Unknown",
      createdAt: Date.now(),
      status: "open",
      replies: []
    };
    const next = [newIssue, ...s.issues];
    writeJson(LS.issues, next);
    syncToCloudFull({ issues: next });
    return { issues: next };
  }),

  updateIssueStatus: (id, status) => set((s) => {
    const next = s.issues.map(i => i.id === id ? { ...i, status } : i);
    writeJson(LS.issues, next);
    syncToCloudFull({ issues: next });
    return { issues: next };
  }),

  deleteIssue: (id) => set((s) => {
    const next = s.issues.filter(i => i.id !== id);
    writeJson(LS.issues, next);
    syncToCloudFull({ issues: next });
    return { issues: next };
  }),

  addIssueReply: (id, text) => set((s) => {
    const reply: IssueReply = {
      id: crypto.randomUUID(),
      text,
      author: s.userName || "Unknown",
      createdAt: Date.now()
    };
    const next = s.issues.map(i => i.id === id ? { ...i, replies: [...i.replies, reply] } : i);
    writeJson(LS.issues, next);
    syncToCloudFull({ issues: next });
    return { issues: next };
  }),
  
  updateProjectInfo: (info) => set((s) => {
    writeJson(LS.projectInfo, info);
    syncToCloudFull({ projectInfo: info });
    return { projectInfo: info };
  }),

  addTask: (t) => set((s) => {
    const newTask: Task = { ...t, id: crypto.randomUUID(), status: "pending" };
    const next = [...s.tasks, newTask];
    writeJson(LS.tasks, next);
    syncToCloudFull({ tasks: next });
    return { tasks: next };
  }),

  updateTaskStatus: (id, status) => set((s) => {
    const next = s.tasks.map(t => t.id === id ? { ...t, status } : t);
    writeJson(LS.tasks, next);
    syncToCloudFull({ tasks: next });
    return { tasks: next };
  }),

  deleteTask: (id) => set((s) => {
    const next = s.tasks.filter(t => t.id !== id);
    writeJson(LS.tasks, next);
    syncToCloudFull({ tasks: next });
    return { tasks: next };
  })
}));

// ==========================================
// --- Part 2 結束 ---
// ==========================================
// ==========================================
// --- Part 3 開始 (約 第 751 ~ 1400 行) ---
// ==========================================

/* -----------------------------
  UI 共用元件 (Theme, Switch, Lamps)
----------------------------- */
const ThemeTokens = () => {
  const style = useStore((s) => s.themeStyle);
  const presets: Record<ThemeStyle, { light: string; dark: string }> = {
    neon: {
      light: ":root{--bg:#f7fafc;--panel:#ffffff;--panel2:#f1f5f9;--text:#0b1220;--muted:#475569;--border:#e2e8f0;--accent:#06b6d4;--accent2:#a855f7;--onColor:#f8fafc;}",
      dark: "html.dark{--bg:#05070d;--panel:#0b1220;--panel2:#1a2235;--text:#e5e7eb;--muted:#94a3b8;--border:#1e293b;--accent:#22d3ee;--accent2:#c084fc;--onColor:#f8fafc;}"
    },
    horizon: {
      light: ":root{--bg:#f6f9ff;--panel:#ffffff;--panel2:#eef3ff;--text:#0a1020;--muted:#5b6478;--border:#e6ebff;--accent:#2563eb;--accent2:#14b8a6;--onColor:#f8fafc;}",
      dark: "html.dark{--bg:#070a14;--panel:#0b1020;--panel2:#101a33;--text:#f1f5f9;--muted:#9aa4b2;--border:#1a2550;--accent:#60a5fa;--accent2:#2dd4bf;--onColor:#f8fafc;}"
    },
    nebula: {
      light: ":root{--bg:#fbf7ff;--panel:#ffffff;--panel2:#f6edff;--text:#140a20;--muted:#6b5b7a;--border:#f0e1ff;--accent:#7c3aed;--accent2:#ec4899;--onColor:#f8fafc;}",
      dark: "html.dark{--bg:#080614;--panel:#0f0b1f;--panel2:#1a1233;--text:#f8fafc;--muted:#a7a1b2;--border:#2a1f4d;--accent:#a78bfa;--accent2:#fb7185;--onColor:#f8fafc;}"
    },
    matrix: {
      light: ":root{--bg:#f7fbf9;--panel:#ffffff;--panel2:#edf7f2;--text:#07140f;--muted:#5a6b63;--border:#dff2e8;--accent:#10b981;--accent2:#06b6d4;--onColor:#07140f;}",
      dark: "html.dark{--bg:#050c09;--panel:#0a1410;--panel2:#0f1f18;--text:#eafff6;--muted:#9bb7ab;--border:#153026;--accent:#34d399;--accent2:#22d3ee;--onColor:#07140f;}"
    },
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
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
}

const catColor = (cat: DeviceCategory) => FIXED_COLORS[cat] || FIXED_COLORS.Other;

const Lamp = ({ on }: { on: boolean }) => (
  <span
    className="inline-block w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
    style={{
      backgroundColor: on ? "rgb(0,255,0)" : "rgb(255,0,0)",
      boxShadow: on ? "0 0 10px rgba(0,255,0,0.85)" : "0 0 10px rgba(255,0,0,0.75)"
    }}
  />
);

const LampsRow = ({ m, isAccessory }: { m: MigrationFlags, isAccessory?: boolean }) => {
  if (isAccessory) return null;
  return (
    <div className="flex items-center gap-1.5">
      <Lamp on={m.racked} />
      <Lamp on={m.cabled} />
      <Lamp on={m.powered} />
      <Lamp on={m.tested} />
    </div>
  );
};

function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full border transition-all ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${on ? "bg-[rgba(0,255,0,0.12)] border-[rgba(0,255,0,0.7)]" : "bg-black/20 border-[var(--border)]"}`}
      style={{ boxShadow: on ? "0 0 16px rgba(0,255,0,0.25)" : "none" }}
    >
      <span
        className="block w-5 h-5 rounded-full bg-white transition-all"
        style={{ transform: `translateX(${on ? "20px" : "2px"})` }}
      />
    </button>
  );
}

/* -----------------------------
  登入頁面 (Login)
----------------------------- */
function LoginPage() {
  const login = useStore(s => s.login);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const handleLogin = () => {
    setErr(null);
    const res = login(u, p);
    if (!res.ok) setErr("Login Failed. Please check your credentials.");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
      <ThemeTokens />
      <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-3xl shadow-2xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] shadow-lg">
            <Server size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text)] tracking-tight">MigratePro</div>
            <div className="text-sm text-[var(--muted)]">機房搬遷專案管理</div>
          </div>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-[var(--muted)] ml-1">Account</label>
            <input
              className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors"
              value={u}
              onChange={e => setU(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--muted)] ml-1">Password</label>
            <input
              type="password"
              className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors"
              value={p}
              onChange={e => setP(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
              placeholder="Enter your password"
            />
          </div>
          
          {err && (
            <div className="text-sm text-red-500 font-medium bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
              {err}
            </div>
          )}
          
          <button
            onClick={handleLogin}
            className="w-full mt-4 bg-[var(--accent)] text-black font-extrabold py-3.5 rounded-xl hover:opacity-90 shadow-lg shadow-[var(--accent)]/20 transition-all active:scale-[0.98]"
          >
            Login to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
  專案劇本：共用甘特圖元件
----------------------------- */
const RunbookGanttGrid = ({ tasks, dayIndex, readOnly }: { tasks: Task[], dayIndex: number, readOnly?: boolean }) => {
  const dayTasks = tasks.filter(t => t.dayIndex === dayIndex).sort((a, b) => a.startHH - b.startHH);
  
  const getStatusIcon = (s: TaskStatus) => {
    if (s === 'verified') return <CheckCircle2 size={12} className="text-white drop-shadow-md" />;
    if (s === 'done') return <Check size={12} className="text-white drop-shadow-md" />;
    if (s === 'in_progress') return <Play size={12} className="text-white drop-shadow-md animate-pulse" />;
    return null;
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[1000px] border border-[var(--border)] bg-[var(--panel2)] rounded-xl p-4 shadow-inner relative">
        {/* 時間軸 Header (48 格，每 2 格顯示一次小時) */}
        <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="col-span-2 text-[10px] font-bold text-[var(--muted)] border-l border-[var(--border)] pl-1">
              {String(i).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        
        {/* 任務長條圖 */}
        <div className="space-y-2 relative z-10">
          {dayTasks.length === 0 && (
            <div className="text-sm text-[var(--muted)] py-8 italic text-center">
              目前此日期尚未安排任何任務。
            </div>
          )}
          
          {dayTasks.map(t => (
            <div key={t.id} className="grid gap-1 items-center h-8" style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}>
              <div
                style={{ 
                  gridColumn: `${t.startHH + 1} / ${t.endHH + 1}`, 
                  backgroundColor: getVendorColor(t.vendor) 
                }}
                className={`h-full rounded-md px-2 text-[11px] font-bold text-white flex items-center justify-between shadow-sm overflow-hidden transition-all ${t.status === 'done' ? 'opacity-80' : ''} ${t.status === 'verified' ? 'opacity-40 grayscale' : ''}`}
                title={`${formatHH(t.startHH)} - ${formatHH(t.endHH)} | ${t.title} (${t.vendor})`}
              >
                <span className="truncate pr-2 drop-shadow-md tracking-wide">{t.title}</span>
                <div className="flex items-center gap-1.5 shrink-0 bg-black/20 px-1.5 py-0.5 rounded shadow-inner">
                  {getStatusIcon(t.status)}
                  <span className="truncate max-w-[60px] opacity-90">{t.vendor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 背景垂直格線 */}
        <div className="absolute top-10 bottom-4 left-4 right-4 grid gap-1 pointer-events-none z-0" style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}>
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className={`border-l ${i % 2 === 0 ? 'border-[var(--border)] opacity-40' : 'border-[var(--border)] opacity-10'} h-full`} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* -----------------------------
  儀表板 (Dashboard) 專用元件
----------------------------- */
const DashboardGanttView = () => {
  const tasks = useStore(s => s.tasks);
  return (
    <div className="h-[500px] xl:h-[600px] overflow-y-auto pr-2">
      <RunbookGanttGrid tasks={tasks} dayIndex={0} readOnly />
    </div>
  );
};

const DashboardFullCarousel = ({ devices, racks }: { devices: Device[]; racks: Rack[] }) => {
  const lang = useStore(s => s.lang);
  
  // 只過濾出 A 排與 B 排的機櫃來輪播，保持大畫面專注
  const p1 = useMemo(() => racks.filter((r) => r.id.includes("AFT_A") || r.id.includes("AFT_B")), [racks]);
  
  return (
    <div className="flex gap-2 lg:gap-3 overflow-x-auto w-full flex-1 min-h-[500px] xl:min-h-[600px] pb-2 scrollbar-hide snap-x">
      {p1.map(rack => {
        const rackDevs = devices.filter(d => d.afterRackId === rack.id && d.afterStartU != null && d.afterEndU != null);
        const displayName = getRackName(rack.id, lang);
        
        return (
          <div key={rack.id} className="flex flex-col bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 snap-center border border-slate-700 min-w-[130px] lg:min-w-0 flex-1 shadow-lg">
            <div className="px-2 py-2.5 text-center text-xs xl:text-sm font-black text-white truncate bg-emerald-600 shadow-md">
              {displayName}
            </div>
            <div className="relative w-full border-x-[6px] border-t-[6px] border-slate-600 bg-[#0b1220] shadow-inner flex-1">
              <div className="absolute inset-0 pointer-events-none z-10">
                {rackDevs.map(d => {
                  const sU = clampU(d.afterStartU ?? 1);
                  const eU = clampU(d.afterEndU ?? sU);
                  const start = Math.min(sU, eU);
                  const size = Math.abs(eU - sU) + 1;
                  const isAcc = d.category === "Accessory";
                  
                  return (
                    <div 
                      key={d.id} 
                      className="absolute left-[2px] right-[2px] rounded flex justify-between items-center pl-1.5 md:pl-2 overflow-hidden shadow-md border border-white/10"
                      style={{ 
                        bottom: `${((start - 1) / 42) * 100}%`, 
                        height: `calc(${(size / 42) * 100}% - 2px)`, 
                        backgroundColor: catColor(d.category), 
                        backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.25) 100%)" 
                      }}
                    >
                      <div className="flex-1 text-[10px] xl:text-[12px] 2xl:text-[14px] text-white font-bold truncate text-left drop-shadow-md pr-1 tracking-wider">
                        {isAcc ? d.name : d.deviceId}
                      </div>
                      {!isAcc && (
                        <div className="flex shrink-0 bg-black/40 rounded-md p-1 mr-1 scale-[0.6] xl:scale-[0.7] shadow-inner">
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
  );
};

const Dashboard = () => {
  const devices = useStore((s) => s.devices);
  const afterRacks = useStore((s) => s.afterRacks);
  const lang = useStore((s) => s.lang);
  
  // 計算遷移 KPI
  const validDevs = devices.filter(d => d.category !== "Accessory");
  const total = validDevs.length;
  const racked = validDevs.filter((d) => d.migration.racked).length;
  const cabled = validDevs.filter((d) => d.migration.cabled).length;
  const powered = validDevs.filter((d) => d.migration.powered).length;
  const tested = validDevs.filter((d) => d.migration.tested).length;
  const completed = validDevs.filter((d) => isMigratedComplete(d.migration)).length;
  const pending = Math.max(0, total - completed);
  
  const calcPct = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0;

  // 設備類型微型標籤資料
  const chartData = [
    { name: "NW", count: devices.filter(d => d.category === "Network").length, fill: FIXED_COLORS.Network },
    { name: "SRV", count: devices.filter(d => d.category === "Server").length, fill: FIXED_COLORS.Server },
    { name: "STG", count: devices.filter(d => d.category === "Storage").length, fill: FIXED_COLORS.Storage },
    { name: "OTH", count: devices.filter(d => d.category === "Other").length, fill: FIXED_COLORS.Other }
  ];

  const [dashTab, setDashTab] = useState<"rack" | "gantt">("rack");
  const [tvMode, setTvMode] = useState(false);

  // TV 戰情室輪播邏輯
  useEffect(() => {
    if (!tvMode) return;
    const t = setInterval(() => {
      setDashTab(prev => prev === "rack" ? "gantt" : "rack");
    }, 15000); // 每 15 秒切換一次
    return () => clearInterval(t);
  }, [tvMode]);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* 頂部三大 KPI 卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--panel)] border border-[var(--border)] p-5 md:p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="text-lg md:text-xl font-extrabold text-[var(--muted)] mb-1">{t("totalDevices", lang)}</div>
          <div className="text-4xl md:text-5xl font-black text-[var(--accent)] mb-3">{total}</div>
          {/* 極簡化設備分佈：微型標籤 */}
          <div className="flex gap-2 flex-wrap">
            {chartData.map(c => (
              <span 
                key={c.name} 
                className="text-[10px] md:text-xs font-bold px-2 py-1 rounded-md border shadow-sm" 
                style={{ color: c.fill, borderColor: `${c.fill}50`, backgroundColor: `${c.fill}15` }}
              >
                {c.name}: {c.count}
              </span>
            ))}
          </div>
        </div>
        
        <div className="bg-[var(--panel)] border border-[var(--border)] p-5 md:p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1">
            <div className="text-lg md:text-xl font-extrabold text-[var(--muted)]">{t("pending", lang)}</div>
            <div className="text-sm font-bold text-red-500">{calcPct(pending)}%</div>
          </div>
          <div className="text-3xl md:text-4xl font-black text-red-500 drop-shadow-md">{pending}</div>
          <div className="mt-4 w-full h-2 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${calcPct(pending)}%` }} />
          </div>
        </div>
        
        <div className="bg-[var(--panel)] border border-[var(--border)] p-5 md:p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1">
            <div className="text-lg md:text-xl font-extrabold text-[var(--muted)]">{t("completed", lang)}</div>
            <div className="text-sm font-bold text-green-500">{calcPct(completed)}%</div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl md:text-4xl font-black text-green-500 drop-shadow-md">{completed}</div>
            <div className="text-sm text-[var(--muted)] font-bold">/ {total}</div>
          </div>
          <div className="mt-4 w-full h-2 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${calcPct(completed)}%` }} />
          </div>
        </div>
      </div>

      {/* 四大進度條 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("racked", lang), val: racked }, 
          { label: t("cabled", lang), val: cabled }, 
          { label: t("powered", lang), val: powered }, 
          { label: t("tested", lang), val: tested }
        ].map((item, idx) => (
          <div key={idx} className="bg-[var(--panel2)] border border-[var(--border)] p-4 rounded-xl flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs md:text-sm font-black text-[var(--muted)] mb-2">{item.label}</div>
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-xl md:text-2xl font-black text-[var(--text)]">{item.val}</div>
              <div className="text-[10px] md:text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded">{calcPct(item.val)}%</div>
            </div>
            <div className="w-full h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${calcPct(item.val)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* 下半部主展示區 (TV 輪播切換) */}
      <div className="bg-[var(--panel)] border border-[var(--border)] p-5 md:p-6 rounded-2xl shadow-xl flex flex-col w-full">
        <div className="flex flex-wrap w-full justify-between items-center mb-6 gap-3">
          
          {/* 左側：手動切換頁籤 */}
          <div className="flex bg-[var(--panel2)] border border-[var(--border)] rounded-xl p-1 shadow-inner">
            <button 
              onClick={() => setDashTab("rack")} 
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${dashTab === 'rack' ? 'bg-[var(--accent)] text-black shadow-md scale-100' : 'text-[var(--text)] hover:bg-white/5 scale-95 opacity-80'}`}
            >
              <Server size={16} /> {t("rackStatus", lang)}
            </button>
            <button 
              onClick={() => setDashTab("gantt")} 
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${dashTab === 'gantt' ? 'bg-[var(--accent)] text-black shadow-md scale-100' : 'text-[var(--text)] hover:bg-white/5 scale-95 opacity-80'}`}
            >
              <CalendarClock size={16} /> {t("navRunbook", lang)}
            </button>
          </div>
          
          {/* 右側：啟動 TV 輪播模式 */}
          <button 
            onClick={() => setTvMode(!tvMode)} 
            className={`px-5 py-2.5 rounded-xl text-sm font-extrabold flex items-center gap-2 transition-all shadow-lg ${tvMode ? 'bg-red-500 text-white animate-pulse shadow-red-500/40' : 'bg-black/80 dark:bg-white/10 text-white border border-white/20 hover:scale-105'}`}
          >
            {tvMode ? (
              <><Tv size={18} /> {t("tvModeOn", lang)}</>
            ) : (
              <><Tv size={18} /> {t("tvModeOff", lang)}</>
            )}
          </button>

        </div>
        
        {/* 顯示內容區塊 */}
        <div className="transition-opacity duration-500">
          {dashTab === "rack" ? <DashboardFullCarousel devices={devices} racks={afterRacks} /> : <DashboardGanttView />}
        </div>
      </div>
    </div>
  );
};

/* -----------------------------
  獨立系統說明頁面 (Guide)
----------------------------- */
const GuidePage = () => {
  const lang = useStore(s => s.lang);
  
  return (
    <div className="p-6 h-full overflow-y-auto max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-[var(--accent)] flex items-center gap-3 mb-8">
        <BookOpen size={28} /> {t("navGuide", lang)}
      </h2>
      
      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 md:p-8 rounded-2xl shadow-lg transition-transform hover:-translate-y-1">
        <h3 className="text-lg font-black text-[var(--text)] mb-4 flex items-center gap-3">
          <span className="w-2 h-6 bg-[var(--accent)] rounded-full"></span> 
          1. 系統架構與角色權限 (Architecture & Roles)
        </h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
          MigratePro 是一套專為大型機房搬遷設計的「實時戰情指揮系統」。它透過拖曳排版、雙向線路追蹤與甘特圖劇本，將雜亂的 Excel 轉化為視覺化的指揮中心。
        </p>
        <ul className="text-sm text-[var(--text)] space-y-2 list-disc pl-6 opacity-90 font-medium">
          <li><span className="text-[var(--accent)]">Admin (管理員)</span>：擁有最高權限，可新增設備、調整機櫃佈局、編寫搬遷劇本與核准驗證。</li>
          <li><span className="text-blue-400">Cable (佈線廠商)</span>：可編輯設備詳細資訊與線路對接表，但無法刪除設備或調整大佈局。</li>
          <li><span className="text-green-400">Vendor (設備廠商)</span>：僅能檢視清單，並在「專案劇本」與「機櫃圖」中點擊按鈕回報自己的工作進度。</li>
        </ul>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 md:p-8 rounded-2xl shadow-lg transition-transform hover:-translate-y-1">
        <h3 className="text-lg font-black text-[var(--text)] mb-4 flex items-center gap-3">
          <span className="w-2 h-6 bg-[var(--accent2)] rounded-full"></span> 
          2. 智慧線路對接與標籤產生 (Smart Cable Routing)
        </h3>
        <ul className="text-sm text-[var(--muted)] space-y-3 list-decimal pl-6 leading-relaxed">
          <li><strong>請勿手動輸入對接設備的機櫃位置！</strong> 這會導致搬遷時的資料不一致。</li>
          <li>請在設備編輯視窗中，找到「智慧線路對接表」，點擊「新增對接」。</li>
          <li>在下拉選單中選擇「目標設備」，系統會自動在背景尋找目標設備的搬遷前後位置。</li>
          <li>當您完成連線後，另一台設備的視窗中也會自動出現「⬅️ 來自他台」的連線紀錄。</li>
          <li>點擊清單頁面的「匯出線路標籤」，系統會自動將雙向資訊合併為一行，產出給標籤機專用的精美 CSV。</li>
        </ul>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 md:p-8 rounded-2xl shadow-lg transition-transform hover:-translate-y-1">
        <h3 className="text-lg font-black text-[var(--text)] mb-4 flex items-center gap-3">
          <span className="w-2 h-6 bg-purple-500 rounded-full"></span> 
          3. 專案劇本與戰情室輪播 (Runbook & TV Mode)
        </h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed mb-3">
          在「專案劇本」頁面中，Admin 可以規劃以 30 分鐘為單位的精細工作任務。
        </p>
        <ul className="text-sm text-[var(--text)] space-y-2 list-disc pl-6 opacity-90">
          <li>廠商使用手機登入時，甘特圖會自動轉化為直向的「待辦打卡清單」，方便現場點擊完成。</li>
          <li>將筆電接上大螢幕後，在儀表板點擊右側的 <strong>[TV 戰情室輪播]</strong>，畫面將自動隱藏多餘按鈕，並每 15 秒在「現況圖」與「甘特圖」之間切換。</li>
        </ul>
      </div>
    </div>
  );
};

/* -----------------------------
  問題回報頁面 (Issues Tracking)
----------------------------- */
const IssuesPage = () => {
  const issues = useStore((s) => s.issues);
  const lang = useStore((s) => s.lang);
  const role = useStore((s) => s.role);
  const userName = useStore((s) => s.userName);
  
  const addIssue = useStore((s) => s.addIssue);
  const updateIssueStatus = useStore((s) => s.updateIssueStatus);
  const deleteIssue = useStore((s) => s.deleteIssue);
  const addIssueReply = useStore((s) => s.addIssueReply);

  const [creating, setCreating] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const isAdmin = role === "admin";
  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  const NewIssueModal = () => {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.96, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col"
        >
          <div className="p-5 md:p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--panel2)] rounded-t-3xl">
            <div className="text-xl font-black text-[var(--text)] flex items-center gap-2">
              <Plus size={20} className="text-[var(--accent)]" /> {t("addIssue", lang)}
            </div>
            <button onClick={() => setCreating(false)} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={20}/></button>
          </div>
          
          <div className="p-5 md:p-6 flex-1 space-y-5">
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("issueTitle", lang)}</label>
              <input 
                autoFocus 
                className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)] transition-colors" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="簡述異常狀況..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("issueDesc", lang)}</label>
              <textarea 
                className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] min-h-[120px] text-[var(--text)] transition-colors resize-none" 
                value={desc} 
                onChange={(e) => setDesc(e.target.value)} 
                placeholder="詳細描述發生的時間、設備編號與錯誤代碼..."
              />
            </div>
          </div>
          
          <div className="p-5 md:p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--panel2)] rounded-b-3xl">
            <button onClick={() => setCreating(false)} className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--text)] font-bold transition-colors">
              {t("btnCancel", lang)}
            </button>
            <button 
              onClick={() => { if(!title.trim()) return; addIssue(title, desc); setCreating(false); }} 
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20 transition-all active:scale-95"
            >
              <MessageSquare size={16}/> {t("issueSubmit", lang)}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const IssueDetailModal = ({ issue }: { issue: Issue }) => {
    const [replyText, setReplyText] = useState("");
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-6">
        <motion.div 
          initial={{ scale: 0.96, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="w-full max-w-2xl h-full max-h-[850px] rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-5 md:p-6 border-b border-[var(--border)] flex items-start justify-between gap-4 bg-[var(--panel2)] rounded-t-3xl shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${issue.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                  {issue.status === 'resolved' ? t("issueResolved", lang) : t("issueOpen", lang)}
                </span>
                <span className="text-xs font-medium text-[var(--muted)]">{formatDate(issue.createdAt)}</span>
              </div>
              <div className="text-xl md:text-2xl font-black text-[var(--text)] break-words leading-tight">{issue.title}</div>
            </div>
            <button onClick={() => setSelectedIssueId(null)} className="p-2 rounded-xl hover:bg-white/10 bg-black/10 transition-colors shrink-0"><X size={20}/></button>
          </div>
          
          {/* 對話記錄區 */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-[var(--bg)] space-y-6">
            
            {/* 原樓主發文 */}
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-black font-black text-sm shadow-inner">
                  {issue.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-black text-[var(--text)]">{issue.author}</div>
                  <div className="text-[10px] text-[var(--muted)]">Reporter</div>
                </div>
              </div>
              <div className="text-sm text-[var(--text)] whitespace-pre-wrap break-words pl-11 leading-relaxed opacity-90">
                {issue.description}
              </div>
            </div>

            {/* 回覆串 */}
            {issue.replies.map(r => (
              <div key={r.id} className={`flex flex-col max-w-[85%] ${r.author === userName ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1.5 px-2">
                  <span className="text-[11px] font-bold text-[var(--muted)]">{r.author}</span>
                  <span className="text-[9px] text-[var(--muted)] opacity-50">{formatDate(r.createdAt).split(" ")[1]}</span>
                </div>
                <div 
                  className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm leading-relaxed ${r.author === userName ? 'bg-[var(--accent)] text-black rounded-tr-sm font-medium' : 'bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-tl-sm'}`}
                >
                  {r.text}
                </div>
              </div>
            ))}
          </div>

          {/* 留言輸入區 & 管理員操作 */}
          <div className="p-5 md:p-6 border-t border-[var(--border)] bg-[var(--panel2)] rounded-b-3xl shrink-0">
            <div className="flex gap-3">
              <input 
                value={replyText} 
                onChange={e => setReplyText(e.target.value)} 
                onKeyDown={e => { if(e.key === 'Enter' && replyText.trim()){ addIssueReply(issue.id, replyText); setReplyText(""); } }} 
                placeholder={t("replyText", lang)} 
                className="flex-1 bg-[var(--panel)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)] shadow-inner transition-colors" 
              />
              <button 
                onClick={() => { if(!replyText.trim()) return; addIssueReply(issue.id, replyText); setReplyText(""); }} 
                className="bg-[var(--text)] text-[var(--bg)] px-6 py-3 rounded-xl font-black hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                {t("replySubmit", lang)}
              </button>
            </div>
            
            {isAdmin && (
              <div className="mt-5 flex items-center justify-between pt-5 border-t border-[var(--border)]">
                <button 
                  onClick={() => { deleteIssue(issue.id); setSelectedIssueId(null); }} 
                  className="text-xs font-bold text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={14}/> {t("deleteIssue", lang)}
                </button>
                
                <button 
                  onClick={() => updateIssueStatus(issue.id, issue.status === 'open' ? 'resolved' : 'open')} 
                  className={`text-xs px-5 py-2 rounded-lg font-black flex items-center gap-1.5 transition-all shadow-sm ${issue.status === 'open' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30 border border-green-500/20' : 'bg-[var(--panel)] text-[var(--text)] hover:bg-white/10 border border-[var(--border)]'}`}
                >
                  {issue.status === 'open' ? <><CheckCircle2 size={14}/> {t("markResolved", lang)}</> : t("reopenIssue", lang)}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-[var(--accent)] flex items-center gap-3">
          <AlertCircle size={26} /> {t("issuesTitle", lang)}
        </h2>
        <button 
          onClick={() => setCreating(true)} 
          className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20 transition-transform active:scale-95"
        >
          <Plus size={18} /> {t("addIssue", lang)}
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--muted)] opacity-60 bg-[var(--panel2)] border border-[var(--border)] rounded-3xl border-dashed">
          <CheckCircle2 size={56} className="mb-4" />
          <div className="text-lg font-black">{t("noIssues", lang)}</div>
          <div className="text-sm mt-2">太棒了！專案進行得非常順利。</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {issues.map(i => (
            <div 
              key={i.id} 
              onClick={() => setSelectedIssueId(i.id)} 
              className="bg-[var(--panel)] border border-[var(--border)] p-5 rounded-2xl cursor-pointer hover:border-[var(--accent)] hover:shadow-[0_10px_30px_rgba(34,211,238,0.1)] transition-all group flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`text-[10px] font-black px-2.5 py-1 rounded-md border tracking-wider uppercase ${i.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                  {i.status === 'resolved' ? t("issueResolved", lang) : t("issueOpen", lang)}
                </div>
                <div className="text-xs font-bold text-[var(--muted)] flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded-md">
                  <MessageSquare size={12}/> {i.replies.length}
                </div>
              </div>
              
              <div className="font-black text-lg text-[var(--text)] mb-2 truncate group-hover:text-[var(--accent)] transition-colors">
                {i.title}
              </div>
              
              <div className="text-xs text-[var(--muted)] line-clamp-2 mb-4 leading-relaxed h-[36px]">
                {i.description}
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--panel2)] border border-[var(--border)] flex items-center justify-center text-[10px] font-black text-[var(--text)]">
                    {i.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-[var(--text)]">{i.author}</span>
                </div>
                <div className="text-[10px] font-medium text-[var(--muted)] opacity-80">
                  {formatDate(i.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <NewIssueModal />}
      {selectedIssue && <IssueDetailModal issue={selectedIssue} />}
    </div>
  );
};

// ==========================================
// --- Part 3 結束 ---
// ==========================================
// ==========================================
// --- Part 4 開始 (約 第 1401 ~ 1950 行) ---
// ==========================================

/* -----------------------------
  專案劇本頁面 (Runbook)
----------------------------- */
const RunbookPage = () => {
  const lang = useStore(s => s.lang);
  const role = useStore(s => s.role);
  const user = useStore(s => s.userName);
  const tasks = useStore(s => s.tasks);
  const projectInfo = useStore(s => s.projectInfo);
  const updateProjectInfo = useStore(s => s.updateProjectInfo);
  const addTask = useStore(s => s.addTask);
  const updateTaskStatus = useStore(s => s.updateTaskStatus);
  const deleteTask = useStore(s => s.deleteTask);
  const accounts = useStore(s => s.accounts);
  
  // 只抓出 Vendor 廠商名單供指派
  const vendors = accounts.filter(a => a.role === 'vendor').map(a => a.username);

  const [activeDay, setActiveDay] = useState(0);
  const [setupOpen, setSetupOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const isAdmin = role === "admin";

  const SetupModal = () => {
    const [sd, setSd] = useState(projectInfo.startDate);
    const [d, setD] = useState(projectInfo.days);
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
          <div className="text-xl font-black text-[var(--text)] mb-5">{t("rbSetup", lang)}</div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("rbStart", lang)}</label>
              <input 
                type="date" 
                className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" 
                value={sd} 
                onChange={(e) => setSd(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("rbDays", lang)}</label>
              <input 
                type="number" 
                min={1} 
                max={14} 
                className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" 
                value={d} 
                onChange={(e) => setD(Number(e.target.value))} 
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setSetupOpen(false)} className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--text)] font-bold">
              {t("btnCancel", lang)}
            </button>
            <button onClick={() => { updateProjectInfo({ startDate: sd, days: d }); setSetupOpen(false); }} className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 shadow-lg">
              {t("btnSave", lang)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const NewTaskModal = () => {
    const [tTitle, setTTitle] = useState("");
    const [v, setV] = useState(vendors[0] || "");
    const [sh, setSh] = useState(16); // 預設 08:00
    const [eh, setEh] = useState(20); // 預設 10:00
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
          <div className="text-xl font-black text-[var(--text)] mb-5">
            {t("rbAddTask", lang)} <span className="text-[var(--accent)]">(Day {activeDay + 1})</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("rbTaskName", lang)}</label>
              <input 
                className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" 
                value={tTitle} 
                onChange={(e) => setTTitle(e.target.value)} 
                placeholder="例如：伺服器關機與拆架"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("rbVendor", lang)}</label>
              <select 
                className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" 
                value={v} 
                onChange={(e) => setV(e.target.value)}
              >
                {vendors.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("rbStartTime", lang)}</label>
                <select 
                  className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" 
                  value={sh} 
                  onChange={(e) => setSh(Number(e.target.value))}
                >
                  {Array.from({ length: 48 }).map((_, i) => <option key={i} value={i}>{formatHH(i)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("rbEndTime", lang)}</label>
                <select 
                  className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" 
                  value={eh} 
                  onChange={(e) => setEh(Number(e.target.value))}
                >
                  {Array.from({ length: 48 }).map((_, i) => <option key={i + 1} value={i + 1} disabled={i + 1 <= sh}>{formatHH(i + 1)}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setNewTaskOpen(false)} className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--text)] font-bold">
              {t("btnCancel", lang)}
            </button>
            <button 
              onClick={() => {
                if (tTitle && v && eh > sh) {
                  addTask({ title: tTitle, vendor: v, dayIndex: activeDay, startHH: sh, endHH: eh });
                  setNewTaskOpen(false);
                }
              }} 
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 shadow-lg"
            >
              {t("btnSave", lang)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MobileTaskList = () => {
    const dayTasks = tasks.filter(t => t.dayIndex === activeDay).sort((a, b) => a.startHH - b.startHH);
    
    return (
      <div className="md:hidden space-y-4 mt-4 pb-20">
        {dayTasks.length === 0 && (
          <div className="text-center text-[var(--muted)] text-sm py-12 border border-dashed border-[var(--border)] rounded-2xl">
            此日期無任何排程任務
          </div>
        )}
        
        {dayTasks.map(t => {
          const isMyTask = isAdmin || user === t.vendor;
          return (
            <div key={t.id} className={`p-5 rounded-2xl border bg-[var(--panel)] shadow-sm transition-all ${isMyTask ? 'border-[var(--accent)]/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-[var(--border)] opacity-70'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: getVendorColor(t.vendor) }} />
                  <span className="text-xs font-black text-[var(--text)] tracking-wider uppercase">{t.vendor}</span>
                </div>
                <div className="text-[11px] font-bold px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--panel2)] text-[var(--text)] shadow-sm">
                  {formatHH(t.startHH)} - {formatHH(t.endHH)}
                </div>
              </div>
              <div className="font-black text-[var(--text)] text-lg mb-4 leading-tight">
                {t.title}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
                <div className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">
                  {t.status.replace("_", " ")}
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <button onClick={() => deleteTask(t.id)} className="p-2 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  )}
                  {isMyTask && t.status === 'pending' && (
                    <button onClick={() => updateTaskStatus(t.id, 'in_progress')} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95">
                      {t("btnStart", lang)}
                    </button>
                  )}
                  {isMyTask && t.status === 'in_progress' && (
                    <button onClick={() => updateTaskStatus(t.id, 'done')} className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95">
                      {t("btnDone", lang)}
                    </button>
                  )}
                  {isAdmin && t.status === 'done' && (
                    <button onClick={() => updateTaskStatus(t.id, 'verified')} className="px-4 py-2 bg-[var(--accent)] text-black hover:opacity-90 rounded-xl text-sm font-extrabold shadow-lg transition-all active:scale-95">
                      {t("btnVerify", lang)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-3">
          <CalendarClock size={28} className="text-[var(--accent)]"/> {t("rbTitle", lang)}
        </h2>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setSetupOpen(true)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] text-sm font-bold hover:bg-white/5 transition-colors">
              {t("rbSetup", lang)}
            </button>
            <button onClick={() => setNewTaskOpen(true)} className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-black font-extrabold flex items-center gap-2 text-sm hover:opacity-90 shadow-lg active:scale-95">
              <Plus size={18}/> {t("rbAddTask", lang)}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide border-b border-[var(--border)]">
        {Array.from({ length: projectInfo.days }).map((_, i) => (
          <button 
            key={i} 
            onClick={() => setActiveDay(i)} 
            className={`shrink-0 px-6 py-3 rounded-t-xl text-sm font-extrabold transition-all border-b-2 ${activeDay === i ? 'text-[var(--accent)] border-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--muted)] border-transparent hover:bg-white/5 hover:text-[var(--text)]'}`}
          >
            Day {i + 1}
          </button>
        ))}
      </div>

      {/* Desktop Gantt Chart View */}
      <div className="hidden md:block flex-1 bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6 overflow-y-auto shadow-xl">
        <RunbookGanttGrid tasks={tasks} dayIndex={activeDay} />
      </div>

      {/* Mobile Kanban View */}
      <MobileTaskList />

      {setupOpen && <SetupModal />}
      {newTaskOpen && <NewTaskModal />}
    </div>
  );
};

/* -----------------------------
  Hover Card (設備懸浮提示框)
----------------------------- */
function HoverCard({ x, y, d, beforePos, afterPos }: { x: number; y: number; d: Device; beforePos: string; afterPos: string; }) {
  const lang = useStore((s) => s.lang);
  const isAcc = d.category === "Accessory";
  
  return (
    <div className="fixed z-[9999] pointer-events-none" style={{ left: x + 16, top: y + 16 }}>
      <div 
        className="rounded-2xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.6)] w-[320px] p-5 text-left text-white"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-gray-400 font-bold tracking-wider mb-1">
              {t("hoverInfo", lang)} {isAcc && "(Accessory)"}
            </div>
            <div className="font-black text-base truncate text-white drop-shadow-md">
              {isAcc ? d.name : `${d.deviceId} · ${d.name}`}
            </div>
            <div className="text-[11px] text-gray-300 truncate mt-1">
              {isAcc ? "-" : `${d.brand} / ${d.model}`} · <span className="text-[var(--accent)] font-bold">{d.sizeU}U</span> {isAcc ? "" : `· ${d.ports} ports`}
            </div>
          </div>
          <div className="pt-1 bg-black/40 p-1.5 rounded-lg shadow-inner">
            {!isAcc && <LampsRow m={d.migration} />}
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <div className="text-[10px] text-gray-400 mb-1">{t("hoverBefore", lang)}</div>
            <div className="font-bold truncate text-white">{beforePos}</div>
          </div>
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-2.5">
            <div className="text-[10px] text-[var(--accent)] mb-1">{t("hoverAfter", lang)}</div>
            <div className="font-bold truncate text-white">{afterPos}</div>
          </div>
        </div>
        
        {!isAcc && (
          <div className="mt-4 text-[11px] text-gray-400 flex justify-between bg-black/40 px-3 py-2 rounded-lg">
            <span className="truncate">IP: <span className="text-white font-mono">{d.ip || "-"}</span></span>
            <span className="truncate">SN: <span className="text-white font-mono">{d.serial || "-"}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}

/* -----------------------------
  未放置設備面板 (UnplacedPanel)
----------------------------- */
function UnplacedPanel({ mode, unplaced, collapsed, setCollapsed, allowLayout }: { mode: PlacementMode; unplaced: Device[]; collapsed: boolean; setCollapsed: (v: boolean) => void; allowLayout: boolean; }) {
  const setDraggingDevice = useStore(s => s.setDraggingDevice);
  const lang = useStore(s => s.lang);
  
  useEffect(() => {
    if (unplaced.length === 0 && !collapsed) setCollapsed(true);
  }, [unplaced.length]);

  const isSticky = unplaced.length > 0 && !collapsed;

  return (
    <div className={`border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden mb-6 transition-all duration-300 ${isSticky ? "sticky top-[80px] z-[40] bg-[var(--panel)]/95 backdrop-blur-xl" : "bg-[var(--panel)]"}`}>
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-black text-[var(--text)]">{t("unplaced", lang)}</div>
          <div className="text-xs font-bold text-[var(--text)] bg-[var(--panel2)] border border-[var(--border)] px-2 py-0.5 rounded-full">
            {unplaced.length === 0 ? t("allPlaced", lang) : `${unplaced.length}`}
          </div>
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 text-sm text-[var(--text)] transition-colors"
        >
          {collapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
        </button>
      </div>
      
      {!collapsed && (
        <div className="p-4 bg-[var(--bg)]/50">
          {unplaced.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {unplaced.map((d) => {
                const isAcc = d.category === "Accessory";
                return (
                  <div
                    key={d.id}
                    draggable={allowLayout}
                    onDragStart={(ev) => {
                      if (!allowLayout) return;
                      ev.dataTransfer.setData("text/plain", d.id);
                      setDraggingDevice(d);
                      ev.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDraggingDevice(null)}
                    className={`min-w-[240px] p-3.5 rounded-xl shadow-md border border-white/10 transition-all ${allowLayout ? "cursor-grab active:cursor-grabbing hover:brightness-110 hover:scale-[1.02] hover:shadow-lg" : "cursor-not-allowed opacity-90"}`}
                    style={{ 
                      backgroundColor: catColor(d.category), 
                      backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.2) 100%)", 
                      color: "white" 
                    }}
                    title={allowLayout ? t("dragToRack", lang) : t("noDrag", lang)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-black truncate drop-shadow-md">{isAcc ? d.name : d.deviceId}</div>
                        {!isAcc && <div className="text-xs font-semibold opacity-90 truncate drop-shadow-sm mt-1">{d.name}</div>}
                        <div className="text-[10px] opacity-80 mt-1.5 truncate drop-shadow-sm font-medium">
                          {isAcc ? "-" : `${d.brand} · ${d.model}`} · {d.sizeU}U
                        </div>
                      </div>
                      <div className="pt-1 bg-black/30 p-1.5 rounded-lg shadow-inner">
                        {isAcc ? <div className="text-[10px] px-1 font-bold opacity-80">Acc</div> : <LampsRow m={d.migration} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-[var(--muted)] py-4 text-center">{t("noUnplaced", lang)}</div>
          )}
        </div>
      )}
    </div>
  );
}

/* -----------------------------
  機櫃圖卡核心元件 (RackPlanner)
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
  
  // 用於點擊空位快速新增設備的功能 (Admin)
  const [addPlace, setAddPlace] = useState<{ rackId: string; u: number } | null>(null);
  // 用於拖曳時顯示目標 U 數的 Highlight
  const [dragHover, setDragHover] = useState<{ rackId: string, u: number } | null>(null);

  // 每次切換頁面時，修復可能的舊資料結構
  useEffect(() => { repairRackIds(); }, [mode]);

  // 計算未放置設備
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

  // ★ 確保搬遷前分兩排 (10~6, 5~1)，搬遷後照舊分群
  const rackRows = useMemo(() => {
    if (mode === "before") {
      const map = new Map(racks.map((r) => [r.name || r.id.replace("BEF_",""), r]));
      const spec: string[][] = [
        ["10", "09", "08", "07", "06"],
        ["05", "04", "03", "02", "01"],
        ["2F-A", "2F-B", "3F-A", "3F-B", "4F-A", "4F-B"],
        ["9F", "SmartHouseA", "SmartHouseB", "New_Device"],
      ];
      return spec.map((row) => row.map((name) => map.get(name)!).filter(Boolean));
    }
    // 搬遷後 (每 6 個機櫃一排)
    const out: Rack[][] = [];
    let cur: Rack[] = [];
    racks.forEach((r) => {
      cur.push(r);
      if (cur.length === 6) {
        out.push(cur);
        cur = [];
      }
    });
    if (cur.length) out.push(cur);
    return out;
  }, [racks, mode]);

  const listForRack = (rackId: string) =>
    devices
      .filter((d) => (mode === "before" ? d.beforeRackId === rackId : d.afterRackId === rackId))
      .filter((d) => {
        const s = mode === "before" ? d.beforeStartU : d.afterStartU;
        const e = mode === "before" ? d.beforeEndU : d.afterEndU;
        return s != null && e != null;
      })
      .sort((a, b) => {
        const as = (mode === "before" ? a.beforeStartU : a.afterStartU) ?? 999;
        const bs = (mode === "before" ? b.beforeStartU : b.afterStartU) ?? 999;
        return as - bs;
      });

  const U_H = 22; // 每個 U 的高度像素

  const getBlockStyle = (d: Device) => {
    const sU = (mode === "before" ? d.beforeStartU : d.afterStartU) ?? 1;
    const eU = (mode === "before" ? d.beforeEndU : d.afterEndU) ?? sU;
    const start = clampU(Math.min(sU, eU));
    const end = clampU(Math.max(sU, eU));
    return { 
      bottom: (start - 1) * U_H, 
      height: (end - start + 1) * U_H 
    };
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
    e.preventDefault();
    setDragHover(null);
    if (!allowLayout) return;
    
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    
    const res = place(mode, id, rackId, u);
    setDraggingDevice(null);
    if (!res.ok) alert(res.message);
  };

  const onCellClick = (rackId: string, u: number) => {
    const found = findDeviceAtU(rackId, u);
    if (found) {
      setSelectedDeviceId(found.id);
      return;
    }
    if (role === "admin") {
      setAddPlace({ rackId, u });
    }
  };

  const title = mode === "before" ? t("navBefore", lang) : t("navAfter", lang);

  return (
    <div className="p-4 md:p-6 relative">
      {/* 標題與圖例 */}
      <div className="flex flex-wrap items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3 text-[var(--text)]">
            <ArrowRightLeft className="text-[var(--accent)]" size={28} /> {title}
          </h2>
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

      {/* 機櫃主視圖 */}
      <div className="space-y-8 overflow-hidden">
        {rackRows.map((row, idx) => (
          <div key={idx} className="flex gap-6 overflow-x-auto pb-4 items-start snap-x scrollbar-hide">
            {row.map((rack) => {
              const displayName = getRackName(rack.id, lang);
              const isRed = rack.id.includes("Unmoved") || rack.id.includes("New_Device");

              return (
                <div key={rack.id} className="flex flex-col bg-[var(--panel)] rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden flex-shrink-0 snap-center min-w-[340px] md:min-w-[400px]">
                  
                  {/* 機櫃標頭 */}
                  <div className={`px-5 py-3 ${mode === "after" && isRed ? "bg-red-800" : mode === "before" && isRed ? "bg-red-800" : mode === "after" ? "bg-emerald-600" : "bg-slate-800"} text-white flex justify-between items-center shadow-md z-10`}>
                    <h2 className="font-black text-sm md:text-base flex items-center gap-2 truncate text-white tracking-wide">
                      <Server size={18} /> {displayName}
                    </h2>
                    <span className="text-[10px] font-bold bg-black/30 px-2.5 py-1 rounded-md whitespace-nowrap text-white shadow-inner">
                      42U
                    </span>
                  </div>

                  {/* 機櫃內容區 (42U Grid) */}
                  <div className="flex-1 overflow-y-hidden p-5 bg-[var(--panel2)] flex justify-center">
                    <div className="relative w-full border-x-[12px] border-t-[12px] border-slate-400 dark:border-slate-600 bg-slate-900 rounded-t-xl shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)] mb-4" style={{ height: 42 * U_H }}>
                      
                      {/* 左側 U 數刻度條 */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-9 bg-yellow-400/95 border-r-2 border-slate-800 z-0 shadow-[2px_0_5px_rgba(0,0,0,0.3)]" />

                      {/* 繪製 42 格網格 */}
                      {Array.from({ length: 42 }).map((_, i) => {
                        const u = i + 1;
                        const bottomPos = i * U_H;
                        const isThick = u % 5 === 0;
                        const isHoverTarget = allowLayout && dragHover?.rackId === rack.id && u >= dragHover.u && u < dragHover.u + (draggingDevice?.sizeU || 1);

                        return (
                          <React.Fragment key={`grid-${u}`}>
                            {/* U 數數字 */}
                            <div className="absolute left-0 w-8 sm:w-9 flex items-center justify-center text-slate-900 text-[9px] font-black z-0 tracking-tighter" style={{ bottom: bottomPos, height: U_H }}>
                              {u}
                            </div>
                            
                            {/* 拖放與點擊感應區 */}
                            <div 
                              className="absolute left-8 sm:left-9 right-0 z-0 group cursor-pointer" 
                              style={{ bottom: bottomPos, height: U_H }} 
                              onDragOver={(e) => {
                                allowLayout && e.preventDefault();
                                if (allowLayout && (dragHover?.rackId !== rack.id || dragHover?.u !== u)) {
                                  setDragHover({ rackId: rack.id, u });
                                }
                              }} 
                              onDragLeave={() => {
                                if (allowLayout && dragHover?.rackId === rack.id && dragHover?.u === u) {
                                  setDragHover(null);
                                }
                              }} 
                              onDrop={(e) => onDrop(e, rack.id, u)} 
                              onClick={() => onCellClick(rack.id, u)}
                            >
                              <div className={`absolute inset-0 transition-colors duration-150 ${isHoverTarget ? "bg-[var(--accent)]/40 border-y-2 border-[var(--accent)] z-20 shadow-[0_0_15px_var(--accent)]" : "hover:bg-white/[0.05]"}`} />
                            </div>
                            
                            {/* 水平分隔線 */}
                            {u < 42 && (
                              <div className={`absolute left-8 sm:left-9 right-0 z-0 pointer-events-none ${isThick ? "bg-slate-500/80 h-[2px]" : "bg-slate-700/50 h-[1px]"}`} style={{ bottom: bottomPos + U_H }} />
                            )}
                          </React.Fragment>
                        );
                      })}

                      {/* 放置在機櫃內的設備圖卡 */}
                      <div className="absolute left-8 sm:left-9 right-0 top-0 bottom-0 pointer-events-none z-10">
                        {listForRack(rack.id).map((d) => {
                          const { bottom, height } = getBlockStyle(d);
                          const isHovered = hoverId === d.id;
                          const beforePos = d.beforeRackId && d.beforeStartU != null && d.beforeEndU != null ? `${getRackName(d.beforeRackId, lang)} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
                          const afterPos = d.afterRackId && d.afterStartU != null && d.afterEndU != null ? `${getRackName(d.afterRackId, lang)} ${d.afterStartU}-${d.afterEndU}U` : "-";
                          const isAcc = d.category === "Accessory";

                          return (
                            <div 
                              key={d.id} 
                              draggable={allowLayout} 
                              onDragStart={(ev) => {
                                if (!allowLayout) return;
                                ev.dataTransfer.setData("text/plain", d.id);
                                setDraggingDevice(d);
                                ev.dataTransfer.effectAllowed = "move";
                              }} 
                              onDragEnd={() => setDraggingDevice(null)} 
                              onClick={() => setSelectedDeviceId(d.id)} 
                              onMouseMove={(e) => {
                                setHoverId(d.id);
                                setHoverInfo({ x: e.clientX, y: e.clientY, d, beforePos, afterPos });
                              }} 
                              onMouseLeave={() => {
                                setHoverId(null);
                                setHoverInfo(null);
                              }} 
                              className={`absolute left-[2px] right-[2px] rounded-md flex flex-row items-center px-2.5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_2px_5px_rgba(0,0,0,0.5)] transition-all duration-200 pointer-events-auto overflow-hidden border border-white/10 ${isHovered ? "brightness-125 scale-[1.02] z-30 shadow-[0_0_20px_rgba(56,189,248,0.6)]" : "z-10"}`} 
                              style={{ 
                                bottom: bottom + 1, 
                                height: height - 2, 
                                backgroundColor: catColor(d.category), 
                                backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.25) 100%)", 
                                cursor: allowLayout ? "grab" : "pointer" 
                              }}
                            >
                              {/* ★ 1U 與 多U 的極致排版邏輯 */}
                              <div className="flex-1 h-full flex flex-col justify-center min-w-0 pr-14 drop-shadow-md">
                                {isAcc ? (
                                  <div className="truncate w-full font-bold text-[10px] sm:text-[11px] leading-tight tracking-wider text-center">{d.name}</div>
                                ) : d.sizeU >= 2 ? (
                                  <>
                                    <div className="truncate w-full font-black text-[11px] sm:text-[12px] leading-tight tracking-wide">{d.deviceId} | {d.name}</div>
                                    <div className="truncate w-full text-[9px] sm:text-[10px] opacity-90 font-medium leading-tight mt-0.5">{d.brand} | {d.model}</div>
                                  </>
                                ) : (
                                  <div className="truncate w-full font-bold text-[10px] sm:text-[11px] leading-tight tracking-wide">{d.deviceId} | {d.name} | {d.model}</div>
                                )}
                              </div>

                              {!isAcc && (
                                <div className="absolute bottom-1 right-1 flex items-center bg-black/50 px-1.5 py-[3px] rounded-md shadow-inner pointer-events-none scale-[0.7] sm:scale-[0.8] origin-bottom-right">
                                  <LampsRow m={d.migration} />
                                </div>
                              )}
                              
                              {/* Hover 時顯示的快速移除按鈕 */}
                              {allowLayout && isHovered && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clearPlacement(mode, d.id);
                                    setHoverId(null);
                                    setHoverInfo(null);
                                  }} 
                                  className="absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white shadow-xl hover:bg-red-400 hover:scale-110 z-40 pointer-events-auto scale-75 transition-transform"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 機櫃底部底座 */}
                      <div className="absolute -bottom-5 left-[-12px] right-[-12px] h-5 bg-slate-500 dark:bg-slate-700 rounded-b-md shadow-[0_5px_15px_rgba(0,0,0,0.5)] z-0"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 如果沒有寫這兩行，Modal 就不會彈出來 */}
      {/* 假設稍後在 Part 5 會定義 DeviceModal，這邊只要負責呼叫 AddAndPlaceModal 即可 */}
      {/* 但是必須確保 AddAndPlaceModal 也在 Part 3/4 被定義。它已經在前面定義過了！ */}
      {addPlace && <AddAndPlaceModal mode={mode} rackId={addPlace.rackId} u={addPlace.u} onClose={() => setAddPlace(null)} />}
      
      {/* 懸浮提示框 */}
      {hoverInfo && <HoverCard {...hoverInfo} />}
    </div>
  );
};

// ==========================================
// --- Part 4 結束 ---
// ==========================================
// ==========================================
// --- Part 5 開始 (最終完全體：第 1951 行起) ---
// ==========================================

/* -----------------------------
  設備詳細資訊視窗 (DeviceDetailModal)
  ★ 實裝：雙向線路動態反向尋找與跨設備編輯
----------------------------- */
function DeviceDetailModal({ id, mode, onClose }: { id: string; mode: PlacementMode; onClose: () => void; }) {
  const d = useStore((s) => s.devices.find((x) => x.id === id));
  const devices = useStore((s) => s.devices);
  const setFlag = useStore((s) => s.setMigrationFlag);
  const clearPlacement = useStore((s) => s.clearPlacement);
  const updateDevice = useStore((s) => s.updateDevice);
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);

  if (!d) return null;
  const isAccessory = d.category === "Accessory";

  // 本機狀態
  const [localNote, setLocalNote] = useState(d?.portMap || "");
  const [localConns, setLocalConns] = useState<Connection[]>(d?.connections || []);

  // ★ Inbound 狀態 (動態反向尋找誰連到我)
  const [originalIncoming] = useState<{sourceDevId: string, conn: Connection}[]>(() => {
    if (isAccessory) return [];
    const inc: { sourceDevId: string, conn: Connection }[] = [];
    devices.forEach(dev => {
      if (dev.id === id) return;
      (dev.connections || []).forEach(c => {
        if (c.targetId === id) inc.push({ sourceDevId: dev.id, conn: c });
      });
    });
    return inc;
  });
  
  const [incomingConns, setIncomingConns] = useState([...originalIncoming]);
  const [deletedIncoming, setDeletedIncoming] = useState<string[]>([]);

  const beforePos = d.beforeRackId && d.beforeStartU != null ? `${getRackName(d.beforeRackId, lang)} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
  const afterPos = d.afterRackId && d.afterStartU != null ? `${getRackName(d.afterRackId, lang)} ${d.afterStartU}-${d.afterEndU}U` : "-";
  
  const allowEditPort = canEditPortMap(role);
  const isModified = localNote !== (d.portMap || "") || 
    JSON.stringify(localConns) !== JSON.stringify(d.connections || []) ||
    JSON.stringify(incomingConns) !== JSON.stringify(originalIncoming) ||
    deletedIncoming.length > 0;

  // 對接編輯 Action
  const addConn = () => setLocalConns(p => [...p, { id: crypto.randomUUID(), localPort: '', targetId: '', targetPort: '' }]);
  const updateConn = (i: number, k: keyof Connection, v: string) => { const n = [...localConns]; n[i] = { ...n[i], [k]: v }; setLocalConns(n); };
  const removeConn = (i: number) => { const n = [...localConns]; n.splice(i, 1); setLocalConns(n); };
  
  const updateIncoming = (i: number, k: keyof Connection, v: string) => {
    const n = [...incomingConns]; n[i] = { ...n[i], conn: { ...n[i].conn, [k]: v } }; setIncomingConns(n);
  };
  const removeIncoming = (i: number) => {
    const removed = incomingConns[i]; setDeletedIncoming(p => [...p, removed.conn.id]);
    const n = [...incomingConns]; n.splice(i, 1); setIncomingConns(n);
  };

  // ★ 跨設備同步儲存邏輯
  const saveChanges = () => {
    updateDevice(d.id, { portMap: localNote.trimEnd(), connections: localConns });
    // 更新別台機器裡的對接資料 (Incoming)
    incomingConns.forEach(inc => {
      const sourceDev = useStore.getState().devices.find(x => x.id === inc.sourceDevId);
      if (sourceDev) {
        const newConns = sourceDev.connections.map(sc => sc.id === inc.conn.id ? inc.conn : sc);
        if (JSON.stringify(sourceDev.connections) !== JSON.stringify(newConns)) {
          useStore.getState().updateDevice(sourceDev.id, { connections: newConns });
        }
      }
    });
    // 處理被刪除的 Incoming
    deletedIncoming.forEach(connId => {
      const sourceDev = useStore.getState().devices.find(x => x.connections.some(c => c.id === connId));
      if (sourceDev) {
        useStore.getState().updateDevice(sourceDev.id, { connections: sourceDev.connections.filter(c => c.id !== connId) });
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-5 md:p-6 border-b border-[var(--border)] shrink-0 flex items-start justify-between gap-3 bg-[var(--panel2)] rounded-t-3xl">
          <div className="min-w-0">
            <div className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">{t("detailTitle", lang)}</div>
            <div className="text-xl md:text-2xl font-black text-[var(--text)] truncate mt-1">{isAccessory ? d.name : `${d.deviceId} · ${d.name}`}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><X /></button>
        </div>
        
        <div className="p-5 md:p-6 flex-1 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
              <div className="text-xs font-bold text-[var(--muted)]">{t("detailBefore", lang)}</div>
              <div className="font-black text-lg mt-1 text-[var(--text)]">{beforePos}</div>
            </div>
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
              <div className="text-xs font-bold text-[var(--accent)]">{t("detailAfter", lang)}</div>
              <div className="font-black text-lg mt-1 text-[var(--text)]">{afterPos}</div>
            </div>
          </div>

          {!isAccessory && (
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--panel2)] shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 font-black text-[var(--text)]"><Link2 size={18} className="text-[var(--accent)]" /> {t("cableRouting", lang)}</div>
                {allowEditPort && <button onClick={addConn} className="text-xs bg-[var(--accent)] text-black px-4 py-2 rounded-xl font-black hover:opacity-90 transition-all shadow-md"><Plus size={14} /> {t("addConnection", lang)}</button>}
              </div>
              <div className="space-y-4">
                {localConns.map((c, i) => {
                   const target = devices.find(x => x.id === c.targetId);
                   const targetName = target ? target.name : t("unknownDev", lang);
                   return (
                    <div key={c.id} className="bg-[var(--panel)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                      {allowEditPort && (
                        <div className="flex flex-wrap md:flex-nowrap gap-3 items-center mb-3">
                          <div className="text-[10px] font-black bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-1 rounded">{t("outgoingConn", lang)}</div>
                          <input value={c.localPort} onChange={e=>updateConn(i,'localPort',e.target.value)} className="w-20 bg-transparent border-b border-[var(--border)] text-xs p-1 outline-none text-[var(--text)]" placeholder="Port" />
                          <select value={c.targetId} onChange={e=>updateConn(i,'targetId',e.target.value)} className="flex-1 bg-[var(--panel2)] text-xs p-2 rounded-xl border border-[var(--border)] outline-none text-[var(--text)]">
                            <option value="">{t("selectDevice", lang)}</option>
                            {devices.filter(x=>x.id!==d.id).map(x=><option key={x.id} value={x.id}>{x.deviceId || x.name}</option>)}
                          </select>
                          <input value={c.targetPort} onChange={e=>updateConn(i,'targetPort',e.target.value)} className="w-20 bg-transparent border-b border-[var(--border)] text-xs p-1 outline-none text-[var(--text)]" placeholder="Target Port" />
                          <button onClick={()=>removeConn(i)} className="text-red-400 p-1 hover:bg-red-500/10 rounded"><X size={16}/></button>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] font-mono opacity-80 px-2">
                        <div className="text-[var(--accent)]">LOCAL: {d.name}</div>
                        <div className="text-[var(--muted)]">{'<--->'}</div>
                        <div className="text-[var(--accent2)]">TARGET: {targetName}</div>
                      </div>
                    </div>
                  );
                })}
                {incomingConns.map((inc, i) => {
                  const src = devices.find(x=>x.id===inc.sourceDevId);
                  return (
                    <div key={inc.conn.id} className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/20 shadow-sm">
                      <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
                        <div className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded">{t("incomingConn", lang)}</div>
                        {allowEditPort ? (
                          <>
                            <input value={inc.conn.targetPort} onChange={e=>updateIncoming(i,'targetPort',e.target.value)} className="w-20 bg-transparent border-b border-blue-500/30 text-xs p-1 outline-none text-[var(--text)]" placeholder="Port" />
                            <div className="flex-1 text-sm font-bold text-[var(--text)] truncate px-2">{src?.deviceId} - {src?.name}</div>
                            <input value={inc.conn.localPort} onChange={e=>updateIncoming(i,'localPort',e.target.value)} className="w-20 bg-transparent border-b border-blue-500/30 text-xs p-1 outline-none text-[var(--text)]" placeholder="Target Port" />
                            <button onClick={()=>removeIncoming(i)} className="text-red-400 p-1 hover:bg-red-500/10 rounded"><X size={16}/></button>
                          </>
                        ) : (
                          <div className="text-sm font-bold">{src?.name} (Port: {inc.conn.localPort})</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
            <div className="text-xs font-black text-[var(--text)] mb-3">{t("fNote", lang)}</div>
            {allowEditPort ? <textarea className="w-full bg-[var(--panel)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)] resize-none" rows={3} value={localNote} onChange={e=>setLocalNote(e.target.value)} placeholder="..." /> : <div className="text-sm text-[var(--muted)] p-3 bg-[var(--panel)] rounded-xl">{d.portMap || "-"}</div>}
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
            <div className="flex items-center justify-between mb-4"><div className="font-black text-lg text-[var(--text)]">{t("detailStatus", lang)}</div><LampsRow m={d.migration} isAccessory={isAccessory} /></div>
            {mode === "after" && !isAccessory && (
              <div className="grid grid-cols-2 gap-4 bg-[var(--panel)] p-4 rounded-xl shadow-inner">
                <div className="flex items-center justify-between px-2"><span>Racked</span><Switch on={d.migration.racked} onChange={v=>setFlag(d.id,{racked:v})}/></div>
                <div className="flex items-center justify-between px-2"><span>Cabled</span><Switch on={d.migration.cabled} onChange={v=>setFlag(d.id,{cabled:v})}/></div>
                <div className="flex items-center justify-between px-2"><span>Powered</span><Switch on={d.migration.powered} onChange={v=>setFlag(d.id,{powered:v})}/></div>
                <div className="flex items-center justify-between px-2"><span>Tested</span><Switch on={d.migration.tested} onChange={v=>setFlag(d.id,{tested:v})}/></div>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border)] bg-[var(--panel2)] rounded-b-3xl flex justify-between items-center">
          {allowEditPort && isModified && <button onClick={saveChanges} className="bg-[var(--accent)] text-black px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"><Save size={18}/> {t("btnSaveChanges", lang)}</button>}
          <button onClick={onClose} className="px-8 py-2.5 rounded-xl bg-[var(--text)] text-[var(--bg)] font-black hover:opacity-90 transition-opacity ml-auto">{t("btnClose", lang)}</button>
        </div>
      </motion.div>
    </div>
  );
}

/* -----------------------------
  設備清單 (DevicesPage)
----------------------------- */
const DevicesPage = () => {
  const devices = useStore((s) => s.devices);
  const deleteDeviceById = useStore((s) => s.deleteDeviceById);
  const addDevice = useStore((s) => s.addDevice);
  const updateDevice = useStore((s) => s.updateDevice);
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);

  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);

  const allowManage = canManageAssets(role);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-end">
        <h2 className="text-2xl font-black text-[var(--accent)] flex items-center gap-3"><Server size={28} /> {t("deviceList", lang)}</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => downloadCableLabelsCSV(devices, lang)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent2)] hover:text-black transition-all text-sm font-bold shadow-sm">Labels</button>
          <button onClick={() => downloadFullCSV(devices)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent)] hover:text-black transition-all text-sm font-bold shadow-sm">CSV Export</button>
          {allowManage && <button onClick={() => setIsAdding(true)} className="bg-[var(--accent)] text-black px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:opacity-90 shadow-lg active:scale-95 transition-all"><Plus size={18} /> {t("addDevice", lang)}</button>}
        </div>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[var(--panel2)] text-[var(--muted)] text-[10px] font-black uppercase tracking-widest border-b border-[var(--border)]">
            <tr>
              <th className="px-5 py-4">{t("cat", lang)}</th>
              <th className="px-5 py-4">{t("devId", lang)}</th>
              <th className="px-5 py-4">{t("name", lang)}</th>
              <th className="px-5 py-4">U</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {devices.map(d => (
              <tr key={d.id} className="hover:bg-white/[0.03] transition-colors group">
                <td className="px-5 py-4"><span className="text-[10px] font-black px-2 py-1 rounded border border-white/10 shadow-sm" style={{ backgroundColor: catColor(d.category), color: 'white' }}>{d.category}</span></td>
                <td className="px-5 py-4 font-black text-sm text-[var(--text)]">{d.deviceId || "-"}</td>
                <td className="px-5 py-4"><button onClick={()=>useStore.getState().setSelectedDeviceId(d.id)} className="font-bold text-sm text-[var(--text)] hover:text-[var(--accent)] transition-colors">{d.name}</button></td>
                <td className="px-5 py-4 font-black text-[var(--accent)]">{d.sizeU}U</td>
                <td className="px-5 py-4"><LampsRow m={d.migration} isAccessory={d.category==='Accessory'} /></td>
                <td className="px-5 py-4 text-right">
                  {allowManage && (
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button onClick={()=>setEditing(d)} className="p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg"><Edit3 size={18}/></button>
                      <button onClick={()=>{if(confirm(`Delete ${d.name}?`)) deleteDeviceById(d.id)}} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={18}/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdding && <DeviceModal title={t("addDeviceTitle", lang)} initial={{ category: "Other", deviceId: "", name: "", brand: "", model: "", ports: 8, sizeU: 1, connections: [] }} onClose={()=>setIsAdding(false)} onSave={d=>{addDevice(d); setIsAdding(false);}} />}
      {editing && <DeviceModal title={t("editDeviceTitle", lang)} deviceId={editing.id} initial={{ category: editing.category, deviceId: editing.deviceId, name: editing.name, brand: editing.brand, model: editing.model, ports: editing.ports, sizeU: editing.sizeU, portMap: editing.portMap, connections: editing.connections }} onClose={()=>setEditing(null)} onSave={d=>{updateDevice(editing.id, d); setEditing(null);}} />}
    </div>
  );
};

/* -----------------------------
  管理後台 (AdminPage)
----------------------------- */
const AdminPage = () => {
  const accounts = useStore(s => s.accounts);
  const upsertAccount = useStore(s => s.upsertAccount);
  const deleteAccount = useStore(s => s.deleteAccount);
  const lang = useStore(s => s.lang);
  const [editing, setEditing] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);

  const Modal = ({ title, initial, onClose }: { title: string; initial: Account; onClose: () => void; }) => {
    const [a, setA] = useState<Account>(initial);
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl">
          <div className="text-xl font-black text-[var(--text)] mb-6">{title}</div>
          <div className="space-y-4">
            <input value={a.username} onChange={e=>setA({...a,username:e.target.value})} className="w-full bg-[var(--panel2)] border border-[var(--border)] p-3 rounded-xl outline-none" placeholder="Account" disabled={!creating} />
            <select value={a.role} onChange={e=>setA({...a,role:e.target.value as Role})} className="w-full bg-[var(--panel2)] border border-[var(--border)] p-3 rounded-xl outline-none">
               <option value="vendor">Vendor</option><option value="cable">Cable</option><option value="admin">Admin</option>
            </select>
            <input type="password" value={a.password} onChange={e=>setA({...a,password:e.target.value})} className="w-full bg-[var(--panel2)] border border-[var(--border)] p-3 rounded-xl outline-none" placeholder="Password" />
          </div>
          <div className="mt-8 flex justify-end gap-3"><button onClick={onClose} className="px-5 py-2">Cancel</button><button onClick={()=>{upsertAccount(a);onClose();}} className="bg-[var(--accent)] text-black px-6 py-2 rounded-xl font-black">Save</button></div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-3"><Shield className="text-[var(--accent)]" /> {t("navAdmin", lang)}</h2>
          <button onClick={()=>{setCreating(true);setEditing({username:"",password:"",role:"vendor"});}} className="bg-[var(--accent)] text-black px-5 py-2 rounded-xl font-black shadow-lg shadow-[var(--accent)]/20 hover:scale-105 transition-all">Add Account</button>
        </div>
        <div className="grid gap-3">
          {accounts.map(a => (
            <div key={a.username} className="bg-[var(--panel2)] p-4 rounded-2xl border border-[var(--border)] flex justify-between items-center group">
              <div><div className="font-black text-lg text-[var(--text)]">{a.username}</div><div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest">{a.role}</div></div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={()=>{setCreating(false);setEditing(a);}} className="p-2 text-[var(--accent)]"><Edit3 size={18}/></button>
                <button onClick={()=>{if(confirm('Delete?')) deleteAccount(a.username)}} className="p-2 text-red-500" disabled={a.username==='admin'}><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {editing && <Modal title={creating ? "Add Account" : "Edit Account"} initial={editing} onClose={()=>setEditing(null)} />}
    </div>
  );
};

/* -----------------------------
  ★ 應用程式主入口 (App)
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

export default function App() {
  useApplyTheme();

  // ★ 核心初始化：修復舊資料導致白畫面的邏輯
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "migratePro", "mainState"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // 嚴格確保每個欄位都有預設空值，避免 React 渲染 undefined 崩潰
        useStore.setState({
          devices: normalizeDevices(data.devices || []),
          accounts: data.accounts || loadAccounts(),
          issues: data.issues || [],
          tasks: data.tasks || [],
          projectInfo: data.projectInfo || { startDate: getTimestamp().slice(0, 10), days: 3 }
        });
        
        // 同步回 LocalStorage
        writeJson(LS.devices, data.devices || []);
        writeJson(LS.accounts, data.accounts || loadAccounts());
        writeJson(LS.issues, data.issues || []);
        writeJson(LS.tasks, data.tasks || []);
        writeJson(LS.projectInfo, data.projectInfo || { startDate: getTimestamp().slice(0, 10), days: 3 });
      } else {
        // 初始化雲端資料庫
        const s = useStore.getState();
        syncToCloudFull(s);
      }
    });
    return () => unsub();
  }, []);

  const isAuthed = useStore(s => s.isAuthed);
  const userName = useStore(s => s.userName);
  const role = useStore(s => s.role);
  const logout = useStore(s => s.logout);
  const page = useStore(s => s.page);
  const setPage = useStore(s => s.setPage);
  const theme = useStore(s => s.theme);
  const toggleTheme = useStore(s => s.toggleTheme);
  const lang = useStore(s => s.lang);
  const setLang = useStore(s => s.setLang);
  const ui = useStore(s => s.ui);
  const setUi = useStore(s => s.setUi);
  const selectedDeviceId = useStore(s => s.selectedDeviceId);
  const setSelectedDeviceId = useStore(s => s.setSelectedDeviceId);
  const { isFs, toggle: toggleFs } = useFullscreen();

  if (!isAuthed) return <LoginPage />;

  const navItems = [
    { id: "dashboard", label: t("navDashboard", lang), icon: <LayoutDashboard size={20} /> },
    { id: "devices", label: t("navDevices", lang), icon: <Server size={20} /> },
    { id: "before", label: t("navBefore", lang), icon: <ArrowLeftRight size={20} /> },
    { id: "after", label: t("navAfter", lang), icon: <ArrowRightLeft size={20} /> },
    { id: "runbook", label: t("navRunbook", lang), icon: <CalendarClock size={20} /> },
    { id: "issues", label: t("navIssues", lang), icon: <AlertCircle size={20} /> },
    { id: "guide", label: t("navGuide", lang), icon: <BookOpen size={20} /> },
    ...(role === "admin" ? [{ id: "admin", label: t("navAdmin", lang), icon: <Shield size={20} /> }] : [])
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300 flex flex-col" style={{ fontFamily: lang === 'ko' ? '"Pretendard", sans-serif' : undefined }}>
      <ThemeTokens />

      <header className="h-16 border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-black bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] shadow-lg shadow-[var(--accent)]/20"><Server size={18} /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Migrate<span className="text-[var(--accent)]">Pro</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleFs} className="p-2 hover:bg-white/10 rounded-xl transition-colors">{isFs ? <Minimize size={18} /> : <Expand size={18} />}</button>
          <button onClick={() => setLang(lang === 'zh' ? 'en' : lang === 'en' ? 'ko' : 'zh')} className="text-[10px] font-black px-2 py-1 rounded-lg bg-[var(--panel2)] border border-[var(--border)] uppercase hover:bg-white/5">{lang}</button>
          <button onClick={toggleTheme} className="p-2 hover:bg-white/10 rounded-xl transition-colors">{theme === "dark" ? "🌙" : "☀️"}</button>
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel2)] shadow-inner">
            <span className="text-sm font-black tracking-wide">{userName}</span>
            <span className="text-[9px] font-black bg-black/10 px-1.5 py-0.5 rounded border border-[var(--border)] uppercase">{role}</span>
            <button onClick={logout} className="ml-1 p-1 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"><LogOut size={16} /></button>
          </div>
          <button onClick={logout} className="md:hidden p-2 hover:bg-white/10 rounded-xl text-red-500 transition-colors"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className={`border-r border-[var(--border)] h-[calc(100vh-64px)] sticky top-16 p-4 bg-[var(--panel)] hidden lg:block transition-all duration-300 ${ui.sideCollapsed ? "w-20" : "w-64"} shrink-0`}>
           <div className="flex justify-end mb-4"><button onClick={() => setUi({ sideCollapsed: !ui.sideCollapsed })} className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] transition-colors">{ui.sideCollapsed ? <ChevronsRight size={18}/> : <ChevronsLeft size={18}/>}</button></div>
           <div className="space-y-1.5">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setPage(item.id as PageKey)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${page === item.id ? "bg-[var(--accent)] text-black shadow-[0_5px_15px_rgba(34,211,238,0.3)] font-black scale-[1.02]" : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 font-bold"}`}>
                {item.icon} {!ui.sideCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>
        
        <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg)]">
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="min-h-full">
              {page === "dashboard" && <Dashboard />}
              {page === "devices" && <DevicesPage />}
              {page === "before" && <RackPlanner mode="before" />}
              {page === "after" && <RackPlanner mode="after" />}
              {page === "runbook" && <RunbookPage />}
              {page === "issues" && <IssuesPage />}
              {page === "guide" && <GuidePage />}
              {page === "admin" && <AdminPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--panel)]/95 backdrop-blur-xl border border-[var(--border)] rounded-full px-2 py-2 flex gap-1 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-x-auto max-w-[95vw] scrollbar-hide">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setPage(item.id as PageKey)} className={`p-3.5 rounded-full transition-all shrink-0 ${page === item.id ? "text-black bg-[var(--accent)] shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-110" : "text-[var(--muted)] hover:bg-white/10"}`}>
            {item.icon}
          </button>
        ))}
      </div>

      {selectedDeviceId && <DeviceDetailModal id={selectedDeviceId} mode={page === "after" ? "after" : "before"} onClose={() => setSelectedDeviceId(null)} />}
    </div>
  );
}

// ==========================================
// --- Part 5 結束 (重構拼圖完成！) ---
// ==========================================