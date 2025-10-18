import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-task',
  imports: [CommonModule, FormsModule],
  templateUrl: './task.html',
  styleUrl: './task.css'
})
export class Task {
  @Input() task?: {
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    status?: string;
  };
  @Output() taskChange = new EventEmitter<Record<string, string>>();

  // which field is being edited, or null
  editingField: string | null = null;

  // local editable copy while editing
  editModel: Record<string, string> = {} as Record<string, string>;

  startEdit(field: string) {
    this.editingField = field;
    // create shallow copy of task into editModel
    this.editModel = {
      title: this.task?.title || '',
      description: this.task?.description || '',
      dueDate: this.task?.dueDate || '',
      priority: this.task?.priority || '',
      status: this.task?.status || ''
    };
  }

  save() {
    if (!this.task) return;
    const updated = { ...this.task, ...this.editModel } as Record<string, string>;
    this.taskChange.emit(updated);
    this.editingField = null;
  }

  cancel() {
    this.editingField = null;
  }

}
