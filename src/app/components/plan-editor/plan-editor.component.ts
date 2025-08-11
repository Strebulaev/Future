import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService } from '../../services/plan.service';
import { GlobalPlan, DayPlan, Task, Branch, PlanLink, Plan } from '../../services/plan.model';
import * as joint from 'jointjs';
import { v4 as uuidv4 } from 'uuid';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';

// Components
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';
import { BranchDialogComponent } from '../branch-dialog/branch-dialog.component';
import { PlanSettingsDialogComponent } from '../plan-settings-dialog/plan-settings-dialog.component';
import { LinkDialogComponent } from '../link-dialog/link-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-plan-editor',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe,
    MatButtonModule, MatInputModule, MatDatepickerModule,
    MatNativeDateModule, MatSelectModule, MatCheckboxModule,
    MatCardModule, MatTabsModule, MatTooltipModule,
    MatIconModule, MatDialogModule, MatExpansionModule,
    MatMenuModule, MatProgressBarModule
  ],
  templateUrl: './plan-editor.component.html',
  styleUrls: ['./plan-editor.component.scss']
})
export class PlanEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('graphContainer', { static: false }) graphContainer!: ElementRef;
  
  // State variables
  globalPlans: GlobalPlan[] = [];
  currentPlan: GlobalPlan | null = null;
  selectedDay: DayPlan | null = null;
  selectedBranch: Branch | null = null;
  selectedLink: PlanLink | null = null;
  selectedElement: any = null;
  isLinkingMode = false;
  zoomLevel = 1;
  viewMode: 'graph' | 'table' = 'graph';
  panelOpenState = false;

  // JointJS variables
  private graph!: joint.dia.Graph;
  private paper!: joint.dia.Paper;
  private shapes: { [id: string]: joint.shapes.standard.Rectangle } = {};
  private links: joint.shapes.standard.Link[] = [];
  private clipboard: { type: 'branch' | 'task', data: any } | null = null;

  constructor(
    private planService: PlanService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  ngOnDestroy(): void {
    if (this.paper) {
      this.paper.remove();
    }
  }

  private loadPlans(): void {
    this.globalPlans = this.planService.getAllPlans();
    if (this.globalPlans.length > 0) {
      this.currentPlan = this.globalPlans[0];
      this.selectedDay = this.currentPlan.days[0];
    }
  }

  private showWelcomeMessage(): void {
    this.snackBar.open('Начните с создания нового плана', 'Создать', {
      duration: 5000
    }).onAction().subscribe(() => {
      this.createNewPlan();
    });
  }

  ngAfterViewInit(): void {
    // Добавляем setTimeout для гарантии, что view инициализирован
    setTimeout(() => {
      this.initGraph();
      if (this.globalPlans.length === 0) {
        this.showWelcomeMessage();
      }
    });
  }
  
  private initGraph(): void {
    if (!this.graphContainer?.nativeElement) {
      console.error('Graph container not found');
      return;
    }
  
    // Очищаем контейнер перед созданием нового графа
    this.graphContainer.nativeElement.innerHTML = '';
  
    this.graph = new joint.dia.Graph();
    
    this.paper = new joint.dia.Paper({
      el: this.graphContainer.nativeElement,
      model: this.graph,
      width: '100%',
      height: '100%',
      gridSize: 10,
      drawGrid: true,
      background: { color: '#f8f9fa' },
      cellViewNamespace: joint.shapes,
      interactive: { 
        linkMove: true,
        elementMove: true,
        arrowheadMove: true,
        vertexAdd: true,
        vertexMove: true,
        vertexRemove: true
      }
    });
  
    this.setupEventHandlers();
    this.renderCurrentPlan();
  }

  private setupEventHandlers(): void {
    // Blank click handler
    this.paper.on('blank:pointerdown', (evt) => {
      this.isLinkingMode = false;
      this.selectedBranch = null;
      this.selectedLink = null;
      this.selectedElement = null;
    });

    // Element click handler
    this.paper.on('element:pointerdown', (elementView, evt) => {
      const element = elementView.model as joint.shapes.standard.Rectangle;
      const branchId = (element.id as string).toString();
      
      if (this.isLinkingMode && this.selectedBranch && this.selectedBranch.id !== branchId) {
        this.openLinkDialog(this.selectedBranch.id, branchId);
        this.isLinkingMode = false;
        this.selectedBranch = null;
      } else {
        this.selectedBranch = this.currentPlan?.branches.find(b => b.id === branchId) || null;
        this.selectedElement = element;
        this.selectedLink = null;
      }
    });

    // Link click handler
    this.paper.on('link:pointerdown', (linkView: joint.dia.LinkView) => {
      const labels = linkView.model.get('labels') as Array<{ attrs: { text: { text: string } } }>;
      this.selectedLink = {
        source: linkView.model.get('source').id,
        target: linkView.model.get('target').id,
        label: labels?.[0]?.attrs?.text?.['text'] // Используем ['text'] вместо .text
      };
      this.selectedBranch = null;
      this.selectedElement = linkView.model;
    });
    // Element position change handler
    this.graph.on('change:position', (cell) => {
      if (cell.isElement() && this.currentPlan) {
        const branch = this.currentPlan.branches.find(b => b.id === cell.id);
        if (branch) {
          branch.position = cell.position();
          this.saveCurrentPlan();
        }
      }
    });
  }

  private renderCurrentPlan(): void {
    if (!this.currentPlan || !this.graph) return;
  
    // Очищаем только если graph уже инициализирован
    this.graph.clear();
    
    // Инициализируем shapes и links если они undefined
    this.shapes = this.shapes || {};
    this.links = this.links || [];

    // Render branches
    this.currentPlan.branches.forEach(branch => {
      this.addBranchToGraph(branch);
    });

    // Render links
    this.currentPlan.links?.forEach(link => {
      this.createLink(link.source?.toString() || '', link.target?.toString() || '', link.label);
    });
  }

  private addBranchToGraph(branch: Branch): void {
    if (!this.graph) return;
  
    const shape = new joint.shapes.standard.Rectangle({
      id: branch.id,
      position: branch.position || { 
        x: 100 + Math.random() * 200, 
        y: 100 + Math.random() * 200 
      },
      size: { width: 200, height: 80 },
      attrs: {
        body: { 
          fill: this.currentPlan?.color || '#3f51b5',
          rx: 5, 
          ry: 5,
          stroke: '#1a237e',
          strokeWidth: 2,
          cursor: 'move'
        },
        label: { 
          text: branch.name, 
          fill: 'white',
          fontSize: 14,
          fontWeight: 'bold',
          refY: '50%',
          refX: '50%',
          textAnchor: 'middle',
          yAlignment: 'middle'
        }
      },
      z: 2
    });
  
    this.graph.addCell(shape);
    this.shapes[branch.id] = shape;
  }
  
  centerContent(): void {
    if (this.paper) {
      this.paper.scaleContentToFit({ padding: 50 });
    }
  }
  private createLink(sourceId: string, targetId: string, label?: string): void {
    if (!this.shapes[sourceId] || !this.shapes[targetId]) return;

    const link = new joint.shapes.standard.Link({
      source: { id: sourceId },
      target: { id: targetId },
      labels: label ? [
        {
          position: 0.5,
          attrs: {
            text: {
              text: label,
              fill: '#4a148c',
              fontSize: 12,
              fontWeight: 'bold'
            }
          }
        }
      ] : [],
      attrs: {
        line: {
          stroke: '#4a148c',
          strokeWidth: 2,
          targetMarker: {
            'type': 'path',
            'd': 'M 10 -5 0 0 10 5 z',
            'fill': '#4a148c'
          }
        }
      },
      z: 1
    });

    this.graph.addCell(link);
    this.links.push(link);
  }

  // UI Controls
  toggleLinkingMode(): void {
    this.isLinkingMode = !this.isLinkingMode;
    this.paper.$el.css('cursor', this.isLinkingMode ? 'crosshair' : '');
    if (!this.isLinkingMode) {
      this.selectedBranch = null;
    }
  }

  zoomIn(): void {
    this.zoomLevel += 0.1;
    this.paper.scale(this.zoomLevel, this.zoomLevel);
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.2) {
      this.zoomLevel -= 0.1;
      this.paper.scale(this.zoomLevel, this.zoomLevel);
    }
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.paper.scale(1, 1);
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'graph' ? 'table' : 'graph';
  }

  // Plan Management
  createNewPlan(): void {
    const dialogRef = this.dialog.open(PlanSettingsDialogComponent, {
      width: '600px',
      data: {
        title: 'Новый план',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        color: '#3f51b5'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newPlan = this.planService.createNewPlan(
          result.title,
          result.startDate,
          result.endDate,
          result.color
        );
        
        const globalPlan = this.convertToGlobalPlan(newPlan);
        this.globalPlans.push(globalPlan);
        this.currentPlan = globalPlan;
        this.selectedDay = newPlan.days[0];
        this.renderCurrentPlan();
        this.saveCurrentPlan();
        this.snackBar.open('План успешно создан', 'Закрыть', { duration: 3000 });
      }
    });
  }
  private convertToGlobalPlan(plan: Plan): GlobalPlan {
    return {
      ...plan,
      description: plan.description || '',
      color: plan.color || '#3f51b5',
      links: plan.links || []
    };
  }
  editCurrentPlan(): void {
    if (!this.currentPlan) return;

    const dialogRef = this.dialog.open(PlanSettingsDialogComponent, {
      width: '600px',
      data: {
        title: this.currentPlan.title,
        startDate: new Date(this.currentPlan.startDate),
        endDate: new Date(this.currentPlan.endDate),
        color: this.currentPlan.color
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.currentPlan) {
        this.currentPlan.title = result.title;
        this.currentPlan.startDate = result.startDate;
        this.currentPlan.endDate = result.endDate;
        this.currentPlan.color = result.color;
        this.saveCurrentPlan();
        this.renderCurrentPlan();
        this.snackBar.open('План успешно обновлен', 'Закрыть', { duration: 3000 });
      }
    });
  }

  deleteCurrentPlan(): void {
    if (!this.currentPlan) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Удаление плана',
        message: `Вы уверены, что хотите удалить план "${this.currentPlan.title}"?`,
        confirmText: 'Удалить',
        cancelText: 'Отмена'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.currentPlan) {
        this.planService.deletePlan(this.currentPlan.id);
        this.globalPlans = this.globalPlans.filter(p => p.id !== this.currentPlan?.id);
        this.currentPlan = this.globalPlans.length > 0 ? this.globalPlans[0] : null;
        this.selectedDay = this.currentPlan?.days[0] || null;
        this.renderCurrentPlan();
        this.snackBar.open('План удален', 'Закрыть', { duration: 3000 });
      }
    });
  }

  selectPlan(plan: GlobalPlan): void {
    this.currentPlan = plan;
    this.selectedDay = plan.days[0];
    this.renderCurrentPlan();
  }

  saveCurrentPlan(): void {
    if (!this.currentPlan) return;

    // Update links
    this.currentPlan.links?.forEach(link => {
      this.createLink(
        link.source?.toString() || '', 
        link.target?.toString() || '', 
        (link as any).label // или link['label'] если определено в типе
      );
    });
    this.planService.savePlan(this.currentPlan);
  }

  // Day Management
  addNewDay(): void {
    if (!this.currentPlan) return;

    const lastDate = new Date(this.currentPlan.endDate);
    const newDate = new Date(lastDate);
    newDate.setDate(lastDate.getDate() + 1);

    const newDay: DayPlan = {
      id: uuidv4(),
      date: newDate,
      tasks: [],
      notes: ''
    };

    this.currentPlan.days.push(newDay);
    this.currentPlan.endDate = newDate;
    this.saveCurrentPlan();
    this.snackBar.open('День добавлен', 'Закрыть', { duration: 2000 });
  }

  deleteDay(day: DayPlan): void {
    if (!this.currentPlan) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Удаление дня',
        message: `Удалить день ${day.date.toLocaleDateString()}? Все задачи будут потеряны.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.currentPlan) {
        this.currentPlan.days = this.currentPlan.days.filter(d => d.id !== day.id);
        
        // Update plan dates if needed
        if (this.currentPlan.days.length > 0) {
          const dates = this.currentPlan.days.map(d => d.date.getTime());
          this.currentPlan.startDate = new Date(Math.min(...dates));
          this.currentPlan.endDate = new Date(Math.max(...dates));
        }
        
        this.saveCurrentPlan();
        this.snackBar.open('День удален', 'Закрыть', { duration: 2000 });
      }
    });
  }

  // Task Management
  addNewTask(day: DayPlan): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '500px',
      data: {
        id: uuidv4(),
        name: '',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        completed: false,
        priority: 'medium'
      }
    });

    dialogRef.afterClosed().subscribe((result: Task) => {
      if (result && this.currentPlan) {
        day.tasks.push(result);
        this.saveCurrentPlan();
      }
    });
  }

  editTask(day: DayPlan, task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '500px',
      data: { ...task }
    });

    dialogRef.afterClosed().subscribe((result: Task) => {
      if (result && this.currentPlan) {
        const index = day.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          day.tasks[index] = result;
          this.saveCurrentPlan();
        }
      }
    });
  }

  deleteTask(day: DayPlan, task: Task): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Удаление задачи',
        message: `Удалить задачу "${task.name}"?`,
        confirmText: 'Удалить',
        cancelText: 'Отмена'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.currentPlan) {
        day.tasks = day.tasks.filter(t => t.id !== task.id);
        this.saveCurrentPlan();
        this.snackBar.open('Задача удалена', 'Закрыть', { duration: 2000 });
      }
    });
  }

  toggleTaskCompletion(task: Task): void {
    task.completed = !task.completed;
    this.saveCurrentPlan();
  }

  // Branch Management
  addNewBranch(): void {
    const dialogRef = this.dialog.open(BranchDialogComponent, {
      width: '500px',
      data: {
        id: uuidv4(),
        name: '',
        description: '',
        arguments: []
      }
    });

    dialogRef.afterClosed().subscribe((result: Branch) => {
      if (result && this.currentPlan) {
        this.currentPlan.branches.push(result);
        this.addBranchToGraph(result);
        this.saveCurrentPlan();
        this.snackBar.open('Ветвь добавлена', 'Закрыть', { duration: 2000 });
      }
    });
  }

  editBranch(branch: Branch): void {
    const dialogRef = this.dialog.open(BranchDialogComponent, {
      width: '500px',
      data: { ...branch }
    });

    dialogRef.afterClosed().subscribe((result: Branch) => {
      if (result && this.currentPlan) {
        const index = this.currentPlan.branches.findIndex(b => b.id === branch.id);
        if (index !== -1) {
          this.currentPlan.branches[index] = result;
          
          // Update shape in graph
          if (this.shapes[branch.id]) {
            this.shapes[branch.id].attr('label/text', result.name);
          }
          
          this.saveCurrentPlan();
          this.snackBar.open('Ветвь обновлена', 'Закрыть', { duration: 2000 });
        }
      }
    });
  }

  deleteBranch(branch: Branch): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Удаление ветви',
        message: `Удалить ветвь "${branch.name}"? Все связи будут потеряны.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.currentPlan) {
        // Remove from plan
        this.currentPlan.branches = this.currentPlan.branches.filter(b => b.id !== branch.id);
        
        // Remove links
        this.currentPlan.links = this.currentPlan.links?.filter(
          link => link.source !== branch.id && link.target !== branch.id
        );
        
        // Remove from graph
        if (this.shapes[branch.id]) {
          this.shapes[branch.id].remove();
          delete this.shapes[branch.id];
        }
        
        // Remove connected links
        this.links
          .filter(link => {
            const source = link.get('source')?.id;
            const target = link.get('target')?.id;
            return source === branch.id || target === branch.id;
          })
          .forEach(link => link.remove());
        
        this.links = this.links.filter(
          link => {
            const source = link.get('source')?.id;
            const target = link.get('target')?.id;
            return source !== branch.id && target !== branch.id;
          }
        );
        
        this.saveCurrentPlan();
        this.snackBar.open('Ветвь удалена', 'Закрыть', { duration: 2000 });
      }
    });
  }

  // Link Management
  openLinkDialog(sourceId: string, targetId: string): void {
    const dialogRef = this.dialog.open(LinkDialogComponent, {
      width: '400px',
      data: {
        label: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.currentPlan) {
        this.createLink(sourceId, targetId, result.label);
        
        if (!this.currentPlan.links) {
          this.currentPlan.links = [];
        }
        
        this.currentPlan.links.push({
          source: sourceId,
          target: targetId,
          label: result.label
        });
        
        this.saveCurrentPlan();
      }
    });
  }

  editLink(link: PlanLink): void {
    const dialogRef = this.dialog.open(LinkDialogComponent, {
      width: '400px',
      data: {
        label: link.label || ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.currentPlan) {
        // Update link in graph
        const jointLink = this.links.find(l => 
          l.get('source')?.id === link.source && 
          l.get('target')?.id === link.target
        );
        
        if (jointLink) {
          if (result.label) {
            jointLink.labels([{
              position: 0.5,
              attrs: {
                text: {
                  text: result.label,
                  fill: '#4a148c',
                  fontSize: 12,
                  fontWeight: 'bold'
                }
              }
            }]);
          } else {
            jointLink.labels([]);
          }
        }
        
        // Update link in plan
        const planLink = this.currentPlan?.links?.find(l => 
          l.source === link.source && 
          l.target === link.target
        );
        
        if (planLink) {
          planLink.label = result.label;
        }
        
        this.saveCurrentPlan();
      }
    });
  }

  deleteLink(link: PlanLink): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Удаление связи',
        message: 'Удалить эту связь?',
        confirmText: 'Удалить',
        cancelText: 'Отмена'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.currentPlan) {
        // Remove from plan
        this.currentPlan.links = this.currentPlan.links?.filter(l => 
          !(l.source === link.source && l.target === link.target)
        );
        
        // Remove from graph
        const jointLink = this.links.find(l => 
          l.get('source')?.id === link.source && 
          l.get('target')?.id === link.target
        );
        
        if (jointLink) {
          jointLink.remove();
          this.links = this.links.filter(l => l !== jointLink);
        }
        
        this.saveCurrentPlan();
      }
    });
  }

  // Clipboard operations
  copyToClipboard(item: any, type: 'branch' | 'task'): void {
    this.clipboard = { type, data: JSON.parse(JSON.stringify(item)) };
    this.snackBar.open('Скопировано в буфер обмена', 'Закрыть', { duration: 2000 });
  }

  pasteFromClipboard(day?: DayPlan): void {
    if (!this.clipboard || !this.currentPlan) return;

    if (this.clipboard.type === 'branch') {
      const newBranch = { ...this.clipboard.data, id: uuidv4() };
      this.currentPlan.branches.push(newBranch);
      this.addBranchToGraph(newBranch);
      this.saveCurrentPlan();
      this.snackBar.open('Ветвь вставлена', 'Закрыть', { duration: 2000 });
    } 
    else if (this.clipboard.type === 'task' && day) {
      const newTask = { ...this.clipboard.data, id: uuidv4() };
      day.tasks.push(newTask);
      this.saveCurrentPlan();
      this.snackBar.open('Задача вставлена', 'Закрыть', { duration: 2000 });
    }
  }

  // Import/Export
  exportPlan(): void {
    if (!this.currentPlan) return;

    const data = JSON.stringify(this.currentPlan, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentPlan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.snackBar.open('План экспортирован', 'Закрыть', { duration: 3000 });
  }

  importPlan(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedPlan = JSON.parse(content);
        
        // Basic validation
        if (importedPlan && importedPlan.title && importedPlan.days && importedPlan.branches) {
          // Generate new IDs to avoid conflicts
          importedPlan.id = uuidv4();
          importedPlan.days.forEach((day: DayPlan) => day.id = uuidv4());
          importedPlan.branches.forEach((branch: Branch) => branch.id = uuidv4());
          
          this.globalPlans.push(importedPlan);
          this.currentPlan = importedPlan;
          this.selectedDay = this.currentPlan!.days[0];
          this.renderCurrentPlan();
          this.saveCurrentPlan();
          this.snackBar.open('План успешно импортирован', 'Закрыть', { duration: 3000 });
        } else {
          throw new Error('Некорректный формат файла плана');
        }
      } catch (error) {
        console.error('Ошибка импорта плана', error);
        this.snackBar.open('Ошибка при импорте плана', 'Закрыть', { duration: 3000 });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // Utility methods
  trackByBranchId(index: number, branch: Branch): string {
    return branch.id;
  }

  trackByDayId(index: number, day: DayPlan): string {
    return day.id;
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  getDayTasksCount(day: DayPlan): number {
    return day.tasks.length;
  }

  getCompletedTasksCount(day: DayPlan): number {
    return day.tasks.filter(t => t.completed).length;
  }

  getDayProgress(day: DayPlan): number {
    return day.tasks.length > 0 
      ? Math.round((this.getCompletedTasksCount(day) / day.tasks.length) * 100) 
      : 0;
  }
}