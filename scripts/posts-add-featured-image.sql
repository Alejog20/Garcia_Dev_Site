-- Run once against DATABASE_URL after posts-schema.sql already exists, via
-- Neon's own SQL console or `psql "$DATABASE_URL" -f scripts/posts-add-featured-image.sql`.
-- Not run automatically by anything — this site has no migration runner.

alter table posts add column if not exists featured_image_url text;
