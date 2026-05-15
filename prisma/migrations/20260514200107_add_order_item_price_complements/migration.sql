-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "selectedComplements" JSONB,
ADD COLUMN     "selectedPriceId" TEXT;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_selectedPriceId_fkey" FOREIGN KEY ("selectedPriceId") REFERENCES "ProductPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
