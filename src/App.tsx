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
   型別定義 (Types) - 已加入甘特圖與新頁面型別
========================================== */
type ThemeMode = "dark" | "light";
type ThemeStyle = "neon" | "horizon" | "nebula" | "matrix";
// ★ 新增 runbook 與 guide 頁面
type PageKey = "dashboard" | "devices" | "before" | "after" | "runbook" | "issues" | "guide" | "admin";
type DeviceCategory = "Network" | "Storage" | "Server" | "Accessory" | "Other";
type PlacementMode = "before" | "after";

type Role = "admin" | "vendor" | "cable";
type Lang = "zh" | "en" | "ko";

type MigrationFlags = { racked: boolean; cabled: boolean; powered: boolean; tested: boolean; };
type Rack = { id: string; name: string; units: number };
type Connection = { id: string; localPort: string; targetId: string; targetPort: string; };

type Device = {
  id: string; category: DeviceCategory; deviceId: string; name: string; brand: string; model: string; ports: number; sizeU: number; ip?: string; serial?: string; portMap?: string;
  connections: Connection[];
  beforeRackId?: string; beforeStartU?: number; beforeEndU?: number;
  afterRackId?: string; afterStartU?: number; afterEndU?: number;
  migration: MigrationFlags;
};

type DeviceDraft = Omit<Device, "id" | "beforeRackId" | "beforeStartU" | "beforeEndU" | "afterRackId" | "afterStartU" | "afterEndU" | "migration">;

// 問題回報資料結構
type IssueReply = { id: string; text: string; author: string; createdAt: number; };
type IssueStatus = "open" | "resolved";
type Issue = { id: string; title: string; description: string; author: string; createdAt: number; status: IssueStatus; replies: IssueReply[]; };

// ★ 新增：專案劇本資料結構 (Runbook / Gantt Chart)
type TaskStatus = "pending" | "in_progress" | "done" | "verified";
type Task = { id: string; title: string; vendor: string; dayIndex: number; startHH: number; endHH: number; status: TaskStatus; };
type ProjectInfo = { startDate: string; days: number; };

type UiState = { sideCollapsed: boolean; unplacedCollapsedBefore: boolean; unplacedCollapsedAfter: boolean; };
type LoginResult = { ok: boolean; message?: string };
type Account = { username: string; password: string; role: Role; };

/* -----------------------------
  LocalStorage Keys (加入 tasks 與 projectInfo)
----------------------------- */
const LS = {
  theme: "migrate.theme", themeStyle: "migrate.themeStyle", devices: "migrate.devices",
  ui: "migrate.ui", auth: "migrate.auth", user: "migrate.user", accounts: "migrate.accounts", lang: "migrate.lang", issues: "migrate.issues",
  tasks: "migrate.tasks", projectInfo: "migrate.projInfo"
} as const;

/* -----------------------------
  ★ 多語系字典 (i18n) ★ (全面補齊新功能詞彙)
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
  Fixed Colors
----------------------------- */
const FIXED_COLORS = { Network: "#22c55e", Server: "#3b82f6", Storage: "#8b5cf6", Accessory: "#64748b", Other: "#fb923c" };

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

// ★ 時間戳記工具 (防當機處理)
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

// ★ 根據廠商名稱產生固定顏色 (加上預設空字串防呆)
const getVendorColor = (name: string = "") => {
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
  const link = document.createElement("a"); link.setAttribute("href", encodedUri); 
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
  const link = document.createElement("a"); link.setAttribute("href", encodedUri); 
  link.setAttribute("download", `CableLabels_${getTimestamp()}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const downloadFullCSVTemplate = () => {
  const csvContent = "\uFEFF" + CSV_HEADER + "\n";
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "MigratePro_Template.csv");
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
// ==========================================
// --- Part 1 結束 ---
// ==========================================
// ==========================================
// --- Part 2 開始 (約 第 421 ~ 760 行) ---
// ==========================================

/* -----------------------------
  Store Definition (系統大腦型別)
----------------------------- */
interface Store {
  beforeRacks: Rack[];
  afterRacks: Rack[];
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

  addIssue: (title: string, desc: string) => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  deleteIssue: (id: string) => void;
  addIssueReply: (id: string, text: string) => void;

  updateProjectInfo: (info: ProjectInfo) => void;
  addTask: (task: Omit<Task, "id" | "status">) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
}

const DEFAULT_UI: UiState = { sideCollapsed: false, unplacedCollapsedBefore: false, unplacedCollapsedAfter: false };

function loadAccounts(): Account[] {
  const stored = readJson<Account[]>(LS.accounts, []);
  const valid = Array.isArray(stored) ? stored : [];
  if (valid.length === 0) { 
    const defaultAcc = [{ username: "admin", password: "123", role: "admin" as Role }];
    writeJson(LS.accounts, defaultAcc); 
    return defaultAcc; 
  }
  const hasAdmin = valid.some((a) => a.username === "admin");
  const patched = hasAdmin ? valid : [{ username: "admin", password: "123", role: "admin" as Role }, ...valid];
  const fixedAdmin = patched.map((a) => a.username === "admin" ? { ...a, role: "admin" as Role } : a);
  writeJson(LS.accounts, fixedAdmin);
  return fixedAdmin;
}

/* -----------------------------
  實作 Zustand Store
----------------------------- */
const useStore = create<Store>((set, get) => {
  // ★ 防禦性讀取：確保從 LocalStorage 拿出來的舊資料不會毒化系統
  const initIssues = readJson<Issue[]>(LS.issues, []);
  const initTasks = readJson<Task[]>(LS.tasks, []);
  const initProj = readJson<ProjectInfo>(LS.projectInfo, { startDate: getTimestamp().slice(0,10), days: 3 });
  
  return {
    beforeRacks: BEFORE_RACKS,
    afterRacks: AFTER_RACKS,
    devices: normalizeDevices(readJson<Device[]>(LS.devices, [])), 
    issues: Array.isArray(initIssues) ? initIssues : [], 
    tasks: Array.isArray(initTasks) ? initTasks : [], 
    projectInfo: (typeof initProj === 'object' && initProj !== null) ? initProj : { startDate: getTimestamp().slice(0,10), days: 3 },
    
    theme: (localStorage.getItem(LS.theme) as ThemeMode) || "dark",
    themeStyle: (localStorage.getItem(LS.themeStyle) as ThemeStyle) || "neon",
    lang: (localStorage.getItem(LS.lang) as Lang) || "zh",
    page: "dashboard",
    selectedDeviceId: null,
    ui: { ...DEFAULT_UI, ...readJson<UiState>(LS.ui, DEFAULT_UI) },
    
    draggingDevice: null,
    setDraggingDevice: (d) => set({ draggingDevice: d }),

    accounts: loadAccounts(),

    isAuthed: localStorage.getItem(LS.auth) === "1",
    userName: localStorage.getItem(LS.user) || null,
    role: (() => {
      const u = localStorage.getItem(LS.user);
      if (u === "admin") return "admin" as Role;
      const found = loadAccounts().find((a) => a.username === u);
      return found?.role ?? ("vendor" as Role);
    })(),

    upsertAccount: (a) => {
      const username = a.username.trim();
      if (!username || username.includes(" ") || !a.password) return { ok: false, message: "Error" };
      if (a.username === "admin" && a.role !== "admin") return { ok: false, message: "Error" };

      const accounts = get().accounts;
      const exists = accounts.some((x) => x.username === username);
      const next = exists ? accounts.map((x) => (x.username === username ? { ...a, username } : x)) : [...accounts, { ...a, username }];
      writeJson(LS.accounts, next); 
      syncToCloud({ accounts: next }); 
      set({ accounts: next }); 
      return { ok: true };
    },

    deleteAccount: (username) => {
      if (username === "admin") return { ok: false, message: "admin Cannot be deleted" };
      const next = get().accounts.filter((a) => a.username !== username);
      writeJson(LS.accounts, next); 
      syncToCloud({ accounts: next }); 
      set({ accounts: next }); 
      return { ok: true };
    },

    login: (u, p) => {
      const username = u.trim();
      const found = get().accounts.find((a) => a.username === username && a.password === p);
      if (!found) return { ok: false, message: "Login Failed" };
      localStorage.setItem(LS.auth, "1"); 
      localStorage.setItem(LS.user, username);
      set({ isAuthed: true, userName: username, role: found.role, page: "dashboard", selectedDeviceId: null });
      return { ok: true };
    },

    logout: () => {
      localStorage.removeItem(LS.auth); 
      localStorage.removeItem(LS.user);
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
        writeJson(LS.devices, next); 
        syncToCloud({ devices: next }); 
        return { devices: next };
      });
      return id;
    },

    updateDevice: (id, patch) => set((s) => {
      const next = s.devices.map((d) => d.id === id ? ({ ...d, ...patch } as Device) : d);
      writeJson(LS.devices, next); 
      syncToCloud({ devices: next }); 
      return { devices: next };
    }),

    deleteDeviceById: (id) => set((s) => {
      const next = s.devices.filter((d) => d.id !== id);
      writeJson(LS.devices, next); 
      syncToCloud({ devices: next }); 
      return { devices: next, selectedDeviceId: s.selectedDeviceId === id ? null : s.selectedDeviceId };
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
          let connections = []; 
          try { connections = JSON.parse(getv(r, "connections")); } catch(e) {}

          return {
            id: getv(r, "id") || crypto.randomUUID(), 
            category: (getv(r, "category") as DeviceCategory) || "Other",
            deviceId: getv(r, "deviceId"), 
            name: getv(r, "name"), 
            brand: getv(r, "brand"), 
            model: getv(r, "model"),
            ports: Number(getv(r, "ports") || 0), 
            sizeU: Math.max(1, Math.min(42, Number(getv(r, "sizeU") || 1))),
            ip: getv(r, "ip"), 
            serial: getv(r, "serial"), 
            portMap: getv(r, "portMap"),
            connections: Array.isArray(connections) ? connections : [],
            beforeRackId, 
            beforeStartU: getv(r, "beforeStartU") ? Number(getv(r, "beforeStartU")) : undefined, 
            beforeEndU: getv(r, "beforeEndU") ? Number(getv(r, "beforeEndU")) : undefined,
            afterRackId, 
            afterStartU: getv(r, "afterStartU") ? Number(getv(r, "afterStartU")) : undefined, 
            afterEndU: getv(r, "afterEndU") ? Number(getv(r, "afterEndU")) : undefined,
            migration: { 
              racked: getv(r, "m_racked") === "1", 
              cabled: getv(r, "m_cabled") === "1", 
              powered: getv(r, "m_powered") === "1", 
              tested: getv(r, "m_tested") === "1" 
            },
          };
        });
        
        writeJson(LS.devices, devices); 
        syncToCloud({ devices }); 
        set({ devices }); 
        return { ok: true };
      } catch (e: any) { 
        return { ok: false, message: e?.message || "Import Failed" }; 
      }
    },

    appendDevicesFromCSV: (fileText) => {
      try {
        const rows = parseCSV(fileText);
        if (rows.length < 2) return { ok: false, message: "CSV Empty" };
        const header = rows[0].map((x) => x.trim());
        const getv = (r: string[], k: string) => String(r[header.findIndex((h) => h === k)] ?? "").trim();
        
        const newDevices: Device[] = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i]; 
          if (r.length < 3) continue;
          const deviceId = getv(r, "deviceId");
          const name = getv(r, "name");
          if (!deviceId || !name) continue;
          
          newDevices.push({
            id: crypto.randomUUID(), 
            category: (getv(r, "category") as DeviceCategory) || "Other",
            deviceId, 
            name, 
            brand: getv(r, "brand"), 
            model: getv(r, "model"),
            ports: Number(getv(r, "ports") || 0), 
            sizeU: Math.max(1, Math.min(42, Number(getv(r, "sizeU") || 1))),
            ip: getv(r, "ip"), 
            serial: getv(r, "serial"), 
            portMap: getv(r, "portMap"), 
            connections: [],
            migration: { racked: false, cabled: false, powered: false, tested: false },
          });
        }
        
        if (newDevices.length === 0) return { ok: false, message: "No Valid Devices" };
        const updated = [...get().devices, ...newDevices];
        
        writeJson(LS.devices, updated); 
        syncToCloud({ devices: updated }); 
        set({ devices: updated }); 
        return { ok: true };
      } catch (e: any) { 
        return { ok: false, message: e?.message || "Import Failed" }; 
      }
    },

    clearPlacement: (mode, id) => set((s) => {
      const next = s.devices.map((d) => d.id !== id ? d : mode === "before" ? { ...d, beforeRackId: undefined, beforeStartU: undefined, beforeEndU: undefined } : { ...d, afterRackId: undefined, afterStartU: undefined, afterEndU: undefined });
      writeJson(LS.devices, next); 
      syncToCloud({ devices: next }); 
      return { devices: next };
    }),

    place: (mode, deviceId, rackId, startU) => {
      const { devices } = get(); 
      const dev = devices.find((d) => d.id === deviceId);
      if (!dev) return { ok: false, message: "Not Found" };
      
      const sU = clampU(startU); 
      const eU = sU + Math.max(1, Math.min(42, dev.sizeU)) - 1;
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
      
      writeJson(LS.devices, next); 
      syncToCloud({ devices: next }); 
      set({ devices: next }); 
      return { ok: true };
    },

    setMigrationFlag: (id, patch) => set((s) => {
      const next = s.devices.map((d) => d.id === id ? { ...d, migration: { ...d.migration, ...patch } } : d);
      writeJson(LS.devices, next); 
      syncToCloud({ devices: next }); 
      return { devices: next };
    }),

    repairRackIds: () => set((s) => {
      const repaired = s.devices.map((d) => {
        let beforeRackId = backwardCompatRackId(d.beforeRackId);
        let afterRackId = backwardCompatRackId(d.afterRackId);
        return { ...d, beforeRackId, afterRackId };
      });
      writeJson(LS.devices, repaired); 
      syncToCloud({ devices: repaired }); 
      return { devices: repaired };
    }),

    // --- Issues Actions ---
    addIssue: (title, description) => set((s) => {
      const newIssue: Issue = { id: crypto.randomUUID(), title, description, author: s.userName || "Unknown", createdAt: Date.now(), status: "open", replies: [] };
      const next = [newIssue, ...(s.issues || [])];
      writeJson(LS.issues, next); 
      syncToCloud({ issues: next }); 
      return { issues: next };
    }),
    
    updateIssueStatus: (id, status) => set((s) => {
      const next = (s.issues || []).map(i => i.id === id ? { ...i, status } : i);
      writeJson(LS.issues, next); 
      syncToCloud({ issues: next }); 
      return { issues: next };
    }),
    
    deleteIssue: (id) => set((s) => {
      const next = (s.issues || []).filter(i => i.id !== id);
      writeJson(LS.issues, next); 
      syncToCloud({ issues: next }); 
      return { issues: next };
    }),
    
    addIssueReply: (id, text) => set((s) => {
      const reply: IssueReply = { id: crypto.randomUUID(), text, author: s.userName || "Unknown", createdAt: Date.now() };
      const next = (s.issues || []).map(i => i.id === id ? { ...i, replies: [...(i.replies || []), reply] } : i);
      writeJson(LS.issues, next); 
      syncToCloud({ issues: next }); 
      return { issues: next };
    }),

    // --- Tasks Actions (專案劇本) ---
    updateProjectInfo: (info) => set(() => {
      writeJson(LS.projectInfo, info); 
      syncToCloud({ projectInfo: info }); 
      return { projectInfo: info };
    }),
    
    addTask: (t) => set((s) => {
      const newTask: Task = { ...t, id: crypto.randomUUID(), status: "pending" };
      const next = [...(s.tasks || []), newTask];
      writeJson(LS.tasks, next); 
      syncToCloud({ tasks: next }); 
      return { tasks: next };
    }),
    
    updateTaskStatus: (id, status) => set((s) => {
      const next = (s.tasks || []).map(t => t.id === id ? { ...t, status } : t);
      writeJson(LS.tasks, next); 
      syncToCloud({ tasks: next }); 
      return { tasks: next };
    }),
    
    deleteTask: (id) => set((s) => {
      const next = (s.tasks || []).filter(t => t.id !== id);
      writeJson(LS.tasks, next); 
      syncToCloud({ tasks: next }); 
      return { tasks: next };
    })
  };
});

// ==========================================
// --- Part 2 結束 ---
// ==========================================
// ==========================================
// --- Part 3 開始 (約 第 761 ~ 1380 行) ---
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
    className="inline-block w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-colors duration-300"
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
      className={`w-11 h-6 rounded-full border transition-all ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${on ? "bg-[rgba(0,255,0,0.15)] border-[rgba(0,255,0,0.7)]" : "bg-black/20 border-[var(--border)]"}`}
      style={{ boxShadow: on ? "0 0 16px rgba(0,255,0,0.25)" : "none" }}
    >
      <span
        className="block w-5 h-5 rounded-full bg-white transition-all shadow-sm"
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
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] shadow-lg shadow-[var(--accent)]/20">
            <Server size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text)] tracking-tight">MigratePro</div>
            <div className="text-sm font-bold text-[var(--muted)]">機房搬遷戰情中心</div>
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
            <div className="text-sm text-red-500 font-bold bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 flex items-center gap-2">
              <AlertCircle size={16} /> {err}
            </div>
          )}
          
          <button
            onClick={handleLogin}
            className="w-full mt-4 bg-[var(--accent)] text-black font-black py-4 rounded-xl hover:opacity-90 shadow-lg shadow-[var(--accent)]/20 transition-all active:scale-[0.98]"
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
      <div className="min-w-[1000px] border border-[var(--border)] bg-[var(--panel2)] rounded-2xl p-4 shadow-inner relative">
        {/* 時間軸 Header */}
        <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="col-span-2 text-[10px] font-black text-[var(--muted)] border-l border-[var(--border)] pl-1">
              {String(i).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        
        {/* 任務長條圖 */}
        <div className="space-y-2 relative z-10">
          {dayTasks.length === 0 && (
            <div className="text-sm font-bold text-[var(--muted)] py-8 italic text-center bg-white/5 rounded-xl border border-dashed border-[var(--border)]">
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
                className={`h-full rounded-lg px-2 text-[11px] font-bold text-white flex items-center justify-between shadow-sm overflow-hidden transition-all ${t.status === 'done' ? 'opacity-80' : ''} ${t.status === 'verified' ? 'opacity-40 grayscale' : ''}`}
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
  
  // 只過濾出 A 排與 B 排的機櫃來輪播
  const p1 = useMemo(() => racks.filter((r) => r.id.includes("AFT_A") || r.id.includes("AFT_B")), [racks]);
  
  return (
    <div className="flex gap-2 lg:gap-3 overflow-x-auto w-full flex-1 min-h-[500px] xl:min-h-[600px] pb-2 scrollbar-hide snap-x">
      {p1.map(rack => {
        const rackDevs = devices.filter(d => d.afterRackId === rack.id && d.afterStartU != null && d.afterEndU != null);
        const displayName = getRackName(rack.id, lang);
        
        return (
          <div key={rack.id} className="flex flex-col bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 snap-center border border-slate-700 min-w-[130px] lg:min-w-0 flex-1 shadow-lg">
            <div className="px-2 py-2.5 text-center text-xs xl:text-sm font-black text-white truncate bg-emerald-600 shadow-md z-20">
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
  
  // KPI 計算
  const validDevs = devices.filter(d => d.category !== "Accessory");
  const total = validDevs.length;
  const racked = validDevs.filter((d) => d.migration.racked).length;
  const cabled = validDevs.filter((d) => d.migration.cabled).length;
  const powered = validDevs.filter((d) => d.migration.powered).length;
  const tested = validDevs.filter((d) => d.migration.tested).length;
  const completed = validDevs.filter((d) => isMigratedComplete(d.migration)).length;
  const pending = Math.max(0, total - completed);
  
  const calcPct = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0;

  // 將原本龐大的長條圖縮編為微型彩色標籤
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
    }, 15000); // 15秒切換一次
    return () => clearInterval(t);
  }, [tvMode]);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      
      {/* 頂部三大 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--panel)] border border-[var(--border)] p-5 md:p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="text-lg md:text-xl font-extrabold text-[var(--muted)] mb-1">{t("totalDevices", lang)}</div>
          <div className="text-4xl md:text-5xl font-black text-[var(--accent)] mb-3">{total}</div>
          <div className="flex gap-2 flex-wrap">
            {chartData.map(c => (
              <span 
                key={c.name} 
                className="text-[10px] md:text-xs font-black px-2 py-1 rounded-md border shadow-sm" 
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
            <div className="text-sm font-black text-red-500">{calcPct(pending)}%</div>
          </div>
          <div className="text-3xl md:text-4xl font-black text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]">{pending}</div>
          <div className="mt-4 w-full h-2 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${calcPct(pending)}%` }} />
          </div>
        </div>
        
        <div className="bg-[var(--panel)] border border-[var(--border)] p-5 md:p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1">
            <div className="text-lg md:text-xl font-extrabold text-[var(--muted)]">{t("completed", lang)}</div>
            <div className="text-sm font-black text-green-500">{calcPct(completed)}%</div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl md:text-4xl font-black text-green-500 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]">{completed}</div>
            <div className="text-sm text-[var(--muted)] font-black">/ {total}</div>
          </div>
          <div className="mt-4 w-full h-2 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${calcPct(completed)}%` }} />
          </div>
        </div>
      </div>

      {/* 四大里程碑進度條 */}
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
              <div className="text-[10px] md:text-xs font-black text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded">{calcPct(item.val)}%</div>
            </div>
            <div className="w-full h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${calcPct(item.val)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* 下半部：TV 切換與主展示區 */}
      <div className="bg-[var(--panel)] border border-[var(--border)] p-5 md:p-6 rounded-2xl shadow-xl flex flex-col w-full">
        <div className="flex flex-wrap w-full justify-between items-center mb-6 gap-3">
          
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
          
          <button 
            onClick={() => setTvMode(!tvMode)} 
            className={`px-5 py-2.5 rounded-xl text-sm font-extrabold flex items-center gap-2 transition-all shadow-lg ${tvMode ? 'bg-red-500 text-white animate-pulse shadow-red-500/40' : 'bg-black/80 dark:bg-white/10 text-[var(--text)] border border-[var(--border)] hover:scale-105'}`}
          >
            {tvMode ? <><Tv size={18} /> {t("tvModeOn", lang)}</> : <><Tv size={18} /> {t("tvModeOff", lang)}</>}
          </button>
        </div>
        
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
      
      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 md:p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform">
        <h3 className="text-lg font-black text-[var(--text)] mb-4 flex items-center gap-3">
          <span className="w-2 h-6 bg-[var(--accent)] rounded-full"></span> 
          1. 系統架構與角色權限
        </h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
          MigratePro 是一套專為大型機房搬遷設計的「實時戰情指揮系統」。它透過拖曳排版、雙向線路追蹤與甘特圖劇本，將雜亂的 Excel 轉化為視覺化的指揮中心。
        </p>
        <ul className="text-sm text-[var(--text)] space-y-2 list-disc pl-6 font-medium">
          <li><span className="text-[var(--accent)]">Admin (管理員)</span>：擁有最高權限，可新增設備、調整機櫃佈局、編寫搬遷劇本。</li>
          <li><span className="text-blue-400">Cable (佈線廠商)</span>：可編輯設備資訊與線路對接表，無法刪除設備或調整大佈局。</li>
          <li><span className="text-green-400">Vendor (設備廠商)</span>：可檢視清單，並在「專案劇本」與「機櫃圖」中打卡回報進度。</li>
        </ul>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 md:p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform">
        <h3 className="text-lg font-black text-[var(--text)] mb-4 flex items-center gap-3">
          <span className="w-2 h-6 bg-[var(--accent2)] rounded-full"></span> 
          2. 智慧線路對接與標籤產生
        </h3>
        <ul className="text-sm text-[var(--muted)] space-y-3 list-decimal pl-6 leading-relaxed">
          <li><strong>請勿手動輸入對接設備的機櫃位置！</strong> 這會導致搬遷時資料不一致。</li>
          <li>請在設備編輯視窗中，找到「智慧線路對接表」，點擊「新增對接」。</li>
          <li>在下拉選單中選擇目標設備，系統會自動尋找對方的搬遷前後位置。</li>
          <li>完成連線後，另一台設備的視窗中也會自動出現「⬅️ 來自他台」的紀錄。</li>
          <li>點擊清單頁面的「匯出線路標籤」，系統會自動將雙向資訊合併為一行，產出專用 CSV。</li>
        </ul>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 md:p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform">
        <h3 className="text-lg font-black text-[var(--text)] mb-4 flex items-center gap-3">
          <span className="w-2 h-6 bg-purple-500 rounded-full"></span> 
          3. 專案劇本與戰情室輪播
        </h3>
        <ul className="text-sm text-[var(--text)] space-y-2 list-disc pl-6">
          <li>廠商使用手機登入時，甘特圖會自動轉化為「待辦打卡清單」，方便現場點擊完成。</li>
          <li>將筆電接上電視大螢幕後，在儀表板點擊右側的 <strong>[TV 戰情室輪播]</strong>，畫面將自動隱藏多餘按鈕，並每 15 秒在「現況圖」與「甘特圖」之間切換。</li>
        </ul>
      </div>
    </div>
  );
};

// ==========================================
// --- Part 3 結束 ---
// ==========================================
// ==========================================
// --- Part 4 開始 (約 第 1381 ~ 1950 行) ---
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
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
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
        </motion.div>
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
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
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
        </motion.div>
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

// 用於 Admin 點擊空位快速新增設備的元件 (此處僅為預留定義，稍後在 Part 5 實作 DeviceModal)
function AddAndPlaceModal({ mode, rackId, u, onClose }: { mode: PlacementMode; rackId: string; u: number; onClose: () => void; }) {
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);
  const addDevice = useStore((s) => s.addDevice);
  const place = useStore((s) => s.place);
  if (role !== "admin") return null;
  const initial: DeviceDraft = { category: "Other", deviceId: "", name: "", brand: "", model: "", ports: 8, sizeU: 1, ip: "", serial: "", portMap: "", connections: [] };
  const displayName = getRackName(rackId, lang);
  
  // 由於 DeviceModal 在 Part 5 才會出現，如果出現編譯錯誤請不用擔心，Part 5 貼上後就會自動連結。
  // 若環境為嚴格檢查，可暫時不在此處渲染
  return (
    <DeviceModal 
      title={`${t("addPlaceTitle", lang)}：${displayName} / ${u}U`} 
      initial={initial} 
      onClose={onClose} 
      onSave={(d) => { const id = addDevice(d); const res = place(mode, id, rackId, u); if (!res.ok) alert(res.message); onClose(); }} 
    />
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
  
  // 點擊空位新增功能
  const [addPlace, setAddPlace] = useState<{ rackId: string; u: number } | null>(null);
  // 拖曳時顯示 U 數 Highlight
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

  // ★ 確保搬遷前分兩排 (10~6, 5~1) 完美還原
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

  const U_H = 22; 

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

      <div className="space-y-8 overflow-hidden">
        {rackRows.map((row, idx) => (
          <div key={idx} className="flex gap-6 overflow-x-auto pb-4 items-start snap-x scrollbar-hide">
            {row.map((rack) => {
              const displayName = getRackName(rack.id, lang);
              const isRed = rack.id.includes("Unmoved") || rack.id.includes("New_Device");

              return (
                <div key={rack.id} className="flex flex-col bg-[var(--panel)] rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden flex-shrink-0 snap-center min-w-[340px] md:min-w-[400px]">
                  
                  <div className={`px-5 py-3 ${mode === "after" && isRed ? "bg-red-800" : mode === "before" && isRed ? "bg-red-800" : mode === "after" ? "bg-emerald-600" : "bg-slate-800"} text-white flex justify-between items-center shadow-md z-10`}>
                    <h2 className="font-black text-sm md:text-base flex items-center gap-2 truncate text-white tracking-wide">
                      <Server size={18} /> {displayName}
                    </h2>
                    <span className="text-[10px] font-bold bg-black/30 px-2.5 py-1 rounded-md whitespace-nowrap text-white shadow-inner">
                      42U
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-hidden p-5 bg-[var(--panel2)] flex justify-center">
                    <div className="relative w-full border-x-[12px] border-t-[12px] border-slate-400 dark:border-slate-600 bg-slate-900 rounded-t-xl shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)] mb-4" style={{ height: 42 * U_H }}>
                      
                      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-9 bg-yellow-400/95 border-r-2 border-slate-800 z-0 shadow-[2px_0_5px_rgba(0,0,0,0.3)]" />

                      {Array.from({ length: 42 }).map((_, i) => {
                        const u = i + 1;
                        const bottomPos = i * U_H;
                        const isThick = u % 5 === 0;
                        const isHoverTarget = allowLayout && dragHover?.rackId === rack.id && u >= dragHover.u && u < dragHover.u + (draggingDevice?.sizeU || 1);

                        return (
                          <React.Fragment key={`grid-${u}`}>
                            <div className="absolute left-0 w-8 sm:w-9 flex items-center justify-center text-slate-900 text-[9px] font-black z-0 tracking-tighter" style={{ bottom: bottomPos, height: U_H }}>
                              {u}
                            </div>
                            
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
                            
                            {u < 42 && (
                              <div className={`absolute left-8 sm:left-9 right-0 z-0 pointer-events-none ${isThick ? "bg-slate-500/80 h-[2px]" : "bg-slate-700/50 h-[1px]"}`} style={{ bottom: bottomPos + U_H }} />
                            )}
                          </React.Fragment>
                        );
                      })}

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

                      <div className="absolute -bottom-5 left-[-12px] right-[-12px] h-5 bg-slate-500 dark:bg-slate-700 rounded-b-md shadow-[0_5px_15px_rgba(0,0,0,0.5)] z-0"></div>
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

// ==========================================
// --- Part 4 結束 ---
// ==========================================
// ==========================================
// --- Part 5 開始 (約 第 1951 行起至檔尾) ---
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

  // 本機狀態 (Outbound)
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

  const beforePos = d.beforeRackId && d.beforeStartU != null && d.beforeEndU != null ? `${getRackName(d.beforeRackId, lang)} ${d.beforeStartU}-${d.beforeEndU}U` : "-";
  const afterPos = d.afterRackId && d.afterStartU != null && d.afterEndU != null ? `${getRackName(d.afterRackId, lang)} ${d.afterStartU}-${d.afterEndU}U` : "-";
  
  const allowLayout = canManageAssets(role);
  const allowEditPort = canEditPortMap(role);
  const isModified = localNote !== (d.portMap || "") || 
    JSON.stringify(localConns) !== JSON.stringify(d.connections || []) ||
    JSON.stringify(incomingConns) !== JSON.stringify(originalIncoming) ||
    deletedIncoming.length > 0;

  // 對接編輯 Action (Outbound)
  const addConn = () => setLocalConns(p => [...p, { id: crypto.randomUUID(), localPort: '', targetId: '', targetPort: '' }]);
  const updateConn = (i: number, k: keyof Connection, v: string) => { const n = [...localConns]; n[i] = { ...n[i], [k]: v }; setLocalConns(n); };
  const removeConn = (i: number) => { const n = [...localConns]; n.splice(i, 1); setLocalConns(n); };
  
  // 對接編輯 Action (Inbound)
  const updateIncoming = (i: number, k: keyof Connection, v: string) => {
    const n = [...incomingConns]; n[i] = { ...n[i], conn: { ...n[i].conn, [k]: v } }; setIncomingConns(n);
  };
  const removeIncoming = (i: number) => {
    const removed = incomingConns[i]; setDeletedIncoming(p => [...p, removed.conn.id]);
    const n = [...incomingConns]; n.splice(i, 1); setIncomingConns(n);
  };

  // ★ 跨設備同步儲存邏輯
  const saveChanges = () => {
    // 1. 儲存自己的 outbound 與備註
    updateDevice(d.id, { portMap: localNote.trimEnd(), connections: localConns });
    
    // 2. 更新別台機器裡的對接資料 (Incoming 修改)
    incomingConns.forEach(inc => {
      const sourceDev = useStore.getState().devices.find(x => x.id === inc.sourceDevId);
      if (sourceDev) {
        const newConns = sourceDev.connections.map(sc => sc.id === inc.conn.id ? inc.conn : sc);
        if (JSON.stringify(sourceDev.connections) !== JSON.stringify(newConns)) {
          useStore.getState().updateDevice(sourceDev.id, { connections: newConns });
        }
      }
    });
    
    // 3. 處理被刪除的 Incoming
    deletedIncoming.forEach(connId => {
      const sourceDev = useStore.getState().devices.find(x => x.connections.some(c => c.id === connId));
      if (sourceDev) {
        useStore.getState().updateDevice(sourceDev.id, { connections: sourceDev.connections.filter(c => c.id !== connId) });
      }
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-5 md:p-6 border-b border-[var(--border)] shrink-0 flex items-start justify-between gap-3 bg-[var(--panel2)] rounded-t-3xl">
          <div className="min-w-0">
            <div className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">{t("detailTitle", lang)} {isAccessory && "(Accessory)"}</div>
            <div className="text-xl md:text-2xl font-black text-[var(--text)] truncate mt-1">{isAccessory ? d.name : `${d.deviceId} · ${d.name}`}</div>
            <div className="text-sm font-medium text-[var(--muted)] truncate mt-1">
              {isAccessory ? "-" : `${d.brand} / ${d.model} · ${d.ports} ports`} · <span className="text-[var(--accent)]">{d.sizeU}U</span>
            </div>
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
            {!isAccessory && (
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)] md:col-span-2 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-[var(--muted)]">IP Address</div>
                  <div className="font-mono text-base font-bold mt-1 text-[var(--text)]">{d.ip || "-"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[var(--muted)]">Serial Number (SN)</div>
                  <div className="font-mono text-base font-bold mt-1 text-[var(--text)]">{d.serial || "-"}</div>
                </div>
              </div>
            )}
          </div>

          {!isAccessory && (
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--panel2)] shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 font-black text-[var(--text)]"><Link2 size={18} className="text-[var(--accent)]" /> {t("cableRouting", lang)}</div>
                {allowEditPort && <button onClick={addConn} className="text-xs bg-[var(--accent)] text-black px-4 py-2 rounded-xl font-black hover:opacity-90 transition-all shadow-md active:scale-95"><Plus size={14} /> {t("addConnection", lang)}</button>}
              </div>
              <div className="space-y-4">
                {/* Outbound */}
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
                            {devices.filter(x=>x.id!==d.id && x.category !== "Accessory").map(x=><option key={x.id} value={x.id}>{x.deviceId || x.name}</option>)}
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
                
                {/* Inbound */}
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
                          <div className="text-sm font-bold flex-1 px-2 text-[var(--text)]">{src?.name} (Port: {inc.conn.localPort})</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-black text-[var(--text)]">{t("fNote", lang)}</div>
              {!allowEditPort && <div className="text-[10px] font-bold text-[var(--muted)] bg-black/10 px-2 py-1 rounded-md">Vendor ({t("readOnly", lang)})</div>}
            </div>
            {allowEditPort ? <textarea className="w-full bg-[var(--panel)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)] resize-none" rows={3} value={localNote} onChange={e=>setLocalNote(e.target.value)} placeholder="..." /> : <div className="text-sm text-[var(--muted)] p-3 bg-[var(--panel)] rounded-xl">{d.portMap || "-"}</div>}
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
            <div className="flex items-center justify-between mb-4"><div className="font-black text-lg text-[var(--text)]">{t("detailStatus", lang)}</div><LampsRow m={d.migration} isAccessory={isAccessory} /></div>
            {isAccessory ? (
              <div className="text-sm text-[var(--muted)] text-center py-2">{t("accessoryNoLamp", lang)}</div>
            ) : mode === "after" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--panel)] p-4 rounded-xl shadow-inner">
                <div className="flex items-center justify-between px-2"><span>Racked</span><Switch on={d.migration.racked} onChange={v=>setFlag(d.id,{racked:v})} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between px-2"><span>Cabled</span><Switch on={d.migration.cabled} onChange={v=>setFlag(d.id,{cabled:v})} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between px-2"><span>Powered</span><Switch on={d.migration.powered} onChange={v=>setFlag(d.id,{powered:v})} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between px-2"><span>Tested</span><Switch on={d.migration.tested} onChange={v=>setFlag(d.id,{tested:v})} disabled={!canToggleFlags(role)} /></div>
              </div>
            ) : (
              <div className="text-sm text-[var(--muted)] text-center py-2">{t("onlyAfterToggle", lang)}</div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border)] bg-[var(--panel2)] rounded-b-3xl flex justify-between items-center">
          {allowLayout ? (
            <button onClick={() => { if (confirm("確定要清除此設備的位置嗎？")) clearPlacement(mode, d.id); onClose(); }} className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 text-sm font-bold text-[var(--text)] transition-all">
              {t("btnClearPlace", lang)}
            </button>
          ) : (
            <div className="text-xs font-bold text-[var(--muted)]">{role === "cable" ? "Cable" : "Vendor"}：{t("cantLayout", lang)}</div>
          )}
          <div className="flex gap-3 ml-auto">
            {allowEditPort && isModified && <button onClick={saveChanges} className="bg-[var(--accent)] text-black px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"><Save size={18}/> {t("btnSaveChanges", lang)}</button>}
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-[var(--text)] text-[var(--bg)] font-black hover:opacity-90 transition-opacity">{t("btnClose", lang)}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* -----------------------------
  新增/編輯 設備視窗 (DeviceModal)
----------------------------- */
function DeviceModal({ title, deviceId, initial, onClose, onSave }: { title: string; deviceId?: string | null; initial: DeviceDraft; onClose: () => void; onSave: (d: DeviceDraft) => void; }) {
  const lang = useStore((s) => s.lang);
  const devices = useStore((s) => s.devices);
  const accOptions = getAccessoryOptions(lang);
  const isAcc = initial.category === "Accessory";
  const [d, setD] = useState<DeviceDraft>({ ...initial, connections: initial.connections || [] });
  const input = (k: keyof DeviceDraft) => (e: any) => setD((p) => ({ ...p, [k]: e.target.value } as any));

  const [localConns, setLocalConns] = useState<Connection[]>(d.connections);

  const [originalIncoming] = useState<{sourceDevId: string, conn: Connection}[]>(() => {
    if (isAcc || !deviceId) return [];
    const inc: { sourceDevId: string, conn: Connection }[] = [];
    devices.forEach(dev => {
      if (dev.id === deviceId) return;
      (dev.connections || []).forEach(c => {
        if (c.targetId === deviceId) inc.push({ sourceDevId: dev.id, conn: c });
      });
    });
    return inc;
  });
  const [incomingConns, setIncomingConns] = useState([...originalIncoming]);
  const [deletedIncoming, setDeletedIncoming] = useState<string[]>([]);

  const handleAccSelect = (e: React.ChangeEvent<HTMLSelectElement>) => { const val = e.target.value; let autoU = 1; if (val.includes("2U")) autoU = 2; setD(p => ({ ...p, name: val, sizeU: autoU })); };

  const addConn = () => setLocalConns(p => [...p, { id: crypto.randomUUID(), localPort: '', targetId: '', targetPort: '' }]);
  const updateConn = (i: number, k: keyof Connection, v: string) => { const next = [...localConns]; next[i] = { ...next[i], [k]: v }; setLocalConns(next); };
  const removeConn = (i: number) => { const next = [...localConns]; next.splice(i, 1); setLocalConns(next); };

  const updateIncoming = (i: number, k: keyof Connection, v: string) => { const next = [...incomingConns]; next[i] = { ...next[i], conn: { ...next[i].conn, [k]: v } }; setIncomingConns(next); };
  const removeIncoming = (i: number) => { const removed = incomingConns[i]; setDeletedIncoming(p => [...p, removed.conn.id]); const next = [...incomingConns]; next.splice(i, 1); setIncomingConns(next); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalD = { ...d };
    if (d.category === "Accessory") {
      if (!finalD.name) finalD.name = accOptions[0];
      if (!finalD.deviceId) finalD.deviceId = `ACC-${Math.floor(Math.random() * 9000) + 1000}`;
    } else {
      if (!finalD.deviceId.trim() || !finalD.name.trim()) return alert("ID and Name are required.");
    }
    
    onSave({ ...finalD, ports: Number(finalD.ports) || 0, sizeU: Math.max(1, Math.min(42, Number(finalD.sizeU) || 1)), portMap: (finalD.portMap ?? "").trimEnd(), connections: localConns });

    if (!isAcc && deviceId) {
      incomingConns.forEach(inc => {
        const sourceDev = useStore.getState().devices.find(x => x.id === inc.sourceDevId);
        if (sourceDev) {
          const newConns = sourceDev.connections.map(sc => sc.id === inc.conn.id ? inc.conn : sc);
          if (JSON.stringify(sourceDev.connections) !== JSON.stringify(newConns)) {
            useStore.getState().updateDevice(sourceDev.id, { connections: newConns });
          }
        }
      });
      deletedIncoming.forEach(connId => {
        const sourceDev = useStore.getState().devices.find(x => x.connections.some(c => c.id === connId));
        if (sourceDev) {
          useStore.getState().updateDevice(sourceDev.id, { connections: sourceDev.connections.filter(c => c.id !== connId) });
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-5 md:p-6 border-b border-[var(--border)] shrink-0 flex items-center justify-between gap-3 bg-[var(--panel2)] rounded-t-3xl">
          <div className="text-xl font-black text-[var(--text)]">{title}</div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-5 md:p-6 flex-1 overflow-y-auto">
          <form id="device-form" className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("fCat", lang)}</label>
              <select className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={d.category} onChange={input("category") as any}>
                {(["Network", "Storage", "Server", "Accessory", "Other"] as DeviceCategory[]).map((x) => (<option key={x} value={x}>{x}</option>))}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("fName", lang)}</label>
              {d.category === "Accessory" ? (
                <select className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={d.name} onChange={handleAccSelect}>
                  <option value="" disabled>Select...</option>
                  {accOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  {d.name && !accOptions.includes(d.name) && <option value={d.name}>{d.name} (Custom)</option>}
                </select>
              ) : (
                <input className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={d.name} onChange={input("name")} />
              )}
            </div>

            {d.category !== "Accessory" && (
              <>
                <div><label className="text-xs font-bold text-[var(--muted)] ml-1">{t("fId", lang)}</label><input className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={d.deviceId} onChange={input("deviceId")} placeholder="SW-01" /></div>
                <div><label className="text-xs font-bold text-[var(--muted)] ml-1">{t("fBrand", lang)}</label><input className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none text-[var(--text)]" value={d.brand} onChange={input("brand")} /></div>
                <div><label className="text-xs font-bold text-[var(--muted)] ml-1">{t("fModel", lang)}</label><input className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none text-[var(--text)]" value={d.model} onChange={input("model")} /></div>
                <div><label className="text-xs font-bold text-[var(--muted)] ml-1">{t("fPorts", lang)}</label><input type="number" min={0} className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none text-[var(--text)]" value={d.ports} onChange={(e) => setD((p) => ({ ...p, ports: Number(e.target.value) || 0 }))} /></div>
              </>
            )}

            <div><label className="text-xs font-bold text-[var(--muted)] ml-1">{t("fU", lang)}</label><input type="number" min={1} max={42} className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none text-[var(--text)]" value={d.sizeU} onChange={(e) => setD((p) => ({ ...p, sizeU: Number(e.target.value) || 1 }))} /></div>
            
            {d.category !== "Accessory" && (
              <>
                <div><label className="text-xs font-bold text-[var(--muted)] ml-1">{t("fIp", lang)}</label><input className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none text-[var(--text)]" value={d.ip ?? ""} onChange={input("ip")} placeholder="10.0.0.10" /></div>
                <div className="md:col-span-2"><label className="text-xs font-bold text-[var(--muted)] ml-1">{t("fSn", lang)}</label><input className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none text-[var(--text)]" value={d.serial ?? ""} onChange={input("serial")} /></div>
              </>
            )}
            
            {d.category !== "Accessory" && (
              <div className="md:col-span-2 mt-2 p-5 bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-black text-[var(--text)] flex items-center gap-2"><Link2 size={18} className="text-[var(--accent)]" /> {t("cableRouting", lang)}</label>
                  <button type="button" onClick={addConn} className="text-xs bg-[var(--accent)] text-black px-4 py-2 rounded-xl font-black hover:opacity-90 flex items-center gap-1 active:scale-95 transition-transform"><Plus size={14} /> {t("addConnection", lang)}</button>
                </div>
                {(localConns.length === 0 && incomingConns.length === 0) ? (
                  <div className="text-sm text-[var(--muted)] italic text-center py-4">無連線記錄</div>
                ) : (
                  <div className="space-y-3">
                    {localConns.map((c, i) => (
                      <div key={c.id} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-[var(--panel2)] p-3 rounded-xl border border-[var(--border)] shadow-inner">
                        <div className="text-[11px] font-black bg-[var(--accent)]/20 text-[var(--accent)] px-3 py-1.5 rounded-lg border border-[var(--accent)]/30 whitespace-nowrap">{t("outgoingConn", lang)}</div>
                        <input value={c.localPort} onChange={e => updateConn(i, 'localPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--accent)] text-sm p-1.5 outline-none text-[var(--text)] transition-colors" placeholder="Local Port" />
                        <span className="text-[var(--muted)] font-black hidden md:block">{'->'}</span>
                        <select value={c.targetId} onChange={e => updateConn(i, 'targetId', e.target.value)} className="flex-1 w-full md:w-0 bg-[var(--panel)] border border-[var(--border)] rounded-xl text-sm p-2 outline-none text-[var(--text)] focus:border-[var(--accent)] shadow-sm">
                          <option value="">{t("selectDevice", lang)}</option>
                          {devices.filter(x => x.id !== deviceId && x.category !== "Accessory").map(x => <option key={x.id} value={x.id}>{x.deviceId} - {x.name}</option>)}
                        </select>
                        <input value={c.targetPort} onChange={e => updateConn(i, 'targetPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--accent)] text-sm p-1.5 outline-none text-[var(--text)] transition-colors" placeholder="Target Port" />
                        <button type="button" onClick={() => removeConn(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl w-full md:w-auto flex justify-center transition-colors"><X size={18}/></button>
                      </div>
                    ))}
                    {incomingConns.map((inc, i) => {
                      const sourceDev = devices.find(x => x.id === inc.sourceDevId);
                      return (
                        <div key={inc.conn.id} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-[var(--panel2)] p-3 rounded-xl border border-[var(--border)] shadow-inner">
                          <div className="text-[11px] font-black bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 whitespace-nowrap">{t("incomingConn", lang)}</div>
                          <input value={inc.conn.targetPort} onChange={e => updateIncoming(i, 'targetPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--accent)] text-sm p-1.5 outline-none text-[var(--text)] transition-colors" placeholder="Local Port" />
                          <span className="text-[var(--muted)] font-black hidden md:block">{'<-'}</span>
                          <div className="flex-1 w-full md:w-0 bg-[var(--panel)] border border-[var(--border)] rounded-xl text-sm font-bold p-2 text-[var(--text)] truncate shadow-sm">
                            {sourceDev?.deviceId} - {sourceDev?.name}
                          </div>
                          <input value={inc.conn.localPort} onChange={e => updateIncoming(i, 'localPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--accent)] text-sm p-1.5 outline-none text-[var(--text)] transition-colors" placeholder="Source Port" />
                          <button type="button" onClick={() => removeIncoming(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl w-full md:w-auto flex justify-center transition-colors"><X size={18}/></button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("fNote", lang)}</label>
              <textarea className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)] resize-none" rows={3} value={d.portMap ?? ""} onChange={(e) => { setD((p) => ({ ...p, portMap: e.target.value })); }} />
            </div>
          </form>
        </div>

        <div className="p-5 md:p-6 border-t border-[var(--border)] bg-[var(--panel2)] rounded-b-3xl flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--text)] font-bold transition-colors">{t("btnCancel", lang)}</button>
          <button type="submit" form="device-form" className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 shadow-lg active:scale-95 transition-transform">{t("btnSave", lang)}</button>
        </div>
      </motion.div>
    </div>
  );
}

/* -----------------------------
  匯入視窗 (CSV Modal)
----------------------------- */
function FullCSVImportModal({ onClose }: { onClose: () => void }) {
  const importFullCSV = useStore((s) => s.importFullCSV);
  const lang = useStore((s) => s.lang);
  const [drag, setDrag] = useState(false);
  const handleFile = async (file: File) => { const text = await file.text(); const res = importFullCSV(text); if (!res.ok) alert(res.message); else onClose(); };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
        <div className="p-6 shrink-0 border-b border-[var(--border)] bg-[var(--panel2)] rounded-t-3xl">
          <div className="flex items-center justify-between"><div className="text-xl font-black text-[var(--text)]">{t("importCsv", lang)}</div><button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={20}/></button></div>
          <div className="mt-3 text-sm font-bold text-red-500 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">{t("warningImport", lang)}</div>
          <div className="mt-5 flex gap-2 flex-wrap"><button onClick={downloadFullCSVTemplate} className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] hover:bg-white/5 flex items-center gap-2 text-sm font-bold shadow-sm transition-colors"><Download size={16} /> {t("template", lang)}</button></div>
        </div>
        <div className="p-8 flex-1 overflow-y-auto">
          <label onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDrag(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }} className={`block w-full rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${drag ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.02]" : "border-[var(--border)] bg-[var(--panel2)] hover:bg-white/5"}`}>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-black bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] shadow-lg"><Upload size={28} /></div>
              <div className="font-black text-lg text-[var(--text)]">{t("dragHere", lang)}</div><div className="text-sm font-bold text-[var(--muted)]">{t("orClick", lang)}</div>
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
  const handleFile = async (file: File) => { const text = await file.text(); const res = appendDevicesFromCSV(text); if (!res.ok) alert(res.message); else onClose(); };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
        <div className="p-6 shrink-0 border-b border-[var(--border)] bg-[var(--panel2)] rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="text-xl font-black flex items-center gap-2 text-[var(--accent)]"><FilePlus size={24} /> {t("appendCsv", lang)}</div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={20}/></button>
          </div>
          <div className="mt-3 text-sm font-bold text-[var(--text)] bg-[var(--panel)] px-3 py-2 rounded-lg border border-[var(--border)] shadow-sm">{t("warningAppend", lang)}</div>
          <div className="mt-5 flex gap-2 flex-wrap">
            <button onClick={downloadFullCSVTemplate} className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] hover:bg-white/5 flex items-center gap-2 text-sm font-bold shadow-sm transition-colors"><Download size={16} /> {t("template", lang)}</button>
          </div>
        </div>
        <div className="p-8 flex-1 overflow-y-auto">
          <label onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDrag(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }} className={`block w-full rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${drag ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.02]" : "border-[var(--border)] bg-[var(--panel2)] hover:bg-white/5"}`}>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-black bg-gradient-to-br from-green-400 to-[var(--accent)] shadow-lg"><Plus size={32} /></div>
              <div className="font-black text-lg text-[var(--text)]">{t("dragHere", lang)}</div><div className="text-sm font-bold text-[var(--muted)]">{t("orClick", lang)}</div>
            </div>
          </label>
        </div>
      </motion.div>
    </div>
  );
}

/* -----------------------------
  設備資產清單 (DevicesPage)
----------------------------- */
type SortKey = "category" | "deviceId" | "name" | "brand" | "model" | "ports" | "sizeU" | "before" | "after" | "migration" | "complete";
type SortDir = "asc" | "desc";

const DevicesPage = () => {
  const devices = useStore((s) => s.devices);
  const deleteDeviceById = useStore((s) => s.deleteDeviceById);
  const addDevice = useStore((s) => s.addDevice);
  const updateDevice = useStore((s) => s.updateDevice);
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
    const getBefore = (d: Device) => d.beforeRackId && d.beforeStartU != null ? `${getRackName(d.beforeRackId, lang)}-${String(d.beforeStartU).padStart(2,'0')}` : "";
    const getAfter = (d: Device) => d.afterRackId && d.afterStartU != null ? `${getRackName(d.afterRackId, lang)}-${String(d.afterStartU).padStart(2,'0')}` : "";
    const getMigScore = (d: Device) => (d.migration.racked ? 1 : 0) + (d.migration.cabled ? 1 : 0) + (d.migration.powered ? 1 : 0) + (d.migration.tested ? 1 : 0);
    
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
        case "complete": va = isMigratedComplete(a.migration) ? 1 : 0; vb = isMigratedComplete(b.migration) ? 1 : 0; break;
        default: va = a.deviceId; vb = b.deviceId;
      }
      const c = cmp(va, vb); return sortDir === "asc" ? c : -c;
    });
  }, [devices, sortKey, sortDir, lang]);

  const Th = ({ k, children, right }: { k: SortKey | "action" | "connections", children: React.ReactNode; right?: boolean; }) => (
    <th className={`px-4 py-4 font-bold tracking-wider ${right ? "text-right" : ""}`}>
      {k === "action" || k === "connections" ? (
        <span className="whitespace-nowrap">{children}</span>
      ) : (
        <button onClick={() => sortToggle(k)} className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] whitespace-nowrap transition-colors" title="Sort">
          {children} <span className="text-[10px] text-[var(--accent)]">{sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
        </button>
      )}
    </th>
  );

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-wrap gap-4 justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-[var(--accent)] flex items-center gap-3"><Server size={28} /> {t("deviceList", lang)}</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => downloadCableLabelsCSV(devices, lang)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent2)] hover:border-[var(--accent2)] hover:text-black transition-all flex items-center gap-2 text-sm font-bold bg-[var(--panel)] shadow-sm"><Link2 size={16} /> {t("exportLabels", lang)}</button>
          <button onClick={() => canExportCSV(role) && downloadFullCSV(devices)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-black transition-all flex items-center gap-2 text-sm font-bold bg-[var(--panel)] shadow-sm"><Download size={16} /> {t("exportCsv", lang)}</button>

          {allowManage && (
            <>
              <button onClick={() => setAppendOpen(true)} className="px-4 py-2.5 rounded-xl border-2 border-dashed border-[var(--accent2)] text-[var(--accent2)] hover:bg-[var(--accent2)]/10 flex items-center gap-2 text-sm font-bold transition-colors">
                <FilePlus size={16} /> {t("appendCsv", lang)}
              </button>
              <button onClick={() => setImportOpen(true)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel2)] text-[var(--muted)] hover:text-red-500 hover:border-red-500/50 flex items-center gap-2 text-xs font-bold transition-colors">
                <Upload size={14} /> {t("importCsv", lang)}
              </button>
              <button onClick={() => setIsAdding(true)} className="bg-[var(--accent)] text-black px-5 py-2.5 rounded-xl text-sm font-extrabold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-[var(--accent)]/20 transition-transform active:scale-95">
                <Plus size={18} /> {t("addDevice", lang)}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl overflow-hidden overflow-x-auto shadow-2xl flex-1 flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left relative">
            <thead className="bg-[var(--panel2)] text-[var(--muted)] text-xs uppercase tracking-wider sticky top-0 z-20 shadow-sm">
              <tr>
                <Th k="category">{t("cat", lang)}</Th><Th k="deviceId">{t("devId", lang)}</Th><Th k="name">{t("name", lang)}</Th><Th k="brand">{t("brand", lang)}</Th>
                <Th k="model">{t("model", lang)}</Th><Th k="ports">{t("ports", lang)}</Th><Th k="sizeU">{t("sizeU", lang)}</Th>
                <Th k="connections">🔗</Th>
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
                
                // 動態計算所有連線數 (Outbound + Inbound)
                const outboundCount = d.connections?.length || 0;
                const inboundCount = devices.filter(dev => dev.id !== d.id && dev.connections.some(c => c.targetId === d.id)).reduce((acc, dev) => acc + dev.connections.filter(c => c.targetId === d.id).length, 0);
                const connCount = outboundCount + inboundCount;

                return (
                  <tr key={d.id} className="hover:bg-white/[0.03] transition-colors group text-[var(--text)]">
                    <td className="px-4 py-4 whitespace-nowrap"><span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md border tracking-wider" style={{ color: "white", borderColor: "rgba(255,255,255,0.2)", backgroundColor: catColor(d.category) }}>{d.category}</span></td>
                    <td className="px-4 py-4 whitespace-nowrap"><div className="font-black text-sm tracking-wide">{isAcc ? "-" : d.deviceId}</div></td>
                    <td className="px-4 py-4 whitespace-nowrap"><button onClick={() => setSelectedDeviceId(d.id)} className="text-sm font-black text-[var(--text)] hover:text-[var(--accent)] transition-colors" title="View Detail">{d.name}</button></td>
                    <td className="px-4 py-4 text-xs whitespace-nowrap font-medium">{isAcc ? "-" : d.brand}</td>
                    <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap">{isAcc ? "-" : d.model}</td>
                    <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap font-mono">{isAcc ? "-" : d.ports}</td>
                    <td className="px-4 py-4 text-xs font-black text-[var(--accent)] whitespace-nowrap">{d.sizeU}U</td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      {connCount > 0 ? (
                         <span className="text-[10px] font-black px-2 py-1 rounded-lg border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10 shadow-sm">🔗 {connCount}</span>
                      ) : <span className="text-xs text-[var(--muted)] opacity-50">-</span>}
                    </td>

                    <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap font-medium">{before}</td>
                    <td className="px-4 py-4 text-xs text-[var(--muted)] whitespace-nowrap font-medium">{after}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{isAcc ? <span className="text-[10px] text-[var(--muted)] opacity-50">-</span> : <LampsRow m={d.migration} />}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {isAcc ? (
                        <span className="text-[10px] text-[var(--muted)] opacity-50">-</span>
                      ) : (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-md border tracking-wider" style={{ borderColor: done ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)", color: done ? "#22c55e" : "#ef4444", background: done ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                          {done ? t("statusDone", lang) : t("statusUndone", lang)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      {allowManage ? (
                        <div className="flex justify-end gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditing(d)} className="p-2 hover:bg-white/10 rounded-xl text-[var(--accent)] transition-colors"><Edit3 size={16} /></button>
                          <button onClick={() => { clearPlacement("before", d.id); clearPlacement("after", d.id); }} className="px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] text-xs font-bold hover:bg-white/5 transition-colors">{t("btnClear", lang)}</button>
                          <button onClick={() => { if (confirm(`Delete ${d.deviceId || d.name}?`)) deleteDeviceById(d.id); }} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-[var(--muted)] transition-colors"><Trash2 size={16} /></button>
                        </div>
                      ) : (<div className="text-xs text-[var(--muted)]">-</div>)}
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-6 py-20 text-center text-[var(--muted)]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Server size={48} className="opacity-20" />
                      <span className="font-bold">{t("noDevices", lang)}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {importOpen && <FullCSVImportModal onClose={() => setImportOpen(false)} />}
      {appendOpen && <AppendCSVImportModal onClose={() => setAppendOpen(false)} />}
      {isAdding && (<DeviceModal title={t("addDeviceTitle", lang)} initial={{ category: "Other", deviceId: "", name: "", brand: "", model: "", ports: 8, sizeU: 1, ip: "", serial: "", portMap: "", connections: [] }} onClose={() => setIsAdding(false)} onSave={(d) => { addDevice(d); setIsAdding(false); }} />)}
      {editing && (<DeviceModal title={t("editDeviceTitle", lang)} deviceId={editing.id} initial={{ category: editing.category, deviceId: editing.deviceId, name: editing.name, brand: editing.brand, model: editing.model, ports: editing.ports, sizeU: editing.sizeU, ip: editing.ip ?? "", serial: editing.serial ?? "", portMap: editing.portMap ?? "", connections: editing.connections ?? [] }} onClose={() => setEditing(null)} onSave={(d) => { updateDevice(editing.id, d); setEditing(null); }} />)}
    </div>
  );
};

/* -----------------------------
  Admin Page（帳號管理）
----------------------------- */
const AdminPage = () => {
  const role = useStore((s) => s.role);
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
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col">
          <div className="p-5 md:p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--panel2)] rounded-t-3xl">
            <div className="text-xl font-black flex items-center gap-2 text-[var(--text)]"><KeyRound className="text-[var(--accent)]" /> {title}</div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={20}/></button>
          </div>
          
          <div className="p-5 md:p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("account", lang)}</label>
              <input className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)] transition-colors" value={a.username} onChange={(e) => setA((p) => ({ ...p, username: e.target.value }))} disabled={!creating} />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("role", lang)}</label>
              <select className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)] transition-colors" value={a.role} onChange={(e) => setA((p) => ({ ...p, role: e.target.value as Role }))} disabled={isAdminAccount}>
                <option value="admin">Admin (管理員)</option>
                <option value="cable">Cable (佈線廠商)</option>
                <option value="vendor">Vendor (設備/物流廠商)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--muted)] ml-1">{t("password", lang)}</label>
              <input type="password" className="mt-1.5 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)] transition-colors" value={a.password} onChange={(e) => setA((p) => ({ ...p, password: e.target.value }))} />
            </div>
          </div>
          
          <div className="p-5 md:p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--panel2)] rounded-b-3xl">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--text)] font-bold transition-colors">{t("btnCancel", lang)}</button>
            <button onClick={() => { const res = upsertAccount(a); if (!res.ok) return alert("Account Error"); onClose(); }} className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20 active:scale-95 transition-transform"><Save size={16} /> {t("btnSave", lang)}</button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3"><Shield size={28} className="text-[var(--accent)]" /><h2 className="text-2xl font-black text-[var(--text)]">{t("navAdmin", lang)}</h2></div>
          <button onClick={() => { setCreating(true); setEditing({ username: "", password: "", role: "vendor" }); }} className="bg-[var(--accent)] text-black px-5 py-2.5 rounded-xl text-sm font-extrabold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-[var(--accent)]/20 active:scale-95 transition-transform"><Plus size={18} /> {t("addAccount", lang)}</button>
        </div>
        
        <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-inner">
          <table className="w-full text-left">
            <thead className="bg-black/10 text-[var(--muted)] text-xs uppercase tracking-wider border-b border-[var(--border)]">
              <tr><th className="px-5 py-4 font-bold">{t("account", lang)}</th><th className="px-5 py-4 font-bold">{t("role", lang)}</th><th className="px-5 py-4 font-bold text-right">{t("action", lang)}</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {accounts.slice().sort((a, b) => a.username === "admin" ? -1 : b.username === "admin" ? 1 : a.username.localeCompare(b.username)).map((a) => (
                <tr key={a.username} className="hover:bg-[var(--panel)] transition-colors group">
                  <td className="px-5 py-4"><div className="font-black text-[var(--text)] text-lg flex items-center gap-2"><User size={16} className="text-[var(--muted)]" />{a.username}</div></td>
                  <td className="px-5 py-4"><span className="text-xs font-bold px-3 py-1 rounded-md border border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] uppercase tracking-wider">{a.role}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setCreating(false); setEditing(a); }} className="p-2 rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--panel)] text-[var(--accent)] transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => { const res = deleteAccount(a.username); if (!res.ok) return alert(res.message); }} disabled={a.username === "admin"} className={`p-2 rounded-xl border border-transparent transition-colors ${a.username === "admin" ? "opacity-30 cursor-not-allowed text-[var(--muted)]" : "hover:border-red-500/30 hover:bg-red-500/10 text-red-500"}`}><Trash2 size={18} /></button>
                    </div>
                  </td>
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
  ★ 應用程式主入口 (App) - 終極防護版
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

  // ★ 核心初始化：最嚴格的防禦性渲染 (Defensive Rendering) 杜絕白畫面
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "migratePro", "mainState"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // 強制檢查並賦予陣列或物件預設值，防止 .map() 或 .filter() 報錯
        useStore.setState({
          devices: normalizeDevices(data.devices || []),
          accounts: Array.isArray(data.accounts) ? data.accounts : loadAccounts(),
          issues: Array.isArray(data.issues) ? data.issues : [],
          tasks: Array.isArray(data.tasks) ? data.tasks : [],
          projectInfo: typeof data.projectInfo === 'object' && data.projectInfo !== null 
            ? data.projectInfo 
            : { startDate: getTimestamp().slice(0, 10), days: 3 }
        });
      } else {
        // 如果雲端無資料，強制寫入當前 Store 的預設結構
        const s = useStore.getState();
        syncToCloudFull({ 
          devices: s.devices, 
          accounts: s.accounts, 
          issues: s.issues, 
          tasks: s.tasks, 
          projectInfo: s.projectInfo 
        });
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
  const themeStyle = useStore(s => s.themeStyle);
  const setThemeStyle = useStore(s => s.setThemeStyle);
  const lang = useStore(s => s.lang);
  const setLang = useStore(s => s.setLang);
  const ui = useStore(s => s.ui);
  const setUi = useStore(s => s.setUi);
  const selectedDeviceId = useStore(s => s.selectedDeviceId);
  const setSelectedDeviceId = useStore(s => s.setSelectedDeviceId);
  const { isFs, toggle: toggleFs } = useFullscreen();

  if (!isAuthed) return <LoginPage />;

  // 左側導覽列定義
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

      {/* 頂部導覽列 Header */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--panel)]/90 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-black bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] shadow-lg shadow-[var(--accent)]/20"><Server size={18} /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Migrate<span className="text-[var(--accent)]">Pro</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleFs} className="p-2 hover:bg-white/10 rounded-xl transition-colors">{isFs ? <Minimize size={18} /> : <Expand size={18} />}</button>
          <button onClick={() => setLang(lang === 'zh' ? 'en' : lang === 'en' ? 'ko' : 'zh')} className="text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-[var(--panel2)] border border-[var(--border)] uppercase hover:bg-white/5 transition-colors">{lang}</button>
          
          <select value={themeStyle} onChange={(e) => setThemeStyle(e.target.value as ThemeStyle)} className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-xs font-bold px-3 py-1.5 outline-none hidden md:block text-[var(--text)] shadow-sm">
            <option value="neon">Neon</option><option value="horizon">Horizon</option><option value="nebula">Nebula</option><option value="matrix">Matrix</option>
          </select>
          
          <button onClick={toggleTheme} className="p-2 hover:bg-white/10 rounded-xl transition-colors">{theme === "dark" ? "🌙" : "☀️"}</button>
          
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel2)] shadow-inner">
            <span className="text-sm font-black tracking-wide">{userName}</span>
            <span className="text-[9px] font-black bg-black/10 px-2 py-0.5 rounded border border-[var(--border)] uppercase">{role}</span>
            <button onClick={logout} className="ml-1 p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"><LogOut size={16} /></button>
          </div>
          <button onClick={logout} className="md:hidden p-2 hover:bg-white/10 rounded-xl text-red-500 transition-colors"><LogOut size={18} /></button>
        </div>
      </header>

      {/* 主體佈局 Layout */}
      <div className="flex flex-1 min-h-0">
        
        {/* 左側選單 Sidebar */}
        <nav className={`border-r border-[var(--border)] h-[calc(100vh-64px)] sticky top-16 p-4 bg-[var(--panel)] hidden lg:flex flex-col transition-all duration-300 ${ui.sideCollapsed ? "w-20" : "w-64"} shrink-0`}>
           <div className="flex justify-end mb-4"><button onClick={() => setUi({ sideCollapsed: !ui.sideCollapsed })} className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] transition-colors bg-[var(--panel2)]">{ui.sideCollapsed ? <ChevronsRight size={18}/> : <ChevronsLeft size={18}/>}</button></div>
           <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setPage(item.id as PageKey)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${page === item.id ? "bg-[var(--accent)] text-black shadow-[0_5px_15px_rgba(34,211,238,0.3)] font-black scale-[1.02]" : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)] font-bold"}`}>
                {item.icon} {!ui.sideCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>
        
        {/* 內容主視圖 Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg)] relative">
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="min-h-full pb-24 lg:pb-6">
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

      {/* 手機版底部導覽 Bottom Nav */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--panel)]/95 backdrop-blur-xl border border-[var(--border)] rounded-full px-3 py-2.5 flex gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-50 overflow-x-auto max-w-[95vw] scrollbar-hide">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setPage(item.id as PageKey)} className={`p-3.5 rounded-full transition-all shrink-0 ${page === item.id ? "text-black bg-[var(--accent)] shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-110" : "text-[var(--muted)] hover:bg-[var(--panel2)]"}`}>
            {item.icon}
          </button>
        ))}
      </div>

      {/* 全域懸浮：設備詳細 Modal */}
      {selectedDeviceId && <DeviceDetailModal id={selectedDeviceId} mode={page === "after" ? "after" : "before"} onClose={() => setSelectedDeviceId(null)} />}
    </div>
  );
}

// ==========================================
// --- Part 5 結束 (無損終極版組裝完成！) ---
// ==========================================