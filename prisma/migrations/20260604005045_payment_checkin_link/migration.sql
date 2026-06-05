/*
  Warnings:

  - Added the required column `checkInId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- Add checkInId column first (nullable)
ALTER TABLE "Payment" ADD COLUMN "checkInId" TEXT;

-- Update existing payments to have checkInId based on their order's checkIn
UPDATE "Payment" SET "checkInId" = (
  SELECT "checkInId" FROM "Order" WHERE "Order"."id" = "Payment"."orderId"
);

-- Make checkInId required
ALTER TABLE "Payment" ALTER COLUMN "checkInId" SET NOT NULL;

-- Make orderId nullable
ALTER TABLE "Payment" ALTER COLUMN "orderId" DROP NOT NULL;

-- Drop old foreign key
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_orderId_fkey";

-- Add new foreign keys
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
