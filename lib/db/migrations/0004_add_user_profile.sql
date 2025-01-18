CREATE TABLE IF NOT EXISTS "UserProfile" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "role" varchar(32) NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "UserProfile_id_pk" PRIMARY KEY("id")
);

DO $$ BEGIN
    ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 