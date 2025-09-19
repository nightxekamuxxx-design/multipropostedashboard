document.addEventListener('DOMContentLoaded', () => {
    // Evitar chave hardcoded: leia a chave publicável do Stripe a partir de uma variável global
    // (por exemplo, injetada pelo servidor) ou de uma meta tag <meta name="stripe-key" content="pk_live_...">.
    const getPublishableKey = () => {
        if (window.STRIPE_PUBLISHABLE_KEY) return window.STRIPE_PUBLISHABLE_KEY;
        const meta = document.querySelector('meta[name="stripe-key"]');
        if (meta) return meta.getAttribute('content');
        return null;
    };
    const stripeKey = getPublishableKey();
    if (!stripeKey) {
        console.error('Stripe publishable key not configured. Set window.STRIPE_PUBLISHABLE_KEY or a meta[name="stripe-key"].');
        return;
    }
    const stripe = Stripe(stripeKey);
    
    const premiumButton = document.getElementById('select-premium-btn');

    if (premiumButton) {
        premiumButton.addEventListener('click', async () => {
            premiumButton.textContent = 'Processando...';
            premiumButton.disabled = true;

            try {
                // 1. Pede ao seu servidor para criar a sessão de checkout.
                // Esta URL ('/create-checkout-session') deve corresponder a uma rota no seu servidor back-end.
                const response = await fetch('/create-checkout-session', {
                    method: 'POST',
                });

                const session = await response.json();

                // 2. Redireciona o cliente para a página de pagamento segura do Stripe.
                const result = await stripe.redirectToCheckout({
                    sessionId: session.id
                });

                if (result.error) {
                    // Se houver um erro no redirecionamento, exibe a mensagem.
                    alert(result.error.message);
                    premiumButton.textContent = 'Fazer Upgrade';
                    premiumButton.disabled = false;
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Não foi possível iniciar o processo de pagamento. Verifique se o servidor está rodando.');
                premiumButton.textContent = 'Fazer Upgrade';
                premiumButton.disabled = false;
            }
        });
    }
});