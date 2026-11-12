import { describe, expect, it } from "vitest";
import { detectPackageTechnologies } from "./detectPackageTechnologies.ts";
import type { RepositoryFileContent } from "../types/repository.ts";

function manifest(
  value: unknown,
  path = "package.json",
): RepositoryFileContent {
  const content = JSON.stringify(value);
  return {
    path,
    content,
    sha: `sha-${path}`,
    size: Buffer.byteLength(content),
  };
}

describe("detectPackageTechnologies", () => {
  it("detects runtime and development dependencies with file-backed evidence", () => {
    const result = detectPackageTechnologies([
      manifest({
        dependencies: { vue: "^3", express: "^5" },
        devDependencies: { vite: "^8" },
      }),
    ]);
    expect(result.warnings).toEqual([]);
    expect(result.technologies).toEqual([
      {
        name: "Vue",
        category: "framework",
        matchingFileCount: 1,
        evidence: [
          { path: "package.json", reason: "Declares vue in dependencies" },
        ],
      },
      {
        name: "Express",
        category: "framework",
        matchingFileCount: 1,
        evidence: [
          { path: "package.json", reason: "Declares express in dependencies" },
        ],
      },
      {
        name: "Vite",
        category: "tool",
        matchingFileCount: 1,
        evidence: [
          { path: "package.json", reason: "Declares vite in devDependencies" },
        ],
      },
    ]);
  });

  it("counts each manifest once even when both sections declare a dependency", () => {
    const result = detectPackageTechnologies([
      manifest({ dependencies: { vue: "^3" }, devDependencies: { vue: "^3" } }),
      manifest({ dependencies: { vue: "^3" } }, "packages/ui/package.json"),
    ]);
    expect(result.technologies[0]?.matchingFileCount).toBe(2);
    expect(result.technologies[0]?.evidence).toHaveLength(2);
    expect(result.technologies[0]?.evidence[0]?.reason).toBe(
      "Declares vue in dependencies and devDependencies",
    );
  });

  it("does not infer usage from scripts, package names, peer dependencies, or substrings", () => {
    expect(
      detectPackageTechnologies([
        manifest({
          name: "vue",
          scripts: { start: "vite" },
          peerDependencies: { react: "*" },
          dependencies: { "vue-router": "^4" },
        }),
      ]).technologies,
    ).toEqual([]);
  });

  it("reports malformed manifests while preserving successful analysis", () => {
    const broken = { ...manifest({}), content: "not JSON" };
    const result = detectPackageTechnologies([
      broken,
      manifest({ dependencies: { vue: 3 } }, "packages/broken/package.json"),
      manifest({ dependencies: { react: "^19" } }, "packages/ui/package.json"),
    ]);
    expect(result.warnings).toEqual([
      "Could not analyze package.json: invalid JSON.",
      "Could not analyze packages/broken/package.json: invalid dependency fields.",
    ]);
    expect(result.technologies.map(({ name }) => name)).toEqual(["React"]);
  });

  it("accepts manifests without dependency sections and ignores other files", () => {
    expect(
      detectPackageTechnologies([
        manifest({ name: "example" }),
        manifest({ dependencies: { vue: "^3" } }, "README.md"),
      ]),
    ).toEqual({ technologies: [], warnings: [] });
  });

  it("rejects non-object manifests and invalid dependency maps without throwing", () => {
    for (const value of [
      null,
      [],
      "text",
      { dependencies: null },
      { devDependencies: [] },
    ]) {
      expect(
        detectPackageTechnologies([manifest(value)]).warnings,
      ).toHaveLength(1);
    }
  });

  it("caps evidence while preserving the total matching manifest count", () => {
    const files = Array.from({ length: 12 }, (_, i) =>
      manifest({ dependencies: { vue: "^3" } }, `packages/${i}/package.json`),
    );
    const result = detectPackageTechnologies(files);
    expect(result.technologies[0]?.matchingFileCount).toBe(12);
    expect(result.technologies[0]?.evidence).toHaveLength(10);
  });
});
