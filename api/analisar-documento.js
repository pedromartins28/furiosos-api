const { IncomingForm } = require('formidable')
const fs = require('fs')
const { analisarDocumentoComGoogleVision } = require('../vision')

module.exports = (req, res) => {
  // CORS SEMPRE no topo
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const form = new IncomingForm()

  form.parse(req, async (err, fields, files) => {

    if (err) {
      res.status(500).json({ erro: 'Erro ao processar formulário.' })
      return
    }

    try {
      const nome = fields.nome?.[0]
      const cpf = fields.cpf?.[0]
      const file = files.file?.[0]      

      if (!file || !file.filepath) {
        return res.status(400).json({ erro: 'Arquivo não enviado.' })
      }

      const texto = await analisarDocumentoComGoogleVision(file.filepath)

      const textoSemPontuacao = texto.replace(/\D/g, '')
      const nomeEncontrado = texto.includes(nome.toLowerCase())
      const cpfEncontrado =
        texto.includes(cpf) || textoSemPontuacao.includes(cpf.replace(/\D/g, ''))

      if (!nomeEncontrado && !cpfEncontrado)
        return res.json({ valido: false, erro: 'Nome e CPF não encontrados.' })
      else if (!nomeEncontrado)
        return res.json({ valido: false, erro: 'Nome não encontrado.' })
      else if (!cpfEncontrado)
        return res.json({ valido: false, erro: 'CPF não encontrado.' })

      res.json({ valido: true })
    } catch (error) {
      res.status(500).json({ valido: false, erro: error.message })
    }
  })
}

export const config = {
  api: {
    bodyParser: false
  }
}
