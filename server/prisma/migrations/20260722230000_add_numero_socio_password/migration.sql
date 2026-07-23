-- AlterTable (safe - uses IF NOT EXISTS)
ALTER TABLE "socios" ADD COLUMN IF NOT EXISTS "numero_socio" INTEGER,
ADD COLUMN IF NOT EXISTS "password" TEXT;

-- AlterColumn
ALTER TABLE "socios" ALTER COLUMN "rut" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "socios_numero_socio_key" ON "socios"("numero_socio");
