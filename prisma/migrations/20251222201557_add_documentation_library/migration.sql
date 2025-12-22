-- CreateTable
CREATE TABLE `DocumentationItem` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'folder',
    `isDraft` BOOLEAN NOT NULL DEFAULT true,
    `parentId` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `minPlanId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DocumentationItem_parentId_idx`(`parentId`),
    INDEX `DocumentationItem_minPlanId_idx`(`minPlanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentationItem` ADD CONSTRAINT `DocumentationItem_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `DocumentationItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentationItem` ADD CONSTRAINT `DocumentationItem_minPlanId_fkey` FOREIGN KEY (`minPlanId`) REFERENCES `membershipplan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
