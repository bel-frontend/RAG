---
name: weather-by-city
description: Get current weather for a user-specified city by calling the same wttr.in service used in lesson4_agent.
---

# Weather By City

Use this skill when the user asks for current weather in a specific city.

## Workflow

1. Identify the requested city. If the city is missing or ambiguous, ask one short clarifying question.
2. Call the bundled script from this skill directory:

```bash
node scripts/weather.mjs "Minsk"
```

3. Return the script output directly, or translate it briefly if the user requested another language.

## Service

This skill uses the same service pattern as `lesson4_agent`: `https://wttr.in/{city}?format=3`.

## Failure Handling

If the service is unavailable, say that the weather service did not return data and include the city that was requested. Do not invent weather values.
