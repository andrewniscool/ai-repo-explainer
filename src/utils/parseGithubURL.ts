export type GitHubRepository = {
  owner: string;
  repository: string;
}
export type ParseGitHubResult =
| { ok: true; repository: GitHubRepository }
| { ok: false; error: string };

export function parseGitHubURL(url: string): ParseGitHubResult {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') {
        return {
            ok: false,
            error: 'URL must use HTTPS',
        };    
    }
    if (parsedUrl.hostname !== 'github.com') {
        return {
            ok: false,
            error: `Invalid hostname: ${parsedUrl.hostname}`,
        };
    }
    const pathParts = parsedUrl.pathname.split('/').filter((p) => p.length > 0);
    if (pathParts.length < 2) {
        return {
            ok: false,
            error: `Invalid URL: ${url}`,
        };
    }
    const [owner, rawRepository] = pathParts;
    const repository = rawRepository.replace(/\.git$/, '');
    return {
        ok: true,
        repository: { owner, repository }
    };
  } catch (error) {
    return {
        ok: false,
        error: `Invalid URL: ${url}`,
    };
  }
}