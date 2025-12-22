-- CreateIndex
CREATE INDEX `EvaluationQuestion_parentOptionId_idx` ON `EvaluationQuestion`(`parentOptionId`);

-- AddForeignKey
ALTER TABLE `EvaluationQuestion` ADD CONSTRAINT `EvaluationQuestion_parentOptionId_fkey` FOREIGN KEY (`parentOptionId`) REFERENCES `EvaluationOption`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
