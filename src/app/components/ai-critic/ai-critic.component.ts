import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { AICriticService } from '../../services/ai-critic.service';
import { PlanService } from '../../services/plan.service';

@Component({
  selector: 'app-ai-critic',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule
  ],
  templateUrl: './ai-critic.component.html',
  styleUrls: ['./ai-critic.component.scss'],
})
export class AICriticComponent {
  planId: string = '';
  critique: string = '';
  isLoading: boolean = false;

  constructor(
    public planService: PlanService,
    private aiService: AICriticService
  ) {}

  async analyzePlan(): Promise<void> {
    this.isLoading = true;
    const plan = this.planService.getAllPlans().find(p => p.id === this.planId);
    if (!plan) return;

    this.critique = await this.aiService.criticizePlan(JSON.stringify(plan));
    this.isLoading = false;
  }
}