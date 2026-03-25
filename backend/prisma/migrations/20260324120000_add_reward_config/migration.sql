-- CreateTable
CREATE TABLE "RewardConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "centsPerPoint" INTEGER NOT NULL DEFAULT 400,
    "pointValueCents" INTEGER NOT NULL DEFAULT 100,
    "goalPoints" INTEGER NOT NULL DEFAULT 550,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardConfig_pkey" PRIMARY KEY ("id")
);
