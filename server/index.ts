import "dotenv/config";
import express from "express";
import { annotateRepositoryTree } from "./analysis/annotateRepositoryTree.ts";
import { fetchRepositoryMetadata } from "./github/fetchRepositoryMetadata.ts";
import { fetchRepositoryTree } from "./github/fetchRepositoryTree.ts";
import { getGitHubErrorResponse } from "./github/githubErrorResponse.ts";
import { detectTechnologies } from "./analysis/detectTechnologies.ts";
import { detectEntryPoints } from "./analysis/detectEntryPoint.ts";
import { selectImportantFiles } from "./analysis/selectImportantFiles.ts";
import { selectContentCandidates } from "./analysis/selectContentCandidates.ts";
import { fetchRepositoryFileContents } from "./github/fetchRepositoryFileContents.ts";
import { detectPackageTechnologies } from "./analysis/detectPackageTechnologies.ts";

const app = express();
const port = 3001;

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello, World!");
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get<{ owner: string; repository: string }>(
  "/api/repositories/:owner/:repository",
  async (req, res) => {
    const { owner, repository } = req.params;

    try {
      const metadata = await fetchRepositoryMetadata(owner, repository);
      const tree = await fetchRepositoryTree(
        owner,
        repository,
        metadata.defaultBranch,
      );

      const annotatedFiles = annotateRepositoryTree(tree.files);
      // Fetch only manifests for this step, within the existing content budgets.
      const manifests = annotatedFiles.filter(
        (file) =>
          file.analyzable && file.path.split("/").at(-1) === "package.json",
      );
      const candidates = selectContentCandidates(manifests);
      const contents = await fetchRepositoryFileContents(
        owner,
        repository,
        candidates,
      );
      const packageAnalysis = detectPackageTechnologies(contents.files);
      const technologies = [
        ...detectTechnologies(annotatedFiles),
        ...packageAnalysis.technologies,
      ];
      const analysisWarnings = [
        ...packageAnalysis.warnings,
        ...contents.failures.map(
          ({ path }) =>
            `Could not fetch ${path}; dependency detection may be incomplete.`,
        ),
      ];
      if (candidates.length < manifests.length) {
        analysisWarnings.push(
          "Some package manifests were skipped because of content limits.",
        );
      }
      const entryPoints = detectEntryPoints(annotatedFiles);
      const importantFiles = selectImportantFiles(annotatedFiles);

      res.json({
        metadata,
        truncated: tree.truncated,
        files: annotatedFiles,
        technologies,
        entryPoints,
        importantFiles,
        analysisWarnings,
      });
    } catch (error) {
      const errorMessage = getGitHubErrorResponse(error);
      res.status(errorMessage.status).json({ error: errorMessage.message });
    }
  },
);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
