/*
  Warnings:

  - Added the required column `background_color` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `color` to the `members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "members" ADD COLUMN     "background_color" VARCHAR(7) NOT NULL,
ADD COLUMN     "color" VARCHAR(7) NOT NULL;
