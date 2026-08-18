import type { AnnotatedRepositoryFile } from "../types/repository.ts";
import { isLikelyEntryPoint } from "./detectEntryPoint.ts";

const MAX_CONTENT_CANDIDATES = 20;
const MAX_FILE_BYTES = 100_000;
const MAX_TOTAL_BYTES = 750_000;

//variables for scoring and prioritizing files
const priorityFilenames = new Set([
  "readme.md",
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
]);

const configFiles = new Set([
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

const readmePattern = /^readme(?:\.(md|rst|txt|adoc))?$/i;

//main select candidate function that takes in a list of AnnotatedRepositoryFile objects and returns a list of the most relevant
// files for content analysis. The function filters out non-analyzable files, prioritizes README files and likely entry points,
// and sorts the remaining files based on their relevance score. The top candidates are then returned, up to a maximum of 20 files.
export function selectContentCandidates(
  files: AnnotatedRepositoryFile[],
): AnnotatedRepositoryFile[] {
  const usefulContentFiles: AnnotatedRepositoryFile[] = files.filter((file) => {
    if (!file.analyzable) {
      return false;
    }

    const filename = file.path.split("/").at(-1)?.toLowerCase() ?? "";

    return (
      isLikelyEntryPoint(file.path) ||
      readmePattern.test(filename) ||
      isConfigurationFile(filename) ||
      priorityFilenames.has(filename)
    );
  });

  const rankedFiles = [...usefulContentFiles].sort((a, b) => {
    const difference = scoreCandidate(b) - scoreCandidate(a);
    if (difference !== 0) {
      return difference;
    }
    return a.path.localeCompare(b.path);
  });

  const selectedFiles: AnnotatedRepositoryFile[] = [];
  let selectedBytes = 0;

  for (const file of rankedFiles) {
    if (file.size === null || file.size > MAX_FILE_BYTES) {
      continue;
    }

    if (selectedBytes + file.size > MAX_TOTAL_BYTES) {
      continue;
    }

    selectedFiles.push(file);
    selectedBytes += file.size;

    if (selectedFiles.length === MAX_CONTENT_CANDIDATES) {
      break;
    }
  }

  return selectedFiles;
}

//mainly helper functions
function scoreCandidate(file: AnnotatedRepositoryFile): number {
  const normalizedPath = file.path.toLowerCase();
  const fileName = normalizedPath.split("/").at(-1) ?? "";
  const directoryParts = normalizedPath.split("/").slice(0, -1);
  const isRootLevel = directoryParts.length === 0;
  let score = 0;

  if (readmePattern.test(fileName)) {
    score += 10;
  } else if (priorityFilenames.has(fileName)) {
    score += 8;
  }
  if (isRootLevel) {
    score += 5;
  }
  if (isLikelyEntryPoint(file.path)) {
    score += 7;
  }
  if (isConfigurationFile(fileName)) {
    score += 6;
  }
  return score;
}

function isConfigurationFile(filename: string): boolean {
  const normalizedFileName = filename.toLowerCase();
  return (
    configFiles.has(normalizedFileName) ||
    configPatterns.some((pattern) => pattern.test(normalizedFileName))
  );
}
