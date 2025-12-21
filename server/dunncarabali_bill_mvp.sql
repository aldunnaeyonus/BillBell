-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 21, 2025 at 02:27 PM
-- Server version: 5.7.44
-- PHP Version: 8.1.34

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
  `creditor` text NOT NULL,
  `amount_cents` bigint(20) NOT NULL,
  `amount_encrypted` text,
  `due_date` date NOT NULL,
  `status` enum('active','paid') NOT NULL DEFAULT 'active',
  `snoozed_until` datetime DEFAULT NULL,
  `recurrence` enum('none','monthly','weekly','bi-weekly','quarterly','semi-annually','annually') NOT NULL DEFAULT 'none',
  `payment_method` enum('manual','auto') NOT NULL DEFAULT 'manual',
  `reminder_offset_days` tinyint(4) NOT NULL DEFAULT '1',
  `reminder_time_local` time NOT NULL DEFAULT '09:00:00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text,
  `cipher_version` int(11) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `device_tokens`
--

CREATE TABLE `device_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `expo_push_token` varchar(255) NOT NULL,
  `platform` enum('ios','android') DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `families`
--

CREATE TABLE `families` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `family_code` varchar(12) NOT NULL,
  `created_by_user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `key_version` int(11) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `families`
--

INSERT INTO `families` (`id`, `family_code`, `created_by_user_id`, `created_at`, `key_version`) VALUES
(37, 'AFZ3TU', 40, '2025-12-20 15:35:44', 1),
(39, 'M23F73', 42, '2025-12-20 23:13:59', 1);

-- --------------------------------------------------------

--
-- Table structure for table `family_join_requests`
--

CREATE TABLE `family_join_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','rejected') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `family_members`
--

CREATE TABLE `family_members` (
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role` enum('admin','member') NOT NULL DEFAULT 'member',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `family_members`
--

INSERT INTO `family_members` (`family_id`, `user_id`, `role`, `created_at`) VALUES
(37, 40, 'admin', '2025-12-20 15:35:44'),
(39, 42, 'admin', '2025-12-20 23:13:59');

-- --------------------------------------------------------

--
-- Table structure for table `family_settings`
--

CREATE TABLE `family_settings` (
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `default_reminder_offset_days` tinyint(4) NOT NULL DEFAULT '1',
  `default_reminder_time_local` time NOT NULL DEFAULT '09:00:00',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `family_settings`
--

INSERT INTO `family_settings` (`family_id`, `default_reminder_offset_days`, `default_reminder_time_local`, `updated_at`) VALUES
(37, 1, '09:00:00', '2025-12-20 15:35:44'),
(39, 1, '09:00:00', '2025-12-20 23:13:59');

-- --------------------------------------------------------

--
-- Table structure for table `family_shared_keys`
--

CREATE TABLE `family_shared_keys` (
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `encrypted_key` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `key_version` int(11) NOT NULL DEFAULT '1',
  `device_id` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `family_shared_keys`
--

INSERT INTO `family_shared_keys` (`family_id`, `user_id`, `encrypted_key`, `created_at`, `key_version`, `device_id`) VALUES
(37, 40, 'olBhnRZja+IWgO4nvumFbJnXH+nSPyybgMMfLkB73Ot1QyyEKUnruEQIIsd4w9jIPGOHaNXBLH2Hs4PZ9xgVW+NWahvRc90jUf6tTb/RCICF8JphBQ33CAdo8azfeuXOnIr92cNG3McvieEQHnGuIo/jADfwS6sla4khYSoQHgu95QeTeNw5jBdvoUmLQKm8VoycrjJV8JVrkSKeVikiAmeEFpxnP5I9raLIep68TGh1IUKYz9a0d2JWMJaBe8jkfZbZY3n8DbW/vAzEnSKoHwqrb66fbc/XJIfdUsqGYV87Ylt05X8ZpsacIr5Hv7UFtCt4tq++OCggeOBQJAX+DQ==', '2025-12-20 15:35:44', 1, '26c1794b-32bd-4262-908b-20053d9c8115'),
(39, 42, 'pTsbWq4eO9sNeBwtOhHu3uZNl81zObXG4adR8BfESoRfX2e+5k7kaF8e7/skJ1ifvRrFParL6TCoF2K0vgCJnPfhVzh4kf/ihaaieQ/tSt0nFxpUu+3Q6DsPC7iDwZyu96R4NHxX5hQ8j8OQ43qjxdlNE9A1ttd6I/7JxVYpTNF/GUWXScFdxaN7HmihIhPABnDDwVHCwUIBN/1IqvdbgQURJ55E7X1V26RIn0XVjf14BzUkJx9kLIzGHlld4yvurYIARvAfLI1zNCC2s4attuFvbVayY2FaPngW4wWbW3rXj07t/VirVpLCkEXW2p1tvi1jsFtLOVsMtttx0wX9aw==', '2025-12-20 23:13:59', 1, 'c88e050f-5cef-4679-fea5-e4063b7f4a15');

-- --------------------------------------------------------

--
-- Table structure for table `import_codes`
--

CREATE TABLE `import_codes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `family_id` bigint(20) UNSIGNED NOT NULL,
  `created_by_user_id` bigint(20) UNSIGNED NOT NULL,
  `code_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `import_codes`
--

INSERT INTO `import_codes` (`id`, `family_id`, `created_by_user_id`, `code_hash`, `expires_at`, `used_at`, `created_at`) VALUES
(3, 39, 42, '6a3b7e13fcf368f425b57d03e22b0130117ba284ea0f9066518399f68e7dd8bb', '2025-12-20 23:34:00', NULL, '2025-12-20 23:19:00');

-- --------------------------------------------------------

--
-- Table structure for table `rate_limits`
--

CREATE TABLE `rate_limits` (
  `k` varchar(191) NOT NULL,
  `count` int(11) NOT NULL,
  `reset_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `rate_limits`
--

INSERT INTO `rate_limits` (`k`, `count`, `reset_at`) VALUES
('keys_fetch:30', 1, '2025-12-18 17:53:46'),
('keys_fetch:32', 1, '2025-12-18 17:55:32'),
('keys_fetch:33', 8, '2025-12-18 23:10:06'),
('keys_fetch:34', 1, '2025-12-19 03:57:06'),
('keys_fetch:35', 1, '2025-12-19 21:39:13'),
('keys_fetch:36', 3, '2025-12-19 20:34:43'),
('keys_fetch:37', 3, '2025-12-19 21:20:57'),
('keys_fetch:38', 12, '2025-12-19 21:39:27'),
('keys_fetch:41', 4, '2025-12-20 23:14:20'),
('keys_public:28', 1, '2025-12-18 17:54:27'),
('keys_public:30', 2, '2025-12-18 17:53:44'),
('keys_public:31', 4, '2025-12-18 17:54:09'),
('keys_public:32', 2, '2025-12-18 17:55:31'),
('keys_public:33', 9, '2025-12-18 23:10:06'),
('keys_public:34', 1, '2025-12-19 03:57:06'),
('keys_public:35', 2, '2025-12-19 21:39:13'),
('keys_public:36', 8, '2025-12-19 20:34:43'),
('keys_public:37', 3, '2025-12-19 21:20:57'),
('keys_public:38', 12, '2025-12-19 21:39:27'),
('keys_public:39', 1, '2025-12-20 14:23:09'),
('keys_public:40', 1, '2025-12-20 15:36:44'),
('keys_public:41', 4, '2025-12-20 23:14:20'),
('keys_public:42', 1, '2025-12-20 23:14:59'),
('keys_public:7', 1, '2025-12-20 20:48:38'),
('keys_shared:30', 1, '2025-12-18 17:53:44'),
('keys_shared:31', 1, '2025-12-18 17:54:10'),
('keys_shared:32', 1, '2025-12-18 17:55:31'),
('keys_shared:33', 1, '2025-12-18 23:10:08'),
('keys_shared:34', 1, '2025-12-18 23:49:56'),
('keys_shared:35', 1, '2025-12-19 04:51:25'),
('keys_shared:36', 1, '2025-12-19 18:11:23'),
('keys_shared:39', 1, '2025-12-20 14:23:09'),
('keys_shared:40', 1, '2025-12-20 15:36:44'),
('keys_shared:41', 1, '2025-12-20 15:54:33'),
('keys_shared:42', 1, '2025-12-20 23:14:59');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `provider` enum('apple','google') NOT NULL,
  `provider_user_id` varchar(128) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `provider`, `provider_user_id`, `email`, `name`, `created_at`) VALUES
(40, 'google', '101569244306546657094', 'icorpsonline@gmail.com', 'Andrew Dunn', '2025-12-20 14:22:34'),
(42, 'apple', '000483.8dbdbf0ff12a42679978cd6aff0ca6f0.1320', 'andrew@dunn-carabali.com', NULL, '2025-12-20 23:13:57');

-- --------------------------------------------------------

--
-- Table structure for table `user_public_keys`
--

CREATE TABLE `user_public_keys` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `public_key` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `device_id` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `user_public_keys`
--

INSERT INTO `user_public_keys` (`user_id`, `public_key`, `created_at`, `device_id`) VALUES
(40, '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3ej7ge+XIoYGWEyz8tKE\naXv5LEd3+oRZgW8v80z431MBLJNHqNCcfN+EE10S3iiNVRR3PPiB/z7cJfZ40Rc6\ncAniBoZ5AN9e8JVVlHjt2yg07Nuof3pXAaGFeEmekL+Rpw3Is567vE9Z9unyK86H\nfUR1x1/Fr+99tlOkXOzXm6otLWjaEZnkr5HH3NSY/l2b/MlZxMODa4Y1CNQ8yvRK\nL6d9XSul4BRYm8smLd+sNDFBS22ibHfQ1mpQSF8XQBWSLmhBlMAX9eehYifkMwP9\nXu3EZCM9vzbcyRKj7y0nBc9lbPX25bDiS+XigaZl6ByIJ+8SWQ27tD1A3YnwcGwh\nkwIDAQAB\n-----END PUBLIC KEY-----\n', '2025-12-20 15:35:44', '26c1794b-32bd-4262-908b-20053d9c8115'),
(42, '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx5PNSO86+TkbsgYYWye4\nvTe/9CH1L+CfdRpbnsrCOWSKpDiG7fhf+gOwfwaJ9EDS3uPl11dexZXfCMNWlY/C\n26tQjXVAqKB+551ARYuGLgR+01B+GPpNZYtatdKxgBY9TqzZTvrAKgSlGspV8i7m\nA8jnEu6bMK1XC4ByLEIq7OpQi9vyNrEpj0C+0uw5CkagJGx3ljkIXVfr84pOBekU\nXH/hFB1D22qklHO5MzRosQtbBiCMKyp6gKQKLkvmHx0ca2YXFLQ+VLzyf64N8V8M\n8BDXvyPvDdCqB7vO8mlp4JhER0K99/yJheP1fOCmqXSw5TWakf65gsMnm12Y0SRw\nwQIDAQAB\n-----END PUBLIC KEY-----\n', '2025-12-20 23:13:59', 'c88e050f-5cef-4679-fea5-e4063b7f4a15');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bills`
--
ALTER TABLE `bills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_family_due` (`family_id`,`due_date`),
  ADD KEY `created_by_user_id` (`created_by_user_id`),
  ADD KEY `updated_by_user_id` (`updated_by_user_id`),
  ADD KEY `idx_family_cipher` (`family_id`,`cipher_version`);

--
-- Indexes for table `device_tokens`
--
ALTER TABLE `device_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_token` (`user_id`,`expo_push_token`);

--
-- Indexes for table `families`
--
ALTER TABLE `families`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_family_code` (`family_code`),
  ADD KEY `created_by_user_id` (`created_by_user_id`);

--
-- Indexes for table `family_join_requests`
--
ALTER TABLE `family_join_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_fam_user_req` (`family_id`,`user_id`),
  ADD KEY `family_join_requests_ibfk_2` (`user_id`);

--
-- Indexes for table `family_members`
--
ALTER TABLE `family_members`
  ADD PRIMARY KEY (`family_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `family_settings`
--
ALTER TABLE `family_settings`
  ADD PRIMARY KEY (`family_id`);

--
-- Indexes for table `family_shared_keys`
--
ALTER TABLE `family_shared_keys`
  ADD PRIMARY KEY (`family_id`,`user_id`,`key_version`,`device_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_family` (`family_id`);

--
-- Indexes for table `import_codes`
--
ALTER TABLE `import_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_code_hash` (`code_hash`),
  ADD KEY `idx_family_expires` (`family_id`,`expires_at`),
  ADD KEY `created_by_user_id` (`created_by_user_id`);

--
-- Indexes for table `rate_limits`
--
ALTER TABLE `rate_limits`
  ADD PRIMARY KEY (`k`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_provider` (`provider`,`provider_user_id`);

--
-- Indexes for table `user_public_keys`
--
ALTER TABLE `user_public_keys`
  ADD PRIMARY KEY (`user_id`,`device_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bills`
--
ALTER TABLE `bills`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `device_tokens`
--
ALTER TABLE `device_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `families`
--
ALTER TABLE `families`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `family_join_requests`
--
ALTER TABLE `family_join_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `import_codes`
--
ALTER TABLE `import_codes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

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

--
-- Constraints for table `device_tokens`
--
ALTER TABLE `device_tokens`
  ADD CONSTRAINT `device_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `families`
--
ALTER TABLE `families`
  ADD CONSTRAINT `families_ibfk_1` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `family_join_requests`
--
ALTER TABLE `family_join_requests`
  ADD CONSTRAINT `family_join_requests_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `family_join_requests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `family_members`
--
ALTER TABLE `family_members`
  ADD CONSTRAINT `family_members_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`),
  ADD CONSTRAINT `family_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `family_settings`
--
ALTER TABLE `family_settings`
  ADD CONSTRAINT `family_settings_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `family_shared_keys`
--
ALTER TABLE `family_shared_keys`
  ADD CONSTRAINT `family_shared_keys_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `family_shared_keys_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `import_codes`
--
ALTER TABLE `import_codes`
  ADD CONSTRAINT `import_codes_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`),
  ADD CONSTRAINT `import_codes_ibfk_2` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_public_keys`
--
ALTER TABLE `user_public_keys`
  ADD CONSTRAINT `user_public_keys_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
