# Weather By City Skill

Skill атрымлівае актуальнае надвор'е для пазначанага горада праз той самы сэрвіс, што выкарыстоўваўся ў `lesson4_agent`: `https://wttr.in/{city}?format=3`.

## Усталёўка з GitHub праз npx skills

Скіл знаходзіцца ў падпапцы рэпазіторыя, таму выкарыстоўвай GitHub URL да гэтай падпапкі:

```bash
npx skills add https://github.com/bel-frontend/RAG/tree/main/lessons12_skills --skill weather-by-city
```

Калі карыстаешся формай `install`, CLI перанакіроўвае яе на `add`, таму эквівалентная каманда:

```bash
npx skills install https://github.com/bel-frontend/RAG/tree/main/lessons12_skills --skill weather-by-city
```

Праверана праз:

```bash
npx skills add https://github.com/bel-frontend/RAG/tree/main/lessons12_skills --list
```

CLI знаходзіць `weather-by-city`.

Пасля ўсталёўкі скіл павінен спрацоўваць на запыты накшталт:

```text
Пакажы надвор'е ў Мінску
```

## Лакальная ўсталёўка

З кораня рэпазіторыя:

```bash
npx skills add ./lessons12_skills
```

## Лакальная праверка

```bash
node scripts/weather.mjs "Minsk"
```
