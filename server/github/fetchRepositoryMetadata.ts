import { Octokit } from 'octokit';

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
})
export type RepositoryMetadata = {
    owner: string
    repository: string
    description: string | null
    stars: number
    defaultBranch: string
    languages: Record <string, number>
    license: string | null
}

export async function fetchRepositoryMetadata(owner: string, repository: string): Promise<RepositoryMetadata> {
    const response = await octokit.rest.repos.get({
        owner,
        repo: repository,
    })
    const data = response.data;
    const languagesResponse = await octokit.rest.repos.listLanguages({
        owner,
        repo: repository,
    })
    const languages = languagesResponse.data;

    return {
        owner: data.owner.login,
        repository: data.name,
        description: data.description,
        stars: data.stargazers_count,
        defaultBranch: data.default_branch,
        languages: languages,
        license: data.license?.spdx_id ?? null
    };
}