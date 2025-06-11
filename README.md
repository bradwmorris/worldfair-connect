# WorldFair Connect

A hack-together social graph for conference attendees—built on Next.js, Supabase, and Vercel.

At the AI World Fair, attendees can sign up, record key takeaways, link ideas to speakers, and connect with others. All data feeds into a distributed "memory"/RAG system over talk transcripts.

---

## 🚀 Live Demo

https://worldfair-connect.vercel.app/

---

## Features

- **Sign Up & Auth:** Email/password and OAuth sign-in, with secure session management.
- **Profile Management:** Edit your name, email, GitHub, Twitter, and upload a profile image.
- **Connections & Notes:** Log connections to people or talks, with summaries and notes, via a chat-like interface powered by OpenAI.
- **Social Graph Map:** Visualize the network of attendees, speakers, and talks with an interactive map (React Flow + D3).
- **Dashboard:** Tabbed dashboard for managing your connections, profile, talks, speakers, attendees, and map.
- **Top Talks:** See the most connected/popular talks on the landing page.
- **RAG-Ready:** Chat interface is designed for future integration with talk transcripts and context-rich retrieval.
- **Tutorial Onboarding:** Step-by-step guides for connecting Supabase, signing up, and fetching data.

---

## 🛠 Tech Stack

- **Next.js 14 (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Supabase (Postgres, Auth, Storage)**
- **OpenAI API** (for embeddings, chat, and RAG)
- **React Flow** (for graph visualization)
- **Vercel** (hosting and preview URLs)

---

## How It Works

- **People Table:** Stores all users/participants with roles, profile info, and avatars.
- **Talks Table:** Stores all talks, each linked to speakers.
- **Connections Table:** Logs user connections to people or talks, with summaries and notes.
- **Talk Speakers Table:** Links talks to their speakers.
- **/map:** Interactive visualization of the event's social graph.
- **/dashboard:** Manage your profile, connections, and see your personalized event map.
- **/chat:** AI-powered interface for reflecting on connections and logging notes.

---

## Getting Started

1. **Clone the repo and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd worldfair-connect
   npm install
   ```
2. **Set up your Supabase project and configure environment variables:**
   - Create a Supabase project at [supabase.com](https://supabase.com/)
   - Copy your Supabase URL and anon key into a `.env.local` file:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be running on [localhost:3000](http://localhost:3000/)

---

## Feedback and Issues

Please file feedback and issues on the [GitHub Issues page](https://github.com/your-org/worldfair-connect/issues).

---
# kms_v1
