import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIChatService } from '../../services/ai-chat.service';
import { PlanService } from '../../services/plan.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MarkdownModule } from 'ngx-markdown';
interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    DatePipe,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatTooltipModule,
    MarkdownModule
  ],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss']
})
export class AIChatComponent {
  messages: ChatMessage[] = [];
  userInput = '';
  isWaiting = false;
  chatMode: 'normal' | 'aggressive' = 'normal';

  constructor(
    private planService: PlanService,
    private aiService: AIChatService
  ) {}

  async sendMessage(): Promise<void> {
    if (!this.userInput.trim()) return;

    const userMessage: ChatMessage = {
      sender: 'user',
      text: this.userInput,
      timestamp: new Date()
    };
    
    this.messages.push(userMessage);
    const currentInput = this.userInput;
    this.userInput = '';
    this.isWaiting = true;
    
    try {
      const aiResponse = await this.aiService.sendMessage([
        {
          role: 'system',
          content: this.chatMode === 'aggressive' 
            ? 'Ты эксперт по планированию, который жестко критикует идеи, указывая на слабые места' 
            : 'Ты помощник по планированию, который дает конструктивные советы'
        },
        { role: 'user', content: currentInput }
      ]);

      this.messages.push({
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date()
      });
    } catch (error) {
      this.messages.push({
        sender: 'ai',
        text: 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.',
        timestamp: new Date(),
        isError: true
      });
    } finally {
      this.isWaiting = false;
    }
  }

  async analyzePlan(): Promise<void> {
    const currentPlan = this.planService.getAllPlans()[0];
    if (!currentPlan) return;
    
    this.userInput = `Проанализируй этот план: ${JSON.stringify({
      title: currentPlan.title,
      duration: `${currentPlan.days.length} дней`,
      branches: currentPlan.branches.map(b => b.name),
      tasksCount: currentPlan.days.reduce((sum, day) => sum + day.tasks.length, 0)
    }, null, 2)}`;
    await this.sendMessage();
  }

  toggleChatMode(): void {
    this.chatMode = this.chatMode === 'normal' ? 'aggressive' : 'normal';
    this.messages.push({
      sender: 'ai',
      text: `Режим изменен на ${this.chatMode === 'aggressive' ? 'жесткий анализ' : 'обычный'}`,
      timestamp: new Date()
    });
  }
}