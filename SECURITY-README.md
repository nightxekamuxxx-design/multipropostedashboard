## Segurança - instruções rápidas

Este documento reúne instruções práticas para configurar segredos, TLS e boas práticas de segurança para este projeto.

1) Variáveis de ambiente
 - Copie `backend/.env.example` para `backend/.env` (NUNCA commit este arquivo).
 - Preencha `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `JWT_SECRET`, `DATABASE_URL`.

2) Injetar `STRIPE_PUBLISHABLE_KEY` no HTML
 - No servidor, ao servir páginas estáticas, injete a chave publishable em uma meta tag para o front-end ler:

  Exemplo (Express):

  // dentro do handler que serve a página
  const publishable = process.env.STRIPE_PUBLISHABLE_KEY;
  res.setHeader('Content-Type', 'text/html');
  const pageHtml = fs.readFileSync(path.join(__dirname, '../app-usuario/planos.html'), 'utf8');
  const injected = pageHtml.replace('</head>', `  <meta name="stripe-key" content="${publishable}">\n</head>`);
  res.send(injected);

 - Ou defina `window.STRIPE_PUBLISHABLE_KEY` no template antes de carregar o script do Stripe.

3) TLS / HTTPS
 - Em produção, sempre habilite HTTPS (TLS). Use um load balancer / reverse proxy (NGINX, ALB) com certificados gerenciados (Let's Encrypt, ACM).
 - No Node/Express local, você pode usar um proxy reverso para testes HTTPS. Não use certificados auto-sign em produção.

4) Secret Management e rotação
 - Utilize um secret manager (AWS KMS/Secrets Manager, HashiCorp Vault, Azure Key Vault). Não armazene segredos em repositório.
 - Rotacione chaves imediatamente se forem expostas.

5) Logs e auditoria
 - Nunca escreva valores de campos sensíveis (password, card_number, secret) em logs.
 - Habilite auditoria de acessos (quem acessou/quando) para operações que leem dados sensíveis.

6) Passos imediatos recomendados
 - Criar `backend/.env` a partir de `.env.example` e preencher valores.
 - Injetar `STRIPE_PUBLISHABLE_KEY` no HTML via servidor (meta tag) em vez de hardcode.
 - Validar que `/api/users` não retorna `password` (feito).
 - Implementar cookies HttpOnly para tokens de sessão (em vez de localStorage para tokens sensíveis).

Se quiser, aplico automaticamente a injeção da meta tag no servidor e atualizo o `planos.html` para instruções finais.

7) Como configurar `.env` localmente (PowerShell)
 - Crie o arquivo a partir do exemplo e preencha os valores:

```powershell
cd 'e:\Site separado\\backend'
copy .env.example .env
# Em seguida edite .env no seu editor e preencha os valores reais
notepad .env
```

 - Exemplo de conteúdo mínimo em `backend/.env`:
```
PORT=4242
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_...           # manter somente no servidor
STRIPE_PUBLISHABLE_KEY=pk_test_...      # pode ser injetada no HTML
JWT_SECRET=um_valor_aleatorio_e_forte
DATABASE_URL=sqlite:./database.sqlite
```

8) Como colocar segredos na AWS (Secrets Manager)
 - Crie um secret no Secrets Manager com as chaves que precisa (STRIPE_SECRET_KEY, JWT_SECRET, DATABASE_URL).
 - Conceda permissões IAM apenas para o role do serviço (ECS task role / Lambda role) para acessar esse secret.
 - Configure o container/task para ler as variáveis de ambiente a partir dos secrets na definição de task (ECS) ou via parâmetros (Lambda).

9) Como testar localmente a injeção da chave
 - Defina `STRIPE_PUBLISHABLE_KEY` no `backend/.env`, inicie o servidor:
```powershell
cd 'e:\Site separado\\backend'
node server.js
```
 - No browser acesse `http://localhost:4242/planos` e inspecione o `<head>`; você deve ver `<meta name="stripe-key" content="pk_test_...">`.

10) Instalação e teste local (dependências)
 - No PowerShell, instale dependências e rode o servidor:
```powershell
cd 'e:\Site separado\\backend'
npm install
node server.js
```

11) Testando autenticação (login/logout)
 - Registrar um usuário (POST /api/register) com JSON {name, email, password} (pode usar curl/Postman).
 - Fazer POST /api/login com {email, password}. Em resposta o servidor define um cookie `token` HttpOnly.
 - Acesse GET /api/users — agora protegido, deve retornar dados apenas se cookie válido estiver presente.
 - Para logout: POST /api/logout (limpa cookie).

Notas: Para testar cookies localmente, use ferramentas como Postman que preservam cookies entre requests ou use o browser (a rota /api/login pode ser chamada via fetch do front-end).

