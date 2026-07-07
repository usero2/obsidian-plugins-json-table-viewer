# Git Branching Strategy & Workflow Setup Prompt

Copy and paste the prompt below to your AI assistant (e.g. Gemini, Claude, or ChatGPT) when you want to initialize the same Git branching strategy for other projects.

---

### [START OF AI PROMPT]

I want to configure a Git repository setup for a new/existing project with two branches:
1. **`dev` (Local Development Branch)**: Tracks all files including source code (source files, package.json, config files, etc.). This branch stays local and is not pushed to the public remote repository.
2. **`main` (Public Release Branch)**: Tracks ONLY release files (e.g., compiled `.js` bundle, metadata/manifests, styles, license, readme, gitignore, and github action workflows). This is the branch pushed to the public GitHub remote repository.

Please perform the following steps to configure this repository structure:

#### Step 1: Initialize Git and main Branch
1. Initialize the Git repository if not already initialized: `git init`
2. Ensure we are on branch `main` (if on `master`, rename to `main`: `git branch -M main`).
3. Create a `.gitignore` file for the `main` branch that ignores everything by default except the required release assets:
   ```gitignore
   # Ignore everything by default
   *

   # Do not ignore these release files
   !LICENSE
   !README.md
   !main.js
   !manifest.json
   !styles.css
   !.gitignore
   !images/
   !images/**
   !.github/
   !.github/workflows/
   !.github/workflows/release.yml
   !git_setup_prompt.md
   ```
4. If there are other files currently tracked in the index, run `git rm -r --cached .` to untrack them, and then run `git add` to add only the allowed files.
5. Create an initial commit on branch `main` with these release files only.

#### Step 2: Create a GitHub Action for Automatic Releases
Create a workflow file `.github/workflows/release.yml` to automatically upload the release assets to GitHub Releases when a new tag is pushed:
```yaml
name: Release

on:
  push:
    tags:
      - '*'

jobs:
  release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Release Plugin
        uses: softprops/action-gh-release@v1
        with:
          files: |
            main.js
            manifest.json
            styles.css
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
Commit this file to branch `main`.

#### Step 3: Set Up local dev Branch
1. Create and switch to a new branch named `dev`:
   ```bash
   git checkout -b dev
   ```
2. In the `dev` branch, overwrite `.gitignore` to only ignore node modules, so that all development and configuration files are tracked locally:
   ```gitignore
   node_modules/
   ```
3. Stage and commit all files in the `dev` branch:
   ```bash
   git add .
   git commit -m "Commit all source and config files in dev branch"
   ```
4. Switch back to the `main` branch:
   ```bash
   git checkout main
   ```

### [END OF AI PROMPT]

---

## Developer Cheat Sheet: How to work with this workflow

### 1. Start Development
Switch to the `dev` branch to restore all source code and config files onto your disk:
```bash
git checkout dev
```

### 2. Make Changes & Build
Modify source files, then compile:
```bash
npm run build
```

### 3. Save your Progress (Local dev branch)
```bash
git add .
git commit -m "Your commit message about dev changes"
```

### 4. Publish a Release (main branch)
Switch to `main` branch, copy the updated release files from `dev`, commit, and push:
```bash
# 1. Switch to main (development files will be hidden from the folder)
git checkout main

# 2. Checkout the build and documentation files from the dev branch
git checkout dev -- main.js styles.css manifest.json README.md LICENSE images/

# 3. Commit and push the release files
git commit -m "Release version X.Y.Z"
git push origin main

# 4. Tag a version to trigger GitHub Action Release upload
git tag v1.0.0
git push origin v1.0.0
```

### 5. Return to Development
```bash
git checkout dev
```
