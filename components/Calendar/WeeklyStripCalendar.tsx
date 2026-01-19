
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Plus, CheckCircle, Circle, AlertCircle, Trash2, Clock } from 'lucide-react';
import { Project, Member, Task, Quarter } from '../../types';
import { RADIUS_CLASS } from '../../constants';
import { getTaskStatus } from '../../utils';

interface WeeklyStripCalendarProps {
  projects: Project[];
  members: Member[];
  onAddTask: (pid: string, qid: string, task: Partial<Task>) => void;
  onUpdateTask: (pid: string, qid: string, tid: string, field: string, val: any) => void;
  onDeleteTask: (pid: string, qid: string, tid: string) => void;
}

const WeeklyStripCalendar: React.FC<WeeklyStripCalendarProps> = ({ projects, members, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(new Date());
  const [addingToDate, setAddingToDate] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [targetProjectId, setTargetProjectId] = useState("");

  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const start = new Date(today.setDate(diff));
    start.setHours(0, 0, 0, 0);
    setWeekStart(start);
  }, []);

  const changeWeek = (offset: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + offset * 7);
    setWeekStart(next);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getRecursiveTasks = (list: Project[]): (Task & { projectId: string; quarterId: string; projectName: string })[] => {
    return list.flatMap(p => {
       const pTasks = (Object.entries(p.quarters) as [string, Quarter][]).flatMap(([qid, q]) => 
          q.tasks.map(t => ({ ...t, projectId: p.id, quarterId: qid, projectName: p.name }))
       );
       const subTasks = p.subProjects ? getRecursiveTasks(p.subProjects) : [];
       return [...pTasks, ...subTasks];
    });
  };

  const allTasks = useMemo(() => getRecursiveTasks(projects), [projects]);

  const tasksByDate = useMemo(() => allTasks.reduce((acc, t) => {
    if (t.dueDate) {
      if (!acc[t.dueDate]) acc[t.dueDate] = [];
      acc[t.dueDate].push(t);
    }
    return acc;
  }, {} as Record<string, typeof allTasks>), [allTasks]);

  // Logic to calculate connection lines between tasks of the same project
  const connectionLines = useMemo(() => {
    const lines: { x1: number, y1: number, x2: number, y2: number, color: string }[] = [];
    const projectLastPos: Record<string, { dayIdx: number, taskIdx: number }> = {};

    weekDays.forEach((day, dayIdx) => {
      const dStr = day.toISOString().split('T')[0];
      const tasks = tasksByDate[dStr] || [];
      tasks.forEach((t, taskIdx) => {
        if (projectLastPos[t.projectId]) {
          const prev = projectLastPos[t.projectId];
          // Draw connection only if tasks are on different days
          if (prev.dayIdx < dayIdx) {
            lines.push({
              x1: prev.dayIdx * 200 + 100, // Approximate center X of day column
              y1: prev.taskIdx * 120 + 130, // Approximate center Y of task card
              x2: dayIdx * 200 + 100,
              y2: taskIdx * 120 + 130,
              color: 'rgba(0, 0, 0, 0.1)'
            });
          }
        }
        projectLastPos[t.projectId] = { dayIdx, taskIdx };
      });
    });
    return lines;
  }, [weekDays, tasksByDate]);

  const monthStr = weekStart.toLocaleString('default', { month: 'long' });
  
  const handleCreate = () => {
    if (!newTaskName || !targetProjectId || !addingToDate) return;
    onAddTask(targetProjectId, 'q1', { name: newTaskName, dueDate: addingToDate, completed: false, owner: null });
    setNewTaskName("");
    setAddingToDate(null);
  };

  if (!isOpen) {
    return (
      <div className="absolute bottom-10 left-10 z-30">
        <button onClick={() => setIsOpen(true)} className="w-20 h-20 bg-white border border-gray-100 rounded-[32px] flex items-center justify-center text-gray-400 shadow-xl relative group hover:scale-110 active:scale-95 hover:text-black hover:border-black transition-all">
          <CalendarIcon size={28} />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#eaff00] text-black rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white shadow-md">W</div>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-10 left-10 z-40 w-[calc(100vw-5rem)] max-w-[1450px] h-[450px]">
      <div className={`bg-white shadow-2xl w-full h-full flex overflow-hidden animate-in slide-in-from-bottom-20 duration-500 border border-gray-100 ${RADIUS_CLASS}`}>
        
        <div className="w-64 bg-gray-50 p-10 flex flex-col justify-between shrink-0 border-r border-gray-100">
          <div>
            <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-4">{weekStart.getFullYear()} WEEKLY</div>
            <div className="text-4xl font-black leading-tight tracking-tight text-black">{monthStr}</div>
          </div>
          <div className="space-y-6">
            <div className="flex gap-2 pt-6">
              <button onClick={() => changeWeek(-1)} className="p-3 bg-white border border-gray-200 hover:border-black rounded-xl transition-all text-gray-500 hover:text-black"><ChevronLeft size={18}/></button>
              <button onClick={() => changeWeek(1)} className="p-3 bg-white border border-gray-200 hover:border-black rounded-xl transition-all text-gray-500 hover:text-black"><ChevronRight size={18}/></button>
              <button onClick={() => setIsOpen(false)} className="ml-auto p-3 hover:bg-gray-200 rounded-xl text-gray-400 transition-all"><X size={18}/></button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex relative divide-x divide-gray-50 overflow-x-auto custom-scrollbar bg-white">
          {/* Connection Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {connectionLines.map((line, i) => (
              <path 
                key={i} 
                d={`M ${line.x1} ${line.y1} C ${line.x1 + 60} ${line.y1}, ${line.x2 - 60} ${line.y2}, ${line.x2} ${line.y2}`} 
                stroke={line.color} 
                strokeWidth="1.5" 
                fill="none" 
                strokeDasharray="4,4"
              />
            ))}
          </svg>

          {weekDays.map((day, dIdx) => {
            const dStr = day.toISOString().split('T')[0];
            const isToday = dStr === new Date().toISOString().split('T')[0];
            const tasks = tasksByDate[dStr] || [];
            return (
              <div key={dStr} className={`flex-1 min-w-[240px] flex flex-col transition-all z-10 ${isToday ? 'bg-[#fcfcfc]' : ''}`}>
                <div className={`p-6 border-b border-gray-50 flex items-center justify-between ${isToday ? 'bg-black text-white' : ''}`}>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-[#eaff00]' : 'text-gray-300'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-[#eaff00] text-black' : 'bg-gray-100 text-gray-400'}`}>{day.getDate()}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar pb-10">
                  {tasks.map((t, tIdx) => {
                    const st = getTaskStatus(t);
                    return (
                      <div key={t.id} className={`group bg-white p-5 rounded-[24px] shadow-sm border transition-all duration-300 transform hover:-translate-y-1 ${st.status === 'overdue' ? 'border-red-200 bg-red-50/20' : t.completed ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-black hover:shadow-lg'}`}>
                        <div className="flex items-start gap-4">
                          <button 
                            onClick={() => onUpdateTask(t.projectId, t.quarterId, t.id, 'completed', !t.completed)} 
                            className={`transition-all duration-300 mt-1 shrink-0 ${t.completed ? "text-gray-300" : "text-gray-200 hover:text-black"}`}
                          >
                            {t.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                          </button>
                          <div className="flex-1 flex flex-col gap-2 min-w-0 pr-2 relative">
                            <div className={`text-xs leading-relaxed font-bold ${t.completed ? 'text-gray-300 line-through' : 'text-black'}`}>{t.name}</div>
                            {!t.completed && st.label && (
                                <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase w-fit px-1.5 py-0.5 rounded ${st.status === 'overdue' ? 'bg-red-500 text-white' : 'bg-[#eaff00] text-black'}`}>
                                    {st.status === 'overdue' ? <AlertCircle size={10} /> : <Clock size={10} />} 
                                    {st.label}
                                </div>
                            )}
                            <button onClick={() => onDeleteTask(t.projectId, t.quarterId, t.id)} className="absolute -right-2 top-0 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"><Trash2 size={14}/></button>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-100 text-[9px] font-bold uppercase text-gray-300 truncate group-hover:text-gray-500 transition-all tracking-wider">{t.projectName}</div>
                      </div>
                    );
                  })}

                  {addingToDate === dStr ? (
                    <div className="bg-white p-5 rounded-[24px] shadow-xl animate-in zoom-in-95 duration-200 border border-black">
                      <input autoFocus placeholder="Task name..." className="w-full text-xs bg-transparent border-none outline-none mb-3 placeholder:text-gray-300 text-black font-bold" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                      <select className="w-full text-[10px] bg-gray-50 rounded-xl mb-4 p-2 outline-none font-bold text-gray-600 appearance-none border border-gray-100" value={targetProjectId} onChange={e => setTargetProjectId(e.target.value)}>
                        <option value="">Select Project...</option>
                        {projects.map(p => (
                          <React.Fragment key={p.id}>
                            <option value={p.id}>{p.name}</option>
                            {p.subProjects?.map(sub => (
                              <option key={sub.id} value={sub.id}>&nbsp;&nbsp;↳ {sub.name}</option>
                            ))}
                          </React.Fragment>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={handleCreate} className="flex-1 bg-black text-[#eaff00] text-[10px] font-black py-3 rounded-xl shadow-lg active:scale-95 hover:bg-gray-900 transition-all">Add</button>
                        <button onClick={() => setAddingToDate(null)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all"><X size={14}/></button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingToDate(dStr)} className="w-full py-4 border border-dashed border-gray-200 rounded-[24px] text-gray-300 hover:text-black hover:border-black hover:bg-gray-50 transition-all flex items-center justify-center group/btn">
                      <Plus size={20} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyStripCalendar;
