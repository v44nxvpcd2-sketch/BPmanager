
export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface KPI {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  dueDate: string;
  owner: string | null;
  projectId?: string;
  projectName?: string;
  quarterId?: string;
}

export type TransactionType = 'income' | 'expense' | 'salary' | 'tax';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  memberId?: string; // Optional: link salary to a member
}

export interface Quarter {
  id: string;
  objective: string;
  budget: number;
  spent: number;
  kpis: KPI[];
  tasks: Task[];
  transactions?: Transaction[]; // New field for detailed financials
}

export interface Project {
  id: string;
  name: string;
  owner: string | null;
  annualObjective: string;
  weight?: number; // Importance weight 1-100
  subProjects?: Project[]; // Nested projects
  quarters: {
    q1: Quarter;
    q2: Quarter;
    q3: Quarter;
    q4: Quarter;
  };
}

export type LayoutMode = 'radial' | 'horizontal';

export interface TaskStatus {
  status: 'completed' | 'overdue' | 'soon' | 'normal';
  color: string;
  label?: string;
  days: number;
}
