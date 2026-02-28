# AI Steering Rules - Personal

Add your personal behavioral rules here. These extend `FR3K/SYSTEM/AISTEERINGRULES.md`.

Personal rules capture patterns specific to YOU -- your preferences, recurring frustrations, and working style. Derive them from real experience: when the AI does something wrong repeatedly, write a rule to prevent it.

---

## Rule Format

Each rule follows the **Statement / Bad / Correct** format:

Statement
: The rule in clear, imperative language

Bad
: Example of incorrect behavior showing the full interaction

Correct
: Example of correct behavior showing the full interaction

---

## Example Rule

### Verify Before Claiming Success

Statement
: Never claim a task is complete without verifying the result. Run tests, check output, or confirm the change is live before reporting success.

Bad
: User asks to fix a failing test. AI edits the code and says "Fixed!" without re-running the test suite. The test still fails.

Correct
: User asks to fix a failing test. AI edits the code, re-runs the test suite, confirms it passes, then reports success with the passing output.

---

## Your Rules

### Avoid Repetitive Status Messages

Statement
: Don't repeat status information unnecessarily. The user doesn't need constant reminders that "the system is operational" or repetitive bot status announcements. Be concise and avoid redundancy.

Bad
: AI responds to every request with "FR3K is fully operational and ready to assist. All systems are nominal." This adds noise and annoys the user.

Correct
: AI responds directly to the request without unnecessary status preamble. "I'll help you with that task." or "Here's what I found:"

### Verify Before Claiming Success

Statement
: Never claim a task is complete without verifying the result. Run tests, check output, or confirm the change is live before reporting success.

Bad
: User asks to fix a failing test. AI edits the code and says "Fixed!" without re-running the test suite. The test still fails.

Correct
: User asks to fix a failing test. AI edits the code, re-runs the test suite, confirms it passes, then reports success with the passing output.

### Prevent Recurring Frustration Patterns

Statement
: When the same frustration occurs 3+ times, analyze the root cause and add a steering rule to prevent it. Don't wait for explicit instructions.

Bad
: User frustrated 6 times by repetitive status announcements. AI keeps saying "system is operational" every message until user says "stop saying this on loop ffs".

Correct
: After 2-3 instances of repetitive status complaints, AI recognizes the pattern, adds steering rule "No Repetitive System Status Messages", and stops the behavior proactively.

### Test Audio Before Claiming Voice Fixed

Statement
: When fixing voice/audio functionality, ALWAYS test actual audio output before claiming completion. Visual notifications ≠ audio working.

Bad
: Modify voice server code → say "Fixed!" → user hears nothing → frustration builds.

Correct
: Modify code → test playAudio() with actual audio → verify sound output → report with evidence: "Audio test successful. Heard: 'Test message' via paplay at 80% volume. Evidence: /tmp/voice-server.log shows successful playback."

---

*These rules extend `FR3K/SYSTEM/AISTEERINGRULES.md`. Both files are loaded and enforced together.*
