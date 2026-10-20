import { z } from "zod";

export const PackRef = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  url: z.string(),
  sha256: z.string().length(64),
  bytes: z.number().int().positive(),
});

export const Manifest = z.object({
  schemaVersion: z.number().int(),
  minAppVersion: z.string(),
  generatedAt: z.string().datetime(),
  packs: z.array(PackRef),
});

export const Source = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  publisher: z.string().optional(),
  retrievedAt: z.string().datetime(),
});

export const Proposal = z.object({
  id: z.string(),
  candidateId: z.string().optional(),
  partyId: z.string().optional(),
  topicId: z.string(),
  summary: z.string().min(1),
  sourceId: z.string(), // obligatorio: toda propuesta tiene fuente
});

export type PackRefType = z.infer<typeof PackRef>;
export type ManifestType = z.infer<typeof Manifest>;
export type SourceType = z.infer<typeof Source>;
export type ProposalType = z.infer<typeof Proposal>;
