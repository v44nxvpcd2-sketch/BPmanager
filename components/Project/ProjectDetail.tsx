
import React, { useState } from 'react';
import { X, Target, Trash2, ChevronDown, ChevronRight, TrendingUp, ListTodo, Plus, CheckCircle, Circle, Calendar as CalendarIcon, Percent, GitBranch, ArrowRight, AlertCircle, Clock, User } from 'lucide-react';
import { Project, Member, Quarter } from '../../types';
import { RADIUS_CLASS } from '../../constants';
import { calculateAnnualStats, calculateQuarterStats, getTaskStatus } from '../../utils';

interface ProjectDetailProps {
  project: Project | null;
  members: Member[];
  onClose: () => void;
  onUpdateProject: (pid: string, field: keyof Project, val: any) => void;
  onUpdateQuarter: (pid: string, qid: keyof Project['quarters'], field: keyof Quarter, val: any) => void;
  onDeleteProject: (pid: string) => void;
  onDeleteTask: (pid: string, qid: string, tid: string) => void;
  deleteKpi: (pid: string, qid: string, kid: string) => void; // Fixed prop name
  onAddSubProject: (parentId: string) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, members, onClose, onUpdateProject, onUpdateQuarter, onDeleteProject, onDeleteTask, deleteKpi, onAddSubProject }) => {
  const [expandedQ, setExpandedQ] = useState<string | null>('q1');

  if (!project) return null;

  const updateKpi = (qid: string, kid: string, field: string, val: any) => {
    const q = project.quarters[qid as keyof typeof project.quarters];
    const newKpis = q.kpis.map(k => k.id === kid ? { ...k, [field]: val } : k);
    onUpdateQuarter(project.id, qid as keyof typeof project.quarters, 'kpis', newKpis);
  };

  const addKpi = (qid: string) => {
    const q = project.quarters[qid as keyof typeof project.quarters];
    onUpdateQuarter(project.id, qid as keyof typeof project.quarters, 'kpis', [...q.kpis, { id: Date.now().toString(), name: 'New KPI', target: 100, current: 0, unit: '' }]);
  };

  const updateTask = (qid: string, tid: string, field: string, val: any) => {
    const q = project.quarters[qid as keyof typeof project.quarters];
    const newTasks = q.tasks.map(t => t.id === tid ? { ...t, [field]: val } : t);
    onUpdateQuarter(project.id, qid as keyof typeof project.quarters, 'tasks', newTasks);
  };

  const addTask = (qid: string) => {
    const q = project.quarters[qid as keyof typeof project.quarters];
    onUpdateQuarter(project.id, qid as keyof typeof project.quarters, 'tasks', [...q.tasks, { id: Date.now().toString(), name: 'New Task', completed: false, dueDate: '', owner: null }]);
  };

  return (
    <div className={`fixed right-0 top-0 h-full w-[540px] bg-white z-50 shadow-[-40px_0_100px_rgba(0,0,0,0.1)] flex flex-col transition-transform duration-700 cubic-bezier(0.23,1,0.32,1) transform ${project ? 'translate-x-0' : 'translate-x-full'} border-l border-gray-100`}>
      <div className="p-10 pb-6 border-b border-gray-100 flex items-start justify-between bg-white">
        <div className="flex-1 mr-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[9px] font-black bg-black text-[#eaff00] px-3 py-1.5 rounded-lg uppercase tracking-[0.2em]">Project Detail</span>
          </div>
          <input className="text-3xl font-black bg-transparent border-none w-full focus:outline-none tracking-tight text-black placeholder:text-gray-200" value={project.name} onChange={e => onUpdateProject(project.id, 'name', e.target.value)} />
        </div>
        <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-black hover:text-[#eaff00] rounded-xl text-gray-400 transition-all"><X size={24}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 pt-6 space-y-10 custom-scrollbar bg-white">
        <div className="space-y-4">
          <div className={`bg-gray-50 border border-gray-100 p-6 ${RADIUS_CLASS} relative overflow-hidden group`}>
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest"><Percent size={14}/> Weight</div>
               <div className="text-xl font-black text-black">{project.weight || 1}</div>
            </div>
            <input 
              type="range" min="1" max="100" value={project.weight || 1} 
              onChange={e => onUpdateProject(project.id, 'weight', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-black"
            />
          </div>

          <div className={`bg-white border border-gray-100 p-6 ${RADIUS_CLASS} relative overflow-hidden group hover:border-gray-200 transition-colors`}>
            <div className="flex items-center gap-2 mb-3 text-gray-400">
              <Target size={14} /> <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Annual Objective</span>
            </div>
            <textarea className="w-full bg-transparent text-sm leading-relaxed focus:outline-none resize-none font-medium text-gray-800 placeholder:text-gray-300" rows={3} value={project.annualObjective} onChange={e => onUpdateProject(project.id, 'annualObjective', e.target.value)} placeholder="Describe the main objective..." />
          </div>
        </div>

        {/* Sub-projects Management */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2"><GitBranch size={14}/> Sub-Projects</span>
            <button onClick={() => onAddSubProject(project.id)} className="text-[10px] bg-[#eaff00] text-black px-4 py-1.5 rounded-lg font-bold hover:bg-black hover:text-white transition-all shadow-sm">+ Add Sub</button>
          </div>
          <div className="grid grid-cols-1 gap-2 pl-4 border-l border-gray-100">
             {project.subProjects && project.subProjects.length > 0 ? (
               project.subProjects.map(sub => {
                 const subStats = calculateAnnualStats(sub);
                 return (
                   <div key={sub.id} className={`p-4 bg-white border ${subStats.hasOverdue ? 'border-red-200 bg-red-50' : 'border-gray-100'} rounded-2xl group hover:border-black/20 hover:shadow-md transition-all flex items-center justify-between cursor-pointer`} onClick={() => onUpdateProject(sub.id, 'id', sub.id)}>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-black mb-1 flex items-center gap-2">
                          {sub.name}
                          {subStats.hasOverdue && <AlertCircle size={12} className="text-red-500" />}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Prog: <span className="text-black">{subStats.taskProgress}%</span></div>
                          <div className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Health: <span className="text-black">{subStats.avgKpiHealth}%</span></div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-gray-300 group-hover:text-black transition-all" />
                   </div>
                 );
               })
             ) : (
               <div className="py-4 text-center text-gray-300 text-[10px] font-bold border border-dashed border-gray-200 rounded-xl">No sub-projects</div>
             )}
          </div>
        </div>

        <div className="space-y-6">
          {(['q1', 'q2', 'q3', 'q4'] as const).map(qid => {
            const q = project.quarters[qid];
            const stats = calculateQuarterStats(q);
            const isEx = expandedQ === qid;
            const qNames = { q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' };

            return (
              <div key={qid} className={`bg-white border border-gray-100 ${RADIUS_CLASS} transition-all duration-300 ${isEx ? 'ring-1 ring-black/5 shadow-xl' : 'hover:border-gray-300'}`}>
                <div onClick={() => setExpandedQ(isEx ? null : qid)} className="p-5 flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-6 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300 ${isEx ? 'bg-black text-[#eaff00]' : 'bg-gray-100 text-gray-400'}`}>{qNames[qid]}</div>
                    <div className="flex-1 mr-8">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-400">
                          <span>Progress</span>
                          <span className={stats.hasOverdue ? 'text-red-500' : 'text-black'}>{stats.avgKpiHealth}%</span>
                       </div>
                       <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${isEx ? (stats.hasOverdue ? 'bg-red-500' : 'bg-[#eaff00]') : 'bg-gray-300'}`} style={{ width: `${stats.avgKpiHealth}%` }} />
                       </div>
                    </div>
                  </div>
                  {isEx ? <ChevronDown size={20} className="text-black"/> : <ChevronRight size={20} className="text-gray-300"/>}
                </div>

                {isEx && (
                  <div className="p-6 pt-0 space-y-8 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase mb-3 block tracking-widest">Quarterly Goal</label>
                      <input className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all text-black placeholder:text-gray-300" value={q.objective} onChange={e => onUpdateQuarter(project.id, qid, 'objective', e.target.value)} placeholder="Set goal..." />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2"><TrendingUp size={14}/> KPIs</span>
                         <button onClick={() => addKpi(qid)} className="text-[10px] bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-bold hover:bg-black hover:text-white transition-all">+ Add</button>
                      </div>
                      <div className="space-y-3">
                        {q.kpis.map(k => (
                          <div key={k.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-gray-300 transition-all">
                            <input className="flex-1 bg-transparent text-xs font-bold outline-none text-black" value={k.name} onChange={e => updateKpi(qid, k.id, 'name', e.target.value)} />
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <input type="number" className="w-12 text-center text-xs outline-none font-black text-black" value={k.current} onChange={e => updateKpi(qid, k.id, 'current', Number(e.target.value))} />
                              <span className="text-gray-300 font-bold">/</span>
                              <input type="number" className="w-12 text-center text-xs outline-none font-bold text-gray-400" value={k.target} onChange={e => updateKpi(qid, k.id, 'target', Number(e.target.value))} />
                            </div>
                            <button onClick={() => deleteKpi(project.id, qid, k.id)} className="text-gray-300 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2"><ListTodo size={14}/> Tasks</span>
                         <button onClick={() => addTask(qid)} className="text-[10px] bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-bold hover:bg-black hover:text-white transition-all">+ Add</button>
                      </div>
                      <div className="space-y-3">
                        {q.tasks.map(t => {
                          const st = getTaskStatus(t);
                          return (
                            <div key={t.id} className={`p-4 bg-white border ${st.status === 'overdue' ? 'border-red-200' : 'border-gray-100'} rounded-2xl shadow-sm space-y-3 group hover:border-gray-300 transition-all`}>
                              <div className="flex items-start gap-3">
                                <button onClick={() => updateTask(qid, t.id, 'completed', !t.completed)} className={`mt-0.5 transition-all duration-300 ${t.completed ? "text-gray-300" : "text-gray-200 hover:text-[#eaff00] hover:bg-black rounded-full"}`}>{t.completed ? <CheckCircle size={18} /> : <Circle size={18} />}</button>
                                <div className="flex-1 flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <input className={`text-sm font-bold bg-transparent outline-none transition-all flex-1 ${t.completed ? 'line-through text-gray-300' : 'text-black'}`} value={t.name} onChange={e => updateTask(qid, t.id, 'name', e.target.value)} />
                                    {st.label && (
                                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md whitespace-nowrap ${st.status === 'overdue' ? 'bg-red-500 text-white' : 'bg-[#eaff00] text-black'}`}>
                                        {st.label}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button onClick={() => onDeleteTask(project.id, qid, t.id)} className="text-gray-300 hover:text-red-500 transition-all p-1 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                              </div>
                              <div className="flex items-center gap-4 pl-8">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon size={12} className="text-gray-400"/><input type="date" className="bg-transparent text-[10px] font-bold outline-none text-gray-500" value={t.dueDate} onChange={e => updateTask(qid, t.id, 'dueDate', e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2">
                                   <User size={12} className="text-gray-400"/>
                                   <select className="text-[10px] font-bold bg-transparent outline-none text-gray-500 cursor-pointer" value={t.owner || ""} onChange={e => updateTask(qid, t.id, 'owner', e.target.value || null)}>
                                      <option value="">Unassigned</option>
                                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                   </select>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-8 pb-12">
          <button onClick={() => onDeleteProject(project.id)} className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 text-gray-400 rounded-3xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all hover:shadow-lg"><Trash2 size={16}/> Delete Project Permanently</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
