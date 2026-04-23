# NanoClaw Migration Guide

Generated: 2026-04-23
Base: a81e1651b5e48c9194162ffa2c50a22283d5ecd3
HEAD at generation: 4fce7b1d707bd1faef9ea61af763c7ca5f86813e
Upstream: a67b4abd79786178d8d4dd976f538f2a69abb1b3

## Applied Skills

These are reapplied by merging the upstream skill branch or re-running the skill.

- **Native credential proxy** — branch `skill/native-credential-proxy` (merge commit `9445d74`)
  Replaces OneCLI SDK with a built-in credential proxy that reads API keys from `.env` and injects them into container API requests. No keys are ever exposed to containers.

- **Telegram** — merged from remote `telegram` (merge commit `44cbbae`)
  Adds Telegram as a channel via grammY. Includes bot pool support for agent teams (multiple bot identities in group chats).

- **Gmail** — branch `skill/gmail` (feature commit `8fb4253`)
  Adds Gmail as a channel (polling for new emails) and as a tool (MCP server inside containers). OAuth credentials stored in `~/.gmail-mcp/`.

## Skill Interactions

No conflicts between applied skills. Each operates on separate files and config keys. The credential proxy is used by all channels (Telegram, Gmail route API calls through it).

## Modifications to Applied Skills

None. All skills are used as-is (only Prettier formatting differences).

## Customizations

### Agent Teams guidelines in global CLAUDE.md

**Intent:** Customize how the agent creates and manages agent teams (subagent swarms) in Telegram group chats. Each team member should use `mcp__nanoclaw__send_message` with a `sender` parameter to appear as a separate bot identity. Messages should be short (2-4 sentences), use WhatsApp/Telegram formatting (not Markdown), and the lead agent should avoid relaying teammate messages.

**Files:** `groups/global/CLAUDE.md`

**How to apply:** Add the following "Agent Teams" section after "Message Formatting" and before "Task Scripts" in `groups/global/CLAUDE.md`:

```markdown
## Agent Teams

When creating a team to tackle a complex task, follow these rules:

### CRITICAL: Follow the user's prompt exactly

Create *exactly* the team the user asked for — same number of agents, same roles, same names. Do NOT add extra agents, rename roles, or use generic names like "Researcher 1". If the user says "a marine biologist, a physicist, and Alexander Hamilton", create exactly those three agents with those exact names.

### Team member instructions

Each team member MUST be instructed to:

1. *Share progress in the group* via `mcp__nanoclaw__send_message` with a `sender` parameter matching their exact role/character name (e.g., `sender: "Marine Biologist"` or `sender: "Alexander Hamilton"`). This makes their messages appear from a dedicated bot in the Telegram group.
2. *Also communicate with teammates* via `SendMessage` as normal for coordination.
3. Keep group messages *short* — 2-4 sentences max per message. Break longer content into multiple `send_message` calls. No walls of text.
4. Use the `sender` parameter consistently — always the same name so the bot identity stays stable.
5. NEVER use markdown formatting. Use ONLY WhatsApp/Telegram formatting: single *asterisks* for bold (NOT **double**), _underscores_ for italic, • for bullets, ```backticks``` for code. No ## headings, no [links](url), no **double asterisks**.

### Example team creation prompt

When creating a teammate, include instructions like:

You are the Marine Biologist. When you have findings or updates for the user, send them to the group using mcp__nanoclaw__send_message with sender set to "Marine Biologist". Keep each message short (2-4 sentences max). Use emojis for strong reactions. ONLY use single *asterisks* for bold (never **double**), _underscores_ for italic, • for bullets. No markdown. Also communicate with teammates via SendMessage.

### Lead agent behavior

As the lead agent who created the team:

- You do NOT need to react to or relay every teammate message. The user sees those directly from the teammate bots.
- Send your own messages only to comment, share thoughts, synthesize, or direct the team.
- When processing an internal update from a teammate that doesn't need a user-facing response, wrap your *entire* output in `<internal>` tags.
- Focus on high-level coordination and the final synthesis.
```

### Mail spool mount for main agent

**Intent:** The main agent container can read system mail (logwatch reports, cron output, etc.) from the host's `/var/mail` directory.

**Files:** `src/container-runner.ts`

**How to apply:** In `buildVolumeMounts()`, inside the `if (isMain)` block, add a read-only mount for `/var/mail`:

```typescript
// Mount host mail spool so the main agent can read system mail (logwatch, etc.)
if (fs.existsSync('/var/mail')) {
  mounts.push({
    hostPath: '/var/mail',
    containerPath: '/var/mail',
    readonly: true,
  });
}
```

### Auto-compact window for agent containers

**Intent:** Set a custom compaction window (165,000 tokens) for Claude sessions inside containers, to allow longer conversations before auto-compaction triggers.

**Files:** `container/agent-runner/src/index.ts`

**How to apply:** In the `main()` function where `sdkEnv` is constructed, add:

```typescript
const sdkEnv: Record<string, string | undefined> = {
  ...process.env,
  CLAUDE_CODE_AUTO_COMPACT_WINDOW: '165000',
};
```

### Fork-sync GitHub Actions workflow

**Intent:** Automated CI workflow that syncs upstream changes and re-merges skill branches into the fork. Runs on repository_dispatch, schedule (every 6 hours), push to main, and manual trigger. Replaces the upstream `bump-version.yml` and `update-tokens.yml` workflows.

**Files:** `.github/workflows/fork-sync-skills.yml`

**How to apply:** This is a custom workflow file. Copy it as-is from the main tree into the upgraded tree. The upstream `bump-version.yml` and `update-tokens.yml` should be deleted (they're only useful for the upstream repo, not forks).

### Local CLI permissions

**Intent:** Development convenience — pre-approved Bash permissions for common operations used during Claude Code sessions on this machine.

**Files:** `.claude/settings.local.json`

**How to apply:** This file is machine-local and should be copied as-is. It contains permission entries like `Bash(docker:*)`, `Bash(systemctl:*)`, `Bash(npm:*)`, etc.

### Email notification behavior

**Intent:** When the agent receives email notifications (from Gmail channel), it should inform the user but NOT reply, forward, or take action unless explicitly asked.

**Files:** `groups/global/CLAUDE.md`

**How to apply:** Add the following section at the end of `groups/global/CLAUDE.md`:

```markdown
## Email Notifications

When you receive an email notification (messages starting with `[Email from ...`), inform the user about it but do NOT reply, forward, or take any action on the email unless the user explicitly asks you to. You have Gmail tools available — use them only on direct user request.
```
