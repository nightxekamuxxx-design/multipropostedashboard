Instalação local de pdf.js para o Painel Financeiro

Objetivo
- Baixar `pdf.min.js` e `pdf.worker.min.js` na pasta `app-usuario/libs` para que o importador de PDF funcione sem depender da CDN.

Passos (recomendado para VPS)

1) Acesse a raiz do repositório na VPS, por exemplo:
   cd /var/www/painel-financeiro

2) Execute o script PowerShell (se estiver usando PowerShell na VPS):
   pwsh ./app-usuario/setup-pdfjs.ps1

   Ou, se estiver em Windows PowerShell, execute:
   .\app-usuario\setup-pdfjs.ps1

3) Verifique os arquivos:
   ls app-usuario/libs
   Você deve ver: `pdf.min.js` e `pdf.worker.min.js`.

4) Inicie um servidor HTTP na raiz do projeto e abra no navegador via http://localhost:
   # Python
   python -m http.server 8000

   # Ou Node (http-server)
   npx http-server -p 8000

5) Abra a página: http://localhost:8000/app-usuario/dashboard.html e teste Importar PDF.

Alternativa (Linux usando curl):

mkdir -p app-usuario/libs
curl -L -o app-usuario/libs/pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js
curl -L -o app-usuario/libs/pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js

Notas
- Certifique-se de usar a mesma versão para `pdf.min.js` e `pdf.worker.min.js`.
- Se você usar um servidor (Nginx/Apache) na VPS, coloque os arquivos em `app-usuario/libs` e garanta que o server sirva arquivos estáticos corretamente (Content-Type: application/javascript).
- Se ainda houver erros no console após seguir os passos, abra DevTools -> Console e copie a mensagem para investigação.
