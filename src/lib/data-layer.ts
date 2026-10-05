import type { Question } from "@/types";

let cachedQuestions: Question[] | null = null;

async function loadQuestions(): Promise<Question[]> {
  if (cachedQuestions) return cachedQuestions;
  const data = (await import("@/data/questions.json")).default as Question[];
  cachedQuestions = data;
  return data;
}

export async function getQuestions(): Promise<Question[]> {
  return loadQuestions();
}

export async function getQuestionsByTopic(
  topic: Question["topic"]
): Promise<Question[]> {
  const all = await getQuestions();
  return all.filter((q) => q.topic === topic);
}

export async function getQuestionById(
  id: number
): Promise<Question | undefined> {
  const all = await getQuestions();
  return all.find((q) => q.id === id);
}

export async function getQuestionsByIds(
  ids: number[]
): Promise<Question[]> {
  const all = await getQuestions();
  const idSet = new Set(ids);
  return all.filter((q) => idSet.has(q.id));
}
