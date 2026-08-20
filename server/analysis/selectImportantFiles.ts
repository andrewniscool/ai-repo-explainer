import type { AnnotatedRepositoryFile } from "../types/repository.ts";
import { isLikelyEntryPoint } from "./detectEntryPoint.ts";

const MAX_IMPORTANT_FILES = 10;
const MAX_README_FILES = 1;
const MAX_MANIFEST_FILES = 2;
const MAX_CONFIG_FILES = 2;

const sourceExtensions = new Set([
  "c",
  "cc",
  "cpp",
  "cs",
  "cxx",
  "go",
  "hs",
  "html",
  "java",
  "js",
  "jsx",
  "kt",
  "kts",
  "lhs",
  "mjs",
  "cjs",
  "php",
  "py",
  "rb",
  "rs",
  "swift",
  "ts",
  "tsx",
  "vue",
]);

const manifestFilenames = new Set([
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
]);

const configFilenames = new Set([
  "tsconfig.json",
  "jsconfig.json",
  "docker-compose.yml",
  "docker-compose.yaml",
  "webpack.config.js",
  "rollup.config.js",
  "babel.config.js",
  "eslint.config.js",
  "prettier.config.js",
  "stylelint.config.js",
  "jest.config.js",
  "karma.conf.js",
  "protractor.conf.js",
  "cypress.json",
  "cypress.config.js",
  "tailwind.config.js",
  "postcss.config.js",
  "vite.config.js",
]);

const configPatterns = [
  /^dockerfile(?:\..+)?$/,
  /^docker-compose(?:\.[^.]+)*\.ya?ml$/,
  /^(vite|next|nuxt|webpack)\.config\.(ts|js|mjs|cjs)$/,
  /^(babel|rollup|eslint|prettier|stylelint|jest|karma|protractor|cypress|tailwind|postcss)\.config\.(ts|js|mjs|cjs)$/,
];

const excludedDirectories = new Set([
  "__snapshots__",
  "__tests__",
  "benchmark",
  "benchmarks",
  "example",
  "examples",
  "fixture",
  "fixtures",
  "sample",
  "samples",
  "test",
  "tests",
]);

type CandidateCategory = "readme" | "manifest" | "config" | "source";

type ImportantFileCandidate = {
  category: CandidateCategory;
  file: AnnotatedRepositoryFile;
  score: number;
};

export function selectImportantFiles(
  files: AnnotatedRepositoryFile[],
): AnnotatedRepositoryFile[] {
  const rankedCandidates = files
    .map(createCandidate)
    .filter(
      (candidate): candidate is ImportantFileCandidate => candidate !== null,
    )
    .sort((a, b) => {
      const scoreDifference = b.score - a.score;
      return scoreDifference !== 0
        ? scoreDifference
        : a.file.path.localeCompare(b.file.path);
    });

  const selectedFiles: AnnotatedRepositoryFile[] = [];
  const categoryCounts: Record<CandidateCategory, number> = {
    readme: 0,
    manifest: 0,
    config: 0,
    source: 0,
  };

  for (const candidate of rankedCandidates) {
    if (hasReachedCategoryLimit(candidate.category, categoryCounts)) {
      continue;
    }

    selectedFiles.push(candidate.file);
    categoryCounts[candidate.category] += 1;

    if (selectedFiles.length === MAX_IMPORTANT_FILES) {
      break;
    }
  }

  return selectedFiles;
}

function createCandidate(
  file: AnnotatedRepositoryFile,
): ImportantFileCandidate | null {
  if (!file.analyzable || isExcludedSourcePath(file.path)) {
    return null;
  }

  const normalizedPath = file.path.toLowerCase();
  const pathParts = normalizedPath.split("/");
  const filename = pathParts.at(-1) ?? "";
  const isRootLevel = pathParts.length === 1;

  if (isReadme(filename)) {
    return {
      file,
      category: "readme",
      score: 6 + (isRootLevel ? 2 : 0),
    };
  }

  if (manifestFilenames.has(filename)) {
    return {
      file,
      category: "manifest",
      score: 5 + (isRootLevel ? 2 : 0),
    };
  }

  if (isConfigurationFile(filename)) {
    return {
      file,
      category: "config",
      score: 2 + (isRootLevel ? 1 : 0),
    };
  }

  if (isProductionSourceFile(normalizedPath)) {
    return {
      file,
      category: "source",
      score: 4 + (isLikelyEntryPoint(file.path) ? 12 : 0),
    };
  }

  return null;
}

function isReadme(filename: string): boolean {
  return /^readme(?:\.(md|rst|txt|adoc))?$/.test(filename);
}

function isConfigurationFile(filename: string): boolean {
  return (
    configFilenames.has(filename) ||
    configPatterns.some((pattern) => pattern.test(filename))
  );
}

function isProductionSourceFile(path: string): boolean {
  const filename = path.split("/").at(-1) ?? "";
  const extension = filename.split(".").at(-1) ?? "";

  return sourceExtensions.has(extension);
}

function isExcludedSourcePath(path: string): boolean {
  const normalizedPath = path.toLowerCase();
  const pathParts = normalizedPath.split("/");
  const filename = pathParts.at(-1) ?? "";

  return (
    pathParts.some((part) => excludedDirectories.has(part)) ||
    filename.includes(".test.") ||
    filename.includes(".spec.") ||
    filename.includes(".bench.") ||
    filename.endsWith(".snap") ||
    filename.endsWith(".d.ts") ||
    filename.endsWith(".d.mts") ||
    filename.endsWith(".d.cts") ||
    filename.includes(".generated.")
  );
}

function hasReachedCategoryLimit(
  category: CandidateCategory,
  categoryCounts: Record<CandidateCategory, number>,
): boolean {
  if (category === "readme") {
    return categoryCounts.readme >= MAX_README_FILES;
  }
  if (category === "manifest") {
    return categoryCounts.manifest >= MAX_MANIFEST_FILES;
  }
  if (category === "config") {
    return categoryCounts.config >= MAX_CONFIG_FILES;
  }
  return false;
}
