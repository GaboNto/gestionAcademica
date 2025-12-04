/*
  Warnings:

  - You are about to drop the column `contrasena` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `correo` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `rol` on the `usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `usuario_correo_key` ON `usuario`;

-- AlterTable
ALTER TABLE `respuesta_seleccionada` MODIFY `respuestaAbierta` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `usuario` DROP COLUMN `contrasena`,
    DROP COLUMN `correo`,
    DROP COLUMN `rol`,
    ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `password` VARCHAR(191) NOT NULL,
    ADD COLUMN `role` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_email_key` ON `Usuario`(`email`);
