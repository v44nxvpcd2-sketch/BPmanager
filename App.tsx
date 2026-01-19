
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Plus, Target, Network, GalleryHorizontal, 
  User, Users, ChevronLeft, ChevronRight, X, LayoutGrid, 
  Trash2, AlertCircle, MoreHorizontal, Search, Filter, ArrowUp, Download, Upload,
  GitBranch, CheckCircle2, Clock, Info, Activity, GripHorizontal, Pin, Settings2, Bell
} from 'lucide-react';
import { Project, Member, LayoutMode, Quarter } from './types';
import { INITIAL_MEMBERS, MEMBER_COLORS, BENTO_CARD_STYLE, RADIUS_CLASS, BENTO_CARD_HOVER, CANVAS_CENTER_X, CANVAS_CENTER_Y, CANVAS_RADIUS_L1, CANVAS_RADIUS_L2_OFFSET } from './constants';
import { DataService } from './services/dataService';
import { calculateAnnualStats, getMostUrgentTask, getTaskStatus } from './utils';

// --- Visual Components ---

// Redesigned Black Pin Icon (Clean, Realistic)
const BlackPin = () => (
  <div className="relative w-8 h-8 flex items-center justify-center -mt-2 drop-shadow-md transition-transform hover:scale-110">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <radialGradient id="pinHead" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#666" />
            <stop offset="100%" stopColor="#000" />
         </radialGradient>
         <linearGradient id="needle" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#999" />
            <stop offset="100%" stopColor="#666" />
         </linearGradient>
       </defs>
       {/* Needle */}
       <rect x="15" y="16" width="2" height="14" fill="url(#needle)" rx="1" />
       {/* Head (Spherical) */}
       <circle cx="16" cy="10" r="7" fill="url(#pinHead)" stroke="#333" strokeWidth="0.5" />
       {/* Highlight on head */}
       <ellipse cx="14" cy="8" rx="2" ry="1" fill="rgba(255,255,255,0.4)" transform="rotate(-30 14 8)" />
    </svg>
  </div>
);

const TaskNotificationBubble: React.FC<{ task: any }> = ({ task }) => {
  if (!task) return null;
  const status = getTaskStatus(task);
  const isOverdue = status.status === 'overdue';
  
  return (
    <div className="absolute -top-4 -right-4 z-50 animate-in zoom-in duration-300 hover:scale-110 transition-transform cursor-pointer pointer-events-none">
       <div className={`relative flex items-center gap-2 px-3 py-2 rounded-xl shadow-[0_8px_16px_-4px_rgba(0,0,0,0.2)] border-2 border-white ${isOverdue ? 'bg-black text-white' : 'bg-[#eaff00] text-black'}`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${isOverdue ? 'bg-red-500 animate-pulse' : 'bg-black'}`}></div>
          <div className="flex flex-col">
             <span className="text-[9px] font-black uppercase tracking-wider leading-none opacity-80 mb-0.5">{status.label}</span>
             <span className="text-[10px] font-bold max-w-[120px] truncate leading-none">{task.name}</span>
          </div>
          {/* Triange/Tail for speech bubble effect */}
          <div className={`absolute top-full right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${isOverdue ? 'border-t-black' : 'border-t-[#eaff00]'}`}></div>
       </div>
    </div>
  );
};

const Avatar: React.FC<{ member: Member | null; size?: "sm" | "md" | "lg"; className?: string }> = ({ member, size = "sm", className = "" }) => {
  const sizeClass = size === "sm" ? "w-6 h-6 text-[10px]" : size === "md" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (!member) return (
    <div className={`${sizeClass} rounded-full bg-gray-100 text-gray-400 flex items-center justify-center border border-gray-200 ${className}`}>
      <User size={size === "sm" ? 12 : 14} />
    </div>
  );
  return (
    <div className={`${sizeClass} rounded-full ${member.color} flex items-center justify-center font-bold border border-white shadow-sm ${className}`} title={member.name}>
      {member.name.charAt(0)}
    </div>
  );
};

const MemberSelector: React.FC<{ currentMemberId: string | null; members: Member[]; onSelect: (id: string | null) => void }> = ({ currentMemberId, members, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const currentMember = members.find(m => m.id === currentMemberId) || null;
  return (
    <div className="relative" ref={wrapperRef} onMouseDown={e => e.stopPropagation()}>
      <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none hover:scale-110 transition-transform">
        <Avatar member={currentMember} size="sm" />
      </button>
      {isOpen && (
        <div className={`absolute right-0 top-10 z-50 bg-white shadow-xl border border-gray-100 p-2 w-40 ${RADIUS_CLASS} flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto custom-scrollbar`}>
          <div className="text-[10px] text-gray-400 font-bold px-2 py-1 uppercase tracking-widest border-b border-gray-100 mb-2">Assign To</div>
          {members.map(m => (
            <button key={m.id} onClick={() => { onSelect(m.id); setIsOpen(false); }} className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-xs text-left transition-all ${currentMemberId === m.id ? 'bg-[#eaff00] text-black font-bold' : 'text-gray-600'}`}>
              <div className={`w-4 h-4 rounded-full ${m.color} flex items-center justify-center text-[8px]`}>{m.name.charAt(0)}</div>
              {m.name}
            </button>
          ))}
          <button onClick={() => { onSelect(null); setIsOpen(false); }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-xs text-gray-400 text-left">
            <div className="w-4 h-4 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-[8px]"><X size={8}/></div>
            Unassigned
          </button>
        </div>
      )}
    </div>
  );
};

const ConfirmModal: React.FC<{ 
  isOpen: boolean; 
  title: string; 
  message: string; 
  confirmText?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void; 
  onCancel: () => void;
}> = ({ isOpen, title, message, confirmText = "確認", confirmVariant = "danger", onConfirm, onCancel }) => {
  if (!isOpen) return null;
  const isDanger = confirmVariant === "danger";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onCancel} />
      <div className="bg-white w-full max-w-md p-8 rounded-[32px] shadow-2xl z-10 border border-gray-100 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDanger ? 'bg-black text-white' : 'bg-[#eaff00] text-black'}`}>
            {isDanger ? <AlertCircle size={24} /> : <Info size={24} />}
          </div>
          <h3 className="text-xl font-bold text-black">{title}</h3>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">{message}</p>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 rounded-2xl font-bold text-xs transition-all text-gray-500">取消</button>
          <button onClick={onConfirm} className={`flex-1 py-4 rounded-2xl font-bold text-xs transition-all shadow-lg ${isDanger ? 'bg-black text-white hover:bg-gray-800' : 'bg-[#eaff00] text-black hover:bg-[#d6e600]'}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

const DoubleCircularProgress: React.FC<{ 
  innerValue: number; 
  outerValue: number; 
  size?: number; 
  strokeWidth?: number 
}> = ({ innerValue, outerValue, size = 180, strokeWidth = 8 }) => {
  const center = size / 2;
  // Outer circle (Tasks)
  const r2 = (size / 2) - strokeWidth;
  const c2 = 2 * Math.PI * r2;
  const offset2 = c2 - (Math.min(100, Math.max(0, outerValue)) / 100) * c2;
  
  // Inner circle (KPIs) - gap of strokeWidth * 1.5
  const r1 = r2 - strokeWidth * 2;
  const c1 = 2 * Math.PI * r1;
  const offset1 = c1 - (Math.min(100, Math.max(0, innerValue)) / 100) * c1;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Outer Track */}
      <circle cx={center} cy={center} r={r2} stroke="#f2f2f2" strokeWidth={strokeWidth} fill="none" />
      {/* Outer Progress (Black - Tasks) */}
      <circle 
        cx={center} cy={center} r={r2} 
        stroke="black" strokeWidth={strokeWidth} fill="none" 
        strokeDasharray={c2} strokeDashoffset={offset2} 
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
      
      {/* Inner Track */}
      <circle cx={center} cy={center} r={r1} stroke="#f2f2f2" strokeWidth={strokeWidth} fill="none" />
      {/* Inner Progress (Neon Yellow - KPI) */}
      <circle 
        cx={center} cy={center} r={r1} 
        stroke="#eaff00" strokeWidth={strokeWidth} fill="none" 
        strokeDasharray={c1} strokeDashoffset={offset1} 
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

// --- Modules ---
import WeeklyStripCalendar from './components/Calendar/WeeklyStripCalendar';
import MemberPanel from './components/Member/MemberPanel';
import ProjectDetail from './components/Project/ProjectDetail';
import StrategyDetail from './components/Strategy/StrategyDetail';

// Helper to sanitize imported data to avoid crashes (White Screen of Death)
const sanitizeProjectData = (projects: any[]): Project[] => {
  if (!Array.isArray(projects)) return [];
  
  const sanitizeQuarter = (q: any, id: string): Quarter => ({
    id: q?.id || id,
    objective: q?.objective || '',
    budget: typeof q?.budget === 'number' ? q.budget : 0,
    spent: typeof q?.spent === 'number' ? q.spent : 0,
    kpis: Array.isArray(q?.kpis) ? q.kpis : [],
    tasks: Array.isArray(q?.tasks) ? q.tasks : [],
  });

  const sanitizeRecursive = (p: any): Project => ({
    id: p.id || Date.now().toString(),
    name: p.name || 'Untitled Project',
    owner: p.owner || null,
    annualObjective: p.annualObjective || '',
    weight: typeof p.weight === 'number' ? p.weight : 1,
    quarters: {
      q1: sanitizeQuarter(p.quarters?.q1, 'q1'),
      q2: sanitizeQuarter(p.quarters?.q2, 'q2'),
      q3: sanitizeQuarter(p.quarters?.q3, 'q3'),
      q4: sanitizeQuarter(p.quarters?.q4, 'q4'),
    },
    subProjects: Array.isArray(p.subProjects) ? p.subProjects.map(sanitizeRecursive) : []
  });

  return projects.map(sanitizeRecursive);
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showStrategyDetail, setShowStrategyDetail] = useState(false);
  const [hubTitle, setHubTitle] = useState("2026 Strategy Hub");
  
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('radial');
  const [zoom, setZoom] = useState(0.85);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmState, setConfirmState] = useState<any>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Canvas State: Node Dragging
  const [nodePositions, setNodePositions] = useState<Record<string, {x: number, y: number}>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const nodeStartRef = useRef<{x: number, y: number} | null>(null);

  // Canvas State: Panning (Background Drag)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    const loadedProjects = DataService.loadProjects();
    const loadedMembers = DataService.loadMembers();
    if (loadedProjects) setProjects(sanitizeProjectData(loadedProjects));
    if (loadedMembers && loadedMembers.length > 0) setMembers(loadedMembers);
    DataService.onSync((type, data) => {
      if (type === 'PROJECTS_UPDATED') setProjects(sanitizeProjectData(data));
      if (type === 'MEMBERS_UPDATED') setMembers(data);
    });
  }, []);

  useEffect(() => { DataService.saveProjects(projects); }, [projects]);
  useEffect(() => { DataService.saveMembers(members); }, [members]);

  // --- Handlers ---

  // 1. Node Dragging
  const handleMouseDown = (e: React.MouseEvent, id: string, currentX: number, currentY: number) => {
    if (layoutMode !== 'radial') return;
    e.stopPropagation(); 
    e.preventDefault(); // FIX: Prevents text selection while dragging pins
    
    setDraggingId(id);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    nodeStartRef.current = { x: currentX, y: currentY };
  };

  // 2. Background Panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (layoutMode !== 'radial') return;
    // Only pan if clicking on the background (not if interacting with UI)
    // The visual elements stopPropagation, so if we get here, it's safe.
    e.preventDefault(); // Prevent default browser drag behaviors
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  // 3. Global Mouse Move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Handle Node Dragging
    if (draggingId && dragStartRef.current && nodeStartRef.current) {
      const deltaX = (e.clientX - dragStartRef.current.x) / zoom;
      const deltaY = (e.clientY - dragStartRef.current.y) / zoom;
      const startX = nodeStartRef.current.x;
      const startY = nodeStartRef.current.y;

      setNodePositions(prev => ({
        ...prev,
        [draggingId]: { x: startX + deltaX, y: startY + deltaY }
      }));
    }

    // Handle Canvas Panning
    if (isPanning && panStartRef.current) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  }, [draggingId, isPanning, zoom]);

  // 4. Global Mouse Up
  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
    dragStartRef.current = null;
    nodeStartRef.current = null;
    
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  useEffect(() => {
    if (draggingId || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, isPanning, handleMouseMove, handleMouseUp]);

  // Project Management Actions (deleteProject, addProject, etc. - kept same)
  const deleteProject = useCallback((id: string) => {
    setConfirmState({
      isOpen: true, title: '刪除業務項目', message: '確定要永久刪除此業務項目嗎？',
      onConfirm: () => {
        const recursiveDelete = (list: Project[]): Project[] => list.filter(p => p.id !== id).map(p => ({ ...p, subProjects: p.subProjects ? recursiveDelete(p.subProjects) : [] }));
        setProjects(prev => recursiveDelete([...prev]));
        setSelectedProjectId(null); setConfirmState(null);
      }
    });
  }, []);

  const addProject = useCallback(() => {
    const emptyQ = (id: string) => ({ id, objective: '', budget: 0, spent: 0, kpis: [], tasks: [] });
    const newId = Date.now().toString();
    const newP: Project = {
      id: newId, name: '新業務項目', owner: null, annualObjective: '', weight: 1,
      quarters: { q1: emptyQ('q1'), q2: emptyQ('q2'), q3: emptyQ('q3'), q4: emptyQ('q4') },
      subProjects: []
    };
    setProjects(prev => [...prev, newP]);
    setSelectedProjectId(newId);
  }, []);

  const addSubProject = useCallback((parentId: string) => {
    let canAdd = true;
    const checkLimit = (list: Project[]) => {
      list.forEach(p => {
        if (p.id === parentId) {
          if ((p.subProjects?.length || 0) >= 5) { canAdd = false; }
        } else if (p.subProjects) {
          checkLimit(p.subProjects);
        }
      });
    }
    checkLimit(projects);

    if (!canAdd) {
      alert("每個業務項目最多只能有 5 個子計畫。");
      return;
    }

    const emptyQ = (id: string) => ({ id, objective: '', budget: 0, spent: 0, kpis: [], tasks: [] });
    const newId = Date.now().toString();
    const newSub: Project = {
      id: newId, name: '新子項目', owner: null, annualObjective: '', weight: 1,
      quarters: { q1: emptyQ('q1'), q2: emptyQ('q2'), q3: emptyQ('q3'), q4: emptyQ('q4') },
      subProjects: []
    };
    const recursiveAdd = (list: Project[]): Project[] => list.map(p => {
      if (p.id === parentId) return { ...p, subProjects: [...(p.subProjects || []), newSub] };
      if (p.subProjects) return { ...p, subProjects: recursiveAdd(p.subProjects) };
      return p;
    });
    setProjects(prev => recursiveAdd([...prev]));
    setSelectedProjectId(newId);
  }, [projects]);

  const updateProjectProperty = useCallback((pid: string, field: keyof Project, value: any) => {
    const recursiveUpdate = (list: Project[]): Project[] => list.map(p => {
      if (p.id === pid) return { ...p, [field]: value };
      if (p.subProjects) return { ...p, subProjects: recursiveUpdate(p.subProjects) };
      return p;
    });
    setProjects(prev => recursiveUpdate([...prev]));
  }, []);

  const updateQuarterData = useCallback((pid: string, qid: keyof Project['quarters'], field: keyof Quarter, value: any) => {
    const recursiveUpdate = (list: Project[]): Project[] => list.map(p => {
      if (p.id === pid) return { ...p, quarters: { ...p.quarters, [qid]: { ...p.quarters[qid], [field]: value } } };
      if (p.subProjects) return { ...p, subProjects: recursiveUpdate(p.subProjects) };
      return p;
    });
    setProjects(prev => recursiveUpdate([...prev]));
  }, []);
  
  const deleteTask = useCallback((pid: string, qid: string, tid: string) => {
      const recursiveDelete = (list: Project[]): Project[] => list.map(p => {
        if (p.id === pid) {
          const qKey = qid as keyof typeof p.quarters;
          return { ...p, quarters: { ...p.quarters, [qKey]: { ...p.quarters[qKey], tasks: p.quarters[qKey].tasks.filter(t => t.id !== tid) } } };
        }
        if (p.subProjects) return { ...p, subProjects: recursiveDelete(p.subProjects) };
        return p;
      });
      setProjects(prev => recursiveDelete([...prev]));
  }, []);

  const deleteKpi = useCallback((pid: string, qid: string, kid: string) => {
      const recursiveDelete = (list: Project[]): Project[] => list.map(p => {
        if (p.id === pid) {
          const qKey = qid as keyof typeof p.quarters;
          return { ...p, quarters: { ...p.quarters, [qKey]: { ...p.quarters[qKey], kpis: p.quarters[qKey].kpis.filter(k => k.id !== kid) } } };
        }
        if (p.subProjects) return { ...p, subProjects: recursiveDelete(p.subProjects) };
        return p;
      });
      setProjects(prev => recursiveDelete([...prev]));
  }, []);

  const globalStats = useMemo(() => {
    let weightedKpi = 0, weightedProgress = 0, totalWeight = 0;
    const collect = (list: Project[]) => {
      list.forEach(p => {
        const s = calculateAnnualStats(p); const w = p.weight || 1;
        weightedKpi += s.avgKpiHealth * w; weightedProgress += s.taskProgress * w; totalWeight += w;
        if (p.subProjects) collect(p.subProjects);
      });
    };
    collect(projects);
    return { kpi: totalWeight > 0 ? Math.round(weightedKpi / totalWeight) : 0, prog: totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0 };
  }, [projects]);

  const filteredProjects = useMemo(() => projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())), [projects, searchQuery]);

  // --- Rendering ---

  // Shared Card Content
  const renderCardContent = (p: Project, s: any, urgent: any, level: number, i: number, onMouseDown: (e: React.MouseEvent) => void) => (
    <div className="h-full flex flex-col relative pt-4">
      {/* DRAG HANDLE (PIN) */}
      <div 
        onMouseDown={onMouseDown}
        onClick={(e) => e.stopPropagation()} // CRITICAL: Stop propagation to prevent card open
        className="absolute -top-10 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-50"
        title="Drag to move"
      >
         <BlackPin />
      </div>

      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-black text-gray-300 tracking-widest uppercase">{level > 1 ? 'Sub-Project' : 'Main-Project'}.0{i+1}</span>
          {s.hasOverdue && <span className="text-[9px] font-bold text-black bg-[#eaff00] px-1 rounded-sm inline-flex items-center gap-1 w-fit">Overdue</span>}
        </div>
        <div className="flex items-center gap-2">
           <MemberSelector currentMemberId={p.owner} members={members} onSelect={(id) => updateProjectProperty(p.id, 'owner', id)} />
           <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-gray-50 transition-all"><Trash2 size={12} /></button>
        </div>
      </div>
      
      <h3 className="font-bold text-[15px] mb-2 leading-tight text-black">{p.name}</h3>
      
      {/* Quarterly Objective Display */}
      <div className="mb-4 text-[10px] text-gray-500 line-clamp-2 bg-gray-50 p-2 rounded-lg italic border border-dashed border-gray-200">
         <span className="font-bold text-gray-400 not-italic uppercase mr-1">Q1 Goal:</span>
         {p.quarters.q1.objective || "未設定季度目標..."}
      </div>
      
      <div className="mt-auto space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 py-2 rounded-lg text-center border border-gray-100">
            <div className="text-[8px] text-gray-400 uppercase font-bold mb-0.5">KPI Health</div>
            <div className="text-sm font-black text-black">{s.avgKpiHealth}%</div>
          </div>
          <div className="flex-1 bg-gray-50 py-2 rounded-lg text-center border border-gray-100">
            <div className="text-[8px] text-gray-400 uppercase font-bold mb-0.5">Progress</div>
            <div className="text-sm font-black text-gray-500">{s.taskProgress}%</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Layout Logic: Generate separated Paths and Cards to ensure proper SVG layering
  const generateGraphElements = (list: Project[], parentX: number, parentY: number, level: number) => {
      let paths: React.ReactNode[] = [];
      let cards: React.ReactNode[] = [];

      list.forEach((p, i) => {
          // 1. Calculate Position
          let defaultX, defaultY, angle;
          if (level === 1) {
             const count = list.length;
             angle = (i / count) * 2 * Math.PI - (Math.PI / 2);
             defaultX = parentX + CANVAS_RADIUS_L1 * Math.cos(angle);
             defaultY = parentY + CANVAS_RADIUS_L1 * Math.sin(angle);
          } else {
             const parentAngleToCenter = Math.atan2(parentY - CANVAS_CENTER_Y, parentX - CANVAS_CENTER_X);
             const count = list.length;
             const spread = Math.min(Math.PI / 2, count * 0.5); 
             const startAngle = parentAngleToCenter - spread / 2;
             const step = count > 1 ? spread / (count - 1) : 0;
             angle = count === 1 ? parentAngleToCenter : startAngle + i * step;
             defaultX = parentX + CANVAS_RADIUS_L2_OFFSET * Math.cos(angle);
             defaultY = parentY + CANVAS_RADIUS_L2_OFFSET * Math.sin(angle);
          }

          const pos = nodePositions[p.id] || { x: defaultX, y: defaultY };
          const x = pos.x;
          const y = pos.y;
          const s = calculateAnnualStats(p);
          const urgent = getMostUrgentTask(p);

          // 2. Add Path
          paths.push(
            <path 
                key={`path-${p.id}`}
                d={`M ${parentX} ${parentY} L ${x} ${y}`} 
                className="node-connection"
            />
          );

          // 3. Add Card
          cards.push(
            <div key={`card-${p.id}`} className="absolute z-20 w-72 group transition-shadow duration-300" style={{ left: x, top: y, transform: 'translate(-50%, -12px)' }}>
                <div 
                    onClick={() => setSelectedProjectId(p.id)} 
                    className={`${BENTO_CARD_STYLE} ${BENTO_CARD_HOVER} p-5 relative group/card h-full cursor-pointer`}
                >
                    {urgent && <TaskNotificationBubble task={urgent} />}
                    {renderCardContent(p, s, urgent, level, i, (e) => handleMouseDown(e, p.id, x, y))}
                </div>
            </div>
          );

          // 4. Recursion
          if (p.subProjects && p.subProjects.length > 0) {
              const children = generateGraphElements(p.subProjects, x, y, level + 1);
              paths = [...paths, ...children.paths];
              cards = [...cards, ...children.cards];
          }
      });

      return { paths, cards };
  };

  const horizontalElements = () => (
    <div className="flex gap-12 px-20 py-20 items-start min-w-full">
      {filteredProjects.map((p, i) => {
        const s = calculateAnnualStats(p);
        const urgent = getMostUrgentTask(p);
        return (
          <div key={p.id} className="relative flex flex-col items-center group">
             {/* Main Card */}
             <div onClick={() => setSelectedProjectId(p.id)} className={`${BENTO_CARD_STYLE} ${BENTO_CARD_HOVER} w-80 p-6 relative group/card cursor-pointer shrink-0 z-10 pt-8`}>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                   <BlackPin />
                </div>
                {urgent && <TaskNotificationBubble task={urgent} />}
                {renderCardContent(p, s, urgent, 1, i, () => {})}
             </div>

             {p.subProjects && p.subProjects.length > 0 && (
                <div className="h-8 w-px bg-gray-200 my-0"></div>
             )}

             {p.subProjects && p.subProjects.length > 0 && (
               <div className="flex flex-col items-center relative gap-4">
                     {p.subProjects.map((sub, j) => {
                        const subStats = calculateAnnualStats(sub);
                        return (
                           <React.Fragment key={sub.id}>
                               {j > 0 && <div className="h-4 w-px bg-gray-200"></div>}
                               <div onClick={() => setSelectedProjectId(sub.id)} className={`${BENTO_CARD_STYLE} w-72 p-5 cursor-pointer hover:border-[#eaff00] transition-all flex items-center justify-between group hover:-translate-y-1 relative`}>
                                  <div>
                                    <div className="text-xs font-bold mb-1 truncate text-black">{sub.name}</div>
                                    <div className="flex gap-3 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                       <span className={subStats.taskProgress === 100 ? 'text-[#eaff00] bg-black px-1' : ''}>{subStats.taskProgress}% Done</span>
                                    </div>
                                  </div>
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500">{j+1}</div>
                               </div>
                           </React.Fragment>
                        )
                     })}
               </div>
             )}
          </div>
        );
      })}
    </div>
  );

  // Central Hub Draggable Position
  const centerPos = nodePositions['root'] || { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y };
  
  // Calculate Radial Graph (Paths + Cards)
  const graphData = useMemo(() => {
     if (layoutMode === 'radial') {
        return generateGraphElements(filteredProjects, centerPos.x, centerPos.y, 1);
     }
     return { paths: [], cards: [] };
  }, [filteredProjects, centerPos, layoutMode, nodePositions]); 

  return (
    <div className="flex h-screen w-full text-black overflow-hidden relative selection:bg-[#eaff00] selection:text-black">
      {/* Background Layers managed by React for Panning Sync */}
      <div 
        className="bg-grid absolute inset-0 w-full h-full pointer-events-none" 
        style={{ 
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        }} 
      />
      <div className="bg-noise absolute inset-0 w-full h-full pointer-events-none" />

      <input type="file" ref={importInputRef} onChange={(e) => {
         const file = e.target.files?.[0];
         if(file) DataService.importData(file).then(({projects, members}) => { 
             // Sanitize data before setting state to prevent white screen crashes
             const sanitizedProjects = sanitizeProjectData(projects);
             setProjects(sanitizedProjects); 
             setMembers(members); 
             setNodePositions({}); // Reset positions
             setPanOffset({x: 0, y: 0}); // Reset pan
         }).catch(err => {
             alert("匯入失敗：檔案格式錯誤或損毀。");
             console.error(err);
         });
      }} accept=".json" className="hidden" />

      {confirmState && (
        <ConfirmModal 
          isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} 
          confirmText={confirmState.confirmText} confirmVariant={confirmState.confirmVariant}
          onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} 
        />
      )}

      {/* Header / Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-8 flex items-center justify-between pointer-events-none">
        <div className="bg-white shadow-xl border border-gray-100 rounded-2xl p-1.5 flex items-center gap-1 pointer-events-auto">
           <button onClick={() => setLayoutMode('radial')} className={`p-3 rounded-xl transition-all ${layoutMode === 'radial' ? 'bg-black text-[#eaff00] shadow-md' : 'hover:bg-gray-50 text-gray-400'}`}><Network size={18} /></button>
           <button onClick={() => setLayoutMode('horizontal')} className={`p-3 rounded-xl transition-all ${layoutMode === 'horizontal' ? 'bg-black text-[#eaff00] shadow-md' : 'hover:bg-gray-50 text-gray-400'}`}><GalleryHorizontal size={18} /></button>
        </div>

        <div className="pointer-events-auto flex-1 max-w-lg mx-6 bg-white border border-gray-100 p-1.5 rounded-2xl relative shadow-lg flex items-center">
          <Search size={16} className="absolute left-5 text-gray-300" />
          <input placeholder="Search..." className="w-full bg-transparent border-none py-2.5 pl-12 pr-4 text-sm font-medium focus:outline-none placeholder:text-gray-300" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
           <button onClick={() => importInputRef.current?.click()} className="btn-frosted w-12 h-12 rounded-2xl flex items-center justify-center text-gray-600"><Upload size={20} /></button>
           <button onClick={() => DataService.exportData(projects, members)} className="btn-frosted w-12 h-12 rounded-2xl flex items-center justify-center text-gray-600"><Download size={20} /></button>
           <button onClick={addProject} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#eaff00] text-black shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={24} /></button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden h-full">
        {/* Main Canvas Container - Handles Panning & Zooming */}
        {layoutMode === 'radial' ? (
             <div 
                onMouseDown={handleCanvasMouseDown}
                className={`w-full h-full absolute inset-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} overflow-hidden`}
             >
                 <div 
                    className="absolute left-1/2 top-1/2 origin-center transition-transform duration-75 ease-out will-change-transform"
                    style={{ 
                        width: '3000px', 
                        height: '3000px', 
                        transform: `translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px)) scale(${zoom})` 
                    }}
                 >
                    <div className="relative w-full h-full">
                        {/* Center Hub */}
                        <div 
                          onClick={() => setShowStrategyDetail(true)}
                          className="absolute z-10 w-[340px] h-[340px] bg-white shadow-2xl rounded-full flex flex-col items-center justify-center text-center border border-gray-100 cursor-pointer group hover:scale-105 transition-transform"
                          style={{ left: centerPos.x, top: centerPos.y, transform: 'translate(-50%, -50%)' }}
                        >
                           <div 
                              onMouseDown={(e) => handleMouseDown(e, 'root', centerPos.x, centerPos.y)}
                              onClick={(e) => e.stopPropagation()} 
                              className="absolute -top-4 w-12 h-8 flex items-center justify-center z-20 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                           >
                             <BlackPin />
                           </div>

                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <DoubleCircularProgress innerValue={globalStats.kpi} outerValue={globalStats.prog} size={280} strokeWidth={8} />
                           </div>

                           <div className="relative z-10 flex flex-col items-center">
                              <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">TOTAL PERFORMANCE</div>
                              <div className="text-3xl font-black leading-none text-black tracking-tight mb-4 max-w-[200px] truncate px-4">{hubTitle}</div>
                              
                              <div className="flex gap-6 mt-2">
                                <div className="text-center">
                                   <div className="text-[9px] font-bold text-gray-400 uppercase">KPI Health</div>
                                   <div className="text-xl font-black text-[#b7c900]">{globalStats.kpi}%</div>
                                </div>
                                <div className="w-px h-10 bg-gray-100"></div>
                                <div className="text-center">
                                   <div className="text-[9px] font-bold text-gray-400 uppercase">Progress</div>
                                   <div className="text-xl font-black text-black">{globalStats.prog}%</div>
                                </div>
                              </div>
                           </div>
                        </div>
                        
                        {/* Paths Layer */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                          {graphData.paths}
                        </svg>

                        {/* Cards Layer */}
                        {graphData.cards}
                    </div>
                 </div>
             </div>
        ) : (
             <div 
                className="w-full h-full transition-transform duration-75 ease-out origin-top-left"
                style={{ transform: `scale(${zoom})` }}
             >
                 <div className="w-full h-full overflow-x-auto overflow-y-hidden whitespace-nowrap custom-scrollbar pt-10 pl-10">
                    {horizontalElements()}
                 </div>
             </div>
        )}

        {/* Zoom Controls - MOVED TO BOTTOM RIGHT to avoid overlapping with Calendar */}
        <div className="absolute bottom-10 right-10 z-30 flex flex-col gap-2">
           <button onClick={() => setZoom(z => Math.min(z + 0.1, 4.0))} className="w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50"><Plus size={18}/></button>
           <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.15))} className="w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50"><MoreHorizontal size={18}/></button>
           <button onClick={() => { setPanOffset({x:0, y:0}); setNodePositions({}); }} className="w-10 h-10 bg-black text-[#eaff00] rounded-xl shadow-lg flex items-center justify-center hover:scale-105 transition-transform" title="Reset View"><ArrowUp size={18}/></button>
        </div>

        <WeeklyStripCalendar projects={projects} members={members} onAddTask={(pid, qid, t) => {
            const recursiveAdd = (list: Project[]) => list.forEach(p => { if (p.id === pid) p.quarters[qid as keyof typeof p.quarters].tasks.push({ ...t, id: Date.now().toString() } as any); else if (p.subProjects) recursiveAdd(p.subProjects); });
            setProjects(prev => { const next = JSON.parse(JSON.stringify(prev)); recursiveAdd(next); return next; });
          }} onUpdateTask={(pid, qid, tid, f, v) => {
            const recursiveUpdate = (list: Project[]) => list.forEach(p => { if (p.id === pid) { const q = p.quarters[qid as keyof typeof p.quarters]; q.tasks = q.tasks.map(t => t.id === tid ? { ...t, [f]: v } : t); } else if (p.subProjects) recursiveUpdate(p.subProjects); });
            setProjects(prev => { const next = JSON.parse(JSON.stringify(prev)); recursiveUpdate(next); return next; });
          }} onDeleteTask={deleteTask} />
      </div>

      {!selectedProjectId && <MemberPanel members={members} projects={projects} onAddMember={(name) => setMembers([...members, { id: Date.now().toString(), name, color: MEMBER_COLORS[members.length % MEMBER_COLORS.length] }])} onDeleteMember={(id) => setMembers(prev => prev.filter(m => m.id !== id))} />}

      {/* Strategy Detail Side Panel */}
      {showStrategyDetail && (
         <StrategyDetail 
            projects={projects} 
            title={hubTitle}
            onUpdateTitle={setHubTitle}
            onUpdateProjectWeight={(id, weight) => updateProjectProperty(id, 'weight', weight)}
            onClose={() => setShowStrategyDetail(false)} 
         />
      )}

      {(() => {
        const findSelected = (list: Project[]): Project | null => {
          for (const p of list) { if (p.id === selectedProjectId) return p; if (p.subProjects) { const sub = findSelected(p.subProjects); if (sub) return sub; } }
          return null;
        };
        const selected = findSelected(projects);
        return <ProjectDetail project={selected} members={members} onClose={() => setSelectedProjectId(null)} onUpdateProject={updateProjectProperty} onUpdateQuarter={updateQuarterData} onDeleteProject={deleteProject} onDeleteTask={deleteTask} deleteKpi={deleteKpi} onAddSubProject={addSubProject} />;
      })()}
    </div>
  );
}
