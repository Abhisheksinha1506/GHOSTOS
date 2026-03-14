# GHOST/OS — How It Demonstrates AI Agent Skills

## What Is an AI Agent?

A chatbot answers questions from memory.
An AI agent **takes actions**, observes the results, and decides what to do next.

```
Chatbot:   User → LLM → Answer
                        (one shot, memory only)

AI Agent:  User → LLM → Tool Call → Result
                    ↑                  ↓
                    └──── Loop until done ──┘
```

GHOST/OS demonstrates all the core AI agent skills using the **ReAct pattern**
(Reasoning + Acting) over Puter.js — a completely free AI platform.

---

## Skill 1 — Tool Selection

The agent receives a list of available tools and decides autonomously which
ones to use based on the user's intent. The user never needs to specify a tool.

**Example:**
```
User: what's happening in AI today
```

The agent sees tools: `web_search`, `save_note`, `run_js`, `get_datetime`.
It reasons: "current events → need web_search" and calls it — the user
never said "search the web."

**Demonstrated by:** Any news/current-events query. Watch the
`⚙ TOOL :: web_search(...)` line appear before the response.

**Why this matters:** Correct tool selection is the first gate of agent
capability. A bad agent calls the wrong tool or asks the user which to use.

---

## Skill 2 — Multi-Step Planning and Tool Chaining

The most impressive agent behaviour: chaining multiple tool calls to complete
a complex task without any human prompting between steps.

**Example:**
```
User: research the latest Claude updates and save a summary to my notes
```

The agent's autonomous plan:
```
Step 1 → [TOOL: web_search] {"query": "Claude AI latest updates 2025"}
         Receives search results

Step 2 → [TOOL: save_note] {"key": "claude-updates", "content": "[summary]"}
         Receives save confirmation

Step 3 → Returns: "I searched for the latest Claude updates and saved a summary
          under 'claude-updates'. Key points: ... [DONE]"
```

Three steps. Zero human intervention between them.

**Demonstrated by:** Any command that involves both research AND storage.

**Why this matters:** Single-tool agents are limited. Real-world tasks require
coordinating multiple tools in sequence — this is what separates agents from
simple tool-augmented chatbots.

---

## Skill 3 — ReAct Reasoning (Thinking Before Acting)

GHOST/OS uses the **ReAct pattern**: the model writes its reasoning _before_
each tool call. This reasoning appears in the terminal in dim italic text.

Example of what the model actually outputs (before parsing):

```
I need to find current information about this, so I'll search the web.
[TOOL: web_search] {"query": "bitcoin price today"}

Now I have the price. I'll also get the current date for context.
[TOOL: get_datetime] {}

With both pieces of information I can give a complete answer.
```

The reasoning text is shown as dimmed italic lines in the terminal.
The `[TOOL:]` lines are parsed, executed, and replaced with `⚙ TOOL ::` output.

**Why this matters:** Reasoning before acting (the "Re" in ReAct) reduces
errors and makes the agent's decision process transparent. You can actually
watch the agent think.

---

## Skill 4 — Grounding (Not Hallucinating When Uncertain)

The agent is instructed to use `web_search` for any query requiring current
or specific data, rather than inventing an answer from training memory.

**System prompt instruction:**
```
For ANY question about current events, news, weather, prices → use web_search
```

This is active grounding — the agent fetches real information instead of
fabricating it.

**Demonstrated by:**
```
search latest AI news today          → agent uses web_search
what is the price of gold right now  → agent uses web_search
calculate 15% of 4750                → agent uses run_js (not memory math)
```

**Why this matters:** Ungrounded agents hallucinate. Grounded agents fetch.
The difference is trustworthiness.

---

## Skill 5 — Hallucination Self-Detection

After every AI response, a **second parallel AI call** analyzes the output
for hallucinations. This is meta-cognition — the system auditing itself.

```javascript
// Fires after response, does NOT delay terminal output
checkHallucination(text).then(r => setHalBadge(r || null));
```

The detector uses a strict prompt that returns:
```json
{
  "hallucinated": true,
  "confidence": "high",
  "reason": "Claims specific 73% statistic with no cited source"
}
```

**Badge in top-right corner:**
- 🔴 RED  — hallucination likely detected, with reason
- 🟢 GREEN — response appears grounded
- ⚫ GREY  — detection running (async)

**What it catches:** Fabricated statistics, invented citations, made-up people
or companies, suspicious overconfidence about specific facts.

**What it ignores:** Code, math, labeled opinions, web search summaries.

**Why this matters:** No agent is perfect. A trust signal that tells the user
when to verify is a critical part of a responsible AI system. This turns
GHOST/OS from a "trust everything" chatbot into an audited agent.

---

## Skill 6 — Persistent External Memory

A raw LLM has no memory outside its context window. GHOST/OS gives the agent
permanent external memory through four note tools backed by Puter KV storage.

```
save_note  → write to permanent cloud storage
read_note  → retrieve by key
list_notes → discover all saved knowledge
delete_note→ remove outdated entries
```

Cross-session example:
```
Session 1 (Monday):
  User: save note project-brief = [detailed requirements]
  Agent: [TOOL: save_note] → Note saved. [DONE]

Session 2 (Thursday, new browser tab):
  User: what were the project requirements I saved?
  Agent: [TOOL: read_note] {"key": "project-brief"}
       → Returns the full requirements saved on Monday
```

**Why this matters:** Memory = continuity. An agent that forgets everything
each session is fundamentally limited. Persistent storage turns a session
assistant into a long-term knowledge partner.

---

## Skill 7 — Conversational Context Within a Session

The full conversation history is included in every API call:

```javascript
const messages = [
  { role: 'system',    content: AGENT_SYSTEM },
  ...convHistory,                              // everything said this session
  { role: 'user',      content: userMsg }
];
```

Combined with `sessionStorage` persistence (survives refresh), this creates
genuine multi-turn coherence:

```
Turn 1:  User: search quantum computing breakthroughs
         Agent: [searches] → gives 5 key results

Turn 6:  User: save the third one to my notes
         Agent: (remembers the third result from Turn 1)
              → [TOOL: save_note] with correct content
```

No re-explaining. No copy-pasting. The agent just knows.

**Why this matters:** Context retention is what separates a helpful
conversation partner from a stateless Q&A machine.

---

## Skill 8 — Code Generation and Execution

The `run_js` tool closes the loop between "generate code" and "run code" —
the agent writes JavaScript to solve a problem and executes it immediately.

**Example:**
```
User: calculate compound interest on 50000 at 8.5% for 25 years
```

Agent generates and runs:
```javascript
return (() => {
  const P = 50000, r = 0.085, t = 25;
  const final = P * Math.pow(1 + r, t);
  return `Final: ₹${final.toFixed(2)} | Growth: ₹${(final - P).toFixed(2)}`;
})();
```

Returns: `Final: ₹387,099.37 | Growth: ₹337,099.37`

The agent didn't recall this formula from memory and guess — it **wrote and
ran correct code** and returned the precise result.

**Why this matters:** Executable code generation is qualitatively different from
text generation. It's the difference between "here's the formula" and "here's
the exact answer."

---

## The Full Agent Loop in Code

This is the core — the literal agentic loop implementation in GHOST/OS:

```javascript
async function runAgent(userMsg) {
  const messages = [...convHistory, { role: 'user', content: userMsg }];
  let currentMessages = [...messages];

  for (let i = 0; i < 8; i++) {          // max 8 iterations
    // Call the AI
    const response = await puter.ai.chat(
      [{ role: 'system', content: AGENT_SYSTEM }, ...currentMessages],
      { model: MODEL }
    );
    const text = extractText(response);

    // Parse [TOOL: name] {"args"} from the response
    const toolCalls = parseToolCalls(text);

    // No tool calls = agent is done
    if (toolCalls.length === 0) {
      convHistory = [...currentMessages, { role: 'assistant', content: text }];
      return cleanText(text);
    }

    // Show reasoning text (before first [TOOL:])
    showThinkingText(text);

    // Execute each tool, collect results
    let toolResultText = '';
    for (const tc of toolCalls) {
      showToolCall(tc.name, tc.args);             // ⚙ TOOL :: line
      const result = await execTool(tc.name, tc.args);
      toolResultText += `\nTOOL_RESULT: ${tc.name}\n${result}\n`;
    }

    // Feed results back — agent sees what happened
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: text },
      { role: 'user', content: `TOOL RESULTS:${toolResultText}\n\nContinue.` },
    ];
    // Loop — agent decides what to do next
  }

  return '[WARN] Agent hit max iterations.';
}
```

Every `⚙ TOOL ::` line you see in the terminal is one execution of `execTool()`
inside this loop — the agent acting in real time.

---

## Agent Skills Checklist

| Skill | GHOST/OS Implementation | Visible evidence |
|---|---|---|
| Tool selection | Agent picks correct tool from 7 options | `⚙ TOOL ::` lines |
| Multi-step planning | Up to 8 loop iterations per command | Multiple `⚙` lines |
| Tool chaining | search → save_note in one command | Yes |
| ReAct reasoning | Model thinks before each tool call | Dim italic text |
| Active grounding | web_search instead of hallucinating | GREEN HAL badge |
| Hallucination detection | Parallel meta-analysis of every response | HAL badge top-right |
| External memory | Notes via puter.kv survive sessions | `save_note` / `read_note` |
| Code generation + exec | `run_js` writes + runs correct code | Calculation results |
| Context retention | Full history every turn | Multi-turn coherence |
| Graceful degradation | Max iteration cap, error handling | `[WARN]` / `[ERROR]` |

---

## Quick Demo Script (for presentations)

Run these commands in order to showcase all agent skills live:

```bash
# 1. Tool selection (web search)
search latest news in AI today

# 2. Calculation (run_js)
calculate compound interest on 100000 at 7% for 30 years

# 3. Tool chaining (search + save)
research what is the ReAct agent pattern and save a summary as react-pattern

# 4. Persistent memory (read back what was saved)
read note react-pattern

# 5. Hallucination detection — trigger RED
tell me the exact market cap of every major AI company in Q3 2024

# 6. Hallucination detection — trigger GREEN
search who founded anthropic and when

# 7. Context retention (references earlier command)
now save that founders info to notes as anthropic-founders
```

Each command demonstrates a different agent skill.
The audience can see the `⚙ TOOL ::` lines, the HAL badge changing,
and the notes persisting — all in real time, in a terminal that costs nothing.
