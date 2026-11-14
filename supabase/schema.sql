-- Gut backend schema (not wired up yet — the app runs on local sample data).
-- The predictions columns are the "collect from day one" set: Pro analytics
-- depend on them and none can be backfilled.

create table questions (
  id text primary key,                 -- q_2026_10_03_2
  day date not null,
  slot smallint not null check (slot between 1 and 4),
  category text not null check (category in ('cricket', 'bollywood', 'internet', 'slow')),
  text text not null,
  source text not null,
  resolves_at timestamptz not null,
  crowd_yes_at_close smallint,
  outcome text check (outcome in ('YES', 'NO')),
  unique (day, slot)
);

create table predictions (
  user_id uuid not null references auth.users (id),
  question_id text not null references questions (id),
  category text not null,
  side text not null check (side in ('YES', 'NO')),
  boost smallint not null check (boost in (1, 2, 3)),
  crowd_pct_at_prediction smallint not null,  -- % of crowd on the user's side
  crowd_pct_at_close smallint,
  shown_at timestamptz not null,
  predicted_at timestamptz not null default now(),
  outcome text check (outcome in ('YES', 'NO')),
  points smallint,
  primary key (user_id, question_id)
);

alter table predictions enable row level security;
create policy "own rows" on predictions for select using (auth.uid() = user_id);
-- Inserts and scoring go through a server function so boosts (one 2x, one 3x
-- per day) and points can't be set from the client.
