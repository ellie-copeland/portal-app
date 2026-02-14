/*
  Warnings:

  - Added the required column `updatedAt` to the `user_api_keys` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "encryptedConfig" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '7 days';

-- AlterTable
ALTER TABLE "user_api_keys" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();
