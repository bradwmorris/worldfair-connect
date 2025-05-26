'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useChat, Message } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<'person' | 'talk' | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [awaitingSummary, setAwaitingSummary] = useState(false);
  const [summaryPrompt, setSummaryPrompt] = useState<string | null>(null);
  const [pendingLogData, setPendingLogData] = useState<any>(null);
  const hasLoggedRef = useRef(false);
  const lastSummaryContentRef = useRef('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/sign-in');
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch people or talks from Supabase as user types
  useEffect(() => {
    if (!mode) return;
    if (search.trim() === '') {
      setOptions([]);
      return;
    }
    let active = true;
    const fetchOptions = async () => {
      setSearchLoading(true);
      const supabase = createClient();
      if (mode === 'person') {
        const { data, error } = await supabase
          .from('people')
          .select('id, full_name')
          .ilike('full_name', `%${search}%`)
          .limit(10);
        if (active) setOptions(data ? data.map(p => ({ id: p.id, name: p.full_name })) : []);
      } else if (mode === 'talk') {
        const { data, error } = await supabase
          .from('talks')
          .select('id, title')
          .ilike('title', `%${search}%`)
          .limit(10);
        if (active) setOptions(data ? data.map(t => ({ id: t.id, name: t.title })) : []);
      }
      setSearchLoading(false);
    };
    fetchOptions();
    return () => {
      active = false;
    };
  }, [mode, search]);

  // Memoize system prompt and initial messages based on selection
  const initialMessages = useMemo<Message[]>(() => {
    if (!selected || !mode) return [];
    let systemPrompt = '';
    let assistantPrompt = '';
    if (mode === 'person') {
      systemPrompt = `You are helping the user reflect on a new connection with another person at the event.\nThe person is: ${selected.name}.\nYour job is to extract the nature of the connection, what was most important or memorable about the interaction, and any next steps or follow-ups the user mentions.\nAsk open-ended questions to help the user share details, and summarize the key points at the end.`;
      assistantPrompt = `Let's talk about your connection with ${selected.name}. What stood out to you about this interaction? Feel free to share anything memorable or important, and any next steps you might want to take.`;
    } else {
      systemPrompt = `You are helping the user reflect on a talk they attended.\nThe talk is: ${selected.name}.\nYour job is to extract and distill the core essence of the talk, what the user found most interesting or important, and any actionable insights or next steps.\nAsk open-ended questions to help the user share details, and summarize the key points at the end.`;
      assistantPrompt = `Let's talk about the talk \"${selected.name}\". What did you find most interesting or important? Feel free to share your thoughts, and any actionable insights or next steps.`;
    }
    return [
      { id: 'sys', role: 'system', content: systemPrompt },
      { id: 'init', role: 'assistant', content: assistantPrompt },
    ];
  }, [selected, mode]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    setMessages,
    append,
  } = useChat({
    api: '/api/chat',
    initialMessages,
  });

  // Log connection handler
  async function handleLogConnection() {
    setLogLoading(true);
    setLogSuccess(false);
    setLogError(null);
    try {
      const summaryPromptText =
        mode === 'person'
          ? 'Please summarize the key points of this conversation for logging as a connection with this person.'
          : 'Please summarize the key points of this conversation for logging as a connection with this talk.';
      setSummaryPrompt(summaryPromptText);
      setAwaitingSummary(true);
      setPendingLogData({
        user_id: user.id,
        target_person_id: mode === 'person' ? selected.id : undefined,
        target_talk_id: mode === 'talk' ? selected.id : undefined,
        title: selected.name,
      });
      await append({ role: 'user', content: summaryPromptText });
      // The rest is handled in useEffect
    } catch (err: any) {
      setLogError('Failed to log connection.');
      setLogLoading(false);
    }
  }

  // Watch for assistant summary after summaryPrompt
  useEffect(() => {
    if (!awaitingSummary || !summaryPrompt || hasLoggedRef.current) return;
    // Find the index of the summary prompt in messages
    const summaryPromptIndex = messages.findIndex(
      m => m.role === 'user' && m.content === summaryPrompt
    );
    if (summaryPromptIndex === -1) return;
    // Find the first assistant message after the summary prompt
    const summaryAssistantMsgIndex = messages.findIndex(
      (m, idx) => idx > summaryPromptIndex && m.role === 'assistant'
    );
    if (summaryAssistantMsgIndex === -1) return;
    const summaryAssistantMsg = messages[summaryAssistantMsgIndex];

    // Only proceed if this is the last message in the array
    if (summaryAssistantMsgIndex !== messages.length - 1) return;
    if (!summaryAssistantMsg.content || summaryAssistantMsg.content.trim().length < 40) return;

    // Debounce: only log if the content hasn't changed for 750ms
    if (lastSummaryContentRef.current !== summaryAssistantMsg.content) {
      lastSummaryContentRef.current = summaryAssistantMsg.content;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (
          !hasLoggedRef.current &&
          lastSummaryContentRef.current === summaryAssistantMsg.content &&
          summaryAssistantMsg.content.trim().length >= 40
        ) {
          hasLoggedRef.current = true;
          const summaryMsg = summaryAssistantMsg.content;
          (async () => {
            try {
              console.log('Logging connection with summary:', summaryMsg);
              const res = await fetch('/api/mcp/log-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...pendingLogData,
                  summary: summaryMsg,
                  description: summaryMsg,
                  chat: messages.map(m => ({ role: m.role, content: m.content })),
                }),
              });
              const result = await res.json();
              if (!result.success) throw new Error(result.error || 'Failed to log connection');
              setLogSuccess(true);
              setLogLoading(false);
              setLogError(null);
              chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              console.log('Connection logged successfully:', result.connection);
            } catch (err: any) {
              setLogError('Failed to log connection.');
              setLogLoading(false);
              console.error('Failed to log connection:', err);
            } finally {
              setAwaitingSummary(false);
              setSummaryPrompt(null);
              setPendingLogData(null);
              hasLoggedRef.current = false; // Reset for next time
              lastSummaryContentRef.current = '';
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
              }
            }
          })();
        }
      }, 750);
      return;
    }
    // If content hasn't changed, do nothing (wait for debounce)
    return;
  }, [awaitingSummary, summaryPrompt, messages, pendingLogData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-lg text-gray-500">Checking authentication...</div>
    );
  }

  if (!user) {
    return null; // Redirecting
  }

  // Step 1: Choose mode
  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="text-lg font-semibold mb-2">Start a new connection chat:</div>
        <div className="flex gap-4">
          <Button onClick={() => setMode('person')}>Person</Button>
          <Button onClick={() => setMode('talk')}>Talk</Button>
        </div>
      </div>
    );
  }

  // Step 2: Search and select
  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="text-lg font-semibold mb-2">
          {mode === 'person' ? 'Select a person to connect with:' : 'Select a talk to connect with:'}
        </div>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Type to search ${mode}...`}
          className="w-64"
        />
        <div className="w-64 max-h-48 overflow-y-auto border rounded bg-white">
          {searchLoading ? (
            <div className="p-4 text-gray-400 text-center">Searching...</div>
          ) : options.length === 0 ? (
            <div className="p-4 text-gray-400 text-center">No results</div>
          ) : (
            options.map(opt => (
              <div
                key={opt.id}
                className="p-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0"
                onClick={() => setSelected(opt)}
              >
                {opt.name}
              </div>
            ))
          )}
        </div>
        <Button variant="ghost" onClick={() => setMode(null)}>
          &larr; Back
        </Button>
      </div>
    );
  }

  // Step 3: Show chat UI
  return (
    <div className="flex flex-col h-full max-w-xl mx-auto p-4">
      <div className="mb-4 text-lg font-semibold">
        Chat about your connection with: <span className="text-blue-600">{selected.name}</span>
      </div>
      <div className="flex-1 overflow-y-auto mb-4 border rounded p-4 bg-white min-h-[300px]">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                  msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1"
          disabled={isLoading || logLoading}
        />
        <Button type="submit" disabled={isLoading || logLoading}>Send</Button>
      </form>
      <div className="flex flex-col gap-2 mt-4">
        <Button
          variant="outline"
          onClick={handleLogConnection}
          disabled={logLoading || isLoading || awaitingSummary}
        >
          {logLoading || awaitingSummary ? 'Logging...' : 'Log Connection'}
        </Button>
        {logSuccess && (
          <div className="text-green-600 text-sm">Connection logged successfully!</div>
        )}
        {logError && (
          <div className="text-red-600 text-sm">{logError}</div>
        )}
        {awaitingSummary && (
          <div className="text-blue-600 text-sm">Waiting for summary from assistant...</div>
        )}
      </div>
    </div>
  );
} 