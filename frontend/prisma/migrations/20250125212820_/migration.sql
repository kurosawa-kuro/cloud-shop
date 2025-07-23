/*
  Warnings:

  - You are about to drop the column `addressData` on the `UserActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryStatus` on the `UserActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `filterData` on the `UserActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `profileUpdateData` on the `UserActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `searchQuery` on the `UserActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sortData` on the `UserActionLog` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserActionLog" DROP CONSTRAINT "UserActionLog_cartItemId_fkey";

-- DropForeignKey
ALTER TABLE "UserActionLog" DROP CONSTRAINT "UserActionLog_productId_fkey";

-- DropForeignKey
ALTER TABLE "UserActionLog" DROP CONSTRAINT "UserActionLog_orderId_fkey";

-- DropForeignKey
ALTER TABLE "UserActionLog" DROP CONSTRAINT "UserActionLog_userId_fkey";

-- DropIndex
DROP INDEX "CartItem_productId_idx";

-- DropIndex
DROP INDEX "CartItem_userId_idx";

-- DropIndex
DROP INDEX "UserActionLog_cartItemId_idx";

-- DropIndex
DROP INDEX "UserActionLog_productId_idx";

-- DropIndex
DROP INDEX "UserActionLog_orderId_idx";

-- AlterTable
ALTER TABLE "UserActionLog" DROP COLUMN "addressData",
DROP COLUMN "deliveryStatus",
DROP COLUMN "filterData",
DROP COLUMN "profileUpdateData",
DROP COLUMN "searchQuery",
DROP COLUMN "sortData";
