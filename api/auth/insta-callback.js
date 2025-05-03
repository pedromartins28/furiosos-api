const axios = require('axios')
const qs = require('querystring')

module.exports = async (req, res) => {
  const { code } = req.query

  if (!code) {
    return res.status(400).send('Código não informado.')
  }

  try {
    const params = {
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code,
    }

    const response = await axios.post(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      qs.stringify(params),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const accessToken = response.data.access_token

    res.redirect(`/?access_token=${accessToken}`)
  } catch (err) {
    console.error('Erro ao trocar code por access token', err.response?.data || err.message)
    res.status(500).send('Erro ao autenticar com Instagram.')
  }
}
