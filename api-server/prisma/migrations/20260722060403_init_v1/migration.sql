-- CreateTable
CREATE TABLE `admin_users` (
    `id` VARCHAR(30) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(80) NOT NULL,
    `mobile_encrypted` VARCHAR(512) NULL,
    `mobile_hash` CHAR(64) NULL,
    `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `admin_users_username_key`(`username`),
    INDEX `admin_users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(30) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `description` VARCHAR(255) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(30) NOT NULL,
    `code` VARCHAR(96) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `resource` VARCHAR(64) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_resource_action_idx`(`resource`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_user_roles` (
    `admin_user_id` VARCHAR(30) NOT NULL,
    `role_id` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_user_roles_role_id_idx`(`role_id`),
    PRIMARY KEY (`admin_user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` VARCHAR(30) NOT NULL,
    `permission_id` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `role_permissions_permission_id_idx`(`permission_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_assets` (
    `id` VARCHAR(30) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `object_key` VARCHAR(512) NOT NULL,
    `bucket` VARCHAR(128) NOT NULL,
    `region` VARCHAR(64) NOT NULL,
    `mime_type` VARCHAR(128) NOT NULL,
    `extension` VARCHAR(16) NULL,
    `size_bytes` BIGINT UNSIGNED NOT NULL,
    `width` INTEGER UNSIGNED NULL,
    `height` INTEGER UNSIGNED NULL,
    `sha256` CHAR(64) NULL,
    `access_level` ENUM('public', 'private') NOT NULL DEFAULT 'public',
    `status` ENUM('processing', 'ready', 'blocked') NOT NULL DEFAULT 'processing',
    `alt_text` VARCHAR(255) NULL,
    `uploaded_by_id` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `media_assets_object_key_key`(`object_key`),
    INDEX `media_assets_status_access_level_idx`(`status`, `access_level`),
    INDEX `media_assets_sha256_idx`(`sha256`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_pages` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `page_type` VARCHAR(64) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `subtitle` VARCHAR(500) NULL,
    `summary` TEXT NULL,
    `hero_asset_id` VARCHAR(30) NULL,
    `status` ENUM('draft', 'published', 'offline') NOT NULL DEFAULT 'draft',
    `version` INTEGER NOT NULL DEFAULT 1,
    `published_at` DATETIME(3) NULL,
    `published_by_id` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `content_pages_slug_key`(`slug`),
    INDEX `content_pages_page_type_status_idx`(`page_type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_sections` (
    `id` VARCHAR(30) NOT NULL,
    `page_id` VARCHAR(30) NOT NULL,
    `section_key` VARCHAR(80) NOT NULL,
    `section_type` VARCHAR(64) NOT NULL,
    `title` VARCHAR(160) NULL,
    `subtitle` VARCHAR(500) NULL,
    `body` LONGTEXT NULL,
    `config_json` JSON NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `content_sections_page_id_sort_order_idx`(`page_id`, `sort_order`),
    UNIQUE INDEX `content_sections_page_id_section_key_key`(`page_id`, `section_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `category_code` VARCHAR(64) NULL,
    `name` VARCHAR(160) NOT NULL,
    `subtitle` VARCHAR(500) NULL,
    `summary` TEXT NULL,
    `agency_position` TEXT NULL,
    `cover_asset_id` VARCHAR(30) NULL,
    `status` ENUM('draft', 'published', 'offline') NOT NULL DEFAULT 'draft',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `version` INTEGER NOT NULL DEFAULT 1,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    INDEX `products_status_category_code_sort_order_idx`(`status`, `category_code`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_sections` (
    `id` VARCHAR(30) NOT NULL,
    `product_id` VARCHAR(30) NOT NULL,
    `section_key` VARCHAR(80) NOT NULL,
    `section_type` VARCHAR(64) NOT NULL,
    `title` VARCHAR(160) NULL,
    `content_json` JSON NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_sections_product_id_sort_order_idx`(`product_id`, `sort_order`),
    UNIQUE INDEX `product_sections_product_id_section_key_key`(`product_id`, `section_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_forms` (
    `id` VARCHAR(30) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `lead_type` ENUM('agent', 'investment', 'consult') NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `subtitle` VARCHAR(500) NULL,
    `success_message` VARCHAR(255) NULL,
    `status` ENUM('draft', 'published', 'offline') NOT NULL DEFAULT 'draft',
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `lead_forms_code_key`(`code`),
    INDEX `lead_forms_lead_type_status_idx`(`lead_type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_form_fields` (
    `id` VARCHAR(30) NOT NULL,
    `form_id` VARCHAR(30) NOT NULL,
    `field_key` VARCHAR(64) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `field_type` ENUM('text', 'number', 'phone', 'textarea', 'select', 'radio', 'checkbox', 'file') NOT NULL,
    `placeholder` VARCHAR(255) NULL,
    `options_json` JSON NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `validation_json` JSON NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lead_form_fields_form_id_sort_order_idx`(`form_id`, `sort_order`),
    UNIQUE INDEX `lead_form_fields_form_id_field_key_key`(`form_id`, `field_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` VARCHAR(30) NOT NULL,
    `lead_no` VARCHAR(40) NOT NULL,
    `form_id` VARCHAR(30) NOT NULL,
    `lead_type` ENUM('agent', 'investment', 'consult') NOT NULL,
    `name_encrypted` VARCHAR(512) NULL,
    `mobile_encrypted` VARCHAR(512) NULL,
    `mobile_hash` CHAR(64) NULL,
    `mobile_masked` VARCHAR(32) NULL,
    `region` VARCHAR(160) NULL,
    `source` VARCHAR(80) NULL,
    `source_detail` JSON NULL,
    `payload_json` JSON NOT NULL,
    `status` ENUM('new', 'contacted', 'qualified', 'closed', 'invalid') NOT NULL DEFAULT 'new',
    `level` ENUM('unknown', 'cold', 'warm', 'hot') NOT NULL DEFAULT 'unknown',
    `assignee_id` VARCHAR(30) NULL,
    `last_followed_at` DATETIME(3) NULL,
    `next_follow_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `leads_lead_no_key`(`lead_no`),
    INDEX `leads_lead_type_status_created_at_idx`(`lead_type`, `status`, `created_at`),
    INDEX `leads_assignee_id_status_next_follow_at_idx`(`assignee_id`, `status`, `next_follow_at`),
    INDEX `leads_mobile_hash_idx`(`mobile_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_followups` (
    `id` VARCHAR(30) NOT NULL,
    `lead_id` VARCHAR(30) NOT NULL,
    `admin_user_id` VARCHAR(30) NOT NULL,
    `follow_type` ENUM('phone', 'wechat', 'visit', 'note', 'status_change') NOT NULL,
    `content` TEXT NOT NULL,
    `previous_status` ENUM('new', 'contacted', 'qualified', 'closed', 'invalid') NULL,
    `next_status` ENUM('new', 'contacted', 'qualified', 'closed', 'invalid') NULL,
    `next_follow_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lead_followups_lead_id_created_at_idx`(`lead_id`, `created_at`),
    INDEX `lead_followups_admin_user_id_created_at_idx`(`admin_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(30) NOT NULL,
    `admin_user_id` VARCHAR(30) NULL,
    `action` VARCHAR(80) NOT NULL,
    `resource` VARCHAR(80) NOT NULL,
    `resource_id` VARCHAR(64) NULL,
    `before_json` JSON NULL,
    `after_json` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `user_agent` VARCHAR(500) NULL,
    `request_id` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_resource_resource_id_created_at_idx`(`resource`, `resource_id`, `created_at`),
    INDEX `audit_logs_admin_user_id_created_at_idx`(`admin_user_id`, `created_at`),
    INDEX `audit_logs_request_id_idx`(`request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_user_roles` ADD CONSTRAINT `admin_user_roles_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_user_roles` ADD CONSTRAINT `admin_user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_pages` ADD CONSTRAINT `content_pages_hero_asset_id_fkey` FOREIGN KEY (`hero_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_pages` ADD CONSTRAINT `content_pages_published_by_id_fkey` FOREIGN KEY (`published_by_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_sections` ADD CONSTRAINT `content_sections_page_id_fkey` FOREIGN KEY (`page_id`) REFERENCES `content_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_cover_asset_id_fkey` FOREIGN KEY (`cover_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_sections` ADD CONSTRAINT `product_sections_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_form_fields` ADD CONSTRAINT `lead_form_fields_form_id_fkey` FOREIGN KEY (`form_id`) REFERENCES `lead_forms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_form_id_fkey` FOREIGN KEY (`form_id`) REFERENCES `lead_forms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_assignee_id_fkey` FOREIGN KEY (`assignee_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_followups` ADD CONSTRAINT `lead_followups_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_followups` ADD CONSTRAINT `lead_followups_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
