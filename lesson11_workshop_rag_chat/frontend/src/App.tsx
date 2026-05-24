import { FormEvent, useMemo, useState } from 'react';
import { askChat, type RetrievedSource } from './api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  usedRag?: boolean;
  usedTool?: string;
  searchQuery?: string;
  expandedQueries?: string[];
  sources?: RetrievedSource[];
}

const starterQuestions = [
  'Што такое zero-shot prompting?',
  'Якія тэхнікі промпт-дызайну ёсць у дакументах?',
  'Як выкарыстоўваць grounding у адказах мадэлі?',
];

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMessages = messages.length > 0;
  const canSubmit = question.trim().length > 0 && !isLoading;

  async function submit(nextQuestion = question) {
    const trimmed = nextQuestion.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion('');
    setError(null);
    setIsLoading(true);

    try {
      const nextMessages = [...messages, userMessage];
      const response = await askChat(
        nextMessages.map((message) => ({
          role: message.role,
          content: message.text,
        }))
      );

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: response.answer,
          usedRag: response.usedRag,
          usedTool: response.trace.usedTool,
          searchQuery: response.searchQuery,
          expandedQueries: response.trace.searchPlan?.expandedQueries,
          sources: response.sources,
        },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Невядомая памылка');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  const sourceCount = useMemo(
    () => messages.reduce((count, message) => count + (message.sources?.length || 0), 0),
    [messages]
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Lesson 11</p>
          <h1>RAG Chat</h1>
        </div>

        <div className="stats">
          <span>{messages.length} messages</span>
          <span>{sourceCount} sources</span>
        </div>

        <div className="quick-list">
          {starterQuestions.map((item) => (
            <button key={item} type="button" onClick={() => void submit(item)} disabled={isLoading}>
              {item}
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-panel" aria-label="RAG chat">
        <div className="messages">
          {!hasMessages && (
            <div className="empty-state">
              <h2>Паўнавартасны чат з RAG-агентам</h2>
              <p>Аркестратар вядзе размову і выклікае пошук па PDF толькі калі гэта патрэбна.</p>
            </div>
          )}

          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <div className="message-label">
                {message.role === 'user' ? 'Вы' : formatToolLabel(message.usedTool, message.usedRag)}
              </div>
              <AnswerText text={message.text} />
              {message.searchQuery && <div className="search-query">search: {message.searchQuery}</div>}
              {message.expandedQueries && message.expandedQueries.length > 1 && (
                <details className="search-query">
                  <summary>expanded queries: {message.expandedQueries.length}</summary>
                  <ul>
                    {message.expandedQueries.map((query) => (
                      <li key={query}>{query}</li>
                    ))}
                  </ul>
                </details>
              )}
              {message.sources && message.sources.length > 0 && (
                <SourceList sources={message.sources} />
              )}
            </article>
          ))}

          {isLoading && (
            <article className="message assistant pending">
              <div className="message-label">RAG</div>
              <p>Думаю і пры патрэбе шукаю ў дакументах...</p>
            </article>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Напішыце пытанне..."
            rows={3}
          />
          <button type="submit" disabled={!canSubmit}>
            Send
          </button>
        </form>
      </section>
    </main>
  );
}

function formatToolLabel(tool?: string, usedRag?: boolean): string {
  if (tool === 'dialect_dictionary_search') return 'Chat + Dialect Dictionary Tool';
  if (tool === 'folk_wisdom_search') return 'Chat + Folk Wisdom Tool';
  if (tool === 'rag_search' || usedRag) return 'Chat + RAG';
  return 'Chat';
}

function AnswerText({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: Array<{ type: 'text'; value: string } | { type: 'ol' | 'ul'; items: string[] }> = [];
  let currentList: { type: 'ol' | 'ul'; items: string[] } | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const olMatch = line.match(/^(\d+)\.\s+([\s\S]+)/);
    const ulMatch = line.match(/^[-•]\s+([\s\S]+)/);

    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        if (currentList) blocks.push(currentList);
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
    } else if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        if (currentList) blocks.push(currentList);
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
    } else {
      if (currentList) { blocks.push(currentList); currentList = null; }
      if (line.trim()) blocks.push({ type: 'text', value: line });
    }
  }
  if (currentList) blocks.push(currentList);

  return (
    <div className="answer-text">
      {blocks.map((block, i) => {
        if (block.type === 'ol') {
          return (
            <ol key={i}>
              {block.items.map((item, j) => <li key={j}>{item}</li>)}
            </ol>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={i}>
              {block.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          );
        }
        return <p key={i}>{(block as { type: 'text'; value: string }).value}</p>;
      })}
    </div>
  );
}

function SourceList({ sources }: { sources: RetrievedSource[] }) {
  return (
    <details className="sources">
      <summary>Крыніцы: {sources.length}</summary>
      <div className="source-items">
        {sources.map((source, index) => (
          <div className="source-item" key={`${source.fileName}-${source.score}-${index}`}>
            <strong>
              {source.fileName || 'unknown.pdf'}
              {source.page ? `, стар. ${source.page}` : ''}
            </strong>
            <span>score {source.score.toFixed(3)}</span>
            <p>{source.text}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
