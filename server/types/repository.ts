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
