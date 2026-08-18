export type RepositoryFile = {
  path: string;
  sha: string;
  size: number | null;
};

export type FileExclusionReason =
  "ignored directory" | "file is too large" | "binary file" | "minified file";

export type AnnotatedRepositoryFile = RepositoryFile & {
  analyzable: boolean;
  exclusionReason: FileExclusionReason | null;
};

export type TechnologyCategory = "language" | "framework" | "database" | "tool";

export type TechnologyEvidence = {
  path: string;
  reason: string;
};

export type DetectedTechnology = {
  name: string;
  category: TechnologyCategory;
  matchingFileCount: number;
  evidence: TechnologyEvidence[];
};

export type RepositoryFileContent = {
  path: string;
  content: string;
  sha: string;
  size: number;
};
