-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "discountCents" INTEGER,
ALTER COLUMN "discountPercent" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "RewardConfig" ALTER COLUMN "centsPerPoint" SET DEFAULT 275,
ALTER COLUMN "goalPoints" SET DEFAULT 1200;

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "couponCode" TEXT NOT NULL,
    "pointsUsed" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RewardRedemption_couponCode_key" ON "RewardRedemption"("couponCode");

-- CreateIndex
CREATE INDEX "RewardRedemption_userId_idx" ON "RewardRedemption"("userId");

-- CreateIndex
CREATE INDEX "RewardRedemption_status_idx" ON "RewardRedemption"("status");

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
