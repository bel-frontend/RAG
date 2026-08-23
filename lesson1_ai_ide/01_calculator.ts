export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  return a / b;
}

const examples = [
  { operation: "add", a: 10, b: 5 },
  { operation: "subtract", a: 10, b: 5 },
  { operation: "multiply", a: 10, b: 5 },
  { operation: "divide", a: 10, b: 5 },
  { operation: "divide", a: 10, b: 0 },
];

for (const example of examples) {
  if (example.operation === "add") {
    console.log(`${example.a} + ${example.b} = ${add(example.a, example.b)}`);
  }

  if (example.operation === "subtract") {
    console.log(`${example.a} - ${example.b} = ${subtract(example.a, example.b)}`);
  }

  if (example.operation === "multiply") {
    console.log(`${example.a} * ${example.b} = ${multiply(example.a, example.b)}`);
  }

  if (example.operation === "divide") {
    console.log(`${example.a} / ${example.b} = ${divide(example.a, example.b)}`);
  }
}
