-- MySQL dump 10.13  Distrib 9.1.0, for Linux (x86_64)
--
-- Host: localhost    Database: hk
-- ------------------------------------------------------
-- Server version       9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `group_members`
--
USE hk;

DROP TABLE IF EXISTS `group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_members` (
  `group_id` int NOT NULL,
  `member_id` int NOT NULL,
  KEY `group_members_relation_1` (`group_id`),
  KEY `group_members_relation_2` (`member_id`),
  CONSTRAINT `group_members_relation_1` FOREIGN KEY (`group_id`) REFERENCES `tgroups` (`id`),
  CONSTRAINT `group_members_relation_2` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  ;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_members`
--

LOCK TABLES `group_members` WRITE;
/*!40000 ALTER TABLE `group_members` DISABLE KEYS */;
INSERT INTO `group_members` VALUES (221,4),(221,5),(222,7),(222,8);
/*!40000 ALTER TABLE `group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `user_name` varchar(20) NOT NULL,
  `password` varchar(20) NOT NULL DEFAULT 'abs_user',
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4  ;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `members`
--

LOCK TABLES `members` WRITE;
/*!40000 ALTER TABLE `members` DISABLE KEYS */;
INSERT INTO `members` VALUES (1,'Soni','available','manager','abs_soni','abs_soni','',''),(2,'Anu','available','supervisor','abs_anu','','',''),(3,'Zi','available','supervisor','abs_zi','','',''),(4,'Dini','available','housekeeper','abs_dini','','',''),(5,'Pushpa','available','housekeeper','abs_pushpa','','',''),(6,'Nimadi','available','housekeeper','abs_nimadi','','',''),(7,'Sudeera','available','housekeeper','abs_sudeera','','',''),(8,'Preeth','available','housekeeper','abs_preeth','','',''),(9,'Lina','available','housekeeper','abs_lina','','',''),(10,'Sonu','available','housekeeper','abs_sonu','','',''),(13,'Madhumi','available','housekeeper','abs_madhumi','','',''),(14,'Rangana','available','housekeeper','abs_ranga','abs_ranga','+64022456659','rwishva@gmail.com'),(15,'Niroshan','available','housekeeper','abs_niroshan','','',''),(16,'Pratheek','available','training','abs_pratheek','abs_user','+64022456659','pratheek@gmail.com'),(100,'Admin','available','admin','abs_admin','','','');
/*!40000 ALTER TABLE `members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_status`
--

DROP TABLE IF EXISTS `room_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_status` (
  `id` int NOT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  ;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_status`
--

LOCK TABLES `room_status` WRITE;
/*!40000 ALTER TABLE `room_status` DISABLE KEYS */;
INSERT INTO `room_status` VALUES (1,'Occupied'),(2,'Stay Over'),(3,'Gone'),(4,'Stripping Started'),(5,'Stripping Completed'),(6,'Cleaning Started'),(7,'Cleaning On Hold'),(8,'Stripping On Hold'),(9,'HK Pending');
/*!40000 ALTER TABLE `room_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `room_id` int NOT NULL AUTO_INCREMENT,
  `room_number` varchar(10) NOT NULL,
  `status` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `level` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `visitor_status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4  ;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'101','dirty','STD',1,NULL,1),(2,'102','dirty','DLX',1,NULL,0),(3,'103','dirty','DLX',1,NULL,1),(4,'104','dirty','DUB',1,NULL,0),(5,'105','dirty','STD',1,NULL,NULL),(6,'106','dirty','STD',1,NULL,NULL),(7,'107','dirty','STD',1,NULL,0),(8,'108','assigned','STD',1,NULL,NULL),(9,'109','completed','STD',1,NULL,NULL),(10,'110','dirty','DLX',1,NULL,1),(11,'111','assigned','DLX',1,NULL,1),(12,'112','completed','DLX',1,NULL,1),(13,'113','available','DLX',1,NULL,NULL),(14,'401','dirty','STD',4,NULL,0),(15,'402','dirty','STD',4,NULL,1),(16,'403','dirty','STD',4,NULL,0),(17,'404','available','STD',4,NULL,1),(18,'117','assigned','DLX',1,NULL,NULL),(19,'116','assigned','DLX',1,NULL,NULL),(20,'115','assigned','DLX',1,NULL,0),(21,'114','assigned','DLX',1,NULL,NULL),(22,'125','assigned','DLX',1,NULL,NULL),(23,'124','assigned','DLX',1,NULL,NULL),(24,'123','assigned','DLX',1,NULL,NULL),(25,'122','assigned','DLX',1,NULL,NULL),(26,'121','assigned','DLX',1,NULL,0),(27,'120','completed','DLX',1,NULL,1),(28,'119','assigned','DLX',1,NULL,0),(29,'118','assigned','DLX',1,NULL,NULL);
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_status`
--

DROP TABLE IF EXISTS `task_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_status` (
  `id` int NOT NULL,
  `task_status` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  ;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_status`
--

LOCK TABLES `task_status` WRITE;
/*!40000 ALTER TABLE `task_status` DISABLE KEYS */;
INSERT INTO `task_status` VALUES (1,'Initiated'),(2,'Assigned'),(3,'Started'),(4,'On Hold'),(5,'Completed'),(6,'Discarded'),(7,'Unassigned');
/*!40000 ALTER TABLE `task_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_type`
--

DROP TABLE IF EXISTS `task_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_type` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4  ;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_type`
--

LOCK TABLES `task_type` WRITE;
/*!40000 ALTER TABLE `task_type` DISABLE KEYS */;
INSERT INTO `task_type` VALUES (1,'Full Clean'),(2,'VC'),(3,'Stay Over'),(4,'Vaccum'),(5,'Trolley Topup'),(6,'Trolley Item Request'),(7,'Strip');
/*!40000 ALTER TABLE `task_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taskassignments`
--

DROP TABLE IF EXISTS `taskassignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `taskassignments` (
  `assignment_id` int unsigned NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `assigned_to_id` int NOT NULL,
  `assigned_to_type` enum('user','group') NOT NULL,
  `priority` int NOT NULL,
  PRIMARY KEY (`assignment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4  ;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taskassignments`
--

LOCK TABLES `taskassignments` WRITE;
/*!40000 ALTER TABLE `taskassignments` DISABLE KEYS */;
INSERT INTO `taskassignments` VALUES (79,2,5,'user',1),(99,8,2,'user',1),(100,2,1,'user',1),(101,1,1,'user',1),(102,4,1,'user',1),(103,5,1,'user',1);
/*!40000 ALTER TABLE `taskassignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_type_id` int NOT NULL,
  `room_id` int DEFAULT NULL,
  `task_status_id` int DEFAULT 1,
  `task_description` varchar(50) DEFAULT 'N/A',
  `task_started` datetime DEFAULT NULL,
  `task_ended` datetime DEFAULT NULL,
  `task_created_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `task_owner` int NOT NULL DEFAULT 13,
  `estimated_time` int NOT NULL DEFAULT 15,
  `task_priority` enum('Normal','High','Low') DEFAULT 'Normal',
  PRIMARY KEY (`id`),
  KEY `fk_room` (`room_id`),
  KEY `tasks_relation_2` (`task_type_id`),
  KEY `tasks_relation_3` (`task_status_id`),
  CONSTRAINT `fk_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`),
  CONSTRAINT `tasks_relation_2` FOREIGN KEY (`task_type_id`) REFERENCES `task_type` (`id`),
  CONSTRAINT `tasks_relation_3` FOREIGN KEY (`task_status_id`) REFERENCES `task_status` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,1,1,5,'clean and change towels skjddsdksj sdsd',NULL,NULL,NULL,0,15,'Normal'),(2,1,1,2,'N/A',NULL,NULL,NULL,0,15,'Normal'),(3,1,1,7,'N/A',NULL,NULL,'2025-01-29',13,15,'Normal'),(4,1,1,2,'N/A',NULL,NULL,'2025-01-29',1,15,'Normal'),(5,7,2,2,'N/A',NULL,NULL,'2025-01-29',2,15,'Normal'),(6,1,2,7,' need towels',NULL,NULL,'2025-02-02',13,10,'Normal'),(7,7,1,7,'',NULL,NULL,'2025-02-02',13,5,'Normal'),(8,2,1,7,'',NULL,NULL,'2025-02-02',13,5,'Normal');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tgroups`
--

DROP TABLE IF EXISTS `tgroups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tgroups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_name` varchar(255) NOT NULL,
  `group_date` date NOT NULL,
  `group_master` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `groups_relation_1` (`group_master`),
  CONSTRAINT `groups_relation_1` FOREIGN KEY (`group_master`) REFERENCES `members` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=223 DEFAULT CHARSET=utf8mb4  ;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tgroups`
--

LOCK TABLES `tgroups` WRITE;
/*!40000 ALTER TABLE `tgroups` DISABLE KEYS */;
INSERT INTO `tgroups` VALUES (221,'Dini','2025-02-05',4),(222,'Sudeera','2025-02-05',7);
/*!40000 ALTER TABLE `tgroups` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-05 11:33:16