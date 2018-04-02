DROP TABLE IF EXISTS `artists`;

CREATE TABLE `artists` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `artist_city` varchar(100) DEFAULT NULL,
  `artist_region` varchar(100) DEFAULT NULL,
  `artist_location` varchar(255) DEFAULT NULL,
  `artist_country` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `bio_url` varchar(255) DEFAULT NULL,
  `echonest` varchar(20) DEFAULT NULL,
  `spotify` varchar(22) DEFAULT NULL,
  `rdio` varchar(20) DEFAULT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `facebook` varchar(20) DEFAULT NULL,
  `wikipedia` varchar(255) DEFAULT NULL,
  `lastfm` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `musicbrainz` varchar(36) DEFAULT NULL,
  `discogs` varchar(10) DEFAULT NULL,
  `deezer` varchar(10) DEFAULT NULL,
  `songkick` varchar(20) DEFAULT NULL,
  `seatwave` varchar(20) DEFAULT NULL,
  `rhapsody` varchar(20) DEFAULT NULL,
  `eventful` varchar(20) DEFAULT NULL,
  `whosampled` varchar(15) DEFAULT NULL,
  `seatgeek` varchar(10) DEFAULT NULL,
  `jambase` varchar(20) DEFAULT NULL,
  `sevendigital` varchar(20) DEFAULT NULL,
  `myspace` varchar(255) DEFAULT NULL,
  `start_year` int(4) DEFAULT NULL,
  `end_year` int(4) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `echonest` (`echonest`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `comments`;

CREATE TABLE `comments` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `body` text DEFAULT NULL,
  `user_id` int(11) unsigned NOT NULL,
  `discussion_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `discussions`;

CREATE TABLE `discussions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `closed` bool DEFAULT false,
  `user_id` int(11) unsigned NOT NULL,
  `is_sticky` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `groups`;

CREATE TABLE `groups` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_open` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `groups_pages`;

CREATE TABLE `groups_pages` (
  `page_id` int(11) NOT NULL,
  `group_id` int(11) unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  UNIQUE KEY `unique_group_pages` (`page_id`, `group_id`),
  CONSTRAINT `groups_pages` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `groups_users`;

CREATE TABLE `groups_users` (
  `user_id` int(11) unsigned NOT NULL,
  `group_id` int(11) NOT NULL,
  `access` varchar(150) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  UNIQUE KEY `unique_group_users` (`user_id`, `group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `pages`;

CREATE TABLE `pages` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) DEFAULT NULL,
  `url` varchar(2083) NOT NULL,
  `is_static` tinyint(1) DEFAULT '0',
  `updating_agent` varchar(255) DEFAULT NULL,
  `updating_started_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `url` (`url`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `subscriptions`;

CREATE TABLE `subscriptions` (
  `subscriber_id` int(11) NOT NULL,
  `prescriber_id` int(11) unsigned NOT NULL,
  `prescriber_type` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  UNIQUE KEY `unique_subscription` (`subscriber_id`,`prescriber_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `username` varchar(150) NOT NULL,
  `password` varchar(60) DEFAULT NULL,
  `email` varchar(254) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `cover` varchar(255) DEFAULT NULL,
  `bio` varchar(200) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `notification` tinyint(1) DEFAULT 1,
  `public_crate` tinyint(1) DEFAULT 1,
  `public_listens` tinyint(1) DEFAULT 1,
  `last_visit` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `prescriptions`;

CREATE TABLE `prescriptions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `prescriber_id` int(11) unsigned NOT NULL,
  `featured` tinyint(1) DEFAULT '0',  
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_republish` (`parent_id`, `prescriber_id`),
  CONSTRAINT `fk_prescriber` FOREIGN KEY (`prescriber_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `prescriptions_groups`;

CREATE TABLE `prescriptions_groups` (
  `prescription_id` int(11) unsigned NOT NULL,
  `group_id` int(11) NOT NULL,
  UNIQUE KEY `unique_prescription_group` (`prescription_id`,`group_id`),
  CONSTRAINT `fk_prescriptions` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `vitamins`;

CREATE TABLE `vitamins` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `lastfm_fingerprint_id` int(11) DEFAULT NULL,
  `fingerprint_id` int(11) DEFAULT NULL,
  `mbid` varchar(36) DEFAULT NULL,
  `echonest_id` varchar(20) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `original` varchar(150) DEFAULT NULL,
  `variation` varchar(50) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verified_by` int(11) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `processing_failed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `artists_vitamins`;

CREATE TABLE `artists_vitamins` (
  `vitamin_id` int(11) unsigned NOT NULL,
  `artist_id` int(11) unsigned NOT NULL,
  `attributed` tinyint(1) NOT NULL,
  `type` varchar(20) NOT NULL,
  UNIQUE KEY `artists_vitamins` (`vitamin_id`, `artist_id`, `type`),
  CONSTRAINT `artists` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `artists_vitamins_relation` FOREIGN KEY (`vitamin_id`) REFERENCES `vitamins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `crates`;

CREATE TABLE `crates` (
  `vitamin_id` int(11) unsigned NOT NULL,
  `user_id` int(11) unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  UNIQUE KEY `unique_crate` (`vitamin_id`, `user_id`),
  CONSTRAINT `vitamins` FOREIGN KEY (`vitamin_id`) REFERENCES `vitamins` (`id`),
  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `discussions_users`;

CREATE TABLE `discussions_users` (
  `user_id` int(11) unsigned NOT NULL,
  `discussion_id` int(11) NOT NULL,
  UNIQUE KEY `unique_discussions_users` (`user_id`, `discussion_id`),
  CONSTRAINT `fk_user_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `hosts`;

CREATE TABLE `hosts` (
  `title` varchar(255) NOT NULL,
  `identifier` varchar(255) DEFAULT NULL,
  `url` text NOT NULL,
  `stream_url` varchar(255) DEFAULT NULL,
  `bitrate` int(11) DEFAULT NULL,
  `vitamin_title` varchar(255) DEFAULT NULL,
  `artwork_url` varchar(255) DEFAULT NULL,
  `vitamin_id` int(11) unsigned NOT NULL,
  `user_id` int(11) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  UNIQUE KEY `unique_vitamin_hosts` (`vitamin_id`, `identifier`, `title`),
  CONSTRAINT `hosts_vitamins` FOREIGN KEY (`vitamin_id`) REFERENCES `vitamins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `listens`;

CREATE TABLE `listens` (
  `user_id` int(11) unsigned NOT NULL,
  `vitamin_id` int(11) unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  UNIQUE KEY `unique_listen` (`vitamin_id`, `user_id`, `created_at`),
  CONSTRAINT `user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vitamins_relation` FOREIGN KEY (`vitamin_id`) REFERENCES `vitamins` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `pages_vitamins`;

CREATE TABLE `pages_vitamins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vitamin_id` int(11) unsigned NOT NULL,
  `page_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `on_page` tinyint(1) DEFAULT '0',
  UNIQUE KEY `unique_pages_vitamins` (`vitamin_id`, `page_id`),
  UNIQUE KEY `id` (`id`),
  CONSTRAINT `pages_vitamins` FOREIGN KEY (`vitamin_id`) REFERENCES `vitamins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `prescriptions_users`;

CREATE TABLE `prescriptions_users` (
  `prescription_id` int(11) unsigned NOT NULL,
  `user_id` int(11) unsigned NOT NULL,
  UNIQUE KEY `unique_prescription_user` (`prescription_id`,`user_id`),
  CONSTRAINT `fk_prescriptions_2` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `prescriptions_vitamins`;

CREATE TABLE `prescriptions_vitamins` (
  `prescription_id` int(11) unsigned NOT NULL,
  `vitamin_id` int(11) unsigned NOT NULL,
  `order` int(11) NOT NULL,
  UNIQUE KEY `unique_prescriptions_vitamins` (`vitamin_id`, `prescription_id`),
  KEY `prescription_id` (`prescription_id`),
  CONSTRAINT `prescriptions_vitamins` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `prescriptions_vitamins_relation` FOREIGN KEY (`vitamin_id`) REFERENCES `vitamins` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `sessions`;

CREATE TABLE `sessions` (
  `user_id` int(11) unsigned NOT NULL,
  `started_at` datetime NOT NULL,
  `ended_at` datetime NOT NULL,
  `duration` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  UNIQUE KEY `unique_session` (`started_at`, `user_id`),
  CONSTRAINT `user1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `tags`;

CREATE TABLE `tags` (
  `vitamin_id` int(11) unsigned NOT NULL,
  `user_id` int(11) unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `value` varchar(255) NOT NULL,
  UNIQUE KEY `unique_tag` (`vitamin_id`, `user_id`, `value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `votes`;

CREATE TABLE `votes` (
  `vote` int(11) NOT NULL,
  `user_id` int(11) unsigned NOT NULL,
  `voteable_id` int(11) NOT NULL,
  `voteable_type` varchar(150) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  UNIQUE KEY `unique_vote` (`user_id`,`voteable_id`, `voteable_type`),
  CONSTRAINT `fk_user_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `users` (`id`, `name`, `username`, `password`, `email`, `avatar`, `cover`, `bio`, `location`, `notification`, `last_visit`, `created_at`, `updated_at`)
VALUES
	(1, 't3rr0r', 't3rr0r', '$2a$08$00Gw2mtaDwwqq5onC7i2WeeVP/d/dLX4C0Wcdj5rTI1ZXHl.6FG5a', 'mail@t3rr0r.com', null, null, 'A short bio', 'Your location', 1, NOW(), NOW(), NOW());

INSERT INTO `users` (`id`, `name`, `username`, `password`, `email`, `avatar`, `cover`, `bio`, `location`, `notification`, `last_visit`, `created_at`, `updated_at`)
VALUES
	(2, 'Kia Rahimian', 'kia2882', '$2a$08$00Gw2mtaDwwqq5onC7i2WeeVP/d/dLX4C0Wcdj5rTI1ZXHl.6FG5a', 'kia2882@yahoo.com', null, null, 'A short bio', 'Your location', 1, NOW(), NOW(), NOW());
