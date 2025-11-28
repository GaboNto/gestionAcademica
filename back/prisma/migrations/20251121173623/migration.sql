/*
  Warnings:

  - You are about to drop the column `descripcion` on the `actividad` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `actividad` table. All the data in the column will be lost.
  - You are about to drop the column `evidencia` on the `actividad` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_registro` on the `actividad` table. All the data in the column will be lost.
  - You are about to drop the column `practicaId` on the `actividad` table. All the data in the column will be lost.
  - You are about to drop the column `rut` on the `actividad` table. All the data in the column will be lost.
  - You are about to drop the column `titulo` on the `actividad` table. All the data in the column will be lost.
  - The values [NO_CONVENCIONAL] on the enum `centro_educativo_tipo` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `colaboradorId` on the `encuesta_colaborador` table. All the data in the column will be lost.
  - You are about to drop the column `cumple_perfil` on the `encuesta_colaborador` table. All the data in the column will be lost.
  - You are about to drop the column `evaluacion` on the `encuesta_colaborador` table. All the data in the column will be lost.
  - You are about to drop the column `sugerencias` on the `encuesta_colaborador` table. All the data in the column will be lost.
  - You are about to drop the column `id_encuesta` on the `encuesta_estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `nivel_practica` on the `encuesta_estudiante` table. All the data in the column will be lost.
  - You are about to drop the `enc_colab_preg` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enc_est_preg` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `fecha` to the `actividad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mes` to the `actividad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre_actividad` to the `actividad` table without a default value. This is not possible if the table is not empty.
  - Made the column `nombre_colaborador` on table `encuesta_colaborador` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nombre_estudiante` on table `encuesta_estudiante` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `tipo` to the `pregunta` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `actividad` DROP FOREIGN KEY `actividad_practicaId_fkey`;

-- DropForeignKey
ALTER TABLE `enc_colab_preg` DROP FOREIGN KEY `enc_colab_preg_encuestaId_fkey`;

-- DropForeignKey
ALTER TABLE `enc_colab_preg` DROP FOREIGN KEY `enc_colab_preg_preguntaId_fkey`;

-- DropForeignKey
ALTER TABLE `enc_est_preg` DROP FOREIGN KEY `enc_est_preg_encuestaId_fkey`;

-- DropForeignKey
ALTER TABLE `enc_est_preg` DROP FOREIGN KEY `enc_est_preg_preguntaId_fkey`;

-- DropForeignKey
ALTER TABLE `encuesta_colaborador` DROP FOREIGN KEY `encuesta_colaborador_colaboradorId_fkey`;

-- DropIndex
DROP INDEX `actividad_practicaId_fkey` ON `actividad`;

-- DropIndex
DROP INDEX `encuesta_colaborador_colaboradorId_fkey` ON `encuesta_colaborador`;

-- DropIndex
DROP INDEX `encuesta_estudiante_id_encuesta_key` ON `encuesta_estudiante`;

-- AlterTable
ALTER TABLE `actividad` DROP COLUMN `descripcion`,
    DROP COLUMN `estado`,
    DROP COLUMN `evidencia`,
    DROP COLUMN `fecha_registro`,
    DROP COLUMN `practicaId`,
    DROP COLUMN `rut`,
    DROP COLUMN `titulo`,
    ADD COLUMN `archivo_adjunto` VARCHAR(191) NULL,
    ADD COLUMN `estudiantes` VARCHAR(191) NULL,
    ADD COLUMN `fecha` DATETIME(3) NOT NULL,
    ADD COLUMN `horario` VARCHAR(191) NULL,
    ADD COLUMN `lugar` VARCHAR(191) NULL,
    ADD COLUMN `mes` VARCHAR(191) NOT NULL,
    ADD COLUMN `nombre_actividad` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `centro_educativo` MODIFY `tipo` ENUM('PARTICULAR', 'PARTICULAR SUBVENCIONADO', 'SLEP') NULL;

-- AlterTable
ALTER TABLE `encuesta_colaborador` DROP COLUMN `colaboradorId`,
    DROP COLUMN `cumple_perfil`,
    DROP COLUMN `evaluacion`,
    DROP COLUMN `sugerencias`,
    ADD COLUMN `observacion` VARCHAR(191) NULL,
    ADD COLUMN `semestreId` INTEGER NULL,
    MODIFY `nombre_colaborador` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `encuesta_estudiante` DROP COLUMN `id_encuesta`,
    DROP COLUMN `nivel_practica`,
    ADD COLUMN `semestreId` INTEGER NULL,
    MODIFY `nombre_estudiante` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `pregunta` ADD COLUMN `itemColaboradorId` INTEGER NULL,
    ADD COLUMN `itemEstudianteId` INTEGER NULL,
    ADD COLUMN `respuestaAbierta` VARCHAR(191) NULL,
    ADD COLUMN `tipo` ENUM('ABIERTA', 'CERRADA') NOT NULL;

-- DropTable
DROP TABLE `enc_colab_preg`;

-- DropTable
DROP TABLE `enc_est_preg`;

-- CreateTable
CREATE TABLE `encuesta_semestre` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `anio` INTEGER NOT NULL,
    `semestre` INTEGER NOT NULL,
    `archivo_adjunto` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_encuesta_estudiante` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `encuestaId` INTEGER NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `orden` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_encuesta_colaborador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `encuestaId` INTEGER NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `orden` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `respuesta_seleccionada` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `encuestaEstudianteId` INTEGER NULL,
    `encuestaColaboradorId` INTEGER NULL,
    `preguntaId` INTEGER NOT NULL,
    `alternativaId` INTEGER NULL,
    `respuestaAbierta` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `encuesta_estudiante` ADD CONSTRAINT `encuesta_estudiante_semestreId_fkey` FOREIGN KEY (`semestreId`) REFERENCES `encuesta_semestre`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_encuesta_estudiante` ADD CONSTRAINT `item_encuesta_estudiante_encuestaId_fkey` FOREIGN KEY (`encuestaId`) REFERENCES `encuesta_estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `encuesta_colaborador` ADD CONSTRAINT `encuesta_colaborador_semestreId_fkey` FOREIGN KEY (`semestreId`) REFERENCES `encuesta_semestre`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_encuesta_colaborador` ADD CONSTRAINT `item_encuesta_colaborador_encuestaId_fkey` FOREIGN KEY (`encuestaId`) REFERENCES `encuesta_colaborador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pregunta` ADD CONSTRAINT `pregunta_itemEstudianteId_fkey` FOREIGN KEY (`itemEstudianteId`) REFERENCES `item_encuesta_estudiante`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pregunta` ADD CONSTRAINT `pregunta_itemColaboradorId_fkey` FOREIGN KEY (`itemColaboradorId`) REFERENCES `item_encuesta_colaborador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuesta_seleccionada` ADD CONSTRAINT `respuesta_seleccionada_encuestaEstudianteId_fkey` FOREIGN KEY (`encuestaEstudianteId`) REFERENCES `encuesta_estudiante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuesta_seleccionada` ADD CONSTRAINT `respuesta_seleccionada_encuestaColaboradorId_fkey` FOREIGN KEY (`encuestaColaboradorId`) REFERENCES `encuesta_colaborador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuesta_seleccionada` ADD CONSTRAINT `respuesta_seleccionada_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `pregunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuesta_seleccionada` ADD CONSTRAINT `respuesta_seleccionada_alternativaId_fkey` FOREIGN KEY (`alternativaId`) REFERENCES `alternativa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
