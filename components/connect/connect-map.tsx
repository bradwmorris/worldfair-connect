'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import * as d3 from 'd3-force';

// Define types for your data
interface Person {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  labels: string | null;
}

interface Talk {
  id: string;
  title: string;
  // person_id and embedded people object are removed
}

interface Connection {
  id: string;
  title: string | null;
  description: string | null;
  author_person_id: string;
  linked_talk_id: string | null;
  linked_target_person_id: string | null;
}

interface TalkSpeaker {
  talk_id: string;
  speaker_person_id: string;
}

interface ConnectMapProps {
  people: Person[];
  talks: Talk[];
  ideas: Connection[];
  talkSpeakers: TalkSpeaker[];
}

const getNodeColor = (label: string | null) => {
  switch (label) {
    case 'speaker':
      return '#FFC107'; // Amber
    case 'rl attendee':
      return '#4CAF50'; // Green
    case 'viewer':
      return '#2196F3'; // Blue
    default:
      return '#9E9E9E'; // Grey
  }
};

const personNodeWidth = 180; // Adjusted for new label style
const personNodeHeight = 170; // Adjusted for new label style
const talkNodeWidth = 220;
const talkNodeHeight = 70; // Approximate
const ideaNodeSize = 100;
const verticalGap = 60;
const horizontalGap = 40;

const ConnectMap: React.FC<ConnectMapProps> = ({ people, talks, ideas, talkSpeakers }) => {
  // Helper: get all talks for a speaker
  function getTalksForSpeaker(personId: string) {
    return talkSpeakers
      .filter(ts => ts.speaker_person_id === personId)
      .map(ts => talks.find(t => t.id === ts.talk_id))
      .filter(Boolean) as Talk[];
  }

  // Helper: get speakers for a talk
  function getSpeakersForTalk(talkId: string) {
    return talkSpeakers
      .filter(ts => ts.talk_id === talkId)
      .map(ts => people.find(p => p.id === ts.speaker_person_id))
      .filter(Boolean) as Person[];
  }

  // Helper: get labels as array
  function getLabels(person: Person) {
    if (Array.isArray(person.labels)) return person.labels;
    if (typeof person.labels === 'string') return [person.labels];
    return [];
  }

  // Helper: get all person-to-person connections
  function getPersonToPersonConnections() {
    return ideas.filter(conn => conn.linked_target_person_id);
  }

  // Helper: get all person-to-talk connections
  function getPersonToTalkConnections() {
    return ideas.filter(conn => conn.linked_talk_id);
  }

  const { nodes, edges } = useMemo(() => {
    // --- Build d3 nodes and links ---
    type ForceNode = d3.SimulationNodeDatum & { id: string };
    type ForceLink = d3.SimulationLinkDatum<ForceNode>;
    const d3Nodes: ForceNode[] = people.map((person) => ({
      id: `person-${person.id}`,
    }));
    // Person-to-person connections
    const d3Links: ForceLink[] = getPersonToPersonConnections().map(conn => ({
      source: `person-${conn.author_person_id}`,
      target: `person-${conn.linked_target_person_id}`,
    }));
    // Person-to-talk connections (as links between people and speakers)
    getPersonToTalkConnections().forEach(conn => {
      const speakers = conn.linked_talk_id ? getSpeakersForTalk(conn.linked_talk_id) : [];
      speakers.forEach(speaker => {
        if (speaker && conn.author_person_id !== speaker.id) {
          d3Links.push({
            source: `person-${conn.author_person_id}`,
            target: `person-${speaker.id}`,
          });
        }
      });
    });

    // --- Run d3-force simulation ---
    const width = 1200, height = 900;
    const simulation = d3.forceSimulation(d3Nodes)
      .force('link', d3.forceLink(d3Links).id((d: any) => d.id).distance(220))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .stop();
    // Run the simulation for a fixed number of ticks
    for (let i = 0; i < 200; ++i) simulation.tick();

    // --- Build React Flow nodes with d3 positions ---
    const allNodes: Node[] = people.map((person) => {
      const d3Node = d3Nodes.find(n => n.id === `person-${person.id}`);
      const x = (d3Node && 'x' in d3Node && typeof d3Node.x === 'number') ? d3Node.x : width / 2;
      const y = (d3Node && 'y' in d3Node && typeof d3Node.y === 'number') ? d3Node.y : height / 2;
      const isSpeaker = getLabels(person).includes('speaker');
      const talksForSpeaker = isSpeaker ? getTalksForSpeaker(person.id) : [];
      return {
        id: `person-${person.id}`,
        type: 'default',
        data: {
          label: (
            <div style={{
              textAlign: 'center',
              padding: '8px',
              position: 'relative',
              filter: isSpeaker ? 'drop-shadow(0 0 8px #FFC107)' : undefined,
              background: isSpeaker ? 'rgba(255, 193, 7, 0.12)' : 'transparent',
              borderRadius: 16,
              border: isSpeaker ? '3px solid #FFC107' : 'none',
              boxShadow: isSpeaker ? '0 4px 16px 0 #FFC10744' : undefined,
              minWidth: 120,
            }}>
              {person.avatar_url && (
                <img
                  src={person.avatar_url}
                  alt={person.full_name || 'User Avatar'}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    border: `3px solid ${isSpeaker ? '#FFC107' : getNodeColor(getLabels(person)[0])}`,
                    marginBottom: '8px',
                    objectFit: 'cover',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
              )}
              <div style={{ fontWeight: 'bold', marginTop: '4px', color: isSpeaker ? '#FFC107' : '#333', textShadow: isSpeaker ? '0 1px 4px #fff' : undefined }}>
                {person.full_name || 'N/A'}
              </div>
              {getLabels(person).map(label => (
                <div key={label} style={{ fontSize: '0.8em', backgroundColor: getNodeColor(label), color: '#fff', padding: '3px 10px', borderRadius: '12px', marginTop: '6px', display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  {label}
                </div>
              ))}
              {/* Speaker's talks as icons */}
              {isSpeaker && talksForSpeaker.length > 0 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                  {talksForSpeaker.map(talk => (
                    <div key={talk.id} style={{ position: 'relative', display: 'inline-block' }}>
                      <span
                        style={{ cursor: 'pointer', fontSize: 22 }}
                        title={talk.title}
                      >
                        {/* Simple talk icon (bubble) */}
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="8" /><path d="M8 16c0 1.5 2 2.5 4 2.5s4-1 4-2.5" fill="none" /></svg>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        },
        position: { x, y },
        style: {
          width: personNodeWidth,
          minHeight: personNodeHeight - 20,
          background: 'transparent',
          border: 'none',
        },
      };
    });

    // Edges: person-to-person connections
    const allEdges: Edge[] = [];
    getPersonToPersonConnections().forEach(conn => {
      allEdges.push({
        id: `edge-person-to-person-${conn.id}`,
        source: `person-${conn.author_person_id}`,
        target: `person-${conn.linked_target_person_id}`,
        type: 'straight',
        style: { stroke: '#2196F3', strokeWidth: 2, strokeDasharray: '6,2' },
        animated: true,
      });
    });
    // Edges: person-to-speaker-of-talk connections
    getPersonToTalkConnections().forEach(conn => {
      const speakers = conn.linked_talk_id ? getSpeakersForTalk(conn.linked_talk_id) : [];
      speakers.forEach(speaker => {
        if (speaker && conn.author_person_id !== speaker.id) {
          allEdges.push({
            id: `edge-person-to-speaker-${conn.id}-${speaker.id}`,
            source: `person-${conn.author_person_id}`,
            target: `person-${speaker.id}`,
            type: 'straight',
            style: { stroke: '#4CAF50', strokeWidth: 2 },
            animated: true,
          });
        }
      });
    });
    return { nodes: allNodes, edges: allEdges };
  }, [people, talks, ideas, talkSpeakers]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Controls />
        <Background gap={20} color="#f0f0f0"/>
      </ReactFlow>
    </div>
  );
};

export default ConnectMap; 