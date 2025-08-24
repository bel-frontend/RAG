# Як стварыць просты MCP-сервер: па кроках на прыкладзе гэтага праекта

Гэты артыкул паказвае, як з нуля запусціць MCP-сервер (Model Context Protocol) з HTTP-транспартам, зарэгістраваць уласныя тулы і падключыць яго да кліента праз `mcp.json`.

— Мы будзем выкарыстоўваць Bun (але код сумяшчальны з Node.js), SDK `@modelcontextprotocol/sdk`, валідацыю параметраў праз `zod`, і некалькі дэма-тулаў: `echo`, прыказкі і надвор’е.

## Што мы будуем

- HTTP-сервер з двума маршрутамі:
  - `GET /healthz` — праверка здароўя сервера.
  - `/mcp` — MCP-эндапоінт (падтрымлівае `GET`, `POST`, `DELETE`).
- MCP-сервер у статлес-рэжыме (без захавання сесій на баку сервера).
- Набор тулаў (інструментаў), даступных праз MCP-кліента:
  - `echo` — вяртае тэкст, які перададзены ва ўводзе.
  - `get_proverb_by_topic` — прыказкі/прымаўкі па тэме з публічнага спісу (з опцыямі `topic`, `random`, `limit`).
  - `get_weather` — кароткі радок з надвор’ем з сэрвісу wttr.in.

## Структура праекта

- `index.ts` — запуск HTTP-сервера і MCP-транспарту, маршруты, CORS, апрацоўка памылак.
- `context.ts` — сховішча кантэксту запыта (AsyncLocalStorage) для `apikey` і `applicationid`.
- `tools/echo.ts` — рэгістрацыя тула `echo`.
- `tools/proverbs.ts` — тул `get_proverb_by_topic` (фетчыць JSON са спісам прыказак).
- `tools/weather.ts` — тул `get_weather` (фетчыць радок з wttr.in).
- `package.json` — залежнасці і скрыпты запуску праз Bun.
- `Dockerfile`, `docker-compose.yml`, `deploy.sh` — кантэйнерызацыя і лакальны запуск у Docker.
- `.vscode/mcp.json` — прыклад канфігурацыі MCP-кліента для падключэння да сервера.

## Асноўныя залежнасці

- `@modelcontextprotocol/sdk` — MCP SDK (сервер + транспарт HTTP/стрэймы).
- `zod` — апісанне і праверка схемы ўваходных параметраў тулаў.
- `undici` — сучасны fetch для Node/Bun (у Bun fetch ужо даступны, але залежнасць ёсць у праекце).

## Архітэктура і паток запыту

1) Ініцыялізуем MCP-сервер

- У `index.ts` ствараецца `new McpServer({ name: 'goman-mcp', version: '0.1.0' })`.

2) Рэгіструем тулы модульна

- `registerEchoTools(mcp)` з `tools/echo.ts`
- `registerProverbTools(mcp)` з `tools/proverbs.ts`
- `registerWeatherTools(mcp)` з `tools/weather.ts`

Кожны тул:
- дае `title`, `description`, `inputSchema` (на `zod`),
- і рэалізацыю-рэспандэр: атрымлівае параметры і вяртае `content` з тэкстам.

3) Наладжваем HTTP-транспарт у статлес-рэжыме

- `new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })` — адключаем генерацыю сесій, кожны запыт незалежны.
- `mcp.connect(transport)` — падключаем MCP да транспарту.

4) HTTP-сервер і маршруты

- CORS і preflight (`OPTIONS`) з загалоўкамі `Access-Control-*`.
- `GET /healthz` — вяртае `{ ok: true, timestamp: ... }`.
- `/mcp` — MCP-эндапоінт:
  - Для `POST` чытаем `JSON` з цела і перадаём у `transport.handleRequest(req, res, parsed)`. Калі парсінг няўдалы — перадаём кіраванне SDK (`handleRequest(req, res)`) без `parsed`.
  - Для `GET` і `DELETE` — таксама праз `transport.handleRequest(req, res)`.
- Загалоўкі `apikey` і `applicationid` апускаем у `AsyncLocalStorage` (`requestContext.run(...)`), каб тулы маглі пры жаданні іх выкарыстоўваць.

5) Апрацоўка памылак і грацыёзнае завяршэнне

- Сігналы `SIGINT`, `SIGTERM`, а таксама `uncaughtException` і `unhandledRejection` закрываюць сервер карэктна.

## Тулы падрабязна

- `echo` (`tools/echo.ts`)
  - Схема: `{ text: string }`
  - Вяртае той жа тэкст.

- `get_proverb_by_topic` (`tools/proverbs.ts`)
  - Схема: `{ topic?: string; random?: boolean; limit?: number <= 200 }`
  - Фетчыць JSON са спісам прыказак, фільтруе па тэме, аддае выпадковыя або першыя `limit` радкоў.
  - Памылкі акуратна перахопліваюцца і вяртаюцца як тэкст.

- `get_weather` (`tools/weather.ts`)
  - Схема: `{ city: string }`
  - Фетчыць кароткі радок з wttr.in: `"Мінск: +22°C ..."`.

## Запуск лакальна (Bun)

Пераканайцеся, што ўсталяваны Bun.

```sh
bun install
bun index.ts
```

Пасля запуску ў логах:
- MCP Streamable HTTP Server on http://localhost:3002/mcp
- Available endpoints: /healthz, /mcp

Праверка здароўя:

```sh
curl -s http://localhost:3002/healthz | jq .
```

## Падключэнне MCP-кліента (mcp.json)

У праекце ёсць прыклад канфігурацыі: `.vscode/mcp.json`.

```jsonc
{
  "servers": {
    "goman-mcp": {
      "type": "http",
      "url": "http://localhost:3002/mcp",
      "headers": {
        "apiKey": "<ваш_api_key>",
        "applicationid": "<ваш_app_id>"
      }
    }
  }
}
```

- Загалоўкі `apiKey` і `applicationid` патрапляюць у `requestContext` і могуць выкарыстоўвацца туламі (калі трэба аўтэнтыфікацыя ці мульці-арэндаванне).
- У статлес-рэжыме дадатковы загаловак `Mcp-Session-Id` не патрабуецца — кожны запыт ізаляваны.

## Запуск у Docker

Каб сабраць і запусціць:

```sh
docker compose build --no-cache
docker compose up -d
```

Пасля гэтага сервер будзе даступны на `http://localhost:3002/mcp`.

Файлы для кантэйнерызацыі:
- `Dockerfile` — на базе `oven/bun`, усталёўвае залежнасці і запускае `bun index.ts`.
- `docker-compose.yml` — пракальчоўвае порт `3002:3002`, усталёўвае `NODE_ENV` і іншыя пераменныя асяроддзя.
- `deploy.sh` — хуткі білд і запуск камандай з двух радкоў.

## Тыповыя праблемы і як іх пазбягаць

- CORS: калі кліент у браўзеры — праверце дазволеныя загалоўкі і метады. У гэтым прыкладзе CORS уключаны для `*`.
- Сесіі: калі патрабуецца стан (сеансы), трэба будзе ўключыць `sessionIdGenerator` і захоўваць стан дзесьці (памяць/кэш/БД). Тут — статлес па змаўчанні.
- Знешнія API: тул з прыказкамі і надвор’ем залежыць ад публічных сэрвісаў. Дадайце таймаўты/кэш, калі плануеце прадакшн.

## Як дадаць свой тул

1) Стварыце файл у `tools/` (напрыклад, `tools/mytool.ts`).
2) Апішыце схему ўваходу праз `zod` і зяргіструйце тул праз `mcp.registerTool(...)`.
3) Імпартуйце і выклічце рэгістрацыю ў `index.ts` побач з іншымі `register*Tools(...)`.

Мінімальны шаблон:

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

## Заключэнне

Мы сабралі працоўны прыклад MCP-сервера з HTTP-транспартам, тлустай падтрымкай CORS, статлес-ідэалогіяй, і трыма дэма-туламі. Далей вы можаце:
- падключыць кліент з вашым `mcp.json`,
- пашырыць набор тулаў,
- дадаць аўтэнтыфікацыю і лагаванне па патрэбе,
- абгортваць у Docker для зручнай пастаўкі.

Крынічныя файлы для старту: `index.ts`, `context.ts`, `tools/*`, `.vscode/mcp.json`.

## Налады MCP для Cursor і VS Code, і як запускаць

Ніжэй — гатовыя прыклады канфігурацый і крокі запуску ў двух папулярных асяроддзях.

### Cursor (.cursor/mcp.json)

1) Стварыце файл `.cursor/mcp.json` у каранёвай дырэкторыі вашага праекта (або ў вашым $HOME, калі хочаце агульнасістэмна).

Прыклад:

```jsonc
{
  "mcpServers": {
    "goman-mcp": {
      "type": "http",
      "url": "http://localhost:3002/mcp",
      "headers": {
        "apiKey": "API_KEY_1234567890",
        "applicationid": "APPLICATION_ID"
      }
    }
  }
}
```

2) Запусціце сервер:

```sh
bun install
bun index.ts
```

3) Адкрыйце Cursor → Settings → MCP Servers і пераканайцеся, што `goman-mcp` падцягнуўся з канфігурацыі і пазначаны як "connected". Калі не бачыце — зрабіце Reload Window у Cursor.

4) Праверце працу ў чат-акне Cursor: папрасіце мадэль выкарыстаць тул, напрыклад: «Выкліч тул get_weather для горада Minsk» або «Выкарыстай get_proverb_by_topic з тэмай “пра працу”». Cursor сам пабудуе выклік MCP-тула па схеме.

Парада: загалоўкі ў канфігурацыі ключоў (`apiKey`, `applicationid`) неадчувальныя да рэгістра пад капотам (Node апускае назвы да ніжняга рэгістра), таму можна пакінуць як у прыкладзе.

### VS Code (.vscode/mcp.json)

VS Code сам па сабе не ўключае убудаваны MCP-кліент, таму выкарыстоўвайце адзін з лёгкіх пашырэнняў-кліентаў. Усталюйце адно з наступных (любое падыдзе):

```vscode-extensions
jasonkneen.mcpsx-run,nickeolofsson.remember-mcp-vscode
```

1) Пакладзіце канфіг у `.vscode/mcp.json` (у гэтым рэпо ўжо ёсць прыклад):

```jsonc
{
  "servers": {
    "goman-mcp": {
      "type": "http",
      "url": "http://localhost:3002/mcp",
      "headers": {
        "apiKey": "API_KEY_1234567890",
        "applicationid": "APPLICATION_ID"
      }
    }
  }
}
```

2) Запусціце MCP-сервер:

```sh
bun install
bun index.ts
```

3) У VS Code: Command Palette → перайдзіце ў секцыю пашырэння (у залежнасці ад выбранага пашырэння гэта можа быць "MCP Servers" або "MCP"), праверце, што `goman-mcp` падключаны.

4) Калі карыстаецеся GitHub Copilot Chat, пашырэнне MCP-кліента дадасць вашы тулы ў пералік даступных. У чат-акне папрасіце: «Выкарыстай тул get_weather з city=Minsk» або «get_proverb_by_topic з random=true, limit=3» — Copilot зойдзецца на MCP-вызоў.

5) Для хуткай праверкі сервера з-за межаў кліента: 

```sh
curl -s http://localhost:3002/healthz | jq .
```

### Заўвагі

- Статлес: сервер працуе без сесій, таму няма неабходнасці ў `Mcp-Session-Id` — кожны запыт незалежны.
- Загалоўкі: у канфігурацыі выкарыстоўвайце `apiKey` і `applicationid`. На баку сервера яны будуць апрацаваныя і даступныя ў `requestContext` для тулаў.
- CORS: уключаны для `*`, таму кліент у браўзеры таксама зможа звязацца.
