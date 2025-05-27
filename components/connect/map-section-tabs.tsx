"use client";
import { useState } from "react";
import ConnectMap from "./connect-map";
import { Badge } from "@/components/ui/badge";

interface Person {
  id: string;
  full_name?: string | null;
  avatar_url?: string;
  labels?: string[] | string | null;
}
interface Talk {
  id: string;
  title: string;
}
interface Connection {
  id: string;
}
interface TalkSpeaker {
  id: string;
  talk_id: string;
  speaker_person_id: string;
}

interface Props {
  people: Person[];
  talks: Talk[];
  connections: any[];
  talkSpeakers: TalkSpeaker[];
}

const sections = [
  { key: "map", label: "Map" },
  { key: "talks", label: "Talks" },
  { key: "speakers", label: "Speakers" },
  { key: "attendees", label: "Attendees" },
];

function getLabels(person: { labels?: string | string[] | null }) {
  if (Array.isArray(person.labels)) return person.labels;
  if (typeof person.labels === "string") return [person.labels];
  return [];
}

export default function MapSectionTabs({ people, talks, connections, talkSpeakers }: Props) {
  const [active, setActive] = useState("map");

  const speakers = people.filter(p => getLabels(p).includes("speaker"));
  const rlAttendees = people.filter(p => getLabels(p).includes("rl attendee"));

  return (
    <div className="w-full">
      <nav className="flex gap-2 mb-8">
        {sections.map(section => (
          <button
            key={section.key}
            className={`px-4 py-2 rounded-full font-medium border transition-colors ${active === section.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"}`}
            onClick={() => setActive(section.key)}
            type="button"
          >
            {section.label}
          </button>
        ))}
      </nav>
      {active === "map" && (
        <div className="w-full max-w-none" style={{ height: "800px" }}>
          <ConnectMap
            people={people as any}
            talks={talks as any}
            ideas={connections as any}
            talkSpeakers={talkSpeakers as any}
          />
        </div>
      )}
      {active === "talks" && (
        <>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Talks & Speakers</h2>
          {talks.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {talks.map((talk) => {
                const speakerLinks = talkSpeakers.filter(ts => ts.talk_id === talk.id);
                const speakerPeople = speakerLinks.map(ts => people.find(p => p.id === ts.speaker_person_id)).filter(Boolean);
                return (
                  <li
                    key={talk.id}
                    className="rounded-2xl border border-border bg-muted p-6 flex flex-col gap-4 shadow-md min-h-[180px] transition-transform hover:scale-[1.025] hover:shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-xs px-2 py-0.5">Talk</Badge>
                      <span className="text-lg font-semibold text-foreground line-clamp-2 leading-tight">{talk.title}</span>
                    </div>
                    {speakerPeople.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-xs text-muted-foreground font-medium">Speakers:</span>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {speakerPeople.map(speaker =>
                            speaker && speaker.avatar_url ? (
                              <img
                                key={speaker.id}
                                src={speaker.avatar_url}
                                alt={speaker.full_name || 'Speaker'}
                                title={speaker.full_name || ''}
                                className="w-8 h-8 rounded-full border-2 border-border object-cover shadow-sm bg-background"
                              />
                            ) : null
                          )}
                          {speakerPeople.map(speaker => (
                            speaker ? <span key={speaker.id} className="text-sm text-foreground ml-2 font-medium">{speaker.full_name}</span> : null
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
        </>
      )}
      {active === "speakers" && (
        <>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Speakers</h2>
          {speakers.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {speakers.map((person) => (
                <li
                  key={person.id}
                  className="rounded-2xl border border-border bg-muted p-6 flex items-center gap-4 shadow-md min-h-[120px] transition-transform hover:scale-[1.025] hover:shadow-xl"
                >
                  {person.avatar_url && (
                    <img
                      src={person.avatar_url}
                      alt={person.full_name || 'Speaker'}
                      title={person.full_name || ''}
                      className="w-12 h-12 rounded-full border-2 border-border object-cover shadow-sm bg-background"
                    />
                  )}
                  <div className="flex flex-col justify-center">
                    <div className="font-semibold text-base text-foreground leading-tight">{person.full_name}</div>
                    {person.labels && (
                      <div className="text-xs text-muted-foreground mt-1">{Array.isArray(person.labels) ? person.labels.join(', ') : person.labels}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No speakers found.</p>
          )}
        </>
      )}
      {active === "attendees" && (
        <>
          <h2 className="text-2xl font-bold mb-6 text-foreground">RL-Attendees</h2>
          {rlAttendees.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {rlAttendees.map((person) => (
                <li
                  key={person.id}
                  className="rounded-2xl border border-border bg-muted p-6 flex items-center gap-4 shadow-md min-h-[120px] transition-transform hover:scale-[1.025] hover:shadow-xl"
                >
                  {person.avatar_url && (
                    <img
                      src={person.avatar_url}
                      alt={person.full_name || 'Attendee'}
                      title={person.full_name || ''}
                      className="w-12 h-12 rounded-full border-2 border-border object-cover shadow-sm bg-background"
                    />
                  )}
                  <div className="flex flex-col justify-center">
                    <div className="font-semibold text-base text-foreground leading-tight">{person.full_name}</div>
                    {person.labels && (
                      <div className="text-xs text-muted-foreground mt-1">{Array.isArray(person.labels) ? person.labels.join(', ') : person.labels}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No RL-attendees found.</p>
          )}
        </>
      )}
    </div>
  );
} 