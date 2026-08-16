import "dotenv/config";
import express from "express";
import { annotateRepositoryTree } from "./analysis/annotateRepositoryTree";
import { fetchRepositoryMetadata } from "./github/fetchRepositoryMetadata";
import { fetchRepositoryTree } from "./github/fetchRepositoryTree";
import { getGitHubErrorResponse } from "./github/githubErrorResponse";

const app = express();
const port = 3001;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/api/health", (req, res) => {
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

      res.json({
        metadata,
        files: annotateRepositoryTree(tree.files),
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
