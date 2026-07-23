-- AlterTable (safe)
ALTER TABLE "socios" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "fecha_inicio" DROP NOT NULL,
ALTER COLUMN "fecha_termino" DROP NOT NULL;
