ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "firstName" varchar(64),
ADD COLUMN IF NOT EXISTS "lastName" varchar(64),
ADD COLUMN IF NOT EXISTS "image" varchar(256),
ADD COLUMN IF NOT EXISTS "emailVerified" timestamp; 