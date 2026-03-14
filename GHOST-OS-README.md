# GHOST/OS — Neural Agent Terminal (Groq / OpenRouter Edition)

```
██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗
██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝
██║  ███╗███████║██║   ██║███████╗   ██║
██║   ██║██╔══██║██║   ██║╚════██║   ██║
╚██████╔╝██║  ██║╚██████╔╝███████║   ██║
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝

Groq & OpenRouter API Edition
```

**GHOST/OS** is a browser-based AI-native operating system terminal.
It looks and feels like a real retro Unix terminal, but routes every command
through a live AI agent powered by **Groq** and **OpenRouter** — that can search the web, manage persistent notes, execute JavaScript securely via sandboxes, and iterate across multiple steps to complete complex tasks.

---

## What makes GHOST/OS special?

1. **A True ReAct Agent**: GHOST/OS isn't a simple chatbot. It implements the Reasoning + Acting (ReAct) pattern locally in the browser. It thinks before it acts, loops recursively, and can execute multiple tools independently in parallel to fulfill complex goals without any human intervention between steps.
2. **Secure Browser-Side Execution**: Running code dynamically on a webpage is historically dangerous. GHOST/OS uses a hidden, sandboxed HTML `iframe` communicating securely via `postMessage` to compute math, evaluate strings, and run logic dynamically—without exposing the main window environment to the AI.
3. **Immersive Aesthetics**: The terminal experience perfectly replicates a fast CRT interface with authentic scanlines, a glowing amber cursor, and a highly responsive typing effect that feels genuinely nostalgic—bridging the gap between the past and cutting-edge intelligence paradigms.

---

## Table of Contents

1. [What makes GHOST/OS special?](#what-makes-ghostos-special)
2. [Project Structure](#1-project-structure)
3. [Architecture](#2-architecture)
4. [The Agent Loop](#3-the-agent-loop)
5. [Tools Reference](#4-tools-reference)
6. [Session and Memory](#5-session-and-memory)
7. [Built-in Commands](#6-built-in-commands)
8. [Local Development](#7-local-development)
9. [Customisation Guide](#8-customisation-guide)
10. [Limitations](#9-limitations)

---

## 1. Project Structure

```
ghost-os/
├── index.html          ← The entire frontend application (HTML + CSS + JS)
├── server.js           ← Node.js backend to serve files and inject environment variables
├── package.json        ← Node dependencies
├── .env                ← (Create this) API keys for Groq and OpenRouter
├── GHOST-OS-README.md  ← This file
└── GHOST-OS-AI-AGENT-SKILLS.md
```

---

## 2. Architecture

```
Node.js Server (server.js)
├── Reads .env variables
└── Serves index.html with injected window.ENV

Browser (index.html)
│
├── CRT Terminal UI (scanlines, vignette, amber prompt)
├── Info Modal (Tabs: What / Tools / Memory / How-to)
│
└── handleCmd(input)
    ├── Built-ins: clear, help, date, sysinfo, notes, info (instant)
    └── AI path → runAgent(cmd)
                    │
                    ├── Build messages[] with full conv history
                    ├── groqChat(messages, tools) ──► Groq & OpenRouter APIs (Round Robin)
                    ├── Execute Tool Calls (Parallel)
                    │     ├── web_search
                    │     ├── save_note
                    │     ├── read_note
                    │     ├── list_notes
                    │     ├── delete_note
                    │     ├── run_js      → secure iframe sandbox
                    │     └── get_datetime → new Date()
                    ├── Append Tool Messages, loop (max 6 iterations)
                    └── Return final text to terminal
```

**Performance Optimizations (v5.3)**: 
- **No Hallucination Pass**: Removed secondary evaluation calls to speed up response latency.
- **No Complexity Gate**: Queries route instantly to the AI agent rather than pre-checking difficulty.

---

## 3. The Agent Loop

GHOST/OS uses native OpenAI-compatible tool calling payloads via the Groq and OpenRouter APIs.

When you ask a question, the terminal invokes the LLM. If the LLM generates `tool_calls`, GHOST/OS executes them locally (or via web requests for search) and appends the `tool` message results back into the conversation array. It continues this loop up to 6 times before resolving the final user output. All tools are run in parallel for maximum speed.

---

## 4. Tools Reference

### `web_search`
Uses Wikipedia API extracts wrapper for fast, factual results.

### `save_note` / `read_note` / `list_notes` / `delete_note`
Backed by `localStorage`. Notes survive browser reloads permanently unless cleared.

### `run_js`
Executes JavaScript securely inside a hidden, cross-origin-like `iframe` sandbox using `postMessage` isolation to avoid exposing the main DOM or `fetch` access to the AI.

### `get_datetime`
Returns current date, time, day of week, timezone. 

---

## 5. Session and Memory

| Storage | Contents | Lifetime |
|---|---|---|
| `sessionStorage` | Terminal lines, cmd history, conv history | Survives refresh. Wiped on tab close. The 10-prompt alpha limit resets securely on page refresh. |
| `localStorage` | Notes from `save_note` | Permanent until browser data cleared |

---

## 6. Built-in Commands

| Command | Description |
|---|---|
| `help` | Full command reference |
| `clear` | Wipe terminal output |
| `history` | Show command history |
| `whoami` | User info |
| `date` | Date, time, epoch, timezone |
| `sysinfo` | OS version, model, tools |
| `notes` | List all local note keys |
| `stats` | Show usage stats and tokens |
| `info` | Open the info/about modal |

---

## 7. Local Development

Requires Node.js.

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Create a `.env` file in the root directory and add your API keys:
   ```env
   GROQ_API_KEY=your_groq_key_here
   OPENROUTER_API_KEY=your_openrouter_key_here
   ```

3. **Start the server**:
   ```bash
   node server.js
   # Visit http://localhost:3000
   ```

---

## 8. Customisation Guide

### Add a new tool
Add a JSON schema object to `TOOL_SCHEMAS`. Next, expand the `execTool()` switch statement in `index.html` to handle your tool execution logic.

### Change colour scheme
Edit CSS variables at the top of the `<style>` block in `index.html`:
```css
:root {
  --green:    #b8ffa0;  /* default text */
  --amber:    #ffe066;  /* prompt */
  --cyan:     #44ffaa;  /* [DONE] */
  --red:      #ff5555;  /* errors */
  --blue:     #66aaff;  /* tool calls */
}
```

---

## 9. Limitations

| Issue | Notes |
|---|---|
| API Rate limits | Depending on your Groq and OpenRouter keys, high usage will trigger automatic 429 backoffs. GHOST/OS implements Round-Robin rotation against providers to help mitigate this. |
| Web Search Scope | Search currently maps to Wikipedia API, not a general search engine, so recent obscure events may not easily resolve. |
| Alpha 10-Prompt Limit | The terminal enforces a strict 10 prompt cap per browser tab session, however this safely resets upon refreshing the page. |

---

## License

MIT — fork it, deploy it, build on it.

---

*GHOST/OS v5.3 Alpha · Groq & OpenRouter Edition*
