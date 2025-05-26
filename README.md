# Worldfair Connect

Worldfair Connect is a modern event mapping and visualization tool built with Next.js and Supabase. It helps organizers, speakers, and attendees see the full landscape of people and talks at a glance.

## Features

- **People Directory:** Browse all participants, with avatars and role labels (speaker, attendee, viewer, etc).
- **Talks Directory:** See all talks, each linked to its speaker.
- **Role Distinction:** Instantly distinguish between speakers, attendees, and viewers with clear visual cues.
- **(Optional) Visual Map:** Interactive node-based map of people and talks (using React Flow), showing connections between speakers and their talks.
- **Supabase Backend:** Real-time, scalable data management for people, talks, and roles.
- **Modern UI:** Built with Next.js App Router, Tailwind CSS, and shadcn/ui for a clean, responsive experience.

## Use Cases

- **Event/Conference Management:** Organizers can manage and visualize the structure of an event, see who is speaking, what talks are scheduled, and how participants are connected.
- **Attendee Discovery:** Attendees can browse the list of speakers and talks, and understand the event's structure at a glance.
- **Speaker Overview:** Speakers can see their own sessions and who else is participating.

## How It Works

- **People Table:** Stores all users/participants with their roles and profile info.
- **Talks Table:** Stores all talks, each linked to a speaker via a foreign key.
- **/connect Page:** The main visualization page, showing all people and talks (optionally as a map, or as lists), with clear separation by role and (optionally) visual connections between speakers and their talks.

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

## Feedback and Issues

Please file feedback and issues on the [GitHub Issues page](https://github.com/your-org/worldfair-connect/issues).

---
