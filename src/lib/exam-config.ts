import type { ExamPaperConfig, ExamPaper } from "@/types";
import examPapersData from "@/data/exam-papers.json";

export const examTypes: Record<string, ExamPaperConfig> =
  examPapersData.exam_types as Record<string, ExamPaperConfig>;

export const examPapers: ExamPaper[] = examPapersData.papers as ExamPaper[];

export function getExamConfig(type: string): ExamPaperConfig {
  return examTypes[type] ?? examTypes.motor_segel;
}

export function getRandomPaper(): ExamPaper {
  const idx = Math.floor(Math.random() * examPapers.length);
  return examPapers[idx];
}
