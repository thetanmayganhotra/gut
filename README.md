# Gut

A daily prediction game for India. Every day there are **4 YES/NO questions** — cricket, Bollywood, the internet, and one slow-burn question. You lock your gut call, and your **Gut rating** goes up or down based on how often you're right, especially when you went against the crowd.

Built with **Expo + expo-router** (iOS, Android, web).

## How the game works

- 4 questions a day, one per slot. Each has a clear **source**, threshold and deadline (no source, no question).
- Pick YES or NO. You can **boost** up to 2 picks (2× or 3× stake).
- Correct = +stake. Wrong = −stake. **Underdog bonus:** if less than 30% of the crowd was on your side at close and you're right, you get double points.
- **Gut rating** (1–99, starts at 50) moves after each result:
  `R_new = R_old + points/20 − (R_old − 50)/100`
  It only shows after 20 resolved predictions — until then it's `?`.
- Day streaks and a profile with your history.

Scoring logic is in `src/engine/scoring.ts`.

## Run it

```bash
npm install
npm start          # i / a / w
npm run typecheck
```

> The questions in `src/data/questions.ts` are **sample data** (made-up crowd numbers and outcomes) so the game loop works offline. The plan is to replace them with a live feed — the backend schema is in `supabase/schema.sql`.

## Layout

```
src/
  app/          screens (expo-router): Today, Profile
  engine/       scoring + day logic
  data/         question pool (sample)
  store/        state + persistence (AsyncStorage)
  ui/           QuestionCard, theme
supabase/       backend schema
```

## Stack

Expo · expo-router · React Native · TypeScript · AsyncStorage · Supabase (planned)

## License

MIT — see [LICENSE](LICENSE).
