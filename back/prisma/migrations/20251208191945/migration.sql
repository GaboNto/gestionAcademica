/*
  Warnings:

  - A unique constraint covering the columns `[anio,semestre]` on the table `encuesta_semestre` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `encuesta_semestre_anio_semestre_key` ON `encuesta_semestre`(`anio`, `semestre`);
