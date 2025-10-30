/*
  Warnings:

  - You are about to alter the column `numero_folio` on the `carta_solicitud` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to drop the `cartafolio` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `carta_solicitud` MODIFY `numero_folio` INTEGER NOT NULL;

-- DropTable
DROP TABLE `cartafolio`;
