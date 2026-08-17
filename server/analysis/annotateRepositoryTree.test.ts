import { describe, expect, it } from "vitest";
import { annotateRepositoryTree } from "./annotateRepositoryTree.ts";
import type { RepositoryFile } from "../types/repository.ts";

function file(path: string, size: number | null = 100): RepositoryFile {
  return { path, size, sha: `sha-${path}` };
}

describe("annotateRepositoryTree", () => {
  it("marks ordinary source and configuration files as analyzable", () => {
    const files = [file("src/main.ts"), file("package.json")];

    expect(annotateRepositoryTree(files)).toEqual([
      {
        ...files[0],
        analyzable: true,
        exclusionReason: null,
      },
      {
        ...files[1],
        analyzable: true,
        exclusionReason: null,
      },
    ]);
  });

  it("keeps files from ignored directories and explains their exclusion", () => {
    const ignoredFile = file("node_modules/vue/index.js");

    expect(annotateRepositoryTree([ignoredFile])).toEqual([
      {
        ...ignoredFile,
        analyzable: false,
        exclusionReason: "ignored directory",
      },
    ]);
  });

  it("keeps excluded files and records why each one is not analyzable", () => {
    const files = [
      file("public/logo.png"),
      file("public/app.min.js"),
      file("fixtures/huge.json", 500_001),
    ];

    expect(
      annotateRepositoryTree(files).map(
        ({ path, analyzable, exclusionReason }) => ({
          path,
          analyzable,
          exclusionReason,
        }),
      ),
    ).toEqual([
      {
        path: "public/logo.png",
        analyzable: false,
        exclusionReason: "binary file",
      },
      {
        path: "public/app.min.js",
        analyzable: false,
        exclusionReason: "minified file",
      },
      {
        path: "fixtures/huge.json",
        analyzable: false,
        exclusionReason: "file is too large",
      },
    ]);
  });
});
