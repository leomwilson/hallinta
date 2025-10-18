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
    createdAt?: number;
  };
  @Output() taskChange = new EventEmitter<Partial<Record<string, string | number>>>();

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

  // commit current edit (on blur or Enter)
  commitEdit() {
    if (!this.task || !this.editingField) {
      this.editingField = null;
      return;
    }

    const key = this.editingField as keyof typeof this.editModel;
    const value = this.editModel[key];

    const payload: Partial<Record<string, string | number>> = {};
    // include createdAt if present so parent can identify the task
    if (this.task.createdAt !== undefined) payload['createdAt'] = this.task.createdAt;
    if (value !== undefined) payload[key as string] = value as string | number;

    this.taskChange.emit(payload);
    this.editingField = null;
  }

  onInputKey(event: Event) {
    const ke = event as KeyboardEvent;
    if (ke.key === 'Enter') this.commitEdit();
  }

}
