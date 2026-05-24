# Lessons on RAG and AI Agents

Практычны курс па **Retrieval-Augmented Generation (RAG)** і **AI-агентах** на TypeScript/Bun. Прыклады і воркшопы з беларускай мовай у промптах і дакументацыі.

## Пачніце тут

👉 **[lesson0_intro/README.md](./lesson0_intro/README.md)** — пра што курс, структура, тэхстэк, бягучы стан і што патрэбна для старту.

## Агляд курса

Курс вучыць будваць інтэлектуальныя сістэмы, якія:
- **шукаюць** рэлевантную інфармацыю ў дакументах (RAG — Retrieval-Augmented Generation);
- **генеруюць** адказы на аснове знойдзеных крыніц;
- **выкарыстоўваюць інструменты** — API, базы дадзеных, знешнія сэрвісы;
- **арганізуюцца ў агентаў** — з планаваннем, памяццю і оркестрацыяй некалькіх крокаў.

Працоўная мова прыкладаў і многіх промптаў — **беларуская**. Тэхнічная дакументацыя ў тэчках урокаў — таксама на беларускай або двухмоўная.

## Структура і план курса

| # | Тэчка | Тэма |
|---|-------|------|
| 0 | [`lesson0_intro/`](./lesson0_intro/) | Уводзіны і навігацыя па курсе |
| 1 | [`lesson1_phi4/`](./lesson1_phi4/) | Базавы RAG: Ollama (лакальная мадэль) + Qdrant |
| 2 | [`lesson2_openai/`](./lesson2_openai/) | RAG з OpenAI embeddings замест лакальных |
| 3 | [`lesson3_formatted_result/`](./lesson3_formatted_result/) | Telegram-бот са структураваным вывадам (Zod) |
| 4 | [`lesson4_agent/`](./lesson4_agent/) | AI-агент з інструментамі (надвор'е, прыказкі, фота) у Telegram |
| 5 | [`lesson5_images/`](./lesson5_images/) | Аналіз выяў у Telegram-боце (vision-мадэлі) |
| 6 | [`lesson6_combined/`](./lesson6_combined/) | Агент у Discord з пашыранымі інструментамі |
| 7 | [`lesson7_chain_models/`](./lesson7_chain_models/) | Ланцужкі LangChain (`RunnableSequence`) для перакладу і карэктуры |
| 8 | [`lesson8_mcp/`](./lesson8_mcp/) | MCP-сервер (Model Context Protocol) |
| 9 | [`lesson9_langchain/`](./lesson9_langchain/) | LangChain v1 і LangGraph: агенты, графы, structured output |
| 10 | [`lesson10_workshop/`](./lesson10_workshop/) | Воркшоп: MD-рэцэнзент |
| 11 | [`lesson11_workshop_rag_chat/`](./lesson11_workshop_rag_chat/) | Воркшоп: PDF → RAG → чат (React/Vite) |
| 12 | [`lessons12_skills/`](./lessons12_skills/) | Agent Skills |

### Логіка нарастання складнасці

```
RAG (1–2) → боты і structured output (3) → агенты з tools (4–6)
    → ланцужкі (7) → MCP (8) → LangChain/LangGraph (9)
        → воркшопы (10–11) → skills (12)
```

## Тэхстэк

| Катэгорыя | Тэхналогіі |
|-----------|------------|
| Мова і рантайм | TypeScript, [Bun](https://bun.sh) |
| LLM і embeddings | OpenAI, Ollama (локальна), Google Gemini |
| RAG і вектарная БД | Qdrant, LangChain document loaders |
| Агенты | LangChain v1, LangGraph, Zod-схемы |
| Інтэграцыі | Telegram Bot API, Discord.js, MCP SDK |
| Фронтэнд (урок 11) | React, Vite |
| Інфраструктура | Docker (урокі 3, 5, 8), `.env` для ключоў |

## Перад стартам

- Базавы TypeScript/JavaScript.
- **Bun** (v1.x) і **Git**.
- API-ключы для асобных урокаў (OpenAI, Telegram і г.д.) і лакальны Qdrant/Ollama — падрабязна ў [lesson0_intro](./lesson0_intro/README.md).

## Як карыстацца рэпазітарыем

1. Перайдзіце ў патрэбную тэчку ўрока (напрыклад, `cd lesson1_phi4`).
2. Усталюйце залежнасці з дапамогай `bun install`.
3. Запусціце код згодна з `README.md` у тэчцы (звычайна `bun run index.ts`).

---
Happy learning!
