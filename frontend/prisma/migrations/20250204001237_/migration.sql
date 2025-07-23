-- CreateEnum
CREATE TYPE "DisplayType" AS ENUM ('SALE', 'RECOMMENDED', 'REPURCHASE', 'DAILY_DEAL', 'RECOMMENDED_CATEGORY', 'CONTINUE_SHOPPING');

-- CreateTable
CREATE TABLE "TopPageDisplay" (
    "id" SERIAL NOT NULL,
    "displayType" "DisplayType" NOT NULL,
    "productId" INTEGER,
    "categoryId" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "specialPrice" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopPageDisplay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopPageDisplay_displayType_idx" ON "TopPageDisplay"("displayType");

-- CreateIndex
CREATE INDEX "TopPageDisplay_productId_idx" ON "TopPageDisplay"("productId");

-- CreateIndex
CREATE INDEX "TopPageDisplay_categoryId_idx" ON "TopPageDisplay"("categoryId");

-- CreateIndex
CREATE INDEX "TopPageDisplay_startDate_endDate_idx" ON "TopPageDisplay"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "TopPageDisplay_isActive_idx" ON "TopPageDisplay"("isActive");

-- AddForeignKey
ALTER TABLE "TopPageDisplay" ADD CONSTRAINT "TopPageDisplay_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopPageDisplay" ADD CONSTRAINT "TopPageDisplay_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
