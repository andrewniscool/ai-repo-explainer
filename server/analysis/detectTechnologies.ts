import type {
  AnnotatedRepositoryFile,
  DetectedTechnology,
} from "../types/repository.ts";

type LanguageRule = {
  name: string;
  extensions: string[];
};

const MAX_EVIDENCE_FILES = 10;

const languageRules: LanguageRule[] = [
  { name: "TypeScript", extensions: [".ts", ".tsx"] },
  { name: "JavaScript", extensions: [".js", ".jsx", ".mjs", ".cjs"] },
  { name: "Python", extensions: [".py"] },
  { name: "Rust", extensions: [".rs"] },
  { name: "Haskell", extensions: [".hs", ".lhs"] },
  { name: "Java", extensions: [".java"] },
  { name: "Go", extensions: [".go"] },
  { name: "C", extensions: [".c"] },
  { name: "C++", extensions: [".cc", ".cpp", ".cxx"] },
];

function scoreEvidencePath(path: string): number {
  const normalizedPath = path.toLowerCase();
  const parts = normalizedPath.split("/");
  const filename = parts.at(-1) ?? "";
  const filenameStem = filename.split(".")[0] ?? "";
  const directoryParts = parts.slice(0, -1);
  let score = 0;

  const entryPointNames = new Set(["main", "index", "app", "server"]);

  if (entryPointNames.has(filenameStem)) {
    score += 5;
  }

  if (
    normalizedPath.startsWith("src/") ||
    normalizedPath.startsWith("app/") ||
    normalizedPath.startsWith("lib/") ||
    normalizedPath.startsWith("server/")
  ) {
    score += 3;
  }
  if (
    directoryParts.some((part) =>
      ["test", "tests", "fixture", "fixtures"].includes(part),
    ) ||
    filename.includes(".test.") ||
    filename.includes(".spec.")
  ) {
    score -= 5;
  }
  if (filename.endsWith(".min.js") || filename.endsWith(".min.ts")) {
    score -= 5;
  }

  if (
    directoryParts.some((part) =>
      ["example", "examples", "sample", "samples"].includes(part),
    )
  ) {
    score -= 3;
  }
  if (filename.endsWith(".d.ts")) {
    score -= 8;
  }
  score -= parts.length - 1;
  return score;
}

export function detectTechnologies(
  files: AnnotatedRepositoryFile[],
): DetectedTechnology[] {
  const technologies: DetectedTechnology[] = [];
  const analyzableFiles = files.filter((file) => file.analyzable);

  for (const rule of languageRules) {
    const matchingFiles = analyzableFiles.filter((file) => {
      const lowercasePath = file.path.toLowerCase();
      return rule.extensions.some((ext) => lowercasePath.endsWith(ext));
    });
    if (matchingFiles.length > 0) {
      technologies.push({
        name: rule.name,
        category: "language",
        matchingFileCount: matchingFiles.length,
        evidence: [...matchingFiles]
          .sort((a, b) => {
            const scoreDifference =
              scoreEvidencePath(b.path) - scoreEvidencePath(a.path);

            if (scoreDifference !== 0) {
              return scoreDifference;
            }

            return a.path.localeCompare(b.path);
          })
          .slice(0, MAX_EVIDENCE_FILES)
          .map((file) => ({
            path: file.path,
            reason: `File extension matches ${rule.name}`,
          })),
      });
    }
  }
  return technologies;
}
