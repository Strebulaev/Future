import { Injectable } from '@angular/core';
import { Plan, DayPlan, Task, Event, Branch, PlanLink, GlobalPlan } from './plan.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly STORAGE_KEY = 'future_planner_plans';

  createNewPlan(title: string, startDate: Date, endDate: Date, color: string = '#3f51b5'): Plan {
    const days: DayPlan[] = [];
    const dayCount = this.getDaysDiff(startDate, endDate);
    
    for (let i = 0; i <= dayCount; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      days.push({
        id: uuidv4(),
        date,
        tasks: [],
        notes: ''
      });
    }
  
    const now = new Date();
    return {
      id: uuidv4(),
      title,
      description: '',
      startDate,
      endDate,
      days,
      branches: [],
      links: [],
      color,
      events: [],
      createdAt: now,
      updatedAt: now
    };
  }
  
  // Исправленный savePlan
  savePlan(plan: GlobalPlan | Plan): void {
    try {
      const plans = this.getAllPlans();
      const index = plans.findIndex(p => p.id === plan.id);
      
      const planToSave: GlobalPlan = {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        startDate: plan.startDate,
        endDate: plan.endDate,
        days: plan.days,
        branches: plan.branches,
        links: plan.links,
        color: plan.color
      };
      
      if (index >= 0) {
        plans[index] = planToSave;
      } else {
        plans.push(planToSave);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plans));
    } catch (error) {
      console.error('Ошибка сохранения плана', error);
    }
  }
  
  // Исправленный getLastPlan
  getLastPlan(): Plan | null {
    const plans = this.getAllPlans();
    if (plans.length === 0) return null;
    
    const lastPlan = plans[plans.length - 1];
    return {
      ...lastPlan,
      events: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  getAllPlans(): GlobalPlan[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const plans = data ? JSON.parse(data) : [];
      return plans.map((plan: any) => ({
        ...plan,
        startDate: new Date(plan.startDate),
        endDate: new Date(plan.endDate),
        days: plan.days.map((day: any) => ({
          ...day,
          date: new Date(day.date),
          tasks: day.tasks || []
        })),
        branches: plan.branches || [],
        links: plan.links || [],
        description: plan.description || '',
        color: plan.color || '#3f51b5'
      }));
    } catch (error) {
      console.error('Ошибка чтения планов из localStorage', error);
      return [];
    }
  }
  
  private convertToGlobalPlan(plan: any): GlobalPlan {
    return {
      ...plan,
      description: plan.description || '',
      color: plan.color || '#3f51b5'
    };
  }
  getPlanById(id: string): Plan | undefined {
    const plan = this.getAllPlans().find(p => p.id === id);
    if (!plan) return undefined;
  
    return {
      ...plan,
      events: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  deletePlan(id: string): void {
    const plans = this.getAllPlans().filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plans));
  }

  duplicatePlan(planId: string): Plan | null {
    const plan = this.getPlanById(planId);
    if (!plan) return null;

    const newPlan: Plan = {
      ...plan,
      id: uuidv4(),
      title: `${plan.title} (копия)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      branches: plan.branches.map(branch => ({
        ...branch,
        id: uuidv4()
      })),
      links: []
    };

    this.savePlan(newPlan);
    return newPlan;
  }

  private getDaysDiff(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Методы для работы с задачами
  addTaskToPlan(planId: string, dayIndex: number, task: Omit<Task, 'id'>): void {
    const plan = this.getPlanById(planId);
    if (!plan || dayIndex < 0 || dayIndex >= plan.days.length) return;

    const newTask: Task = {
      ...task,
      id: uuidv4()
    };

    plan.days[dayIndex].tasks.push(newTask);
    this.savePlan(plan);
  }

  updateTask(planId: string, taskId: string, updates: Partial<Task>): void {
    const plan = this.getPlanById(planId);
    if (!plan) return;

    for (const day of plan.days) {
      const task = day.tasks.find(t => t.id === taskId);
      if (task) {
        Object.assign(task, updates);
        this.savePlan(plan);
        return;
      }
    }
  }

  // Методы для работы с событиями
  addEventToPlan(planId: string, event: Omit<Event, 'id'>): void {
    const plan = this.getPlanById(planId);
    if (!plan) return;

    const newEvent: Event = {
      ...event,
      id: uuidv4()
    };

    plan.events.push(newEvent);
    this.savePlan(plan);
  }

  // Методы для работы с ветвями
  addBranchToPlan(planId: string, branch: Omit<Branch, 'id'>): void {
    const plan = this.getPlanById(planId);
    if (!plan) return;

    const newBranch: Branch = {
      ...branch,
      id: uuidv4()
    };

    plan.branches.push(newBranch);
    this.savePlan(plan);
  }

  // Методы для работы со связями
  addLinkToPlan(planId: string, link: PlanLink): void {
    const plan = this.getPlanById(planId);
    if (!plan) return;

    if (!plan.links) plan.links = [];
    plan.links.push(link);
    this.savePlan(plan);
  }
}