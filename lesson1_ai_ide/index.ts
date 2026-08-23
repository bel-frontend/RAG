const examples = [
  "./01_calculator.ts",
  "./02_text_stats.ts",
  "./03_task_list.ts",
  "./04_command_helper.ts",
];

for (const example of examples) {
  console.log("\n" + "=".repeat(72));
  await import(example);
}
