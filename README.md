# Furiosos API

API backend da aplicação **Furiosos**, desenvolvida em Node.js com Express. Esta API fornece os serviços necessários para o front-end interagir com o ecossistema da aplicação Furiosos-Web, permitindo autenticação de usuários, integração com o Instagram e OCR de documentos.

## 🚀 Tecnologias Utilizadas

- **Node.js** com **Express**
- **Supabase** (autenticação, banco de dados e storage)
- **OCR** via Vision API
- **Integração com Instagram** via OAuth2
- **Hospedagem** na Vercel

---

## 📁 Estrutura do Projeto

```
furiosos-api/
├── api/
│   ├── auth/
├── vision.js
├── package.json
└── vercel.json
```

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
GOOGLE_API_KEY=
PORT=3000
SUPABASE_URL=
SUPABASE_KEY=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
INSTAGRAM_REDIRECT_URI=
```

**Descrição das variáveis:**

- `PORT`: Chave de API do Google Vision.
- `PORT`: Porta em que a API será executada (padrão: 3000).
- `SUPABASE_URL`: URL do seu projeto no Supabase.
- `SUPABASE_KEY`: Chave de API do Supabase.
- `INSTAGRAM_CLIENT_ID`: ID do aplicativo do Instagram para OAuth2.
- `INSTAGRAM_CLIENT_SECRET`: Chave secreta do aplicativo do Instagram.
- `INSTAGRAM_REDIRECT_URI`: URL de redirecionamento configurada no Facebook Developers.

> ⚠️ **Importante:** Nunca versionar o arquivo `.env`. Adicione-o ao `.gitignore`.

---

## 🛠️ Instalação e Execução

### Pré-requisitos

- Node.js v18+
- NPM ou Yarn

### Passos

1. Clone o repositório:

   ```bash
   git clone https://github.com/pedromartins28/furiosos-api.git
   cd furiosos-api
   ```

2. Instale as dependências:

   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configure as variáveis de ambiente conforme descrito acima.

4. Inicie o servidor:

   ```bash
   npm run dev
   # ou
   yarn dev
   ```

A API estará disponível em `http://localhost:3333`.

---

## 📄 Endpoints Principais

### 📌 `POST /auth/insta-callback.js`

Callback de autenticação do Instagram. Esse endpoint é chamado automaticamente após o usuário autorizar a conexão com a conta do Instagram.

**Fluxo resumido:**
1. Recebe o `code` de autorização e o `state` (usado como ID do usuário no Supabase).
2. Troca o `code` por um `access_token`.
3. Busca dados públicos do perfil (nome de usuário, biografia, seguidores etc.).
4. Atualiza os dados do usuário no Supabase.
5. Busca os últimos posts da conta e salva no Supabase.
6. Tenta obter insights dos posts e salvar também.
7. Redireciona o usuário para o frontend (`furiosos-web`) após sucesso.

**Exemplo de requisição (via navegador):**
```
GET /auth/insta-callback.js?code=abc123&state=uuid-do-usuario
```

**Respostas:**
- `302 Redirect` para o frontend em caso de sucesso
- `400 Bad Request` se `code` ou `state` não forem fornecidos
- `500 Internal Server Error` se houver erro na integração com o Instagram ou Supabase

---

### 📌 `POST /analisar-documento.js`

Realiza a análise OCR de um documento enviado pelo usuário para verificar se o **nome** e o **CPF** estão presentes no texto detectado.

**Requisição:**
- Método: `POST`
- Tipo de corpo: `multipart/form-data`
- Campos obrigatórios:
  - `nome`: nome do usuário
  - `cpf`: CPF do usuário
  - `file`: imagem do documento

**Exemplo com `curl`:**
```bash
curl -X POST https://furiosos-api.vercel.app/analisar-documento.js \
  -F "nome=João da Silva" \
  -F "cpf=12345678900" \
  -F "file=@/caminho/do/arquivo.png"
```

**Respostas possíveis (JSON):**
- ✅ Documento válido:
```json
{ "valido": true }
```

- ❌ CPF não encontrado:
```json
{ "valido": false, "erro": "CPF não encontrado." }
```

- ❌ Nome e CPF não encontrados:
```json
{ "valido": false, "erro": "Nome e CPF não encontrados." }
```

- ❌ Erro ao processar o upload:
```json
{ "erro": "Erro ao processar formulário." }
```

> ⚠️ Este endpoint já trata CORS e `OPTIONS`, permitindo chamadas diretas do frontend.

---

## 📦 Deploy na Vercel

Este projeto está configurado para ser implantado na [Vercel](https://vercel.com/).

### Passos

1. Faça login na Vercel e importe o repositório `furiosos-api`.

2. Configure as variáveis de ambiente no painel da Vercel, conforme descrito anteriormente.

3. A Vercel detectará automaticamente o comando de build e iniciará o deploy.

Após o deploy, a API estará disponível em: [https://furiosos-api.vercel.app](https://furiosos-api.vercel.app)

---