type CommandExample = {
  title: string;
  command: string;
  description: string;
};

const commands: CommandExample[] = [
  {
    title: "Запусціць усе прыклады ўрока",
    command: "bun run lesson1_ai_ide/index.ts",
    description: "Карысна для хуткай праверкі пасля змен.",
  },
  {
    title: "Запусціць калькулятар",
    command: "bun run lesson1_ai_ide/01_calculator.ts",
    description: "Паказвае базавыя функцыі і праблему дзялення на нуль.",
  },
  {
    title: "Паглядзець diff",
    command: "git diff -- lesson1_ai_ide",
    description: "Паказвае, што змяніў AI-інструмент.",
  },
];

function printCommandHelp(items: CommandExample[]): void {
  console.log("Каманды для Урока 1\n");

  for (const item of items) {
    console.log(item.title);
    console.log(`  ${item.command}`);
    console.log(`  ${item.description}\n`);
  }
}

printCommandHelp(commands);
