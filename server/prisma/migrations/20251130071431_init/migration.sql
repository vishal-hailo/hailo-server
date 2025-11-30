-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('HOME', 'OFFICE', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommuteLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originLocationId" TEXT,
    "destLocationId" TEXT,
    "originLat" DOUBLE PRECISION,
    "originLng" DOUBLE PRECISION,
    "destLat" DOUBLE PRECISION,
    "destLng" DOUBLE PRECISION,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uberEstimateMin" INTEGER,
    "uberEstimateMax" INTEGER,
    "uberCurrency" TEXT DEFAULT 'INR',
    "etaSeconds" INTEGER,
    "surgePercent" DOUBLE PRECISION,
    "handoffClicked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CommuteLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "CommuteLog_userId_searchedAt_idx" ON "CommuteLog"("userId", "searchedAt");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommuteLog" ADD CONSTRAINT "CommuteLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommuteLog" ADD CONSTRAINT "CommuteLog_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommuteLog" ADD CONSTRAINT "CommuteLog_destLocationId_fkey" FOREIGN KEY ("destLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
