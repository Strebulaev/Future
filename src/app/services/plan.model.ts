export interface Event {
  id: string;
  name: string;
  date: Date;
  description: string;
  arguments: string[];
  linkedEvents: string[];
}

export interface Task {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface DayPlan {
  id: string;
  date: Date;
  tasks: Task[];
  notes: string;
}

export interface BasePlan {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  days: DayPlan[];
  branches: Branch[];
  links?: PlanLink[];
  color?: string;
}

export interface GlobalPlan extends BasePlan {
  // Только базовые поля
}

export interface Plan extends BasePlan {
  events: Event[];
  createdAt: Date;
  updatedAt: Date;
}
export interface Branch {
  position?: { x: number; y: number };
  id: string;
  name: string;
  description: string;
  arguments: string[];
}

export interface PlanLink {
  source?: string;
  target?: string;
  label?: string;
}