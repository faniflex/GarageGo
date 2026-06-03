Robot Framework functional tests (basic scaffold)

Setup

1. Create a Python virtualenv and activate it (recommended):

   python -m venv .venv
   \# Windows PowerShell
   .\.venv\Scripts\Activate.ps1
   \# macOS / Linux
   source .venv/bin/activate

2. Install dependencies:

   pip install -r robot_tests/requirements.txt

3. Install a browser driver (e.g., ChromeDriver) and ensure it's on your PATH.

Run tests (one-by-one)

- PowerShell (Windows):

  .\robot_tests\run_tests.ps1

- Bash (macOS / Linux / WSL):

  bash robot_tests/run_tests.sh

Run a single test file:

  robot robot_tests/tests/login.robot

Notes

- Tests assume the app is running at http://localhost:8080. Start the dev server first (`npm run dev`).
- Selenium may require matching browser and driver versions.
- Update `robot_tests/variables.robot` to change `${BASE_URL}` or `${BROWSER}`.
