import { describe, expect ,it } from 'vitest';
import { parseGitHubURL } from './parseGithubURL';

  describe('parseGitHubURL', () => {
    it('extracts the owner and repository', () => {
      const result = parseGitHubURL('https://github.com/vuejs/core')

      expect(result).toEqual({
        ok: true,
        repository: {
          owner: 'vuejs',
          repository: 'core',
        },
      })
    })
    it('accepts a repository URL with a trailing slash', () => {
      const result = parseGitHubURL('https://github.com/vuejs/core/')

      expect(result).toEqual({
        ok: true,
        repository: {
          owner: 'vuejs',
          repository: 'core',
        },
      })
    })
    it('rejects a URL with an invalid hostname', () => {
      const result = parseGitHubURL('https://gitlab.com/vuejs/core')

      expect(result).toEqual({
        ok: false,
        error: 'Invalid hostname: gitlab.com',
      })
    })

    describe('valid GitHub repository URLs', () => {
      it('extracts the owner and repository from the Hello-World URL', () => {
        const result = parseGitHubURL('https://github.com/octocat/Hello-World')

        expect(result).toEqual({
          ok: true,
          repository: {
            owner: 'octocat',
            repository: 'Hello-World',
          },
        })
      })

      it('extracts the owner and repository from the Flask URL', () => {
        const result = parseGitHubURL('https://github.com/pallets/flask')

        expect(result).toEqual({
          ok: true,
          repository: {
            owner: 'pallets',
            repository: 'flask',
          },
        })
      })

      it('extracts the owner and repository from the Express URL', () => {
        const result = parseGitHubURL('https://github.com/expressjs/express')

        expect(result).toEqual({
          ok: true,
          repository: {
            owner: 'expressjs',
            repository: 'express',
          },
        })
      })

      it('accepts a well-formed repository URL without checking whether the repository exists', () => {
        const result = parseGitHubURL(
          'https://github.com/this-repo-should-not-exist-123456789/foo',
        )

        expect(result).toEqual({
          ok: true,
          repository: {
            owner: 'this-repo-should-not-exist-123456789',
            repository: 'foo',
          },
        })
      })

      it('accepts a repository URL ending in .git', () => {
        const result = parseGitHubURL('https://github.com/octocat/Hello-World.git')

        expect(result).toEqual({
          ok: true,
          repository: {
            owner: 'octocat',
            repository: 'Hello-World',
          },
        })
      })
    })

    describe('GitHub URLs that point inside a repository', () => {
      it('extracts the repository from an issues URL', () => {
        const result = parseGitHubURL('https://github.com/octocat/Hello-World/issues')

        expect(result).toEqual({
          ok: true,
          repository: {
            owner: 'octocat',
            repository: 'Hello-World',
          },
        })
      })

      it('extracts the repository from a pull requests URL', () => {
        const result = parseGitHubURL('https://github.com/octocat/Hello-World/pulls')

        expect(result).toEqual({
          ok: true,
          repository: {
            owner: 'octocat',
            repository: 'Hello-World',
          },
        })
      })

      it('extracts the repository from a releases URL', () => {
        const result = parseGitHubURL('https://github.com/pallets/flask/releases')

        expect(result).toEqual({
          ok: true,
          repository: {
            owner: 'pallets',
            repository: 'flask',
          },
        })
      })

      it('extracts the repository from a URL pointing to a file', () => {
        const result = parseGitHubURL(
          'https://github.com/pallets/flask/blob/main/docs/index.rst',
        )

        expect(result).toEqual({
          ok: true,
          repository: {
            owner: 'pallets',
            repository: 'flask',
          },
        })
      })
    })

    describe('GitHub account URLs without a repository', () => {
      it('rejects a GitHub user profile URL', () => {
        const result = parseGitHubURL('https://github.com/octocat')

        expect(result).toEqual({
          ok: false,
          error: 'Invalid URL: https://github.com/octocat',
        })
      })

      it('rejects a GitHub organization URL', () => {
        const result = parseGitHubURL('https://github.com/expressjs')

        expect(result).toEqual({
          ok: false,
          error: 'Invalid URL: https://github.com/expressjs',
        })
      })
    })

    describe('invalid and non-GitHub URLs', () => {
      it('rejects a URL from a non-GitHub hostname', () => {
        const result = parseGitHubURL('https://example.com/octocat/Hello-World')

        expect(result).toEqual({
          ok: false,
          error: 'Invalid hostname: example.com',
        })
      })

      it('rejects text that is not a URL', () => {
        const result = parseGitHubURL('not-a-url')

        expect(result).toEqual({
          ok: false,
          error: 'Invalid URL: not-a-url',
        })
      })

      it('rejects a GitHub repository URL that does not use HTTPS', () => {
        const result = parseGitHubURL('http://github.com/octocat/Hello-World')

        expect(result).toEqual({
          ok: false,
          error: 'URL must use HTTPS',
        })
      })
    })
  })
