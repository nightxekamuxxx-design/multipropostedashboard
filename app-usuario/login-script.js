document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            document.documentElement.classList.remove('dark');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    };
    
    let currentTheme = localStorage.getItem('theme');
    if (!currentTheme) {
        currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // Elementos de navegação
    const emailStep = document.getElementById('email-step');
    const passwordStep = document.getElementById('password-step');
    const loginCard = document.getElementById('login-card');

    // Formulários e inputs
    const emailForm = document.getElementById('email-form');
    const passwordForm = document.getElementById('password-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const userEmailDisplay = document.getElementById('user-email-display');
    const messageArea = document.getElementById('message-area');

    // Botões e Links
    const backToEmailButton = document.getElementById('back-to-email');
    const togglePasswordButton = document.getElementById('toggle-password');
    const passwordIcon = document.getElementById('password-icon');
    const biometricLoginBtn = document.getElementById('biometric-login-btn');

    function switchCard(from, to) {
         from.classList.add('animate-fade-out');
         from.addEventListener('animationend', () => {
             from.classList.add('hidden');
             from.classList.remove('animate-fade-out');
             to.classList.remove('hidden');
             to.classList.add('animate-fade-in');
         }, { once: true });
    }
    
    function showMessage(message, isError = false) {
        messageArea.textContent = message;
        messageArea.className = isError 
            ? 'text-center text-sm mb-4 text-red-500 dark:text-red-400 min-h-[20px]' 
            : 'text-center text-sm mb-4 text-slate-600 dark:text-slate-400 min-h-[20px]';
    }

    // Lightweight translations loader for login page
    let LOCAL_TRANSLATIONS = {};
    async function loadLocalTranslations() {
        const lang = localStorage.getItem('siteLang') || 'pt-BR';
        try {
            const res = await fetch(`../locates/${lang}/translation.json`);
            if (res.ok) LOCAL_TRANSLATIONS = await res.json();
        } catch (e) { /* ignore */ }
    }
    // load translations but don't block UI initialization
    loadLocalTranslations().catch(() => {});

    function handleLoginSuccess() {
        loginCard.innerHTML = `
            <div class="text-center p-4 animate-fade-in">
                <i class="fa-solid fa-check-circle text-5xl text-green-500 mb-4"></i>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">Login bem-sucedido!</h2>
                <p class="text-slate-600 dark:text-slate-400 mt-2">Redirecionando para o painel...</p>
            </div>
        `;
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    // Sanitize helper
    function escapeHTML(str) {
        return String(str).replace(/[&<>'"`=]/g, function (s) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;','`':'&#96;','=':'&#61;'})[s];
        });
    }

    emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailRaw = emailInput.value.trim();
        // Basic email format validation
        const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailPattern.test(emailRaw)) {
            showMessage(LOCAL_TRANSLATIONS.invalidEmail || 'Digite um e-mail válido.', true);
            emailInput.focus();
            return;
        }
        userEmailDisplay.textContent = escapeHTML(emailRaw);
        switchCard(emailStep, passwordStep);
        setTimeout(() => passwordInput.focus(), 100);
    });

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const loginButton = document.getElementById('login-button');

        // Sanitize password (remove leading/trailing spaces)
        const passwordSanitized = password.replace(/\s+/g, '');
        if (passwordSanitized.length < 8) {
            showMessage(LOCAL_TRANSLATIONS.passwordTooShort || 'A senha deve ter pelo menos 8 caracteres.', true);
            passwordInput.focus();
            return;
        }

        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="loader mr-2"></span>Verificando...';

        try {
            // ATENÇÃO: Troque 'http://localhost:4242' pela URL do seu servidor na AWS quando for para produção
            const response = await fetch('http://localhost:4242/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: passwordSanitized })
            });

            const data = await response.json();

            if (response.ok) {
                // Se o login for bem-sucedido, salva o usuário na sessão do navegador
                sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));
                handleLoginSuccess();
            } else {
                // Se o servidor retornar um erro (ex: 401 não autorizado)
                showMessage(escapeHTML(data.error || 'Erro desconhecido.'), true);
            }
        } catch(error) {
             console.error("Erro de conexão:", error);
             showMessage('Não foi possível conectar ao servidor.', true);
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = LOCAL_TRANSLATIONS.continueBtn || 'Continuar';
        }
    });

    togglePasswordButton.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        passwordIcon.classList.toggle('fa-eye');
        passwordIcon.classList.toggle('fa-eye-slash');
    });

    // Placeholder para a lógica de biometria
    if (!window.PublicKeyCredential) {
        biometricLoginBtn.style.display = 'none';
    }
    biometricLoginBtn.addEventListener('click', async () => {
        showMessage('Lógica de biometria a ser implementada com o servidor.');
    });

    // Accessibility: focus on first input
    setTimeout(() => {
        if (emailInput) emailInput.focus();
    }, 200);
});