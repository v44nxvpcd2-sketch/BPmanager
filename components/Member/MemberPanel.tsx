
import React, { useState, useRef, useEffect } from 'react';
import { Users, User, X, Plus, Trash2 } from 'lucide-react';
import { Member, Project, Quarter } from '../../types';
import { BENTO_CARD_STYLE, RADIUS_CLASS } from '../../constants';

interface MemberPanelProps {
  members: Member[];
  projects: Project[];
  onAddMember: (name: string) => void;
  onDeleteMember: (id: string) => void;
}

const MemberPanel: React.FC<MemberPanelProps> = ({ members, projects, onAddMember, onDeleteMember }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false); };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const stats = (mid: string) => {
    let total = 0, done = 0;
    projects.forEach(p => {
      (Object.values(p.quarters) as Quarter[]).forEach(q => {
        q.tasks.forEach(t => { if (t.owner === mid) { total++; if (t.completed) done++; } });
      });
    });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)} className="absolute top-32 right-12 z-30 cursor-pointer group flex flex-col items-end gap-4">
        <div className="w-14 h-14 bg-white shadow-xl rounded-2xl flex items-center justify-center text-gray-400 hover:scale-105 transition-all border border-gray-100 hover:text-black hover:border-black">
          <Users size={24} />
        </div>
        <div className="flex -space-x-3 pr-1">
          {members.slice(0, 5).map(m => (
            <div key={m.id} className={`w-9 h-9 rounded-full border-2 border-white shadow-md ${m.color} flex items-center justify-center text-[10px] font-bold`}>{m.name[0]}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className={`absolute top-32 right-12 z-40 w-80 p-8 flex flex-col shadow-2xl animate-in slide-in-from-right-10 max-h-[calc(100vh-280px)] overflow-hidden bg-white rounded-[32px] border border-gray-100`}>
      <div className="flex items-center justify-between pb-6 border-b border-gray-50 mb-6">
        <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400"><Users size={14}/> Team Hub</div>
        <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-black p-2 transition-colors"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
        {members.map(m => {
          const s = stats(m.id);
          return (
            <div key={m.id} className="group relative">
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-10 h-10 rounded-full ${m.color} flex items-center justify-center font-bold text-xs border border-gray-100 shadow-sm shrink-0`}>{m.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-bold text-black truncate pr-6">{m.name}</div>
                    <div className={`text-[10px] font-black shrink-0 ${s.pct === 100 ? 'text-[#eaff00] bg-black px-1.5 rounded' : 'text-gray-400'}`}>{s.pct}%</div>
                  </div>
                  <div className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">{s.done} / {s.total} Tasks</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteMember(m.id); }}
                  className="absolute right-0 top-1 p-1.5 text-gray-300 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${s.pct === 100 ? 'bg-[#eaff00]' : 'bg-black'}`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-50 flex gap-2">
        <input 
          value={newName} 
          onChange={e => setNewName(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && (newName && (onAddMember(newName), setNewName("")))} 
          placeholder="New member..." 
          className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all text-black placeholder:text-gray-300 font-bold" 
        />
        <button onClick={() => { if(newName) { onAddMember(newName); setNewName(""); } }} className="bg-black text-[#eaff00] p-3 rounded-xl hover:bg-gray-800 transition-all shadow-md"><Plus size={18}/></button>
      </div>
    </div>
  );
};

export default MemberPanel;
