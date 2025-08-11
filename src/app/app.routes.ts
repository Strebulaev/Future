import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '',
    loadComponent: () => import('./components/plan-editor/plan-editor.component').then(m => m.PlanEditorComponent),
    title: 'Редактор плана'
  },
  { 
    path: 'ai-critic',
    loadComponent: () => import('./components/ai-critic/ai-critic.component').then(m => m.AICriticComponent),
    title: 'Анализ плана'
  },
  { 
    path: 'ai-chat',
    loadComponent: () => import('./components/ai-chat/ai-chat.component').then(m => m.AIChatComponent),
    title: 'Чат с ИИ'
  }
];