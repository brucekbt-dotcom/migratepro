import React, { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Server, ArrowLeftRight, ArrowRightLeft, Plus, Download, Trash2, Edit3, X,
  ChevronsLeft, ChevronsRight, PanelRightClose, PanelRightOpen, LogOut, User, Upload, Expand,
  Minimize, Shield, KeyRound, Save, Sparkles, FilePlus, Network, Globe, Link2, MessageSquare,
  AlertCircle, CheckCircle2, BookOpen, CalendarClock, Play, Check, Tv
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

/* ==========================================
   Firebase Configuration
========================================== */
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
   Types & Models
========================================== */
type ThemeMode = "dark" | "light";
type ThemeStyle = "neon" | "horizon" | "nebula" | "matrix";
type PageKey = "dashboard" | "devices" | "before" | "after" | "runbook" | "issues" | "guide" | "admin";
type DeviceCategory = "Network" | "Storage" | "Server" | "Accessory" | "Other";
type PlacementMode = "before" | "after";
type Role = "admin" | "vendor" | "cable";
type Lang = "zh" | "en" | "ko";

type MigrationFlags = { racked: boolean; cabled: boolean; powered: boolean; tested: boolean; };
type Rack = { id: string; name: string; units: number };
type Connection = { id: string; localPort: string; targetId: string; targetPort: string; };

type Device = {
  id: string; category: DeviceCategory; deviceId: string; name: string; brand: string; model: string; ports: number; sizeU: number; ip?: string; serial?: string; portMap?: string; connections: Connection[];
  beforeRackId?: string; beforeStartU?: number; beforeEndU?: number;
  afterRackId?: string; afterStartU?: number; afterEndU?: number;
  migration: MigrationFlags;
};
type DeviceDraft = Omit<Device, "id" | "beforeRackId" | "beforeStartU" | "beforeEndU" | "afterRackId" | "afterStartU" | "afterEndU" | "migration">;

type IssueReply = { id: string; text: string; author: string; createdAt: number; };
type IssueStatus = "open" | "resolved";
type Issue = { id: string; title: string; description: string; author: string; createdAt: number; status: IssueStatus; replies: IssueReply[]; };

type TaskStatus = "pending" | "in_progress" | "done" | "verified";
type Task = { id: string; title: string; vendor: string; dayIndex: number; startHH: number; endHH: number; status: TaskStatus; };
type ProjectInfo = { startDate: string; days: number; };

type UiState = { sideCollapsed: boolean; unplacedCollapsedBefore: boolean; unplacedCollapsedAfter: boolean; };
type LoginResult = { ok: boolean; message?: string };
type Account = { username: string; password: string; role: Role; };

/* ==========================================
   Constants & Dictionary
========================================== */
const LS = { theme: "migrate.theme", themeStyle: "migrate.themeStyle", devices: "migrate.devices", ui: "migrate.ui", auth: "migrate.auth", user: "migrate.user", accounts: "migrate.accounts", lang: "migrate.lang", issues: "migrate.issues", tasks: "migrate.tasks", projectInfo: "migrate.projInfo" } as const;

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
const getAccessoryOptions = (lang: Lang) => [ t("accCable1U", lang), t("accCable2U", lang), t("accBlank1U", lang), t("accBlank2U", lang), t("accShelf1U", lang), t("accShelf2U", lang), t("accPdu1U", lang), t("accPdu2U", lang), t("accFan1U", lang), t("accKvm1U", lang) ];

const FIXED_COLORS = { Network: "#22c55e", Server: "#3b82f6", Storage: "#8b5cf6", Accessory: "#64748b", Other: "#fb923c" };

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

/* ==========================================
   Utilities
========================================== */
const canManageAssets = (role: Role) => role === "admin";
const canEditPortMap = (role: Role) => role === "admin" || role === "cable";
const canToggleFlags = (_role: Role) => true;
const canExportCSV = (_role: Role) => true;

const clampU = (u: number) => Math.max(1, Math.min(42, u));
const rangesOverlap = (aS: number, aE: number, bS: number, bE: number) => Math.max(aS, bS) <= Math.min(aE, bE);
const isMigratedComplete = (m: MigrationFlags) => m.racked && m.cabled && m.powered && m.tested;

const readJson = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } };
const writeJson = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const syncToCloudFull = async (s: any) => { try { await setDoc(doc(db, "migratePro", "mainState"), JSON.parse(JSON.stringify(s)), { merge: true }); } catch (e) {} };

const getTimestamp = () => { const d = new Date(); const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`; };
const formatDate = (ts: number) => { const d = new Date(ts); const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const formatHH = (hh: number) => `${String(Math.floor(hh/2)).padStart(2,'0')}:${hh%2===0?'00':'30'}`;
const getVendorColor = (name: string) => { const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f43f5e", "#84cc16", "#14b8a6", "#d946ef"]; let hash = 0; for(let i=0; i<name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash); return colors[Math.abs(hash) % colors.length]; };

/* ==========================================
   CSV Utilities
========================================== */
const escapeCSV = (str: string | number | undefined | null) => { if (str == null) return ""; return `"${String(str).replace(/"/g, '""')}"`; };
const CSV_HEADER = "id,category,deviceId,name,brand,model,ports,sizeU,ip,serial,portMap,connections,beforeRackId,beforeStartU,beforeEndU,afterRackId,afterStartU,afterEndU,m_racked,m_cabled,m_powered,m_tested";

const downloadFullCSV = (devices: Device[]) => {
  const rows = devices.map(d => [ d.id, d.category, d.deviceId, d.name, d.brand, d.model, d.ports, d.sizeU, d.ip || "", d.serial || "", d.portMap || "", d.connections ? JSON.stringify(d.connections) : "[]", d.beforeRackId || "", d.beforeStartU || "", d.beforeEndU || "", d.afterRackId || "", d.afterStartU || "", d.afterEndU || "", d.migration.racked ? "1" : "0", d.migration.cabled ? "1" : "0", d.migration.powered ? "1" : "0", d.migration.tested ? "1" : "0" ].map(escapeCSV).join(','));
  const csvContent = "\uFEFF" + [CSV_HEADER, ...rows].join("\n");
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `MigratePro_FullBackup_${getTimestamp()}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const downloadCableLabelsCSV = (devices: Device[], lang: Lang) => {
  const rows: string[] = []; const header = [t("lblSrcDev", lang), t("lblTgtDev", lang), t("lblBefSrc", lang), t("lblBefTgt", lang), t("lblAftSrc", lang), t("lblAftTgt", lang)]; rows.push(header.map(escapeCSV).join(","));
  devices.forEach(d => { if (!d.connections) return; d.connections.forEach(c => { const target = devices.find(x => x.id === c.targetId); if (!target) return; const getRack = (rId: string | undefined) => rId ? getRackName(rId, lang) : "-"; const bSrc = `${getRack(d.beforeRackId)}/${d.beforeStartU||"-"}U/${d.name}/${c.localPort||"-"}`; const bTgt = `${getRack(target.beforeRackId)}/${target.beforeStartU||"-"}U/${target.name}/${c.targetPort||"-"}`; const aSrc = `${getRack(d.afterRackId)}/${d.afterStartU||"-"}U/${d.name}/${c.localPort||"-"}`; const aTgt = `${getRack(target.afterRackId)}/${target.afterStartU||"-"}U/${target.name}/${c.targetPort||"-"}`; rows.push([d.name, target.name, bSrc, bTgt, aSrc, aTgt].map(escapeCSV).join(",")); }); });
  const csvContent = "\uFEFF" + rows.join("\n"); const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `CableLabels_${getTimestamp()}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const downloadFullCSVTemplate = () => { const csvContent = "\uFEFF" + CSV_HEADER + "\n"; const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "MigratePro_Template.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); };
const parseCSV = (str: string): string[][] => { const delimiter = str.includes('\t') && (!str.includes(',') || str.indexOf('\t') < str.indexOf(',')) ? '\t' : ','; const arr: string[][] = []; let quote = false, row = 0, col = 0; for (let c = 0; c < str.length; c++) { let cc = str[c], nc = str[c+1]; arr[row] = arr[row] || []; arr[row][col] = arr[row][col] || ''; if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; } if (cc === '"') { quote = !quote; continue; } if (cc === delimiter && !quote) { ++col; continue; } if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; } if (cc === '\n' && !quote) { ++row; col = 0; continue; } if (cc === '\r' && !quote) { ++row; col = 0; continue; } arr[row][col] += cc; } return arr; };
const backwardCompatRackId = (val: string | undefined): string | undefined => { if (!val) return undefined; if (val.includes("新購設備存放區")) return "BEF_New_Device"; if (val.includes("不搬存放區A")) return "AFT_Unmoved_A"; if (val.includes("不搬存放區B")) return "AFT_Unmoved_B"; if (val.includes("不搬存放區C") || val.includes("搬遷不上架存放區")) return "AFT_Unmoved_C"; if (val.includes("SmartHouse 20F")) return "AFT_SmartHouse_20F"; if (!val.startsWith("BEF_") && !val.startsWith("AFT_")) { if (val === "10" || val === "09" || val.includes("F")) return `BEF_${val}`; if (val.includes("A") || val.includes("B") || val.includes("HUB")) return `AFT_${val}`; } return val; };
const normalizeDevices = (raw: any[]): Device[] => { const arr = Array.isArray(raw) ? raw : []; return arr.map((d: any) => { const sizeU = Math.max(1, Math.min(42, Number(d?.sizeU ?? 1))); let beforeRackId = backwardCompatRackId(d?.beforeRackId); let afterRackId = backwardCompatRackId(d?.afterRackId); let connections = []; try { connections = typeof d?.connections === 'string' ? JSON.parse(d.connections) : (d?.connections || []); } catch(e){} return { id: String(d?.id ?? crypto.randomUUID()), category: (d?.category as DeviceCategory) || "Other", deviceId: String(d?.deviceId ?? ""), name: String(d?.name ?? ""), brand: String(d?.brand ?? ""), model: String(d?.model ?? ""), ports: Number(d?.ports ?? 0), sizeU, ip: String(d?.ip ?? ""), serial: String(d?.serial ?? ""), portMap: String(d?.portMap ?? ""), connections: Array.isArray(connections) ? connections : [], beforeRackId, beforeStartU: d?.beforeStartU ?? undefined, beforeEndU: d?.beforeEndU ?? undefined, afterRackId, afterStartU: d?.afterStartU ?? undefined, afterEndU: d?.afterEndU ?? undefined, migration: { racked: Boolean(d?.migration?.racked ?? false), cabled: Boolean(d?.migration?.cabled ?? false), powered: Boolean(d?.migration?.powered ?? false), tested: Boolean(d?.migration?.tested ?? false) }, } as Device; }); };

/* ==========================================
   Store Definition
========================================== */
interface Store {
  devices: Device[]; issues: Issue[]; tasks: Task[]; projectInfo: ProjectInfo;
  theme: ThemeMode; themeStyle: ThemeStyle; lang: Lang; page: PageKey; selectedDeviceId: string | null; ui: UiState; draggingDevice: Device | null;
  accounts: Account[]; isAuthed: boolean; userName: string | null; role: Role;
  setDraggingDevice: (d: Device | null) => void; upsertAccount: (a: Account) => { ok: boolean; message?: string }; deleteAccount: (username: string) => { ok: boolean; message?: string };
  login: (u: string, p: string) => LoginResult; logout: () => void;
  setPage: (p: PageKey) => void; toggleTheme: () => void; setThemeStyle: (s: ThemeStyle) => void; setLang: (l: Lang) => void; setSelectedDeviceId: (id: string | null) => void; setUi: (patch: Partial<UiState>) => void;
  addDevice: (draft: DeviceDraft) => string; updateDevice: (id: string, patch: Partial<DeviceDraft | {portMap?: string, connections?: Connection[]}>) => void; deleteDeviceById: (id: string) => void;
  importFullCSV: (fileText: string) => { ok: boolean; message?: string }; appendDevicesFromCSV: (fileText: string) => { ok: boolean; message?: string };
  clearPlacement: (mode: PlacementMode, id: string) => void; place: (mode: PlacementMode, deviceId: string, rackId: string, startU: number) => { ok: boolean; message?: string };
  setMigrationFlag: (id: string, patch: Partial<MigrationFlags>) => void; repairRackIds: () => void;
  addIssue: (title: string, desc: string) => void; updateIssueStatus: (id: string, status: IssueStatus) => void; deleteIssue: (id: string) => void; addIssueReply: (id: string, text: string) => void;
  updateProjectInfo: (info: ProjectInfo) => void; addTask: (task: Omit<Task, "id"|"status">) => void; updateTaskStatus: (id: string, status: TaskStatus) => void; deleteTask: (id: string) => void;
}

function loadAccounts(): Account[] { const v = readJson<Account[]>(LS.accounts, []); if (!Array.isArray(v) || v.length === 0) { const d = [{ username: "admin", password: "123", role: "admin" as Role }]; writeJson(LS.accounts, d); return d; } const a = v.some((x) => x.username === "admin") ? v : [{ username: "admin", password: "123", role: "admin" as Role }, ...v]; return a.map(x => x.username === "admin" ? {...x, role: "admin"} : x); }

const useStore = create<Store>((set, get) => ({
  devices: normalizeDevices(readJson<Device[]>(LS.devices, [])), issues: readJson<Issue[]>(LS.issues, []), tasks: readJson<Task[]>(LS.tasks, []), projectInfo: readJson<ProjectInfo>(LS.projectInfo, { startDate: getTimestamp().slice(0,10), days: 3 }),
  theme: (localStorage.getItem(LS.theme) as ThemeMode) || "dark", themeStyle: (localStorage.getItem(LS.themeStyle) as ThemeStyle) || "neon", lang: (localStorage.getItem(LS.lang) as Lang) || "zh", page: "dashboard", selectedDeviceId: null, ui: { sideCollapsed: false, unplacedCollapsedBefore: false, unplacedCollapsedAfter: false, ...readJson<UiState>(LS.ui, {} as UiState) }, draggingDevice: null, accounts: loadAccounts(),
  isAuthed: localStorage.getItem(LS.auth) === "1", userName: localStorage.getItem(LS.user) || null, role: (() => { const u = localStorage.getItem(LS.user); if (u === "admin") return "admin"; return loadAccounts().find((a) => a.username === u)?.role ?? "vendor"; })(),
  
  setDraggingDevice: (d) => set({ draggingDevice: d }),
  upsertAccount: (a) => { const username = a.username.trim(); if (!username || username.includes(" ") || !a.password) return { ok: false }; const next = get().accounts.some((x) => x.username === username) ? get().accounts.map((x) => (x.username === username ? { ...a, username } : x)) : [...get().accounts, { ...a, username }]; writeJson(LS.accounts, next); syncToCloudFull({ accounts: next }); set({ accounts: next }); return { ok: true }; },
  deleteAccount: (username) => { if (username === "admin") return { ok: false }; const next = get().accounts.filter((a) => a.username !== username); writeJson(LS.accounts, next); syncToCloudFull({ accounts: next }); set({ accounts: next }); return { ok: true }; },
  login: (u, p) => { const f = get().accounts.find((a) => a.username === u.trim() && a.password === p); if (!f) return { ok: false }; localStorage.setItem(LS.auth, "1"); localStorage.setItem(LS.user, u.trim()); set({ isAuthed: true, userName: u.trim(), role: f.role, page: "dashboard", selectedDeviceId: null }); return { ok: true }; },
  logout: () => { localStorage.removeItem(LS.auth); localStorage.removeItem(LS.user); set({ isAuthed: false, userName: null, role: "vendor", page: "dashboard", selectedDeviceId: null }); },
  setPage: (page) => set({ page }), toggleTheme: () => set((s) => { const next = s.theme === "dark" ? "light" : "dark"; localStorage.setItem(LS.theme, next); return { theme: next }; }), setThemeStyle: (themeStyle) => { localStorage.setItem(LS.themeStyle, themeStyle); set({ themeStyle }); }, setLang: (lang) => { localStorage.setItem(LS.lang, lang); set({ lang }); }, setSelectedDeviceId: (id) => set({ selectedDeviceId: id }), setUi: (p) => set((s) => { const next = { ...s.ui, ...p }; writeJson(LS.ui, next); return { ui: next }; }),
  
  addDevice: (draft) => { const id = crypto.randomUUID(); set((s) => { const next = [...s.devices, { ...draft, id, migration: { racked: false, cabled: false, powered: false, tested: false } } as Device]; writeJson(LS.devices, next); syncToCloudFull({ devices: next }); return { devices: next }; }); return id; },
  updateDevice: (id, patch) => set((s) => { const next = s.devices.map((d) => d.id === id ? ({ ...d, ...patch } as Device) : d); writeJson(LS.devices, next); syncToCloudFull({ devices: next }); return { devices: next }; }),
  deleteDeviceById: (id) => set((s) => { const next = s.devices.filter((d) => d.id !== id); writeJson(LS.devices, next); syncToCloudFull({ devices: next }); return { devices: next, selectedDeviceId: s.selectedDeviceId === id ? null : s.selectedDeviceId }; }),
  importFullCSV: (fileText) => { try { const r = parseCSV(fileText); if(r.length<2) return {ok:false}; const h=r[0].map(x=>x.trim()); const g=(row:string[],k:string)=>String(row[h.indexOf(k)]||"").trim(); const devs:Device[]=r.slice(1).map(row=>({ id:g(row,"id")||crypto.randomUUID(), category:(g(row,"category") as DeviceCategory)||"Other", deviceId:g(row,"deviceId"), name:g(row,"name"), brand:g(row,"brand"), model:g(row,"model"), ports:Number(g(row,"ports"))||0, sizeU:Math.max(1,Math.min(42,Number(g(row,"sizeU"))||1)), ip:g(row,"ip"), serial:g(row,"serial"), portMap:g(row,"portMap"), connections:(()=>{try{return JSON.parse(g(row,"connections"))}catch(e){return []}})(), beforeRackId:backwardCompatRackId(g(row,"beforeRackId")||undefined), beforeStartU:g(row,"beforeStartU")?Number(g(row,"beforeStartU")):undefined, beforeEndU:g(row,"beforeEndU")?Number(g(row,"beforeEndU")):undefined, afterRackId:backwardCompatRackId(g(row,"afterRackId")||undefined), afterStartU:g(row,"afterStartU")?Number(g(row,"afterStartU")):undefined, afterEndU:g(row,"afterEndU")?Number(g(row,"afterEndU")):undefined, migration: { racked:g(row,"m_racked")==="1", cabled:g(row,"m_cabled")==="1", powered:g(row,"m_powered")==="1", tested:g(row,"m_tested")==="1" } })); writeJson(LS.devices, devs); syncToCloudFull({devices:devs}); set({devices:devs}); return {ok:true}; }catch(e){return {ok:false};} },
  appendDevicesFromCSV: (fileText) => { try { const r=parseCSV(fileText); if(r.length<2)return{ok:false}; const h=r[0].map(x=>x.trim()); const g=(row:string[],k:string)=>String(row[h.indexOf(k)]||"").trim(); const newDevs:Device[]=[]; for(let i=1;i<r.length;i++){const row=r[i]; if(row.length<3)continue; const dId=g(row,"deviceId"),nm=g(row,"name"); if(!dId||!nm)continue; newDevs.push({id:crypto.randomUUID(),category:(g(row,"category") as DeviceCategory)||"Other",deviceId:dId,name:nm,brand:g(row,"brand"),model:g(row,"model"),ports:Number(g(row,"ports"))||0,sizeU:Math.max(1,Math.min(42,Number(g(row,"sizeU"))||1)),ip:g(row,"ip"),serial:g(row,"serial"),portMap:g(row,"portMap"),connections:[],migration:{racked:false,cabled:false,powered:false,tested:false}})} writeJson(LS.devices,[...get().devices,...newDevs]); syncToCloudFull({devices:get().devices}); set({devices:get().devices}); return {ok:true} }catch(e){return {ok:false}} },
  clearPlacement: (m, id) => set((s) => { const n=s.devices.map(d=>d.id!==id?d:m==="before"?{...d,beforeRackId:undefined,beforeStartU:undefined,beforeEndU:undefined}:{...d,afterRackId:undefined,afterStartU:undefined,afterEndU:undefined}); writeJson(LS.devices,n); syncToCloudFull({devices:n}); return{devices:n} }),
  place: (m, dId, rId, sU) => { const devs=get().devices; const d=devs.find(x=>x.id===dId); if(!d)return{ok:false}; const s=clampU(sU); const e=s+Math.max(1,Math.min(42,d.sizeU))-1; if(e>42)return{ok:false}; const c=devs.find(x=>{if(x.id===dId)return false; const xr=m==="before"?x.beforeRackId:x.afterRackId; const xs=m==="before"?x.beforeStartU:x.afterStartU; const xe=m==="before"?x.beforeEndU:x.afterEndU; return xr===rId&&xs!=null&&xe!=null&&rangesOverlap(s,e,xs,xe)}); if(c)return{ok:false,message:`Collision: ${c.deviceId}`}; const n=devs.map(x=>x.id===dId?m==="before"?{...x,beforeRackId:rId,beforeStartU:s,beforeEndU:e}:{...x,afterRackId:rId,afterStartU:s,afterEndU:e}:x); writeJson(LS.devices,n); syncToCloudFull({devices:n}); set({devices:n}); return{ok:true} },
  setMigrationFlag: (id, p) => set((s) => { const n=s.devices.map(d=>d.id===id?{...d,migration:{...d.migration,...p}}:d); writeJson(LS.devices,n); syncToCloudFull({devices:n}); return{devices:n} }),
  repairRackIds: () => set((s) => { const n=s.devices.map(d=>({...d,beforeRackId:backwardCompatRackId(d.beforeRackId),afterRackId:backwardCompatRackId(d.afterRackId)})); writeJson(LS.devices,n); syncToCloudFull({devices:n}); return{devices:n} }),

  addIssue: (title, description) => set((s) => { const n:Issue[]=[{id:crypto.randomUUID(),title,description,author:s.userName||"Unknown",createdAt:Date.now(),status:"open",replies:[]},...s.issues]; writeJson(LS.issues,n); syncToCloudFull({issues:n}); return{issues:n} }),
  updateIssueStatus: (id, status) => set((s) => { const n=s.issues.map(i=>i.id===id?{...i,status}:i); writeJson(LS.issues,n); syncToCloudFull({issues:n}); return{issues:n} }),
  deleteIssue: (id) => set((s) => { const n=s.issues.filter(i=>i.id!==id); writeJson(LS.issues,n); syncToCloudFull({issues:n}); return{issues:n} }),
  addIssueReply: (id, text) => set((s) => { const n=s.issues.map(i=>i.id===id?{...i,replies:[...i.replies,{id:crypto.randomUUID(),text,author:s.userName||"Unknown",createdAt:Date.now()}]}:i); writeJson(LS.issues,n); syncToCloudFull({issues:n}); return{issues:n} }),
  
  updateProjectInfo: (info) => set((s) => { writeJson(LS.projectInfo, info); syncToCloudFull({projectInfo: info}); return { projectInfo: info } }),
  addTask: (t) => set((s) => { const n = [...s.tasks, { ...t, id: crypto.randomUUID(), status: "pending" as TaskStatus }]; writeJson(LS.tasks, n); syncToCloudFull({tasks: n}); return {tasks: n} }),
  updateTaskStatus: (id, status) => set((s) => { const n = s.tasks.map(t => t.id === id ? { ...t, status } : t); writeJson(LS.tasks, n); syncToCloudFull({tasks: n}); return {tasks: n} }),
  deleteTask: (id) => set((s) => { const n = s.tasks.filter(t => t.id !== id); writeJson(LS.tasks, n); syncToCloudFull({tasks: n}); return {tasks: n} }),
}));

/* ==========================================
   UI Components & App
========================================== */
const ThemeTokens = () => {
  const style = useStore((s) => s.themeStyle);
  const presets: Record<ThemeStyle, { light: string; dark: string }> = {
    neon: { light: ":root{--bg:#f7fafc;--panel:#ffffff;--panel2:#f1f5f9;--text:#0b1220;--muted:#475569;--border:#e2e8f0;--accent:#06b6d4;--accent2:#a855f7;--onColor:#f8fafc;}", dark: "html.dark{--bg:#05070d;--panel:#0b1220;--panel2:#1a2235;--text:#e5e7eb;--muted:#94a3b8;--border:#1e293b;--accent:#22d3ee;--accent2:#c084fc;--onColor:#f8fafc;}" },
    horizon: { light: ":root{--bg:#f6f9ff;--panel:#ffffff;--panel2:#eef3ff;--text:#0a1020;--muted:#5b6478;--border:#e6ebff;--accent:#2563eb;--accent2:#14b8a6;--onColor:#f8fafc;}", dark: "html.dark{--bg:#070a14;--panel:#0b1020;--panel2:#101a33;--text:#f1f5f9;--muted:#9aa4b2;--border:#1a2550;--accent:#60a5fa;--accent2:#2dd4bf;--onColor:#f8fafc;}" },
    nebula: { light: ":root{--bg:#fbf7ff;--panel:#ffffff;--panel2:#f6edff;--text:#140a20;--muted:#6b5b7a;--border:#f0e1ff;--accent:#7c3aed;--accent2:#ec4899;--onColor:#f8fafc;}", dark: "html.dark{--bg:#080614;--panel:#0f0b1f;--panel2:#1a1233;--text:#f8fafc;--muted:#a7a1b2;--border:#2a1f4d;--accent:#a78bfa;--accent2:#fb7185;--onColor:#f8fafc;}" },
    matrix: { light: ":root{--bg:#f7fbf9;--panel:#ffffff;--panel2:#edf7f2;--text:#07140f;--muted:#5a6b63;--border:#dff2e8;--accent:#10b981;--accent2:#06b6d4;--onColor:#07140f;}", dark: "html.dark{--bg:#050c09;--panel:#0a1410;--panel2:#0f1f18;--text:#eafff6;--muted:#9bb7ab;--border:#153026;--accent:#34d399;--accent2:#22d3ee;--onColor:#07140f;}" },
  };
  return <style>{`@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css");\n${presets[style]?.light||presets.neon.light}\n${presets[style]?.dark||presets.neon.dark}`}</style>;
};

function useApplyTheme() { const theme = useStore((s) => s.theme); useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]); }
function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; }) { return <button disabled={disabled} onClick={() => onChange(!on)} className={`w-11 h-6 rounded-full border transition-all ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${on ? "bg-[rgba(0,255,0,0.12)] border-[rgba(0,255,0,0.7)]" : "bg-black/20 border-[var(--border)]"}`} style={{ boxShadow: on ? "0 0 16px rgba(0,255,0,0.25)" : "none" }}><span className="block w-5 h-5 rounded-full bg-white transition-all" style={{ transform: `translateX(${on ? "20px" : "2px"})` }} /></button>; }

function LoginPage() {
  const login = useStore(s => s.login); const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState<string|null>(null);
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6"><ThemeTokens />
      <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-3xl shadow-2xl p-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-black bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)]"><Server size={18} /></div><div><div className="text-lg font-black text-[var(--text)]">MigratePro</div><div className="text-xs text-[var(--muted)]">Login</div></div></div>
        <div className="mt-5 space-y-3">
          <input className="w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none" value={u} onChange={e=>setU(e.target.value)} placeholder="Account" />
          <input type="password" className="w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none" value={p} onChange={e=>setP(e.target.value)} placeholder="Password" />
          {err && <div className="text-sm text-red-400">{err}</div>}
          <button onClick={() => { setErr(null); const res = login(u, p); if (!res.ok) setErr("Failed"); }} className="w-full mt-2 bg-[var(--accent)] text-black font-extrabold py-3 rounded-xl hover:opacity-90">Login</button>
        </div>
      </div>
    </div>
  );
}

const RunbookGanttGrid = ({ tasks, dayIndex, readOnly }: { tasks: Task[], dayIndex: number, readOnly?: boolean }) => {
  const dayTasks = tasks.filter(t => t.dayIndex === dayIndex).sort((a,b) => a.startHH - b.startHH);
  const getStatusIcon = (s: TaskStatus) => { if (s === 'verified') return <CheckCircle2 size={12} className="text-white drop-shadow-md" />; if (s === 'done') return <Check size={12} className="text-white drop-shadow-md" />; if (s === 'in_progress') return <Play size={12} className="text-white drop-shadow-md animate-pulse" />; return null; };
  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[1000px] border border-[var(--border)] bg-[var(--panel2)] rounded-xl p-4 shadow-inner relative">
        <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}>{Array.from({length: 24}).map((_, i) => (<div key={i} className="col-span-2 text-[10px] font-bold text-[var(--muted)] border-l border-[var(--border)] pl-1">{String(i).padStart(2,'0')}:00</div>))}</div>
        <div className="space-y-1.5 relative">
          {dayTasks.length === 0 && <div className="text-xs text-[var(--muted)] py-4 italic text-center">No tasks for this day.</div>}
          {dayTasks.map(t => (
            <div key={t.id} className="grid gap-1 items-center h-8" style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}>
              <div style={{ gridColumn: `${t.startHH + 1} / ${t.endHH + 1}`, backgroundColor: getVendorColor(t.vendor) }} className={`h-full rounded px-2 text-[10px] font-bold text-white flex items-center justify-between shadow-sm overflow-hidden ${t.status==='done'?'opacity-80':''} ${t.status==='verified'?'opacity-50 grayscale':''}`} title={`${formatHH(t.startHH)} - ${formatHH(t.endHH)} | ${t.title} (${t.vendor})`}><span className="truncate pr-1 drop-shadow-md">{t.title}</span><div className="flex items-center gap-1 shrink-0 bg-black/20 px-1 rounded shadow-inner">{getStatusIcon(t.status)}<span className="truncate max-w-[50px]">{t.vendor}</span></div></div>
            </div>
          ))}
          <div className="absolute inset-0 grid gap-1 pointer-events-none" style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}>{Array.from({length: 48}).map((_, i) => <div key={i} className={`border-l ${i%2===0 ? 'border-[var(--border)] opacity-40' : 'border-[var(--border)] opacity-10'} h-full`} />)}</div>
        </div>
      </div>
    </div>
  );
};

const DashboardGanttView = () => { const tasks = useStore(s => s.tasks); return <div className="h-[500px] xl:h-[600px] overflow-y-auto"><RunbookGanttGrid tasks={tasks} dayIndex={0} readOnly /></div>; };

const DashboardFullCarousel = ({ devices, racks }: { devices: Device[]; racks: Rack[] }) => {
  const lang = useStore(s => s.lang); const p1 = useMemo(() => racks.filter((r) => r.id.includes("AFT_A") || r.id.includes("AFT_B")), [racks]);
  return (
    <div className="flex gap-1.5 md:gap-2 lg:gap-3 overflow-x-auto w-full flex-1 min-h-[500px] xl:min-h-[600px] pb-2 scrollbar-hide snap-x">
      {p1.map(rack => {
        const rackDevs = devices.filter(d => d.afterRackId === rack.id && d.afterStartU != null && d.afterEndU != null); const displayName = getRackName(rack.id, lang);
        return (
          <div key={rack.id} className="flex flex-col bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 snap-center border border-slate-700 min-w-[120px] lg:min-w-0 flex-1">
            <div className="px-1 py-2 text-center text-xs xl:text-sm font-bold text-white truncate bg-emerald-600">{displayName}</div>
            <div className="relative w-full border-x-[4px] xl:border-x-[6px] border-t-[4px] xl:border-t-[6px] border-slate-600 bg-[#0b1220] shadow-inner flex-1">
              <div className="absolute inset-0 pointer-events-none z-10">
                {rackDevs.map(d => {
                  const sU=clampU(d.afterStartU??1); const eU=clampU(d.afterEndU??sU); const start=Math.min(sU,eU); const size=Math.abs(eU-sU)+1; const isAcc = d.category === "Accessory";
                  return (
                    <div key={d.id} className="absolute left-[2px] right-[2px] rounded flex justify-between items-center pl-1.5 md:pl-2 overflow-hidden shadow-md" style={{ bottom: `${((start-1)/42)*100}%`, height: `calc(${(size/42)*100}% - 2px)`, backgroundColor: catColor(d.category), backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)" }}>
                      <div className="flex-1 text-[9px] xl:text-[11px] 2xl:text-[13px] text-white font-medium truncate text-left drop-shadow-md pr-1">{isAcc ? d.name : d.deviceId}</div>
                      {!isAcc && <div className="flex shrink-0 bg-black/40 rounded-md p-1 mr-1 scale-[0.55] xl:scale-[0.65]"><LampsRow m={d.migration} /></div>}
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
  const devices = useStore((s) => s.devices); const afterRacks = useStore((s) => s.afterRacks); const lang = useStore((s) => s.lang);
  const validDevs = devices.filter(d => d.category !== "Accessory"); const total = validDevs.length; const racked = validDevs.filter((d) => d.migration.racked).length; const cabled = validDevs.filter((d) => d.migration.cabled).length; const powered = validDevs.filter((d) => d.migration.powered).length; const tested = validDevs.filter((d) => d.migration.tested).length; const completed = validDevs.filter((d) => isMigratedComplete(d.migration)).length; const pending = Math.max(0, total - completed); const calcPct = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0;
  const chartData = [ { name: "NW", count: devices.filter(d=>d.category==="Network").length, fill: FIXED_COLORS.Network }, { name: "SRV", count: devices.filter(d=>d.category==="Server").length, fill: FIXED_COLORS.Server }, { name: "STG", count: devices.filter(d=>d.category==="Storage").length, fill: FIXED_COLORS.Storage }, { name: "OTH", count: devices.filter(d=>d.category==="Other").length, fill: FIXED_COLORS.Other } ];
  const [dashTab, setDashTab] = useState<"rack"|"gantt">("rack"); const [tvMode, setTvMode] = useState(false);
  useEffect(() => { if(!tvMode) return; const t = setInterval(() => setDashTab(p => p === "rack" ? "gantt" : "rack"), 15000); return () => clearInterval(t); }, [tvMode]);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--panel)] border border-[var(--border)] p-4 md:p-6 rounded-2xl shadow-xl flex flex-col justify-center"><div className="text-lg md:text-xl font-extrabold text-[var(--muted)] mb-1">{t("totalDevices", lang)}</div><div className="text-4xl md:text-5xl font-black text-[var(--accent)]">{total}</div><div className="flex gap-1.5 mt-2 flex-wrap">{chartData.map(c => <span key={c.name} className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded border" style={{ color: c.fill, borderColor: c.fill, backgroundColor: `${c.fill}20` }}>{c.name}:{c.count}</span>)}</div></div>
        <div className="bg-[var(--panel)] border border-[var(--border)] p-4 md:p-6 rounded-2xl shadow-xl flex flex-col justify-center"><div className="flex justify-between items-end mb-1"><div className="text-lg md:text-xl font-extrabold text-[var(--muted)]">{t("pending", lang)}</div><div className="text-sm font-bold text-red-500">{calcPct(pending)}%</div></div><div className="text-3xl md:text-4xl font-black text-red-500 drop-shadow-md">{pending}</div><div className="mt-3 w-full h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${calcPct(pending)}%` }} /></div></div>
        <div className="bg-[var(--panel)] border border-[var(--border)] p-4 md:p-6 rounded-2xl shadow-xl flex flex-col justify-center"><div className="flex justify-between items-end mb-1"><div className="text-lg md:text-xl font-extrabold text-[var(--muted)]">{t("completed", lang)}</div><div className="text-sm font-bold text-green-500">{calcPct(completed)}%</div></div><div className="flex items-baseline gap-2"><div className="text-3xl md:text-4xl font-black text-green-500 drop-shadow-md">{completed}</div><div className="text-sm text-[var(--muted)] font-bold">/ {total}</div></div><div className="mt-3 w-full h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${calcPct(completed)}%` }} /></div></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: t("racked", lang), val: racked }, { label: t("cabled", lang), val: cabled }, { label: t("powered", lang), val: powered }, { label: t("tested", lang), val: tested }].map((item, idx) => (
          <div key={idx} className="bg-[var(--panel2)] border border-[var(--border)] p-3 md:p-4 rounded-xl flex flex-col"><div className="text-xs md:text-sm font-black text-[var(--muted)] mb-2">{item.label}</div><div className="flex items-baseline justify-between mb-2"><div className="text-xl md:text-2xl font-black text-[var(--text)]">{item.val}</div><div className="text-[10px] md:text-xs font-bold text-[var(--accent)]">{calcPct(item.val)}%</div></div><div className="w-full h-1 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${calcPct(item.val)}%` }} /></div></div>
        ))}
      </div>
      <div className="bg-[var(--panel)] border border-[var(--border)] p-4 md:p-6 rounded-2xl shadow-xl flex flex-col w-full lg:col-span-2">
        <div className="flex flex-wrap w-full justify-between items-center mb-4 gap-3">
          <div className="flex bg-[var(--panel2)] border border-[var(--border)] rounded-xl p-1">
            <button onClick={()=>setDashTab("rack")} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 ${dashTab==='rack'?'bg-[var(--accent)] text-black shadow':'text-[var(--text)] hover:bg-white/5'}`}><Server size={16}/> {t("rackStatus", lang)}</button>
            <button onClick={()=>setDashTab("gantt")} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 ${dashTab==='gantt'?'bg-[var(--accent)] text-black shadow':'text-[var(--text)] hover:bg-white/5'}`}><CalendarClock size={16}/> {t("navRunbook", lang)}</button>
          </div>
          <button onClick={()=>setTvMode(!tvMode)} className={`px-4 py-2 rounded-xl text-sm font-extrabold flex items-center gap-2 transition-all ${tvMode ? 'bg-red-500 text-white animate-pulse' : 'border border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel2)]'}`}>{tvMode ? <><Tv size={16}/> {t("tvModeOn", lang)}</> : <><Tv size={16}/> {t("tvModeOff", lang)}</>}</button>
        </div>
        {dashTab === "rack" ? <DashboardFullCarousel devices={devices} racks={afterRacks} /> : <DashboardGanttView />}
      </div>
    </div>
  );
};

const RunbookPage = () => {
  const lang = useStore(s => s.lang); const role = useStore(s => s.role); const user = useStore(s => s.userName); const tasks = useStore(s => s.tasks); const projectInfo = useStore(s => s.projectInfo); const updateProjectInfo = useStore(s => s.updateProjectInfo); const addTask = useStore(s => s.addTask); const updateTaskStatus = useStore(s => s.updateTaskStatus); const deleteTask = useStore(s => s.deleteTask); const accounts = useStore(s => s.accounts); const vendors = accounts.filter(a => a.role === 'vendor').map(a => a.username);
  const [activeDay, setActiveDay] = useState(0); const [setupOpen, setSetupOpen] = useState(false); const [newTaskOpen, setNewTaskOpen] = useState(false); const isAdmin = role === "admin";

  const SetupModal = () => {
    const [sd, setSd] = useState(projectInfo.startDate); const [d, setD] = useState(projectInfo.days);
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl"><div className="text-xl font-black text-[var(--text)] mb-4">{t("rbSetup", lang)}</div><div className="space-y-4"><div><label className="text-xs text-[var(--muted)]">{t("rbStart", lang)}</label><input type="date" className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none" value={sd} onChange={(e) => setSd(e.target.value)} /></div><div><label className="text-xs text-[var(--muted)]">{t("rbDays", lang)}</label><input type="number" min={1} max={14} className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none" value={d} onChange={(e) => setD(Number(e.target.value))} /></div></div><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setSetupOpen(false)} className="px-4 py-2 rounded-xl text-[var(--text)]">{t("btnCancel", lang)}</button><button onClick={()=>{updateProjectInfo({startDate:sd, days:d}); setSetupOpen(false);}} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-bold">{t("btnSave", lang)}</button></div></div>
      </div>
    );
  };

  const NewTaskModal = () => {
    const [tTitle, setTTitle] = useState(""); const [v, setV] = useState(vendors[0] || ""); const [sh, setSh] = useState(16); const [eh, setEh] = useState(20);
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl"><div className="text-xl font-black text-[var(--text)] mb-4">{t("rbAddTask", lang)} (Day {activeDay+1})</div><div className="space-y-4"><div><label className="text-xs text-[var(--muted)]">{t("rbTaskName", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" value={tTitle} onChange={(e) => setTTitle(e.target.value)} /></div><div><label className="text-xs text-[var(--muted)]">{t("rbVendor", lang)}</label><select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none" value={v} onChange={(e) => setV(e.target.value)}>{vendors.map(x=><option key={x} value={x}>{x}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-[var(--muted)]">{t("rbStartTime", lang)}</label><select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)]" value={sh} onChange={(e)=>setSh(Number(e.target.value))}>{Array.from({length:48}).map((_,i)=><option key={i} value={i}>{formatHH(i)}</option>)}</select></div><div><label className="text-xs text-[var(--muted)]">{t("rbEndTime", lang)}</label><select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)]" value={eh} onChange={(e)=>setEh(Number(e.target.value))}>{Array.from({length:48}).map((_,i)=><option key={i+1} value={i+1} disabled={i+1<=sh}>{formatHH(i+1)}</option>)}</select></div></div></div><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setNewTaskOpen(false)} className="px-4 py-2 rounded-xl text-[var(--text)]">{t("btnCancel", lang)}</button><button onClick={()=>{if(tTitle && v && eh>sh){addTask({title:tTitle, vendor:v, dayIndex:activeDay, startHH:sh, endHH:eh}); setNewTaskOpen(false);}}} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-bold">{t("btnSave", lang)}</button></div></div>
      </div>
    );
  };

  const MobileTaskList = () => {
    const dayTasks = tasks.filter(t => t.dayIndex === activeDay).sort((a,b)=>a.startHH - b.startHH);
    return (
      <div className="md:hidden space-y-3 mt-4">
        {dayTasks.length===0 && <div className="text-center text-[var(--muted)] text-sm py-10">No tasks</div>}
        {dayTasks.map(t => {
          const isMyTask = isAdmin || user === t.vendor;
          return (
            <div key={t.id} className={`p-4 rounded-2xl border bg-[var(--panel)] shadow-sm ${isMyTask ? 'border-[var(--accent)]/50' : 'border-[var(--border)] opacity-80'}`}><div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor:getVendorColor(t.vendor)}}/><span className="text-xs font-bold text-[var(--text)]">{t.vendor}</span></div><div className="text-[10px] font-bold px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--panel2)] text-[var(--text)]">{formatHH(t.startHH)} - {formatHH(t.endHH)}</div></div><div className="font-black text-[var(--text)] text-sm mb-3">{t.title}</div><div className="flex justify-between items-center pt-3 border-t border-[var(--border)]"><div className="text-[10px] font-bold text-[var(--muted)] uppercase">{t.status.replace("_"," ")}</div><div className="flex gap-2">{isAdmin && <button onClick={()=>deleteTask(t.id)} className="p-1.5 text-red-500 rounded-lg hover:bg-white/5"><Trash2 size={14}/></button>}{isMyTask && t.status==='pending' && <button onClick={()=>updateTaskStatus(t.id, 'in_progress')} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold">{t("btnStart", lang)}</button>}{isMyTask && t.status==='in_progress' && <button onClick={()=>updateTaskStatus(t.id, 'done')} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold">{t("btnDone", lang)}</button>}{isAdmin && t.status==='done' && <button onClick={()=>updateTaskStatus(t.id, 'verified')} className="px-3 py-1.5 bg-[var(--accent)] text-black rounded-lg text-xs font-bold">{t("btnVerify", lang)}</button>}</div></div></div>
          )
        })}
      </div>
    )
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 md:mb-6"><h2 className="text-xl md:text-2xl font-black text-[var(--text)] flex items-center gap-2"><CalendarClock className="text-[var(--accent)]"/> {t("rbTitle", lang)}</h2>{isAdmin && (<div className="flex gap-2"><button onClick={()=>setSetupOpen(true)} className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-[var(--border)] text-[var(--text)] text-xs md:text-sm font-bold">{t("rbSetup", lang)}</button><button onClick={()=>setNewTaskOpen(true)} className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold flex items-center gap-2 text-xs md:text-sm"><Plus size={16}/> {t("rbAddTask", lang)}</button></div>)}</div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">{Array.from({length: projectInfo.days}).map((_, i) => (<button key={i} onClick={()=>setActiveDay(i)} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeDay===i ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-[var(--panel2)] border-[var(--border)] text-[var(--muted)] hover:bg-white/5'}`}>Day {i+1}</button>))}</div>
      <div className="hidden md:block flex-1 bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-4 overflow-y-auto"><RunbookGanttGrid tasks={tasks} dayIndex={activeDay} /></div>
      <MobileTaskList />
      {setupOpen && <SetupModal />}
      {newTaskOpen && <NewTaskModal />}
    </div>
  );
};

const GuidePage = () => {
  const lang = useStore(s => s.lang);
  return (
    <div className="p-6 h-full overflow-y-auto max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-[var(--accent)] flex items-center gap-2"><BookOpen /> {t("navGuide", lang)}</h2>
      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-sm"><h3 className="text-lg font-bold text-[var(--text)] mb-3 flex items-center gap-2"><span className="w-2 h-6 bg-[var(--accent)] rounded-full"></span> 1. System Architecture</h3><p className="text-sm text-[var(--muted)] leading-relaxed mb-4">MigratePro is a real-time data center migration dashboard. It tracks asset movement from legacy racks to new destination layouts. Roles are divided into Admin (full control), Cable (port routing), and Vendor (status updating).</p></div>
      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-sm"><h3 className="text-lg font-bold text-[var(--text)] mb-3 flex items-center gap-2"><span className="w-2 h-6 bg-[var(--accent2)] rounded-full"></span> 2. Smart Cable Routing (SOP)</h3><ul className="text-sm text-[var(--muted)] space-y-2 list-disc pl-5"><li>Do not manually type target rack U-space.</li><li>In Device Edit, use "Smart Cable Routing" to add a connection.</li><li>Select the target device from the dropdown. The system automatically computes the cross-rack cable labels!</li><li>Click "Export Labels" to download CSV for your label printer.</li></ul></div>
      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-sm"><h3 className="text-lg font-bold text-[var(--text)] mb-3 flex items-center gap-2"><span className="w-2 h-6 bg-green-500 rounded-full"></span> 3. Accessory Category</h3><p className="text-sm text-[var(--muted)] leading-relaxed mb-2">Use the `Accessory` category for Shelf, Cable Managers, and Blanking Panels.</p><p className="text-sm text-[var(--muted)] leading-relaxed">Accessories are visually distinct (grey, no status lamps) and are automatically EXCLUDED from the Dashboard KPIs.</p></div>
    </div>
  );
};

function DeviceDetailModal({ id, mode, onClose }: { id: string; mode: PlacementMode; onClose: () => void; }) {
  const d = useStore((s) => s.devices.find((x) => x.id === id)); const devices = useStore((s) => s.devices); const setFlag = useStore((s) => s.setMigrationFlag); const clearPlacement = useStore((s) => s.clearPlacement); const updateDevice = useStore((s) => s.updateDevice); const role = useStore((s) => s.role); const lang = useStore((s) => s.lang);
  if (!d) return null; const isAccessory = d.category === "Accessory";
  const [localNote, setLocalNote] = useState(d?.portMap || ""); const [localConns, setLocalConns] = useState<Connection[]>(d?.connections || []);
  const [originalIncoming] = useState<{sourceDevId: string, conn: Connection}[]>(() => { if (isAccessory) return []; const inc: { sourceDevId: string, conn: Connection }[] = []; devices.forEach(dev => { if (dev.id === id) return; dev.connections.forEach(c => { if (c.targetId === id) inc.push({ sourceDevId: dev.id, conn: c }); }); }); return inc; });
  const [incomingConns, setIncomingConns] = useState([...originalIncoming]); const [deletedIncoming, setDeletedIncoming] = useState<string[]>([]);
  const beforePos = d.beforeRackId && d.beforeStartU != null && d.beforeEndU != null ? `${getRackName(d.beforeRackId, lang)} ${d.beforeStartU}-${d.beforeEndU}U` : "-"; const afterPos = d.afterRackId && d.afterStartU != null && d.afterEndU != null ? `${getRackName(d.afterRackId, lang)} ${d.afterStartU}-${d.afterEndU}U` : "-";
  const allowLayout = canManageAssets(role); const allowEditPort = canEditPortMap(role);
  const isModified = localNote !== (d.portMap || "") || JSON.stringify(localConns) !== JSON.stringify(d.connections || []) || JSON.stringify(incomingConns) !== JSON.stringify(originalIncoming) || deletedIncoming.length > 0;

  const addConn = () => setLocalConns(p => [...p, { id: crypto.randomUUID(), localPort: '', targetId: '', targetPort: '' }]);
  const updateConn = (i: number, k: keyof Connection, v: string) => { const next = [...localConns]; next[i] = { ...next[i], [k]: v }; setLocalConns(next); };
  const removeConn = (i: number) => { const next = [...localConns]; next.splice(i, 1); setLocalConns(next); };
  const updateIncoming = (i: number, k: keyof Connection, v: string) => { const next = [...incomingConns]; next[i] = { ...next[i], conn: { ...next[i].conn, [k]: v } }; setIncomingConns(next); };
  const removeIncoming = (i: number) => { const removed = incomingConns[i]; setDeletedIncoming(p => [...p, removed.conn.id]); const next = [...incomingConns]; next.splice(i, 1); setIncomingConns(next); };

  const saveChanges = () => {
    updateDevice(d.id, { portMap: localNote.trimEnd(), connections: localConns });
    incomingConns.forEach(inc => { const sourceDev = useStore.getState().devices.find(x => x.id === inc.sourceDevId); if (sourceDev) { const newConns = sourceDev.connections.map(sc => sc.id === inc.conn.id ? inc.conn : sc); if (JSON.stringify(sourceDev.connections) !== JSON.stringify(newConns)) useStore.getState().updateDevice(sourceDev.id, { connections: newConns }); } });
    deletedIncoming.forEach(connId => { const sourceDev = useStore.getState().devices.find(x => x.connections.some(c => c.id === connId)); if (sourceDev) useStore.getState().updateDevice(sourceDev.id, { connections: sourceDev.connections.filter(c => c.id !== connId) }); });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-4 md:p-6 border-b border-[var(--border)] shrink-0 flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-xs text-[var(--muted)]">{t("detailTitle", lang)} {isAccessory && " (Accessory)"}</div><div className="text-lg md:text-xl font-black truncate text-[var(--text)]">{isAccessory ? d.name : d.deviceId + ' · ' + d.name}</div><div className="text-sm text-[var(--muted)] truncate">{isAccessory ? "-" : `${d.brand} / ${d.model} · ${d.ports} ports`} · {d.sizeU}U</div></div><button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button></div>
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]"><div className="text-xs text-[var(--muted)]">{t("detailBefore", lang)}</div><div className="font-bold mt-1 text-[var(--text)]">{beforePos}</div></div>
            <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]"><div className="text-xs text-[var(--muted)]">{t("detailAfter", lang)}</div><div className="font-bold mt-1 text-[var(--text)]">{afterPos}</div></div>
            {!isAccessory && <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--panel2)] md:col-span-2"><div className="text-xs text-[var(--muted)]">IP / SN</div><div className="mt-1 font-bold text-[var(--text)]">{d.ip || "-"} / {d.serial || "-"}</div></div>}
          </div>
          {!isAccessory && (
            <div className="mt-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
              <div className="flex justify-between items-center mb-3"><div className="flex items-center gap-2 font-black text-[var(--text)]"><Link2 size={16} className="text-[var(--accent)]" /> {t("cableRouting", lang)} <span className="text-xs font-medium text-[var(--muted)] ml-2 border border-[var(--border)] px-2 py-0.5 rounded-full">{t("autoGenLabels", lang)}</span></div>{allowEditPort && <button type="button" onClick={addConn} className="text-xs bg-[var(--accent)] text-black px-3 py-1.5 rounded-lg font-bold hover:opacity-90 flex items-center gap-1"><Plus size={14} /> {t("addConnection", lang)}</button>}</div>
              {(localConns.length === 0 && incomingConns.length === 0) ? (<div className="text-xs text-[var(--muted)] italic">No Connections.</div>) : (
                <div className="space-y-4">
                  {localConns.map((c, i) => {
                    const target = devices.find(x => x.id === c.targetId); const targetName = target ? target.name : t("unknownDev", lang);
                    const rId = mode === "before" ? d.beforeRackId : d.afterRackId; const u = mode === "before" ? d.beforeStartU : d.afterStartU; const trId = mode === "before" ? target?.beforeRackId : target?.afterRackId; const tu = mode === "before" ? target?.beforeStartU : target?.afterStartU;
                    const myLabel = `${rId ? getRackName(rId, lang) : "-"}/${u||"-"}U/${d.name}/${c.localPort||"-"}`; const tLabel = `${trId ? getRackName(trId, lang) : "-"}/${tu||"-"}U/${targetName}/${c.targetPort||"-"}`;
                    return (
                      <div key={c.id} className="flex flex-col gap-2 bg-[var(--panel)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
                        {allowEditPort && (
                          <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                            <div className="text-[10px] bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-1 rounded border border-[var(--accent)]/30 whitespace-nowrap">{t("outgoingConn", lang)}</div>
                            <input placeholder={t("localPort", lang)} value={c.localPort} onChange={e => updateConn(i, 'localPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                            <span className="text-[var(--muted)] text-xs hidden md:block">{'->'}</span>
                            <select value={c.targetId} onChange={e => updateConn(i, 'targetId', e.target.value)} className="flex-1 w-full md:w-0 bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-xs p-1 outline-none text-[var(--text)]"><option value="">{t("selectDevice", lang)}</option>{devices.filter(x => x.id !== d.id && x.category !== "Accessory").map(x => <option key={x.id} value={x.id}>{x.deviceId} - {x.name}</option>)}</select>
                            <input placeholder={t("targetPort", lang)} value={c.targetPort} onChange={e => updateConn(i, 'targetPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                            <button type="button" onClick={() => removeConn(i)} className="p-1 text-red-400 hover:bg-white/10 rounded w-full md:w-auto flex justify-center"><X size={16}/></button>
                          </div>
                        )}
                        <div className="flex flex-col md:flex-row gap-2 items-center text-[11px] mt-1 opacity-90"><div className="flex-1 w-full bg-black/10 dark:bg-white/5 border border-[var(--border)] px-2 py-1.5 rounded text-center font-mono text-[var(--accent)] font-bold truncate">{myLabel}</div><div className="text-[var(--muted)] shrink-0 hidden md:block">{'⇄'}</div><div className="flex-1 w-full bg-black/10 dark:bg-white/5 border border-[var(--border)] px-2 py-1.5 rounded text-center font-mono text-[var(--accent2)] font-bold truncate">{tLabel}</div></div>
                      </div>
                    )
                  })}
                  {incomingConns.map((inc, i) => {
                    const sourceDev = devices.find(x => x.id === inc.sourceDevId); const sourceName = sourceDev ? sourceDev.name : t("unknownDev", lang);
                    const rId = mode === "before" ? d.beforeRackId : d.afterRackId; const u = mode === "before" ? d.beforeStartU : d.afterStartU; const trId = mode === "before" ? sourceDev?.beforeRackId : sourceDev?.afterRackId; const tu = mode === "before" ? sourceDev?.beforeStartU : sourceDev?.afterStartU;
                    const myLabel = `${rId ? getRackName(rId, lang) : "-"}/${u||"-"}U/${d.name}/${inc.conn.targetPort||"-"}`; const tLabel = `${trId ? getRackName(trId, lang) : "-"}/${tu||"-"}U/${sourceName}/${inc.conn.localPort||"-"}`;
                    return (
                      <div key={inc.conn.id} className="flex flex-col gap-2 bg-[var(--panel)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
                        {allowEditPort && (
                          <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                            <div className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 whitespace-nowrap">{t("incomingConn", lang)}</div>
                            <input placeholder={t("localPort", lang)} value={inc.conn.targetPort} onChange={e => updateIncoming(i, 'targetPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                            <span className="text-[var(--muted)] text-xs hidden md:block">{'<-'}</span>
                            <div className="flex-1 w-full md:w-0 bg-black/10 border border-[var(--border)] rounded-lg text-xs p-1.5 text-[var(--text)] truncate">{sourceDev?.deviceId} - {sourceName}</div>
                            <input placeholder={t("targetPort", lang)} value={inc.conn.localPort} onChange={e => updateIncoming(i, 'localPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                            <button type="button" onClick={() => removeIncoming(i)} className="p-1 text-red-400 hover:bg-white/10 rounded w-full md:w-auto flex justify-center"><X size={16}/></button>
                          </div>
                        )}
                        <div className="flex flex-col md:flex-row gap-2 items-center text-[11px] mt-1 opacity-90"><div className="flex-1 w-full bg-black/10 dark:bg-white/5 border border-[var(--border)] px-2 py-1.5 rounded text-center font-mono text-[var(--accent)] font-bold truncate">{myLabel}</div><div className="text-[var(--muted)] shrink-0 hidden md:block">{'⇄'}</div><div className="flex-1 w-full bg-black/10 dark:bg-white/5 border border-[var(--border)] px-2 py-1.5 rounded text-center font-mono text-[var(--accent2)] font-bold truncate">{tLabel}</div></div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          <div className="mt-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
            <div className="flex items-center justify-between mb-2"><div className="text-xs font-bold text-[var(--text)]">{t("fNote", lang)}</div>{!allowEditPort && <div className="text-[10px] text-[var(--muted)] border border-[var(--border)] px-1 rounded bg-black/10">Vendor ({t("readOnly", lang)})</div>}</div>
            {allowEditPort ? <textarea className="w-full bg-[var(--panel)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" rows={2} value={localNote} onChange={e => setLocalNote(e.target.value)} /> : <div className="text-sm whitespace-pre-wrap break-words text-[var(--text)]">{d.portMap || "-"}</div>}
          </div>
          {allowEditPort && isModified && <div className="mt-3 flex justify-end"><button onClick={saveChanges} className="bg-[var(--accent)] text-black px-6 py-2 rounded-xl text-sm font-extrabold hover:opacity-90 shadow-lg flex items-center gap-2"><Save size={16} /> {t("btnSaveChanges", lang)}</button></div>}
          <div className="mt-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--panel2)]">
            <div className="flex items-center justify-between"><div className="font-black text-[var(--text)]">{t("detailStatus", lang)}</div><LampsRow m={d.migration} isAccessory={isAccessory} /></div>
            {isAccessory ? <div className="text-xs text-[var(--muted)] mt-3">{t("accessoryNoLamp", lang)}</div> : mode === "after" ? (
              <div className="mt-4 grid grid-cols-1 gap-3 text-[var(--text)]">
                <div className="flex items-center justify-between"><div className="text-sm">{t("racked", lang)}</div><Switch on={d.migration.racked} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { racked: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">{t("cabled", lang)}</div><Switch on={d.migration.cabled} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { cabled: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">{t("powered", lang)}</div><Switch on={d.migration.powered} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { powered: v })} disabled={!canToggleFlags(role)} /></div>
                <div className="flex items-center justify-between"><div className="text-sm">{t("tested", lang)}</div><Switch on={d.migration.tested} onChange={(v) => canToggleFlags(role) && setFlag(d.id, { tested: v })} disabled={!canToggleFlags(role)} /></div>
              </div>
            ) : <div className="text-xs text-[var(--muted)] mt-3">{t("onlyAfterToggle", lang)}</div>}
          </div>
        </div>
        <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-between items-center">
          {allowLayout ? <button onClick={() => { if (confirm("Clear position?")) clearPlacement(mode, d.id); onClose(); }} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-xs md:text-sm text-[var(--text)]">{t("btnClearPlace", lang)}</button> : <div className="text-xs text-[var(--muted)]">{role === "cable" ? "Cable" : "Vendor"}：{t("cantLayout", lang)}</div>}
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-white/5 font-extrabold">{t("btnClose", lang)}</button>
        </div>
      </motion.div>
    </div>
  );
}

function DeviceModal({ title, deviceId, initial, onClose, onSave }: { title: string; deviceId?: string | null; initial: DeviceDraft; onClose: () => void; onSave: (d: DeviceDraft) => void; }) {
  const lang = useStore((s) => s.lang); const devices = useStore((s) => s.devices); const accOptions = getAccessoryOptions(lang); const isAcc = initial.category === "Accessory";
  const [d, setD] = useState<DeviceDraft>({ ...initial, connections: initial.connections || [] }); const input = (k: keyof DeviceDraft) => (e: any) => setD((p) => ({ ...p, [k]: e.target.value } as any));
  const [localConns, setLocalConns] = useState<Connection[]>(d.connections);
  const [originalIncoming] = useState<{sourceDevId: string, conn: Connection}[]>(() => { if (isAcc || !deviceId) return []; const inc: { sourceDevId: string, conn: Connection }[] = []; devices.forEach(dev => { if (dev.id === deviceId) return; dev.connections.forEach(c => { if (c.targetId === deviceId) inc.push({ sourceDevId: dev.id, conn: c }); }); }); return inc; });
  const [incomingConns, setIncomingConns] = useState([...originalIncoming]); const [deletedIncoming, setDeletedIncoming] = useState<string[]>([]);
  
  const handleAccSelect = (e: React.ChangeEvent<HTMLSelectElement>) => { const val = e.target.value; let autoU = 1; if (val.includes("2U")) autoU = 2; setD(p => ({ ...p, name: val, sizeU: autoU })); };
  const addConn = () => setLocalConns(p => [...p, { id: crypto.randomUUID(), localPort: '', targetId: '', targetPort: '' }]);
  const updateConn = (i: number, k: keyof Connection, v: string) => { const next = [...localConns]; next[i] = { ...next[i], [k]: v }; setLocalConns(next); };
  const removeConn = (i: number) => { const next = [...localConns]; next.splice(i, 1); setLocalConns(next); };
  const updateIncoming = (i: number, k: keyof Connection, v: string) => { const next = [...incomingConns]; next[i] = { ...next[i], conn: { ...next[i].conn, [k]: v } }; setIncomingConns(next); };
  const removeIncoming = (i: number) => { const removed = incomingConns[i]; setDeletedIncoming(p => [...p, removed.conn.id]); const next = [...incomingConns]; next.splice(i, 1); setIncomingConns(next); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); let finalD = { ...d };
    if (d.category === "Accessory") { if (!finalD.name) finalD.name = accOptions[0]; if (!finalD.deviceId) finalD.deviceId = `ACC-${Math.floor(Math.random() * 9000) + 1000}`; } else { if (!finalD.deviceId.trim() || !finalD.name.trim()) return alert("ID and Name are required."); }
    onSave({ ...finalD, ports: Number(finalD.ports) || 0, sizeU: Math.max(1, Math.min(42, Number(finalD.sizeU) || 1)), portMap: (finalD.portMap ?? "").trimEnd(), connections: localConns });
    if (!isAcc && deviceId) {
      incomingConns.forEach(inc => { const sourceDev = useStore.getState().devices.find(x => x.id === inc.sourceDevId); if (sourceDev) { const newConns = sourceDev.connections.map(sc => sc.id === inc.conn.id ? inc.conn : sc); if (JSON.stringify(sourceDev.connections) !== JSON.stringify(newConns)) useStore.getState().updateDevice(sourceDev.id, { connections: newConns }); } });
      deletedIncoming.forEach(connId => { const sourceDev = useStore.getState().devices.find(x => x.connections.some(c => c.id === connId)); if (sourceDev) useStore.getState().updateDevice(sourceDev.id, { connections: sourceDev.connections.filter(c => c.id !== connId) }); });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-4 md:p-6 border-b border-[var(--border)] shrink-0 flex items-center justify-between gap-3"><div className="text-xl font-black text-[var(--text)]">{title}</div><button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button></div>
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <form id="device-form" className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <div><label className="text-xs text-[var(--muted)]">{t("fCat", lang)}</label><select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.category} onChange={input("category") as any}>{(["Network", "Storage", "Server", "Accessory", "Other"] as DeviceCategory[]).map((x) => (<option key={x} value={x}>{x}</option>))}</select></div>
            <div>
              <label className="text-xs text-[var(--muted)]">{t("fName", lang)}</label>
              {d.category === "Accessory" ? (
                <select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={d.name} onChange={handleAccSelect}><option value="" disabled>Select...</option>{accOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}{d.name && !accOptions.includes(d.name) && <option value={d.name}>{d.name} (Custom)</option>}</select>
              ) : <input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={d.name} onChange={input("name")} />}
            </div>
            {d.category !== "Accessory" && (
              <>
                <div><label className="text-xs text-[var(--muted)]">{t("fId", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={d.deviceId} onChange={input("deviceId")} placeholder="EX: SW-01" /></div>
                <div><label className="text-xs text-[var(--muted)]">{t("fBrand", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.brand} onChange={input("brand")} /></div>
                <div><label className="text-xs text-[var(--muted)]">{t("fModel", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.model} onChange={input("model")} /></div>
                <div><label className="text-xs text-[var(--muted)]">{t("fPorts", lang)}</label><input type="number" min={0} className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.ports} onChange={(e) => setD((p) => ({ ...p, ports: Number(e.target.value) || 0 }))} /></div>
              </>
            )}
            <div><label className="text-xs text-[var(--muted)]">{t("fU", lang)}</label><input type="number" min={1} max={42} className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.sizeU} onChange={(e) => setD((p) => ({ ...p, sizeU: Number(e.target.value) || 1 }))} /></div>
            {d.category !== "Accessory" && (
              <>
                <div><label className="text-xs text-[var(--muted)]">{t("fIp", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.ip ?? ""} onChange={input("ip")} placeholder="10.0.0.10" /></div>
                <div className="md:col-span-2"><label className="text-xs text-[var(--muted)]">{t("fSn", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={d.serial ?? ""} onChange={input("serial")} /></div>
              </>
            )}
            {d.category !== "Accessory" && (
              <div className="md:col-span-2 mt-2 p-4 bg-[var(--panel2)] border border-[var(--border)] rounded-2xl">
                <div className="flex justify-between items-center mb-3"><label className="text-sm font-bold text-[var(--text)] flex items-center gap-2"><Link2 size={16} className="text-[var(--accent)]" /> {t("cableRouting", lang)}</label><button type="button" onClick={addConn} className="text-xs bg-[var(--accent)] text-black px-3 py-1.5 rounded-lg font-bold hover:opacity-90 flex items-center gap-1"><Plus size={14} /> {t("addConnection", lang)}</button></div>
                {(localConns.length === 0 && incomingConns.length === 0) ? (<div className="text-xs text-[var(--muted)] italic">No Connections.</div>) : (
                  <div className="space-y-2">
                    {localConns.map((c, i) => (
                      <div key={c.id} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-[var(--panel)] p-2 rounded-xl border border-[var(--border)]">
                        <div className="text-[10px] bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-1 rounded border border-[var(--accent)]/30 whitespace-nowrap">{t("outgoingConn", lang)}</div>
                        <input placeholder={t("localPort", lang)} value={c.localPort} onChange={e => updateConn(i, 'localPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                        <span className="text-[var(--muted)] text-xs hidden md:block">{'->'}</span>
                        <select value={c.targetId} onChange={e => updateConn(i, 'targetId', e.target.value)} className="flex-1 w-full md:w-0 bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-xs p-1 outline-none text-[var(--text)]"><option value="">{t("selectDevice", lang)}</option>{devices.filter(x => x.id !== deviceId && x.category !== "Accessory").map(x => <option key={x.id} value={x.id}>{x.deviceId} - {x.name}</option>)}</select>
                        <input placeholder={t("targetPort", lang)} value={c.targetPort} onChange={e => updateConn(i, 'targetPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                        <button type="button" onClick={() => removeConn(i)} className="p-1 text-red-400 hover:bg-white/10 rounded w-full md:w-auto flex justify-center"><X size={16}/></button>
                      </div>
                    ))}
                    {incomingConns.map((inc, i) => {
                      const sourceDev = devices.find(x => x.id === inc.sourceDevId); const sourceName = sourceDev ? sourceDev.name : t("unknownDev", lang);
                      return (
                        <div key={inc.conn.id} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-[var(--panel)] p-2 rounded-xl border border-[var(--border)]">
                          <div className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 whitespace-nowrap">{t("incomingConn", lang)}</div>
                          <input placeholder={t("localPort", lang)} value={inc.conn.targetPort} onChange={e => updateIncoming(i, 'targetPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                          <span className="text-[var(--muted)] text-xs hidden md:block">{'<-'}</span>
                          <div className="flex-1 w-full md:w-0 bg-black/10 border border-[var(--border)] rounded-lg text-xs p-1.5 text-[var(--text)] truncate">{sourceDev?.deviceId} - {sourceName}</div>
                          <input placeholder={t("targetPort", lang)} value={inc.conn.localPort} onChange={e => updateIncoming(i, 'localPort', e.target.value)} className="w-full md:w-[20%] bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs p-1 outline-none text-[var(--text)]" />
                          <button type="button" onClick={() => removeIncoming(i)} className="p-1 text-red-400 hover:bg-white/10 rounded w-full md:w-auto flex justify-center"><X size={16}/></button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="md:col-span-2"><label className="text-xs text-[var(--muted)]">{t("fNote", lang)}</label><textarea className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" rows={2} value={d.portMap ?? ""} onChange={(e) => { setD((p) => ({ ...p, portMap: e.target.value })); }} /></div>
          </form>
        </div>
        <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--text)]">{t("btnCancel", lang)}</button><button type="submit" form="device-form" className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90">{t("btnSave", lang)}</button></div>
      </motion.div>
    </div>
  );
}

/* -----------------------------
  Pages
----------------------------- */
const IssuesPage = () => {
  const issues = useStore((s) => s.issues); const lang = useStore((s) => s.lang); const role = useStore((s) => s.role); const userName = useStore((s) => s.userName); const addIssue = useStore((s) => s.addIssue); const updateIssueStatus = useStore((s) => s.updateIssueStatus); const deleteIssue = useStore((s) => s.deleteIssue); const addIssueReply = useStore((s) => s.addIssueReply);
  const [creating, setCreating] = useState(false); const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null); const isAdmin = role === "admin"; const selectedIssue = issues.find(i => i.id === selectedIssueId);

  const NewIssueModal = () => {
    const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col">
          <div className="p-4 md:p-6 border-b border-[var(--border)] flex justify-between items-center"><div className="text-xl font-black text-[var(--text)]">{t("addIssue", lang)}</div><button onClick={() => setCreating(false)} className="p-2 rounded-xl hover:bg-white/5"><X /></button></div>
          <div className="p-4 md:p-6 flex-1 space-y-4"><div><label className="text-xs text-[var(--muted)]">{t("issueTitle", lang)}</label><input autoFocus className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={title} onChange={(e) => setTitle(e.target.value)} /></div><div><label className="text-xs text-[var(--muted)]">{t("issueDesc", lang)}</label><textarea className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] min-h-[120px] text-[var(--text)]" value={desc} onChange={(e) => setDesc(e.target.value)} /></div></div>
          <div className="p-4 md:p-6 border-t border-[var(--border)] flex justify-end gap-3"><button onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--text)]">{t("btnCancel", lang)}</button><button onClick={() => { if(!title.trim()) return; addIssue(title, desc); setCreating(false); }} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 flex items-center gap-2"><MessageSquare size={16}/> {t("issueSubmit", lang)}</button></div>
        </motion.div>
      </div>
    );
  };

  const IssueDetailModal = ({ issue }: { issue: Issue }) => {
    const [replyText, setReplyText] = useState("");
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[90dvh]">
          <div className="p-4 md:p-6 border-b border-[var(--border)] flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2 mb-1"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${issue.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>{issue.status === 'resolved' ? t("issueResolved", lang) : t("issueOpen", lang)}</span><span className="text-xs text-[var(--muted)]">{formatDate(issue.createdAt)}</span></div><div className="text-xl font-black text-[var(--text)] break-words">{issue.title}</div></div><button onClick={() => setSelectedIssueId(null)} className="p-2 rounded-xl hover:bg-white/5 shrink-0"><X /></button></div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg)] space-y-4">
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-4 shadow-sm"><div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-black font-bold text-xs">{issue.author.charAt(0).toUpperCase()}</div><div className="text-sm font-bold text-[var(--text)]">{issue.author}</div></div><div className="text-sm text-[var(--text)] whitespace-pre-wrap break-words ml-8">{issue.description}</div></div>
            {issue.replies.map(r => (<div key={r.id} className={`flex flex-col max-w-[85%] ${r.author === userName ? 'ml-auto items-end' : 'mr-auto items-start'}`}><div className="flex items-center gap-1.5 mb-1 px-1"><span className="text-[10px] font-bold text-[var(--muted)]">{r.author}</span><span className="text-[9px] text-[var(--muted)] opacity-60">{formatDate(r.createdAt)}</span></div><div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm ${r.author === userName ? 'bg-[var(--accent)] text-black rounded-tr-sm' : 'bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-tl-sm'}`}>{r.text}</div></div>))}
          </div>
          <div className="p-4 md:p-6 border-t border-[var(--border)] bg-[var(--panel)] shrink-0">
            <div className="flex gap-2"><input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && replyText.trim()){ addIssueReply(issue.id, replyText); setReplyText(""); } }} placeholder={t("replyText", lang)} className="flex-1 bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" /><button onClick={() => { if(!replyText.trim()) return; addIssueReply(issue.id, replyText); setReplyText(""); }} className="bg-[var(--text)] text-[var(--bg)] px-4 py-2.5 rounded-xl font-bold hover:opacity-90">{t("replySubmit", lang)}</button></div>
            {isAdmin && (<div className="mt-4 flex items-center justify-between pt-4 border-t border-[var(--border)]"><button onClick={() => { deleteIssue(issue.id); setSelectedIssueId(null); }} className="text-xs text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1"><Trash2 size={14}/> {t("deleteIssue", lang)}</button><button onClick={() => updateIssueStatus(issue.id, issue.status === 'open' ? 'resolved' : 'open')} className={`text-xs px-4 py-1.5 rounded-lg font-bold flex items-center gap-1 ${issue.status === 'open' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : 'bg-[var(--panel2)] text-[var(--text)] hover:bg-white/10'}`}>{issue.status === 'open' ? <><CheckCircle2 size={14}/> {t("markResolved", lang)}</> : t("reopenIssue", lang)}</button></div>)}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-wrap gap-3 justify-between items-end mb-6"><div><h2 className="text-2xl font-black text-[var(--accent)] flex items-center gap-2"><AlertCircle /> {t("issuesTitle", lang)}</h2></div><button onClick={() => setCreating(true)} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 flex items-center gap-2"><Plus size={16} /> {t("addIssue", lang)}</button></div>
      {issues.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center text-[var(--muted)] opacity-60"><CheckCircle2 size={48} className="mb-4" /><div className="font-bold">{t("noIssues", lang)}</div></div>) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {issues.map(i => (<div key={i.id} onClick={() => setSelectedIssueId(i.id)} className="bg-[var(--panel)] border border-[var(--border)] p-4 rounded-2xl cursor-pointer hover:border-[var(--accent)] hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all group"><div className="flex items-start justify-between gap-2 mb-2"><div className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${i.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>{i.status === 'resolved' ? t("issueResolved", lang) : t("issueOpen", lang)}</div><div className="text-xs font-medium text-[var(--muted)] flex items-center gap-1"><MessageSquare size={12}/> {i.replies.length}</div></div><div className="font-bold text-lg text-[var(--text)] mb-1 truncate">{i.title}</div><div className="text-xs text-[var(--muted)] truncate mb-3">{i.description}</div><div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]"><div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-[var(--panel2)] flex items-center justify-center text-[10px] font-bold text-[var(--text)]">{i.author.charAt(0).toUpperCase()}</div><span className="text-xs font-bold text-[var(--text)]">{i.author}</span></div><div className="text-[10px] text-[var(--muted)]">{formatDate(i.createdAt).split(" ")[0]}</div></div></div>))}
        </div>
      )}
      {creating && <NewIssueModal />}{selectedIssue && <IssueDetailModal issue={selectedIssue} />}
    </div>
  );
};

const AdminPage = () => {
  const role = useStore((s) => s.role); const accounts = useStore((s) => s.accounts); const upsertAccount = useStore((s) => s.upsertAccount); const deleteAccount = useStore((s) => s.deleteAccount); const lang = useStore((s) => s.lang);
  const [editing, setEditing] = useState<Account | null>(null); const [creating, setCreating] = useState(false);
  if (role !== "admin") return null;

  const Modal = ({ title, initial, onClose }: { title: string; initial: Account; onClose: () => void; }) => {
    const [a, setA] = useState<Account>(initial); const isAdminAccount = a.username === "admin";
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl flex flex-col max-h-[85dvh]">
          <div className="p-4 md:p-6 border-b border-[var(--border)] shrink-0 flex items-center justify-between"><div className="text-xl font-black flex items-center gap-2"><KeyRound className="text-[var(--accent)]" /> {title}</div><button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X /></button></div>
          <div className="p-4 md:p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs text-[var(--muted)]">{t("account", lang)}</label><input className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={a.username} onChange={(e) => setA((p) => ({ ...p, username: e.target.value }))} disabled={!creating} /></div><div><label className="text-xs text-[var(--muted)]">{t("role", lang)}</label><select className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none text-[var(--text)]" value={a.role} onChange={(e) => setA((p) => ({ ...p, role: e.target.value as Role }))} disabled={isAdminAccount}><option value="admin">Admin</option><option value="cable">Cable</option><option value="vendor">Vendor</option></select></div><div className="md:col-span-2"><label className="text-xs text-[var(--muted)]">{t("password", lang)}</label><input type="password" className="mt-1 w-full bg-[var(--panel2)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text)]" value={a.password} onChange={(e) => setA((p) => ({ ...p, password: e.target.value }))} /></div></div>
          <div className="p-4 md:p-6 border-t border-[var(--border)] shrink-0 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--text)]">{t("btnCancel", lang)}</button><button onClick={() => { const res = upsertAccount(a); if (!res.ok) return alert(res.message); onClose(); }} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-extrabold hover:opacity-90 flex items-center gap-2"><Save size={16} /> {t("btnSave", lang)}</button></div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6"><div className="flex items-center justify-between gap-3 flex-wrap"><div><div className="flex items-center gap-2"><Shield className="text-[var(--accent)]" /><div className="text-lg font-black text-[var(--text)]">{t("navAdmin", lang)}</div></div></div><button onClick={() => { setCreating(true); setEditing({ username: "", password: "", role: "vendor" }); }} className="bg-[var(--accent)] text-black px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 hover:opacity-90"><Plus size={18} /> {t("addAccount", lang)}</button></div>
        <div className="mt-5 bg-[var(--panel2)] border border-[var(--border)] rounded-2xl overflow-hidden"><table className="w-full text-left"><thead className="bg-black/20 text-[var(--muted)] text-xs uppercase tracking-wider"><tr><th className="px-4 py-3 font-semibold">{t("account", lang)}</th><th className="px-4 py-3 font-semibold">{t("role", lang)}</th><th className="px-4 py-3 font-semibold">{t("action", lang)}</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{accounts.slice().sort((a, b) => a.username === "admin" ? -1 : b.username === "admin" ? 1 : a.username.localeCompare(b.username)).map((a) => (<tr key={a.username} className="hover:bg-white/[0.03]"><td className="px-4 py-3"><div className="font-black text-[var(--text)]">{a.username}</div></td><td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--muted)] capitalize">{a.role}</span></td><td className="px-4 py-3"><div className="flex gap-2 flex-wrap"><button onClick={() => { setCreating(false); setEditing(a); }} className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 flex items-center gap-2 text-sm text-[var(--text)]"><Edit3 size={16} /> {t("btnEdit", lang)}</button><button onClick={() => { const res = deleteAccount(a.username); if (!res.ok) return alert(res.message); }} disabled={a.username === "admin"} className={`px-3 py-2 rounded-xl border border-[var(--border)] flex items-center gap-2 text-sm ${a.username === "admin" ? "opacity-50 cursor-not-allowed text-[var(--muted)]" : "hover:bg-white/5 text-red-400"}`}><Trash2 size={16} /> {t("btnDel", lang)}</button></div></td></tr>))}</tbody></table></div>
      </div>
      {editing && <Modal title={creating ? t("addAccount", lang) : t("editAccount", lang)} initial={editing} onClose={() => { setEditing(null); setCreating(false); }} />}
    </div>
  );
};

/* -----------------------------
  App Skeleton & Routing
----------------------------- */
function useFullscreen() { const [isFs, setIsFs] = useState(false); useEffect(() => { const onChange = () => setIsFs(!!document.fullscreenElement); document.addEventListener("fullscreenchange", onChange); return () => document.removeEventListener("fullscreenchange", onChange); }, []); const toggle = async () => { try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch {} }; return { isFs, toggle }; }

export default function App() {
  useApplyTheme();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "migratePro", "mainState"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.devices) { const normalized = normalizeDevices(data.devices); useStore.setState({ devices: normalized }); writeJson(LS.devices, normalized); }
        if (data.accounts) { useStore.setState({ accounts: data.accounts }); writeJson(LS.accounts, data.accounts); }
        if (data.issues) { useStore.setState({ issues: data.issues }); writeJson(LS.issues, data.issues); }
        if (data.tasks) { useStore.setState({ tasks: data.tasks }); writeJson(LS.tasks, data.tasks); }
        if (data.projectInfo) { useStore.setState({ projectInfo: data.projectInfo }); writeJson(LS.projectInfo, data.projectInfo); }
      } else {
        const s = useStore.getState(); syncToCloudFull({ devices: s.devices, accounts: s.accounts, issues: s.issues, tasks: s.tasks, projectInfo: s.projectInfo });
      }
    });
    return () => unsub();
  }, []);

  const isAuthed = useStore((s) => s.isAuthed); const userName = useStore((s) => s.userName); const role = useStore((s) => s.role); const logout = useStore((s) => s.logout); const page = useStore((s) => s.page); const setPage = useStore((s) => s.setPage); const theme = useStore((s) => s.theme); const toggleTheme = useStore((s) => s.toggleTheme); const themeStyle = useStore((s) => s.themeStyle); const setThemeStyle = useStore((s) => s.setThemeStyle); const lang = useStore((s) => s.lang); const setLang = useStore((s) => s.setLang); const ui = useStore((s) => s.ui); const setUi = useStore((s) => s.setUi); const selectedDeviceId = useStore((s) => s.selectedDeviceId); const setSelectedDeviceId = useStore((s) => s.setSelectedDeviceId);
  const { isFs, toggle: toggleFs } = useFullscreen();

  const navItems = useMemo(() => {
    const base = [
      { id: "dashboard" as const, label: t("navDashboard", lang), icon: <LayoutDashboard size={20} /> },
      { id: "devices" as const, label: t("navDevices", lang), icon: <Server size={20} /> },
      { id: "before" as const, label: t("navBefore", lang), icon: <ArrowLeftRight size={20} /> },
      { id: "after" as const, label: t("navAfter", lang), icon: <ArrowRightLeft size={20} /> },
      { id: "runbook" as const, label: t("navRunbook", lang), icon: <CalendarClock size={20} /> },
      { id: "issues" as const, label: t("navIssues", lang), icon: <AlertCircle size={20} /> },
      { id: "guide" as const, label: t("navGuide", lang), icon: <BookOpen size={20} /> },
    ];
    if (role === "admin") base.push({ id: "admin" as const, label: t("navAdmin", lang), icon: <Shield size={20} /> });
    return base;
  }, [role, lang]);

  if (!isAuthed) return <LoginPage />;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300 flex flex-col" style={{ fontFamily: lang === 'ko' ? '"Pretendard", sans-serif' : undefined }}>
      <ThemeTokens />
      <header className="h-16 border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-black bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)]"><Server size={18} /></div><h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic">Migrate<span className="text-[var(--accent)]">Pro</span></h1></div>
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={toggleFs} className="p-2 hover:bg-white/5 rounded-xl">{isFs ? <Minimize size={18} /> : <Expand size={18} />}</button>
          <button onClick={() => { if (lang === "zh") setLang("en"); else if (lang === "en") setLang("ko"); else setLang("zh"); }} className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--panel2)] border border-[var(--border)] hover:bg-white/5 transition-colors"><Globe size={14} className="text-[var(--accent)]" /><span className="text-xs font-bold w-9 text-center text-[var(--text)]">{t("langToggle", lang)}</span></button>
          <select value={themeStyle} onChange={(e) => setThemeStyle(e.target.value as ThemeStyle)} className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-xs px-2 py-1 outline-none hidden md:block text-[var(--text)]"><option value="neon">Neon</option><option value="horizon">Horizon</option><option value="nebula">Nebula</option><option value="matrix">Matrix</option></select>
          <button onClick={toggleTheme} className="p-2 hover:bg-white/5 rounded-xl">{theme === "dark" ? "🌙" : "☀️"}</button>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-black/10"><User size={16} className="text-[var(--muted)]" /><span className="text-sm font-bold">{userName || "-"}</span><span className="text-xs px-2 py-0.5 rounded-lg border border-[var(--border)] text-[var(--muted)] capitalize">{role}</span><button onClick={logout} className="ml-1 p-1 rounded-lg hover:bg-white/10" title="Logout"><LogOut size={16} className="text-[var(--muted)]" /></button></div>
          <button onClick={logout} className="md:hidden p-2 hover:bg-white/5 rounded-xl"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className={`border-r border-[var(--border)] h-[calc(100vh-64px)] sticky top-16 p-4 bg-[var(--panel)] hidden lg:block transition-all ${ui.sideCollapsed ? "w-20" : "w-64"}`}>
          <div className="flex justify-end mb-3"><button onClick={() => setUi({ sideCollapsed: !ui.sideCollapsed })} className="p-2 rounded-xl hover:bg-white/5">{ui.sideCollapsed ? <ChevronsRight /> : <ChevronsLeft />}</button></div>
          <div className="space-y-2">{navItems.map((item) => (<button key={item.id} onClick={() => setPage(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${page === item.id ? "bg-[var(--panel2)] text-[var(--accent)] border border-[var(--border)] shadow-[0_0_20px_rgba(34,211,238,0.1)] font-black" : "text-[var(--muted)] hover:bg-white/[0.03]"}`} title={item.label}>{item.icon}{!ui.sideCollapsed && item.label}</button>))}</div>
        </nav>
        <main className="flex-1 min-w-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="min-h-full">
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
          <button key={item.id} onClick={() => setPage(item.id)} className={`p-3 rounded-full transition-all shrink-0 ${page === item.id ? "text-white bg-[var(--accent)] shadow-[0_0_15px_rgba(34,211,238,0.5)]" : "text-[var(--muted)] hover:bg-white/10"}`} title={item.label}>{item.icon}</button>
        ))}
      </div>
      {selectedDeviceId && <DeviceDetailModal id={selectedDeviceId} mode={page === "after" ? "after" : "before"} onClose={() => setSelectedDeviceId(null)} />}
    </div>
  );
}