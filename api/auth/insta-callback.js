const axios = require('axios')
const qs = require('querystring')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

module.exports = async (req, res) => {
  const { code, state } = req.query

  if (!code || !state) return res.status(400).send('Código ou usuário não informado.')

  const userId = state

  try {
    const { data: tokenData } = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      qs.stringify({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const accessToken = tokenData.access_token
    const instaUserId = tokenData.user_id

    const { data: perfil } = await axios.get(`https://graph.instagram.com/${instaUserId}`, {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: accessToken
      }
    })

    let extra = {
      biography: null,
      followers_count: null,
      profile_picture_url: null
    }

    try {
      const { data: extraData } = await axios.get(`https://graph.instagram.com/${instaUserId}`, {
        params: {
          fields: 'biography,followers_count,profile_picture_url',
          access_token: accessToken
        }
      })

      extra = {
        biography: extraData.biography || null,
        followers_count: extraData.followers_count || null,
        profile_picture_url: extraData.profile_picture_url || null
      }
    } catch (err) {
      console.warn('Campos extras não disponíveis:', err.response?.data || err.message)
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        instagram_id: perfil.id,
        instagram_username: perfil.username,
        instagram_bio: extra.biography,
        instagram_followers: extra.followers_count,
        instagram_picture: extra.profile_picture_url,
        instagram_token: accessToken
      })
      .eq('id', userId)

    if (updateError) throw updateError

    const { data: postsData } = await axios.get(`https://graph.instagram.com/${instaUserId}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,timestamp',
        access_token: accessToken
      }
    })

    for (const post of postsData.data) {
      await supabase.from('instagram_posts').upsert({
        id: post.id,
        user_id: userId,
        caption: post.caption || null,
        media_type: post.media_type,
        media_url: post.media_url,
        timestamp: post.timestamp,
        like_count: null, 
        comments_count: null 
      })

      try {
        const { data: insightResp } = await axios.get(`https://graph.instagram.com/${post.id}/insights`, {
          params: {
            metric: 'impressions,reach,likes,comments,saved,shares',
            access_token: accessToken
          }
        })

        for (const metric of insightResp.data) {
          await supabase.from('instagram_insights').insert({
            post_id: post.id,
            metric: metric.name,
            value: Array.isArray(metric.values) ? metric.values[0]?.value : metric.value,
            period: metric.period
          })
        }
      } catch (insightErr) {
        console.warn(`Erro ao buscar insights do post ${post.id}:`, insightErr.response?.data || insightErr.message)
      }
    }

    res.redirect('https://furiosos-web.vercel.app/?instagram=ok')
  } catch (err) {
    console.error('Erro no login com Instagram:', err.response?.data || err.message)
    res.status(500).send('Erro ao vincular conta do Instagram.')
  }
}
