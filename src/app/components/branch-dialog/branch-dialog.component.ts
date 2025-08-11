import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Branch } from '../../services/plan.model';
import { CommonModule } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-branch-dialog',
  standalone: true,
  imports: [FormsModule, MatInputModule, MatButtonModule, CommonModule, MatIconModule],
  templateUrl: './branch-dialog.component.html',
  styleUrls: ['./branch-dialog.component.scss']
})
export class BranchDialogComponent {
  newArgument = '';

  constructor(
    public dialogRef: MatDialogRef<BranchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Branch
  ) {}

  addArgument(): void {
    if (this.newArgument.trim()) {
      this.data.arguments.push(this.newArgument.trim());
      this.newArgument = '';
    }
  }

  removeArgument(index: number): void {
    this.data.arguments.splice(index, 1);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}