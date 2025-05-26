import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { user_id, target_person_id, target_talk_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
    }

    const supabase = await createClient();
    let query = supabase.from('connections').select('*').eq('author_person_id', user_id);

    if (target_person_id) {
      query = query.eq('linked_target_person_id', target_person_id);
    }
    if (target_talk_id) {
      query = query.eq('linked_talk_id', target_talk_id);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return new Response(JSON.stringify({ found: false, error: error?.message || 'Not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ found: true, connection: data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid request', details: err instanceof Error ? err.message : err }), { status: 400 });
  }
} 