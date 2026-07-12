# 🚀 Flarum Benchmark Suite

An automated, GitHub Actions-powered infrastructure designed to test and benchmark the performance of Flarum core and third-party extensions across multiple environments, Flarum versions, and database engines.

The suite measures:
- Total API Response Time
- Database Query Count & Execution Time
- Peak PHP Memory Usage
- Potential N+1 Queries and Slow Queries

## 🌟 Features

- **Multi-Engine Support:** Benchmarks on MySQL 8.4, MariaDB 11.4, PostgreSQL 16, and SQLite.
- **Cross-Version:** Tests Flarum 1.x and Flarum 2.x natively.
- **Dual-View Interactive Dashboard:** Automatically deploys an HTML/Chart.js dashboard to GitHub Pages featuring:
  - **Latest Run Configurations:** 4 distinct bar charts breaking down exactly how Flarum performed in the most recent benchmark.
  - **Historical Trends & Cross-Compare:** A longitudinal line chart tracking regressions over time, alongside an explicit tool to cross-compare any two configurations across any two historical runs.
- **Reusable Workflow:** Can be called directly from other Flarum extension repositories for CI/CD performance regression testing.
- **Dynamic Seeding:** Seeds up to thousands of users, discussions, and posts mathematically without database constraint errors.

---

> [!WARNING]
> **Environment Variance**: GitHub Actions utilizes shared public virtual machines. CPU and RAM allocation can fluctuate slightly depending on GitHub's current server load. While this suite is excellent for catching massive bottlenecks (e.g., N+1 query bugs or slow SQL queries), if you require absolute millisecond precision for comparative execution time baselines, it is highly recommended to configure the workflow to run on a **dedicated self-hosted runner**.

---

## 🛠️ How to Use

> [!WARNING]  
> **GitHub Actions Usage Limits**  
> Running massive, multi-dimensional custom matrices (e.g., testing 2 versions against 4 databases = 8 concurrent jobs) will consume GitHub Actions runner minutes. While GitHub provides generous free minutes, be mindful of your usage quotas if you are running this frequently!

### Method 1: Manual Run (UI)
1. Go to the **Actions** tab in this repository.
2. Select **Flarum Performance Benchmark**.
3. Click **Run workflow**.
4. You can adjust the parameters in the text boxes (they must be valid JSON arrays, e.g., `["v1.8.0", "v2.x-dev"]`).
5. **Tip:** By default, the UI will override your Repository Variables. To use your variables, check the `Override inputs with Repository Variables` box!

### Method 2: Calling from another Extension
You can integrate this benchmark directly into your own Flarum extension's CI pipeline by calling it as a reusable workflow!

```yaml
name: Performance Tests

on:
  push:
    branches: [ main ]

jobs:
  benchmark:
    uses: huoxin233/flarum-benchmark-suite/.github/workflows/benchmark.yml@main
    with:
      # Pass your extension's name to automatically install and enable it during the test!
      test-extensions: '["huoxin/my-custom-extension"]'
      flarum-version: '["v1.8.0", "v2.x-dev"]'
      database: '["mysql:8.4", "postgres:16"]'
      deploy-dashboard: false # Turn off HTML deployment for external repos
```

---

## ⚙️ Configuration & Repository Variables

To avoid typing the same JSON arrays every time you manually run the workflow, you can define **Repository Variables** in GitHub (`Settings -> Secrets and variables -> Actions -> Variables`).

If the `Override inputs with Repository Variables` toggle is checked (which is the default behavior), the workflow will pull directly from these variables!

### Available Variables:
- `BENCHMARK_PHP_VERSION` (e.g. `["8.3"]`)
- `BENCHMARK_FLARUM_VERSION` (e.g. `["v1.8.0", "v2.x-dev"]`)
- `BENCHMARK_DATABASE` (e.g. `["mysql:8.4", "mariadb:11.4", "postgres:16", "sqlite"]`)
- `BENCHMARK_DEBUG_MODE` (e.g. `["false"]`)
- `BENCHMARK_OPCACHE` (e.g. `["false"]`)
- `BENCHMARK_CORE_EXTENSIONS` (e.g. `["true"]`)
- `BENCHMARK_TEST_EXTENSIONS` (e.g. `["flarum/tags"]`)
- `BENCHMARK_TARGETS` (e.g. `["/api/discussions"]`)
- `BENCHMARK_BODY` (e.g. `""`)
- `BENCHMARK_ITERATIONS` (e.g. `"5"`)
- `BENCHMARK_SHOW_RESPONSE` (e.g. `"false"`)
- `BENCHMARK_CLEAR_CACHE` (e.g. `"true"`)
- `BENCHMARK_WARMUP` (e.g. `"true"`)
- `BENCHMARK_USERS` (e.g. `"50"`)
- `BENCHMARK_DISCUSSIONS` (e.g. `"50"`)
- `BENCHMARK_POSTS` (e.g. `"1000"`)
- `BENCHMARK_DEPLOY_DASHBOARD` (e.g. `"true"`)
- `BENCHMARK_CLEAR_HISTORY` (e.g. `"false"`)

### 🛠️ Advanced (Testing PRs & Dev Versions)
You can test specific forks, branches, or PRs of ANY Flarum extension (including the benchmark tool itself) by passing a JSON object to `VCS_REPOS` (or the `vcs-repos` UI input).

1. Provide the custom repositories:
`BENCHMARK_VCS_REPOS`: `'{"fof/links": "https://github.com/myfork/links"}'`
2. Request the specific branch in `test-exts`:
`BENCHMARK_TEST_EXTENSIONS`: `["fof/links:dev-my-pr-branch"]`

### 🎯 Common API Targets
If you are just getting started, here are some standard Flarum endpoints you can test out of the box (the benchmark tool automatically authenticates as User ID 1):
- `["/api/discussions"]` *(List all discussions)*
- `["/api/discussions/1"]` *(Load a specific discussion)*
- `["/api/posts"]` *(List all posts)*
- `["/api/users"]` *(List all users)*
- `["/api/users/1"]` *(Load a specific user)*
- `["/api/tags"]` *(List tags — requires `flarum/tags` extension to be enabled)*

### 🛠️ Advanced Targeting (Custom Scripts)
The `Targets` UI Input (or `BENCHMARK_TARGETS` variable) defaults to standard API endpoint strings like `["/api/discussions"]`. 
However, you can inject **JSON Objects** to run advanced setup scripts, or bypass the API entirely to benchmark raw PHP/SQL!

```json
[
  "/api/discussions",
  {
    "name": "Custom SQL Speed Test",
    "sql": "SELECT * FROM users;"
  },
  {
    "php": "\\Flarum\\User\\User::all();",
    "setup-sql": "UPDATE users SET is_email_confirmed = 1;"
  }
]
```
*(Note: If the `name` property is omitted, the dashboard chart will safely default to identifying the test as `sql-query` or `php-code`)*

### 🎛️ Advanced: Custom Matrix / BENCHMARK_CUSTOM_MATRIX

The `custom-matrix` input field in the manual UI and the `BENCHMARK_CUSTOM_MATRIX` GitHub variable serve the **exact same purpose**: they both allow you to bypass the default dynamic configuration and feed a raw JSON matrix directly to GitHub Actions!

This is extremely powerful because it allows you to use GitHub's `include` syntax to define **exact combinations**, rather than relying on the workflow to cross-multiply every Flarum version against every database engine.

For example, Flarum 1.x does not support PostgreSQL. If you want to test **Flarum 1.8.0 strictly with MySQL** and **Flarum 2.x-dev strictly with PostgreSQL** (without failing combinations), you can paste the following exact matrix into either the `custom-matrix` UI box or the `BENCHMARK_CUSTOM_MATRIX` variable:

```json
{
  "include": [
    {
      "flarum-version": "v1.8.0",
      "database": "mysql:8.4",
      "php-version": "8.3",
      "debug": "false",
      "core-extensions": "true",
      "test-exts": "",
      "opcache": "false",
      "target_type": "api",
      "target_value": "/api/discussions",
      "target_name": "/api/discussions",
      "setup_sql": "",
      "setup_php": ""
    },
    {
      "flarum-version": "v1.8.0",
      "database": "mysql:8.4",
      "php-version": "8.3",
      "debug": "false",
      "core-extensions": "true",
      "test-exts": "",
      "opcache": "false",
      "target_type": "api",
      "target_value": "/api/posts",
      "target_name": "/api/posts",
      "setup_sql": "",
      "setup_php": ""
    },
    {
      "flarum-version": "v2.x-dev",
      "database": "mysql:8.4",
      "php-version": "8.3",
      "debug": "false",
      "core-extensions": "true",
      "test-exts": "",
      "opcache": "false",
      "target_type": "api",
      "target_value": "/api/discussions",
      "target_name": "/api/discussions",
      "setup_sql": "",
      "setup_php": ""
    },
    {
      "flarum-version": "v2.x-dev",
      "database": "mysql:8.4",
      "php-version": "8.3",
      "debug": "false",
      "core-extensions": "true",
      "test-exts": "",
      "opcache": "false",
      "target_type": "api",
      "target_value": "/api/posts",
      "target_name": "/api/posts",
      "setup_sql": "",
      "setup_php": ""
    }
  ]
}
```

By providing this JSON payload, the action will skip the automated cross-multiplication and strictly spawn those two specific benchmarking jobs!

---

## 📊 The Dashboard

After the workflow finishes running the matrix, it merges all the individual JSON results into a single `data.json` file. 

The workflow then deploys the contents of the `dashboard/` directory straight to the `gh-pages` branch. The frontend `index.html` dynamically fetches `data.json` and renders beautiful dark-mode charts comparing API times, Database metrics, and Memory usage across all environments!

### Enabling GitHub Pages
For the dashboard to be publicly viewable, you must explicitly enable GitHub pages in your repository settings:
1. Go to your repository **Settings**.
2. Click **Pages** in the left sidebar.
3. Under "Build and deployment", set the Source to **Deploy from a branch**.
4. Select the **`gh-pages`** branch (and `/ (root)` folder) and click Save.
5. GitHub will provide you with the live URL!
