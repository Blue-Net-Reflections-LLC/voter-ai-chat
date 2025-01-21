INSERT INTO "UserProfile" ("userId", "role")
SELECT "id", 'voter' as "role"
FROM "User" u
WHERE NOT EXISTS (
    SELECT 1 FROM "UserProfile" up WHERE up."userId" = u."id"
);