-- Make meti ranjbar admin
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM profiles
WHERE username = 'METIADMIN'
ON CONFLICT DO NOTHING;