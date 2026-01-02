-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a daily cron job to auto-generate news at 9 AM UTC
SELECT cron.schedule(
  'daily-news-generation',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://oqxfqkwxelcwqndenyzx.supabase.co/functions/v1/auto-generate-news',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xeGZxa3d4ZWxjd3FuZGVueXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjEwNTgsImV4cCI6MjA4MDg5NzA1OH0._hbFFHv_1jEIfixK2GgpOXgEnp8eHJ2f5QjLWVixQr4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);