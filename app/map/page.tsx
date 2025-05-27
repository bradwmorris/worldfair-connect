import { createClient } from "@/utils/supabase/server";
import ConnectMap from "@/components/connect/connect-map";
import { Badge } from "@/components/ui/badge";
import MapSectionTabs from "@/components/connect/map-section-tabs";

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

  // Helper to normalize labels to array
  function getLabels(person: { labels: string | string[] | null }) {
    if (Array.isArray(person.labels)) return person.labels;
    if (typeof person.labels === 'string') return [person.labels];
    return [];
  }

  // Split people into speakers and RL-attendees
  const speakers = validPeople.filter(p => getLabels(p).includes('speaker'));
  const rlAttendees = validPeople.filter(p => getLabels(p).includes('rl attendee'));

  return (
    <div className="flex-1 w-full flex flex-col w-full px-0">
      <MapSectionTabs
        people={validPeople}
        talks={validTalks}
        connections={validConnections}
        talkSpeakers={validTalkSpeakers}
      />
    </div>
  );
} 