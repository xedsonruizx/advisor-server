-- DropForeignKey
ALTER TABLE `evaluationresponse` DROP FOREIGN KEY `EvaluationResponse_optionId_fkey`;

-- DropForeignKey
ALTER TABLE `evaluationresponse` DROP FOREIGN KEY `EvaluationResponse_questionId_fkey`;

-- AddForeignKey
ALTER TABLE `EvaluationResponse` ADD CONSTRAINT `EvaluationResponse_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `EvaluationQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationResponse` ADD CONSTRAINT `EvaluationResponse_optionId_fkey` FOREIGN KEY (`optionId`) REFERENCES `EvaluationOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
