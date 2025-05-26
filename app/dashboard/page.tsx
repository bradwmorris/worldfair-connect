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

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <div className="text-sm mb-2">
          <p><strong>ID:</strong> {user.id}</p>
        </div>
        <UserProfileForm person={person} user={user} />
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Your Connections</h2>
        {connections && connections.length > 0 ? (
          <ul className="list-disc pl-5">
            {connections.map((connection) => {
              let typeLabel = null;
              let typeColor = '';
              let typeName = '';
              let avatars = null;
              if (connection.linked_talk_id) {
                typeLabel = 'Talk';
                typeColor = 'bg-orange-500 text-white';
                const talk = (talks || []).find((t) => t.id === connection.linked_talk_id);
                typeName = talk ? talk.title : 'Unknown Talk';
                // Find all speakers for this talk
                const speakerLinks = (talkSpeakers || []).filter(ts => ts.talk_id === connection.linked_talk_id);
                const speakerPeople = speakerLinks.map(ts => (people || []).find(p => p.id === ts.speaker_person_id)).filter(Boolean);
                if (speakerPeople.length > 0) {
                  avatars = (
                    <div className="flex -space-x-2">
                      {speakerPeople.map(speaker =>
                        speaker.avatar_url ? (
                          <img
                            key={speaker.id}
                            src={speaker.avatar_url}
                            alt={speaker.full_name || 'Speaker'}
                            title={speaker.full_name || ''}
                            className="w-7 h-7 rounded-full border-2 border-orange-400 object-cover shadow"
                          />
                        ) : null
                      )}
                    </div>
                  );
                }
              } else if (connection.linked_target_person_id) {
                typeLabel = 'Person';
                typeColor = 'bg-blue-500 text-white';
                const person = (people || []).find((p) => p.id === connection.linked_target_person_id);
                typeName = person ? person.full_name : 'Unknown Person';
                if (person && person.avatar_url) {
                  avatars = (
                    <img
                      src={person.avatar_url}
                      alt={person.full_name || 'Person'}
                      title={person.full_name || ''}
                      className="w-7 h-7 rounded-full border-2 border-blue-400 object-cover shadow"
                    />
                  );
                }
              }
              return (
                <li key={connection.id} className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    {typeLabel && (
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${typeColor}`}>{typeLabel}</span>
                    )}
                    {avatars}
                    {typeName && (
                      <span className="text-sm font-medium text-foreground/80">{typeName}</span>
                    )}
                  </div>
                  <h3 className="font-semibold">{connection.title}</h3>
                  <p className="text-sm text-gray-600">{connection.description}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>You haven't added any connections yet.</p>
        )}
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Connection Map</h2>
        <div style={{ width: '100%', height: '600px' }}>
          <ConnectMap people={people || []} talks={filteredTalks} ideas={connections} talkSpeakers={talkSpeakers || []} />
        </div>
      </div>
    </div>
  );
} 