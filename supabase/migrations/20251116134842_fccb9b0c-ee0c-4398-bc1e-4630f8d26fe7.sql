-- Keep only the most recent resource for each user and delete the rest
DELETE FROM resources
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM resources
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint on user_id to ensure one resource per user
CREATE UNIQUE INDEX one_resource_per_user ON resources(user_id);

-- Add comment
COMMENT ON INDEX one_resource_per_user IS 'هر کاربر فقط می‌تواند یک منبع داشته باشد';