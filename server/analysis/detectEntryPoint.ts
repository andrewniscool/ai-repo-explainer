import type { AnnotatedRepositoryFile } from "../types/repository.ts";

const entryPointStems = new Set(["main", "index", "app", "server", "program"]);

const sourceExtensions = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "rs",
  "go",
  "java",
  "c",
  "cpp",
  "cs",
]);

export function isLikelyEntryPoint(path: string): boolean {
  const filename = path.split("/").at(-1)?.toLowerCase() ?? "";
  const parts = filename.split(".");

  if (parts.length < 2) {
    return false;
  }

  const stem = parts[0] ?? "";
  const extension = parts.at(-1) ?? "";

  return entryPointStems.has(stem) && sourceExtensions.has(extension);
}

export function detectEntryPoints(
  files: AnnotatedRepositoryFile[],
): AnnotatedRepositoryFile[] {
  const entryPoints: AnnotatedRepositoryFile[] = [];
  const analyzableFiles = files.filter((file) => file.analyzable);

  for (const file of analyzableFiles) {
    if (!file) {
      continue;
    }
    if (isLikelyEntryPoint(file.path)) {
      entryPoints.push(file);
    }
  }
  return entryPoints;
}
