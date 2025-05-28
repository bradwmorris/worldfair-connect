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

  // Fetch people and talks from Supabase as user types
  useEffect(() => {
    if (search.trim() === '') {
      setOptions([]);
      return;
    }
    let active = true;
    const fetchOptions = async () => {
      setSearchLoading(true);
      const supabase = createClient();
      // Fetch people (include avatar_url)
      const peoplePromise = supabase
        .from('people')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${search}%`)
        .limit(5);
      // Fetch talks by title (include first speaker's avatar_url, left join)
      const talksPromise = supabase
        .from('talks')
        .select('id, title, talk_speakers(people(avatar_url))')
        .ilike('title', `%${search}%`)
        .limit(5);
      // Fetch talks by speaker name (join talk_speakers, people, talks)
      const talksBySpeakerPromise = supabase
        .rpc('search_talks_by_speaker_name', { search: `%${search}%` });
      // Wait for all
      const [peopleRes, talksRes, talksBySpeakerRes] = await Promise.all([
        peoplePromise,
        talksPromise,
        talksBySpeakerPromise,
      ]);
      if (!active) return;
      // People results
      const people = peopleRes.data
        ? peopleRes.data.map((p: any) => ({ id: p.id, name: p.full_name, avatar_url: p.avatar_url, type: 'person' }))
        : [];
      // Talks by title
      const talks = talksRes.data
        ? talksRes.data.map((t: any) => {
            // Get first speaker's avatar_url if available
            let avatar_url = null;
            if (t.talk_speakers && t.talk_speakers.length > 0 && t.talk_speakers[0].people && t.talk_speakers[0].people.avatar_url) {
              avatar_url = t.talk_speakers[0].people.avatar_url;
            }
            return { id: t.id, name: t.title, type: 'talk', avatar_url };
          })
        : [];
      // Talks by speaker name
      const talksBySpeaker = talksBySpeakerRes.data
        ? talksBySpeakerRes.data.map((row: any) => ({ id: row.talk_id, name: row.title, type: 'talk', avatar_url: row.speaker_avatar_url }))
        : [];
      // Deduplicate talks (by id), prefer one with avatar_url if available
      const allTalksMap = new Map();
      [...talks, ...talksBySpeaker].forEach(talk => {
        if (!allTalksMap.has(talk.id) || (talk.avatar_url && !allTalksMap.get(talk.id).avatar_url)) {
          allTalksMap.set(talk.id, talk);
        }
      });
      const allTalks = Array.from(allTalksMap.values());
      // Deduplicate people (by id)
      const allPeopleMap = new Map();
      people.forEach(person => {
        if (!allPeopleMap.has(person.id)) {
          allPeopleMap.set(person.id, person);
        }
      });
      const allPeople = Array.from(allPeopleMap.values());
      setOptions([...allPeople, ...allTalks]);
      setSearchLoading(false);
    };
    fetchOptions();
    return () => {
      active = false;
    };
  }, [search]);

  // Memoize system prompt and initial messages based on selection
  const initialMessages = useMemo<Message[]>(() => {
    if (!selected) return [];
    let systemPrompt = '';
    let assistantPrompt = '';
    if (selected.type === 'person') {
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
  }, [selected]);

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
        selected.type === 'person'
          ? 'Please summarize the key points of this conversation for logging as a connection with this person.'
          : 'Please summarize the key points of this conversation for logging as a connection with this talk.';
      setSummaryPrompt(summaryPromptText);
      setAwaitingSummary(true);
      setPendingLogData({
        user_id: user.id,
        target_person_id: selected.type === 'person' ? selected.id : undefined,
        target_talk_id: selected.type === 'talk' ? selected.id : undefined,
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

  // Step 1: Search and select
  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          search for a talk, a speaker or an attendee to generate a new connection
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Type to search people or talks..."
          className={`w-full max-w-2xl text-2xl px-8 py-6 rounded-full border-none outline-none shadow-lg transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white/80 dark:bg-zinc-900/80 animate-pulse-search ${search ? '' : 'ring-2 ring-primary/40'}`}
          style={{ background: undefined, boxShadow: '0 4px 32px 0 rgba(34,197,94,0.08)' }}
          autoFocus
        />
        <div className="w-full max-w-2xl max-h-64 overflow-y-auto rounded-xl bg-white/80 dark:bg-zinc-900/80 shadow-lg mt-2">
          {searchLoading ? (
            <div className="p-4 text-gray-400 text-center">Searching...</div>
          ) : options.length === 0 ? (
            null
          ) : (
            options.map(opt => (
              <div
                key={opt.type + '-' + opt.id}
                className={`p-4 flex items-center gap-3 hover:bg-blue-100 hover:dark:bg-zinc-800 cursor-pointer text-gray-900 dark:text-gray-100 transition-all duration-150`}
                onClick={() => setSelected(opt)}
              >
                {opt.type === 'person' ? (
                  <>
                    {opt.avatar_url ? (
                      <img
                        src={opt.avatar_url}
                        alt={opt.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-300 shadow"
                      />
                    ) : (
                      <span className="inline-block w-10 h-10 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-lg">👤</span>
                    )}
                  </>
                ) : (
                  opt.avatar_url ? (
                    <img
                      src={opt.avatar_url}
                      alt={opt.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-300 shadow"
                    />
                  ) : (
                    <span className="inline-block w-10 h-10 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-lg">📖</span>
                  )
                )}
                <span className="text-xl font-medium">{opt.name}</span>
                <span className="ml-auto text-sm px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">{opt.type}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Step 2: Show chat UI
  if (logSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-green-100 dark:bg-green-900/80 border border-green-300 dark:border-green-700 text-green-900 dark:text-green-100 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-green-600 dark:text-green-300 mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <div className="text-2xl font-semibold mb-2">Connection logged successfully!</div>
          <div className="text-base text-green-800 dark:text-green-200 mb-4 text-center">Your conversation has been saved. Would you like to create another connection?</div>
          <Button
            onClick={() => {
              setSelected(null);
              setMessages([]);
              setLogSuccess(false);
              setLogError(null);
              setAwaitingSummary(false);
              setSummaryPrompt(null);
              setPendingLogData(null);
              hasLoggedRef.current = false;
              lastSummaryContentRef.current = '';
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
              }
            }}
            className="rounded-full bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold shadow"
          >
            Start New Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <div className="flex-1 flex flex-col w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-10 text-center">
              {`What's on your mind about ${selected.name}?`}
            </div>
            {/* Input box for first message */}
            <form className="w-full max-w-2xl flex items-center gap-2 bg-transparent" onSubmit={handleSubmit}>
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 rounded-full border-none bg-zinc-800 dark:bg-zinc-800 text-gray-100 px-6 py-5 min-h-[56px] text-base focus:ring-0 focus:outline-none shadow-none"
                disabled={isLoading || logLoading}
                autoFocus
              />
              <Button type="submit" disabled={isLoading || logLoading} className="rounded-full bg-green-600 hover:bg-green-700 text-white p-0 w-12 h-12 flex items-center justify-center shadow-none border-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-7.5-15-7.5v6l10 1.5-10 1.5v6z" />
                </svg>
              </Button>
            </form>
          </div>
        ) : (
          <>
            {/* Attention banner for logging connection */}
            <div className="w-full max-w-2xl mx-auto flex items-center gap-4 mb-4 px-4 py-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/80 border border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-yellow-600 dark:text-yellow-300 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 3.75h.008v.008H12v-.008zm9.003-2.625a9 9 0 11-18.002 0 9 9 0 0118.002 0z" />
              </svg>
              <div className="flex-1 text-base font-medium">
                Don't forget to <span className="font-bold text-yellow-800 dark:text-yellow-200">log your connection</span> to save this conversation.
              </div>
              <Button
                variant="outline"
                onClick={handleLogConnection}
                disabled={logLoading || isLoading || awaitingSummary}
                className="rounded-2xl flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white border-none transition-colors font-semibold shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 8.25V6a3.75 3.75 0 00-7.5 0v2.25m11.25 3v6a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 17.25v-6m16.5 0V12m0-1.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 10.5V12m16.5 0h-19" />
                </svg>
                Log Connection
              </Button>
            </div>
            {/* Status messages for logging */}
            <div className="w-full max-w-2xl mx-auto px-4">
              {logSuccess && (
                <div className="text-green-600 text-sm mt-1">Connection logged successfully!</div>
              )}
              {logError && (
                <div className="text-red-600 text-sm mt-1">{logError}</div>
              )}
              {awaitingSummary && (
                <div className="text-blue-600 text-sm mt-1">Waiting for summary from assistant...</div>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-6 px-2 sm:px-0 py-10 overflow-y-auto">
              {messages.filter(msg => msg.role !== 'system').map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="px-6 py-3 rounded-full max-w-2xl break-words text-base bg-green-500/70 dark:bg-green-600/70 text-white/90 shadow-sm" style={{padding: '12px 24px', backdropFilter: 'blur(2px)'}}>
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-2xl break-words text-base text-gray-900 dark:text-gray-100" style={{padding: '12px 0', marginLeft: '4px', marginRight: '4px'}}>
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Input box pinned to bottom */}
            <form className="w-full max-w-2xl mx-auto flex items-center gap-2 pb-8 px-2 sm:px-0" onSubmit={handleSubmit} style={{position: 'sticky', bottom: 0, background: 'inherit', zIndex: 10}}>
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 rounded-full border-none bg-zinc-800 dark:bg-zinc-800 text-gray-100 px-6 py-5 min-h-[56px] text-base focus:ring-0 focus:outline-none shadow-none"
                disabled={isLoading || logLoading}
                autoFocus
              />
              <Button type="submit" disabled={isLoading || logLoading} className="rounded-full bg-green-600 hover:bg-green-700 text-white p-0 w-12 h-12 flex items-center justify-center shadow-none border-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-7.5-15-7.5v6l10 1.5-10 1.5v6z" />
                </svg>
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
} 