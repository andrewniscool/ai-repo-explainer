import type { RepositoryFile } from "./../types/repository";
import { octokit } from "./octokitClient";

export async function fetchRepositoryTree(
  owner: string,
  repository: string,
  defaultBranch: string,
): Promise<RepositoryFile[]> {
  const branchResponse = await octokit.rest.repos.getBranch({
    owner,
    repo: repository,
    branch: defaultBranch,
  });

  const commitResponse = await octokit.rest.git.getCommit({
    owner,
    repo: repository,
    commit_sha: branchResponse.data.commit.sha,
  });

  const treeResponse = await octokit.rest.git.getTree({
    owner,
    repo: repository,
    tree_sha: commitResponse.data.tree.sha,
    recursive: "true",
  });
  return treeResponse.data.tree
    .filter(
      (item): item is typeof item & { path: string; sha: string } =>
        item.type === "blob" && item.path != null && item.sha != null,
    )
    .map((item) => ({
      path: item.path,
      sha: item.sha,
      size: item.size ?? null,
    }));
}
