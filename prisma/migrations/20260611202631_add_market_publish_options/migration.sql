-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "publish_offers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publish_wants" BOOLEAN NOT NULL DEFAULT false;
