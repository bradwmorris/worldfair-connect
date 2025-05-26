'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

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
  const { nodes, edges } = useMemo(() => {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    const positionedTalks = new Set<string>();
    let currentY = 20;

    const peopleMap = new Map(people.map(p => [p.id, p]));
    const talksMap = new Map(talks.map(t => [t.id, t]));

    // Helper: get all speakers for a talk
    function getSpeakersForTalk(talkId: string) {
      return talkSpeakers
        .filter(ts => ts.talk_id === talkId)
        .map(ts => peopleMap.get(ts.speaker_person_id))
        .filter(Boolean) as Person[];
    }

    // 1. Layout Speakers and their primary talk directly underneath
    const speakers = people.filter(p => p.labels === 'speaker');
    let speakerX = 20;
    speakers.forEach((speaker, speakerIndex) => {
      // Add speaker node
      allNodes.push({
        id: `person-${speaker.id}`,
        type: 'default',
        data: {
          label: (
            <div style={{ textAlign: 'center', padding: '5px' }}>
              {speaker.avatar_url && (
                <img
                  src={speaker.avatar_url}
                  alt={speaker.full_name || 'User Avatar'}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    border: `3px solid ${getNodeColor(speaker.labels)}`,
                    marginBottom: '8px',
                    objectFit: 'cover',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
              )}
              <div style={{ fontWeight: 'bold', marginTop: '4px', color: '#333' }}>
                {speaker.full_name || 'N/A'}
              </div>
              {speaker.labels && (
                <div style={{
                  fontSize: '0.8em',
                  backgroundColor: getNodeColor(speaker.labels),
                  color: '#fff',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  marginTop: '6px',
                  display: 'inline-block',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {speaker.labels}
                </div>
              )}
            </div>
          )
        },
        position: { x: speakerX, y: currentY },
        style: {
          width: personNodeWidth,
          minHeight: personNodeHeight - 20,
          background: 'transparent',
          border: 'none',
        },
      });

      // Find and position the first talk for this speaker
      const speakerTalkLink = talkSpeakers.find(ts => ts.speaker_person_id === speaker.id);
      if (speakerTalkLink) {
        const talk = talksMap.get(speakerTalkLink.talk_id);
        if (talk && !positionedTalks.has(talk.id)) {
          // Get all speakers for this talk
          const talkSpeakersList = getSpeakersForTalk(talk.id);
          allNodes.push({
            id: `talk-${talk.id}`,
            type: 'output',
            data: { 
              label: (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2em' }}>💬</span>
                    <span>{talk.title}</span>
                  </div>
                  {talkSpeakersList.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: 4 }}>
                      {talkSpeakersList.map(speaker => (
                        speaker.avatar_url ? (
                          <img
                            key={speaker.id}
                            src={speaker.avatar_url}
                            alt={speaker.full_name || 'Speaker'}
                            title={speaker.full_name || ''}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              border: '2px solid #FFC107',
                              objectFit: 'cover',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                            }}
                          />
                        ) : null
                      ))}
                    </div>
                  )}
                </div>
              )
            },
            position: { x: speakerX + (personNodeWidth - talkNodeWidth)/2, y: currentY + personNodeHeight + verticalGap - 20},
            style: {
              border: '2px solid #FFB74D',
              borderRadius: '10px',
              padding: '10px 15px',
              width: talkNodeWidth,
              textAlign: 'left',
              backgroundColor: '#FFF3E0',
              boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
              color: '#424242'
            },
          });
          positionedTalks.add(talk.id);
          allEdges.push({
            id: `edge-speaker-${speaker.id}-to-talk-${talk.id}`,
            source: `person-${speaker.id}`,
            target: `talk-${talk.id}`,
            type: 'straight',
            style: { stroke: '#FFC107', strokeWidth: 2 },
            animated: false,
          });
        }
      }
      speakerX += personNodeWidth + horizontalGap;
    });

    currentY += personNodeHeight + talkNodeHeight + verticalGap * 1.5; // Move Y for next section

    // 2. Layout other people (attendees, viewers)
    const otherPeople = people.filter(p => p.labels !== 'speaker');
    let otherPeopleX = 20;
    otherPeople.forEach((person, index) => {
      allNodes.push({
        id: `person-${person.id}`,
        type: 'default',
        data: { // Re-using the styled label structure
          label: (
            <div style={{ textAlign: 'center', padding: '5px' }}>
              {person.avatar_url && (
                 <img src={person.avatar_url} alt={person.full_name || 'User Avatar'} style={{ width: 60, height: 60, borderRadius: '50%', border: `3px solid ${getNodeColor(person.labels)}`, marginBottom: '8px', objectFit: 'cover', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              )}
              <div style={{ fontWeight: 'bold', marginTop: '4px', color: '#333' }}>
                {person.full_name || 'N/A'}
              </div>
              {person.labels && (
                <div style={{ fontSize: '0.8em', backgroundColor: getNodeColor(person.labels), color: '#fff', padding: '3px 10px', borderRadius: '12px', marginTop: '6px', display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  {person.labels}
                </div>
              )}
            </div>
          )
        },
        position: { x: otherPeopleX + (index % 5) * (personNodeWidth + horizontalGap), y: currentY + Math.floor(index / 5) * (personNodeHeight + verticalGap) },
        style: {
          width: personNodeWidth,
          minHeight: personNodeHeight - 20,
          background: 'transparent',
          border: 'none',
        },
      });
    });
    const otherPeopleRows = Math.ceil(otherPeople.length / 5);
    currentY += otherPeopleRows * (personNodeHeight + verticalGap) + verticalGap;

    // 3. Layout any remaining talks (not positioned under a speaker yet)
    let orphanTalkX = 20;
    talks.forEach((talk, index) => {
      if (!positionedTalks.has(talk.id)) {
        // Get all speakers for this talk
        const talkSpeakersList = getSpeakersForTalk(talk.id);
        allNodes.push({
          id: `talk-${talk.id}`,
          type: 'output',
          data: { 
            label: (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2em' }}>💬</span>
                  <span>{talk.title}</span>
                </div>
                {talkSpeakersList.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: 4 }}>
                    {talkSpeakersList.map(speaker => (
                      speaker.avatar_url ? (
                        <img
                          key={speaker.id}
                          src={speaker.avatar_url}
                          alt={speaker.full_name || 'Speaker'}
                          title={speaker.full_name || ''}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: '2px solid #FFC107',
                            objectFit: 'cover',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                          }}
                        />
                      ) : null
                    ))}
                  </div>
                )}
              </div>
            )
          },
          position: { x: orphanTalkX + (index % 4) * (talkNodeWidth + horizontalGap), y: currentY + Math.floor(index/4) * (talkNodeHeight + verticalGap)},
          style: {
            border: '2px solid #FFB74D',
            borderRadius: '10px',
            padding: '10px 15px',
            width: talkNodeWidth,
            textAlign: 'left',
            backgroundColor: '#FFF3E0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
            color: '#424242'
          },
        });
        positionedTalks.add(talk.id); // Mark as positioned
      }
    });
    const orphanTalkCount = talks.length - speakers.length; // Approximation, assuming most speakers had one talk placed
    const orphanTalkRows = Math.ceil(Math.max(0, orphanTalkCount) / 4);
    currentY += orphanTalkRows * (talkNodeHeight + verticalGap) + verticalGap;

    // 4. Layout Connections (as edges only, no connection nodes)
    ideas.forEach((connection) => {
      // Draw edge from author to talk if linked_talk_id exists
      if (connection.linked_talk_id) {
        allEdges.push({
          id: `edge-connection-${connection.id}`,
          source: `person-${connection.author_person_id}`,
          target: `talk-${connection.linked_talk_id}`,
          animated: true,
          style: { stroke: '#FF9800' },
        });
      }
      // Draw edge from author to target person if linked_target_person_id exists
      if (connection.linked_target_person_id) {
        allEdges.push({
          id: `edge-connection-${connection.id}`,
          source: `person-${connection.author_person_id}`,
          target: `person-${connection.linked_target_person_id}`,
          animated: true,
          style: { stroke: '#42A5F5' },
        });
      }
    });

    // 5. Add remaining speaker edges (e.g., for talks with multiple speakers)
    talkSpeakers.forEach(link => {
      const edgeExists = allEdges.some(edge =>
        (edge.source === `person-${link.speaker_person_id}` && edge.target === `talk-${link.talk_id}`) ||
        (edge.target === `person-${link.speaker_person_id}` && edge.source === `talk-${link.talk_id}`)
      );
      if (!edgeExists) {
        allEdges.push({
          id: `edge-speaker-${link.speaker_person_id}-to-talk-${link.talk_id}-secondary`,
          source: `person-${link.speaker_person_id}`,
          target: `talk-${link.talk_id}`,
          type: 'straight',
          style: { stroke: '#FFC107', strokeWidth: 1.5, strokeDasharray: '4,4' }, // Dashed for secondary speakers
          animated: false,
        });
      }
    });

    return { nodes: allNodes, edges: allEdges };
  }, [people, talks, ideas, talkSpeakers]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }} // Increased padding slightly
      >
        <Controls />
        <Background gap={20} color="#f0f0f0"/>
      </ReactFlow>
    </div>
  );
};

export default ConnectMap; 