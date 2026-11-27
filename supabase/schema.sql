-- =====================================================================
-- SV Soltau – Soccer Coach: Datenbank (Supabase, Region EU)
-- Einmal komplett im Supabase "SQL Editor" ausführen.
--
-- Gespeichert wird NUR: Kind (Vorname/Spitzname + verschlüsselter Code),
-- erledigte Einheit + Datum, Anwesenheit beim Training.
-- Dazu (keine Personendaten): Trainingstermine und Wochenplan.
--
-- Zugriff:
--  * Kinder haben KEINEN direkten Tabellenzugriff. Sie nutzen nur die
--    Funktionen kind_* und weisen sich mit ihrem Code aus -> sehen nur
--    ihre eigenen Daten.
--  * Trainer melden sich mit E-Mail/Passwort an und stehen in der Tabelle
--    "trainer" -> dürfen alles sehen und verwalten.
-- =====================================================================

-- ---------- Tabellen ----------
create table if not exists public.trainer (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table if not exists public.kind (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 30),
  code_hash text not null unique
);

create table if not exists public.erledigung (
  kind_id uuid not null references public.kind (id) on delete cascade,
  uebung_id text not null check (uebung_id ~ '^[a-z0-9-]{1,60}$'),
  datum date not null,
  primary key (kind_id, uebung_id, datum)
);
create index if not exists erledigung_datum on public.erledigung (datum);

create table if not exists public.training (
  id uuid primary key default gen_random_uuid(),
  datum date not null unique
);

create table if not exists public.anwesenheit (
  training_id uuid not null references public.training (id) on delete cascade,
  kind_id uuid not null references public.kind (id) on delete cascade,
  anwesend boolean not null,
  primary key (training_id, kind_id)
);

create table if not exists public.wochenplan (
  woche date not null check (extract(isodow from woche) = 1), -- immer ein Montag
  uebung_id text not null check (uebung_id ~ '^[a-z0-9-]{1,60}$'),
  art text not null check (art in ('basis', 'zusatz')),
  primary key (woche, uebung_id)
);

-- ---------- Hilfsfunktionen ----------
create or replace function public.ist_trainer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trainer where user_id = auth.uid());
$$;

-- Codes werden nur als SHA-256-Hash gespeichert
create or replace function public.hash_code(p_code text) returns text
language sql immutable set search_path = public as $$
  select encode(sha256(convert_to(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'UTF8')), 'hex');
$$;

-- 6 Zeichen, ohne verwechselbare Zeichen (0/O, 1/I/L); kryptografisch zufällig
create or replace function public.neuer_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  zeichen constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- 31 Zeichen
  b bytea := uuid_send(gen_random_uuid());
  c text := '';
begin
  for i in 0..5 loop
    c := c || substr(zeichen, (get_byte(b, i) % 31) + 1, 1);
  end loop;
  return c;
end $$;

create or replace function public.kind_per_code(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare k uuid;
begin
  select id into k from public.kind where code_hash = public.hash_code(p_code);
  if k is null then
    perform pg_sleep(1); -- bremst Durchprobieren
    raise exception 'Code unbekannt' using errcode = 'P0001';
  end if;
  return k;
end $$;

-- ---------- Row Level Security ----------
alter table public.trainer enable row level security;
alter table public.kind enable row level security;
alter table public.erledigung enable row level security;
alter table public.training enable row level security;
alter table public.anwesenheit enable row level security;
alter table public.wochenplan enable row level security;

drop policy if exists trainer_selbst on public.trainer;
create policy trainer_selbst on public.trainer for select to authenticated using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['kind', 'erledigung', 'training', 'anwesenheit', 'wochenplan'] loop
    execute format('drop policy if exists trainer_alles on public.%I', t);
    execute format('create policy trainer_alles on public.%I for all to authenticated using (public.ist_trainer()) with check (public.ist_trainer())', t);
  end loop;
end $$;

-- Anonyme Besucher (Kinder) dürfen keine Tabelle direkt lesen oder schreiben
revoke all on all tables in schema public from anon;

-- ---------- Funktionen für Kinder (mit Code) ----------
create or replace function public.kind_daten(p_code text, p_woche date) returns json
language plpgsql security definer set search_path = public as $$
declare k uuid := public.kind_per_code(p_code);
begin
  return json_build_object(
    'name', (select name from public.kind where id = k),
    'plan', coalesce((select json_agg(json_build_object('uebung_id', uebung_id, 'art', art))
                      from public.wochenplan where woche = p_woche), '[]'::json),
    'verpasst', (select count(*) from public.anwesenheit a join public.training t on t.id = a.training_id
                 where a.kind_id = k and not a.anwesend and t.datum >= p_woche and t.datum < p_woche + 7),
    'historie', coalesce((select json_agg(json_build_object('uebung_id', uebung_id, 'datum', datum) order by datum)
                          from public.erledigung where kind_id = k), '[]'::json)
  );
end $$;

create or replace function public.kind_abhaken(p_code text, p_uebung text, p_datum date) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  k uuid := public.kind_per_code(p_code);
  montag date;
begin
  if p_datum not between current_date - 7 and current_date + 1 then
    raise exception 'Datum ungültig' using errcode = 'P0001';
  end if;
  montag := date_trunc('week', p_datum)::date;
  -- jede Übung zählt nur einmal pro Woche
  if exists (select 1 from public.erledigung where kind_id = k and uebung_id = p_uebung
             and datum >= montag and datum < montag + 7) then
    return false;
  end if;
  insert into public.erledigung (kind_id, uebung_id, datum) values (k, p_uebung, p_datum);
  return true;
end $$;

create or replace function public.kind_zuruecknehmen(p_code text, p_uebung text, p_woche date) returns boolean
language plpgsql security definer set search_path = public as $$
declare k uuid := public.kind_per_code(p_code);
begin
  delete from public.erledigung where kind_id = k and uebung_id = p_uebung
    and datum >= p_woche and datum < p_woche + 7;
  return found;
end $$;

-- ---------- Funktionen für Trainer ----------
create or replace function public.trainer_kind_anlegen(p_name text) returns json
language plpgsql security definer set search_path = public as $$
declare c text; neu uuid;
begin
  if not public.ist_trainer() then raise exception 'Nur für Trainer' using errcode = '42501'; end if;
  loop
    c := public.neuer_code();
    begin
      insert into public.kind (name, code_hash) values (btrim(p_name), public.hash_code(c)) returning id into neu;
      exit;
    exception when unique_violation then -- Code schon vergeben, neuer Versuch
    end;
  end loop;
  return json_build_object('id', neu, 'code', c);
end $$;

create or replace function public.trainer_code_neu(p_kind uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.ist_trainer() then raise exception 'Nur für Trainer' using errcode = '42501'; end if;
  loop
    c := public.neuer_code();
    begin
      update public.kind set code_hash = public.hash_code(c) where id = p_kind;
      if not found then raise exception 'Kind nicht gefunden' using errcode = 'P0002'; end if;
      exit;
    exception when unique_violation then
    end;
  end loop;
  return c;
end $$;

-- ---------- Rechte auf Funktionen ----------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.kind_daten(text, date) to anon, authenticated;
grant execute on function public.kind_abhaken(text, text, date) to anon, authenticated;
grant execute on function public.kind_zuruecknehmen(text, text, date) to anon, authenticated;
grant execute on function public.trainer_kind_anlegen(text) to authenticated;
grant execute on function public.trainer_code_neu(uuid) to authenticated;
grant execute on function public.ist_trainer() to authenticated;
grant execute on function public.hash_code(text) to authenticated;
grant execute on function public.neuer_code() to authenticated;

-- =====================================================================
-- Trainer freischalten (nachdem der Trainer unter Authentication -> Users
-- angelegt wurde). E-Mail anpassen und ausführen:
--
--   insert into public.trainer (user_id)
--   select id from auth.users where email = 'trainer@example.de';
-- =====================================================================

-- =====================================================================
-- Trainer-Team verwalten (aus der App, Reiter „Team“)
-- =====================================================================
drop function if exists public.trainer_liste();
create or replace function public.trainer_liste()
returns table (email text, ich boolean, aktiv boolean, zuletzt timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_trainer() then raise exception 'Nur für Trainer' using errcode = '42501'; end if;
  return query
    select u.email::text, (u.id = auth.uid()), (u.email_confirmed_at is not null and u.last_sign_in_at is not null), u.last_sign_in_at
    from public.trainer t join auth.users u on u.id = t.user_id
    order by u.email;
end $$;

-- Ergebnis: 'ok', 'schon' (war schon Trainer) oder 'unbekannt' (Nutzer erst in Supabase anlegen)
create or replace function public.trainer_freischalten(p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.ist_trainer() then raise exception 'Nur für Trainer' using errcode = '42501'; end if;
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then return 'unbekannt'; end if;
  insert into public.trainer (user_id) values (uid) on conflict do nothing;
  if not found then return 'schon'; end if;
  return 'ok';
end $$;

-- Ergebnis: 'ok', 'letzter' (der letzte Trainer kann nicht entfernt werden) oder 'unbekannt'
create or replace function public.trainer_entfernen(p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.ist_trainer() then raise exception 'Nur für Trainer' using errcode = '42501'; end if;
  select u.id into uid from auth.users u join public.trainer t on t.user_id = u.id where lower(u.email) = lower(btrim(p_email));
  if uid is null then return 'unbekannt'; end if;
  if (select count(*) from public.trainer) <= 1 then return 'letzter'; end if;
  delete from public.trainer where user_id = uid;
  return 'ok';
end $$;

revoke execute on function public.trainer_liste() from public, anon;
revoke execute on function public.trainer_freischalten(text) from public, anon;
revoke execute on function public.trainer_entfernen(text) from public, anon;
grant execute on function public.trainer_liste() to authenticated;
grant execute on function public.trainer_freischalten(text) to authenticated;
grant execute on function public.trainer_entfernen(text) to authenticated;

-- =====================================================================
-- Team-Fortschritt für die Kinder-Ansicht (nur Summen, keine Namen)
-- p_basis: Pflicht-Übungen des automatischen Plans (falls kein eigener Plan in der DB)
-- =====================================================================
create or replace function public.team_fortschritt(p_code text, p_woche date, p_basis text[]) returns json
language plpgsql security definer set search_path = public as $$
declare
  k uuid := public.kind_per_code(p_code);
  b text[];
begin
  if p_basis is null or cardinality(p_basis) = 0 or cardinality(p_basis) > 30 then
    raise exception 'Plan ungültig' using errcode = 'P0001';
  end if;
  select coalesce(array_agg(uebung_id), p_basis) into b from public.wochenplan where woche = p_woche and art = 'basis';
  return (
    with je as (
      select
        (select count(distinct e.uebung_id) from public.erledigung e
          where e.kind_id = kd.id and e.datum >= p_woche and e.datum < p_woche + 7 and e.uebung_id = any (b)) as basis_ist,
        (select count(distinct e.uebung_id) from public.erledigung e
          where e.kind_id = kd.id and e.datum >= p_woche and e.datum < p_woche + 7 and not (e.uebung_id = any (b))) as extra_erledigt,
        2 * (select count(*) from public.anwesenheit a join public.training t on t.id = a.training_id
          where a.kind_id = kd.id and not a.anwesend and t.datum >= p_woche and t.datum < p_woche + 7) as extra_soll
      from public.kind kd
    ), w as (
      select basis_ist + least(extra_erledigt, extra_soll) as ist, cardinality(b) + extra_soll as soll from je
    )
    select json_build_object(
      'kinder', count(*),
      'fertig', count(*) filter (where soll > 0 and ist >= soll),
      'ist', coalesce(sum(ist), 0),
      'soll', coalesce(sum(soll), 0))
    from w
  );
end $$;

revoke execute on function public.team_fortschritt(text, date, text[]) from public;
grant execute on function public.team_fortschritt(text, date, text[]) to anon, authenticated;

-- Schnittstelle neu laden, damit neue Funktionen sofort erreichbar sind
notify pgrst, 'reload schema';
