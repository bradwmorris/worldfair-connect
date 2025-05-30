import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="max-w-3xl mx-auto py-16 px-4 flex flex-col gap-10">
      <div>
        <h1 className="text-4xl font-bold mb-4">About WorldFair Connect</h1>
        <p className="text-lg mb-2">
          WorldFair Connect is a hack-together social graph for conference attendees—built on Next.js, Supabase, and Vercel.
        </p>
        <p className="mb-2">
          At the AI World Fair, attendees can sign up, record key takeaways, link ideas to speakers, and connect with others. All data feeds into a distributed "memory"/RAG system over talk transcripts.
        </p>
        <p className="mb-2">
          <b>Live Demo:</b> <a href="https://worldfair-connect.vercel.app/" className="text-green-600 underline" target="_blank" rel="noopener noreferrer">https://worldfair-connect.vercel.app/</a>
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Features</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><b>Sign Up & Auth:</b> Email/password and OAuth sign-in, with secure session management.</li>
          <li><b>Profile Management:</b> Edit your name, email, GitHub, Twitter, and upload a profile image.</li>
          <li><b>Connections & Notes:</b> Log connections to people or talks, with summaries and notes, via a chat-like interface powered by OpenAI.</li>
          <li><b>Social Graph Map:</b> Visualize the network of attendees, speakers, and talks with an interactive map (React Flow + D3).</li>
          <li><b>Dashboard:</b> Tabbed dashboard for managing your connections, profile, talks, speakers, attendees, and map.</li>
          <li><b>Top Talks:</b> See the most connected/popular talks on the landing page.</li>
          <li><b>RAG-Ready:</b> Chat interface is designed for future integration with talk transcripts and context-rich retrieval.</li>
          <li><b>Tutorial Onboarding:</b> Step-by-step guides for connecting Supabase, signing up, and fetching data.</li>
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Tech Stack</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Next.js 14 (App Router)</li>
          <li>TypeScript</li>
          <li>Tailwind CSS</li>
          <li>shadcn/ui</li>
          <li>Supabase (Postgres, Auth, Storage)</li>
          <li>OpenAI API (for embeddings, chat, and RAG)</li>
          <li>React Flow (for graph visualization)</li>
          <li>Vercel (hosting and preview URLs)</li>
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">How It Works</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><b>People Table:</b> Stores all users/participants with roles, profile info, and avatars.</li>
          <li><b>Talks Table:</b> Stores all talks, each linked to speakers.</li>
          <li><b>Connections Table:</b> Logs user connections to people or talks, with summaries and notes.</li>
          <li><b>Talk Speakers Table:</b> Links talks to their speakers.</li>
          <li><b>/map:</b> Interactive visualization of the event's social graph.</li>
          <li><b>/dashboard:</b> Manage your profile, connections, and see your personalized event map.</li>
          <li><b>/chat:</b> AI-powered interface for reflecting on connections and logging notes.</li>
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Getting Started</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li>
            <b>Clone the repo and install dependencies:</b>
            <pre className="bg-muted rounded p-2 mt-1 text-sm overflow-x-auto">git clone &lt;your-repo-url&gt;
cd worldfair-connect
npm install</pre>
          </li>
          <li>
            <b>Set up your Supabase project and configure environment variables:</b>
            <ul className="list-disc pl-6 mt-1">
              <li>Create a Supabase project at <a href="https://supabase.com/" className="underline text-green-600" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
              <li>Copy your Supabase URL and anon key into a <code>.env.local</code> file:</li>
            </ul>
            <pre className="bg-muted rounded p-2 mt-1 text-sm overflow-x-auto">NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key</pre>
          </li>
          <li>
            <b>Run the development server:</b>
            <pre className="bg-muted rounded p-2 mt-1 text-sm overflow-x-auto">npm run dev</pre>
            <span>The app will be running on <a href="http://localhost:3000" className="underline text-green-600">localhost:3000</a></span>
          </li>
        </ol>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Feedback and Issues</h2>
        <p>
          Please file feedback and issues on the {" "}
          <a href="https://github.com/your-org/worldfair-connect/issues" className="underline text-green-600" target="_blank" rel="noopener noreferrer">GitHub Issues page</a>.
        </p>
      </div>
    </section>
  );
} 