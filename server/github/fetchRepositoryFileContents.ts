import { octokit } from "./octokitClient.ts";
import type {
  AnnotatedRepositoryFile,
  RepositoryFileContent,
} from "../types/repository.ts";

type FetchRepositoryFileContentsResult = {
  files: RepositoryFileContent[];
  failures: {
    path: string;
    reason: string;
  }[];
};

async function fetchRepositoryFileContent(
  owner: string,
  repo: string,
  file: AnnotatedRepositoryFile,
): Promise<RepositoryFileContent> {
  const MAX_FILE_BYTES = 100_000;
  const response = await octokit.rest.git.getBlob({
    owner,
    repo,
    file_sha: file.sha,
  });

  const decodedBytes = Buffer.from(response.data.content, "base64");

  if (decodedBytes.length > MAX_FILE_BYTES) {
    throw new Error(`File ${file.path} is too large`);
  }
  if (decodedBytes.includes(0)) {
    throw new Error(`File ${file.path} is a binary file`);
  }

  const decodedContent = decodedBytes.toString("utf-8");
  return {
    path: file.path,
    content: decodedContent,
    sha: file.sha,
    size: decodedBytes.length,
  };
}

export async function fetchRepositoryFileContents(
  owner: string,
  repo: string,
  candidates: AnnotatedRepositoryFile[],
): Promise<FetchRepositoryFileContentsResult> {
  const results = await Promise.allSettled(
    candidates.map((file) => fetchRepositoryFileContent(owner, repo, file)),
  );

  const files: RepositoryFileContent[] = [];
  const failures: FetchRepositoryFileContentsResult["failures"] = [];

  results.forEach((result, index) => {
    const candidate = candidates[index];
    if (!candidate) {
      return;
    }

    if (result.status === "fulfilled") {
      files.push(result.value);
    } else {
      failures.push({
        path: candidate.path,
        reason:
          result.reason instanceof Error
            ? result.reason.message
            : "Failed to fetch file",
      });
    }
  });

  return { files, failures };
}
