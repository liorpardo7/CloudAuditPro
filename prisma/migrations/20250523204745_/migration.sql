/*
  Warnings:

  - A unique constraint covering the columns `[gcpProjectId,userId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gcpProjectId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "gcpProjectId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_gcpProjectId_userId_key" ON "Project"("gcpProjectId", "userId");
