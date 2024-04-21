import { createClient } from '@/lib/supabase/server'

export default async function Table() {
  const supabase = createClient()
  const { data: players } = await supabase.from('players').select()

  return <pre>{JSON.stringify(players, null, 2)}</pre>
}
