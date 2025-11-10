-- CreateTable
CREATE TABLE "routes" (
    "id" SERIAL NOT NULL,
    "route_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "ghg_intensity" DECIMAL(65,30) NOT NULL,
    "is_baseline" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ships" (
    "id" SERIAL NOT NULL,
    "ship_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ship_compliance" (
    "id" SERIAL NOT NULL,
    "ship_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "cb_gco2eq" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ship_compliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_entries" (
    "id" SERIAL NOT NULL,
    "ship_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount_gco2eq" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_members" (
    "pool_id" INTEGER NOT NULL,
    "ship_id" INTEGER NOT NULL,
    "cb_before" DECIMAL(65,30) NOT NULL,
    "cb_after" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pool_members_pkey" PRIMARY KEY ("pool_id","ship_id")
);

-- CreateIndex
CREATE INDEX "routes_route_id_year_idx" ON "routes"("route_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ships_ship_id_key" ON "ships"("ship_id");

-- CreateIndex
CREATE INDEX "ship_compliance_ship_id_year_idx" ON "ship_compliance"("ship_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ship_compliance_ship_id_year_key" ON "ship_compliance"("ship_id", "year");

-- CreateIndex
CREATE INDEX "bank_entries_ship_id_year_idx" ON "bank_entries"("ship_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "bank_entries_ship_id_year_key" ON "bank_entries"("ship_id", "year");

-- CreateIndex
CREATE INDEX "pools_year_idx" ON "pools"("year");

-- CreateIndex
CREATE INDEX "pool_members_pool_id_idx" ON "pool_members"("pool_id");

-- CreateIndex
CREATE INDEX "pool_members_ship_id_idx" ON "pool_members"("ship_id");

-- AddForeignKey
ALTER TABLE "ship_compliance" ADD CONSTRAINT "ship_compliance_ship_id_fkey" FOREIGN KEY ("ship_id") REFERENCES "ships"("ship_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_entries" ADD CONSTRAINT "bank_entries_ship_id_fkey" FOREIGN KEY ("ship_id") REFERENCES "ships"("ship_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_ship_id_fkey" FOREIGN KEY ("ship_id") REFERENCES "ships"("ship_id") ON DELETE CASCADE ON UPDATE CASCADE;
