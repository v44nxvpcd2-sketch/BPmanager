
import { Task, TaskStatus, Project, Quarter } from './types';
import { CANVAS_CENTER_X, CANVAS_CENTER_Y, CANVAS_RADIUS_L1 } from './constants';

export const getTaskStatus = (task: Task): TaskStatus => {
  if (task.completed) return { status: 'completed', color: 'text-emerald-500', days: 0 };
  if (!task.dueDate) return { status: 'normal', color: 'text-slate-400', days: 0 };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { status: 'overdue', color: 'text-rose-500', label: '已逾期', days: diffDays };
  if (diffDays <= 7) return { status: 'soon', color: 'text-amber-500', label: `${diffDays}天後`, days: diffDays };
  return { status: 'normal', color: 'text-slate-400', days: diffDays };
};

export const getPos = (i: number, total: number) => {
  if (total === 0) return { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y };
  const angle = (i / total) * 2 * Math.PI - (Math.PI / 2);
  return { 
    x: CANVAS_CENTER_X + CANVAS_RADIUS_L1 * Math.cos(angle), 
    y: CANVAS_CENTER_Y + CANVAS_RADIUS_L1 * Math.sin(angle) 
  };
};

export const calculateQuarterStats = (quarter: Quarter) => {
  if (!quarter) return { taskProgress: 0, avgKpiHealth: 0, hasOverdue: false };
  const totalTasks = quarter.tasks.length;
  const completedTasks = quarter.tasks.filter(t => t.completed).length;
  const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const kpiRates = quarter.kpis.map(k => k.target === 0 ? 0 : Math.min(100, (k.current / k.target) * 100));
  const avgKpiHealth = kpiRates.length > 0 ? Math.round(kpiRates.reduce((a, b) => a + b, 0) / kpiRates.length) : 0;
  const hasOverdue = quarter.tasks.some(t => getTaskStatus(t).status === 'overdue');
  return { taskProgress, avgKpiHealth, hasOverdue };
};

export const calculateAnnualStats = (project: Project) => {
  let totalTasks = 0, completedTasks = 0, totalKpiRate = 0, kpiCount = 0, hasOverdue = false;
  
  (Object.keys(project.quarters) as Array<keyof typeof project.quarters>).forEach(qKey => {
    const q = project.quarters[qKey];
    totalTasks += q.tasks.length;
    completedTasks += q.tasks.filter(t => t.completed).length;
    q.kpis.forEach(k => {
      if (k.target > 0) {
        totalKpiRate += Math.min(100, (k.current / k.target) * 100);
        kpiCount++;
      }
    });
    if (q.tasks.some(t => getTaskStatus(t).status === 'overdue')) hasOverdue = true;
  });

  return {
    taskProgress: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    avgKpiHealth: kpiCount === 0 ? 0 : Math.round(totalKpiRate / kpiCount),
    hasOverdue
  };
};

export const getMostUrgentTask = (project: Project) => {
  let urgentTask: (Task & TaskStatus) | null = null;
  let minDays = Infinity;

  (Object.keys(project.quarters) as Array<keyof typeof project.quarters>).forEach(qKey => {
    const q = project.quarters[qKey];
    q.tasks.forEach(t => {
      if (!t.completed && t.dueDate) {
        const status = getTaskStatus(t);
        if ((status.status === 'overdue' || status.status === 'soon') && status.days < minDays) {
          minDays = status.days;
          urgentTask = { ...t, ...status };
        }
      }
    });
  });
  return urgentTask;
};
