/*
  Warnings:

  - You are about to drop the column `nombre_colaborador_opcional` on the `encuesta_estudiante` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `encuesta_estudiante` DROP COLUMN `nombre_colaborador_opcional`,
    ADD COLUMN `nombre_docente_colaborador_opcional` VARCHAR(191) NULL;
