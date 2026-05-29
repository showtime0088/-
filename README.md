# GMAT Adaptive Practice MVP

This workspace contains the first runnable prototype for a GMAT-style adaptive practice site.

Open `index.html` in a browser to try the local prototype. It runs fully in the browser with sample questions from `data/questions.json`.

## Current MVP

- Section selection: Quant, Verbal, Data Insights
- 10-question adaptive practice
- Prep-style mock exam mode across Quant, Verbal, and Data Insights
- Difficulty starts at level 3
- Correct answer raises target difficulty
- Incorrect answer lowers target difficulty
- Per-question timer and total report
- Result summary with accuracy, average time, topic or section breakdown, estimated score, and review list

## Prep Mock Model

The mock mode is a product prototype, not an official scoring clone.

- 3 sections: Quant, Verbal, Data Insights
- 10 questions per section in this demo question bank
- Each section adapts independently
- Explanations are withheld until the final report
- Final report estimates a 205-805 style total score from weighted section performance

## Next Build Steps

1. Replace sample questions with a larger verified question bank.
2. Add login and user history.
3. Store attempts in a database.
4. Add admin question management.
5. Add official-length section settings and optional breaks.
6. Upgrade the adaptive model after collecting enough answer data.
