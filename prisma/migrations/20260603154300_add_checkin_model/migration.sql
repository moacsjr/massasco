-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "status" "CheckInStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
ALTER TABLE "Order" ADD COLUMN "checkInId" TEXT,
ADD COLUMN "customerName" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_tableNumber_status_key" ON "CheckIn"("tableNumber", "status");