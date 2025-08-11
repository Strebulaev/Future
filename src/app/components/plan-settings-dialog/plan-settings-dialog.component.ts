import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-plan-settings-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSelectModule,
    CommonModule
  ],
  templateUrl: './plan-settings-dialog.component.html',
  styleUrls: ['./plan-settings-dialog.component.scss']
})
export class PlanSettingsDialogComponent {
  planForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    startDate: new FormControl(new Date(), [Validators.required]),
    endDate: new FormControl(new Date(), [Validators.required]),
    color: new FormControl('#3f51b5', [Validators.required])
  });

  colors = [
    { name: 'Primary', value: '#3f51b5' },
    { name: 'Accent', value: '#ff4081' },
    { name: 'Warn', value: '#f44336' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Purple', value: '#9c27b0' }
  ];

  constructor(
    public dialogRef: MatDialogRef<PlanSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      this.planForm.patchValue(data);
    }
  }

  onSave(): void {
    if (this.planForm.valid) {
      this.dialogRef.close(this.planForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}