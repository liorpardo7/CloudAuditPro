-- CreateTable
CREATE TABLE "admin_audit_categories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subcategories" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "lastRun" TIMESTAMP(3),
    "duration" INTEGER,
    "progress" INTEGER,
    "results" JSONB,
    "rawData" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_audit_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_comments" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "tags" TEXT[],
    "adminEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_backups" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "backupData" JSONB NOT NULL,
    "backupType" TEXT NOT NULL DEFAULT 'auto',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_audit_categories_categoryId_key" ON "admin_audit_categories"("categoryId");

-- AddForeignKey
ALTER TABLE "admin_comments" ADD CONSTRAINT "admin_comments_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "admin_audit_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_backups" ADD CONSTRAINT "admin_audit_backups_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "admin_audit_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
