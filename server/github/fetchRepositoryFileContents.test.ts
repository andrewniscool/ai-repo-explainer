import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnnotatedRepositoryFile } from "../types/repository.ts";
import { fetchRepositoryFileContents } from "./fetchRepositoryFileContents.ts";

const getBlobMock = vi.hoisted(() => vi.fn());

vi.mock("./octokitClient.ts", () => ({
  octokit: {
    rest: {
      git: {
        getBlob: getBlobMock,
      },
    },
  },
}));

function file(path: string): AnnotatedRepositoryFile {
  return {
    path,
    sha: `sha-${path}`,
    size: 100,
    analyzable: true,
    exclusionReason: null,
  };
}

describe("fetchRepositoryFileContents", () => {
  beforeEach(() => {
    getBlobMock.mockReset();
  });

  it("fetches and decodes a repository file", async () => {
    const repositoryFile = file("package.json");
    const content = '{"name":"example"}';
    getBlobMock.mockResolvedValue({
      data: { content: Buffer.from(content).toString("base64") },
    });

    await expect(
      fetchRepositoryFileContents("octocat", "example", [repositoryFile]),
    ).resolves.toEqual({
      files: [
        {
          path: "package.json",
          sha: "sha-package.json",
          content,
          size: Buffer.byteLength(content, "utf8"),
        },
      ],
      failures: [],
    });
    expect(getBlobMock).toHaveBeenCalledWith({
      owner: "octocat",
      repo: "example",
      file_sha: "sha-package.json",
    });
  });

  it("rejects downloaded content that exceeds the file-size limit", async () => {
    const repositoryFile = file("README.md");
    getBlobMock.mockResolvedValue({
      data: { content: Buffer.alloc(100_001, "a").toString("base64") },
    });

    await expect(
      fetchRepositoryFileContents("octocat", "example", [repositoryFile]),
    ).resolves.toEqual({
      files: [],
      failures: [
        {
          path: "README.md",
          reason: "File README.md is too large",
        },
      ],
    });
  });

  it("rejects downloaded content containing null bytes", async () => {
    const repositoryFile = file("src/main.ts");
    getBlobMock.mockResolvedValue({
      data: { content: Buffer.from([65, 0, 66]).toString("base64") },
    });

    await expect(
      fetchRepositoryFileContents("octocat", "example", [repositoryFile]),
    ).resolves.toEqual({
      files: [],
      failures: [
        {
          path: "src/main.ts",
          reason: "File src/main.ts is a binary file",
        },
      ],
    });
  });

  it("keeps successful files when another file fails", async () => {
    const readme = file("README.md");
    const manifest = file("package.json");
    const content = "# Example";

    getBlobMock
      .mockResolvedValueOnce({
        data: { content: Buffer.from(content).toString("base64") },
      })
      .mockRejectedValueOnce(new Error("GitHub request failed"));

    await expect(
      fetchRepositoryFileContents("octocat", "example", [readme, manifest]),
    ).resolves.toEqual({
      files: [
        {
          path: "README.md",
          sha: "sha-README.md",
          content,
          size: Buffer.byteLength(content, "utf8"),
        },
      ],
      failures: [
        {
          path: "package.json",
          reason: "GitHub request failed",
        },
      ],
    });
  });
});
