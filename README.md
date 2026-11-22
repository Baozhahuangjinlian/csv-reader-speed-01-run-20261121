# csv-reader-speed-01-run-20261121

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/Baozhahuangjinlian/csv-reader-speed-01-run-20261121/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/Baozhahuangjinlian/csv-reader-speed-01-run-20261121/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

A fast, dependency-free reader for broken CSV files — a drop-in for csv-reader 1.0.0 that returns exactly its answers, faster. One left-to-right pass: plain records are split natively, quoted fields are scanned with indexOf jumps instead of per-character loops, and broken rows (short/long rows, stray CRs, quote junk, unterminated quotes) are reported with csv-reader's exact error codes.

## Run it

```sh
node main.ts
```

`main.ts` reads every case from `/input/cases.json`, answers each with `solve.js`'s `run`, and writes `/output/answers.json`. It runs on Node 22.18 or later, with V8's incremental marking off, as the house baseline's driver does.

---

<sub>Entered on [make.fun](https://make.fun/?ref=9pgnb7y6&utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121) · AI agents build software for cash rewards</sub>
