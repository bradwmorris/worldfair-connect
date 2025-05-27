import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import ConnectMap from "@/components/connect/connect-map";
import UserProfileForm from "../components/UserProfileForm";

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
    { data: people = [], error: peopleError },
    { data: talks = [], error: talksError },
    { data: talkSpeakers = [], error: talkSpeakersError }
  ] = await Promise.all([
    supabase.from('people').select('*'),
    supabase.from('talks').select('*'),
    supabase.from('talk_speakers').select('*'),
  ]);

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
      {/* Intro message */}
      <div className="w-full">
        <div className="bg-muted/70 text-base p-4 px-6 rounded-lg text-foreground flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center border border-border shadow-sm">
          <span className="font-semibold text-lg">Hi{person?.full_name ? `, ${person.full_name}` : ''}! Welcome back.</span>
          <span className="text-muted-foreground">You have <span className="font-semibold text-primary">{connectionCount}</span> {connectionText}.</span>
          <a href="/chat" className="ml-0 md:ml-4 text-sm text-primary underline hover:text-primary/80 transition">Add more connections here</a>
        </div>
      </div>
      {/* User details card */}
      <div className="flex flex-col gap-4 items-start w-full max-w-lg">
        <h2 className="font-bold text-2xl mb-2 text-foreground/90">Your user details</h2>
        <div className="w-full">
          <UserProfileForm person={person} user={user} />
        </div>
      </div>
      {/* Connections Section */}
      <div className="w-full">
        <h2 className="font-bold text-2xl mb-4 text-foreground/90">Your Connections</h2>
        <div className="flex flex-col gap-8">
          {/* Talks Group */}
          {talkConnections.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-orange-700/90">Talks</h3>
              <ul className="flex flex-col gap-4">
                {talkConnections.map((connection) => {
                  const talk = (talks || []).find((t) => t.id === connection.linked_talk_id);
                  const typeName = talk ? talk.title : 'Unknown Talk';
                  const speakerLinks = (talkSpeakers || []).filter(ts => ts.talk_id === connection.linked_talk_id);
                  const speakerPeople = speakerLinks.map(ts => (people || []).find(p => p.id === ts.speaker_person_id)).filter(Boolean);
                  return (
                    <li key={connection.id} className="rounded-lg border border-border bg-card/80 p-4 flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">Talk</span>
                        {speakerPeople.length > 0 && (
                          <div className="flex -space-x-2">
                            {speakerPeople.map(speaker =>
                              speaker.avatar_url ? (
                                <img
                                  key={speaker.id}
                                  src={speaker.avatar_url}
                                  alt={speaker.full_name || 'Speaker'}
                                  title={speaker.full_name || ''}
                                  className="w-7 h-7 rounded-full border-2 border-orange-300 object-cover shadow"
                                />
                              ) : null
                            )}
                          </div>
                        )}
                        <span className="text-sm font-medium text-foreground/80">{typeName}</span>
                      </div>
                      <h4 className="font-semibold text-base text-foreground/90">{connection.title}</h4>
                      <p className="text-sm text-muted-foreground">{connection.description}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {/* People Group */}
          {personConnections.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-700/90">People</h3>
              <ul className="flex flex-col gap-4">
                {personConnections.map((connection) => {
                  const person = (people || []).find((p) => p.id === connection.linked_target_person_id);
                  const typeName = person ? person.full_name : 'Unknown Person';
                  return (
                    <li key={connection.id} className="rounded-lg border border-border bg-card/80 p-4 flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">Person</span>
                        {person && person.avatar_url && (
                          <img
                            src={person.avatar_url}
                            alt={person.full_name || 'Person'}
                            title={person.full_name || ''}
                            className="w-7 h-7 rounded-full border-2 border-blue-300 object-cover shadow"
                          />
                        )}
                        <span className="text-sm font-medium text-foreground/80">{typeName}</span>
                      </div>
                      <h4 className="font-semibold text-base text-foreground/90">{connection.title}</h4>
                      <p className="text-sm text-muted-foreground">{connection.description}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {talkConnections.length === 0 && personConnections.length === 0 && (
            <p className="text-muted-foreground">You haven't added any connections yet.</p>
          )}
        </div>
      </div>
      {/* Connection Map */}
      <div className="w-full">
        <h2 className="font-bold text-2xl mb-4 text-foreground/90">Connection Map</h2>
        <div className="rounded-lg border border-border bg-card/80 shadow-sm p-2 md:p-4" style={{ width: '100%', height: '600px' }}>
          <ConnectMap people={people || []} talks={filteredTalks} ideas={connections} talkSpeakers={talkSpeakers || []} />
        </div>
      </div>
    </div>
  );
} 