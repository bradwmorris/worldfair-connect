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

  return (
    <>
      <Hero />
      <div className="w-full my-10" style={{height: '800px'}}>
        <ConnectMap
          people={validPeople}
          talks={validTalks}
          ideas={validConnections}
          talkSpeakers={validTalkSpeakers}
        />
      </div>
    </>
  );
}
