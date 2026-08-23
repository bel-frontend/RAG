# LangGraph: рэжымы запуску і human-in-the-loop — канспект

Прыклады ў гэтым канспекце пабудаваны вакол файлаў гэтага ўрока:

- `cv_creator_custom/dataPrepare.ts` — экстракцыя CV з тэксту рэзюмэ + вакансіі (пакуль лінейны код, без графа)
- `cv_creator_custom/orchestrator.ts`, `cv_creator_custom/chat.ts` — пачатак графа (`StateGraph` + `MemorySaver`), пакуль пусты каркас

Базавыя паняцці LangGraph (nodes, edges, `Annotation`) тут не паўтараюцца — яны ўжо разабраны ў `lesson9_langchain/LANGGRAPH_FOR_BEGINNERS.md`. Тут — пра тое, што пасля: **як запускаць гатовы граф** і **як зрабіць паўзу пасярод графа, каб спытаць чалавека**.

---

## 1. Чаму `dataPrepare.ts` пакуль не патрабуе графа

`createCVFromText` у `dataPrepare.ts` робіць адзін выклік мадэлі і вяртае:

```ts
{ meta: { requiredData }, cv, questionsToUser }
```

Калі `questionsToUser` не пусты — значыць, мадэлі не хапае інфармацыі, і трэба задаць пытанні кандыдату, атрымаць адказ, і паспрабаваць `extract` яшчэ раз. Пакуль гэтага цыклу няма: код выклікаецца адзін раз і спыняецца, нават калі ёсць пытанні.

Апісаць гэты цыкл голым `while` можна, але як толькі дадаецца "спыніцца і счакаць адказ чалавека, магчыма праз хвіліну, магчыма праз дзень" — гэта ўжо не проста цыкл у адной функцыі, а стан, які трэба недзе захаваць паміж выклікамі. Менавіта тут LangGraph дае гатовы механізм (`checkpointer`), а не толькі прыгожы сінтаксіс для галінавання.

---

## 2. Мінімальны граф для гэтага сцэнара

Дапоўнены варыянт таго ж каркаса, што пачаты ў `orchestrator.ts`:

```ts
import { Annotation, StateGraph, MemorySaver } from "@langchain/langgraph";
import { createCVFromText } from "./dataPrepare.ts"; // умоўна экспартавана

const CVState = Annotation.Root({
  candidateText: Annotation<string>({ reducer: (_, u) => u, default: () => "" }),
  vacancyText: Annotation<string>({ reducer: (_, u) => u, default: () => "" }),
  cv: Annotation<CV_Structure | null>({ reducer: (_, u) => u, default: () => null }),
  questionsToUser: Annotation<string[]>({ reducer: (_, u) => u, default: () => [] }),
  userAnswer: Annotation<string>({ reducer: (_, u) => u, default: () => "" }),
});

async function extractNode(state: typeof CVState.State) {
  const result = await createCVFromText("", state.candidateText, state.vacancyText);
  return { cv: result.data.cv, questionsToUser: result.data.questionsToUser };
}

function afterExtract(state: typeof CVState.State): "askUser" | "__end__" {
  return state.questionsToUser.length > 0 ? "askUser" : "__end__";
}

// Сама нода нічога не робіць — граф спыняецца ПЕРАД ёй (гл. interruptBefore ніжэй).
async function askUserNode() {
  return {};
}

const workflow = new StateGraph(CVState)
  .addNode("extract", extractNode)
  .addNode("askUser", askUserNode)
  .addEdge("__start__", "extract")
  .addConditionalEdges("extract", afterExtract, {
    askUser: "askUser",
    __end__: "__end__",
  })
  .addEdge("askUser", "extract");

const checkpointer = new MemorySaver();
const app = workflow.compile({
  checkpointer,
  interruptBefore: ["askUser"],
});
```

Схема цыкла:

```
__start__ → extract ──questionsToUser пусты──► __end__
               ▲              │
               │        ёсць пытанні
               │              ▼
               └────────── askUser  (тут граф спыняецца і чакае чалавека)
```

---

## 3. Рэжымы запуску скампіляванага графа

`app` — гэта звычайны `Runnable` (той жа інтэрфейс, што і ў мадэляў у LangChain), таму `.invoke()` не адзіны спосаб яго запусціць.

### `invoke` — адзін запуск, толькі фінальны/спынены стан

```ts
const config = { configurable: { thread_id: "cv-session-1" } };

const state = await app.invoke(
  { candidateText, vacancyText },
  config,
);
```

Тут `state` — гэта стан пасля `extract`. Калі `questionsToUser` не пусты, граф спыніцца роўна перад `askUser` (з-за `interruptBefore`) і верне прамежкавы стан, а не памылку і не "залежыць".

### `stream` — прамежкавыя абнаўленні па меры выканання нод

```ts
for await (const chunk of await app.stream({ candidateText, vacancyText }, config)) {
  console.log(chunk); // напр. { extract: { cv: {...}, questionsToUser: [...] } }
}
```

Карысна, каб паказваць прагрэс "extract → askUser → extract → ..." у інтэрфейсе, а не чакаць усё разам.

### `batch` — некалькі незалежных запускаў паралельна

```ts
const results = await app.batch([
  { candidateText: resumeA, vacancyText: vacancyA },
  { candidateText: resumeB, vacancyText: vacancyB },
]);
```

Кожны элемент масіва — асобны, незалежны прагон графа (розныя `thread_id`, калі патрэбны свае checkpoint'ы).

### `streamEvents` — самая дэталёвая падзейная плынь

```ts
for await (const event of app.streamEvents(
  { candidateText, vacancyText },
  { ...config, version: "v2" },
)) {
  if (event.event === "on_chat_model_stream") {
    process.stdout.write(event.data.chunk.content ?? "");
  }
}
```

Дае падзеі не толькі "нода пачалася/скончылася", а і токены LLM унутры нод па меры генерацыі — для стрымінгу тэксту ў UI ў рэальным часе.

---

## 4. Human-in-the-loop: `interrupt` + аднаўленне праз `checkpointer`

Гэта тое, чаго не хапае голаму `invoke()`: **паўза пасярод графа і працяг пазней, магчыма зусім у іншым HTTP-запыце**.

Ключавыя рэчы:

- `checkpointer` (тут `MemorySaver`, у продзе — напрыклад `SqliteSaver`/`PostgresSaver`) захоўвае стан графа паміж выклікамі, прывязаны да `thread_id`.
- `interruptBefore: ["askUser"]` пры `compile()` кажа: "спыніся, не заходзячы ў гэтую ноду".
- `app.invoke(null, config)` (менавіта `null` замест уваходу!) азначае "не пачынай спачатку, а працягні з апошняга checkpoint'а гэтага `thread_id`".
- `app.updateState(config, patch)` дазваляе "уліць" адказ чалавека ў стан перад тым, як працягнуць.

Поўны цыкл "спытаць кандыдата, пакуль не хопіць інфармацыі":

```ts
const config = { configurable: { thread_id: "cv-session-1" } };

let state = await app.invoke({ candidateText, vacancyText }, config);

while (state.questionsToUser.length > 0) {
  console.log("Пытанні кандыдату:", state.questionsToUser);

  const answer = await askHumanSomehow(); // stdin, чат-паведамленне, форма — што заўгодна

  await app.updateState(config, {
    userAnswer: answer,
    candidateText: `${state.candidateText}\n${answer}`,
  });

  state = await app.invoke(null, config); // працяг з чэкпоінта, не з пачатку
}

console.log("Гатовы CV:", state.cv);
```

Важна: паміж двума выклікамі `app.invoke(null, config)` можа прайсці і секунда, і дзень — стан жыве ў `checkpointer`, а не ў пераменных праграмы. Гэта і адрознівае граф ад проста `while`-цыкла ў адной функцыі: цыкл памірае разам з працэсам, а граф з checkpointer'ам — не.

---

## 5. Кароткая табліца

| Спосаб | Калі выкарыстоўваць |
|---|---|
| `invoke` | просты аднаразовы запуск; чакаем фінал ці кропку `interrupt` |
| `stream` | трэба паказваць прагрэс па нодах у рэальным часе |
| `batch` | некалькі незалежных уваходаў паралельна |
| `streamEvents` | патрэбныя токены LLM ці ўнутраныя падзеі нод |
| `checkpointer` + `interruptBefore` + `invoke(null, config)` | трэба паўза пасярод графа і чаканне ўводу чалавека (наш `questionsToUser`) |

---

## 6. Практыкаванні

Рабіце ў асобным `.ts`-файле побач з `dataPrepare.ts` (можна выкарыстоўваць рэальны `createCVFromText` адтуль).

1. **Дапоўніце `orchestrator.ts`.**
   У пустым `ResearchState` (у `orchestrator.ts`) дадайце палі `candidateText`, `vacancyText`, `cv`, `questionsToUser` (як у прыкладзе вышэй). Дадайце нодy `extract`, якая выклікае `createCVFromText`, і `addEdge("__start__", "extract")`, `addEdge("extract", "__end__")`. Праверце, што `app.invoke({ candidateText, vacancyText })` вяртае стан з запоўненым `cv`.

2. **Дадайце цыкл пытанняў.**
   Да графа з практыкавання 1 дадайце ноду `askUser` і ўмоўны пераход `addConditionalEdges("extract", ...)`, як у раздзеле 2. Скампілюйце з `interruptBefore: ["askUser"]`.

3. **`stream` замест `invoke`.**
   Запусціце граф з практыкавання 2 праз `app.stream(...)` і выведзіце ў кансоль назву кожнай ноды, якая адпрацавала, па меры выканання.

4. **Поўны human-in-the-loop цыкл.**
   Напішыце функцыю `runInteractiveCV(candidateText, vacancyText)`, якая: запускае граф, пакуль ёсць `questionsToUser` — друкуе іх у кансоль і чытае адказ праз `readline`/`prompt`, уліваe адказ праз `updateState`, працягвае праз `invoke(null, config)`. У канцы вяртае гатовы `cv`.

5. **Два незалежныя кандыдаты.**
   Выкарыстоўваючы `app.batch([...])`, запусціце граф адразу для дзвюх пар (рэзюмэ, вакансія) з **рознымі** `thread_id` у `config` для кожнага элемента. Пераканайцеся, што іх стан у `checkpointer` не змешваецца (пытанні аднаго кандыдата не трапляюць у стан другога).
