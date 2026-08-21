import { describe, expect, it } from "vitest";
import type { AnnotatedRepositoryFile } from "../types/repository.ts";
import { selectImportantFiles } from "./selectImportantFiles.ts";

function file(path: string, analyzable = true): AnnotatedRepositoryFile {
  return {
    path,
    sha: `sha-${path}`,
    size: 100,
    analyzable,
    exclusionReason: analyzable ? null : "ignored directory",
  };
}

describe("selectImportantFiles", () => {
  it("considers ordinary production source files and excludes tests", () => {
    const result = selectImportantFiles([
      file("server/analysis/analyzeRepository.ts"),
      file("server/analysis/analyzeRepository.test.ts"),
      file("server/analysis/__tests__/fixture.ts"),
    ]);

    expect(result.map(({ path }) => path)).toEqual([
      "server/analysis/analyzeRepository.ts",
    ]);
  });

  it("ranks entry points above documentation, manifests, source, and config", () => {
    const result = selectImportantFiles([
      file("tsconfig.json"),
      file("src/analyzeRepository.ts"),
      file("package.json"),
      file("README.md"),
      file("server/index.ts"),
    ]);

    expect(result.map(({ path }) => path)).toEqual([
      "server/index.ts",
      "README.md",
      "package.json",
      "src/analyzeRepository.ts",
      "tsconfig.json",
    ]);
  });

  it("prefers public package boundaries over private tooling entry points", () => {
    const result = selectImportantFiles([
      file("README.md"),
      file("package.json"),
      file("packages-private/playground/src/main.ts"),
      file("packages-private/vite-debug/main.ts"),
      file("packages/compiler-core/index.js"),
      file("packages/compiler-core/src/index.ts"),
      file("packages/compiler-dom/src/index.ts"),
      file("packages/compiler-sfc/src/index.ts"),
      file("packages/compiler-ssr/src/index.ts"),
      file("packages/reactivity/src/index.ts"),
      file("packages/runtime-core/src/index.ts"),
      file("packages/runtime-dom/src/index.ts"),
      file("packages/vue/src/index.ts"),
    ]);

    const paths = result.map(({ path }) => path);

    expect(paths).toHaveLength(10);
    expect(paths).toContain("README.md");
    expect(paths).toContain("package.json");
    expect(paths).toContain("packages/compiler-core/src/index.ts");
    expect(paths).toContain("packages/runtime-core/src/index.ts");
    expect(paths).toContain("packages/vue/src/index.ts");
    expect(paths).not.toContain("packages/compiler-core/index.js");
    expect(paths).not.toContain("packages-private/playground/src/main.ts");
    expect(paths).not.toContain("packages-private/vite-debug/main.ts");
  });

  it("prevents documentation, manifests, and config files from dominating", () => {
    const result = selectImportantFiles([
      file("README.md"),
      file("docs/README.md"),
      file("package.json"),
      file("packages/client/package.json"),
      file("packages/server/package.json"),
      file("vite.config.ts"),
      file("eslint.config.js"),
      file("packages/client/vite.config.ts"),
      file("src/first.ts"),
      file("src/second.ts"),
      file("src/third.ts"),
    ]);

    expect(result.map(({ path }) => path)).toEqual([
      "README.md",
      "package.json",
      "packages/client/package.json",
      "src/first.ts",
      "src/second.ts",
      "src/third.ts",
      "eslint.config.js",
      "vite.config.ts",
    ]);
  });

  it("excludes declarations, examples, fixtures, and benchmarks", () => {
    const result = selectImportantFiles([
      file("src/public-types.d.ts"),
      file("examples/demo.ts"),
      file("fixtures/sample.ts"),
      file("benchmarks/parser.ts"),
      file("src/runtime.ts"),
    ]);

    expect(result.map(({ path }) => path)).toEqual(["src/runtime.ts"]);
  });

  it("ignores non-analyzable and unrelated files", () => {
    const result = selectImportantFiles([
      file("src/main.ts", false),
      file("notes/todo.txt"),
      file("public/logo.svg"),
    ]);

    expect(result).toEqual([]);
  });

  it("returns no more than ten important files", () => {
    const files = Array.from({ length: 15 }, (_, index) =>
      file(`src/module-${index + 1}.ts`),
    );

    expect(selectImportantFiles(files)).toHaveLength(10);
  });
});
