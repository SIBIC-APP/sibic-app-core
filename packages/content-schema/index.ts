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
  sourceId: z.string().min(1), // Obligatorio: toda propuesta tiene fuente verificable
});

// Historia Pack Schemas
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
