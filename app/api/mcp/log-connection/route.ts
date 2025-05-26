import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { user_id, target_person_id, target_talk_id, summary, chat, title, description } = await req.json();
    console.log('Received log-connection payload:', { user_id, target_person_id, target_talk_id, summary, title, description });
    if (!user_id || (!target_person_id && !target_talk_id) || !summary || !title) {
      console.error('Missing required fields', { user_id, target_person_id, target_talk_id, summary, title });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const supabase = await createClient();
    const payload: any = {
      author_person_id: user_id,
      summary,
      chat_transcript: chat || null,
      title,
      description: description || summary,
    };
    if (target_person_id) payload.linked_target_person_id = target_person_id;
    if (target_talk_id) payload.linked_talk_id = target_talk_id;

    console.log('Inserting connection payload to Supabase:', payload);

    const { data, error } = await supabase
      .from('connections')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log('Connection inserted successfully:', data);
    return new Response(JSON.stringify({ success: true, connection: data }), { status: 200 });
  } catch (err: any) {
    console.error('API route error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
} 