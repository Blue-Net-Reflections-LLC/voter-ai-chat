ALTER TABLE "UserProfile" ALTER COLUMN "role" DROP NOT NULL;

-- Set existing roles to null
UPDATE "UserProfile" SET "role" = NULL; 