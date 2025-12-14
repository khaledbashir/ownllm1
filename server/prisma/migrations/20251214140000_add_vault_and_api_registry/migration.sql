-- CreateTable
CREATE TABLE "integration_vault" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "service" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'integration',
    "userId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "integration_vault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_api_registry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "authType" TEXT NOT NULL DEFAULT 'none',
    "headers" TEXT,
    "bodySchema" TEXT,
    "responseExample" TEXT,
    "docsUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "integration_vault_userId_idx" ON "integration_vault"("userId");

-- CreateIndex
CREATE INDEX "integration_vault_service_idx" ON "integration_vault"("service");

-- CreateIndex
CREATE UNIQUE INDEX "integration_vault_userId_service_name_key" ON "integration_vault"("userId", "service", "name");

-- CreateIndex
CREATE INDEX "public_api_registry_category_idx" ON "public_api_registry"("category");

-- CreateIndex
CREATE UNIQUE INDEX "public_api_registry_category_name_key" ON "public_api_registry"("category", "name");
