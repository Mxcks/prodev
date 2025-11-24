/*
  Warnings:

  - Added the required column `keySequence` to the `typing_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "typing_sessions" ADD COLUMN     "keySequence" TEXT NOT NULL;
