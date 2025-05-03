const formidable = require('formidable')
const fs = require('fs')
const { analisarDocumentoComGoogleVision } = require('../vision')

module.exports = async (req, res) => {
  const form = formidable({ multiples: false })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao processar formulário.' })
    }

    try {
      const { nome, cpf } = fields
      const file = files.file

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
    bodyParser: false,
  },
}
