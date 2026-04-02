import { DOMAIN } from 'common/envs/constants'
import { getSupabaseAdmin } from 'shared/init-supabase-admin'

const BUCKET = 'public-images'

export const generateAvatarUrl = async (userId: string, name: string) => {
  const backgroundColors = [
    '#FF8C00',
    '#800080',
    '#00008B',
    '#008000',
    '#A52A2A',
    '#555555',
    '#008080',
  ]
  const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=${encodeURIComponent(
    backgroundColors[Math.floor(Math.random() * backgroundColors.length)]
  )}&color=fff&size=256&format=png`
  try {
    const res = await fetch(imageUrl)
    const buffer = await res.arrayBuffer()
    return await upload(userId, Buffer.from(buffer))
  } catch (e) {
    console.log('error generating avatar', e)
    return `https://${DOMAIN}/images/default-avatar.png`
  }
}

async function upload(userId: string, buffer: Buffer) {
  const supabaseAdmin = getSupabaseAdmin()
  const path = `user-images/${userId}.png`

  // Delete if exists, then upload
  await supabaseAdmin.storage.from(BUCKET).remove([path])

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) {
    throw error
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path)

  return publicUrl
}
