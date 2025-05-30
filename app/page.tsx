import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { createClient } from "@/utils/supabase/server";
import ConnectMap from "@/components/connect/connect-map";

export default async function Home() {
  // Fetch people data
  const supabase = await createClient();
  const { data: people, error: peopleError } = await supabase
    .from('people')
    .select('*');
  const { data: talks, error: talksError } = await supabase
    .from('talks')
    .select('*');
  const { data: connections, error: connectionsError } = await supabase
    .from('connections')
    .select('*');
  const { data: talkSpeakers, error: talkSpeakersError } = await supabase
    .from('talk_speakers')
    .select('*');

  if (peopleError) {
    console.error('Error fetching people:', peopleError);
  }
  if (talksError) {
    console.error('Error fetching talks:', talksError);
  }
  if (connectionsError) {
    console.error('Error fetching connections:', connectionsError);
  }
  if (talkSpeakersError) {
    console.error('Error fetching talk_speakers:', talkSpeakersError);
  }

  const validPeople = people || [];
  const validTalks = talks || [];
  const validConnections = connections || [];
  const validTalkSpeakers = talkSpeakers || [];

  // Compute top 6 talks by number of related connections
  const talkConnectionCounts = validTalks.map(talk => ({
    talk,
    count: validConnections.filter(conn => conn.linked_talk_id === talk.id).length,
  }));
  const topTalks = talkConnectionCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(tc => tc.talk);

  return (
    <>
      <div className="w-full flex justify-center mt-6">
        <a
          href="https://github.com/bradwmorris/worldfair-connect"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition-colors font-semibold text-base border border-white/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.01-1.05-.015-2.06-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.624-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Contribute on GitHub
        </a>
      </div>
      <Hero />
      <div className="w-full flex flex-col items-center my-8">
        <iframe
          src="https://www.loom.com/embed/88af750c21344234b08e6eb401f8b1f9"
          frameBorder="0"
          allowFullScreen
          style={{ width: '800px', height: '450px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          title="Loom Explainer"
        ></iframe>
      </div>
      <div className="w-full my-10 relative">
        <h2 className="text-2xl font-bold mb-6 text-center">Top Talks</h2>
        {/* SVG connecting lines for visual effect */}
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          width="100%"
          height="100%"
          style={{ left: 0, top: 0, width: '100%', height: '100%' }}
        >
          {/* Dotted lines between cards (for 2 or more talks) */}
          {topTalks.length > 1 && (
            topTalks.map((_, idx) => {
              if (idx === topTalks.length - 1) return null;
              // Calculate positions for lines between cards in a 3-column grid
              const colCount = 3;
              const row1 = Math.floor(idx / colCount);
              const col1 = idx % colCount;
              const row2 = Math.floor((idx + 1) / colCount);
              const col2 = (idx + 1) % colCount;
              // Only connect horizontally or vertically adjacent cards
              if (row1 === row2 && Math.abs(col1 - col2) === 1) {
                // Horizontal neighbor
                return (
                  <line
                    key={`h-${idx}`}
                    x1={`${(col1 + 0.95) * (100 / colCount)}%`}
                    y1={`${(row1 + 0.5) * 180 + 60}`}
                    x2={`${(col2 + 0.05) * (100 / colCount)}%`}
                    y2={`${(row2 + 0.5) * 180 + 60}`}
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeDasharray="6,6"
                    opacity="0.4"
                  />
                );
              }
              if (col1 === col2 && row2 === row1 + 1) {
                // Vertical neighbor
                return (
                  <line
                    key={`v-${idx}`}
                    x1={`${(col1 + 0.5) * (100 / colCount)}%`}
                    y1={`${(row1 + 0.95) * 180 + 60}`}
                    x2={`${(col2 + 0.5) * (100 / colCount)}%`}
                    y2={`${(row2 + 0.05) * 180 + 60}`}
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeDasharray="6,6"
                    opacity="0.4"
                  />
                );
              }
              return null;
            })
          )}
        </svg>
        <ul className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 z-10">
          {topTalks.map((talk) => {
            const speakerLinks = validTalkSpeakers.filter(ts => ts.talk_id === talk.id);
            const speakerPeople = speakerLinks.map(ts => validPeople.find(p => p.id === ts.speaker_person_id)).filter(Boolean);
            return (
              <li
                key={talk.id}
                className="rounded-2xl border border-border bg-muted p-6 flex flex-col gap-4 shadow-md min-h-[180px] transition-transform hover:scale-[1.025] hover:shadow-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">Talk</span>
                  <span className="text-lg font-semibold text-foreground line-clamp-2 leading-tight">{talk.title}</span>
                </div>
                {speakerPeople.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-xs text-muted-foreground font-medium">Speakers:</span>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {speakerPeople.map(speaker =>
                        speaker && speaker.avatar_url ? (
                          <img
                            key={speaker.id}
                            src={speaker.avatar_url}
                            alt={speaker.full_name || 'Speaker'}
                            title={speaker.full_name || ''}
                            className="w-14 h-14 rounded-full border-2 border-border object-cover shadow-sm bg-background"
                          />
                        ) : null
                      )}
                      {speakerPeople.map(speaker => (
                        speaker ? <span key={speaker.id} className="text-sm text-foreground ml-2 font-medium">{speaker.full_name}</span> : null
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
