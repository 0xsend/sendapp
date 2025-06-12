import { z } from 'zod'

export const UserSchema = z.object({
  /**
   * Only set if it matches the currently authenticated user
   */
  id: z.string().nullable(),
  /**
   * Profile name
   */
  name: z.string().nullable(),
  /**
   * Profile avatar url
   */
  avatar_url: z.string().nullable(),
  /**
   * Profile send id
   */
  send_id: z.number(),
  /**
   * Confirmed main tag id
   */
  main_tag_id: z.number().nullable(),
  /**
   * Confirmed main tag name
   */
  main_tag_name: z.string().nullable(),
  /**
   * Confirmed sendtags
   */
  tags: z.array(z.string()).nullable().default([]),
})
