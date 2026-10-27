-- G.O.A.T. – databasschema
-- Kör den här filen i Supabase: SQL Editor → New query → klistra in → Run.
-- Kör sedan seed.sql på samma sätt för att lägga in alla kort.

-- Alla kort i spelet. Redigera dem i Table Editor → cards.
create table if not exists public.cards (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('vem', 'direkt', 'trivia', 'utmaning', 'minigame', 'bild')),
  text text not null,
  -- Namn på minigame
  title text,
  -- casual = del 1, party = del 2, cheeky = del 3, dirty = del 4, framtid = alla delar
  category text check (category in ('casual', 'party', 'cheeky', 'dirty', 'framtid')),
  -- Trivia: 1 = lätt, 2 = mellan, 3 = svår
  difficulty int check (difficulty between 1 and 3),
  -- Trivia: rätt svar och tre felaktiga alternativ
  answer text,
  wrong_answers text[],
  -- Utmaningar: 0 = hela gruppen, 1 = solo, 2 = X och Y, 3 = två lag
  players int not null default 1 check (players between 0 and 3),
  -- Sätt till false för att plocka bort ett kort utan att radera det
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Ett pågående spel. Hela spelläget ligger i "state".
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  version int not null default 0,
  state jsonb not null,
  secrets jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Vilka spelare som är uppkopplade just nu.
create table if not exists public.presence (
  game_id uuid not null references public.games (id) on delete cascade,
  player_id text not null,
  last_seen timestamptz not null default now(),
  primary key (game_id, player_id)
);

create index if not exists games_created_at_idx on public.games (created_at);

-- Ingen får läsa eller skriva direkt från webbläsaren. All åtkomst
-- går via sidans server med den hemliga nyckeln.
alter table public.cards enable row level security;
alter table public.games enable row level security;
alter table public.presence enable row level security;

-- Bilder (selfies och "Vems är bilden?"). Raderas när spelet avslutas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
