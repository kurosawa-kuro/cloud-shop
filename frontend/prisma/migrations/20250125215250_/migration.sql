-- AlterTable
ALTER TABLE "UserActionLog" ADD COLUMN     "requestID" TEXT;

-- CreateIndex
CREATE INDEX "UserActionLog_requestID_idx" ON "UserActionLog"("requestID");
