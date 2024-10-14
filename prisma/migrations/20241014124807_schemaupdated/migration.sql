/*
  Warnings:

  - Added the required column `userId` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
