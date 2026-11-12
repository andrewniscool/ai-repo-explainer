import { z } from "zod";
import type {
  DetectedTechnology,
  RepositoryFileContent,
  TechnologyCategory,
} from "../types/repository.ts";

const packageSchema = z.object({
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
});

const rules: {
  dependency: string;
  name: string;
  category: TechnologyCategory;
}[] = [
  { dependency: "vue", name: "Vue", category: "framework" },
  { dependency: "react", name: "React", category: "framework" },
  { dependency: "next", name: "Next.js", category: "framework" },
  { dependency: "nuxt", name: "Nuxt", category: "framework" },
  { dependency: "express", name: "Express", category: "framework" },
  { dependency: "vite", name: "Vite", category: "tool" },
  { dependency: "vitest", name: "Vitest", category: "tool" },
  { dependency: "typescript", name: "TypeScript compiler", category: "tool" },
  { dependency: "eslint", name: "ESLint", category: "tool" },
  { dependency: "prettier", name: "Prettier", category: "tool" },
];

// A declaration is evidence of a dependency, not proof of runtime usage.
export function detectPackageTechnologies(files: RepositoryFileContent[]): {
  technologies: DetectedTechnology[];
  warnings: string[];
} {
  const technologies = new Map<string, DetectedTechnology>();
  const warnings: string[] = [];

  for (const file of files) {
    if (file.path.split("/").at(-1) !== "package.json") continue;

    let json: unknown;
    try {
      json = JSON.parse(file.content);
    } catch {
      warnings.push(`Could not analyze ${file.path}: invalid JSON.`);
      continue;
    }

    const parsed = packageSchema.safeParse(json);
    if (!parsed.success) {
      warnings.push(
        `Could not analyze ${file.path}: invalid dependency fields.`,
      );
      continue;
    }

    for (const rule of rules) {
      const sections = (["dependencies", "devDependencies"] as const).filter(
        (section) => Object.hasOwn(parsed.data[section] ?? {}, rule.dependency),
      );
      if (sections.length === 0) continue;

      const technology = technologies.get(rule.name) ?? {
        name: rule.name,
        category: rule.category,
        matchingFileCount: 0,
        evidence: [],
      };
      technology.matchingFileCount += 1;
      if (technology.evidence.length < 10) {
        technology.evidence.push({
          path: file.path,
          reason: `Declares ${rule.dependency} in ${sections.join(" and ")}`,
        });
      }
      technologies.set(rule.name, technology);
    }
  }

  return { technologies: [...technologies.values()], warnings };
}
