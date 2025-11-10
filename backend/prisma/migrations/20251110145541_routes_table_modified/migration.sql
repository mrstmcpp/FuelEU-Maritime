/*
  Warnings:

  - You are about to alter the column `ghg_intensity` on the `routes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - Added the required column `distance` to the `routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fuel_consumption` to the `routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fuel_type` to the `routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_emissions` to the `routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vessel_type` to the `routes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "distance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fuel_consumption" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fuel_type" TEXT NOT NULL,
ADD COLUMN     "total_emissions" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "vessel_type" TEXT NOT NULL,
ALTER COLUMN "ghg_intensity" SET DATA TYPE DOUBLE PRECISION;
