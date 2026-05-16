# Lesson 11 Workshop: PDF to RAG Chat

Гэты воркшоп паказвае поўны шлях:

1. PDF-файлы з `pdf_documents/` разбіваюцца на чанкі.
2. Чанкі ператвараюцца ў embeddings праз OpenAI embeddings model.
3. Вектары і metadata захоўваюцца ў знешнім Qdrant API.
4. Bun-сервер прымае гісторыю чату і перадае яе агенту-аркестратару.
5. Агент-аркестратар праз структураваны JSON-вывад вырашае: адказваць як чат, выклікаць generic RAG search agent або спецыяльныя tools.
6. `QueryPlannerAgent` вылучае ідэю запыта: intent, core query, expanded queries, target book і tool.
7. RAG tools шукаюць па некалькіх варыянтах запыту, merge-яць вынікі і вяртаюць структураваныя крыніцы.
8. `folk_wisdom_search` tool выкарыстоўваецца для запытаў пра прыказкі, прымаўкі, афарызмы і народныя мудрасці.
9. `dialect_dictionary_search` tool выкарыстоўваецца для першай кнігі: дыялектныя словы, тлумачэнні, гразьбы, праклёны, мясцовыя выразы.
10. Аркестратар фармуе фінальны структураваны адказ праз LangChain chat model з `../common/model.ts`.
11. React-франтэнд дае чат-інтэрфейс да `/api/chat`.

## Наладка

```bash
cd lesson11_workshop_rag
bun install
cp .env.example .env
```

Запоўніце `.env`:

```bash
OPENAI_API_KEY=...
QDRANT_URL=https://your-qdrant-host.example
QDRANT_API_KEY=...
QDRANT_COLLECTION=lesson11_pdf_documents
CHAT_MODEL=gpt-5.4
TOP_K=5
FOLK_WISDOM_TOP_K=30
DIALECT_DICTIONARY_TOP_K=20
DIALECT_DICTIONARY_FILE=Vusacki_slovazbor
SECTION_FORWARD_PAGES=12
SECTION_MAX_CHUNKS=60
RAG_MIN_SCORE=0.25
OCR_ENABLED=true
OCR_LANG=bel+rus+eng
OCR_DPI=200
```

Для слоўнікаў выкарыстоўваецца адносна дробны split:

```bash
CHUNK_SIZE=600
CHUNK_OVERLAP=120
```

Гэта дае больш дакладныя трапленні па асобных артыкулах і кароткіх выразах.

`QDRANT_API_KEY` можна пакінуць пустым, калі ваш endpoint не патрабуе ключ.

## Каманды

Загрузіць PDF у RAG:

```bash
bun run ingest
```

Калі PDF з'яўляецца сканам або `PDFLoader` бачыць 0 старонак, спачатку зрабіце searchable/OCR PDF:

```bash
bun run ocr:pdf -- pdf_documents/Vusacki_slovazbor_Ryhora_Baradulina_2013.pdf
```

Гатовы файл будзе ў `ocr_documents/*.ocr.pdf`. Яго можна скапіраваць або перанесці ў `pdf_documents/` і пасля гэтага запускаць `bun run ingest`.

На гэтым этапе выконваецца embedding кніг: PDF старонкі рэжуцца на чанкі, кожны чанк адпраўляецца ў `OpenAIEmbeddings.embedDocuments`, пасля чаго вектары разам з metadata захоўваюцца ў Qdrant.

Калі PDF не мае тэкставага слоя і звычайны loader вяртае 0 старонак, ingestion аўтаматычна выкарыстоўвае OCR fallback праз `pdftoppm` і `tesseract`. Для беларускіх/рускіх/англійскіх тэкстаў па змаўчанні выкарыстоўваецца `OCR_LANG=bel+rus+eng`. OCR можа працаваць істотна даўжэй за звычайную загрузку PDF.

Запусціць API сервер:

```bash
bun run server
```

Падчас чату embedding таксама выкарыстоўваецца, але толькі для пошукавага запыту карыстальніка: `embedQuery` стварае вектар пытання, па якім RAG search agent шукае блізкія чанкі ў Qdrant.

Калі чат пачынае падцягваць відавочна нерэлевантныя фрагменты, можна павялічыць `RAG_MIN_SCORE`, напрыклад да `0.35`. Калі крыніц няма, чат не павінен прыдумляць адказ: ён верне паведамленне, што ў дакументах няма дастатковых дадзеных.

`TOP_K` кіруе звычайным RAG search. `FOLK_WISDOM_TOP_K` асобна кіруе tool-ам для прыказак, прымавак і народных мудрасцей; па змаўчанні ён вяртае да 30 крыніц, каб не абразаць спісы да 8.

`DIALECT_DICTIONARY_TOP_K` кіруе асобным tool-ам `dialect_dictionary_search` для першай кнігі `Vusacki_slovazbor...`. Ён шукае толькі па гэтай кнізе і дадае query expansion для дыялектных слоў, тлумачэнняў, гразьбаў, праклёнаў і мясцовых выразаў.

Для запытаў па раздзелах tool працуе агульна: знаходзіць anchor chunk па назве або ідэі раздзела, а потым дабірае наступныя chunks з той жа кнігі. `SECTION_FORWARD_PAGES` задае, колькі старонак наперад браць ад anchor-а, `SECTION_MAX_CHUNKS` абмяжоўвае памер адказу.

Праверыць, якія PDF сапраўды ёсць у Qdrant:

```bash
bun run rag:status
```

Праверыць пошук без чату:

```bash
bun run search -- --folk "прыказкі прымаўкі народныя мудрасці"
```

Праверыць пошук па першай кнізе:

```bash
bun run search -- --dialect "Праклёны гразьбы Апсік апох сік халера"
```

Запусціць React чат:

```bash
bun run dev
```

Па змаўчанні:

- API: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- PDF folder: `lesson11_workshop_rag/pdf_documents`

## Структура

- `src/config.ts` - усе наладкі з `.env`.
- `src/documents.ts` - загрузка PDF і split на чанкі.
- `src/embeddings.ts` - embeddings client.
- `src/qdrant/` - тонкі Qdrant REST client.
- `src/rag/` - retrieval-тыпізацыя і Qdrant retriever.
- `src/agents/` - chat orchestrator agent, query planner, RAG search agent, `folk_wisdom_search`, `dialect_dictionary_search` і Zod-схемы структураванага ўводу/вываду.
- `src/ingest.ts` - entrypoint для PDF ingestion.
- `src/server.ts` - Bun HTTP API.
- `frontend/` - React чат.

## API кантракт

`POST /api/chat`

```json
{
  "messages": [
    { "role": "user", "content": "Што такое zero-shot prompting?" }
  ]
}
```

Адказ:

```json
{
  "answer": "...",
  "usedRag": true,
  "searchQuery": "...",
  "sources": [],
  "trace": {
    "orchestratorDecision": {
      "action": "search_rag",
      "reason": "..."
    },
    "usedTool": "rag_search",
    "searchPlan": {
      "intent": "general_rag",
      "coreQuery": "...",
      "expandedQueries": ["...", "..."],
      "targetBook": "any",
      "tool": "rag_search",
      "reason": "..."
    },
    "citations": []
  }
}
```

Для запытаў пра прыказкі, прымаўкі і народныя мудрасці `usedTool` будзе `folk_wisdom_search`.
Для запытаў пра першую кнігу, дыялектныя словы, гразьбы і праклёны `usedTool` будзе `dialect_dictionary_search`.
