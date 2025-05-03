// vision.js
const axios = require('axios')
const fs = require('fs')

async function analisarDocumentoComGoogleVision(filePath) {
  const apiKey = process.env.GOOGLE_API_KEY
  const base64 = fs.readFileSync(filePath, { encoding: 'base64' })

  const requestBody = {
    requests: [
      {
        image: {
          content: base64
        },
        features: [{ type: 'TEXT_DETECTION' }]
      }
    ]
  }

  const response = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    requestBody
  )

  const texto = response.data.responses[0]?.fullTextAnnotation?.text
  if (!texto) throw new Error('Texto não detectado.')

  return texto.toLowerCase()
}

module.exports = { analisarDocumentoComGoogleVision }
