import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-task',
  imports: [CommonModule],
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

}
