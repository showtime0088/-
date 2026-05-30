# GMAT Adaptive Practice MVP Rules

## Product Goal

Build a small, testable GMAT-style adaptive practice system before building the full mock exam platform.

## MVP Scope

- Users choose one section: Quant, Verbal, or Data Insights.
- Each practice session has 10 questions.
- Users can also start a Prep-style mock exam that runs Quant, Verbal, and Data Insights in sequence.
- The first question starts at difficulty 3.
- Difficulty is scored from 1 to 5.
- Users cannot revisit prior questions during a session.
- Users see explanations after finishing the session, not after each question.
- The result page shows accuracy, time, topic or section performance, estimated score, and question review.

## Prep Mock Exam V1

The mock exam mode imitates the structure of an official Prep experience at prototype scale.

- Section order: Quant, Verbal, Data Insights
- Section length: Quant 21 questions, Verbal 23 questions, Data Insights 20 questions
- Each section has its own adaptive difficulty path
- Each new section resets target difficulty to 3
- Users receive a section-complete screen before moving to the next section
- Explanations are hidden until the full mock is complete
- The final score is an internal estimate, not an official GMAT score

## Adaptive Rule V1

The MVP uses a simple rule-based adaptive model:

- Start target difficulty: 3
- Correct answer: target difficulty +1
- Incorrect answer: target difficulty -1
- Target difficulty is clamped between 1 and 5
- Next question should match the selected section and the target difficulty as closely as possible
- Already answered questions are excluded
- If no exact difficulty match exists, choose the nearest available difficulty

## Question Fields

Each question should include:

- `id`
- `section`: `Quant`, `Verbal`, or `Data Insights`
- `type`
- `topic`
- `difficulty`: 1-5
- `estimatedSeconds`
- `stem`
- `choices`
- `answer`
- `explanation`

## Success Criteria

The first prototype is successful when a user can:

1. Start a section practice.
2. Answer 10 adaptive questions.
3. Receive a useful report.
4. Review missed questions and explanations.

## Later Versions

After the MVP works, add:

- Accounts and saved history
- Full-length mock exams
- Admin question editor
- Payment and membership
- More realistic score estimation
- IRT-based adaptive selection after enough response data exists
