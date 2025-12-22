-- CreateTable
CREATE TABLE `EvaluationQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `required` BOOLEAN NOT NULL DEFAULT true,
    `parentQuestionId` VARCHAR(191) NULL,
    `parentOptionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EvaluationQuestion_parentQuestionId_idx`(`parentQuestionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvaluationOption` (
    `id` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `penalty` TEXT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `EvaluationOption_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Evaluation` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'in_progress',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Evaluation_userId_key`(`userId`),
    INDEX `Evaluation_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvaluationResponse` (
    `id` VARCHAR(191) NOT NULL,
    `evaluationId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `optionId` VARCHAR(191) NULL,
    `textValue` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EvaluationResponse_evaluationId_idx`(`evaluationId`),
    INDEX `EvaluationResponse_questionId_idx`(`questionId`),
    INDEX `EvaluationResponse_optionId_idx`(`optionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EvaluationQuestion` ADD CONSTRAINT `EvaluationQuestion_parentQuestionId_fkey` FOREIGN KEY (`parentQuestionId`) REFERENCES `EvaluationQuestion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationOption` ADD CONSTRAINT `EvaluationOption_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `EvaluationQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evaluation` ADD CONSTRAINT `Evaluation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationResponse` ADD CONSTRAINT `EvaluationResponse_evaluationId_fkey` FOREIGN KEY (`evaluationId`) REFERENCES `Evaluation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationResponse` ADD CONSTRAINT `EvaluationResponse_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `EvaluationQuestion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationResponse` ADD CONSTRAINT `EvaluationResponse_optionId_fkey` FOREIGN KEY (`optionId`) REFERENCES `EvaluationOption`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
