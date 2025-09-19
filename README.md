# Sistema Web Multi-páginas

Um sistema web completo com frontend, backend e painel administrativo, desenvolvido em JavaScript/Node.js.

## 🚀 Características

- **Frontend**: Interface de usuário responsiva com páginas de login, registro, dashboard e planos
- **Backend**: API REST com autenticação JWT, integração com Stripe e banco SQLite
- **Painel Admin**: Interface administrativa para gerenciamento de usuários
- **Multilíngue**: Suporte a PT-BR, PT-PT, ES-ES e EN-US
- **Segurança**: Middleware de DLP, Helmet.js e validações de entrada

## 📁 Estrutura do Projeto

```
├── index.html              # Página inicial (landing page)
├── landing-script.js       # Scripts da landing page
├── landing-style.css       # Estilos da landing page
├── release.html           # Página de release notes
├── app-usuario/           # Aplicação do usuário
│   ├── login.html         # Página de login
│   ├── register.html      # Página de registro
│   ├── dashboard.html     # Dashboard do usuário
│   ├── planos.html        # Página de planos
│   └── libs/              # Bibliotecas PDF.js
├── backend/               # Servidor Node.js
│   ├── server.js          # Servidor principal
│   ├── database.js        # Configuração do banco
│   ├── dlp-middleware.js  # Middleware de proteção de dados
│   └── package.json       # Dependências do Node.js
├── painel-admin/          # Painel administrativo
│   ├── admin-dashboard.html
│   ├── admin-script.js
│   └── admin-style.css
└── locates/               # Arquivos de tradução
    ├── pt-BR/
    ├── pt-PT/
    ├── es-ES/
    └── en-US/
```

## ⚙️ Configuração e Instalação

### Pré-requisitos

- Node.js (versão 14 ou superior)
- NPM ou Yarn

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure suas chaves:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
PORT=4242
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
JWT_SECRET=sua_chave_jwt_secreta_aqui
```

### 3. Executar o Servidor

```bash
npm start
```

O servidor será executado em `http://localhost:4242`

## 🌐 Deploy em VPS

### Passos para Deploy

1. **Upload dos arquivos**: Envie todos os arquivos para sua VPS
2. **Instalar dependências**: Execute `npm install` no diretório backend
3. **Configurar variáveis**: Configure o arquivo `.env` com as chaves de produção
4. **Configurar servidor web**: Configure Nginx/Apache para servir os arquivos estáticos
5. **Configurar firewall**: Abra as portas 80 (HTTP) e 443 (HTTPS)
6. **Configurar domínio**: Aponte seu domínio para o IP da VPS

### Exemplo de configuração Nginx

```nginx
server {
    listen 80;
    server_name seudominio.com;
    
    # Servir arquivos estáticos
    location / {
        root /caminho/para/seu/projeto;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy para o backend
    location /api/ {
        proxy_pass http://localhost:4242;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔧 Tecnologias Utilizadas

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Internacionalização (i18n)
- PDF.js para visualização de PDFs

### Backend
- Node.js + Express.js
- SQLite (banco de dados)
- JWT (autenticação)
- Stripe (pagamentos)
- Helmet.js (segurança)
- bcryptjs (hash de senhas)

## 🔐 Segurança

- Middleware de DLP (Data Loss Prevention)
- Validação de entrada em todas as rotas
- Hash bcrypt para senhas
- JWT para autenticação
- Helmet.js para headers de segurança
- CORS configurado adequadamente

## 📝 API Endpoints

### Autenticação
- `POST /api/register` - Registro de usuário
- `POST /api/login` - Login de usuário
- `POST /api/logout` - Logout de usuário

### Usuários
- `GET /api/profile` - Perfil do usuário logado
- `PUT /api/profile` - Atualizar perfil

### Admin
- `GET /api/admin/users` - Listar usuários (admin)
- `PUT /api/admin/users/:id` - Atualizar usuário (admin)
- `DELETE /api/admin/users/:id` - Remover usuário (admin)

## 🌍 Suporte a Idiomas

O sistema suporta os seguintes idiomas:
- Português (Brasil) - pt-BR
- Português (Portugal) - pt-PT
- Espanhol - es-ES
- Inglês (EUA) - en-US

## 📄 Licença

Este projeto está sob licença proprietária. Todos os direitos reservados.

## 🤝 Contribuição

Para contribuir com este projeto, entre em contato com a equipe de desenvolvimento.

## 📞 Suporte

Para suporte técnico, entre em contato através dos canais oficiais.