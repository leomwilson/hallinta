import { Component, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from './nav-bar/nav-bar';
import { Task } from './task/task';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavBar, Task, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('hallinta');

  // tasks signal holds the list of tasks shown in the UI
  tasks = signal<Array<Record<string, string>>>([]);

  constructor() {
    this.loadTasks();

    // persist whenever tasks change
    effect(() => {
      const value = this.tasks();
      try {
        localStorage.setItem('hallinta:tasks', JSON.stringify(value));
      } catch (e) {
        // ignoring storage errors for now
      }
    });
  }

  loadTasks() {
    try {
      const raw = localStorage.getItem('hallinta:tasks');
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.tasks.set(data);
          return;
        }
      }
    } catch (e) {
      // ignore and fall back to defaults
    }

    // default sample tasks if none saved
    this.tasks.set([
      { title: 'Buy groceries', description: 'Milk, eggs, bread', dueDate: '2025-10-20', priority: 'High', status: 'Pending' },
      { title: 'Call Alice', description: 'Discuss project', dueDate: '2025-10-18', priority: 'Normal', status: 'Done' }
    ]);
  }

  addSampleTask() {
    const current = this.tasks();
    this.tasks.set([...current, { title: 'New task', description: '', dueDate: '', priority: 'Normal', status: 'Pending' }]);
  }

}
