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
    const userId = tokenData.user_id

    // 2. Buscar dados do Instagram
    const { data: perfil } = await axios.get(`https://graph.instagram.com/${userId}`, {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: accessToken
      }
    })

    // 3. Salvar no Supabase
    await supabase.from('users').upsert({
      instagram_id: perfil.id,
      instagram_username: perfil.username,
      instagram_account_type: perfil.account_type,
      instagram_media_count: perfil.media_count,
      instagram_token: accessToken
    })

    res.redirect('/?instagram=ok')
  } catch (err) {
    console.error('Erro no login com Instagram:', err.response?.data || err.message)
    res.status(500).send('Erro ao vincular conta do Instagram.')
  }
}
