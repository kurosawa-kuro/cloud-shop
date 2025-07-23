/*
  Warnings:

  - The values [COMPLETE_ORDER,RETURN_REQUESTED,RETURN_COMPLETED,PROFILE_UPDATE,DELETE_ACCOUNT] on the enum `ActionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deleteReason` on the `UserActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `paymentErrorDetails` on the `UserActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `returnReason` on the `UserActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `savedForLater` on the `UserActionLog` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActionType_new" AS ENUM ('CART_ADD', 'CART_REMOVE', 'CART_UPDATE', 'CART_READD', 'ORDER_COMPLETE', 'ORDER_CANCEL', 'ORDER_RETURN_REQUEST', 'ORDER_RETURN_COMPLETE', 'SEARCH_BY_KEYWORD', 'SEARCH_BY_CATEGORY', 'REVIEW_START', 'REVIEW_SUBMIT', 'USER_REGISTER_START', 'USER_REGISTER_COMPLETE', 'USER_UPDATE', 'USER_LOGIN', 'USER_LOGOUT', 'USER_DELETE');
ALTER TABLE "UserActionLog" ALTER COLUMN "actionType" TYPE "ActionType_new" USING ("actionType"::text::"ActionType_new");
ALTER TYPE "ActionType" RENAME TO "ActionType_old";
ALTER TYPE "ActionType_new" RENAME TO "ActionType";
DROP TYPE "ActionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "UserActionLog" DROP COLUMN "deleteReason",
DROP COLUMN "paymentErrorDetails",
DROP COLUMN "returnReason",
DROP COLUMN "savedForLater",
ADD COLUMN     "actionReason" TEXT,
ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "categoryName" TEXT,
ADD COLUMN     "errorDetails" TEXT,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "searchCategoryId" INTEGER,
ADD COLUMN     "searchCategoryName" TEXT,
ADD COLUMN     "searchKeyword" TEXT;
