# Weather By City Skill

Skill атрымлівае актуальнае надвор'е для пазначанага горада праз той самы сэрвіс, што выкарыстоўваўся ў `lesson4_agent`: `https://wttr.in/{city}?format=3`.

## Усталёўка праз npx skills

З кораня рэпазіторыя:

```bash
npx skills install ./lessons12_skills
```

Або праз поўны шлях:

```bash
npx skills install /Users/serj/projects/lessons/RAG/lessons12_skills
```

Пасля ўсталёўкі скіл павінен спрацоўваць на запыты накшталт:

```text
Пакажы надвор'е ў Мінску
```

## Лакальная праверка

```bash
node scripts/weather.mjs "Minsk"
```
