-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommuteLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "originLocationId" TEXT,
    "destLocationId" TEXT,
    "originLat" REAL,
    "originLng" REAL,
    "destLat" REAL,
    "destLng" REAL,
    "searchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uberEstimateMin" INTEGER,
    "uberEstimateMax" INTEGER,
    "uberCurrency" TEXT DEFAULT 'INR',
    "etaSeconds" INTEGER,
    "surgePercent" REAL,
    "handoffClicked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CommuteLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommuteLog_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommuteLog_destLocationId_fkey" FOREIGN KEY ("destLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "CommuteLog_userId_searchedAt_idx" ON "CommuteLog"("userId", "searchedAt");
