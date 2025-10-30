-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: gestion_academica
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('91369959-0eef-45b5-82c1-c47cd68316ac','caa2051a75917ab2aff131905a3c9dc60a174d75ab3c5c3052b15407778a23f4','2025-10-24 13:12:22.785','20251024131221_init',NULL,NULL,'2025-10-24 13:12:21.532',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `actividad`
--

DROP TABLE IF EXISTS `actividad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `actividad` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(191) NOT NULL,
  `descripcion` varchar(191) DEFAULT NULL,
  `estado` enum('PENDIENTE','APROBADA','OBSERVADA') NOT NULL,
  `fecha_registro` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `evidencia` varchar(191) DEFAULT NULL,
  `rut` varchar(191) DEFAULT NULL,
  `practicaId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `actividad_practicaId_fkey` (`practicaId`),
  CONSTRAINT `actividad_practicaId_fkey` FOREIGN KEY (`practicaId`) REFERENCES `practica` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actividad`
--

LOCK TABLES `actividad` WRITE;
/*!40000 ALTER TABLE `actividad` DISABLE KEYS */;
/*!40000 ALTER TABLE `actividad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alternativa`
--

DROP TABLE IF EXISTS `alternativa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alternativa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(191) NOT NULL,
  `puntaje` int(11) NOT NULL,
  `preguntaId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `alternativa_preguntaId_fkey` (`preguntaId`),
  CONSTRAINT `alternativa_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `pregunta` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alternativa`
--

LOCK TABLES `alternativa` WRITE;
/*!40000 ALTER TABLE `alternativa` DISABLE KEYS */;
/*!40000 ALTER TABLE `alternativa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carta_solicitud`
--

DROP TABLE IF EXISTS `carta_solicitud`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carta_solicitud` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero_folio` varchar(191) NOT NULL,
  `fecha` datetime(3) NOT NULL,
  `direccion_emisor` varchar(191) DEFAULT NULL,
  `url_archivo` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `carta_solicitud_numero_folio_key` (`numero_folio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carta_solicitud`
--

LOCK TABLES `carta_solicitud` WRITE;
/*!40000 ALTER TABLE `carta_solicitud` DISABLE KEYS */;
/*!40000 ALTER TABLE `carta_solicitud` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `centro_educativo`
--

DROP TABLE IF EXISTS `centro_educativo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `centro_educativo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) NOT NULL,
  `region` varchar(191) DEFAULT NULL,
  `comuna` varchar(191) DEFAULT NULL,
  `direccion` varchar(191) DEFAULT NULL,
  `nombre_calle` varchar(191) DEFAULT NULL,
  `numero_calle` int(11) DEFAULT NULL,
  `telefono` int(11) DEFAULT NULL,
  `correo` varchar(191) DEFAULT NULL,
  `tipo` enum('PARTICULAR','PARTICULAR SUBVENCIONADO','SLEP') DEFAULT NULL,
  `convenio` varchar(191) DEFAULT NULL,
  `url_rrss` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `centro_educativo`
--

LOCK TABLES `centro_educativo` WRITE;
/*!40000 ALTER TABLE `centro_educativo` DISABLE KEYS */;
/*!40000 ALTER TABLE `centro_educativo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `colaborador`
--

DROP TABLE IF EXISTS `colaborador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `colaborador` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rut` varchar(191) NOT NULL,
  `nombre` varchar(191) NOT NULL,
  `correo` varchar(191) DEFAULT NULL,
  `direccion` varchar(191) DEFAULT NULL,
  `telefono` int(11) DEFAULT NULL,
  `tipo` enum('COLABORADOR','TUTOR','TALLERISTA') DEFAULT NULL,
  `cargo` varchar(191) DEFAULT NULL,
  `universidad_egreso` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `colaborador_rut_key` (`rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colaborador`
--

LOCK TABLES `colaborador` WRITE;
/*!40000 ALTER TABLE `colaborador` DISABLE KEYS */;
/*!40000 ALTER TABLE `colaborador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enc_colab_preg`
--

DROP TABLE IF EXISTS `enc_colab_preg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enc_colab_preg` (
  `encuestaId` int(11) NOT NULL,
  `preguntaId` int(11) NOT NULL,
  PRIMARY KEY (`encuestaId`,`preguntaId`),
  KEY `enc_colab_preg_preguntaId_fkey` (`preguntaId`),
  CONSTRAINT `enc_colab_preg_encuestaId_fkey` FOREIGN KEY (`encuestaId`) REFERENCES `encuesta_colaborador` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `enc_colab_preg_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `pregunta` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enc_colab_preg`
--

LOCK TABLES `enc_colab_preg` WRITE;
/*!40000 ALTER TABLE `enc_colab_preg` DISABLE KEYS */;
/*!40000 ALTER TABLE `enc_colab_preg` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enc_est_preg`
--

DROP TABLE IF EXISTS `enc_est_preg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enc_est_preg` (
  `encuestaId` int(11) NOT NULL,
  `preguntaId` int(11) NOT NULL,
  PRIMARY KEY (`encuestaId`,`preguntaId`),
  KEY `enc_est_preg_preguntaId_fkey` (`preguntaId`),
  CONSTRAINT `enc_est_preg_encuestaId_fkey` FOREIGN KEY (`encuestaId`) REFERENCES `encuesta_estudiante` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `enc_est_preg_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `pregunta` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enc_est_preg`
--

LOCK TABLES `enc_est_preg` WRITE;
/*!40000 ALTER TABLE `enc_est_preg` DISABLE KEYS */;
/*!40000 ALTER TABLE `enc_est_preg` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuesta_colaborador`
--

DROP TABLE IF EXISTS `encuesta_colaborador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `encuesta_colaborador` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_colaborador` varchar(191) DEFAULT NULL,
  `nombre_colegio` varchar(191) DEFAULT NULL,
  `sugerencias` varchar(191) DEFAULT NULL,
  `cumple_perfil` tinyint(1) DEFAULT NULL,
  `evaluacion` int(11) DEFAULT NULL,
  `colaboradorId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `encuesta_colaborador_colaboradorId_fkey` (`colaboradorId`),
  CONSTRAINT `encuesta_colaborador_colaboradorId_fkey` FOREIGN KEY (`colaboradorId`) REFERENCES `colaborador` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuesta_colaborador`
--

LOCK TABLES `encuesta_colaborador` WRITE;
/*!40000 ALTER TABLE `encuesta_colaborador` DISABLE KEYS */;
/*!40000 ALTER TABLE `encuesta_colaborador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuesta_estudiante`
--

DROP TABLE IF EXISTS `encuesta_estudiante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `encuesta_estudiante` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_encuesta` varchar(191) DEFAULT NULL,
  `nombre_estudiante` varchar(191) DEFAULT NULL,
  `nombre_tallerista` varchar(191) DEFAULT NULL,
  `nombre_centro` varchar(191) DEFAULT NULL,
  `nombre_colaborador` varchar(191) DEFAULT NULL,
  `nivel_practica` varchar(191) DEFAULT NULL,
  `fecha` datetime(3) DEFAULT NULL,
  `observacion` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `encuesta_estudiante_id_encuesta_key` (`id_encuesta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuesta_estudiante`
--

LOCK TABLES `encuesta_estudiante` WRITE;
/*!40000 ALTER TABLE `encuesta_estudiante` DISABLE KEYS */;
/*!40000 ALTER TABLE `encuesta_estudiante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estudiante`
--

DROP TABLE IF EXISTS `estudiante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `estudiante` (
  `rut` varchar(191) NOT NULL,
  `nombre` varchar(191) NOT NULL,
  `genero` varchar(191) DEFAULT NULL,
  `anio_nacimiento` datetime(3) DEFAULT NULL,
  `anio_ingreso` int(11) DEFAULT NULL,
  `plan` varchar(191) DEFAULT NULL,
  `avance` double DEFAULT NULL,
  `puntaje_ponderado` double DEFAULT NULL,
  `puntaje_psu` double DEFAULT NULL,
  `promedio` double DEFAULT NULL,
  `fono` int(11) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `direccion` varchar(191) DEFAULT NULL,
  `sistema_ingreso` varchar(191) DEFAULT NULL,
  `numero_inscripciones` int(11) DEFAULT NULL,
  PRIMARY KEY (`rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estudiante`
--

LOCK TABLES `estudiante` WRITE;
/*!40000 ALTER TABLE `estudiante` DISABLE KEYS */;
/*!40000 ALTER TABLE `estudiante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `practica`
--

DROP TABLE IF EXISTS `practica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `practica` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estado` enum('PENDIENTE','EN_CURSO','FINALIZADA','RECHAZADA') NOT NULL,
  `fecha_inicio` datetime(3) NOT NULL,
  `fecha_termino` datetime(3) DEFAULT NULL,
  `tipo` varchar(191) DEFAULT NULL,
  `estudianteRut` varchar(191) NOT NULL,
  `centroId` int(11) NOT NULL,
  `colaboradorId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `practica_estudianteRut_fkey` (`estudianteRut`),
  KEY `practica_centroId_fkey` (`centroId`),
  KEY `practica_colaboradorId_fkey` (`colaboradorId`),
  CONSTRAINT `practica_centroId_fkey` FOREIGN KEY (`centroId`) REFERENCES `centro_educativo` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `practica_colaboradorId_fkey` FOREIGN KEY (`colaboradorId`) REFERENCES `colaborador` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `practica_estudianteRut_fkey` FOREIGN KEY (`estudianteRut`) REFERENCES `estudiante` (`rut`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `practica`
--

LOCK TABLES `practica` WRITE;
/*!40000 ALTER TABLE `practica` DISABLE KEYS */;
/*!40000 ALTER TABLE `practica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pregunta`
--

DROP TABLE IF EXISTS `pregunta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pregunta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(191) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pregunta`
--

LOCK TABLES `pregunta` WRITE;
/*!40000 ALTER TABLE `pregunta` DISABLE KEYS */;
/*!40000 ALTER TABLE `pregunta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trabajador_educ`
--

DROP TABLE IF EXISTS `trabajador_educ`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `trabajador_educ` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rut` varchar(191) NOT NULL,
  `nombre` varchar(191) NOT NULL,
  `rol` varchar(191) DEFAULT NULL,
  `correo` varchar(191) DEFAULT NULL,
  `telefono` int(11) DEFAULT NULL,
  `centroId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trabajador_educ_rut_key` (`rut`),
  KEY `trabajador_educ_centroId_fkey` (`centroId`),
  CONSTRAINT `trabajador_educ_centroId_fkey` FOREIGN KEY (`centroId`) REFERENCES `centro_educativo` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trabajador_educ`
--

LOCK TABLES `trabajador_educ` WRITE;
/*!40000 ALTER TABLE `trabajador_educ` DISABLE KEYS */;
/*!40000 ALTER TABLE `trabajador_educ` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) NOT NULL,
  `correo` varchar(191) NOT NULL,
  `rol` varchar(191) NOT NULL,
  `contrasena` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_correo_key` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-30  2:37:09
