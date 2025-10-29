-- DropForeignKey
ALTER TABLE `trabajador_educ` DROP FOREIGN KEY `trabajador_educ_centroId_fkey`;

-- DropIndex
DROP INDEX `trabajador_educ_centroId_fkey` ON `trabajador_educ`;

-- AddForeignKey
ALTER TABLE `trabajador_educ` ADD CONSTRAINT `trabajador_educ_centroId_fkey` FOREIGN KEY (`centroId`) REFERENCES `centro_educativo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
