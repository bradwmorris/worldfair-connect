import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import ConnectMap from "@/components/connect/connect-map";
import UserProfileForm from "../components/UserProfileForm";
import DashboardSectionTabs from "@/components/dashboard-section-tabs";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch additional user details from the 'people' table
  const { data: person, error: personError } = await supabase
    .from('people')
    .select('*')
    .eq('id', user.id)
    .single();

  if (personError && personError.code !== 'PGRST116') {
    console.error('Error fetching person details:', personError);
  }

  // Fetch all connections, will filter below
  const { data: allConnections, error: connectionsError } = await supabase
    .from('connections')
    .select('*');

  if (connectionsError) {
    console.error('Error fetching connections:', connectionsError);
  }

  // Fetch people, talks, and talk_speakers for the map
  const [
    { data: peopleRaw = [], error: peopleError },
    { data: talksRaw = [], error: talksError },
    { data: talkSpeakersRaw = [], error: talkSpeakersError }
  ] = await Promise.all([
    supabase.from('people').select('*'),
    supabase.from('talks').select('*'),
    supabase.from('talk_speakers').select('*'),
  ]);

  const people = peopleRaw || [];
  const talks = talksRaw || [];
  const talkSpeakers = talkSpeakersRaw || [];

  if (peopleError) {
    console.error('Error fetching people:', peopleError);
  }
  if (talksError) {
    console.error('Error fetching talks:', talksError);
  }
  if (talkSpeakersError) {
    console.error('Error fetching talk_speakers:', talkSpeakersError);
  }

  // Filter connections to only those authored by the current user
  const connections = (allConnections || []).filter(
    (conn) => conn.author_person_id === user.id
  );

  // Group connections by type
  const talkConnections = connections.filter((c) => c.linked_talk_id);
  const personConnections = connections.filter((c) => c.linked_target_person_id && !c.linked_talk_id);

  // Optionally, filter people/talks/talkSpeakers to only those referenced by the user's connections
  const userPeopleIds = new Set([
    ...connections.map((c) => c.author_person_id),
    ...connections.map((c) => c.linked_target_person_id).filter(Boolean),
  ]);
  const userTalkIds = new Set(
    connections.map((c) => c.linked_talk_id).filter(Boolean)
  );

  const filteredPeople = (people || []).filter((p) => userPeopleIds.has(p.id));
  const filteredTalks = (talks || []).filter((t) => userTalkIds.has(t.id));
  const filteredTalkSpeakers = (talkSpeakers || []).filter((ts) => userTalkIds.has(ts.talk_id));

  // Helper for pluralizing connection count
  const connectionCount = connections.length;
  const connectionText = connectionCount === 1 ? 'connection' : 'connections';

  return (
    <div className="flex-1 w-full flex flex-col gap-10 md:gap-16">
      <DashboardSectionTabs
        user={user}
        person={person}
        people={people}
        talks={talks}
        talkSpeakers={talkSpeakers}
        connections={connections}
        talkConnections={talkConnections}
        personConnections={personConnections}
        filteredTalks={filteredTalks}
        filteredTalkSpeakers={filteredTalkSpeakers}
        filteredPeople={filteredPeople}
        connectionCount={connectionCount}
        connectionText={connectionText}
      />
    </div>
  );
} 