-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "show_in_market" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "market_listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sticker_code" VARCHAR(16) NOT NULL,
    "listing_type" VARCHAR(8) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_listings_listing_type_is_active_idx" ON "market_listings"("listing_type", "is_active");

-- CreateIndex
CREATE INDEX "market_listings_sticker_code_is_active_idx" ON "market_listings"("sticker_code", "is_active");

-- CreateIndex
CREATE INDEX "market_listings_user_id_is_active_idx" ON "market_listings"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "market_listings_user_id_sticker_code_listing_type_key" ON "market_listings"("user_id", "sticker_code", "listing_type");

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_sticker_code_fkey" FOREIGN KEY ("sticker_code") REFERENCES "stickers"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
