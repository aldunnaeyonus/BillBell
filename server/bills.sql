-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 13, 2025 at 04:45 PM
-- Server version: 5.7.44
-- PHP Version: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dunncarabali_bill_mvp`
--

-- --------------------------------------------------------

--
-- Table structure for table `bills`
--

CREATE TABLE `bills` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `created_by_user_id` bigint(20) UNSIGNED NOT NULL,
  `updated_by_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `creditor` varchar(255) NOT NULL,
  `amount_cents` bigint(20) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('active','paid') NOT NULL DEFAULT 'active',
  `snoozed_until` datetime DEFAULT NULL,
  `recurrence` enum('none','monthly','weekly','bi-weekly','quarterly','semi-monthly','semi-annually','annually') NOT NULL DEFAULT 'none',
  `reminder_offset_days` tinyint(4) NOT NULL DEFAULT '1',
  `reminder_time_local` time NOT NULL DEFAULT '09:00:00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bills`
--
ALTER TABLE `bills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_family_creditor_due` (`family_id`,`creditor`,`due_date`),
  ADD KEY `idx_family_due` (`family_id`,`due_date`),
  ADD KEY `created_by_user_id` (`created_by_user_id`),
  ADD KEY `updated_by_user_id` (`updated_by_user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bills`
--
ALTER TABLE `bills`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bills`
--
ALTER TABLE `bills`
  ADD CONSTRAINT `bills_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`),
  ADD CONSTRAINT `bills_ibfk_2` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `bills_ibfk_3` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
