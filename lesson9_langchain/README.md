# Lesson 9: LangChain v1 - Прыклады

Гэтая тэчка змяшчае практычныя прыклады выкарыстання LangChain v1 і LangGraph.

## 📁 Структура

```
lesson9_langchain/
├── index.ts                    # Базавы прыклад агента
├── langgraph-example.ts        # Мульты-агентная сістэма з LangGraph
├── structured-output-example.ts # Структураваны вывад з Zod
├── article.md                  # Артыкул пра LangChain v1 (EN)
├── article_be.md               # Артыкул пра LangChain v1 (BE)
└── README.md                   # Гэты файл
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

### 1. Базавы агент (`index.ts`)

Просты агент з інструментамі:
- 🌤️ Надвор'е (wttr.in API)
- 📚 Беларускія прыказкі
- 🧮 Калькулятар
- 📅 Дата і час

```typescript
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { tool } from '@langchain/core/tools';
import { chatModel, Model } from '../common/model';

const model = await chatModel(Model.GPT4o_MINI);

const agent = createReactAgent({
    llm: model as any,
    tools: [weatherTool, proverbsTool],
    messageModifier: new SystemMessage(systemPrompt),
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

## 🔑 Асноўныя канцэпцыі

### createReactAgent

```typescript
import { createReactAgent } from '@langchain/langgraph/prebuilt';

const agent = createReactAgent({
    llm: model,
    tools: [tool1, tool2],
    messageModifier: new SystemMessage('...'),
});
```

### tool()

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const myTool = tool(
    async ({ param }) => {
        return 'result';
    },
    {
        name: 'my_tool',
        description: 'Апісанне інструмента',
        schema: z.object({
            param: z.string().describe('Апісанне параметра'),
        }),
    }
);
```

### StateGraph (LangGraph)

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
| `langchain` | 1.x | Асноўная бібліятэка |
| `@langchain/langgraph` | 1.x | Графы для складаных працоўных працэсаў |
| `@langchain/openai` | 1.x | Інтэграцыя з OpenAI |
| `@langchain/core` | 1.x | Базавыя кампаненты |
| `zod` | 3.x | Валідацыя схем |

## 📖 Дадатковыя рэсурсы

- [LangChain JS Documentation](https://js.langchain.com/)
- [LangGraph JS Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangChain GitHub](https://github.com/langchain-ai/langchainjs)

## 🇧🇾 Пра артыкулы

- `article.md` - Поўны артыкул пра LangChain v1 на англійскай мове
- `article_be.md` - Поўны артыкул пра LangChain v1 на беларускай мове
