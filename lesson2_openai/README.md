# Урок 2: RAG з OpenAI Embeddings і Qdrant

У гэтым уроку мы працягваем вывучаць Retrieval-Augmented Generation (RAG), але замест лакальных мадэляў выкарыстоўваем OpenAI API для стварэння вектарных прадстаўленняў (embeddings).

## Апісанне

Асноўныя этапы:
1. Выкарыстанне `pdf_preparing.ts` для падрыхтоўкі і загрузкі дакументаў.
2. Стварэнне вектараў тэкстаў праз OpenAI Embeddings.
3. Захаванне дадзеных у Qdrant (калекцыя `openai_collection`).
4. Пошук па дадзеных і перадача кантэксту ў мадэль для адказу.

## Як запусціць

1. Усталюйце залежнасці:
   ```bash
   bun install
   ```

2. Наладзьце ключы доступу. Стварыце файл `.env` па ўзоры `.env.example` і дадайце свой ключ:
   ```env
   OPENAI_API_KEY=ваш_ключ
   ```

3. Запусціце Qdrant (калі яшчэ не запушчаны).

4. Стварэнне і запаўненне калекцыі (калі трэба абнавіць дадзеныя):
   ```bash
   bun run create_collection.ts
   bun run pdf_preparing.ts
   bun run embedding.ts
   ```

5. Запуск пошуку і генерацыя адказу:
   ```bash
   bun run index.ts
   ```
