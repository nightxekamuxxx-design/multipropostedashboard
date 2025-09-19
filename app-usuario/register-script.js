document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.getElementById('progress-fill');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const form = document.getElementById('register-form');

    const titles = [
        "Crie a sua conta",
        "Adicione uma Camada de Segurança",
        "Acesso Rápido e Seguro"
    ];
    const subtitles = [
        "Comece a transformar a sua vida financeira hoje mesmo.",
        "A pergunta secreta ajuda a recuperar sua conta caso esqueça a senha.",
        "Use sua biometria para um login mais rápido e seguro."
    ];

    let currentStep = 1;

    const updateProgress = () => {
        progressSteps.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;
        progressFill.style.width = `${progressPercentage}%`;
    };

    const updateFormContent = () => {
        steps.forEach(step => step.classList.remove('active'));
        document.getElementById(`step-${currentStep}`).classList.add('active');
        formTitle.textContent = titles[currentStep - 1];
        formSubtitle.textContent = subtitles[currentStep - 1];
        updateProgress();
    };

    const showError = (inputId, message) => {
        const errorEl = document.getElementById(`${inputId}-error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = message ? 'block' : 'none';
        }
        const inp = document.getElementById(inputId);
        if (inp) inp.classList.toggle('border-red-500', !!message);
    };

    // Toast helpers (não conflitam com showError acima)
    function createToastContainer() {
        if (document.getElementById('toast-container')) return;
        const c = document.createElement('div');
        c.id = 'toast-container';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    function showToastGlobal(message, opts = {}) {
        createToastContainer();
        const id = 't_' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'toast show ' + (opts.type === 'error' ? 'error' : (opts.type === 'success' ? 'success' : ''));
        div.innerHTML = `<div class="msg">${message}</div>`;
        document.getElementById('toast-container').appendChild(div);
        const timeout = opts.duration || 4000;
        setTimeout(() => {
            div.classList.add('hide');
            setTimeout(() => div.remove(), 250);
        }, timeout);
    }
    function showErrorToast(message){ showToastGlobal(message, { type: 'error', duration: 6000 }); }
    function showSuccessToast(message){ showToastGlobal(message, { type: 'success', duration: 3500 }); }

    // Lightweight translations loader
    let LOCAL_TRANSLATIONS = {};
    async function loadLocalTranslations() {
        const lang = localStorage.getItem('siteLang') || 'pt-BR';
        try {
            const res = await fetch(`../locates/${lang}/translation.json`);
            if (res.ok) LOCAL_TRANSLATIONS = await res.json();
        } catch (e) { /* ignore */ }
    }
    loadLocalTranslations().catch(() => {});

    // --- Validações ---
    const validateStep1 = () => {
        let isValid = true;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        // Validação de força de senha
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!strongRegex.test(password)) {
            showError('password', 'A senha deve ter no mínimo 8 caracteres, incluir maiúsculas, minúsculas, números e símbolos.');
            isValid = false;
        } else {
            showError('password', '');
        }
        if (password !== confirmPassword) {
            showError('confirm-password', 'As senhas não coincidem.');
            isValid = false;
        } else {
            if(strongRegex.test(password)) {
                showError('confirm-password', '');
            }
        }
        return isValid;
    };

    const validateStep2 = () => {
        let isValid = true;
        const question = document.getElementById('custom_sq').value;
        const answer = document.getElementById('custom_sa').value;
        if (question.length < 10) {
            showError('custom_sq', 'A pergunta deve ser mais descritiva.');
            isValid = false;
        } else {
            showError('custom_sq', '');
        }
        if (!answer) isValid = false;
        return isValid;
    };

    // --- Navegação ---
    document.getElementById('next-btn-1').addEventListener('click', () => {
        if (validateStep1()) {
            currentStep = 2;
            updateFormContent();
        }
    });

    document.getElementById('next-btn-2').addEventListener('click', () => {
        if (validateStep2()) {
            currentStep = 3;
            updateFormContent();
        }
    });
    
    document.getElementById('prev-btn-2').addEventListener('click', () => {
        currentStep = 1;
        updateFormContent();
    });

    document.getElementById('prev-btn-3').addEventListener('click', () => {
        currentStep = 2;
        updateFormContent();
    });

    // --- Submissão do Formulário ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

    const escapeHTML = (str) => { const p = document.createElement('p'); p.textContent = str; return p.innerHTML; };
    const name = escapeHTML(document.getElementById('fullname').value);
    const email = escapeHTML(document.getElementById('email').value);
    const password = document.getElementById('password').value;
    const custom_sq = escapeHTML(document.getElementById('custom_sq').value);
    const custom_sa = escapeHTML(document.getElementById('custom_sa').value);
    const newUser = { name, email, password, custom_sq, custom_sa };
        
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Criando conta...';

        try {
            // ATENÇÃO: Troque 'http://localhost:4242' pela URL do seu servidor na AWS
            const response = await fetch('http://localhost:4242/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            
            const data = await response.json();

            if (response.status === 201) {
                // mostra toast e redireciona após curto delay para usuário ver a mensagem
                showSuccessToast('Conta criada com sucesso! Você será redirecionado para o login.');
                setTimeout(() => { window.location.href = 'login.html'; }, 1200);
            } else {
                // mostra erro não bloqueante
                showErrorToast(`Erro ao criar conta: ${data.error || 'Erro desconhecido'}`);
            }
        } catch(error) {
            console.error("Erro de conexão:", error);
            showErrorToast('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
        } finally {
        submitButton.disabled = false;
        submitButton.textContent = LOCAL_TRANSLATIONS.finishRegister || 'Finalizar Cadastro';
        }
    });

    // Inicia o formulário
    updateFormContent();
});