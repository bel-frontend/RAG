![head](<https://firebasestorage.googleapis.com/v0/b/bel-frontend.appspot.com/o/L2hAtNuuC5aCjCiEgT0m0aY4x712%2Fb8992aaimage(3).jpg?alt=media&token=fa69b8b3-19be-4147-9583-843a5bdcffcb>)

# LangGraph for Beginners: A Complete Guide

> **What you'll learn:** How to build AI agent systems with LangGraph — from basic concepts to working code. We'll create an article-writing pipeline with multiple AI agents that collaborate, review each other's work, and iterate until the result is perfect.

---

## PART 1: Basic Concepts

### What is a Graph?

Before diving into LangGraph, it's essential to understand what a **graph** is in programming.

#### A Graph is a Data Structure

Imagine a subway map:

- **Stations** are the **nodes**
- **Lines between stations** are the **edges**

```
    Typical Graph:              Subway Map (Analogy):

        [A]                         [Victory Square]
         │                                 │
         ▼                                 ▼
        [B]───────►[C]              [October]───►[Kupala]
         │                                 │
         ▼                                 ▼
        [D]                         [Cultural Institute]
```

#### In LangGraph:

- **Nodes** are functions (agents) that perform tasks.
- **Edges** are rules indicating the order in which tasks are executed.

---

### Why is LangGraph Needed?

#### Problem: Traditional AI Programs are Linear

```
Typical Chain:

    Question → LLM → Answer

    or

    Question → Tool 1 → LLM → Tool 2 → Answer
```

This works for simple tasks, but what if:

- You need to **go back** and redo something?
- You need to **verify the result** and possibly repeat?
- You need **multiple agents** with different roles?

#### Solution: LangGraph Allows Creating Cycles

```
LangGraph (Graph):

                    ┌──────────────────────┐
                    │                      │
                    ▼                      │
    Question → [Researcher] → [Writer] → [Reviewer]
                                               │
                                               ▼
                                          Good? ───NO───► back to Writer
                                               │
                                              YES
                                               │
                                               ▼
                                           [Result]
```

---

### What is "state"?

#### State is the memory of the program.

Imagine you are writing an article with a team:

- The researcher gathered **materials** → needs to write them down somewhere.
- The writer created a **draft** → needs to pass it to the reviewer.
- The reviewer wrote **comments** → needs to return them to the writer.

**State** is like a "basket" where everyone puts their results and from which they take data.

```
┌─────────────────────────────────────────────────────────────┐
│                        STATE (Стан)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   topic: "What I Write"                                     │
│   research: "Materials from the Researcher"                 │
│   draft: "Draft from the Writer"                            │
│   review: "Comments from the Reviewer"                      │
│   finalArticle: "Final Article"                             │
│   messages: [history of all messages]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
              ▲               ▲               ▲
              │               │               │
         Researcher        Writer         Reviewer
      (reads and writes) (reads and writes) (reads and writes)
```

---

## PART 2: Annotation — How State is Created

### What is Annotation?

`Annotation` is a way of **describing the structure of a state**. It is like creating a form with fields.

#### Analogy: Survey

Imagine you are creating a survey:

```
┌─────────────────────────────────────────┐
│            EMPLOYEE SURVEY              │
├─────────────────────────────────────────┤
│ Name: ___________________               │
│ Age: _____                              │
│ Work Experience (years): _____          │
│ Skills List: ___, ___, ___              │
└─────────────────────────────────────────┘
```

In code, it looks like this:

```typescript
// ANALOGY: Creating a survey form
const Survey = {
    name: '', // Text field
    age: 0, // Number
    experience: 0, // Number
    skills: [], // List
};
```

#### In LangGraph: Annotation.Root

In LangGraph, state is created using `Annotation.Root()`. This is a special function that describes the structure of your data — what fields exist and how they should be updated.

```typescript
import { Annotation } from '@langchain/langgraph';

const ResearchState = Annotation.Root({
    // Each field is described through Annotation<Type>
    topic: Annotation<string>({...}),
    research: Annotation<string>({...}),
    draft: Annotation<string>({...}),
    // etc.
});
```

Each field inside `Annotation.Root` has two important properties: **reducer** (how to update the value) and **default** (initial value). We'll explore these next.

---

### What is a Reducer?

#### Problem: How to merge data?

What should you do when multiple agents write to the same field?

```
Agent 1 writes: topic = "Topic A"
Agent 2 writes: topic = "Topic B"

What should be in topic? "Topic A"? "Topic B"? "Topic A + Topic B"?
```

#### Solution: Reducer - a function that resolves

**Reducer** is a function that takes:

1. **Current value** (what is already there)
2. **New Value** (what comes in)

It returns: **result** (what to keep)

```typescript
reducer: (current, update) => result;
//         ▲         ▲           ▲
//         │         │           └── What will be kept
//         │         └── New value
//         └── Current value
```

#### Examples of Reducers:

##### 1. Reducer "REPLACE"

The new value completely replaces the old one.

```typescript
// Code:
reducer: (current, update) => update;

// Example:
// Current: "Theme A"
// New:     "Theme B"
// Result:   "Theme B"  ← new replaces old
```

**Analogy:** You overwrite a file — the new content replaces the old one.

```
file.txt
──────────────
Was:   "Old text"
        ▼ (overwrite)
Is:    "New text"
```

##### 2. Reducer "APPEND"

New elements are added to the existing ones.

```typescript
// Code:
reducer: (current, update) => [...current, ...update];

// Example:
// Current: ["Message 1", "Message 2"]
// New:     ["Message 3"]
// Result:   ["Message 1", "Message 2", "Message 3"]
```

**Analogy:** You add new entries to a diary — the old ones remain.

```
diary.txt
──────────────
Was:    "Monday: did A"
        "Tuesday: did B"
             ▼ (adding)
Became: "Monday: did A"
        "Tuesday: did B"
        "Wednesday: did C" ← added
```

#### Full example of the state:

```typescript
const ResearchState = Annotation.Root({
    // ═══════════════════════════════════════════════════════
    // FIELD: messages (messages)
    // ═══════════════════════════════════════════════════════
    messages: Annotation<BaseMessage[]>({
        // REDUCER: Add new messages to existing ones
        reducer: (current, update) => [...current, ...update],
        // DEFAULT: Initial value — empty array
        default: () => [],
    }),
    //
    // How it works:
    // 1. Beginning:    messages = []
    // 2. Researcher:  messages = [] + [AIMessage] = [AIMessage]
    // 3. Writer: messages = [AIMessage] + [AIMessage] = [AIMessage, AIMessage]
    // 4. And so on — all messages are stored

    // ═══════════════════════════════════════════════════════
    // FIELD: topic (topic)
    // ═══════════════════════════════════════════════════════
    topic: Annotation<string>({
        // REDUCER: Replace old value with new one
        reducer: (_, update) => update, // "_" means "ignore"
        default: () => '',
    }),
    //
    // How it works:
    // 1. Beginning:    topic = ""
    // 2. User:   topic = "" → "LangChain"
    // If someone else writes in topic — the old value will disappear

    // ═══════════════════════════════════════════════════════
    // FIELD: iterationCount (iteration counter)
    // ═══════════════════════════════════════════════════════
    iterationCount: Annotation<number>({
        reducer: (_, update) => update, // Simply replace
        default: () => 0, // Start from 0
    }),
    //
    // The writer writes each time: iterationCount: state.iterationCount + 1
    // 1. Start:         iterationCount = 0
    // 2. Writer (1):   iterationCount = 0 + 1 = 1
    // 3. Writer (2):   iterationCount = 1 + 1 = 2
    // 4. Writer (3): iterationCount = 2 + 1 = 3
});
```

#### Visualization of Reducers:

```
┌─────────────────────────────────────────────────────────────────┐
│                       REDUCER: REPLACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Current: █████████████  "Old text"                            │
│                  ▼                                              │
│   New:     ░░░░░░░░░░░░░  "New text"                            │
│                  ▼                                              │
│   Result:  ░░░░░░░░░░░░░  "New text" ← only new                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         REDUCER: ADD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Current:  [█] [█] [█]      ← three elements                   │
│                  +                                              │
│   New:      [░] [░]          ← two new                          │
│                  =                                              │
│   Result:   [█] [█] [█] [░] [░]  ← all together                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### What is default?

`default` is a function that returns the **initial value** of a field.

```typescript
default: () => value
```

#### Why a function and not just a value?

This is a common JavaScript pitfall. If you use a plain object or array as default, all instances will share the same reference — changes in one place will affect all others!

```typescript
// POOR: If this is an object or array
default: []  // All instances will refer to the same array!

// GOOD: The function creates a new array each time
default: () => []  // Each instance will get its own array
```

#### Examples:

```typescript
// For a string
default: () => ''        // Empty string

// For a number
default: () => 0         // Zero

// For an array
default: () => []        // Empty array

// For an object
default: () => ({})      // Empty object

// For boolean
default: () => false     // false
```

---

## PART 3: Nodes — Agents

### What is a node?

**Node** is a function that:

1. **Receives** the full state
2. **Performs** some work (for example, calls LLM)
3. **Returns** a partial state update

#### Analogy: Worker on the Assembly Line

```
┌─────────────────────────────────────────────────────────────┐
│                       ASSEMBLY LINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Box] ──► [Worker 1] ───────► [Worker 2] ──────►          │
│                  │                    │                     │
│                  ▼                    ▼                     │
│            Adds part A          Adds part B                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Each worker:
1. Sees what has already been done (state)
2. Does their part of the work
3. Passes it on with additions
```

#### Node Structure in Code:

```typescript
async function myNode(
    state: ResearchStateType // ← INPUT: Full state
): Promise<Partial<ResearchStateType>> {
    // ← OUTPUT: Partial update
    // 1. Read data from state
    const data = state.someField;

    // 2. Do the work
    const result = await doSomething(data);

    // 3. Returning the update (only what has changed)
    return {
        someField: result,
    };
}
```

#### Important: Partial<State>

A node doesn't need to return the entire state — only the fields that changed. LangGraph will merge your partial update with the existing state using the reducers you defined.

```typescript
// The full state has 6 fields:
state = {
    topic: "...",
    research: "...",
    draft: "...",
    review: "...",
    finalArticle: "...",
    messages: [...],
    iterationCount: 0
}

// But the node can only return what it has changed:
return {
    draft: "New draft",           // Changed
    messages: [new AIMessage("...")], // Added
    // The other fields are not mentioned — they will remain as they were
}
```

---

### Our nodes in detail

Now let's look at the four nodes in our article-writing system. Each node has a specific role and passes its results to the next one through the shared state.

#### Node 1: Researcher (researcherNode)

The researcher is the first agent in our pipeline. It takes the topic and generates research materials that will be used by the writer.

```typescript
async function researcherNode(
    state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
    // ┌─────────────────────────────────────────────────────────────┐
    // │ STEP 1: Get the topic for research                         │
    // └─────────────────────────────────────────────────────────────┘
    const topic =
        state.topic ||
        String(state.messages[state.messages.length - 1]?.content) ||
        '';
    //            ▲               ▲
    //            │               └── Or the last message
    //            └── First, try to take topic

    // ┌─────────────────────────────────────────────────────────────┐
    // │ STEP 2: Form the prompt for LLM                            │
    // └─────────────────────────────────────────────────────────────┘
    const prompt = `You are an expert researcher. Your task is to gather key information.
    Topic: ${topic}
    Conduct a brief research...`;

    // ┌─────────────────────────────────────────────────────────────┐
    // │ STEP 3: Call LLM                                           │
    // └─────────────────────────────────────────────────────────────┘
    const response = await model.invoke([
        { role: 'system', content: prompt }, // Instructions for AI
        { role: 'user', content: `Research the topic: ${topic}` }, // Request
    ]);

    const research = String(response.content); // Result from LLM

    // ┌─────────────────────────────────────────────────────────────┐
    // │ STEP 4: Return state update                                │
    // └─────────────────────────────────────────────────────────────┘
    return {
        research, // Store the research result
        messages: [
            new AIMessage({
                content: `[Research completed]
${research}`,
            }),
        ],
        // ▲ Add a message to the history
    };
}
```

**What happens:**

```
INPUT (state):                       OUTPUT (update):
┌─────────────────────┐              ┌─────────────────────┐
│ topic: "LangChain"  │              │ research: "LangCh.. │
│ research: ""        │  ──────►     │ messages: [+1 msg]  │
│ draft: ""           │              └─────────────────────┘
│ messages: [1 msg]   │
└─────────────────────┘
                                     ▼ After merging:

                                ┌─────────────────────┐
                                │ topic: "LangChain"  │
                                │ research: "LangCh...│ ← updated
                                │ draft: ""           │
                                │ messages: [2 msgs]  │ ← added
                                └─────────────────────┘
```

---

#### Node 2: Writer (writerNode)

The writer takes the research and creates an article draft. If this is a revision (after reviewer feedback), it also considers the review comments. Notice how `iterationCount` helps us track how many times the article has been rewritten.

```typescript
async function writerNode(
    state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
    // ┌─────────────────────────────────────────────────────────────┐
    // │ STEP 1: Read the research and possible review              │
    // └─────────────────────────────────────────────────────────────┘
    const prompt = `You are a technical writer. Based on the research, write an article.

Research:
${state.research}

${state.review ? `Previous review (consider comments): ${state.review}` : ''}
`;

    // ┌─────────────────────────────────────────────────────────────┐
    // │ STEP 2: Call LLM                                           │
    // └─────────────────────────────────────────────────────────────┘
    const response = await model.invoke([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Write an article based on the research' },
    ]);

    const draft = String(response.content);

    // ┌─────────────────────────────────────────────────────────────┐
    // │ STEP 3: Return the update                                  │
    // └─────────────────────────────────────────────────────────────┘
    return {
        draft, // Draft of the article
        iterationCount: state.iterationCount + 1, // Increment the counter
        messages: [
            new AIMessage({ content: `[Draft ${state.iterationCount + 1}]` }),
        ],
    };
}
```

**What happens on repeat call:**

```
FIRST CALL:                          SECOND CALL (after review):
┌─────────────────────┐              ┌─────────────────────┐
│ research: "..."     │              │ research: "..."     │
│ review: ""          │              │ review: "Refine..." │ ← there are comments!
│ iterationCount: 0   │              │ iterationCount: 1   │
└─────────────────────┘              └─────────────────────┘
         │                                    │
         ▼                                    ▼
Writing without comments             Considering comments
         │                                    │
         ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│ draft: "Version 1"  │              │ draft: "Version 2"  │
│ iterationCount: 1   │              │ iterationCount: 2   │
└─────────────────────┘              └─────────────────────┘
```

---

#### Node 3: Reviewer (reviewerNode)

The reviewer evaluates the draft and decides if it's ready for publication. The key here is the output: if the review contains "APPROVED", the article moves to finalization. Otherwise, it goes back to the writer for improvements. This is what enables the **cycle** in our graph.

```typescript
async function reviewerNode(state: ResearchStateType): Promise<Partial<ResearchStateType>> {

    // ┌─────────────────────────────────────────────────────────────┐
    // │ STEP 1: Formulating the review request                      │
    // └─────────────────────────────────────────────────────────────┘
    const prompt = `You are a strict editor. Evaluate the article.

Article:
${state.draft}

Evaluate based on the criteria:
1. Accuracy of information
2. Structure and logic
3. Language quality
4. Completeness of the topic coverage

If the article is good - say "APPROVED". When improvements are needed, please provide specific recommendations.
`;

    // ┌─────────────────────────────────────────────────────────────┐
    // │ STEP 2: Get the review                                     │
    // └─────────────────────────────────────────────────────────────┘
    const response = await model.invoke([...]);
    const review = String(response.content);

    // ┌─────────────────────────────────────────────────────────────┐
    // │ STEP 3: Return the review                                  │
    // └─────────────────────────────────────────────────────────────┘
    return {
        review,  // Review (either "APPROVED" or comments)
        messages: [new AIMessage({ content: `[Review]\n${review}` })],
    };
}
```

**Two possible outcomes:**

```
OPTION A: The article is good             OPTION B: Needs improvement
┌───────────────────────────┐             ┌───────────────────────────┐
│ review: "APPROVED.        │             │ review: "Improve:         │
│ The article is excellent!"│             │ 1. Add examples           │
│                           │             │ 2. Clarify the terms"     │
└───────────────────────────┘             └───────────────────────────┘
             │                                        │
             ▼                                        ▼
        Moving to                              Returning to
        finalizer                                 writer
```

---

#### Node 4: Finalizer (finalizerNode)

The finalizer is the simplest node — it just copies the approved draft to the `finalArticle` field, marking the end of our workflow. This is called when the reviewer approves the article.

```typescript
async function finalizerNode(
    state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
    // Simple node — copies the draft to the final article
    return {
        finalArticle: state.draft, // Final article
        messages: [new AIMessage({ content: `[READY]\n\n${state.draft}` })],
    };
}
```

**What happens:**

```
INPUT:                              OUTPUT:
┌─────────────────────┐             ┌─────────────────────┐
│ draft: "Ready..."   │  ──────►    │ finalArticle:       │
│ finalArticle: ""    │             │   "Ready..."        │
└─────────────────────┘             └─────────────────────┘
```

---

## PART 4: Edges

### What is an edge?

**Edge** is a rule that states: "After this node, the following node is executed."

#### Analogy: Arrows on the Diagram

```
Recipe steps:

    [Make dough] ────► [Add sauce] ────► [Add cheese] ────► [Bake]
          │                  │                  │               │
          ▼                  ▼                  ▼               ▼
      TRANSITION         TRANSITION        TRANSITION         END
```

#### Two Types of Transitions in LangGraph:

##### 1. Simple Transitions (addEdge)

**Always** go to the same node.

```typescript
workflow.addEdge('researcher', 'writer');
//                    ▲            ▲
//                    │            └── Where are we going
//                    └── From where are we coming

// Meaning: After researcher, we ALWAYS go to writer
```

**Visualization:**

```
    [researcher] ───────────────► [writer]
                   (always)
```

##### 2. Conditional Transitions (addConditionalEdges)

The choice of the next node **depends on the state**.

```typescript
workflow.addConditionalEdges(
    'reviewer', // Source node
    shouldContinue, // Function that decides where to go
    {
        writer: 'writer', // If the function returns 'writer' → go to writer
        finalizer: 'finalizer', // If the function returns 'finalizer' → go to finalizer
    }
);
```

**Visualization:**

```
                            ┌──────────► [writer]
                            │
    [reviewer] ─────► [?] ──┤
                            │
                            └──────────► [finalizer]

    The function shouldContinue decides which arrow to take.
```

---

### Detailed Function shouldContinue

This is the "brain" of our conditional edge. It examines the current state and decides where to go next. The function must return a string that matches one of the keys in the mapping object we defined in `addConditionalEdges`.

```typescript
function shouldContinue(state: ResearchStateType): 'writer' | 'finalizer' {
    //                                              ▲
    //                                              └── Returns one of these strings

    const review = state.review.toLowerCase();
    const maxIterations = 3;

    // ═══════════════════════════════════════════════════════════════
    // CONDITION 1: Reviewer said "APPROVED"
    // ═══════════════════════════════════════════════════════════════
    if (review.includes('зацверджана') || review.includes('approved')) {
        console.log('Article approved');
        return 'finalizer'; // ← Proceed to finalize
    }

    // ═══════════════════════════════════════════════════════════════
    // CONDITION 2: Too many attempts (protection against infinite loop)
    // ═══════════════════════════════════════════════════════════════
    if (state.iterationCount >= maxIterations) {
        console.log('Maximum iterations reached');
        return 'finalizer'; // ← Force finalize
    }

    // ═══════════════════════════════════════════════════════════════
    // OTHERWISE: Needs revision
    // ═══════════════════════════════════════════════════════════════
    console.log('Revision needed');
    return 'writer'; // ← Go back to writer
}
```

#### Decision flowchart:

```
                         ┌───────────────────┐
                         │  shouldContinue   │
                         │    (function)     │
                         └─────────┬─────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │   Is "approved" present      │
                    │   in the review?             │
                    └──────────────┬───────────────┘
                                   │
                      ┌────────────┴────────────┐
                      │                         │
                     YES                       NO
                      │                         │
                      ▼                         ▼
               ┌────────────┐      ┌──────────────────────────┐
               │  return    │      │ Is iterationCount >= 3?  │
               │'finalizer' │      └──────────────┬───────────┘
               │            │                     │
               └────────────┘        ┌────────────┴────────────┐
                                     │                         │
                                    YES                       NO
                                     │                         │
                                     ▼                         ▼
                              ┌────────────┐            ┌────────────┐
                              │  return    │            │  return    │
                              │'finalizer' │            │  'writer'  │
                              │            │            │            │
                              └────────────┘            └────────────┘
```

---

### How the graph is built

Now let's put everything together! Building a graph in LangGraph follows a simple pattern: create the graph, add nodes, connect them with edges, and compile.

#### Sequence of creation:

```typescript
// ═══════════════════════════════════════════════════════════════
// STEP 1: Create StateGraph with our state
// ═══════════════════════════════════════════════════════════════
const workflow = new StateGraph(ResearchState)

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Add nodes (register functions)
    // ═══════════════════════════════════════════════════════════
    .addNode('researcher', researcherNode) // Name 'researcher' → function
    .addNode('writer', writerNode) // Name 'writer' → function
    .addNode('reviewer', reviewerNode) // Name 'reviewer' → function
    .addNode('finalizer', finalizerNode) // Name 'finalizer' → function

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Add simple transitions
    // ═══════════════════════════════════════════════════════════
    .addEdge('__start__', 'researcher') // Start → Researcher
    .addEdge('researcher', 'writer') // Researcher → Writer
    .addEdge('writer', 'reviewer') // Writer → Reviewer

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Add conditional transition
    // ═══════════════════════════════════════════════════════════
    .addConditionalEdges('reviewer', shouldContinue, {
        writer: 'writer', // If 'writer' → back to writer
        finalizer: 'finalizer', // If 'finalizer' → to finalizer
    })

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Add final transition
    // ═══════════════════════════════════════════════════════════
    .addEdge('finalizer', '__end__'); // Finalizer → End
```

#### Special nodes:

```
┌───────────────┬─────────────────────────────────────────────┐
│  '__start__'  │  Virtual start node                         │
│               │  LangGraph automatically starts from it     │
├───────────────┼─────────────────────────────────────────────┤
│  '__end__'    │  Virtual end node                           │
│               │  When reached — the graph is completed      │
└───────────────┴─────────────────────────────────────────────┘
```

---

## PART 5: Compilation and execution

We've defined our state, nodes, and edges. Now it's time to turn this blueprint into a running application!

### What is compile()?

`compile()` is the process of transforming a **graph description** into an **executable program**. Until you call `compile()`, you just have a description of what you want to build — not an actual runnable system.

```typescript
// Graph description (blueprint)
const workflow = new StateGraph(ResearchState)
    .addNode(...)
    .addEdge(...);

// Compilation into an executable program
const app = workflow.compile();
//    ▲
//    └── Now this can be run!
```

#### Analogy: Recipe vs. Finished Dish

```
workflow (description)                 app (compiled program)
──────────────────────                 ──────────────────────
Recipe on paper                        Ready pizza
   - How to make the dough                (can be eaten)
   - What to add
   - How to bake

Cannot be eaten!                       Can be eaten!
```

---

### Checkpointer (MemorySaver)

#### What is it?

**Checkpointer** is a mechanism for **saving state** after each step.

```typescript
import { MemorySaver } from '@langchain/langgraph';

const checkpointer = new MemorySaver();

const app = workflow.compile({
    checkpointer, // ← Adding checkpointer
});
```

#### Why is this needed?

```
WITHOUT CHECKPOINTER:
═════════════════════════════════════════════════════════════════

    Run 1:   START → researcher → writer → ... → END

    Run 2:   START → researcher → ... (everything from the beginning!)

    ✗ Cannot continue from the stopping point
    ✗ Cannot view history


WITH CHECKPOINTER:
═════════════════════════════════════════════════════════════════

    Run 1:   START → researcher → [SAVED]
                                      │
                               thread_id: "chat-123"

    Run 2:   [RESUMING] → writer → reviewer → ...
                     │
              thread_id: "chat-123"

    ✓ Can continue from the stopping point
    ✓ Can view history
    ✓ Can have multiple independent "conversations"
```

#### Thread ID — identifier of the "thread"

```typescript
const config = {
    configurable: {
        thread_id: 'article-1', // Unique ID for this "conversation"
    },
};

// Each thread_id is a separate story
// 'article-1' — about one article
// 'article-2' — about another article
// They do not overlap!
```

---

### Running the Graph

Finally! Let's run our graph. The `invoke()` function takes initial state values and configuration, then executes the entire graph from start to finish.

#### The invoke() Function

```typescript
const result = await app.invoke(
    // Initial data for the state
    {
        topic: 'Benefits of LangChain',
        messages: [new HumanMessage('Benefits of LangChain')],
    },
    // Configuration
    {
        configurable: {
            thread_id: 'article-1',
        },
    }
);
```

#### What Happens When `invoke()` is Called:

```
┌─────────────────────────────────────────────────────────────────┐
│                         invoke()                                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. INITIALIZATION OF STATE                                      │
│    state = {                                                    │
│        topic: "Advantages of LangChain",                        │
│        messages: [HumanMessage],                                │
│        research: "",  ← default                                 │
│        draft: "",     ← default                                 │
│        review: "",    ← default                                 │
│        finalArticle: "", ← default                              │
│        iterationCount: 0, ← default                             │
│    }                                                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. BEGINNING: __start__ → researcher                            │
│    Executing researcherNode(state)                              │
│    → Receiving update {research: "...", messages: [...]}        │
│    → Merging with state through reducers                        │
│    Saving checkpoint                                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. TRANSITION: researcher → writer                              │
│    Execute writerNode(state)                                    │
│    → Receive update {draft: "...", iterationCount: 1}           │
│    → Merge with state                                           │
│    Save checkpoint                                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. TRANSITION: writer → reviewer                                │
│    Execute reviewerNode(state)                                  │
│    → Receive update {review: "..."}                             │
│    → Merge with state                                           │
│    Save checkpoint                                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. CONDITIONAL TRANSITION: shouldContinue(state)                │
│    → Returns 'writer' or 'finalizer'                            │
│    → If 'writer' — return to step 3                             │
│    → If 'finalizer' — proceed further                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │ (if 'finalizer')
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. TRANSITION: reviewer → finalizer                             │
│    Execute finalizerNode(state)                                 │
│    → Receive update {finalArticle: "..."}                       │
│    → Merge with state                                           │
│    Save checkpoint                                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. FINALIZER: finalizer → __end__                               │
│    The graph has completed                                      │
│    Returning the final state                                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                        return state (full)
```

---

## PART 6: FAQ — Frequently Asked Questions

### Why does the reducer add messages but replace the topic?

**Messages** represent history. We want to keep all messages throughout the process.

**Topic** is the current theme. When the topic changes, the old one is no longer needed.

### What happens if I don’t specify a reducer?

LangGraph will use the default behavior — **replacement** (like for the topic).

### Why is iterationCount needed?

To **protect against infinite loops**. If the reviewer never says "approved", the program will keep cycling between the writer and the reviewer.

### Can one node directly invoke another?

**No.** Nodes do not know about each other. They only read/write state. LangGraph determines who executes next based on transitions.

### What are **start** and **end**?

These are **special virtual nodes**:

- `__start__` — where the graph begins
- `__end__` — where the graph ends

They do not execute code — they only mark the boundaries.

### Can there be multiple end nodes?

Yes! For example:

```typescript
.addEdge('success', '__end__')
.addEdge('error', '__end__')
```

---

## Conclusion

Congratulations! You've learned the core concepts of LangGraph. Let's recap what we covered:

| Concept                 | What it does                                         |
| ----------------------- | ---------------------------------------------------- |
| **State + Annotation**  | Defines the data structure passed between agents     |
| **Reducer**             | Specifies how to combine new data with existing data |
| **Nodes** (Agents)      | Functions that process the state                     |
| **Edges** (Transitions) | Rules determining the order of operations            |
| **Conditional Edges**   | Dynamic selection of the next node                   |
| **Checkpointer**        | Saves the state for continuation later               |

### What's Next?

Now that you understand the basics, you can:

1. **Build your own agent system** — Start with a simple two-node graph and gradually add complexity
2. **Experiment with different flows** — Try creating graphs with multiple conditional branches
3. **Add persistence** — Use `MemorySaver` or database-backed checkpointers for production
4. **Explore advanced features** — Look into subgraphs, parallel execution, and human-in-the-loop patterns

### Key Takeaways

- **Think in graphs**: Break down your AI workflow into discrete steps (nodes) connected by rules (edges)
- **State is everything**: All communication between nodes happens through the shared state
- **Reducers matter**: Choose the right reducer for each field — append for history, replace for current values
- **Cycles enable iteration**: Unlike simple chains, graphs can loop back for refinement

The article-writing example we built demonstrates a real-world pattern: **research → write → review → (repeat if needed) → finalize**. This same pattern applies to many AI applications: code review, content moderation, multi-step reasoning, and more.

Happy building! 🚀
