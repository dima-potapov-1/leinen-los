import type { ExamType, ExamPaper, ExamPaperConfig } from "@/types";
import examData from "@/data/exam-papers.json";

interface ExamPapersData {
  exam_types: Record<string, ExamPaperConfig>;
  papers: ExamPaper[];
}

const data = examData as ExamPapersData;

export function getExamTypes(): Record<ExamType, ExamPaperConfig> {
  return data.exam_types as Record<ExamType, ExamPaperConfig>;
}

export function getExamConfig(examType: ExamType): ExamPaperConfig {
  return data.exam_types[examType] as ExamPaperConfig;
}

export function drawRandomPaper(): ExamPaper {
  const idx = Math.floor(Math.random() * data.papers.length);
  return data.papers[idx];
}

export function getQuestionIdsForExam(paper: ExamPaper, examType: ExamType): number[] {
  const ids: number[] = [...paper.basis_questions, ...paper.binnen_questions];
  if (examType === "motor_segel" || examType === "segel") {
    ids.push(...paper.segel_questions);
  }
  return ids;
}

export interface ExamScoring {
  basisCorrect: number;
  basisTotal: number;
  binnenCorrect: number;
  binnenTotal: number;
  segelCorrect: number;
  segelTotal: number;
  totalCorrect: number;
  totalQuestions: number;
  passed: boolean;
}

export function scoreExam(
  answers: Map<number, number>,
  paper: ExamPaper,
  examType: ExamType,
  correctAnswers: Map<number, number>
): ExamScoring {
  const count = (ids: number[]) => {
    let correct = 0;
    for (const id of ids) {
      const selected = answers.get(id);
      if (selected !== undefined && selected === correctAnswers.get(id)) {
        correct++;
      }
    }
    return correct;
  };

  const basisCorrect = count(paper.basis_questions);
  const binnenCorrect = count(paper.binnen_questions);
  const segelCorrect =
    examType === "motor_segel" || examType === "segel"
      ? count(paper.segel_questions)
      : 0;

  const totalCorrect = basisCorrect + binnenCorrect + segelCorrect;
  const totalQuestions = getQuestionIdsForExam(paper, examType).length;

  const config = getExamConfig(examType);
  const rules = config.pass_rules;
  let passed = true;

  if (rules.basis_min !== undefined && basisCorrect < rules.basis_min) passed = false;
  if (rules.binnen_min !== undefined && binnenCorrect < rules.binnen_min) passed = false;
  if (rules.segel_min !== undefined && segelCorrect < rules.segel_min) passed = false;
  if (rules.total_min !== undefined && totalCorrect < rules.total_min) passed = false;

  return {
    basisCorrect,
    basisTotal: paper.basis_questions.length,
    binnenCorrect,
    binnenTotal: paper.binnen_questions.length,
    segelCorrect,
    segelTotal: paper.segel_questions.length,
    totalCorrect,
    totalQuestions,
    passed,
  };
}
