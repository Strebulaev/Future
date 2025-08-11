import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <nav class="navbar">
      <span>Future Planner</span>
      <div class="nav-links">
        <a routerLink="/">Редактор плана</a>
        <a routerLink="/ai-chat">Чат с нейросетью</a>
      </div>
    </nav>
    
    <router-outlet></router-outlet>
  `,
  styles: [`
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #3f51b5;
      color: white;
      
      .nav-links {
        display: flex;
        gap: 1rem;
        
        a {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          
          &:hover {
            background: rgba(255,255,255,0.2);
          }
        }
      }
    }
  `]
})
export class AppComponent {}