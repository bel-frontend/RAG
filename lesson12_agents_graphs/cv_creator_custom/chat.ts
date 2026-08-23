import { Command } from '@langchain/langgraph';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { randomUUID } from 'node:crypto';

import { candidateText, vacancyText } from './dataPrepare.ts';
import { app, createConfig } from './orchestrator.ts';

type InterruptChunk = {
  __interrupt__?: Array<{ value: string }>;
};

async function runChat() {
  const terminal = createInterface({ input, output });
  const config = createConfig(randomUUID());
  let graphInput: Record<string, unknown> | Command = {
    candidateText,
    vacancyText,
  };

  console.log('CV assistant started.\n');

  try {
    while (true) {
      let answer: string | undefined;

      for await (const chunk of await app.stream(graphInput, config)) {
        const step = Object.keys(chunk)[0];

        if (step !== '__interrupt__') {
          console.log(`[step: ${step}]`);
        }

        const question = (chunk as InterruptChunk).__interrupt__?.[0]?.value;
        if (!question) continue;

        console.log(`\nAssistant: ${question}`);
        answer = await terminal.question('\nYou: ');
      }

      if (answer === undefined) {
        const state = await app.getState(config);
        console.log('\nCV is ready:\n', state.values.cv);
        break;
      }

      graphInput = new Command({ resume: answer });
    }
  } finally {
    terminal.close();
  }
}

runChat().catch((error) => {
  console.error('Chat failed:', error);
  process.exitCode = 1;
});
