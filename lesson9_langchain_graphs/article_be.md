# LangChain v1: Стварэнне прадакшн-гатовых AI-праграм стала простым

LangChain v1 уяўляе сабой фундаментальны зрух у тым, як распрацоўшчыкі ствараюць AI-праграмы. Выходзячы за межы эксперыментальных прататыпаў, гэты рэліз забяспечвае аптымізаваны, гатовы да прадакшна фрэймворк, спецыяльна распрацаваны для стварэння складаных AI-агентаў, якія могуць спраўляцца з рэальнымі задачамі.

**Заўвага: У гэтым артыкуле выкарыстоўваюцца прыклады на TypeScript.** LangChain v1 цалкам падтрымліваецца ў TypeScript з натыўнай бяспекай тыпаў, што робіць яго ідэальным для сучасных вэб-праграм, бэкендаў на Node.js і платформаў edge-вылічэнняў, такіх як Vercel, Cloudflare Workers і Deno.

## Чаму LangChain v1 змяняе ўсё для распрацоўшчыкаў AI

Новая версія засяроджваецца на адным крытычна важным разуменні: стварэнне выдатных AI-праграм — гэта не толькі падключэнне да моўных мадэляў, але і аркестрацыя складаных працоўных працэсаў, разумнае кіраванне кантэкстам і стварэнне сістэм, якія з'яўляюцца надзейнымі, наладжвальнымі і падтрымліваемымі.

## Стварэнне вашага першага агента за лічаныя хвіліны

Стварэнне AI-агента цяпер надзвычай простае з `createAgent`. Гэтая адзіная функцыя замяняе складаныя працэдуры наладкі, адначасова даючы вам доступ да магутнай кастамізацыі:

```typescript
import * as z from "zod";
import { createAgent, tool } from "langchain";

// Вызначце свае ўласныя інструменты з поўнай бяспекай тыпаў
const searchDatabase = tool(
  async ({ query }: { query: string }) => {
    // Ваша логіка тут
    const results = await database.search(query);
    return results;
  },
  {
    name: "search_database",
    description: "Пошук у базе даных вашай кампаніі",
    schema: z.object({
      query: z.string().describe("Пошукавы запыт"),
    }),
  }
);

// Стварыце агента адной канфігурацыяй
const agent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: [searchDatabase],
});

// Запусціце яго з поўнай бяспекай тыпаў
const result = await agent.invoke({
  messages: [{ role: "user", content: "Знайдзі даныя аб продажах за Q3" }],
});
```

Гэтая прастата не ахвяруе магутнасцю — пад капотам вы атрымліваеце надзейную архітэктуру LangGraph для стварэння stateful агентаў, якія працуюць працяглы час. А з TypeScript вы атрымліваеце праверку тыпаў падчас кампіляцыі для вашых інструментаў, схем і адказаў агента.

## Middleware: Узмацніце вашы AI-праграмы

Самая рэвалюцыйная функцыя ў v1 — гэта middleware. Уявіце middleware як перахопнікі, якія дазваляюць вам кантраляваць, што адбываецца на кожным этапе выканання вашага агента. Гэта адкрывае цалкам новыя катэгорыі праграм:

### Прыклады рэальных праграм

**1. Агент абслугоўвання кліентаў з прыярытэтам прыватнасці**
```typescript
import { createAgent } from "langchain";
import { PIIMiddleware } from "langchain/middleware";

const agent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: [customerDatabase, orderSystem],
  middleware: [new PIIMiddleware()], // Аўтаматычна рэдагуе канфідэнцыйныя даныя
});
```
Ваш агент цяпер можа апрацоўваць запыты кліентаў, аўтаматычна абараняючы нумары крэдытных карт, нумары сацыяльнага страхавання і іншую канфідэнцыйную інфармацыю — ідэальна для адпаведнасці GDPR і CCPA.

**2. Даследчы асістэнт з аптымізацыяй кошту**
```typescript
import { SummarizationMiddleware } from "langchain/middleware";

const agent = createAgent({
  model: "gpt-4",
  tools: [webSearch, documentReader],
  middleware: [new SummarizationMiddleware({ maxTokens: 2000 })],
});
```
Агент аўтаматычна сціскае доўгія гісторыі размоў, значна зніжаючы выдаткі на API для праграм з працяглымі сесіямі.

**3. Кантраляваны AI-працоўны працэс**
```typescript
import { HumanInTheLoopMiddleware } from "langchain/middleware";

const agent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: [sendEmail, updateDatabase, makePayment],
  middleware: [
    new HumanInTheLoopMiddleware({
      requireApproval: ["makePayment"],
    }),
  ],
});
```
Ідэальна для фінансавых праграм або адчувальных аперацый — агент спыняецца і запытвае чалавечае зацвярджэнне перад выкананнем крытычных дзеянняў.

### Карыстальніцкі Middleware для вашых унікальных патрэб

Акрамя гатовых варыянтаў, вы можаце ствараць карыстальніцкі middleware для даменна-спецыфічных патрабаванняў:

```typescript
import { AgentMiddleware } from "langchain/middleware";
import { SystemMessage } from "langchain/messages";

class DynamicContextMiddleware extends AgentMiddleware {
  async beforeModel(state: AgentState, config: RunnableConfig) {
    // Уводзім рэлевантны кантэкст на аснове бягучай задачы карыстальніка
    const userContext = await fetchUserContext(state.userId);
    state.messages.unshift(
      new SystemMessage({ content: userContext })
    );
    return state;
  }
}
```

Гэта дазваляе ствараць праграмы накшталт:
- **Персаналізаваныя AI-асістэнты**, якія адаптуюцца да пераваг і гісторыі кожнага карыстальніка
- **Агенты дынамічнага цэнаўтварэння**, якія карэктуюць рэкамендацыі на аснове рынкавых даных у рэальным часе
- **Сістэмы, якія ўлічваюць адпаведнасць патрабаванням**, якія забяспечваюць выкананне бізнес-правілаў у кожнай кропцы прыняцця рашэнняў

## Стварэнне праграм, якія працуюць з рознымі AI-правайдэрамі

Новы стандарт `contentBlocks` — гэта пераломны момант для мульты-правайдэрных праграм. Раней кожны AI-правайдэр меў свой уласны спосаб апрацоўкі пашыраных функцый. Цяпер вы можаце стварыць адзін раз і запускаць дзе заўгодна:

```typescript
import { initChatModel } from "langchain";

const model = initChatModel("claude-sonnet-4-5-20250929");
const response = await model.invoke(messages);

// Працуе аднолькава з OpenAI, Anthropic, Google і г.д.
for (const block of response.contentBlocks) {
  if (block.type === "reasoning") {
    console.log(`Разважанні мадэлі: ${block.content}`);
  } else if (block.type === "citation") {
    console.log(`Крыніца: ${block.url}`);
  } else if (block.type === "code_execution") {
    console.log(`Выкананы код: ${block.code}`);
  }
}
```

**Ідэі праграм, якія гэта дазваляе:**
- Даследчыя платформы, якія цытуюць крыніцы аднастайна па розных AI-мадэлях
- Адукацыйныя інструменты, якія паказваюць студэнтам працэс разважанняў
- Асяроддзі распрацоўкі, якія бяспечна выконваюць код незалежна ад правайдэра
- Мульты-мадэльныя праграмы, якія аўтаматычна пераключаюцца без змен коду

## Убудаваныя функцыі, гатовыя да прадакшна

LangChain v1 уключае функцыі, неабходныя для рэальных праграм:

### Persistence для Stateful праграм
```typescript
import { MemorySaver } from "langchain/checkpointers";

// Ваш агент аўтаматычна захоўвае стан паміж сесіямі
const agent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: tools,
  checkpointer: new MemorySaver(), // Або PostgreSQL, Redis і г.д.
});

// Узнаўляйце размовы натуральна
await agent.invoke({
  messages: [{ role: "user", content: "Што мы абмяркоўвалі ўчора?" }],
});
```

**Ідэальна для:**
- Мульты-сесійных сістэм падтрымкі кліентаў
- Доўгатэрміновых даследчых праектаў
- Сумесных AI-асістэнтаў, якія памятаюць кантэкст

### Streaming для праграм у рэальным часе
```typescript
// Стрымінг вынікаў па меры іх паступлення
for await (const chunk of agent.stream({
  messages: [{ role: "user", content: "Прааналізуй гэтыя даныя" }],
})) {
  console.log(chunk); // Паказваем вынікі ў рэальным часе
}
```

**Ідэальна для:**
- Чат-інтэрфейсаў з жывымі адказамі
- Абнаўленняў прагрэсу для доўгіх задач
- Інтэрактыўнай адладкі і распрацоўкі

### Структураваны вывад без дадатковых выдаткаў
```typescript
import { z } from "zod";

// Вызначце вашу схему вываду
const ProductRecommendationSchema = z.object({
  productName: z.string(),
  price: z.number(),
  reasoning: z.string(),
});

const agent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: tools,
  outputSchema: ProductRecommendationSchema,
});

// Атрымайце цалкам тыпізаваныя, структураваныя адказы
const result = await agent.invoke({ messages });
// TypeScript ведае, што result адпавядае ProductRecommendationSchema!
```

Структураваны вывад цяпер адбываецца ў асноўным цыкле — без дадатковых API-выклікаў, зніжаныя выдаткі, хутчэйшыя адказы. Плюс TypeScript гарантуе, што вашы схемы адпавядаюць рэальным структурам даных падчас кампіляцыі.

## Шаблоны праграм: Што вы можаце стварыць

### 1. Інтэлектуальная бізнес-аўтаматызацыя
Камбінуйце некалькі слаёў middleware для стварэння агентаў, якія могуць:
- Атрымліваць даныя з некалькіх карпаратыўных сістэм
- Прымаць рашэнні на аснове бізнес-правілаў
- Запытваць зацвярджэнне для адчувальных дзеянняў
- Лагіраваць усе дзеянні для адпаведнасці патрабаванням
- Апрацоўваць памылкі элегантна з fallback-амі

### 2. Прасунутыя даследчыя платформы
Стварайце даследчых асістэнтаў, якія:
- Шукаюць праз правайдэраў (OpenAI для хуткасці, Claude для аналізу)
- Аўтаматычна цытуюць і адсочваюць крыніцы
- Рэзюмуюць доўгія ланцужкі даследаванняў
- Выконваюць код для праверкі гіпотэз
- Прадстаўляюць высновы ў структураваных фарматах

### 3. Персаналізаваныя AI-праграмы
Стварайце вопыты, якія:
- Адаптуюцца да індывідуальных пераваг карыстальнікаў з часам
- Захоўваюць кантэкст паміж сесіямі і прыладамі
- Забяспечваюць празрыстае абгрунтаванне рэкамендацый
- Абараняюць прыватнасць карыстальнікаў з рэдагаваннем PII
- Маштабуюцца да тысяч адначасовых карыстальнікаў

### 4. Мульты-агентныя сістэмы
Аркеструйце спецыялізаваных агентаў, якія:
- Дзеляць складаныя задачы паміж сфакусаванымі суб-агентамі
- Каардынуюцца праз агульны стан
- Апрацоўваюць збоі і паўторныя спробы разумна
- Агрэгуюць вынікі з паралельных аперацый

## Пачатак працы: Самы просты шлях

Прыгажосць LangChain v1 у тым, што вы можаце пачаць проста і дадаваць складанасць па меры неабходнасці:

**Фаза 1: Базавы агент (Дзень 1)**
```typescript
import { createAgent } from "langchain";

const agent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: [yourTool],
});
```

**Фаза 2: Дадайце Middleware (Тыдзень 1)**
```typescript
import { PIIMiddleware, SummarizationMiddleware } from "langchain/middleware";

const agent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: tools,
  middleware: [new PIIMiddleware(), new SummarizationMiddleware()],
});
```

**Фаза 3: Прадакшн-функцыі (Тыдзень 2)**
```typescript
import { PostgresSaver } from "langchain/checkpointers";

const agent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: tools,
  middleware: middlewareStack,
  checkpointer: new PostgresSaver({ connectionString }),
  outputSchema: YourSchema,
});
```

## Чаму TypeScript робіць LangChain яшчэ лепшым

Выкарыстанне LangChain v1 з TypeScript дае значныя перавагі для стварэння прадакшн-праграм:

### Бяспека тыпаў па ўсім вашым агенце
```typescript
import { z } from "zod";
import { tool } from "langchain";

// Вызначце схемы з поўным вывадам тыпаў
const SearchSchema = z.object({
  query: z.string(),
  maxResults: z.number().optional(),
});

// TypeScript аўтаматычна вылічае тыпы параметраў
const searchTool = tool(
  async ({ query, maxResults = 10 }) => {
    // TypeScript ведае, што query — гэта string, maxResults — number
    return await search(query, maxResults);
  },
  {
    name: "search",
    description: "Пошук у базе даных",
    schema: SearchSchema,
  }
);
```

### Гнуткасць разгортвання
LangChain TypeScript бесперашкодна працуе на сучасных платформах:
- **Node.js**: Традыцыйныя бэкенд-сэрвісы (18.x, 19.x, 20.x, 22.x)
- **Vercel/Next.js**: Server components, API routes і edge functions
- **Cloudflare Workers**: Edge-вылічэнні з мінімальным халодным стартам
- **Deno**: Сучасны runtime з убудаванай падтрымкай TypeScript
- **Браўзер**: Кліенцкія AI-праграмы з бандлерамі накшталт Vite або Webpack

### Лёгкая ўсталёўка
```bash
# npm
npm install langchain

# pnpm
pnpm add langchain

# yarn
yarn add langchain
```

### Інтэграцыя з фрэймворкамі
```typescript
// Next.js API Route
import { createAgent } from "langchain";

export async function POST(req: Request) {
  const { message } = await req.json();
  
  const agent = createAgent({
    model: "claude-sonnet-4-5-20250929",
    tools: [searchTool, analyticsTool],
  });
  
  const result = await agent.invoke({
    messages: [{ role: "user", content: message }],
  });
  
  return Response.json(result);
}
```

## Міграцыя: Прасцей, чым вы думаеце

Калі вы выкарыстоўваеце LangChain да v1, шлях міграцыі зразумелы:

- **Агенты**: Замяніце старыя канструктары агентаў на `create_agent`
- **Ланцужкі**: Большасць логікі ланцужкоў можа стаць прасцейшым middleware
- **Retrievers**: Імпартуйце з `langchain-classic` пры неабходнасці
- **Асноўная функцыянальнасць**: Ужо сумяшчальная

Каманда прадастаўляе поўнае кіраўніцтва па міграцыі, і архітэктура распрацавана для мінімізацыі ломкіх змен.

## Экасістэма LangChain: Усе пакеты абноўлены

LangChain v1 — гэта не толькі абнаўленне асноўнай бібліятэкі — уся экасістэма была сінхранізавана для бесперашкоднай сумяшчальнасці:

### Абноўленыя пакеты інтэграцыі

```bash
# Асноўныя пакеты
npm install langchain @langchain/core

# Правайдэры мадэляў
npm install @langchain/openai        # OpenAI GPT-4, GPT-4o, o1
npm install @langchain/anthropic     # Claude 3.5, Claude 4
npm install @langchain/google-genai  # Gemini Pro, Gemini Ultra
npm install @langchain/ollama        # Лакальныя мадэлі праз Ollama
npm install @langchain/mistralai     # Mistral, Mixtral

# Супольнасныя інтэграцыі
npm install @langchain/community     # 100+ інтэграцый
```

**Асноўныя моманты пакетаў:**

| Пакет | Версія | Што новага |
|-------|--------|------------|
| `@langchain/core` | 1.0.x | Уніфікаваны фармат паведамленняў, стандарт contentBlocks |
| `@langchain/openai` | 1.0.x | Натыўныя структураваныя вываду, паляпшэнні стрымінгу |
| `@langchain/anthropic` | 1.0.x | Падтрымка Claude 4, пашыранае разважанне |
| `@langchain/ollama` | 1.0.x | Палепшаная прадукцыйнасць лакальных мадэляў, выклік інструментаў |
| `@langchain/community` | 1.0.x | Вектарныя сховішчы, загрузнікі дакументаў, retrievers |

### @langchain/ollama: Лакальны AI стаў простым

Запускайце магутныя AI-мадэлі лакальна без выдаткаў на API:

```typescript
import { ChatOllama } from "@langchain/ollama";
import { createAgent, tool } from "langchain";

const localModel = new ChatOllama({
  model: "llama3.2",  // або mistral, codellama, phi3
  temperature: 0.7,
});

const agent = createAgent({
  model: localModel,
  tools: [yourTools],
});

// Поўныя магчымасці агента з лакальнымі мадэлямі!
const result = await agent.invoke({
  messages: [{ role: "user", content: "Прааналізуй гэты код" }],
});
```

### @langchain/openai: Палепшаная інтэграцыя з OpenAI

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
});

// Натыўная падтрымка структураванага вываду
const structuredModel = model.withStructuredOutput(YourSchema);
```

### @langchain/community: 100+ інтэграцый

Пакет community аб'ядноўвае дзясяткі інтэграцый:
- **Вектарныя сховішчы**: Qdrant, Pinecone, Chroma, Weaviate, Milvus
- **Загрузнікі дакументаў**: PDF, CSV, JSON, вэб-старонкі, GitHub
- **Retrievers**: Self-query, contextual compression, ensemble
- **Інструменты**: Wikipedia, DuckDuckGo, Calculator, Python REPL

```typescript
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
```

## LangGraph: Аркестрацыя складаных AI-працоўных працэсаў

У той час як `createAgent` апрацоўвае большасць выпадкаў выкарыстання, **LangGraph** забяспечвае прасунутую аркестрацыю пад капотам — і вы можаце выкарыстоўваць яго напрамую для складаных мульты-агентных сістэм:

### Што такое LangGraph?

LangGraph — гэта бібліятэка для стварэння stateful, мульты-актарных праграм з LLM. Уявіце яго як дзяржаўную машыну для AI-працоўных працэсаў, дзе кожны вузел можа быць выклікам LLM, выкананнем інструмента або карыстальніцкай логікай.

```typescript
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// Вызначце просты граф
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", async (state) => {
    const model = new ChatOpenAI({ model: "gpt-4o" });
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  })
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    end: "__end__",
  })
  .addEdge("tools", "agent");

const app = workflow.compile();
```

### Калі выкарыстоўваць LangGraph vs createAgent

| Выпадак выкарыстання | Рэкамендавана |
|---------------------|---------------|
| Простыя агенты з выклікам інструментаў | `createAgent` |
| Працоўныя працэсы з адной мадэллю | `createAgent` |
| Супрацоўніцтва мульты-агентаў | LangGraph |
| Складаная логіка галінавання | LangGraph |
| Human-in-the-loop з некалькімі checkpoints | LangGraph |
| Карыстальніцкі паток выканання | LangGraph |

### Асноўныя функцыі LangGraph

**1. Цыклы і галінаванне**
У адрозненне ад простых ланцужкоў, LangGraph падтрымлівае цыклы — неабходныя для агентаў, якім трэба ітэраваць, пакуль задача не будзе завершана.

**2. Убудаваны Persistence**
```typescript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const app = workflow.compile({ checkpointer });

// Узнавіце з любой кропкі
const state = await app.getState({ configurable: { thread_id: "123" } });
```

**3. Human-in-the-Loop**
```typescript
const app = workflow.compile({
  checkpointer,
  interruptBefore: ["sensitive_action"], // Паўза перад гэтым вузлом
});

// Пазней, узнавіце пасля чалавечага зацвярджэння
await app.invoke(null, { configurable: { thread_id: "123" } });
```

**4. Падтрымка стрымінгу**
```typescript
for await (const event of app.streamEvents(input, { version: "v2" })) {
  if (event.event === "on_chat_model_stream") {
    console.log(event.data.chunk.content);
  }
}
```

### Прыклад мульты-агентнай сістэмы з LangGraph

Стварыце даследчую каманду са спецыялізаванымі агентамі:

```typescript
import { StateGraph } from "@langchain/langgraph";

// Вызначце спецыялізаваных агентаў
const researcherAgent = createAgent({
  model: "gpt-4o",
  tools: [webSearch, arxivSearch],
  systemPrompt: "Вы спецыяліст па даследаваннях...",
});

const writerAgent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: [documentWriter],
  systemPrompt: "Вы тэхнічны пісьменнік...",
});

const reviewerAgent = createAgent({
  model: "gpt-4o",
  tools: [],
  systemPrompt: "Вы рэцэнзуеце і крытыкуеце кантэнт...",
});

// Аркеструйце іх з LangGraph
const teamWorkflow = new StateGraph(TeamStateAnnotation)
  .addNode("researcher", researcherAgent)
  .addNode("writer", writerAgent)
  .addNode("reviewer", reviewerAgent)
  .addEdge("__start__", "researcher")
  .addEdge("researcher", "writer")
  .addEdge("writer", "reviewer")
  .addConditionalEdges("reviewer", needsRevision, {
    revise: "writer",
    done: "__end__",
  });

const team = teamWorkflow.compile();
```

### Усталёўка LangGraph

```bash
npm install @langchain/langgraph
```

## Выснова

LangChain v1 здымае бар'еры паміж прататыпам і прадакшнам. Незалежна ад таго, ці ствараеце вы сваю першую AI-праграму, ці маштабуеце да карпаратыўнага разгортвання, v1 забяспечвае:

- **Хуткасць**: Ад ідэі да працуючага агента за лічаныя хвіліны
- **Магутнасць**: Middleware і кастамізацыя для любога выпадку выкарыстання
- **Надзейнасць**: Убудаваны persistence, streaming і апрацоўка памылак
- **Гнуткасць**: Правайдэр-агнастычны дызайн для забеспячэння будучыні
- **Эканомія**: Аптымізаваныя патэрны, якія зніжаюць выдаткі на API

Фрэймворк нарэшце адпавядае сталасці мадэляў, якімі ён кіруе. Цяпер ідэальны час для стварэння AI-праграмы, якую вы планавалі.

## Рэсурсы для паглыблення

- [Афіцыйная дакументацыя LangChain v1 (JS)](https://docs.langchain.com/oss/javascript/releases/langchain-v1)
- [Блог з анонсам LangChain 1.0](https://blog.langchain.com/langchain-langchain-1-0-alpha-releases/)
- [Глыбокае паглыбленне ў Agent Middleware](https://blog.langchain.com/agent-middleware/)
- [Дакументацыя LangGraph (JS)](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [GitHub LangGraph (JS)](https://github.com/langchain-ai/langgraphjs)
- [Кіраўніцтва па міграцыі (JS)](https://docs.langchain.com/oss/javascript/migrate/langchain-v1)
- [GitHub LangChain (JS)](https://github.com/langchain-ai/langchainjs)

Пачніце ствараць сёння — інструменты гатовыя, патэрны правераны, а магчымасці бязмежныя.
