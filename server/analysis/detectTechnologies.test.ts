import { describe, expect, it } from "vitest";
import { detectTechnologies } from "./detectTechnologies.ts";
import type { AnnotatedRepositoryFile } from "../types/repository.ts";

function file(path: string, analyzable = true): AnnotatedRepositoryFile {
  return {
    path,
    size: 100,
    sha: `sha-${path}`,
    analyzable,
    exclusionReason: analyzable ? null : "ignored directory",
  };
}

describe("detectTechnologies", () => {
  it("detects supported languages and lists the matching files as evidence", () => {
    const files = [
      file("src/main.ts"),
      file("src/App.tsx"),
      file("scripts/build.js"),
      file("scripts/config.mjs"),
      file("tools/analyze.py"),
    ];

    expect(detectTechnologies(files)).toEqual([
      {
        name: "TypeScript",
        category: "language",
        matchingFileCount: 2,
        evidence: [
          {
            path: "src/App.tsx",
            reason: "File extension matches TypeScript",
          },
          {
            path: "src/main.ts",
            reason: "File extension matches TypeScript",
          },
        ],
      },
      {
        name: "JavaScript",
        category: "language",
        matchingFileCount: 2,
        evidence: [
          {
            path: "scripts/build.js",
            reason: "File extension matches JavaScript",
          },
          {
            path: "scripts/config.mjs",
            reason: "File extension matches JavaScript",
          },
        ],
      },
      {
        name: "Python",
        category: "language",
        matchingFileCount: 1,
        evidence: [
          {
            path: "tools/analyze.py",
            reason: "File extension matches Python",
          },
        ],
      },
    ]);
  });

  it("detects Rust, Haskell, Java, Go, C, and C++ files", () => {
    const files = [
      file("src/main.rs"),
      file("src/Main.hs"),
      file("src/Literate.lhs"),
      file("src/Main.java"),
      file("cmd/server.go"),
      file("src/program.c"),
      file("src/legacy.cc"),
      file("src/application.cpp"),
      file("src/modern.cxx"),
    ];

    expect(detectTechnologies(files)).toEqual([
      {
        name: "Rust",
        category: "language",
        matchingFileCount: 1,
        evidence: [
          {
            path: "src/main.rs",
            reason: "File extension matches Rust",
          },
        ],
      },
      {
        name: "Haskell",
        category: "language",
        matchingFileCount: 2,
        evidence: [
          {
            path: "src/Main.hs",
            reason: "File extension matches Haskell",
          },
          {
            path: "src/Literate.lhs",
            reason: "File extension matches Haskell",
          },
        ],
      },
      {
        name: "Java",
        category: "language",
        matchingFileCount: 1,
        evidence: [
          {
            path: "src/Main.java",
            reason: "File extension matches Java",
          },
        ],
      },
      {
        name: "Go",
        category: "language",
        matchingFileCount: 1,
        evidence: [
          {
            path: "cmd/server.go",
            reason: "File extension matches Go",
          },
        ],
      },
      {
        name: "C",
        category: "language",
        matchingFileCount: 1,
        evidence: [
          {
            path: "src/program.c",
            reason: "File extension matches C",
          },
        ],
      },
      {
        name: "C++",
        category: "language",
        matchingFileCount: 3,
        evidence: [
          {
            path: "src/application.cpp",
            reason: "File extension matches C++",
          },
          {
            path: "src/legacy.cc",
            reason: "File extension matches C++",
          },
          {
            path: "src/modern.cxx",
            reason: "File extension matches C++",
          },
        ],
      },
    ]);
  });

  it("matches file extensions without regard to letter case", () => {
    expect(detectTechnologies([file("src/Component.TSX")])).toEqual([
      {
        name: "TypeScript",
        category: "language",
        matchingFileCount: 1,
        evidence: [
          {
            path: "src/Component.TSX",
            reason: "File extension matches TypeScript",
          },
        ],
      },
    ]);
  });

  it("ignores files that are not analyzable", () => {
    expect(
      detectTechnologies([
        file("node_modules/library/index.js", false),
        file("src/main.ts"),
      ]),
    ).toEqual([
      {
        name: "TypeScript",
        category: "language",
        matchingFileCount: 1,
        evidence: [
          {
            path: "src/main.ts",
            reason: "File extension matches TypeScript",
          },
        ],
      },
    ]);
  });

  it("returns an empty array when no supported language is detected", () => {
    expect(
      detectTechnologies([file("README.md"), file("styles/main.css")]),
    ).toEqual([]);
  });

  it("caps evidence while preserving the total matching file count", () => {
    const files = Array.from({ length: 14 }, (_, index) =>
      file(`src/file-${index + 1}.ts`),
    );

    const [typeScript] = detectTechnologies(files);

    expect(typeScript).toMatchObject({
      name: "TypeScript",
      category: "language",
      matchingFileCount: 14,
    });
    expect(typeScript?.evidence).toHaveLength(10);
  });

  it("selects important source files before tests, fixtures, and declarations", () => {
    const ordinaryFiles = Array.from({ length: 10 }, (_, index) =>
      file(`deep/generated/location/file-${index + 1}.ts`),
    );
    const files = [
      ...ordinaryFiles,
      file("tests/parser.test.ts"),
      file("fixtures/sample.ts"),
      file("types/global.d.ts"),
      file("src/main.ts"),
    ];

    const [typeScript] = detectTechnologies(files);
    const evidencePaths =
      typeScript?.evidence.map((evidence) => evidence.path) ?? [];

    expect(typeScript?.matchingFileCount).toBe(14);
    expect(evidencePaths).toHaveLength(10);
    expect(evidencePaths[0]).toBe("src/main.ts");
    expect(evidencePaths).not.toContain("tests/parser.test.ts");
    expect(evidencePaths).not.toContain("fixtures/sample.ts");
    expect(evidencePaths).not.toContain("types/global.d.ts");
  });

  it("recognizes entry-point names across different languages", () => {
    const result = detectTechnologies([
      file("deep/source/helper.rs"),
      file("src/main.rs"),
      file("deep/source/worker.py"),
      file("app/main.py"),
    ]);

    expect(
      result.find(({ name }) => name === "Rust")?.evidence[0]?.path,
    ).toBe("src/main.rs");
    expect(
      result.find(({ name }) => name === "Python")?.evidence[0]?.path,
    ).toBe("app/main.py");
  });
});
