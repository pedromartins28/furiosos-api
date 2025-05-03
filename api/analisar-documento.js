const multer = require('multer')()
const fs = require('fs')
const { analisarDocumentoComGoogleVision } = require('../vision')

module.exports = async (req, res) => {
  multer.single('file')(req, {}, async (err) => {
    if (err) return res.status(500).json({ erro: 'Erro no upload.' })

    try {
      const { nome, cpf } = req.body
      const buffer = req.file.buffer

      // Salva arquivo temporário
      const filePath = `/tmp/${req.file.originalname}`
      fs.writeFileSync(filePath, buffer)

      const texto = await analisarDocumentoComGoogleVision(filePath)
      fs.unlinkSync(filePath)

      const textoSemPontuacao = texto.replace(/\D/g, '')
      const nomeEncontrado = texto.includes(nome.toLowerCase())
      const cpfEncontrado = texto.includes(cpf) || textoSemPontuacao.includes(cpf.replace(/\D/g, ''))

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
