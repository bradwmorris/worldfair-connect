import { createClient } from "@/utils/supabase/server";
import ConnectMap from "@/components/connect/connect-map";

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
      <div className="border rounded-lg">
        <h2 className="text-xl font-semibold">People</h2>
        {validPeople && validPeople.length > 0 ? (
          <ul>
            {validPeople.map((person) => (
              <li key={person.id}>
                {person.full_name} ({person.labels})
              </li>
            ))}
          </ul>
        ) : (
          <p>No people found.</p>
        )}
      </div>
      <div className="border rounded-lg">
        <h2 className="text-xl font-semibold">Talks</h2>
        {validTalks && validTalks.length > 0 ? (
          <ul>
            {validTalks.map((talk) => (
              <li key={talk.id}>
                <strong>{talk.title}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>No talks found.</p>
        )}
      </div>
    </div>
  );
} 