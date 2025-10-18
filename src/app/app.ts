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

    const parseDue = (t: TaskItem) => (t.dueDate ? Date.parse(t.dueDate) : NaN);
    const isCompleted = (t: TaskItem) => {
      const s = t.status ?? '';
      return s.toString().toLowerCase() === 'done' || s.toString().toLowerCase() === 'completed';
    };

    // partition into incomplete vs completed
    const incomplete: TaskItem[] = [];
    const completed: TaskItem[] = [];
    normalized.forEach((t) => {
      if (isCompleted(t)) completed.push(t);
      else incomplete.push(t);
    });

    // helper: split dated vs no-date
    const dated = (arr: TaskItem[]) => {
      const withDate: { task: TaskItem; dueMs: number }[] = [];
      const withoutDate: TaskItem[] = [];
      arr.forEach((t) => {
        const dueMs = parseDue(t);
        if (!isNaN(dueMs)) withDate.push({ task: t, dueMs });
        else withoutDate.push(t);
      });
      return { withDate, withoutDate };
    };

    const out: TaskItem[] = [];

    // process incomplete first
    const incSplit = dated(incomplete);
    incSplit.withDate.sort((a, b) => a.dueMs - b.dueMs);
    out.push(...incSplit.withDate.map((x) => x.task));

    // find most recent no-date among incomplete
    if (incSplit.withoutDate.length > 0) {
      let mostRecentIdx = 0;
      for (let i = 1; i < incSplit.withoutDate.length; i++) {
        if ((incSplit.withoutDate[i].createdAt ?? 0) > (incSplit.withoutDate[mostRecentIdx].createdAt ?? 0)) mostRecentIdx = i;
      }
      out.push(incSplit.withoutDate[mostRecentIdx]);
      for (let i = 0; i < incSplit.withoutDate.length; i++) {
        if (i === mostRecentIdx) continue;
        out.push(incSplit.withoutDate[i]);
      }
    }

    // now append completed tasks (they come after incomplete)
    const compSplit = dated(completed);
    compSplit.withDate.sort((a, b) => a.dueMs - b.dueMs);
    out.push(...compSplit.withDate.map((x) => x.task));

    // append remaining no-date completed tasks
    out.push(...compSplit.withoutDate);

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

  onTaskDelete(createdAt: number | string) {
    const list = this.tasks().filter((t) => (t.createdAt ?? 0) !== +createdAt);
    this.tasks.set(list);
  }

}
