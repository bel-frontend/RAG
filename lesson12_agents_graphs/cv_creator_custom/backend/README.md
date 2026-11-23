# CV editor web server

Запуск з кораня рэпазіторыя:

```bash
bun run lesson12_agents_graphs/cv_creator_custom/backend/server.ts
```

Пасля запуску адкрыйце <http://localhost:3000>.

Сервер захоўвае LangGraph-сесіі ў памяці праз існуючы `MemorySaver`, таму пасля
перазапуску працэсу незавершаныя сесіі выдаляюцца.

## API

- `GET /api/health` — праверка сервера.
- `POST /api/cv/start` — пачаць сесію з `candidateText` і `vacancyText`.
- `POST /api/cv/answer` — працягнуць сесію з `threadId` і `answer`.
