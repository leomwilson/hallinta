import { Component, signal, effect, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from './nav-bar/nav-bar';
import { Task } from './task/task';
import { CommonModule } from '@angular/common';

// top-level task type so methods and signals can use it
type TaskItem = {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  createdAt?: number;
};

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
  tasks = signal<TaskItem[]>([]);

  // derived sorted list according to dueDate, with no-date tasks at bottom
  // except the most recently created task which is placed before other no-date tasks
  sortedTasks = computed(() => {
    const list: TaskItem[] = this.tasks() || [];

    // ensure createdAt is numeric
    const normalized: TaskItem[] = list.map((t: TaskItem) => ({ ...t, createdAt: typeof t.createdAt === 'number' ? t.createdAt : 0 }));

    // helper to parse due date (ms) or NaN
    const parseDue = (t: TaskItem) => (t.dueDate ? Date.parse(t.dueDate) : NaN);

    // separate
    const withDate: { task: TaskItem; dueMs: number }[] = [];
    const withoutDate: TaskItem[] = [];

    normalized.forEach((t: TaskItem) => {
      const dueMs = parseDue(t);
      if (!isNaN(dueMs)) withDate.push({ task: t, dueMs });
      else withoutDate.push(t);
    });

    // sort withDate ascending
    withDate.sort((a, b) => a.dueMs - b.dueMs);

    const out: TaskItem[] = [];
    out.push(...withDate.map((x) => x.task));

  // find most recent createdAt among normalized
  const mostRecent = normalized.reduce((best: TaskItem | null, cur: TaskItem) => (cur.createdAt! > (best?.createdAt ?? 0) ? cur : best), normalized[0] || null);

    if (mostRecent) {
      const mostRecentHasDate = !isNaN(parseDue(mostRecent));
      if (!mostRecentHasDate) {
        // put the most recent no-date task first among no-date tasks
        const idx = withoutDate.findIndex((t) => t.createdAt === mostRecent.createdAt);
        if (idx >= 0) {
          out.push(withoutDate[idx]);
          withoutDate.splice(idx, 1);
        }
      }
    }

    out.push(...withoutDate);

    return out;
  });

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
          // ensure each task has a createdAt so we can identify the most recent
          const now = Date.now();
          const normalized = data.map((t: any, i: number) => ({ ...t, createdAt: t.createdAt ?? (now - (data.length - i)) }));
          this.tasks.set(normalized);
          return;
        }
      }
    } catch (e) {
      // ignore and fall back to defaults
    }

    // default sample tasks if none saved
    const now = Date.now();
    this.tasks.set([
      { title: 'Buy groceries', description: 'Milk, eggs, bread', dueDate: '2025-10-20', priority: 'High', status: 'Pending', createdAt: now - 2000 },
      { title: 'Call Alice', description: 'Discuss project', dueDate: '2025-10-18', priority: 'Normal', status: 'Done', createdAt: now - 1000 }
    ]);
  }

  addSampleTask() {
    const current = this.tasks();
    const newTask = { title: 'New task', description: '', dueDate: '', priority: 'Normal', status: 'Pending', createdAt: Date.now() };
    this.tasks.set([...current, newTask]);
  }

  onTaskChange(index: number, updated: Partial<TaskItem>) {
    const list = [...this.tasks()];
    const existing = list[index] || {};
    list[index] = { ...existing, ...updated, createdAt: existing.createdAt ?? Date.now() } as TaskItem;
    this.tasks.set(list);
  }

  onTaskChangeByCreatedAt(createdAt: number | string, updated: Partial<TaskItem>) {
    const list = [...this.tasks()];
    const idx = list.findIndex((t) => (t.createdAt ?? 0) === +createdAt);
    if (idx >= 0) {
      const existing = list[idx] || {};
      list[idx] = { ...existing, ...updated, createdAt: existing.createdAt ?? Date.now() } as TaskItem;
      this.tasks.set(list);
    }
  }

}
