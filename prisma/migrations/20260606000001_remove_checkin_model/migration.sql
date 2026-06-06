-- This migration prepares for removing the CheckIn model by making related columns nullable
-- The CheckIn model is kept for backward compatibility during migration

-- Step 1: Make checkInId nullable on Order table (if it was previously required)
ALTER TABLE "Order" ALTER COLUMN "checkInId" DROP NOT NULL;

-- Step 2: Make checkInId nullable on Payment table (if it was previously required)
ALTER TABLE "Payment" ALTER COLUMN "checkInId" DROP NOT NULL;

-- Step 3: Add tableSessionId to Order table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'tableSessionId') THEN
        ALTER TABLE "Order" ADD COLUMN "tableSessionId" TEXT;
        ALTER TABLE "Order" ADD CONSTRAINT "Order_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "table_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 4: Add tableSessionId to Payment table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'tableSessionId') THEN
        ALTER TABLE "Payment" ADD COLUMN "tableSessionId" TEXT;
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "table_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Note: The CheckIn table is kept for backward compatibility during migration
-- It can be dropped later after all data has been migrated to TableSession