import { createClient } from "@/utils/supabase/server";
import ConnectMap from "@/components/connect/connect-map";
import { Badge } from "@/components/ui/badge";

export default async function MapPage() {
  const supabase = await createClient();

  // Fetch people data
  const { data: people, error: peopleError } = await supabase
    .from('people')
    .select('*');

  // Fetch talks data
  const { data: talks, error: talksError } = await supabase
    .from('talks')
    .select('*');

  // Fetch connections data
  const { data: connections, error: connectionsError } = await supabase
    .from('connections')
    .select('*');

  // Fetch talk_speakers data
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

  // Ensure data are not null before passing to the component
  const validPeople = people || [];
  const validTalks = talks || [];
  const validConnections = connections || [];
  const validTalkSpeakers = talkSpeakers || [];

  return (
    <div className="flex-1 w-full flex flex-col w-full">
      <h1 className="text-3xl font-bold">Map</h1>
      {/* Visual map section */}
      <div className="w-full" style={{height: '800px'}}>
        <ConnectMap
          people={validPeople}
          talks={validTalks}
          ideas={validConnections}
          talkSpeakers={validTalkSpeakers}
        />
      </div>
      {/* Talks with Speakers */}
      <div className="border border-border rounded-lg bg-card p-6 my-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Talks & Speakers</h2>
        {validTalks.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {validTalks.map((talk) => {
              // Find speakers for this talk
              const speakerLinks = validTalkSpeakers.filter(ts => ts.talk_id === talk.id);
              const speakerPeople = speakerLinks.map(ts => validPeople.find(p => p.id === ts.speaker_person_id)).filter(Boolean);
              return (
                <li key={talk.id} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-3 mb-1">
                    <Badge variant="outline">Talk</Badge>
                    <span className="text-lg font-semibold text-foreground">{talk.title}</span>
                  </div>
                  {speakerPeople.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground mr-2">Speakers:</span>
                      <div className="flex -space-x-2">
                        {speakerPeople.map(speaker =>
                          speaker.avatar_url ? (
                            <img
                              key={speaker.id}
                              src={speaker.avatar_url}
                              alt={speaker.full_name || 'Speaker'}
                              title={speaker.full_name || ''}
                              className="w-7 h-7 rounded-full border-2 border-border object-cover shadow"
                            />
                          ) : null
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 ml-2">
                        {speakerPeople.map(speaker => (
                          <span key={speaker.id} className="text-sm text-foreground">{speaker.full_name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground">No talks found.</p>
        )}
      </div>
      {/* People List */}
      <div className="border border-border rounded-lg bg-card p-6 my-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-foreground">People</h2>
        {validPeople.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {validPeople.map((person) => (
              <li key={person.id} className="rounded-lg border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
                {person.avatar_url && (
                  <img
                    src={person.avatar_url}
                    alt={person.full_name || 'Person'}
                    title={person.full_name || ''}
                    className="w-10 h-10 rounded-full border-2 border-border object-cover shadow"
                  />
                )}
                <div>
                  <div className="font-semibold text-base text-foreground">{person.full_name}</div>
                  {person.labels && (
                    <div className="text-xs text-muted-foreground">{person.labels}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No people found.</p>
        )}
      </div>
    </div>
  );
} 