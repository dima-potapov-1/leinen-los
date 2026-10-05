import type { Question } from "@/types";

const hasSupabase =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cachedQuestions: Question[] | null = null;

async function loadBundledQuestions(): Promise<Question[]> {
  if (cachedQuestions) return cachedQuestions;
  const data = (await import("@/data/questions.json")).default as Question[];
  cachedQuestions = data;
  return data;
}

export async function getQuestions(): Promise<Question[]> {
  if (hasSupabase) {
    const { createSupabaseServer } = await import("@/lib/supabase-server");
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("id");
    if (!error && data?.length) return data as Question[];
  }
  return loadBundledQuestions();
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
