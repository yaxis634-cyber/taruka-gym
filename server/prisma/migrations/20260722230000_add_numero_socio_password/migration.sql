-- AlterTable
ALTER TABLE "socios" ADD COLUMN "numero_socio" INTEGER,
ADD COLUMN "password" TEXT;

-- AlterColumn
ALTER TABLE "socios" ALTER COLUMN "rut" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "socios_numero_socio_key" ON "socios"("numero_socio");
