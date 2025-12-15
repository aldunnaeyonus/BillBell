-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 15, 2025 at 09:00 PM
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
  `creditor` text NOT NULL,
  `amount_cents` bigint(20) NOT NULL,
  `amount_encrypted` text,
  `due_date` date NOT NULL,
  `status` enum('active','paid') NOT NULL DEFAULT 'active',
  `snoozed_until` datetime DEFAULT NULL,
  `recurrence` enum('none','monthly','weekly','bi-weekly','annually') NOT NULL DEFAULT 'none',
  `reminder_offset_days` tinyint(4) NOT NULL DEFAULT '1',
  `reminder_time_local` time NOT NULL DEFAULT '09:00:00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text,
  `cipher_version` int(11) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `bills`
--

INSERT INTO `bills` (`id`, `family_id`, `created_by_user_id`, `updated_by_user_id`, `creditor`, `amount_cents`, `amount_encrypted`, `due_date`, `status`, `snoozed_until`, `recurrence`, `reminder_offset_days`, `reminder_time_local`, `created_at`, `updated_at`, `notes`, `cipher_version`) VALUES
(18, 7, 7, 7, '4d3188111916ac284e66dc81:1d5b43d9040f02f3e58606c1c6c88892:28510c86d1b056', 2499, '58fd95595af9c638e9e7eebd:3cead7e2595634589e073d0488b47027:3f9d0b22', '2025-12-15', 'active', NULL, 'none', 1, '09:00:00', '2025-12-15 20:57:34', '2025-12-15 20:58:23', '159ba839c851cc99523fcbce:9802f42d5b1492cdd10a88b69406e749:ded87f880956', 34);

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
(7, 'LX2KWD', 7, '2025-12-15 13:08:29', 35);

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
(7, 7, 'admin', '2025-12-15 13:08:29');

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
(7, 1, '09:00:00', '2025-12-15 13:08:29');

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
(7, 7, 'ObbIYZYpNcky/A91KQ2ObKdIyMKOWmQU2fZdmfgdK4WN8o3kk6ktY5Tm284fmdG4wn4/dgugwR0pWw9FNs3Czxf0L+rNUUsi8RMK60DcE0dnlPKT86hz2ERoCRFCVePYZLrfBndP5DB9B+eNekARldZL/5269FmhMzBDUxM1XW3w1fcWtzqHamBvuBy+dYs9AEvCob8y5XX8VMtr4r8vKbB5Xpd46QRY52UvWwLBm9/rmJnhh6NFpDyR8W77zD7bKPw0NzKKTFONjLXbdhUHlYkqgbG6K9qDFy5Sp2hlAhzo+6BYga6QDU1O4sZpJDmJcaD3i4Z1GWn40cdoBwS5Mw==', '2025-12-15 13:08:29', 1, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'kLhfUjIQo+U+1kWMhI7mD3kJPNEPrEaV0dchde0zpCJ1D20PlJWtBBXXKEfpGjpvWxAc08gKheP6exLOJ7W6m/40u7a00Dnd2T6bo7mIhu81qhabVJNVy7+SrsiZZucNkkW5DgbgW9GuomDMEqnBnhX57vdctWs2dK74A+uWiYzfbmerJlFR7O7SbOrfw8P8Uz98OUdFKAd0/PHha4EdmuXagYl9tyDVgJQJ16dVs/+AvPqoycvH3Saf37Cn9Fnjl6Xrkx4KuMnx/BG12HLB2NcRFv5+W9TN8u8hc1Rbygy5iGo3SBQaqOMwrI05jAwaNhcv4F7iZS/MJrTt1qb2eA==', '2025-12-15 17:21:28', 2, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'AF+3wkaDB0MNv4brApXEYcFjrHhBv7whfEyH3NZpkn4UpKGmXkfCysOx2mwcdttjJ0y6CGQIAqMD5GiWEhjj5xWRkQ3vRCRe3bG/13XxiA5aKIW9qSSzJITSyzSQeyiWu0awQd61n+tIEw+fFbbKs9SY7wW8f5nxtSfbhIBJ5FX2yEVuA1bYGoBfnEss0/p1gp7ImhX2poJZ0zpCxNcx3yc2mGh/rmwmEeln9/xwulcCjgjnjfVSOKHl1R1EYXAtoTtQdpDTaOm3CPNKIQ8j5S3NR43Nt2VhD+Xdr2D0Fu1gFAC0ABkh0RvtyN3A7mKm5mhQfBarktr/9krnRlOoWQ==', '2025-12-15 17:29:02', 3, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'EyyEeOrgoge9vTX2y/7ublA/ns1BOf4hEaWWPm+O/QfVVhMWbmMYnqysfgF6zHgWF/uO0yDhCP8O6guYGDSok3Ko7iwRANoI5o32vR43cRu5h2ygpBug2QIhCZdX6zLIeWWuiXei7nM2+1vj4BP7iDhZ2enG19jW6OcW7uDzAMTZuMqPQkul5aYSbVQG0EcYI0LGIIG6zc9nD2Dom6xamWlk5j2DEUhC8Z+4UT5KCha6sjEuGYCLFkpsqt3FWsDCF5Koocln7EsBxbU+4VjfzOf9C5OJvOPAatvfKIuHGVtGUDyPmbGjlEvCLFbqnC8HfkW7uHgQGhLzAV5grz9Efg==', '2025-12-15 17:30:57', 4, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'CClIpI8qEJpOaiuaRLNsmVKg8yXNM84mOLB7tY/Yo4A0CtBSsyvJBpklImu1hLJKPeA8shyLHvoYY5LiAoxcJJD5hKY7akw0u20j8hZkAmZG08d2/GWHVZg7q+PbBpTs2v1vcJ7kVjLAHqE6NNBLB6vdhJtrkf/IhuGR1YJFAWzk1qyNY7pBzfUfynBWTkL5YCKg6jdPdlSW3KWkUbknDTwiNw/AiYIXJoyP6K0IGmMmecYoSVdkOjvnD0yGOtA6ZJmzND22RZe5CdWW0MICnZLTDlMLbBeegyjBhYc9G5oNhrsWmKQaVFnHnGKSVv1Xhl+3sjF65kqh0TKRWC+Emw==', '2025-12-15 17:35:52', 5, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'QRNdHfW4RXbm7KpGH55snIr7ArU9mIlLb4YlUq7kYcgnFbAnczadCf2yMpRkuU82ERN/IufpArzcpsd/Ggqe+9/TIG9qEPm4oWNkSzyqQVKGfO2QU/7zi4n9nk7wp/M7Xy42vHIMRnsHwh8MPgveEZjeIBTbrrbUzF8yuW5mIdS4rQUW1yzah4c1KK83pyB8SIzqE0pNz+OvagCCEvkSkcqW0jah6x1gsUkHE0k7Awk62kHijIuuRLym9aSHZ8h2w0dsuoihnae9j2bIDEWKkwJukVq+ESHxKwYZgng9+1xueiCHkHtTn0dajgfv7MiXAWyjf/KBLeBtxvM0cqzXRg==', '2025-12-15 17:38:16', 6, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'jxMrtqTb6K3LheZVyen84Dz4MD0epzv2qb06j34XfQV6I2d4tYWzClESyzUCvOdUfOqVs/anU3wQnl76xMzwM/ccETvH6EFnR3/dR0mUub6AelSaNLlIAn5MZSLMaexETfgGVFKIO+DKG7GwlupcCeluwbXiV9J823tqp6rTaiWm9kz0NTQ9oig4nf/w4X7XHpaGCmdo+jZeP7cbQF/W+IEUBwpsz8Pyqv/insbrE6CdDuS+ayPCfrevLCmuOE4hikz0Ed5OlID5oBudP89dzZTeeQplaR5KIi39AfrqTTmNncHMETZuPhi1PYJQah3fM930qbpvBcjMIHaSPlzoQg==', '2025-12-15 17:44:54', 7, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'n3WcSeC2i7Ac0tPDjqCxZGs+OC9+fB88kA26Si3e4zYDUzkIy2Y/2bBokuGmYh52k/qfT3H+YtEe6FhACNbyfmlvNI23eEE6NW5bf1YibwFM4xRx9OftAwa0fU8D7/dei0uGHFTIkkCr+r1hORQXpYnQu6jPvnrxH8naerr6W6aiIDug3+xijkIqpEXhPvBOnZ0FfPgcMii4rh0gvJei1JXgTsOlO1qCSuxgoj5Bz2wxqFmJ2qXWslEr0OOF8DtRkrs1woplgsU3et0ha3vxi/ssW+uyLKFSblDoBeS4ZeGp1/KlPH4kDeku/a7fRgy+OONLFQqnYsRwLP7azqdU5g==', '2025-12-15 17:48:27', 8, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'J6pvj4Z3V5FK9bhs+DNemPVnkXJBOSPe1CWtNYfqo0YGrAvAG1w9szXjuEYu24BB/nkVpU219UGN0elENnD5Pc2tAHetdo2T9EWvz8Qju2Z8ZJncDnlfyD+zvdOHCJcx5lCJ87Jt8eewoni3PQ4AZh9XqN3YE96N3Xtm7W+6jQLlKtOXg+EjJ/OuBS0Jf/8EkE0gSDqjweqMpYcCoaxZq70y+U/U/OjnWFh5I7/sxmIzHszLGLACmCxnIZF5BKJYe8PttVPywkLL2NnFPCEmVHDdOyWBVi3+cthiBQQ/Rs56T+O9VFAccHb0YJ/FJL07yC54ihjAJWByM8+w3qmKCA==', '2025-12-15 17:56:16', 9, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'A8chrDotMiQiPgXsdP5iuZmoB3vi5Er1pudGNPz1NppwjztGbDuc0fygd55ZrGp57OY7mNfavebXCLX7og5NIWOkIvTbIRGLTmlefWUNm0/qAhbwVjemDdK7FXpUELzJyKOk8OvMM6rIlN9dEZDoEmEHGpp+mC5B13tZLzz3p2UZqhoCfM9/R42LHdxOc1ox8QRkhSqVylsscpq+GtC+yctnGKmekPOFbXXly5dJfaKd00SBiGK0ZCLVRTHplDMTca30X7Vfwlojro+qT23IlRJ447wRwodOmC+oEpLRU52urmYwmZ2yPOXGaMDcPS9efZYUSBqJAQBOMRnhAErakw==', '2025-12-15 18:04:07', 10, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'm6zGm6yaqVdwkOphVOjd4T8/g3Fvu+rUfTNpi9fEc8u6r2FGuJQQ2sfT8mpR/i3PXQtr+vhzdAR1zGq5dXE5hnfv9ILzZYeifEWGRO0LR3lcN7CIrXoboOVMDcCfByJih+x8j6Wg0GUZUGLpYTiIXj5c9/JptpFUID7C3O4VNmzHP5vcbP4hmpXwW0qzaQWNA7NUpo6cNyl9qdquAY5iN7bG13GNl7GkCKFMw/+GKqNxX9yQWcSuB5fEmNHP38XjlmszFKlu3yWfYDvxJ3EFU+y/57PtxcJVM3LTRpIE99iQ/LRBfffWSCnchvXI6iMvRbJFsoxrApCF8S69MMmRsg==', '2025-12-15 18:12:50', 11, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'SSsYurMEPCwcOqrohfLYvAkQYjjpc09fqT26DyBi4GB8fmO6IBpQK3tEJSk2WN2DEgPFBe8DgnMrcRA6Gb/rWY1Pv8zQAfy5wwsNM86iGKn8r3FDb97VfZdBEC4dR4VijcUwyue/Nt+46OsiME8yaCF7sU6Z1TxqSXslmyxtNl3Wjxyhbd56xWi3UNklp1N4SVEy88frHg69En06fp6jCOa5zWmQsJyMQzlovFBphmSpWR+Aowap0BnKpHNtsFZHo1zhakL6FtRMevBBW+42I6phuGADF0regZ17u6Pq4cphi0pqBUZQ68scYBs7uMbP4kxl5XOSOUQcX+0qVREnnQ==', '2025-12-15 19:38:11', 12, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'FKKLudX43S6+Hb1EGLTVBfaSy5/JB9O5BppJ9e+ahEu/RgswqHQ9FZAt+OL8wu4UUK3kCiwMj0KOLNcjoMvs0oHblDQBP44Vx3b2nUY2aRSqXpLtztZMtt+j3vMWRG7L0sasEYdms1CL1G/oTg3+oqZuyC9lxCng/zg9zdB6vAfumubW9TB8J15p1b9Z7vA62fEMjnCq4/fibEtSnlvgBf8JYnw+ZwT9wp3DStQpNZgWch7xIVYL7PlFQrYh3vg0kTmMvzdwmiXkdtxeFzl9YyYv2vajWtgAHyqgYnr4EugQ1OyiG9+hHto2wwaxIZ6U0WSGjN4QobZpi2NtgNJYWQ==', '2025-12-15 19:42:44', 13, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'HNsWZmxzaypiAMr+mXJ+MIX2YJqOZbed2pgFiShI36uiFYF0rgjez+jx2TDb/Q4Me3ITovXgHYpZ6KYnP2cFSEHCSbAB/AYHGPkNXXBrxmjMYuIcls4XwgRGplx8K/TEfdMI9I7rTg1T4/ng2S7XaxD6FXkWzPiFSgyyDXrF1dETPNWi61EwJ/awvzy3hHMBLoqmqS9t+620OEDxIuOxitwkhx/O1PldNt86sGRT/i9Szh0/KAt4Hqd9zzGt4+UyzYNhlAmLIaOzk8NQLdOHOA2wCftwH5/O8THEYILi4huRqiZCOEYbkMNqMzj9yzKd/iGMKcfruYjBQUXAIPC7jg==', '2025-12-15 20:03:48', 14, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'iJUr7VV8s98I4Tl++5ofDxxv7anR6PswG0337fSDC7kaHv+LRoLZgq5haRgT5dZXGXtXm5Vp2hf5f62/eymHhCNnC5nNKYvuFhXf3jtcrMueOc79yLdgOdPFmrv2ETzJJ+DKY/TxQUN5JSYl837/AhBTXJ2ON4826kH0lA3ybmnmUT04xrakTHW37vlS6rFDpDK9RJzW7EotgN5xDzxAVndRswPOJ3fWR09lhCXbAM5ulKlKlk/CdbGObZWBHqW+BQD7XyrMFGN6DNV1J9u6b8/WHar8EBE8MJqbnBEsgH/iyL+G6he6Dp2mzqMjdSouMjyLEyJrRlTMjDWlciW+DA==', '2025-12-15 20:03:54', 15, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'PJt4z5GEg3Qdgk157L9xO8/ZTLzwGGHUxx0q+E0u+5MQGsikAZ6ImFSb2imP7kjb+hr+CUrShbBGrqq/9cIYIgfAnG6dO7KOqU3vNpCn2fWtkd/QGo5Z6+yinjNer6ZCIKLXn8gdvZuSMehvNll8okmkrK5VJmEOgXveBv54lnUhdnb9U09pShmiphE1vJcI6areCl9ob4SgdDIPDwQ9E6T6Qfr1FFzjg42EPC0ujZD+XVL71lenCTBjiipYVpwJ/UKT8Uh8TIAms9KV1MWeQHpK6zp5KK8V4peg+hgvJZmExGgrRY6DYLyld7b4baKKorTVBV7bLR/RtEzRmA/q2A==', '2025-12-15 20:04:59', 16, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'bKarIHcssKrdiTQkiUrE+4ndDpDPVPpoDb2YDyZwreuGfPaC/NYezdTJTcF7XnrzGS1OMh56+1Re3v6pg165BdmnZZ+EA88K27glvOdZQdFQ9kT4wmzsMJmAlaQzALpKp14a0337xVJT+J+cehgWUa9sFbKRJD24EPL+ds7w7frjvbbrBTGbc8NrPHj/tMtJINAnTVMyPZlk0JRYXAFUr6IBtILdOW2xINjCy8nRyZq6OUpQY5xO3upu2T70RwRS7sAvYHp+W08KWyL78UVBFre/oAKab1R3kLV2Xht4dhL+SQe8iYYiOkL2Qt8Fu8BMb1zP9tVQ3zTjaO1nQkEoXw==', '2025-12-15 20:07:10', 17, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'v7I+8wJxvOb36cBiEOvhFE6tEpxQSFTMh92cqohnCRyjtuTYStd2hqZ1xahqGn4kYZxEvVcD6gidTz2pjK24l5c+BD9ILTTCIUW6PiX9KLyktThSJb+QLDm/awvTUasXk5Id1G+tlWpYS/CG6scwNYGc9Rjn4e/YxyvGTdx4DQB/aErVq8Y4aWQ1uMg9aRIkjv65NPKo+vaFMQBIRRiwPZhb8fIsu7oE1gP0YwxSctb/XyuGFP/mEcrmKVdxXpJCatcPkPhvR8zfaz86DLciaR7Za6zIzrDQFhqGKRwU9ShBuniC3odw4I4i6ATfa3KnvUicBtOkIA6HVEP3RyTtrw==', '2025-12-15 20:07:54', 18, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'XMKOtDegcT+4lwKCa06GU23T5wNEluDQfYeXpPg8rOaDAwwQj0VAeODn6KTmfxYypAwYAUggnXtotpmDUEoWYc+mo4CI6uvPxyKndpJHfAih2bOcxOrArs0x7FMCY93LvLivjAEtBioNxl3/iHLcmUCDczXEK3Jxk+VfRD6AxUM2GU8I/xlNqHe8OTNzIG2f8eIIyYTYjxKgI1k6SxrV+yUi9w9HrtWexDsu5Md9ppE3msDRXhJjQXmB6hgh41W5zsdxyAOI1Q+BvG/oiWHU7fYVWr9cmUzXW5ZaWsAZ0btK3bjrq2NUrW9os2CriR5bDa/liVyjwb27lh6WFMfnaw==', '2025-12-15 20:47:25', 29, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'fUAhILCfcCl0m/svze8oA0tKrkp2pY3KxNdy4vPbu8i3AaTLt/yJAmHCSfQ4jCFiqD41eZys98PEzykssEl2VnLk9h/nW/JDUsUU2uN9CP0QFFTW/hoLqTaJyJWG0TA2TBCP1dCHFFbgWG52Nwooud7U2Y+9Po0P8YjK3Vh2knJ3Zlw7uKksziN+qo1Tkhs893uSkQMHBBZRPx71XGndJ/Od3g2iKhg4ZLg9XS51tvna0Dz/YOlmU/don5knAEIm93I1/IOGAL5qc9ghHS3oEcbeiPFmmRgcYBeafVF06BiCbDUS/qBzBdNA1cgGLBcKdxw45IvKfPPt1JCxs6Dn+g==', '2025-12-15 20:47:25', 29, '263310a8-c5ce-4716-162d-90e8a58bc814'),
(7, 7, 'qk9ZMquDSk9Cq3Nf4fy3pOJZUfYYYiZjf4MhOmaK6hrqkAQ3dzQwq4L9vqEdLZT+DTAPhaEOxmJTNJOMlL3RrbRyqvDs69kCDNeGdNHn0KtyyV+Gv0Wr0D+dDNsWs0n2ccdL9wVZNG40dKpLfZjxdDGZBRRU7YrK+tF3OU4/EUPy7M33DskdaDb1i58cC8y/6YNYi9TTtHxnwe9Vc5YHXi6ciZOVbPzNv0E1fj6wqyzC3K0BgohQ8joaAyEfzqTSGvBtJrF0KHeb5QSjLOhTDrEWaom/4uWiykuRDK7bWK/U8F9RVDjgRPPl7mT53ONjFA3VF6pJJtEY2UwkWQA7Mw==', '2025-12-15 20:47:25', 29, 'c88e050f-5cef-4679-fea5-e4063b7f4a15'),
(7, 7, 'Gg5OvB5wiJMipPJWKMF4VzhU8ddIqapiLL6vLAf5ajwb5w0+Bx39K2BbC94vXViwQBpTYjRI7qW9HkUvoSvFBVPSbZQEhlRml/dUFXcxxyca7XJ17wCE8BdGTOl/zkzp2yn8bsYgAm2AElvJnDn+830ior98eymuUE7ilOPBe6OckK5YeFL8dt7GONwmELI7k/H6tEjEXECLHNqfk4Jej8KsDKXBtL3mpvW+5pRHknuMQQrG7ER3iqkTqplMJgt9UJHYijaS1M6H0dmn5Y7ozdpPGS/hhCstiu/S8yqK3fJDh+yU22pTuhInTrgWxGy1WScxOhPBZan//Q3B3OZEnA==', '2025-12-15 20:47:38', 30, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'b5kwCse1Y3JAVojnWvXPspblJyEGOGSZzzJvR3IzwKTaq16akVzlGb8SbD9uZaJ3pGjssWKrZbq/wmilgV/hlHhqmllZmfnyEeAJQet1ASNCQXN5ylY0cZButVmibRdfORTY9gS9pX7LlfjfOIMxRYCRyBC1GFFV+7Bi0GNXKGCo149IGGWypIbx2ho43Ne8sXArsUbKOI1RPtZrM2IRBuTwWXPYbAFOSvuESSJDCzd8TbHsdbmLZ1QIIdKaLqXVHtK8e4DEy+8OWtjSlXk4dLH1gdw33Xmrgpw/hQqr19U6hD9AF09xeS7SfePxYqoFOPeJ7aaS7r7+QAvASvyyCQ==', '2025-12-15 20:47:38', 30, '263310a8-c5ce-4716-162d-90e8a58bc814'),
(7, 7, 'llTbI+/HmMYijFm4ckxqMrbpAWNFGFkU6LN9Ycgo2JZjEl25Lfa/D9ROg+et56nin2A/uHsHvlZQeFxg+fDcTCtOvxroeGc7CEFh/Ph6IfFT/Ah/qgyPSjWYyTgU0zBVaM240RsOOjNaPV6MJDj6X083/ueY47/OtVSBaBncPbLyJBai3JiLKiuWLV8lELa6KNpoDgdWtM/V5lYXsaHE4YD2GLCr45mgGlVsehhMdwGsS6FSoCveYqlRFAU8iULsLhZaCe8xU4wI0pjlKUGyo+k7UsVTjy1ya34Fhpe8m5c9tgJPAUZKWDW2xE15G8dKQG5/FjQQxWLll+AYOTLWWg==', '2025-12-15 20:47:38', 30, 'c88e050f-5cef-4679-fea5-e4063b7f4a15'),
(7, 7, 'a3rGm9OwFvu+0dWyottq12BDX2Sx/lcuPxvxrMY77aEUWdqI96qUsChCmvozWqnCaVBwv+hz+EUkHnrToddhxCucPT/I+8wDmrIkSXYGVO9g7hcguj1uGxme3eePOiTJKrdvySzuz6of2ttkavFMtfnTmhCasjDasA10UlkQpXx28xRTob5n/TNR/Lw3YaQtFX7DmnQ1ngiA2AyfecSBlfuae8FRse+Q2g8FGMQUKAHQqIVNl5GSC/9RQUYPlVmkS5XDOvddfmOk/RVeHphDe1ShXpQH0cLxtZAEXA/G2Tgfr7WLzlV02jxU15BFs7DENEOOfVPtiJg3FZNsoKaHzg==', '2025-12-15 20:50:00', 31, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'U+B0xYdF4PqFJEW+M6hUfG/Kie8nFE9ZvDrQIxgNT5i7es5e23qzI5d9qIFiz+W6DnJGZfbSJnHu+x56gSYoKSZZinZn3YIbV8UW9qiebEn/xwycoUMCHlp2T13QdbzOSBSCTH6YBBIIGStvunoSSS1PbipMWpJLQji9QrptuUlByeEba2eh9aHGCpdishv6fFRzaYrfYBPCH/yd4feqCB9o7R1bs5OPeQsVRmRMdXfPvKZHfgS1vDfQus5638OtbCL/ROeQFAVEqoc0rkDc1KYq4zqH8bdbHWa9PAm0CHHDFHSkPvnQ9jo1pqBtwHyXuDXm2gd+DueJUOs8t0r0mA==', '2025-12-15 20:50:00', 31, '263310a8-c5ce-4716-162d-90e8a58bc814'),
(7, 7, 'N98GrRpSE+TvPYmZJ0zGrwQFKKD2EalqTrFhifHkE4uoQikTGGreNopJxp3XHI8wOC2WCDdsp0WHhpyj9uDuyMtYiZywQtEfWZcQ4fjXHUAEQGJNV1XBR9bYU1KPUt7sRutdOGJTNuCFc9+aSrLIoEKbfHCvniWPIhOh2Xlyc8T8n+Gmy2uQWEpBo+Mcx0io52kqNr/y7/04a9L1Gk3zoEVRcz6EKaY0lo/yn8ZRVV1Zfa7VLRR5dL/7xHz2/0NlQzMh9Y0aOpe7jiTYR/w9v6SlPjjLI2auGRjExMXS+iBbJcGeZ3hAcxCqRPfHEUkP2699JcPVgy5gB32jeFcORg==', '2025-12-15 20:50:00', 31, 'c88e050f-5cef-4679-fea5-e4063b7f4a15'),
(7, 7, 'LPTLI6qqLnwnnISG7mJPLYi7iHa7mvjF5j8bk6kLpG2+iKx/tH0cBo86tL4CKqz/+F4bAJCwZVEn8OA0ypNvN+R6NKa+jTVzYEek0YgB8FhSTuVZ32imbgRjC4osThYUuK39MbygRXQq1hqQ4SiIX2MqEaS/jrTF+n/EI0qFT69gw/eWGvhmt5+kdardYUjX7OqtPWLpTbxikVwxUFXdYp0dd1XpnWXM/jdafvHS7D3DNqU90ZOwBKqi/whcnC3jzNO1K6x4WRJNY5NGIEskc9fhJuTVffi8LJ8NhKTqoi3cKLjWq/DQegTPNuXgYOxj2potrmug7NbbdSkDbfHRIg==', '2025-12-15 20:56:49', 33, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'EQTaU+LaHELceCAXyEOHuGzkytg2iyMHJfhNFSRBhh8CO0wSMeNj4lE04PtB7HFiYToptV15uYjyYR8gdwU8v/2zNEusT4nj3tLXDtiWOgeXKa0deW43fSYYBffLbDOPt9AQdAVO0wIMVGjTdmeJB3PrqeYRJ7flxgO4lM8a6f2Zmgs/ZwbxQQfcSykGc4GxiHyUy58gdzchl00A2tRG0xzOZzZBC92tQax4tQLMMfD0tifoqN+MGNmhJY5ikwZeUUplmOlgmz08ZLe19z1SQ94t69WzXLy4y9ex/v5su0/KPqdemmAr7RaglwCXHAPjC9UCp4LaRsbpwKRcGKYEnQ==', '2025-12-15 20:56:49', 33, '263310a8-c5ce-4716-162d-90e8a58bc814'),
(7, 7, 'uec63jULKq7tgrjcnn1/B1LLDDFwgRzoMsdYNz8hsu6WL7mu9eAxFJEi19ASrip0Ko01dSCnYJhT3D+IrhkY43ZGvm1yntoEWrRF9fvty5sWlkf9/QCEHNdiyGiC4jL9w6yuJON7PzOirYSgY3Zv66KmDpGAVsEeVr9k05NrqT25/nMVl45Hru3bB+sBqYNbCDLA7JKMfsZ1Z2ooWZ30T44GMv2WijUDwCouEMoVlUUSovyM6JASZ2YkWSIL3uqBA1a64rQePrLOQp2ikw6ubGQscgqRgoJLg4vl0qu1wpdLFmEAyEYOg35aJjY4Qw8kVA25rS+iZPcKzCRAnP7jRQ==', '2025-12-15 20:56:50', 33, 'c88e050f-5cef-4679-fea5-e4063b7f4a15'),
(7, 7, 'WiMCxrldlsEaLdtoy2Tkfg7xpIJpd6b/cUSLZbpumOt08O9ICPhv8lGfgF9wPps+4ntV1fUrX4cD9CmrCXFZFMkzxEAfQWpgRlpRH0diVaOtPsTArGfQgeSKVUKjefEV318v/pIf1UNFCafv0IkJGe1G2419cM3kl0/k7rsE/dZn23WduU237ExNZji+pR9T6zD7OVjL/wmh5OVa9K7J9C0JZpYc5TjiGN947QMr67xW8oTb7angOakyyKG8KXKwXNOxxKftfFzVdOjnYCCoH1K79a9rARCsu1SyJsmOuIuPsc17WSqaQHPWI6ZLqtIeOD3mxazwLgA/lDroY78CHA==', '2025-12-15 20:58:22', 34, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'HPXlfx5Lygga6ul3IrZ8UmEAmgfOlynJlohl70MLGTBJbqec0vxpreqkcTcbDSDQ8H2lvZQm0qBH8P8EpoNBj0t6LsfXGyiqk1P4FX5K01SvL9tyIFg81Za+XlnLqnmbRiE3BdvAwDmhNqEdOWdisuqDCee3tCqsWXYBxr4AAoUF9HpfHRJzmebyj5RGi3bxxSdSPBhlOq9Q67ZpCULF7+ZibW/E0zpptv94MNIDd+x8xgF83RxNy0BF5zD5cnBxTjkZWfXXUjuunWQGGHFVqgt+seSNU2JCKuXYIz5fVUoYprdT2jLRU7ItUTBOJrgl4nTjLUGvvhQWmRmTy8XG/A==', '2025-12-15 20:58:22', 34, '263310a8-c5ce-4716-162d-90e8a58bc814'),
(7, 7, 'fTJErqKq7Nr21gBuitilt5eIPe9OdUDisBkGqP9QEBuPnQtGsaj9MF//c9N+iMsXXLNildxTxpedGK0KDgZMGQ66RIZFzxFEDPLt8/NrZD9kys+j0iXSJuCqWXw3JDNBdUkgmRNlzKzWwl39W1ua+4iJJaXuQckMAtm0u8njfmvAEYjvPJXTgpnGESYnYdCbMKjnFx90hwZh/5/+zpKdiWxjOswzDsBHXAQngSHQ/4KcMvnPTGVyRYS3/6fWpz2oyruLtxkwvJH8vvHk6YvVfU11jsR5sKol2gmbyrg8CJ7reWmaNpaKw398Z1Wf8nKKbQs88UvUTlfIPM99sA7g4Q==', '2025-12-15 20:58:22', 34, 'c88e050f-5cef-4679-fea5-e4063b7f4a15'),
(7, 7, 'G7wVA+yK+kIc85NaVWXldjxalfNoOncTj1o3hTQwHZYY1AjcxjnJA1Z2kwk7CQB1xFBr45Pfuq0TZgROrdoelnbFMBReUGKjEiSP8Mph262IBLkXWPat/4DLdiVtpH3EKz/UNWLujgPYG1tIrVwZQRIDm1z6p3joAQZLOr3Zjtj+Xd1KxuRx7VLZhnVVQ2H1neJj7pTAxunaAlqFle3kaHbymYl3ILkSkmTAZ0K8P6woXxe8wujMdg3/UeDAyKAzCcsMDbIOOhMIhXQWMDNYnTreDk0pVu/zUYausQGG9g7RCxSDR423vA+UilEOhZ/79CydyqoPz1QVF1z3RDOPwQ==', '2025-12-15 20:58:39', 35, '00000000-0000-0000-0000-000000000000'),
(7, 7, 'ojuUh+tforijPB379SPGp2VY7XLsg5CntXYmvNsaMHECFQGsMm7T+2cvX/kgZe7on3tn58LVeb6Z/CV0eHVvr566QIzRGeuRcvTL2rgAXlqOXUp+Kqyt8gVrIPiYtsqBfNRunUG+bmMk7fuegmmM2lfkL5ho+IgGzMV3C0SPVnE00jhsZEUnMM5H/ANVjms5QAw05vmk7za1zi6SAoCcjIwSojdO/h/4OV8hJqRDpoLu/3dEHhkTVCY2g51ulIe7FPgGGwcCP6Nbd1ZvS2bXCmtNha7Ri2d3rE4lqvvKA+JNxZIsmL0EYCgrJfvWbomOMxppqo5WFOVc4Zt8H2SLPA==', '2025-12-15 20:58:39', 35, '263310a8-c5ce-4716-162d-90e8a58bc814'),
(7, 7, 'zaAInT5YvVxv1kBa9fq7hr+dl3Fe+v5OxhNtMxgG4sXldtJcIavlJJFTbVq1tkWknFXG4HiQWTsptP0QsTYIeReDYH2+0UI3WiGgBSCWObrVI48KL8nwCLaVvDdmQPDE9KLMIhkKATNW0urcpeOr/fM0yb2y18AULmBahbdXu0osHhXtprfpVLDKXGAMaPupQ4H8ghW5L0jMFXRhvhOUYYRDooMkeJRGMFam6boO9JmMWzX58akLSuk2y34mXLQU0L/p5t5ygg0/RKwDOkdhuhQ5dL4gwvDfcFWXEuOepYPrjGZ1dkZXkD1c0L74M6rxszhGO0c0Z+eO6SHpaFAfFQ==', '2025-12-15 20:58:39', 35, 'c88e050f-5cef-4679-fea5-e4063b7f4a15');

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
(3, 7, 7, 'd73999b1939cb9e0bae59cc173c2ae7dc0427f04a5cbd2a510872788d57d5d0b', '2025-12-15 15:22:09', NULL, '2025-12-15 15:07:09');

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
('keys_fetch:6', 1, '2025-12-15 13:08:40'),
('keys_fetch:7', 1, '2025-12-15 20:59:41'),
('keys_public:4', 1, '2025-12-15 16:42:10'),
('keys_public:6', 1, '2025-12-15 13:08:40'),
('keys_public:7', 5, '2025-12-15 20:59:22'),
('keys_shared:7', 6, '2025-12-15 20:59:22');

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
(7, 'apple', '000483.8dbdbf0ff12a42679978cd6aff0ca6f0.1320', 'andrew@dunn-carabali.com', NULL, '2025-12-15 13:08:27');

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
(7, '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAosEVhRTWWI66pZf/MQJX\nXqVnpfxCO4nmsBdwkp4JCa1YWAv+bWe1faE01QObjfpzdfbISP2PpCqmn/lqpZ2h\nObLYcSg6UpG7FsD/hyzj2l0eL+uf/D0dIdTPUQ4O4LjEiVjL/LkHfxXmEdzx0ygv\nPMjHrOp+JOA8EeWet7SJQwuNmB4dOYDbFd43p/qqK2SxiaqFuuLVoHPkDA0YH+h1\ntmUl0wKz2bGu7iyvOLNA03Ph5Ex5gK3usNEROaBCvF2hNR3SKB34cBkZ7lWYNedE\nA3rpVfT+29wIzU9okqGG28slV+PR5NGmcd0ejAjlHhbH1gbvr/jAf/3Yub9L56sd\nFwIDAQAB\n-----END PUBLIC KEY-----\n', '2025-12-15 13:08:29', '00000000-0000-0000-0000-000000000000'),
(7, '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3HJ5yiCQbwZH8fDtOLOW\n02kWsZRvCXNzLt7Wu4ruYWS7sJKd/WpQxcC87mORnflVj3ydOHahp0HRY3jLACD6\np/SskDdywCytJWeIWyUMmagO6mUuzIy+XOp78GVrSAZfwn+iG2q/pT6Sw4KqeneC\nk4fa78r3eBdXH0gpFOXWwwJ/KbWWWoJ0TGCPPQJlMQzCKKOh4avUTK+O5kuhfEIy\nE95pnBIt9py6MwdSzZhEGVMxtG8WRGyPTF3zakdBHCLIQTTVs8Kva0XQ7/ioaO1h\n2ODeECWjIk4orH1HpsTofu7JR0X+f/KaauvYQ8Cvquifb5d73ZvFqGPwfsomOuXL\nzwIDAQAB\n-----END PUBLIC KEY-----\n', '2025-12-15 20:30:53', '263310a8-c5ce-4716-162d-90e8a58bc814'),
(7, '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2YfoxNunvQ/HY+fj9sVI\n9V8fEnXPqixTPYUM2dtMXyQA61UhVxpTYUPCMuY3AahytZILZYMfwV9DLzHQK0WJ\naFrd+aC+KDvp0hOQDIWWfdRgEGgeIbRaxbTEz8IMUY+oRGJyTtNAOGxhHBrhMzpd\n3NIRwkzwU2OPZKa+6G1kwx9d3vb4AENL54gisPqXt0rGSJX0dAqpE69FKbwAwTnD\nL/eKXQFeDaTXARXWP7wIg2ohDtGjEJK+Dra1oXoiLoZAMNqI0j0NiaI/7QzojpIe\nVZ8z6lGu3qekdiBkmnW7ng+W2wucCx+/m9oOsxd4lLEMJiqysGvrLX2HZKPHB49g\nEQIDAQAB\n-----END PUBLIC KEY-----\n', '2025-12-15 20:30:11', 'c88e050f-5cef-4679-fea5-e4063b7f4a15');

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `device_tokens`
--
ALTER TABLE `device_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `families`
--
ALTER TABLE `families`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `import_codes`
--
ALTER TABLE `import_codes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
