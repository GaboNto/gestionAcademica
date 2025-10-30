-- CreateTable
CREATE TABLE `estudiante` (
    `rut` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `genero` VARCHAR(191) NULL,
    `anio_nacimiento` DATETIME(3) NULL,
    `anio_ingreso` INTEGER NULL,
    `plan` VARCHAR(191) NULL,
    `avance` DOUBLE NULL,
    `puntaje_ponderado` DOUBLE NULL,
    `puntaje_psu` DOUBLE NULL,
    `promedio` DOUBLE NULL,
    `fono` INTEGER NULL,
    `email` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `sistema_ingreso` VARCHAR(191) NULL,
    `numero_inscripciones` INTEGER NULL,

    PRIMARY KEY (`rut`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `practica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estado` ENUM('PENDIENTE', 'EN CURSO', 'FINALIZADA', 'RECHAZADA') NOT NULL,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_termino` DATETIME(3) NULL,
    `tipo` VARCHAR(191) NULL,
    `estudianteRut` VARCHAR(191) NOT NULL,
    `centroId` INTEGER NOT NULL,
    `colaboradorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `centro_educativo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NULL,
    `comuna` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `nombre_calle` VARCHAR(191) NULL,
    `numero_calle` INTEGER NULL,
    `telefono` INTEGER NULL,
    `correo` VARCHAR(191) NULL,
    `tipo` ENUM('PARTICULAR', 'PARTICULAR SUBVENCIONADO', 'SLEP') NULL,
    `convenio` VARCHAR(191) NULL,
    `url_rrss` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trabajador_educ` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rut` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `rol` VARCHAR(191) NULL,
    `correo` VARCHAR(191) NULL,
    `telefono` INTEGER NULL,
    `centroId` INTEGER NOT NULL,

    UNIQUE INDEX `trabajador_educ_rut_key`(`rut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `colaborador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rut` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `telefono` INTEGER NULL,
    `tipo` ENUM('Colaborador', 'Supervisor', 'Tallerista') NULL,
    `cargo` VARCHAR(191) NULL,
    `universidad_egreso` VARCHAR(191) NULL,

    UNIQUE INDEX `colaborador_rut_key`(`rut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `estado` ENUM('PENDIENTE', 'APROBADA', 'OBSERVADA') NOT NULL,
    `fecha_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `evidencia` VARCHAR(191) NULL,
    `rut` VARCHAR(191) NULL,
    `practicaId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `rol` VARCHAR(191) NOT NULL,
    `contrasena` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `usuario_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carta_solicitud` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_folio` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `direccion_emisor` VARCHAR(191) NULL,
    `url_archivo` VARCHAR(191) NULL,

    UNIQUE INDEX `carta_solicitud_numero_folio_key`(`numero_folio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pregunta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alternativa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(191) NOT NULL,
    `puntaje` INTEGER NOT NULL,
    `preguntaId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `encuesta_estudiante` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_encuesta` VARCHAR(191) NULL,
    `nombre_estudiante` VARCHAR(191) NULL,
    `nombre_tallerista` VARCHAR(191) NULL,
    `nombre_centro` VARCHAR(191) NULL,
    `nombre_colaborador` VARCHAR(191) NULL,
    `nivel_practica` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NULL,
    `observacion` VARCHAR(191) NULL,

    UNIQUE INDEX `encuesta_estudiante_id_encuesta_key`(`id_encuesta`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `encuesta_colaborador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_colaborador` VARCHAR(191) NULL,
    `nombre_colegio` VARCHAR(191) NULL,
    `sugerencias` VARCHAR(191) NULL,
    `cumple_perfil` BOOLEAN NULL,
    `evaluacion` INTEGER NULL,
    `colaboradorId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enc_est_preg` (
    `encuestaId` INTEGER NOT NULL,
    `preguntaId` INTEGER NOT NULL,

    PRIMARY KEY (`encuestaId`, `preguntaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enc_colab_preg` (
    `encuestaId` INTEGER NOT NULL,
    `preguntaId` INTEGER NOT NULL,

    PRIMARY KEY (`encuestaId`, `preguntaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthorizationRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NULL,
    `refTitle` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `letterDate` DATETIME(3) NOT NULL,
    `addresseeName` VARCHAR(191) NOT NULL,
    `addresseeRole` VARCHAR(191) NOT NULL,
    `institution` VARCHAR(191) NOT NULL,
    `institutionAddr` VARCHAR(191) NOT NULL,
    `practiceType` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `degree` VARCHAR(191) NOT NULL,
    `comments` VARCHAR(191) NULL,
    `tutorName` VARCHAR(191) NULL,
    `tutorPhone` VARCHAR(191) NULL,
    `studentsJson` JSON NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AuthorizationRequest_letterDate_idx`(`letterDate`),
    INDEX `AuthorizationRequest_institution_idx`(`institution`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `practica` ADD CONSTRAINT `practica_estudianteRut_fkey` FOREIGN KEY (`estudianteRut`) REFERENCES `estudiante`(`rut`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `practica` ADD CONSTRAINT `practica_centroId_fkey` FOREIGN KEY (`centroId`) REFERENCES `centro_educativo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `practica` ADD CONSTRAINT `practica_colaboradorId_fkey` FOREIGN KEY (`colaboradorId`) REFERENCES `colaborador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trabajador_educ` ADD CONSTRAINT `trabajador_educ_centroId_fkey` FOREIGN KEY (`centroId`) REFERENCES `centro_educativo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividad` ADD CONSTRAINT `actividad_practicaId_fkey` FOREIGN KEY (`practicaId`) REFERENCES `practica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alternativa` ADD CONSTRAINT `alternativa_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `pregunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `encuesta_colaborador` ADD CONSTRAINT `encuesta_colaborador_colaboradorId_fkey` FOREIGN KEY (`colaboradorId`) REFERENCES `colaborador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enc_est_preg` ADD CONSTRAINT `enc_est_preg_encuestaId_fkey` FOREIGN KEY (`encuestaId`) REFERENCES `encuesta_estudiante`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enc_est_preg` ADD CONSTRAINT `enc_est_preg_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `pregunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enc_colab_preg` ADD CONSTRAINT `enc_colab_preg_encuestaId_fkey` FOREIGN KEY (`encuestaId`) REFERENCES `encuesta_colaborador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enc_colab_preg` ADD CONSTRAINT `enc_colab_preg_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `pregunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
