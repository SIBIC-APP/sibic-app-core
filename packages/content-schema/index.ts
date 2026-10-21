import { z } from "zod";

export const PackRef = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  url: z.string().min(1),
  sha256: z.string().length(64),
  bytes: z.number().int().positive(),
});

export const Manifest = z.object({
  schemaVersion: z.number().int().positive(),
  minAppVersion: z.string().min(1),
  generatedAt: z.string().datetime(),
  packs: z.array(PackRef),
});

export const Source = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().optional(),
  retrievedAt: z.string(),
});

export const Party = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().optional(),
  website: z.string().url().optional(),
});

export const Candidate = z.object({
  id: z.string().min(1),
  electionId: z.string().min(1),
  partyId: z.string().optional(),
  office: z.string().min(1),
  fullName: z.string().min(1),
  photoUrl: z.string().url().optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  career: z.string().optional(),
  website: z.string().url().optional(),
  updatedAt: z.string(),
});

export const Topic = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  sort: z.number().int().default(0),
});

export const Proposal = z.object({
  id: z.string().min(1),
  candidateId: z.string().optional(),
  partyId: z.string().optional(),
  topicId: z.string().min(1),
  summary: z.string().min(1),
  sourceId: z.string().min(1),
});

// -------------------------------------------------------------
// esquemas del paquete de historia
// -------------------------------------------------------------
export const HistoryPeriod = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  startYear: z.number().int(),
  endYear: z.number().int().nullable().optional(),
  summary: z.string().min(1),
  sort: z.number().int(),
});

export const HistoryEvent = z.object({
  id: z.string().min(1),
  periodId: z.string().min(1),
  title: z.string().min(1),
  year: z.number().int(),
  dateDisplay: z.string().optional(),
  summary: z.string().min(1),
  details: z.string().optional(),
  sourceId: z.string().optional(),
  sort: z.number().int(),
});

export const HistoryPack = z.object({
  packId: z.literal("historia"),
  version: z.number().int().positive(),
  sources: z.array(Source).default([]),
  periods: z.array(HistoryPeriod),
  events: z.array(HistoryEvent),
});

// -------------------------------------------------------------
// esquemas del paquete de mi brujula
// -------------------------------------------------------------
export const BrujulaDimension = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  minLabel: z.string().min(1),
  maxLabel: z.string().min(1),
  description: z.string().min(1),
});

export const BrujulaQuadrant = z.object({
  id: z.enum(["q1", "q2", "q3", "q4"]),
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  detailedExplanation: z.string().min(1),
  colorToken: z.string().min(1),
});

export const BrujulaQuestion = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  text: z.string().min(1),
  context: z.string().min(1),
  weights: z.object({
    economic: z.number(), // -1.0 (más estado/bienestar) a +1.0 (más libre mercado)
    social: z.number(),   // -1.0 (más libertades/progresismo) a +1.0 (más tradición/orden)
  }),
  sort: z.number().int(),
});

export const BrujulaPack = z.object({
  packId: z.literal("brujula"),
  version: z.number().int().positive(),
  dimensions: z.array(BrujulaDimension),
  quadrants: z.array(BrujulaQuadrant),
  questions: z.array(BrujulaQuestion),
});

// -------------------------------------------------------------
// esquemas del paquete de aprende
// -------------------------------------------------------------
export const SibiCatVariant = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  requiredXp: z.number().int().min(0),
  badge: z.string().min(1),
});

export const QuizOption = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean(),
  explanation: z.string().min(1),
});

export const QuizQuestion = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(QuizOption).min(2),
});

export const LessonBlock = z.object({
  type: z.enum(["text", "callout", "quote"]),
  content: z.string().min(1),
  title: z.string().optional(),
});

export const Lesson = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  xpReward: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive(),
  blocks: z.array(LessonBlock),
  quiz: z.array(QuizQuestion),
  sort: z.number().int(),
});

export const Module = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  sort: z.number().int(),
});

export const AprendePack = z.object({
  packId: z.literal("aprende"),
  version: z.number().int().positive(),
  modules: z.array(Module),
  lessons: z.array(Lesson),
  sibiCats: z.array(SibiCatVariant),
});

// tipos inferidos
export type PackRefType = z.infer<typeof PackRef>;
export type ManifestType = z.infer<typeof Manifest>;
export type SourceType = z.infer<typeof Source>;
export type PartyType = z.infer<typeof Party>;
export type CandidateType = z.infer<typeof Candidate>;
export type TopicType = z.infer<typeof Topic>;
export type ProposalType = z.infer<typeof Proposal>;

export type HistoryPeriodType = z.infer<typeof HistoryPeriod>;
export type HistoryEventType = z.infer<typeof HistoryEvent>;
export type HistoryPackType = z.infer<typeof HistoryPack>;

export type BrujulaDimensionType = z.infer<typeof BrujulaDimension>;
export type BrujulaQuadrantType = z.infer<typeof BrujulaQuadrant>;
export type BrujulaQuestionType = z.infer<typeof BrujulaQuestion>;
export type BrujulaPackType = z.infer<typeof BrujulaPack>;

export type SibiCatVariantType = z.infer<typeof SibiCatVariant>;
export type QuizOptionType = z.infer<typeof QuizOption>;
export type QuizQuestionType = z.infer<typeof QuizQuestion>;
export type LessonBlockType = z.infer<typeof LessonBlock>;
export type LessonType = z.infer<typeof Lesson>;
export type ModuleType = z.infer<typeof Module>;
export type AprendePackType = z.infer<typeof AprendePack>;
