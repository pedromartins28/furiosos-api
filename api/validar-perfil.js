const axios = require('axios')
const cheerio = require('cheerio')
const { OpenAI } = require('openai')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { url, interesses } = req.body

  if (!url || !interesses || !Array.isArray(interesses)) {
    return res.status(400).json({ erro: 'URL e interesses (array) são obrigatórios.' })
  }

  try {

    const { data: html } = await axios.get(url, { timeout: 10000 }) // 10s timeout

    const $ = cheerio.load(html)
    const textoBruto = $('body').text().slice(0, 4000)

    const prompt = `O usuário possui os seguintes interesses: ${interesses.join(', ')}.
Abaixo está o conteúdo de um link enviado pelo usuário. Verifique se há relação clara com os interesses mencionados.

Texto:
"""${textoBruto}"""

Responda apenas com "relevante" ou "irrelevante".`

    const resposta = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: [{ role: 'user', content: prompt }]
    })

    const output = resposta.choices[0].message.content.trim().toLowerCase()
    const relevante = output.includes('relevante')

    return res.status(200).json({ url, relevante })
  } catch (erro) {
    return res.status(500).json({ erro: 'Erro ao processar link.' })
  }
}