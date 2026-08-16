<script setup lang="ts">
import { ref } from "vue";
import LinkSubmission from "./../components/LinkSubmission.vue";
import type { GitHubRepository } from "../utils/parseGithubURL.ts";

type RepositoryMetadata = {
  owner: string;
  repository: string;
  description: string | null;
  stars: number;
  defaultBranch: string;
  languages: Record<string, number>;
  license: string | null;
};

type RepositoryFile = {
  path: string;
  sha: string;
  size: number | null;
  analyzable: boolean;
  exclusionReason: string | null;
};

type RepositoryResult = {
  metadata: RepositoryMetadata;
  files: RepositoryFile[];
  truncated: boolean;
};

type ApiErrorResponse = {
  error: string;
};

const result = ref<RepositoryResult | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");

async function handleRepository(repository: GitHubRepository) {
  result.value = null;
  errorMessage.value = "";
  isLoading.value = true;

  try {
    const owner = encodeURIComponent(repository.owner);
    const repo = encodeURIComponent(repository.repository);

    const url = `/api/repositories/${owner}/${repo}`;
    const response = await fetch(url);
    if (!response.ok) {
      const data: ApiErrorResponse = await response.json();
      errorMessage.value = data.error || "Failed to fetch repository.";
      throw new Error(errorMessage.value);
    }
    const data: RepositoryResult = await response.json();
    result.value = data;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Failed to fetch repository.";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="site-shell">
    <main>
      <section class="hero-section" aria-labelledby="hero-title">
        <div class="hero-content">
          <p class="eyebrow">Repository overview</p>
          <h1 id="hero-title">
            Understand <span class="highlight">any</span> Repository
          </h1>
          <p class="hero-copy">Paste a public GitHub URL to get started.</p>
          <LinkSubmission @submit="handleRepository" />

          <Transition name="result">
            <!-- <div v-if="metadata" class="repository-result" role="status">
              <span class="result-icon" aria-hidden="true">✓</span>
              <span>
                Ready to analyze
                <strong>{{ metadata.owner }}/{{ metadata.repository }}</strong>
              </span>
            </div> -->
            <p v-if="isLoading" role="status">Loading repository…</p>

            <p v-else-if="errorMessage" role="alert">
              {{ errorMessage }}
            </p>
            <section v-else-if="result" class="repository-result">
              <p v-if="result.truncated" role="status">
                GitHub truncated this repository tree. The analysis may be
                incomplete.
              </p>
              <h2>
                {{ result.metadata.owner }}/{{ result.metadata.repository }}
              </h2>
              <p>
                {{ result.metadata.description ?? "No description provided." }}
              </p>
              <p>
                {{ result.metadata.stars.toLocaleString() }} stars · Default
                branch: {{ result.metadata.defaultBranch }} ·
                {{ result.files.filter((file) => file.analyzable).length }} of
                {{ result.files.length }} files analyzable
              </p>
              <h3>Repository files</h3>
              <ul>
                <li
                  v-for="file in result.files"
                  :key="file.path"
                  :class="{ 'file--excluded': !file.analyzable }"
                >
                  <code>{{ file.path }}</code>
                  <span v-if="!file.analyzable">
                    — not analyzed: {{ file.exclusionReason }}
                  </span>
                </li>
              </ul>
            </section>
          </Transition>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.highlight {
  color: var(--primary);
}
.site-shell {
  min-height: 100vh;
  overflow: hidden;
  background: #070b16;
}

.hero-section {
  display: grid;
  min-height: calc(100vh - 76px);
  place-items: center;
  padding: 64px 24px 120px;
}

.hero-content {
  width: min(850px, 100%);
  text-align: center;
}

.eyebrow {
  margin: 0 0 18px;
  color: #7f8ba7;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 16px;
  color: #f2f5ff;
  font-size: clamp(2.4rem, 5vw, 4rem);
  line-height: 1.05;
  letter-spacing: -0.05em;
}

.hero-copy {
  width: min(630px, 100%);
  margin: 0 auto 32px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.65;
}

.repository-result {
  margin: 32px auto 0;
  padding: 24px;
  border: 1px solid rgba(169, 198, 255, 0.2);
  border-radius: 15px;
  background: #0d1323;
  text-align: left;
}

.repository-result ul {
  max-height: 360px;
  margin: 12px 0 0;
  padding-left: 24px;
  overflow: auto;
}

.repository-result li {
  margin: 6px 0;
  color: #aab5cf;
}

.repository-result .file--excluded {
  color: #75809c;
}

.repository-result .file--excluded span {
  font-size: 12px;
}

.repository-result h2,
.repository-result h3 {
  color: #edf2ff;
}

.repository-result p {
  color: #aab5cf;
}

.repository-ready {
  display: inline-flex;
  margin-top: 22px;
  align-items: center;
  gap: 10px;
  color: #aab5cf;
  font-size: 14px;
}

.repository-result strong {
  margin-left: 4px;
  color: #edf2ff;
  font-family: "JetBrains Mono", monospace;
  font-weight: 500;
}

.result-icon {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 1px solid rgba(98, 230, 174, 0.34);
  border-radius: 50%;
  color: var(--green);
  background: rgba(98, 230, 174, 0.08);
  font-size: 12px;
}

.result-enter-active,
.result-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.result-enter-from,
.result-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
