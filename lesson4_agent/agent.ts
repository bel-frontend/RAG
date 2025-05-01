import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { DynamicTool } from "langchain/tools";
import { chatModel } from "./ollama";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
// import {  } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";


const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch error ${res.status}`);
  return res.json();
};

const fetchText = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch error ${res.status}`);
  return res.text();
};

// 📦 Інструмент 1: надвор'е
const weatherTool = tool(
  async ({ city }: { city: string }) => {
    const  res = await fetchText(`https://wttr.in/${city}?format=3`);
    console.log(res);
    console.log(z.object({ city: z.string() }));
    
    return res || "Cannot find weather.";
  },
  {
    name: "get_weather",
    description: "Get current weather for a given city",
    schema: z.object({ city: z.string() }),  // выкарыстоўваецца для валідацыі
  }
);

// 📦 Інструмент 2: курс валют
const exchangeTool = tool(
  async ({ from, to }: { from: string; to: string }) => {
   ;
    const rate = 3.8 // = data.rates?.[to];
    return rate ? `1 ${from} = ${rate} ${to}` : "Cannot find rate.";
  },
  {
    name: "get_exchange_rate",
    description: "Get currency exchange rate, e.g., USD to EUR",
    schema: z.object({ from: z.string(), to: z.string() }),
  }
);




  const model = await chatModel("llama3.2");

  export const agentApp = createReactAgent({
    llm:model,
    tools: [weatherTool, exchangeTool],
    messageModifier: new SystemMessage("Ты разумны памочнік. Адказвай зразумела і каротка."),
  });
