# Lesson 9: LangChain v1 - Прыклады

Гэтая тэчка змяшчае практычныя прыклады выкарыстання **LangChain v1** і **LangGraph v1**.

## 📁 Структура

```
lesson9_langchain/
├── index.ts                       # Базавы прыклад агента (новы API v1)
├── langgraph-example.ts           # Мульты-агентная сістэма з LangGraph
├── structured-output-example.ts   # Структураваны вывад з Zod
├── article.md                     # Артыкул пра LangChain v1 (EN)
├── article_be.md                  # Артыкул пра LangChain v1 (BE)
├── LANGGRAPH_EXPLAINED.md         # Тэхнічнае тлумачэнне LangGraph
├── LANGGRAPH_FOR_BEGINNERS.md     # LangGraph для пачаткоўцаў
└── README.md                      # Гэты файл
```

## 🚀 Запуск

```bash
# Базавы агент
bun run index.ts

# LangGraph мульты-агентная сістэма
bun run langgraph-example.ts

# Структураваны вывад
bun run structured-output-example.ts
```

## ⚙️ Канфігурацыя

Прыклады выкарыстоўваюць `.env` файл з бацькоўскай тэчкі (`/RAG/.env`).

Неабходныя зменныя:
```env
OPENAI_API_KEY=sk-your-key-here
```

## 📖 Прыклады

### 1. Базавы агент (`index.ts`) — Новы API v1

Просты агент з інструментамі:
- 🌤️ Надвор'е (wttr.in API)
- 📚 Беларускія прыказкі
- 🧮 Калькулятар
- 📅 Дата і час

```typescript
// Новы API LangChain v1
import { createAgent, tool, HumanMessage } from 'langchain';
import { z } from 'zod';

// Мадэль можа быць радковым ідэнтыфікатарам
const modelName = 'openai:gpt-4o-mini';

const agent = createAgent({
    model: modelName,  // замест llm
    tools: [weatherTool, proverbsTool],
    systemPrompt: '...',  // замест messageModifier/prompt
});

const result = await agent.invoke({
    messages: [new HumanMessage('Якое надвор\'е ў Мінску?')],
});
```

### 2. LangGraph (`langgraph-example.ts`)

Мульты-агентная сістэма:
- 🔬 Даследчык - збірае інфармацыю
- ✍️ Пісьменнік - піша артыкул
- 📖 Рэцэнзент - правярае артыкул
- 🏁 Фіналізатар - завяршае працу

```typescript
import { StateGraph, Annotation, MemorySaver } from '@langchain/langgraph';

const workflow = new StateGraph(ResearchState)
    .addNode('researcher', researcherNode)
    .addNode('writer', writerNode)
    .addNode('reviewer', reviewerNode)
    .addConditionalEdges('reviewer', shouldContinue);

const app = workflow.compile({ checkpointer: new MemorySaver() });
```

**Падрабязная дакументацыя:**
- `LANGGRAPH_EXPLAINED.md` — тэхнічнае тлумачэнне
- `LANGGRAPH_FOR_BEGINNERS.md` — для пачаткоўцаў

### 3. Структураваны вывад (`structured-output-example.ts`)

Гарантаваны фармат адказаў з Zod:
- 📊 Аналіз настрою
- 🛒 Рэкамендацыі прадуктаў
- 📋 Планы праектаў

```typescript
import { z } from 'zod';

const SentimentSchema = z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number().min(0).max(1),
    emotions: z.array(z.object({
        emotion: z.string(),
        intensity: z.number(),
    })),
});

const structuredModel = model.withStructuredOutput(SentimentSchema);
const result = await structuredModel.invoke(messages);
```

## 🔑 Ключавыя змены ў LangChain v1

### Стары API → Новы API

| Стары (v0) | Новы (v1) |
|------------|-----------|
| `createReactAgent` з `@langchain/langgraph/prebuilt` | `createAgent` з `langchain` |
| `tool` з `@langchain/core/tools` | `tool` з `langchain` |
| `llm: model` | `model: "openai:gpt-4o-mini"` |
| `prompt` / `messageModifier` | `systemPrompt` |
| Streaming: node name `"agent"` | Streaming: node name `"model"` |

### createAgent (v1)

```typescript
import { createAgent, tool } from 'langchain';
import { z } from 'zod';

const myTool = tool(
    async ({ param }) => 'result',
    {
        name: 'my_tool',
        description: 'Апісанне інструмента',
        schema: z.object({
            param: z.string().describe('Апісанне параметра'),
        }),
    }
);

const agent = createAgent({
    model: 'openai:gpt-4o-mini',  // радковы ідэнтыфікатар
    tools: [myTool],
    systemPrompt: 'Ты карысны асістэнт.',
});
```

### StateGraph (LangGraph) — без зменаў

```typescript
import { StateGraph, Annotation } from '@langchain/langgraph';

const State = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (curr, update) => [...curr, ...update],
    }),
});

const workflow = new StateGraph(State)
    .addNode('agent', agentNode)
    .addEdge('__start__', 'agent')
    .addConditionalEdges('agent', shouldContinue);

const app = workflow.compile();
```

## 📚 Выкарыстаныя пакеты

| Пакет | Версія | Апісанне |
|-------|--------|----------|
| `langchain` | 1.x | Асноўная бібліятэка (createAgent, tool) |
| `@langchain/langgraph` | 1.x | Графы для складаных працоўных працэсаў |
| `@langchain/openai` | 1.x | Інтэграцыя з OpenAI |
| `@langchain/core` | 1.x | Базавыя кампаненты |
| `zod` | 3.x | Валідацыя схем |

## 📖 Дадатковыя рэсурсы

- [LangChain v1 Migration Guide](https://docs.langchain.com/oss/javascript/migrate/langchain-v1)
- [LangGraph v1 Migration Guide](https://docs.langchain.com/oss/javascript/migrate/langgraph-v1)
- [LangChain JS Documentation](https://docs.langchain.com/oss/javascript/langchain/overview)
- [LangGraph JS Documentation](https://docs.langchain.com/oss/javascript/langgraph/overview)

## 🇧🇾 Пра артыкулы

- `article.md` - Поўны артыкул пра LangChain v1 на англійскай мове
- `article_be.md` - Поўны артыкул пра LangChain v1 на беларускай мове
