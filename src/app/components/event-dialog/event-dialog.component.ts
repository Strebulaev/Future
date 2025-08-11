import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Event } from '../../services/plan.model';
import { MatIconModule } from '@angular/material/icon'; 

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './event-dialog.component.html',
  styleUrls: ['./event-dialog.component.scss']
})
export class EventDialogComponent {
  event: Event;
  newArgument = '';

  constructor(
    public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Event
  ) {
    this.event = { ...data };
  }

  addArgument(): void {
    if (this.newArgument.trim()) {
      this.event.arguments.push(this.newArgument.trim());
      this.newArgument = '';
    }
  }

  removeArgument(index: number): void {
    this.event.arguments.splice(index, 1);
  }

  onSave(): void {
    if (this.validateEvent()) {
      this.dialogRef.close(this.event);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private validateEvent(): boolean {
    if (!this.event.name || !this.event.name.trim()) {
      alert('Название события обязательно');
      return false;
    }

    if (!this.event.date) {
      alert('Дата события обязательна');
      return false;
    }

    return true;
  }
}