-- Add approval status to users for administrator workflow
ALTER TABLE users ADD COLUMN approved BIT(1) NOT NULL DEFAULT 1;

-- Ensure all existing users are approved
UPDATE users SET approved = 1 WHERE approved IS NULL;
