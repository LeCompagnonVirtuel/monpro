-- AlterTable: Make phone nullable for email-only accounts, add passwordHash for email auth
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;
