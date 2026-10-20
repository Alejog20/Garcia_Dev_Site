-- Run once against DATABASE_URL after posts-add-featured-image.sql already
-- exists, via Neon's own SQL console or
-- `psql "$DATABASE_URL" -f scripts/posts-add-category.sql`.
-- Not run automatically by anything — this site has no migration runner.

alter table posts add column if not exists category text;
