-- CreateTable
CREATE TABLE "AuditJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "started" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "AuditJob_pkey" PRIMARY KEY ("id")
);
