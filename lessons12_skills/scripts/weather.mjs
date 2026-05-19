#!/usr/bin/env node

const city = process.argv.slice(2).join(" ").trim();

if (!city) {
  console.error('Usage: node scripts/weather.mjs "City"');
  process.exit(1);
}

const encodedCity = encodeURIComponent(city);
const url = `https://wttr.in/${encodedCity}?format=3`;

try {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "codex-weather-skill/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Weather service returned HTTP ${response.status}`);
  }

  const text = (await response.text()).trim();

  if (!text) {
    throw new Error(`Weather service returned empty response for "${city}"`);
  }

  console.log(text);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Cannot fetch weather for "${city}": ${message}`);
  process.exit(1);
}
