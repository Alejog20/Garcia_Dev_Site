-- Run once against DATABASE_URL after creating the Neon project, via
-- Neon's own SQL console (Dashboard -> your project -> SQL Editor) or
-- `psql "$DATABASE_URL" -f scripts/leads-schema.sql`. Not run automatically
-- by anything — this site has no migration runner or build step.

create table if not exists leads (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  handled boolean not null default false
);
