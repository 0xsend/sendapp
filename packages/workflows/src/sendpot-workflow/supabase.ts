import { supabaseAdmin } from 'app/utils/supabase/admin'
import type { Database } from '@my/supabase/database.types'

export type TemporalTicketPurchase =
  Database['temporal']['Tables']['send_pot_user_ticket_purchases']['Row']
export type TemporalTicketPurchaseInsert =
  Database['temporal']['Tables']['send_pot_user_ticket_purchases']['Insert']
export type TemporalTicketPurchaseUpdate =
  Database['temporal']['Tables']['send_pot_user_ticket_purchases']['Update']

export async function upsertTemporalSendPotTicketPurchases({
  workflow_id,
  status,
  data,
}: TemporalTicketPurchaseInsert) {
  return await supabaseAdmin
    .schema('temporal')
    .from('send_pot_user_ticket_purchases')
    .upsert(
      { workflow_id, status, data },
      {
        onConflict: 'workflow_id',
        ignoreDuplicates: false, // false means do update on conflict
      }
    )
    .select('*')
    .single()
}

export async function updateTemporalSendPotTicketPurchases({
  workflow_id,
  status,
  created_at_block_num,
  data,
}: TemporalTicketPurchaseUpdate) {
  if (!workflow_id)
    throw new Error('Workflow ID is required to update temporal sendpot ticket purchase')
  const payload = {
    status,
  } as TemporalTicketPurchaseUpdate
  if (created_at_block_num) payload.created_at_block_num = created_at_block_num
  if (data) payload.data = data
  return await supabaseAdmin
    .schema('temporal')
    .from('send_pot_user_ticket_purchases')
    .update(payload)
    .eq('workflow_id', workflow_id)
    .select('*')
    .single()
}
