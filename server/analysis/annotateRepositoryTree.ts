import type {
  AnnotatedRepositoryFile,
  FileExclusionReason,
  RepositoryFile,
} from "../types/repository";

const MAX_ANALYZABLE_FILE_SIZE_BYTES = 500_000;

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".output",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "vendor",
]);

const binaryExtensions = new Set([
  "7z",
  "avi",
  "bmp",
  "class",
  "dll",
  "doc",
  "docx",
  "eot",
  "exe",
  "gif",
  "gz",
  "ico",
  "jar",
  "jpeg",
  "jpg",
  "mov",
  "mp3",
  "mp4",
  "pdf",
  "png",
  "rar",
  "so",
  "tar",
  "ttf",
  "webm",
  "webp",
  "woff",
  "woff2",
  "xls",
  "xlsx",
  "zip",
]);

function getExtension(path: string): string {
  const filename = path.split("/").at(-1) ?? "";
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex + 1).toLowerCase();
}

export function getFileExclusionReason(
  file: RepositoryFile,
): FileExclusionReason | null {
  const pathParts = file.path.split("/");
  const filename = pathParts.at(-1)?.toLowerCase() ?? "";

  if (pathParts.some((part) => ignoredDirectories.has(part.toLowerCase()))) {
    return "ignored directory";
  }

  if (file.size !== null && file.size > MAX_ANALYZABLE_FILE_SIZE_BYTES) {
    return "file is too large";
  }

  if (binaryExtensions.has(getExtension(file.path))) {
    return "binary file";
  }

  if (filename.endsWith(".min.js") || filename.endsWith(".min.css")) {
    return "minified file";
  }

  return null;
}

export function annotateRepositoryTree(
  files: RepositoryFile[],
): AnnotatedRepositoryFile[] {
  return files.map((file) => {
    const exclusionReason = getFileExclusionReason(file);

    return {
      ...file,
      analyzable: exclusionReason === null,
      exclusionReason,
    };
  });
}
