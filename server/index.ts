import "dotenv/config";
import express from "express";
import { fetchRepositoryMetadata } from "./github/fetchRepositoryMetadata";

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
  "/api/repository-metadata/:owner/:repository",
  async (req, res) => {
    const { owner, repository } = req.params;

    try {
      const metadata = await fetchRepositoryMetadata(owner, repository);
      res.json(metadata);
    } catch (error) {
      console.error("Error fetching repository metadata:", error);
      res.status(500).json({ error: "Failed to fetch repository metadata" });
    }
  },
);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
