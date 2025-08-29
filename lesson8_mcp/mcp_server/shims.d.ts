// Minimal shims to keep TypeScript happy in environments without @types/node
declare module 'node:http';
declare module 'http';

// Provide a loose type for the Node/Bun process global
declare var process: any;
