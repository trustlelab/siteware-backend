/*
  Warnings:

  - You are about to drop the column `phoneNumberLabel` on the `TwilioNumber` table. All the data in the column will be lost.
  - Made the column `label` on table `TwilioNumber` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TwilioNumber" DROP COLUMN "phoneNumberLabel",
ALTER COLUMN "label" SET NOT NULL;
