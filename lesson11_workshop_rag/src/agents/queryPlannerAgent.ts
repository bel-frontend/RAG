import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { chatModel } from '../../../common/model';
import { config } from '../config';
import {
  SearchPlanSchema,
  type ChatMessage,
  type SearchPlan,
  type ToolName,
} from './schemas';
import { parseStructuredOutput, schemaInstruction } from './json';

const PLANNER_SYSTEM_PROMPT = [
  'You are a query planning agent for a Belarusian RAG workshop.',
  'Your job is to understand the user request before retrieval.',
  'Extract the core idea, choose the best search tool, and generate expanded search queries.',
  'Use dialect_dictionary_search for Vusacki Slovazbor, Ryhor Baradulin, dialect words, meanings, local expressions, curses, threats, гразьбы, праклёны, sections from the first book.',
  'Use intent dialect_section_lookup when the user asks for a full section, list, all items, continuation, or a title-like query such as Устойлівыя выразы, Прыкметы, Стравы, Лекаванне.',
  'Use folk_wisdom_search for proverbs, sayings, aphorisms, народныя мудрасці, прыказкі, прымаўкі across the collection.',
  'Use rag_search for general document lookup.',
  'Use chat only for greetings or conversation that does not need documents.',
  'Expanded queries should include synonyms, likely section titles, spelling variants, and short exact phrases.',
].join(' ');

export class QueryPlannerAgent {
  async plan(messages: ChatMessage[], latestQuestion: string, fallbackTool: ToolName): Promise<SearchPlan> {
    const model = await chatModel(config.chat.model, {
      ollamaUrl: config.chat.ollamaUrl,
    });

    const response = await model.invoke([
      new SystemMessage(PLANNER_SYSTEM_PROMPT),
      new SystemMessage(
        schemaInstruction(
          'SearchPlan',
          '{"intent":"direct_chat|general_rag|folk_wisdom|dialect_definition|dialect_section_lookup|exact_phrase","coreQuery":"string","expandedQueries":["string"],"targetBook":"any|vushatski_slovazbor|proverbs_dictionary","tool":"chat|rag_search|folk_wisdom_search|dialect_dictionary_search","reason":"string"}'
        )
      ),
      new HumanMessage(
        JSON.stringify({
          latestQuestion,
          fallbackTool,
          recentMessages: messages.slice(-8),
        })
      ),
    ]);

    return normalizePlan(
      parseStructuredOutput(response.content, SearchPlanSchema, fallbackPlan(latestQuestion, fallbackTool))
    );
  }
}

export function fallbackPlan(query: string, tool: ToolName): SearchPlan {
  return normalizePlan({
    intent: fallbackIntent(query, tool),
    coreQuery: query,
    expandedQueries: [query],
    targetBook: tool === 'dialect_dictionary_search' ? 'vushatski_slovazbor' : 'any',
    tool,
    reason: 'Fallback search plan.',
  });
}

function fallbackIntent(query: string, tool: ToolName): SearchPlan['intent'] {
  if (
    tool === 'dialect_dictionary_search' &&
    /(раздзел|спіс|усе|увесь|цалкам|устойлів[\p{L}]*\s+выраз|прыкмет|звыча|страв|лекаван|пытан|вокліч)/iu.test(query)
  ) {
    return 'dialect_section_lookup';
  }

  return intentForTool(tool);
}

function normalizePlan(plan: SearchPlan): SearchPlan {
  const expandedQueries = [...new Set([plan.coreQuery, ...plan.expandedQueries].map((item) => item.trim()))]
    .filter(Boolean)
    .slice(0, 12);

  return {
    ...plan,
    targetBook: plan.targetBook || 'any',
    expandedQueries: expandedQueries.length ? expandedQueries : [plan.coreQuery],
  };
}

function intentForTool(tool: ToolName): SearchPlan['intent'] {
  if (tool === 'dialect_dictionary_search') return 'dialect_definition';
  if (tool === 'folk_wisdom_search') return 'folk_wisdom';
  if (tool === 'chat') return 'direct_chat';
  return 'general_rag';
}
