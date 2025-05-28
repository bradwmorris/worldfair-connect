"use client";
import { useState } from "react";
import ConnectMap from "./connect/connect-map";
import UserProfileForm from "../app/components/UserProfileForm";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

interface DashboardSectionTabsProps {
  user: any;
  person: any;
  people: any[];
  talks: any[];
  talkSpeakers: any[];
  connections: any[];
  talkConnections: any[];
  personConnections: any[];
  filteredTalks: any[];
  filteredTalkSpeakers: any[];
  filteredPeople: any[];
  connectionCount: number;
  connectionText: string;
}

const sections = [
  { key: "connections", label: "connections" },
  { key: "profile", label: "profile" },
  { key: "talks", label: "talks" },
  { key: "speakers", label: "speakers" },
  { key: "attendees", label: "attendees" },
  { key: "map", label: "map" },
];

function getLabels(person: { labels?: string | string[] | null }) {
  if (Array.isArray(person.labels)) return person.labels;
  if (typeof person.labels === "string") return [person.labels];
  return [];
}

function DashboardWelcomeBox({ person, connectionCount, connectionText }: { person: any, connectionCount: number, connectionText: string }) {
  return (
    <div className="w-full mb-8">
      <div className="bg-muted/70 text-base p-4 px-6 rounded-lg text-foreground flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center border border-border shadow-sm">
        <span className="font-semibold text-lg">Hi{person?.full_name ? `, ${person.full_name}` : ''}! Welcome back.</span>
        <span className="text-muted-foreground">You have <span className="font-semibold text-primary">{connectionCount}</span> {connectionText}.</span>
        <a href="/chat" className="ml-0 md:ml-4 text-sm font-bold text-green-600 flex items-center gap-1 hover:text-green-700 transition">
          <PlusCircle className="w-5 h-5 text-green-600" />
          <span>Add more connections now</span>
        </a>
      </div>
    </div>
  );
}

export default function DashboardSectionTabs({
  user,
  person,
  people,
  talks,
  talkSpeakers,
  connections,
  talkConnections,
  personConnections,
  filteredTalks,
  filteredTalkSpeakers,
  filteredPeople,
  connectionCount,
  connectionText,
}: DashboardSectionTabsProps) {
  const [active, setActive] = useState("connections");
  const speakers = people.filter(p => getLabels(p).includes("speaker"));
  const attendees = people.filter(p => getLabels(p).includes("rl attendee"));

  return (
    <div className="w-full">
      <nav className="flex gap-2 mb-8 items-center">
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
      <DashboardWelcomeBox person={person} connectionCount={connectionCount} connectionText={connectionText} />
      {active === "connections" && (
        <div className="w-full">
          <div className="flex flex-col gap-8">
            {/* Talks Group */}
            {talkConnections.length > 0 && (
              <div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Add Connection Card as first card */}
                  <li className="rounded-2xl border-2 border-dashed border-primary bg-card/60 p-6 flex flex-col items-center justify-center gap-3 shadow-md min-h-[180px] hover:bg-primary/10 transition-colors">
                    <Link href="/chat" className="flex flex-col items-center gap-2 group">
                      <PlusCircle className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-primary text-lg group-hover:underline">Add a new connection +</span>
                    </Link>
                  </li>
                  {talkConnections.map((connection) => {
                    const talk = (talks || []).find((t) => t.id === connection.linked_talk_id);
                    const typeName = talk ? talk.title : 'Unknown Talk';
                    const speakerLinks = (talkSpeakers || []).filter(ts => ts.talk_id === connection.linked_talk_id);
                    const speakerPeople = speakerLinks.map(ts => (people || []).find(p => p.id === ts.speaker_person_id)).filter(Boolean);
                    return (
                      <li key={connection.id} className="rounded-2xl border border-border bg-card/80 p-6 flex flex-col justify-between gap-2 shadow-md min-h-[180px] transition-transform hover:scale-[1.025] hover:shadow-xl">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">Talk</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{connection.description}</p>
                        <div className="flex items-end gap-2 mt-2">
                          {speakerPeople.length > 0 && (
                            <div className="flex -space-x-2">
                              {speakerPeople.map(speaker =>
                                speaker.avatar_url ? (
                                  <img
                                    key={speaker.id}
                                    src={speaker.avatar_url}
                                    alt={speaker.full_name || 'Speaker'}
                                    title={speaker.full_name || ''}
                                    className="w-12 h-12 rounded-full border-2 border-orange-300 object-cover shadow flex-shrink-0"
                                  />
                                ) : null
                              )}
                            </div>
                          )}
                          <span className="font-semibold text-base text-foreground/90 line-clamp-2 flex-1">{connection.title}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {/* People Group */}
            {personConnections.length > 0 && (
              <div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {personConnections.map((connection) => {
                    const person = (people || []).find((p) => p.id === connection.linked_target_person_id);
                    const typeName = person ? person.full_name : 'Unknown Person';
                    return (
                      <li key={connection.id} className="rounded-2xl border border-border bg-card/80 p-6 flex flex-col justify-between gap-2 shadow-md min-h-[180px] transition-transform hover:scale-[1.025] hover:shadow-xl">
                        <div className="flex items-center gap-3 mb-1">
                          {(() => {
                            if (person && Array.isArray(person.labels)) {
                              if (person.labels.includes('speaker')) {
                                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">Speaker</span>;
                              }
                              if (person.labels.includes('rl attendee')) {
                                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">RL Attendee</span>;
                              }
                            }
                            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">Person</span>;
                          })()}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{connection.description}</p>
                        <div className="flex items-end gap-2 mt-2">
                          {person && person.avatar_url && (
                            <img
                              src={person.avatar_url}
                              alt={person.full_name || 'Person'}
                              title={person.full_name || ''}
                              className="w-12 h-12 rounded-full border-2 border-border object-cover shadow flex-shrink-0"
                            />
                          )}
                          <span className="font-semibold text-base text-foreground/90 line-clamp-2 flex-1">{connection.title}</span>
                        </div>
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
      )}
      {active === "profile" && (
        <>
          <div className="flex flex-col gap-4 items-start w-full max-w-lg">
            <div className="w-full">
              <UserProfileForm person={person} user={user} />
            </div>
          </div>
        </>
      )}
      {active === "talks" && (
        <>
          {talks.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Prioritize talks with connections */}
              {[
                ...talks.filter(talk => talkConnections.some(conn => conn.linked_talk_id === talk.id)),
                ...talks.filter(talk => !talkConnections.some(conn => conn.linked_talk_id === talk.id)),
              ].map((talk) => {
                const hasConnection = talkConnections.some(conn => conn.linked_talk_id === talk.id);
                const speakerLinks = talkSpeakers.filter(ts => ts.talk_id === talk.id);
                const speakerPeople = speakerLinks.map(ts => people.find(p => p.id === ts.speaker_person_id)).filter(Boolean);
                return (
                  <li
                    key={talk.id}
                    className={`rounded-2xl border border-border bg-muted p-6 flex flex-col gap-4 shadow-md min-h-[180px] transition-transform hover:scale-[1.025] hover:shadow-xl ${hasConnection ? 'border-primary bg-primary/10' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">Talk</span>
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
          {speakers.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Prioritize speakers with connections */}
              {[
                ...speakers.filter(person => personConnections.some(conn => conn.linked_target_person_id === person.id)),
                ...speakers.filter(person => !personConnections.some(conn => conn.linked_target_person_id === person.id)),
              ].map((person) => {
                const hasConnection = personConnections.some(conn => conn.linked_target_person_id === person.id);
                return (
                  <li
                    key={person.id}
                    className={`rounded-2xl border border-border bg-muted p-6 flex items-center gap-4 shadow-md min-h-[120px] transition-transform hover:scale-[1.025] hover:shadow-xl ${hasConnection ? 'border-primary bg-primary/10' : ''}`}
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
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No speakers found.</p>
          )}
        </>
      )}
      {active === "attendees" && (
        <>
          {attendees.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Prioritize attendees with connections */}
              {[
                ...attendees.filter(person => personConnections.some(conn => conn.linked_target_person_id === person.id)),
                ...attendees.filter(person => !personConnections.some(conn => conn.linked_target_person_id === person.id)),
              ].map((person) => {
                const hasConnection = personConnections.some(conn => conn.linked_target_person_id === person.id);
                return (
                  <li
                    key={person.id}
                    className={`rounded-2xl border border-border bg-muted p-6 flex items-center gap-4 shadow-md min-h-[120px] transition-transform hover:scale-[1.025] hover:shadow-xl ${hasConnection ? 'border-primary bg-primary/10' : ''}`}
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
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No attendees found.</p>
          )}
        </>
      )}
      {active === "map" && (
        <div className="w-full">
          <div className="rounded-lg border border-border bg-card/80 shadow-sm p-2 md:p-4" style={{ width: '100%', height: '600px' }}>
            <ConnectMap people={people || []} talks={filteredTalks} ideas={connections} talkSpeakers={talkSpeakers || []} />
          </div>
        </div>
      )}
    </div>
  );
} 