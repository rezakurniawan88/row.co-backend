/*
  Warnings:

  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Product";

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "colors" TEXT[],
    "sizes" TEXT[],
    "images" TEXT[],
    "images_url" TEXT[],

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
