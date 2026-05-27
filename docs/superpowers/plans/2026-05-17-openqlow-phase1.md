# OPENQLOW Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build OPENQLOW Phase 1: a Mac-local attack AI that generates three daily FLATUP GYM SNS ideas, runs safety checks, prepares LINE approval messages, and saves approved drafts without directly publishing.

**Architecture:** Create a new `/Users/jin/Desktop/OPENQLOW HelMES/openqlow` TypeScript project separate from `flatup-ai-os`. The MVP uses deterministic local generators and file-backed state first, then adds adapter boundaries for LINE and Typefully so real credentials can be connected later without changing core logic.

**Tech Stack:** Node.js 18+, TypeScript, `tsx`, Node built-ins (`fs`, `path`, `crypto`, `http`), JSONL/Markdown draft storage, optional future SQLite behind a repository interface.

---

## File Structure

Create this new project:

```text
/Users/jin/Desktop/OPENQLOW HelMES/openqlow/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts
│   ├── config.ts
│   ├── types.ts
│   ├── generators/
│   │   ├── daily_three.ts
│   │   └── mma_topic.ts
│   ├── sources/
│   │   ├── brand_knowledge.ts
│   │   └── obsidian_inbox.ts
│   ├── distribution/
│   │   └── expand.ts
│   ├── safety/
│   │   ├── check.ts
│   │   └── check.test.ts
│   ├── approval/
│   │   ├── message.ts
│   │   └── message.test.ts
│   ├── adapters/
│   │   ├── x_typefully.ts
│   │   ├── instagram_draft.ts
│   │   └── threads_draft.ts
│   ├── state/
│   │   ├── file_store.ts
│   │   └── file_store.test.ts
│   ├── scheduler/
│   │   └── daily.ts
│   ├── line_bot/
│   │   └── webhook.ts
│   └── utils/
│       ├── paths.ts
│       └── slug.ts
├── drafts/
│   ├── instagram/.gitkeep
│   ├── threads/.gitkeep
│   └── x/.gitkeep
├── logs/.gitkeep
└── obsidian-bridge/.gitkeep
```

Responsibilities:

- `generators/`: creates three daily content ideas and MMA angles.
- `sources/`: reads FLATUP brand knowledge and Obsidian inbox notes.
- `distribution/`: expands one idea into X, Instagram, Threads, and LINE copy.
- `safety/`: blocks direct publishing risk, PII, unsafe claims, other-gym attacks, and missing approval.
- `approval/`: formats LINE approval messages with `Y / 修正 / ×`.
- `adapters/`: writes local drafts only in Phase 1. No direct publishing or scheduling.
- `state/`: stores pending, approved, rejected, and regenerated draft records by unique ID.
- `scheduler/`: runs the daily 8:00 workflow entrypoint.
- `line_bot/`: receives future LINE webhook callbacks. Phase 1 can be tested by CLI commands.

## Task 1: Scaffold OPENQLOW Project

**Files:**
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/package.json`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/tsconfig.json`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/.env.example`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/README.md`
- Create: `.gitkeep` files under `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/drafts`, `/logs`, and `/obsidian-bridge`

- [ ] **Step 1: Create project directories**

Run:

```bash
mkdir -p "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/"{generators,sources,distribution,safety,approval,adapters,state,scheduler,line_bot,utils}
mkdir -p "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/drafts/"{instagram,threads,x}
mkdir -p "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/logs" "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/obsidian-bridge"
touch "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/drafts/instagram/.gitkeep" "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/drafts/threads/.gitkeep" "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/drafts/x/.gitkeep" "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/logs/.gitkeep" "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/obsidian-bridge/.gitkeep"
```

Expected: directories exist.

- [ ] **Step 2: Create `package.json`**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/package.json`:

```json
{
  "name": "openqlow",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "FLATUP GYM attack AI for approved SNS draft generation",
  "scripts": {
    "dev": "tsx src/index.ts",
    "daily": "tsx src/scheduler/daily.ts",
    "typecheck": "tsc --noEmit",
    "test:safety": "tsx src/safety/check.test.ts",
    "test:approval": "tsx src/approval/message.test.ts",
    "test:state": "tsx src/state/file_store.test.ts",
    "test": "npm run typecheck && npm run test:safety && npm run test:approval && npm run test:state"
  },
  "devDependencies": {
    "@types/node": "^22.15.0",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3"
  },
  "dependencies": {}
}
```

- [ ] **Step 3: Create `tsconfig.json`**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: Create `.env.example`**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/.env.example`:

```dotenv
# OPENQLOW never publishes directly in Phase 1.
OPENQLOW_ROOT=/Users/jin/Desktop/OPENQLOW HelMES/openqlow
FLATUP_AI_OS_ROOT=/Users/jin/Desktop/OPENQLOW HelMES/flatup-ai-os
OBSIDIAN_VAULT_ROOT=/Users/jin/Documents/Obsidian Vault
OPENQLOW_INBOX_RELATIVE=30_INBOX/openqlow
OPENQLOW_DRY_RUN=true

# Future LINE webhook settings. Do not commit real secrets.
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=

# Typefully config is read from the existing local config, never stored here.
TYPEFULLY_CONFIG_PATH=/Users/jin/.config/typefully/config.json
```

- [ ] **Step 5: Create `README.md`**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/README.md`:

```markdown
# OPENQLOW

OPENQLOW is FLATUP GYM's attack AI for YouTube/SNS growth.

Phase 1 does not publish or schedule posts. It generates three daily ideas, expands them into platform drafts, runs safety checks, sends or previews LINE approval messages, and saves approved drafts.

## Commands

```bash
npm install
npm run daily
npm run dev -- generate
npm run dev -- approve <draft-id> Y
npm run test
```

## Safety Rules

- No direct SNS publishing.
- Typefully draft only.
- Instagram, Threads, and YouTube metadata are local draft files only.
- LINE approval uses `Y / 修正 / ×`.
- API keys must not be written to Git, Obsidian, README, or logs.
```

- [ ] **Step 6: Install dependencies**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm install
```

Expected: `node_modules` and `package-lock.json` created.

- [ ] **Step 7: Commit if repository is available**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
git status --short
```

Expected: if not a git repository, skip commit and note it. If it is a repository:

```bash
git add package.json package-lock.json tsconfig.json .env.example README.md drafts logs obsidian-bridge
git commit -m "chore: scaffold openqlow project"
```

## Task 2: Core Types, Config, and Path Utilities

**Files:**
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/types.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/config.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/utils/paths.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/utils/slug.ts`

- [ ] **Step 1: Create shared types**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/types.ts`:

```ts
export type Platform = "x" | "instagram" | "threads" | "line" | "youtube";

export type DraftStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "needs_revision"
  | "saved";

export interface ContentIdea {
  id: string;
  date: string;
  theme: string;
  angle: string;
  audience: "beginners" | "women" | "kids_parents" | "mma_fans" | "local_narita";
  source: "rotation" | "obsidian_inbox" | "mma_topic";
  valueConnection: string;
}

export interface PlatformDraft {
  id: string;
  ideaId: string;
  platform: Platform;
  title?: string;
  body: string;
  hashtags: string[];
  cta: string;
  safetyNotes: string[];
  createdAt: string;
}

export interface DraftRecord {
  id: string;
  idea: ContentIdea;
  drafts: PlatformDraft[];
  status: DraftStatus;
  approvalMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyIssue {
  code:
    | "pii_phone"
    | "pii_email"
    | "other_gym_attack"
    | "overclaim"
    | "unsafe_auto_publish"
    | "missing_flatup_value";
  severity: "block" | "warn";
  message: string;
}

export interface SafetyResult {
  ok: boolean;
  issues: SafetyIssue[];
}
```

- [ ] **Step 2: Create config loader**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/config.ts`:

```ts
import path from "node:path";

export interface OpenqlowConfig {
  root: string;
  flatupAiOsRoot: string;
  obsidianVaultRoot: string;
  inboxRelative: string;
  dryRun: boolean;
  typefullyConfigPath: string;
}

export function loadConfig(): OpenqlowConfig {
  const root = process.env.OPENQLOW_ROOT || "/Users/jin/Desktop/OPENQLOW HelMES/openqlow";
  return {
    root,
    flatupAiOsRoot:
      process.env.FLATUP_AI_OS_ROOT || "/Users/jin/Desktop/OPENQLOW HelMES/flatup-ai-os",
    obsidianVaultRoot:
      process.env.OBSIDIAN_VAULT_ROOT || "/Users/jin/Documents/Obsidian Vault",
    inboxRelative: process.env.OPENQLOW_INBOX_RELATIVE || "30_INBOX/openqlow",
    dryRun: process.env.OPENQLOW_DRY_RUN !== "false",
    typefullyConfigPath:
      process.env.TYPEFULLY_CONFIG_PATH || path.join(process.env.HOME || "/Users/jin", ".config/typefully/config.json"),
  };
}
```

- [ ] **Step 3: Create path helpers**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/utils/paths.ts`:

```ts
import path from "node:path";
import { loadConfig } from "../config.js";

export function openqlowPath(...parts: string[]): string {
  return path.join(loadConfig().root, ...parts);
}

export function flatupAiOsPath(...parts: string[]): string {
  return path.join(loadConfig().flatupAiOsRoot, ...parts);
}

export function obsidianPath(...parts: string[]): string {
  return path.join(loadConfig().obsidianVaultRoot, ...parts);
}
```

- [ ] **Step 4: Create slug helper**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/utils/slug.ts`:

```ts
export function slugify(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "draft";
}
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit if repository is available**

```bash
git add src/types.ts src/config.ts src/utils/paths.ts src/utils/slug.ts
git commit -m "feat: add openqlow core types and config"
```

## Task 3: Safety Checker With Tests

**Files:**
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/safety/check.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/safety/check.test.ts`

- [ ] **Step 1: Write failing safety tests**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/safety/check.test.ts`:

```ts
import { checkDraftSafety } from "./check.js";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const safe = checkDraftSafety([
  "FLATUP GYMは、初心者が安心して挑戦できる成田の格闘技ジムです。",
  "怒鳴らない、威圧しない。まずは一歩を応援します。",
].join("\n"));
assert(safe.ok, "safe FLATUP value copy should pass");

const phone = checkDraftSafety("体験希望は090-1234-5678へ連絡してください。FLATUP GYM");
assert(!phone.ok, "phone number should block");
assert(phone.issues.some(i => i.code === "pii_phone"), "phone issue should be present");

const email = checkDraftSafety("問い合わせはtest@example.comへ。FLATUP GYM");
assert(!email.ok, "email should block");
assert(email.issues.some(i => i.code === "pii_email"), "email issue should be present");

const attack = checkDraftSafety("他のジムは最悪です。FLATUPだけが正しいです。");
assert(!attack.ok, "other gym attack should block");
assert(attack.issues.some(i => i.code === "other_gym_attack"), "attack issue should be present");

const overclaim = checkDraftSafety("FLATUPなら必ず痩せる。絶対に強くなる。");
assert(!overclaim.ok, "overclaim should block");
assert(overclaim.issues.some(i => i.code === "overclaim"), "overclaim issue should be present");

const publish = checkDraftSafety("今すぐ自動投稿して公開します。FLATUP GYM");
assert(!publish.ok, "auto publish language should block");
assert(publish.issues.some(i => i.code === "unsafe_auto_publish"), "auto publish issue should be present");

console.log("safety tests passed");
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run test:safety
```

Expected: FAIL with module not found for `./check.js`.

- [ ] **Step 3: Implement safety checker**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/safety/check.ts`:

```ts
import type { SafetyIssue, SafetyResult } from "../types.js";

const phonePattern = /(?:0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}|\+81[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const otherGymAttackPattern = /(他(の)?ジム|競合|ライバル).*(最悪|ダメ|最低|弱い|意味ない|終わってる)/;
const overclaimPattern = /(必ず痩せる|絶対に痩せる|必ず強くなる|絶対に強くなる|100%|完全保証)/;
const unsafePublishPattern = /(自動投稿|即時公開|勝手に公開|予約投稿API|schedule API)/i;

export function checkDraftSafety(text: string): SafetyResult {
  const issues: SafetyIssue[] = [];

  if (phonePattern.test(text)) {
    issues.push({
      code: "pii_phone",
      severity: "block",
      message: "電話番号らしき文字列が含まれています。",
    });
  }

  if (emailPattern.test(text)) {
    issues.push({
      code: "pii_email",
      severity: "block",
      message: "メールアドレスらしき文字列が含まれています。",
    });
  }

  if (otherGymAttackPattern.test(text)) {
    issues.push({
      code: "other_gym_attack",
      severity: "block",
      message: "他ジムを直接攻撃する表現があります。",
    });
  }

  if (overclaimPattern.test(text)) {
    issues.push({
      code: "overclaim",
      severity: "block",
      message: "効果を断定しすぎる表現があります。",
    });
  }

  if (unsafePublishPattern.test(text)) {
    issues.push({
      code: "unsafe_auto_publish",
      severity: "block",
      message: "Phase 1で禁止している自動公開・予約投稿表現があります。",
    });
  }

  if (!/FLATUP|フラットアップ|成田|初心者|女性|子ども|キッズ|挑戦|やさしい/.test(text)) {
    issues.push({
      code: "missing_flatup_value",
      severity: "warn",
      message: "FLATUPの価値観との接続が弱い可能性があります。",
    });
  }

  return {
    ok: issues.every(issue => issue.severity !== "block"),
    issues,
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run test:safety
```

Expected: PASS and output `safety tests passed`.

- [ ] **Step 5: Commit if repository is available**

```bash
git add src/safety/check.ts src/safety/check.test.ts
git commit -m "feat: add draft safety checker"
```

## Task 4: Daily Idea Generator and Source Readers

**Files:**
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/sources/brand_knowledge.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/sources/obsidian_inbox.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/generators/mma_topic.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/generators/daily_three.ts`

- [ ] **Step 1: Create brand knowledge reader**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/sources/brand_knowledge.ts`:

```ts
import { readFile } from "node:fs/promises";
import { flatupAiOsPath } from "../utils/paths.js";

const dataFiles = [
  "brand_voice.md",
  "gym_profile.md",
  "differentiation.md",
  "faq.md",
  "templates.md",
];

export async function loadBrandKnowledge(): Promise<string> {
  const chunks: string[] = [];
  for (const file of dataFiles) {
    const fullPath = flatupAiOsPath("src", "data", file);
    const text = await readFile(fullPath, "utf8").catch(() => "");
    if (text.trim()) chunks.push(`## ${file}\n\n${text.trim()}`);
  }
  return chunks.join("\n\n---\n\n");
}
```

- [ ] **Step 2: Create Obsidian inbox reader**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/sources/obsidian_inbox.ts`:

```ts
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config.js";

export interface InboxNote {
  path: string;
  text: string;
}

export async function readOpenqlowInbox(): Promise<InboxNote[]> {
  const config = loadConfig();
  const inboxPath = path.join(config.obsidianVaultRoot, config.inboxRelative);
  const names = await readdir(inboxPath).catch(() => []);
  const notes: InboxNote[] = [];

  for (const name of names.filter(name => name.endsWith(".md") || name.endsWith(".txt"))) {
    const fullPath = path.join(inboxPath, name);
    const text = await readFile(fullPath, "utf8").catch(() => "");
    if (text.trim()) notes.push({ path: fullPath, text: text.trim() });
  }

  return notes;
}
```

- [ ] **Step 3: Create MMA topic generator**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/generators/mma_topic.ts`:

```ts
import { createHash } from "node:crypto";
import type { ContentIdea } from "../types.js";

const themes = [
  {
    theme: "弱い自分と戦う人へ",
    angle: "格闘技は相手を倒す前に、自分の不安と向き合う練習になる",
    audience: "beginners" as const,
  },
  {
    theme: "親が安心できるキッズ格闘技",
    angle: "勝ち負けより、礼儀と挑戦する勇気を育てる",
    audience: "kids_parents" as const,
  },
  {
    theme: "女性が安心して始める格闘技",
    angle: "強さを押し付けず、自分を守れる感覚を少しずつ作る",
    audience: "women" as const,
  },
  {
    theme: "MMAから学ぶ安全な成長",
    angle: "強い選手ほど基礎と安全管理を大事にしている",
    audience: "mma_fans" as const,
  },
  {
    theme: "成田で始める最初の一歩",
    angle: "運動が苦手でも、怖くない環境なら挑戦は続けやすい",
    audience: "local_narita" as const,
  },
];

export function buildMmaIdeas(date = new Date()): ContentIdea[] {
  const isoDate = date.toISOString().slice(0, 10);
  return themes.slice(0, 3).map((item, index) => {
    const seed = `${isoDate}:${item.theme}:${index}`;
    const id = `idea_${createHash("sha1").update(seed).digest("hex").slice(0, 10)}`;
    return {
      id,
      date: isoDate,
      theme: item.theme,
      angle: item.angle,
      audience: item.audience,
      source: "mma_topic",
      valueConnection: "FLATUPの安全思想、初心者へのやさしさ、挑戦する勇気に接続する。",
    };
  });
}
```

- [ ] **Step 4: Create daily three generator**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/generators/daily_three.ts`:

```ts
import type { ContentIdea } from "../types.js";
import { buildMmaIdeas } from "./mma_topic.js";
import { readOpenqlowInbox } from "../sources/obsidian_inbox.js";
import { createHash } from "node:crypto";

export async function generateDailyThree(date = new Date()): Promise<ContentIdea[]> {
  const inbox = await readOpenqlowInbox();
  const isoDate = date.toISOString().slice(0, 10);

  if (inbox.length > 0) {
    const fromInbox = inbox.slice(0, 3).map((note, index): ContentIdea => {
      const firstLine = note.text.split(/\r?\n/).find(Boolean) || "OPENQLOW inbox idea";
      const seed = `${isoDate}:${note.path}:${index}`;
      return {
        id: `idea_${createHash("sha1").update(seed).digest("hex").slice(0, 10)}`,
        date: isoDate,
        theme: firstLine.slice(0, 50),
        angle: note.text.slice(0, 180),
        audience: "beginners",
        source: "obsidian_inbox",
        valueConnection: "Jinさんの生ネタをFLATUPの価値観に変換して使う。",
      };
    });
    return fromInbox.length === 3 ? fromInbox : [...fromInbox, ...buildMmaIdeas(date)].slice(0, 3);
  }

  return buildMmaIdeas(date);
}
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit if repository is available**

```bash
git add src/sources/brand_knowledge.ts src/sources/obsidian_inbox.ts src/generators/mma_topic.ts src/generators/daily_three.ts
git commit -m "feat: generate daily openqlow ideas"
```

## Task 5: Draft Expansion and Approval Message

**Files:**
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/distribution/expand.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/approval/message.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/approval/message.test.ts`

- [ ] **Step 1: Create draft expansion module**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/distribution/expand.ts`:

```ts
import type { ContentIdea, PlatformDraft } from "../types.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function expandIdea(idea: ContentIdea): PlatformDraft[] {
  const base = `${idea.theme}\n\n${idea.angle}\n\nFLATUP GYMは、怒鳴らない・威圧しない・挑戦する勇気を大切にする成田の格闘技ジムです。`;
  const hashtags = ["成田市", "キックボクシング", "格闘技", "初心者歓迎", "FLATUPGYM"];
  const createdAt = nowIso();

  return [
    {
      id: `${idea.id}_x`,
      ideaId: idea.id,
      platform: "x",
      body: `${idea.angle}\n\n強さは、怖さではなく一歩踏み出す勇気から始まる。\nFLATUP GYMは初心者の挑戦を応援します。`,
      hashtags: ["成田市", "格闘技", "FLATUPGYM"],
      cta: "体験は公式LINEからお気軽にご連絡ください。",
      safetyNotes: [],
      createdAt,
    },
    {
      id: `${idea.id}_instagram`,
      ideaId: idea.id,
      platform: "instagram",
      title: idea.theme,
      body: `${base}\n\nリール案: 冒頭1秒で「格闘技が怖い人へ」と出し、練習風景、笑顔、ミット打ち、最後に公式LINE CTA。`,
      hashtags,
      cta: "体験はプロフィールの公式LINEから。",
      safetyNotes: [],
      createdAt,
    },
    {
      id: `${idea.id}_threads`,
      ideaId: idea.id,
      platform: "threads",
      body: `${idea.theme}\n\n${idea.angle}\n\n格闘技は怖い人のためだけのものではありません。自信がない人が、自分のペースで変わっていく場所にもなります。FLATUP GYMはその最初の一歩を大切にします。`,
      hashtags: ["FLATUPGYM"],
      cta: "成田で体験したい方は公式LINEへ。",
      safetyNotes: [],
      createdAt,
    },
    {
      id: `${idea.id}_line`,
      ideaId: idea.id,
      platform: "line",
      body: `本日の投稿候補です。\n\n${idea.theme}\n${idea.angle}`,
      hashtags: [],
      cta: "Y / 修正: ... / × で返信してください。",
      safetyNotes: [],
      createdAt,
    },
  ];
}
```

- [ ] **Step 2: Write failing approval message tests**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/approval/message.test.ts`:

```ts
import { formatApprovalMessage } from "./message.js";
import type { ContentIdea, PlatformDraft, SafetyResult } from "../types.js";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const idea: ContentIdea = {
  id: "idea_test",
  date: "2026-05-17",
  theme: "弱い自分と戦う人へ",
  angle: "最初の一歩を応援する投稿",
  audience: "beginners",
  source: "mma_topic",
  valueConnection: "FLATUPの挑戦する勇気に接続する。",
};

const drafts: PlatformDraft[] = [{
  id: "idea_test_x",
  ideaId: "idea_test",
  platform: "x",
  body: "FLATUP GYMは初心者の挑戦を応援します。",
  hashtags: ["FLATUPGYM"],
  cta: "公式LINEへ",
  safetyNotes: [],
  createdAt: "2026-05-17T00:00:00.000Z",
}];

const safety: SafetyResult = { ok: true, issues: [] };
const message = formatApprovalMessage(idea, drafts, safety);

assert(message.includes("idea_test"), "message includes idea id");
assert(message.includes("Y / 修正: ... / ×"), "message includes reply commands");
assert(message.includes("安全チェック: OK"), "message includes safety OK");
assert(message.includes("FLATUP GYM"), "message includes draft body");

console.log("approval message tests passed");
```

- [ ] **Step 3: Run approval tests to verify failure**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run test:approval
```

Expected: FAIL with module not found for `./message.js`.

- [ ] **Step 4: Implement approval message formatter**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/approval/message.ts`:

```ts
import type { ContentIdea, PlatformDraft, SafetyResult } from "../types.js";

export function formatApprovalMessage(
  idea: ContentIdea,
  drafts: PlatformDraft[],
  safety: SafetyResult
): string {
  const safetyText = safety.ok
    ? "安全チェック: OK"
    : [
        "安全チェック: 要確認",
        ...safety.issues.map(issue => `- [${issue.severity}] ${issue.code}: ${issue.message}`),
      ].join("\n");

  const draftText = drafts
    .map(draft => [
      `--- ${draft.platform.toUpperCase()} ---`,
      draft.title ? `Title: ${draft.title}` : "",
      draft.body,
      draft.hashtags.length ? `#${draft.hashtags.join(" #")}` : "",
      `CTA: ${draft.cta}`,
    ].filter(Boolean).join("\n"))
    .join("\n\n");

  return [
    `OPENQLOW 承認依頼: ${idea.id}`,
    `日付: ${idea.date}`,
    `テーマ: ${idea.theme}`,
    `角度: ${idea.angle}`,
    `価値接続: ${idea.valueConnection}`,
    "",
    safetyText,
    "",
    draftText,
    "",
    "返信: Y / 修正: ... / ×",
  ].join("\n");
}
```

- [ ] **Step 5: Run approval tests**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run test:approval
```

Expected: PASS and output `approval message tests passed`.

- [ ] **Step 6: Commit if repository is available**

```bash
git add src/distribution/expand.ts src/approval/message.ts src/approval/message.test.ts
git commit -m "feat: expand ideas into approval drafts"
```

## Task 6: File-Backed State and Draft Writers

**Files:**
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/state/file_store.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/state/file_store.test.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/adapters/instagram_draft.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/adapters/threads_draft.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/adapters/x_typefully.ts`

- [ ] **Step 1: Write file store tests**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/state/file_store.test.ts`:

```ts
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { saveRecord, loadRecord } from "./file_store.js";
import type { DraftRecord } from "../types.js";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const tmp = await mkdtemp(path.join(os.tmpdir(), "openqlow-store-"));
const record: DraftRecord = {
  id: "record_test",
  idea: {
    id: "idea_test",
    date: "2026-05-17",
    theme: "弱い自分と戦う人へ",
    angle: "最初の一歩",
    audience: "beginners",
    source: "mma_topic",
    valueConnection: "FLATUPの挑戦に接続",
  },
  drafts: [],
  status: "pending_approval",
  approvalMessage: "承認依頼",
  createdAt: "2026-05-17T00:00:00.000Z",
  updatedAt: "2026-05-17T00:00:00.000Z",
};

await saveRecord(tmp, record);
const loaded = await loadRecord(tmp, "record_test");

assert(loaded?.id === "record_test", "loads saved record");
assert(loaded?.status === "pending_approval", "keeps status");

await rm(tmp, { recursive: true, force: true });
console.log("file store tests passed");
```

- [ ] **Step 2: Run state tests to verify failure**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run test:state
```

Expected: FAIL with module not found for `./file_store.js`.

- [ ] **Step 3: Implement file store**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/state/file_store.ts`:

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DraftRecord } from "../types.js";

export async function saveRecord(root: string, record: DraftRecord): Promise<string> {
  const dir = path.join(root, "state");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${record.id}.json`);
  await writeFile(file, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return file;
}

export async function loadRecord(root: string, id: string): Promise<DraftRecord | undefined> {
  const file = path.join(root, "state", `${id}.json`);
  const text = await readFile(file, "utf8").catch(() => "");
  if (!text) return undefined;
  return JSON.parse(text) as DraftRecord;
}
```

- [ ] **Step 4: Implement Instagram draft writer**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/adapters/instagram_draft.ts`:

```ts
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import type { PlatformDraft } from "../types.js";
import { slugify } from "../utils/slug.js";

export async function saveInstagramDraft(root: string, draft: PlatformDraft): Promise<string> {
  const dir = path.join(root, "drafts", "instagram");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${draft.createdAt.slice(0, 10)}-${slugify(draft.title || draft.id)}.md`);
  const body = [
    `# ${draft.title || "Instagram Draft"}`,
    "",
    `- id: ${draft.id}`,
    `- platform: instagram`,
    `- cta: ${draft.cta}`,
    "",
    draft.body,
    "",
    draft.hashtags.map(tag => `#${tag}`).join(" "),
  ].join("\n");
  await writeFile(file, `${body}\n`, "utf8");
  await appendFile(path.join(dir, "index.jsonl"), `${JSON.stringify({ id: draft.id, file, createdAt: draft.createdAt })}\n`, "utf8");
  return file;
}
```

- [ ] **Step 5: Implement Threads draft writer**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/adapters/threads_draft.ts`:

```ts
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import type { PlatformDraft } from "../types.js";
import { slugify } from "../utils/slug.js";

export async function saveThreadsDraft(root: string, draft: PlatformDraft): Promise<string> {
  const dir = path.join(root, "drafts", "threads");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${draft.createdAt.slice(0, 10)}-${slugify(draft.id)}.md`);
  const body = [
    `# Threads Draft`,
    "",
    `- id: ${draft.id}`,
    `- platform: threads`,
    `- cta: ${draft.cta}`,
    "",
    draft.body,
    "",
    draft.hashtags.map(tag => `#${tag}`).join(" "),
  ].join("\n");
  await writeFile(file, `${body}\n`, "utf8");
  await appendFile(path.join(dir, "index.jsonl"), `${JSON.stringify({ id: draft.id, file, createdAt: draft.createdAt })}\n`, "utf8");
  return file;
}
```

- [ ] **Step 6: Implement Typefully draft stub**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/adapters/x_typefully.ts`:

```ts
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import type { PlatformDraft } from "../types.js";
import { slugify } from "../utils/slug.js";

export async function saveXDraftOnly(root: string, draft: PlatformDraft): Promise<string> {
  const dir = path.join(root, "drafts", "x");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${draft.createdAt.slice(0, 10)}-${slugify(draft.id)}.md`);
  const text = [
    `# X Draft`,
    "",
    `- id: ${draft.id}`,
    `- platform: x`,
    `- typefully_mode: draft_only`,
    "",
    draft.body,
    "",
    draft.hashtags.map(tag => `#${tag}`).join(" "),
    "",
    `CTA: ${draft.cta}`,
  ].join("\n");
  await writeFile(file, `${text}\n`, "utf8");
  await appendFile(path.join(dir, "index.jsonl"), `${JSON.stringify({ id: draft.id, file, createdAt: draft.createdAt, mode: "draft_only" })}\n`, "utf8");
  return file;
}
```

- [ ] **Step 7: Run tests**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run test:state
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit if repository is available**

```bash
git add src/state/file_store.ts src/state/file_store.test.ts src/adapters/instagram_draft.ts src/adapters/threads_draft.ts src/adapters/x_typefully.ts
git commit -m "feat: save approved drafts locally"
```

## Task 7: Daily Workflow CLI

**Files:**
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/scheduler/daily.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/index.ts`

- [ ] **Step 1: Implement daily scheduler**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/scheduler/daily.ts`:

```ts
import { createHash } from "node:crypto";
import { loadConfig } from "../config.js";
import type { DraftRecord, PlatformDraft } from "../types.js";
import { generateDailyThree } from "../generators/daily_three.js";
import { expandIdea } from "../distribution/expand.js";
import { checkDraftSafety } from "../safety/check.js";
import { formatApprovalMessage } from "../approval/message.js";
import { saveRecord, loadRecord } from "../state/file_store.js";
import { saveXDraftOnly } from "../adapters/x_typefully.js";
import { saveInstagramDraft } from "../adapters/instagram_draft.js";
import { saveThreadsDraft } from "../adapters/threads_draft.js";

function recordIdFor(draftId: string): string {
  return `record_${createHash("sha1").update(draftId).digest("hex").slice(0, 10)}`;
}

function allDraftText(drafts: PlatformDraft[]): string {
  return drafts.map(draft => `${draft.body}\n${draft.cta}\n${draft.hashtags.join(" ")}`).join("\n\n");
}

export async function runDaily(): Promise<DraftRecord[]> {
  const config = loadConfig();
  const ideas = await generateDailyThree();
  const records: DraftRecord[] = [];

  for (const idea of ideas) {
    const drafts = expandIdea(idea);
    const safety = checkDraftSafety(allDraftText(drafts));
    const approvalMessage = formatApprovalMessage(idea, drafts, safety);
    const now = new Date().toISOString();
    const record: DraftRecord = {
      id: recordIdFor(idea.id),
      idea,
      drafts,
      status: "pending_approval",
      approvalMessage,
      createdAt: now,
      updatedAt: now,
    };
    await saveRecord(config.root, record);
    records.push(record);
  }

  return records;
}

export async function approveRecord(id: string): Promise<string[]> {
  const config = loadConfig();
  const record = await loadRecord(config.root, id);
  if (!record) throw new Error(`Record not found: ${id}`);

  const safety = checkDraftSafety(allDraftText(record.drafts));
  if (!safety.ok) {
    throw new Error(`Safety check failed: ${safety.issues.map(issue => issue.message).join(" / ")}`);
  }

  const saved: string[] = [];
  for (const draft of record.drafts) {
    if (draft.platform === "x") saved.push(await saveXDraftOnly(config.root, draft));
    if (draft.platform === "instagram") saved.push(await saveInstagramDraft(config.root, draft));
    if (draft.platform === "threads") saved.push(await saveThreadsDraft(config.root, draft));
  }

  await saveRecord(config.root, {
    ...record,
    status: "saved",
    updatedAt: new Date().toISOString(),
  });

  return saved;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const records = await runDaily();
  for (const record of records) {
    console.log("\n==============================");
    console.log(record.approvalMessage);
    console.log("==============================");
    console.log(`Record ID: ${record.id}`);
  }
}
```

- [ ] **Step 2: Implement CLI entrypoint**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/index.ts`:

```ts
import { approveRecord, runDaily } from "./scheduler/daily.js";

const [command, id, response] = process.argv.slice(2);

if (!command || command === "generate") {
  const records = await runDaily();
  console.log(`Generated ${records.length} approval records.`);
  for (const record of records) {
    console.log(`${record.id}: ${record.idea.theme}`);
  }
  process.exit(0);
}

if (command === "approve") {
  if (!id || response !== "Y") {
    console.error("Usage: npm run dev -- approve <record-id> Y");
    process.exit(1);
  }
  const saved = await approveRecord(id);
  console.log("Saved draft files:");
  for (const file of saved) console.log(file);
  process.exit(0);
}

console.error(`Unknown command: ${command}`);
console.error("Commands: generate, approve <record-id> Y");
process.exit(1);
```

- [ ] **Step 3: Run typecheck and daily generator**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run typecheck
npm run daily
```

Expected: PASS typecheck and print three approval messages plus record IDs.

- [ ] **Step 4: Approve one generated record**

Copy one real `record_...` ID printed by the previous command and run this command with that ID:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run dev -- approve <copied-record-id> Y
```

Expected: local draft files are created under `drafts/x`, `drafts/instagram`, and `drafts/threads`. No SNS publishing occurs.

- [ ] **Step 5: Run full tests**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run test
```

Expected: PASS.

- [ ] **Step 6: Commit if repository is available**

```bash
git add src/scheduler/daily.ts src/index.ts drafts logs
git commit -m "feat: add daily approval workflow"
```

## Task 8: LINE Webhook Skeleton and Launchd Documentation

**Files:**
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/line_bot/webhook.ts`
- Create: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/docs/launchd.md`
- Modify: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/README.md`

- [ ] **Step 1: Implement LINE webhook skeleton**

Write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/src/line_bot/webhook.ts`:

```ts
import http from "node:http";
import { approveRecord } from "../scheduler/daily.js";

const port = Number(process.env.OPENQLOW_LINE_PORT || 8787);

function parseApproval(text: string): { id: string; response: "Y" | "revision" | "reject"; note?: string } | undefined {
  const trimmed = text.trim();
  const y = trimmed.match(/^(record_[a-f0-9]+)\s+Y$/i);
  if (y) return { id: y[1], response: "Y" };

  const revision = trimmed.match(/^(record_[a-f0-9]+)\s+修正[:：]\s*(.+)$/);
  if (revision) return { id: revision[1], response: "revision", note: revision[2] };

  const reject = trimmed.match(/^(record_[a-f0-9]+)\s*[×x]$/i);
  if (reject) return { id: reject[1], response: "reject" };

  return undefined;
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/line/webhook") {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  let body = "";
  req.on("data", chunk => {
    body += chunk;
  });
  req.on("end", async () => {
    const parsed = parseApproval(body);
    if (!parsed) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, message: "No approval command found" }));
      return;
    }

    if (parsed.response === "Y") {
      const files = await approveRecord(parsed.id);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, saved: files }));
      return;
    }

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, action: parsed.response, note: parsed.note }));
  });
});

server.listen(port, () => {
  console.log(`OPENQLOW LINE webhook skeleton listening on http://localhost:${port}/line/webhook`);
});
```

- [ ] **Step 2: Create launchd documentation**

Create directory and write `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/docs/launchd.md`:

```markdown
# OPENQLOW launchd Setup

Phase 1 runs locally on Jin's Mac.

The daily command is:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run daily
```

Suggested launchd plist path:

```text
~/Library/LaunchAgents/com.flatup.openqlow.daily.plist
```

Suggested plist content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.flatup.openqlow.daily</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow" && npm run daily >> logs/launchd.log 2>&1</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>8</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
```

Load command:

```bash
launchctl load ~/Library/LaunchAgents/com.flatup.openqlow.daily.plist
```

Unload command:

```bash
launchctl unload ~/Library/LaunchAgents/com.flatup.openqlow.daily.plist
```
```

- [ ] **Step 3: Update README commands**

Append to `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/README.md`:

```markdown

## Phase 1 Workflow

Generate approval records:

```bash
npm run daily
```

Approve a record locally:

```bash
npm run dev -- approve <record-id> Y
```

Start the webhook skeleton:

```bash
tsx src/line_bot/webhook.ts
```

The webhook skeleton accepts plain test POST bodies like:

```text
record_abc123 Y
record_abc123 修正: もっと初心者向けに
record_abc123 ×
```
```

- [ ] **Step 4: Verify webhook skeleton**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
tsx src/line_bot/webhook.ts
```

In a second terminal:

```bash
curl -X POST http://localhost:8787/line/webhook --data 'record_missing Y'
```

Expected: server returns JSON error because the record does not exist. This confirms the route is wired without publishing anything.

- [ ] **Step 5: Run full tests**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run test
```

Expected: PASS.

- [ ] **Step 6: Commit if repository is available**

```bash
git add src/line_bot/webhook.ts docs/launchd.md README.md
git commit -m "docs: add line webhook skeleton and launchd guide"
```

## Task 9: Final Verification and Design Trace

**Files:**
- Modify: `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/README.md`

- [ ] **Step 1: Add design trace to README**

Append to `/Users/jin/Desktop/OPENQLOW HelMES/openqlow/README.md`:

```markdown

## Design Trace

This project implements Phase 1 of:

```text
/Users/jin/Desktop/OPENQLOW HelMES/flatup-ai-os/docs/openqlow_attack_ai_design.md
```

Implemented in Phase 1:

- Daily three ideas.
- MMA/value-driven topic generation.
- X / Instagram / Threads / LINE copy expansion.
- Safety checks.
- LINE-style approval message.
- Local approval command.
- X/Instagram/Threads draft files only.
- No direct publishing.

Deferred:

- Real LINE Messaging API signature verification and reply push.
- Real Typefully API draft creation.
- YouTube metadata files.
- Trial video clipper.
- Instagram Graph API.
- TikTok and LINE VOOM.
```

- [ ] **Step 2: Run all verification**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run test
npm run daily
```

Expected:

- Tests pass.
- Daily command prints three approval messages.
- No network calls are made.
- No publish/schedule API is called.

- [ ] **Step 3: Approve one sample record**

Run:

```bash
cd "/Users/jin/Desktop/OPENQLOW HelMES/openqlow"
npm run dev -- approve <copied-record-id> Y
```

Expected:

- Creates one X Markdown draft.
- Creates one Instagram Markdown draft.
- Creates one Threads Markdown draft.
- Updates the record status to `saved`.
- Does not publish or schedule.

- [ ] **Step 4: Inspect generated files**

Run:

```bash
find "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/drafts" -type f | sort
find "/Users/jin/Desktop/OPENQLOW HelMES/openqlow/state" -type f | sort
```

Expected: generated draft and state files exist.

- [ ] **Step 5: Commit if repository is available**

```bash
git add README.md drafts state
git commit -m "docs: document openqlow phase 1 trace"
```

## Self-Review

Spec coverage:

- Dedicated OPENQLOW project: Task 1.
- Mac-local Phase 1: Tasks 1, 7, 8.
- Daily three ideas: Tasks 4 and 7.
- MMA/value-driven generation: Task 4.
- X / Instagram / Threads / LINE expansion: Task 5.
- Safety checks: Task 3.
- LINE approval format and webhook skeleton: Tasks 5 and 8.
- `Y` approval only: Tasks 5, 7, 8.
- Draft-only saving: Tasks 6 and 7.
- No direct publishing: Tasks 3, 6, 7, 9.
- Obsidian/source reading: Task 4.
- Existing `flatup-ai-os` preserved: Task 2 path config and Task 4 read-only brand knowledge.

Red-flag scan:

- The plan contains no Phase 1 implementation gaps. Deferred items are explicitly listed as out of Phase 1 scope in Task 9.

Type consistency:

- `ContentIdea`, `PlatformDraft`, `DraftRecord`, `SafetyResult`, and `DraftStatus` are defined in Task 2 and reused consistently by later tasks.
