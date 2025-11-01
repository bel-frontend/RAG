
## Вітаем! Падключаем Cursor і VS Code да вашых API праз MCP

Часам глядзіш на ўласныя карысныя скрыпты і думаеш: «Як акуратна, без лішняй мукі падвесці іх да ШІ?» Адказ — MCP (Model Context Protocol). Далей — стройны, практычны гайд: як сабраць просты, але акуратны MCP-сервер і прымусіць вашы інструменты гаварыць з чатам і IDE на адной мове. Напрыканцы — як запусціць яго ў Cursor і GitHub Copilot (VS Code).

---

### MCP у двух словах

MCP — уніфікаваны “перакладчык” паміж вашымі інструментамі і разумнымі кліентамі (чат-асістэнтамі, IDE, інспектарамі). Замест чарговага разрозненага API вы дакладна апісваеце, што ўмее ваш тул і якія ў яго ўваходы/выходы — далей усё працуе па стандарце.

#### Чым MCP зручны
- Стандартызацыя. Адзіная мова для тулаў і кліентаў замест кустарных протаколаў.
- Пераноснасць. Розныя транспарты (stdio/HTTP) і розныя кліенты — той самы тул.
- Кіравальнасць. Яўныя схемы, прадказальныя паводзіны, выразныя правы.
- Хуткая інтэграцыя. Падключылі API/ФС/БД/DevOps-працэсы — і карыстаецеся з IDE або чата.

#### Дзе MCP асабліва дарэчны
- DevTools і ChatOps: CI/CD-каманды, дыягностыка, доступ да логаў.
- Data/BI: агрэгаваныя запыты, разумныя зводкі.
- Унутраныя API: адзіная кантрольная кропка для каманды.
- RAG/аўтаматызацыя: стягванне, перад-/пасляапрацоўка дадзеных.

MCP далікатна “склейвае” старыя добрыя скрыпты з новымі кліентамі. Замест перапісвання — акуратная інтэграцыя.

---

### Як зрабіць просты MCP-сервер з HTTP-транспартам (Bun/Node)

Гатовы прыклад: `lesson8_mcp/mcp_server` у рэпазіторыі аўтара. Код сумяшчальны з Bun і Node.js.

#### Што збудауем

Саберым лакальны HTTP-сервер з `/healthz` і `/mcp`, без стану (stateless), з трыма дэма-туламі — каб адразу “памацаць” MCP:
- Маршруты:
  - `GET /healthz` — праверка здароўя.
  - `/mcp` — MCP-эндапоінт (`GET`, `POST`, `DELETE`).
- Stateless-рэжым (без сесій).
- Тры тулы:
  - `echo` — вяртае перададзены тэкст.
  - `get_proverb_by_topic` — прыказкі па тэме (`topic`, `random`, `limit`).
  - `get_weather` — лаканальнае надвор’е з wttr.in.

---

### Перадумовы
- Node.js ≥ 18 або Bun ≥ 1.x (для хуткага старту зручней Bun).
- Пакеты: `@modelcontextprotocol/sdk`, `zod`.
- (Па жаданні) Docker і Docker Compose.

### Хуткі старт

```bash
# Клон прыкладу
git clone https://github.com/bel-frontend/RAG
cd RAG/lesson8_mcp/mcp_server

# Усталёўка і запуск (Bun)
bun install
bun index.ts
```

У логах убачыце:

```
MCP Streamable HTTP Server on http://localhost:3002/mcp
Available endpoints: /healthz, /mcp
```

Праверка здароўя:

```bash
curl -s http://localhost:3002/healthz | jq .
```

Няма jq? Паказаць сыры JSON таксама дастаткова.

---

### Архітэктура і паток запыту
1) Ініцыялізацыя MCP. У `index.ts` ствараем `McpServer` і падключаем Streamable HTTP у stateless-рэжыме (без `Mcp-Session-Id`).
2) Модульныя тулы:
   - `registerEchoTools(mcp)` з `tools/echo.ts`
   - `registerProverbTools(mcp)` з `tools/proverbs.ts`
   - `registerWeatherTools(mcp)` з `tools/weather.ts`
   Кожны тул мае кароткае апісанне, схему ўваходу на zod і рэспандэр, што вяртае `content`.
3) HTTP-транспарт: `StreamableHTTPServerTransport({ sessionIdGenerator: undefined })` — сервер не вядзе стану. `mcp.connect(transport)` — падлучаем MCP да транспарту.
4) HTTP-сервер і маршруты: CORS + preflight `OPTIONS`, GET `/healthz` вяртае `{ ok, timestamp }`, `/mcp` абслугоўвае `GET/POST/DELETE`. Для дэма ключы/кантэкст не патрабуюцца — ніякіх загалоўкаў не трэба.
5) Грацыёзнае завяршэнне і памылкі: апрацоўваем `SIGINT`, `SIGTERM`, `uncaughtException`, `unhandledRejection` — каб сервер закрываўся акуратна і прадказальна.

---

### Ключавыя файлы праекта
- `index.ts` — запуск HTTP і MCP-транспарту, CORS, маршруты.
  (кантэкст і загалоўкі ў гэтым дэма не выкарыстоўваюцца)
- `tools/echo.ts` — тул `echo`.
- `tools/proverbs.ts` — тул `get_proverb_by_topic`.
- `tools/weather.ts` — тул `get_weather`.
- `package.json` — залежнасці і скрыпты.
- `Dockerfile`, `docker-compose.yml`, `deploy.sh` — кантэйнерызацыя.
- `.vscode/mcp.json` — прыклад канфігурацыі кліента (VS Code).

---

### Фрагменты кода

#### `index.ts` — мінімальны варыянт

```ts
import http from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerEchoTools } from './tools/echo.js';
import { registerProverbTools } from './tools/proverbs.js';
import { registerWeatherTools } from './tools/weather.js';

const PORT = Number(process.env.PORT ?? 3002);

const mcp = new McpServer({ name: 'test-mcp', version: '0.1.0' });
registerEchoTools(mcp);
registerProverbTools(mcp);
registerWeatherTools(mcp);

const transport = new StreamableHTTPServerTransport({
  // Stateless: не генеруем sessionId
  sessionIdGenerator: undefined,
});
await mcp.connect(transport);

function writeCors(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
  'Content-Type',
  );
  // Калі будзеце ўключаць stateful-сесіі, дадайце:
  // res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
}

const server = http.createServer(async (req, res) => {
  try {
    writeCors(res);
    if (req.method === 'OPTIONS') return res.end();

    if (req.url === '/healthz' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
      return;
    }

    if (req.url?.startsWith('/mcp')) {
      // Пакладзем загалоўкі ў кантэкст, каб тулы маглі іх чытаць
  // без дадатковых загалоўкаў/кантэксту
  {
        // Калі POST — паспрабуем загадзя распарсіць JSON
        if (req.method === 'POST') {
          const chunks: Uint8Array[] = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks).toString();
          try {
            const parsed = JSON.parse(body);
            return transport.handleRequest(req, res, parsed);
          } catch {
            return transport.handleRequest(req, res);
          }
        }
        return transport.handleRequest(req, res);
  }
      return;
    }

    res.statusCode = 404;
    res.end('Not Found');
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());

server.listen(PORT, () => {
  console.log(`HTTP on http://localhost:${PORT}`);
  console.log(`MCP endpoint: /mcp`);
});
```

#### Кантэкст (опцыянальна)
Калі ў будучыні спатрэбіцца аўтэнтыфікацыя або мульці-арэндаванне — дадайце `AsyncLocalStorage` і загалоўкі (`apikey` і інш.) самастойна. У гэтым дэма яны не патрэбныя.

#### `tools/echo.ts`

```ts
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerEchoTools(mcp: McpServer) {
  mcp.registerTool(
    'echo',
    {
      title: 'echo',
      description: 'Вяртае той жа тэкст',
      inputSchema: { text: z.string() },
    },
    async ({ text }: { text: string }) => ({
      content: [{ type: 'text', text }],
    }),
  );
}
```

#### `tools/proverbs.ts`

```ts
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const PROVERBS_URL = 'https://raw.githubusercontent.com/.../proverbs.json';

export function registerProverbTools(mcp: McpServer) {
  mcp.registerTool(
    'get_proverb_by_topic',
    {
      title: 'get_proverb_by_topic',
      description: 'Прыказкі па тэме',
      inputSchema: {
        topic: z.string().optional(),
        random: z.boolean().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      },
    },
    async ({ topic, random, limit = 5 }) => {
      try {
        const res = await fetch(PROVERBS_URL);
        const all: { text: string; topic?: string }[] = await res.json();
        const filtered = topic
          ? all.filter((p) => (p.topic ?? '').toLowerCase().includes(topic.toLowerCase()))
          : all;
        const picked = random
          ? filtered.sort(() => Math.random() - 0.5).slice(0, limit)
          : filtered.slice(0, limit);
        const lines = picked.map((p) => `• ${p.text}`).join('\n');
        return { content: [{ type: 'text', text: lines || 'Нічога не знойдзена' }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `Памылка: ${(e as Error).message}` }] };
      }
    },
  );
}
```

#### `tools/weather.ts`

```ts
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerWeatherTools(mcp: McpServer) {
  mcp.registerTool(
    'get_weather',
    {
      title: 'get_weather',
      description: 'Кароткі радок з wttr.in',
      inputSchema: { city: z.string() },
    },
    async ({ city }: { city: string }) => {
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=3`;
      const res = await fetch(url);
      const text = await res.text();
      return { content: [{ type: 'text', text }] };
    },
  );
}
```

---

### Канфігурацыя MCP-кліентаў і запуск лакальнага сервера

#### Cursor — праектны або глабальны канфіг
1) Запусціце сервер:

```bash
bun install
bun index.ts
# MCP: http://localhost:3002/mcp
```

2) Дадайце канфіг. Праектны файл `./.cursor/mcp.json` (альбо глабальна: `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "test-mcp": {
      "type": "http",
      "url": "http://localhost:3002/mcp"
    }
  }
}
```

3) Праверце падключэнне і зрабіце пробны выклік. Адкрыйце Settings → Model Context Protocol, пераканайцеся, што `test-mcp` у спісе і enabled. У чаты напішыце: «Выкліч тул `get_weather` для Minsk». Лагі — у Output → MCP Logs.

Нататка: калі будзеце дадаваць уласную аўтэнтыфікацыю — у Node.js імёны загалоўкаў прыходзяць у ніжнім рэгістры (напрыклад, `apikey`). У гэтым дэма мы загалоўкі не выкарыстоўваем.

#### GitHub Copilot (VS Code) — праектны канфіг
1) Запусціце сервер:

```bash
bun install
bun index.ts
# MCP: http://localhost:3002/mcp
```

2) Дадайце канфіг для VS Code. Стварыце `./.vscode/mcp.json` у карані праекта:

```json
{
  "servers": {
    "test-mcp": {
      "type": "http",
      "url": "http://localhost:3002/mcp"
    }
  }
}
```

3) Праверце з Copilot Chat: у панэлі інструментаў знайдзіце раздзел Tools і ўключыце `test-mcp` (калі даступна). Папытайце: «Выкліч тул `get_proverb_by_topic` з topic="пра працу" і limit=3».

Заўвагі:
- Для stdio-рэжыму замяніце `url` на `command/args` (напрыклад, `["node", "index.js"]`). Але для гэтага прыкладу (HTTP-транспарт) дастаткова `url`.
- Калі Copilot не бачыць сервер: перазапусціце VS Code і праверце, што порт 3002 свабодны.

---

### Запуск у Docker

```bash
docker compose build --no-cache
docker compose up -d
# MCP будзе на http://localhost:3002/mcp
```

Файлы:
- `Dockerfile` — базавы oven/bun, `bun install`, `bun index.ts`.
- `docker-compose.yml` — порт `3002:3002`, патрэбныя змянныя асяроддзя.
- `deploy.sh` — хуткі білд і запуск.

Калі працуеце камандай, дамоўцеся пра адзін порт і аднолькавыя загалоўкі — зэканоміце час на дыягностыку.

---

### Частыя праблемы і лаканальныя рашэнні
- CORS. Для браўзера дадайце `Access-Control-Allow-*`. Для stateful-сесій — яшчэ і `Access-Control-Expose-Headers: Mcp-Session-Id`.
- Stateless vs Stateful. Тут — stateless. Калі патрэбна памяць/кантэкст, уключайце `sessionIdGenerator` і захоўвайце стан (кэш/БД).
- Знешнія API. Для прыказак/надвор’я закладвайце таймаўты, кэш, ліміты.
- DNS rebinding. На лакальным хосце — белыя спісы `allowedHosts`/`allowedOrigins`.
- Дыягностыка. Пачніце з `curl /healthz` і лагоў; 8 з 10 праблем — у загалоўках або целе запыту.

---

### Як дадаць уласны тул
1) Файл у `tools/` (напрыклад, `tools/mytool.ts`).
2) Апішыце ўваход праз zod і зарэгіструйце тул праз `mcp.registerTool(...)`.
3) Імпартуйце рэгістрацыю ў `index.ts`.

#### Мінімальны шаблон

```ts
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerMyTools(mcp: McpServer) {
  mcp.registerTool(
    'my_tool',
    {
      title: 'my_tool',
      description: 'Што робіць тул',
      inputSchema: { name: z.string() },
    },
    async ({ name }: { name: string }) => {
      return { content: [{ type: 'text', text: `Вітаю, ${name}!` }] };
    },
  );
}
```

Пачніце з простага: тул, які ходзіць у ваш унутраны API і вяртае сціслае рэзюме. Далей — workflow, кэш, аўтэнтыфікацыя.

---

### Дыягностыка і тэставанне
- MCP Inspector — каб хутка праверыць тулы і рэсурсы.
- Лагіруйце ўваходныя параметры і час адказаў — гэта дае празрыстасць.
- Пакрывайце unit-тэстамі бізнес-логіку; MCP-абвязка звычайна тонкая.

---

### Вынікі і што далей

Мы сабралі акуратны MCP-сервер з HTTP-транспартам, дадалі тры наглядныя інструменты, наладзілі CORS і паказалі канфігі для Cursor і GitHub Copilot (VS Code), а таксама Docker-запуск. Наступныя крокі — пашырэнне набору тулаў, аўтэнтыфікацыя, лагаванне, кэш; пры патрэбе — stateful-сесіі і вынас у prod.

Калі гэта вас зачапіла — стварайце свае тулы і дзяліцеся імі з супольнасцю!
Запрашаем далучацца да аўтараў bel-geek.com — будзем разам рабіць разумныя і карысныя рэчы.