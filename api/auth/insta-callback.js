// api/insta-callback.js

const axios = require('axios')
const qs = require('querystring')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

module.exports = async (req, res) => {
  const { code } = req.query

  if (!code) return res.status(400).send('Código não informado.')

  try {
    // 1. Trocar code por token
    const { data: tokenData } = await axios.post(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      qs.stringify({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const accessToken = tokenData.access_token

    // 2. Obter ID da conta do usuário
    const { data: meData } = await axios.get(`https://graph.facebook.com/me?fields=id&access_token=${accessToken}`)
    const userId = meData.id

    // 3. Pegar página vinculada ao usuário
    const { data: pageData } = await axios.get(`https://graph.facebook.com/${userId}/accounts?access_token=${accessToken}`)
    const pageId = pageData.data[0]?.id

    // 4. Pegar conta IG vinculada
    const { data: igData } = await axios.get(`https://graph.facebook.com/${pageId}?fields=instagram_business_account&access_token=${accessToken}`)
    const igUserId = igData.instagram_business_account?.id

    if (!igUserId) throw new Error('Conta Instagram não vinculada.')

    // 5. Buscar dados do Instagram
    const { data: perfil } = await axios.get(`https://graph.facebook.com/${igUserId}?fields=username,biography,followers_count,profile_picture_url&access_token=${accessToken}`)

    // 6. Salvar no Supabase
    await supabase.from('users').upsert({
      instagram_id: igUserId,
      instagram_username: perfil.username,
      instagram_bio: perfil.biography,
      instagram_followers: perfil.followers_count,
      instagram_picture: perfil.profile_picture_url,
      instagram_token: accessToken // opcional
    })

    // 7. Redirecionar para a aplicação
    res.redirect('/?instagram=ok')
  } catch (err) {
    console.error('Erro no login com Instagram:', err.response?.data || err.message)
    res.status(500).send('Erro ao vincular conta do Instagram.')
  }
}
