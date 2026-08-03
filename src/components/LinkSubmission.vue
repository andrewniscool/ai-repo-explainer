<script setup lang="ts">
import { ref } from 'vue'
import { parseGitHubURL } from '../utils/parseGithubURL'
import type { GitHubRepository } from '../utils/parseGithubURL'

const emit = defineEmits<{
  submit: [repository: GitHubRepository]
}>()

const repositoryUrl = ref('')
const errorMessage = ref('')

const examples = ['https://github.com/vuejs/core', 'https://github.com/vitejs/vite']

function submitRepository() {
  errorMessage.value = ''

  const result = parseGitHubURL(repositoryUrl.value.trim())

  if (!result.ok) {
    errorMessage.value = result.error
    return
  }

  emit('submit', result.repository)
}

function useExample(url: string) {
  repositoryUrl.value = url
  errorMessage.value = ''
}
</script>

<template>
  <form class="repository-form" novalidate @submit.prevent="submitRepository">
    <label for="repository-url">GitHub repository URL</label>
    <div class="input-shell" :class="{ 'input-shell--error': errorMessage }">
      <span class="link-icon" aria-hidden="true"></span>
      <input
        id="repository-url"
        v-model="repositoryUrl"
        type="url"
        inputmode="url"
        autocomplete="url"
        placeholder="https://github.com/owner/repository"
        :aria-invalid="Boolean(errorMessage)"
        aria-describedby="repository-hint repository-error"
        @input="errorMessage = ''"
      />
      <button type="submit">
        Analyze repository
        <span aria-hidden="true">→</span>
      </button>
    </div>

    <p v-if="errorMessage" id="repository-error" class="form-message form-message--error">
      {{ errorMessage }}
    </p>
    <p v-else id="repository-hint" class="form-message">
      Try
      <button v-for="example in examples" :key="example" type="button" @click="useExample(example)">
        {{ example.replace('https://github.com/', '') }}
      </button>
    </p>
  </form>
</template>

<style scoped>
.repository-form {
  width: min(720px, 100%);
  margin: 0 auto;
  text-align: left;
}

.repository-form > label {
  display: block;
  margin: 0 0 9px 3px;
  color: #b8c2dc;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.input-shell {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: 1px solid rgba(169, 198, 255, 0.28);
  border-radius: 15px;
  background: #0d1323;
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.32);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.input-shell:focus-within {
  border-color: rgba(169, 198, 255, 0.72);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.32), 0 0 0 4px rgba(112, 151, 255, 0.1);
}

.input-shell--error {
  border-color: rgba(255, 139, 143, 0.7);
}

.link-icon {
  position: relative;
  flex: 0 0 auto;
  width: 17px;
  height: 8px;
  margin-left: 10px;
  border: 2px solid #7482a3;
  border-radius: 99px;
  transform: rotate(-42deg);
}

.link-icon::after {
  position: absolute;
  left: 8px;
  top: 4px;
  width: 17px;
  height: 8px;
  border: 2px solid #7482a3;
  border-radius: 99px;
  content: '';
}

.input-shell input {
  min-width: 0;
  flex: 1;
  padding: 13px 8px;
  border: 0;
  outline: 0;
  color: #e8edff;
  background: transparent;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}

.input-shell input::placeholder {
  color: #64708e;
}

.input-shell button {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 21px;
  border: 0;
  border-radius: 10px;
  color: #071126;
  background: var(--primary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: transform 160ms ease, background 160ms ease;
}

.input-shell button:hover {
  background: #c1d5ff;
  transform: translateY(-1px);
}

.input-shell button:active {
  transform: translateY(0);
}

.input-shell button:focus-visible,
.form-message button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
}

.form-message {
  display: flex;
  min-height: 24px;
  flex-wrap: wrap;
  gap: 7px;
  margin: 12px 4px 0;
  align-items: center;
  color: #75809c;
  font-size: 12px;
}

.form-message button {
  padding: 0;
  border: 0;
  color: #aab7d7;
  background: transparent;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.form-message button:hover {
  color: var(--primary);
}

.form-message--error {
  color: #ff9da1;
}

@media (max-width: 720px) {
  .input-shell {
    flex-wrap: wrap;
  }

  .input-shell input {
    width: calc(100% - 45px);
  }

  .input-shell button {
    width: 100%;
  }
}
</style>
