import "dotenv/config";
import express from "express";
import { annotateRepositoryTree } from "./analysis/annotateRepositoryTree.ts";
import { fetchRepositoryMetadata } from "./github/fetchRepositoryMetadata.ts";
import { fetchRepositoryTree } from "./github/fetchRepositoryTree.ts";
import { getGitHubErrorResponse } from "./github/githubErrorResponse.ts";
import { detectTechnologies } from "./analysis/detectTechnologies.ts";
import { detectEntryPoints } from "./analysis/detectEntryPoint.ts";

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
      const technologies = detectTechnologies(annotatedFiles);
      const entryPoints = detectEntryPoints(annotatedFiles);

      res.json({
        metadata,
        files: annotatedFiles,
        technologies,
        entryPoints,
        truncated: tree.truncated,
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
