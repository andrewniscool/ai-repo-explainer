import { describe, expect, it } from "vitest";
import type { AnnotatedRepositoryFile } from "../types/repository.ts";
import { detectEntryPoints, isLikelyEntryPoint } from "./detectEntryPoint.ts";

function file(path: string, analyzable = true): AnnotatedRepositoryFile {
  return {
    path,
    sha: `sha-${path}`,
    size: 100,
    analyzable,
    exclusionReason: analyzable ? null : "ignored directory",
  };
}

describe("isLikelyEntryPoint", () => {
  it("recognizes supported entry-point paths", () => {
    expect(isLikelyEntryPoint("src/main.ts")).toBe(true);
    expect(isLikelyEntryPoint("server/index.js")).toBe(true);
    expect(isLikelyEntryPoint("cmd/server.go")).toBe(true);
  });

  it("matches entry-point names without regard to letter case", () => {
    expect(isLikelyEntryPoint("src/Program.CS")).toBe(true);
  });

  it("rejects ordinary source files", () => {
    expect(isLikelyEntryPoint("src/helper.ts")).toBe(false);
  });

  it("rejects entry-point names with unsupported extensions", () => {
    expect(isLikelyEntryPoint("src/main.css")).toBe(false);
  });

  it("rejects extensionless files", () => {
    expect(isLikelyEntryPoint("bin/main")).toBe(false);
  });
});

describe("detectEntryPoints", () => {
  it("returns only analyzable files with likely entry-point paths", () => {
    const files = [
      file("src/main.ts"),
      file("src/helper.ts"),
      file("server/index.js", false),
      file("README.md"),
    ];

    expect(detectEntryPoints(files)).toEqual([files[0]]);
  });

  it("returns an empty array when no entry points are detected", () => {
    expect(
      detectEntryPoints([file("src/helper.ts"), file("README.md")]),
    ).toEqual([]);
  });
});
