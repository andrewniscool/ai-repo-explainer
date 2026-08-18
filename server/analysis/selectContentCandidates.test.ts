import { describe, expect, it } from "vitest";
import type { AnnotatedRepositoryFile } from "../types/repository.ts";
import { selectContentCandidates } from "./selectContentCandidates.ts";

function file(
  path: string,
  analyzable = true,
  size: number | null = 100,
): AnnotatedRepositoryFile {
  return {
    path,
    sha: `sha-${path}`,
    size,
    analyzable,
    exclusionReason: analyzable ? null : "ignored directory",
  };
}

describe("selectContentCandidates", () => {
  it("selects common README formats and excludes unrelated source files", () => {
    const result = selectContentCandidates([
      file("README.rst"),
      file("docs/README.txt"),
      file("src/helper.ts"),
    ]);

    expect(result.map(({ path }) => path)).toEqual([
      "README.rst",
      "docs/README.txt",
    ]);
  });

  it("ignores README files that are not analyzable", () => {
    const result = selectContentCandidates([
      file("README.md", false),
      file("docs/README.md"),
    ]);

    expect(result.map(({ path }) => path)).toEqual(["docs/README.md"]);
  });

  it("selects likely entry points across supported languages", () => {
    const result = selectContentCandidates([
      file("src/main.ts"),
      file("app/main.py"),
      file("src/main.rs"),
      file("src/Program.cs"),
      file("cmd/server.go"),
    ]);

    expect(result.map(({ path }) => path).sort()).toEqual(
      [
        "src/main.ts",
        "app/main.py",
        "src/main.rs",
        "src/Program.cs",
        "cmd/server.go",
      ].sort(),
    );
  });

  it("rejects similarly named files that are not supported entry points", () => {
    const result = selectContentCandidates([
      file("src/main.css"),
      file("src/helper.py"),
      file("cmd/server.go", false),
    ]);

    expect(result).toEqual([]);
  });

  it("selects supported configuration file variants", () => {
    const result = selectContentCandidates([
      file("tsconfig.json"),
      file("docker/Dockerfile.production"),
      file("docker-compose.override.yaml"),
      file("vite.config.ts"),
      file("eslint.config.mjs"),
      file("test/karma.conf.js"),
    ]);

    expect(result.map(({ path }) => path).sort()).toEqual(
      [
        "tsconfig.json",
        "docker/Dockerfile.production",
        "docker-compose.override.yaml",
        "vite.config.ts",
        "eslint.config.mjs",
        "test/karma.conf.js",
      ].sort(),
    );
  });

  it("rejects unrelated and non-analyzable configuration-like files", () => {
    const result = selectContentCandidates([
      file("src/component.config.ts"),
      file("notes/dockerfile-guide.md"),
      file("vite.config.ts", false),
    ]);

    expect(result).toEqual([]);
  });

  it("ranks a root configuration file above its nested equivalent", () => {
    const result = selectContentCandidates([
      file("packages/client/vite.config.ts"),
      file("vite.config.ts"),
    ]);

    expect(result.map(({ path }) => path)).toEqual([
      "vite.config.ts",
      "packages/client/vite.config.ts",
    ]);
  });

  it("excludes files with unknown or excessive sizes", () => {
    const result = selectContentCandidates([
      file("README.md", true, 100_001),
      file("package.json", true, null),
      file("src/main.ts", true, 100_000),
    ]);

    expect(result.map(({ path }) => path)).toEqual(["src/main.ts"]);
  });

  it("stays within the total selected-byte budget", () => {
    const files = Array.from({ length: 8 }, (_, index) =>
      file(`packages/package-${index + 1}/package.json`, true, 100_000),
    );

    const result = selectContentCandidates(files);

    expect(result).toHaveLength(7);
    expect(
      result.reduce(
        (total, selectedFile) => total + (selectedFile.size ?? 0),
        0,
      ),
    ).toBe(700_000);
  });

  it("returns no more than twenty candidates", () => {
    const files = Array.from({ length: 25 }, (_, index) =>
      file(`packages/package-${index + 1}/package.json`),
    );

    expect(selectContentCandidates(files)).toHaveLength(20);
  });
});
