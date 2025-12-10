/*
  Warnings:

  - You are about to alter the column `nombre_docente_colaborador_opcional` on the `encuesta_estudiante` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `encuesta_estudiante` MODIFY `nombre_docente_colaborador_opcional` INTEGER NULL;
