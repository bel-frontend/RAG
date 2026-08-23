type LessonTask = {
  id: number;
  title: string;
  tool: "Cursor" | "VS Code" | "Claude Code" | "Terminal";
  done: boolean;
};

const tasks: LessonTask[] = [
  {
    id: 1,
    title: "Адкрыць рэпазіторый у AI-рэдактары",
    tool: "Cursor",
    done: true,
  },
  {
    id: 2,
    title: "Спытаць AI пра мэту Урока 1",
    tool: "VS Code",
    done: true,
  },
  {
    id: 3,
    title: "Запусціць TypeScript-прыклад праз Bun",
    tool: "Terminal",
    done: false,
  },
  {
    id: 4,
    title: "Папрасіць Claude Code зрабіць маленькую праўку",
    tool: "Claude Code",
    done: false,
  },
];

function printTasks(items: LessonTask[]): void {
  for (const task of items) {
    const status = task.done ? "done" : "todo";
    console.log(`${task.id}. [${status}] ${task.title} (${task.tool})`);
  }
}

function countCompleted(items: LessonTask[]): number {
  return items.filter((task) => task.done).length;
}

printTasks(tasks);
console.log(`\nВыканана: ${countCompleted(tasks)} з ${tasks.length}`);
