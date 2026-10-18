-- Run once against DATABASE_URL after the leads table already exists, via
-- Neon's own SQL console (Dashboard -> your project -> SQL Editor) or
-- `psql "$DATABASE_URL" -f scripts/posts-schema.sql`. Not run automatically
-- by anything — this site has no migration runner or build step.

create table if not exists posts (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  excerpt text,
  body_markdown text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
