-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "selective_offers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_profiles" ADD COLUMN "selective_wants" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "market_publish_selections" (
    "user_id" TEXT NOT NULL,
    "sticker_code" VARCHAR(16) NOT NULL,
    "listing_type" VARCHAR(8) NOT NULL,

    CONSTRAINT "market_publish_selections_pkey" PRIMARY KEY ("user_id","sticker_code","listing_type")
);

-- CreateIndex
CREATE INDEX "market_publish_selections_user_id_listing_type_idx" ON "market_publish_selections"("user_id", "listing_type");

-- AddForeignKey
ALTER TABLE "market_publish_selections" ADD CONSTRAINT "market_publish_selections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_publish_selections" ADD CONSTRAINT "market_publish_selections_sticker_code_fkey" FOREIGN KEY ("sticker_code") REFERENCES "stickers"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
