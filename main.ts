// main.ts — the program the harness runs: read every case from
// /input/cases.json, answer each with solve.js's run, and write the
// answers to /output/answers.json. Runs on Node 22.18 or later.

import { setFlagsFromString } from 'node:v8';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// V8's incremental marking off, as the house baseline's driver does,
// before solve.js is imported: the answers are chains of joined
// strings, and marking them a step at a time costs wall time.
setFlagsFromString('--no-incremental-marking');

const { run } = await import('./solve.js');

const cases = JSON.parse(readFileSync('/input/cases.json', 'utf8'));
const answers = new Array(cases.length);
for (let k = 0; k < cases.length; k++) {
  answers[k] = run(cases[k].input);
}
mkdirSync('/output', { recursive: true });
writeFileSync('/output/answers.json', JSON.stringify(answers));
