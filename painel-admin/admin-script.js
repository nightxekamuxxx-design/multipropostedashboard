// O estado da aplicação agora começa vazio e será preenchido com dados da API
const adminState = {
    users: [],
    stats: { totalUsers: 0, totalRevenue: 0, activeSubs: 0, newUsers: 0 }
};
const uiState = {
    userSearchQuery: '',
    currentPage: 1,
    itemsPerPage: 10,
};

// ATENÇÃO: Mude esta URL para o endereço do seu servidor na AWS quando for para produção
const API_URL = 'http://localhost:4242/api';

// Funções de utilidade
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtInt = new Intl.NumberFormat('pt-BR');
const fmtDate = (s) => new Date(s).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

// ==========================
// Funções de Renderização
// ==========================
function renderStatCards() {
    adminState.stats = {
        totalUsers: adminState.users.length,
        activeSubs: adminState.users.filter(u => u.plan === 'premium' && u.status === 'Ativo').length,
        newUsers: 0
    };
    document.getElementById('total-users').textContent = fmtInt.format(adminState.stats.totalUsers);
    document.getElementById('active-subs').textContent = fmtInt.format(adminState.stats.activeSubs);
}

function renderUserTable() {
    const tbody = document.getElementById('user-table-body');
    const query = uiState.userSearchQuery.toLowerCase();
    const filteredUsers = adminState.users.filter(user => user.email.toLowerCase().includes(query));
    
    const totalPages = Math.ceil(filteredUsers.length / uiState.itemsPerPage);
    uiState.currentPage = Math.max(1, Math.min(uiState.currentPage, totalPages || 1));
    const start = (uiState.currentPage - 1) * uiState.itemsPerPage;
    const end = start + uiState.itemsPerPage;
    const paginatedUsers = filteredUsers.slice(start, end);

    tbody.innerHTML = paginatedUsers.map(user => {
        const statusClass = user.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300';
        const planSelector = `<select data-userid="${user.id}" class="plan-selector bg-transparent rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"><option value="free" ${user.plan === 'free' ? 'selected' : ''}>Grátis</option><option value="premium" ${user.plan === 'premium' ? 'selected' : ''}>Premium</option></select>`;
        return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 relative"><td class="px-4 py-3"><p class="font-medium">${user.name}</p><p class="text-xs text-slate-500">${user.email}</p></td><td class="px-4 py-3">${planSelector}</td><td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">${user.status}</span></td><td class="px-4 py-3">${fmtDate(user.registeredAt)}</td><td class="px-4 py-3 text-center"><button data-userid="${user.id}" aria-label="Mais opções" title="Mais opções" class="user-action-btn w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-500"><i class="fa-solid fa-ellipsis-vertical"></i></button></td></tr>`;
    }).join('');

    document.getElementById('pagination-info').textContent = `Mostrando ${filteredUsers.length > 0 ? start + 1 : 0}-${Math.min(end, filteredUsers.length)} de ${filteredUsers.length}`;
    document.getElementById('prev-page-btn').disabled = uiState.currentPage === 1;
    document.getElementById('next-page-btn').disabled = uiState.currentPage === totalPages || totalPages === 0;
}

let userGrowthChartInstance = null, revenueByPlanChartInstance = null;
function getChartColors() { /* ... */ }
function renderUserGrowthChart() { /* ... */ }
function renderRevenueByPlanChart() { /* ... */ }
function renderServerStatus() { /* ... */ }

// ==========================
// Ações do Admin (API)
// ==========================
async function fetchUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Falha na resposta da rede.');
        adminState.users = await response.json();
        renderUserTable();
        renderStatCards();
    } catch (error) {
        console.error("Falha ao buscar usuários:", error);
        alert("Não foi possível carregar os dados dos usuários do servidor.");
    }
}

async function changeUserPlan(userId, newPlan) {
    try {
        await fetch(`${API_URL}/users/${userId}/plan`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: newPlan })
        });
        await fetchUsers();
    } catch (error) { console.error("Falha ao alterar plano:", error); }
}

async function suspendUser(userId) {
    try {
        const user = adminState.users.find(u => u.id === userId);
        if (!user) return;
        const newStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo';
        await fetch(`${API_URL}/users/${userId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        await fetchUsers();
    } catch (error) { console.error("Falha ao alterar status:", error); }
}

async function deleteUser(userId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
            await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
            await fetchUsers();
        } catch (error) { console.error("Falha ao deletar usuário:", error); }
    }
}

function createActionMenu(userId, buttonElement) {
    document.querySelectorAll('.action-menu').forEach(menu => menu.remove());
    const rect = buttonElement.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'action-menu';
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.right = `${window.innerWidth - rect.right - window.scrollX}px`;
    const user = adminState.users.find(u => u.id === userId);
    const suspendText = user.status === 'Ativo' ? 'Suspender' : 'Reativar';
    const suspendIcon = user.status === 'Ativo' ? 'fa-user-slash' : 'fa-user-check';
    menu.innerHTML = `<button class="action-menu-item suspend-btn"><i class="fa-solid ${suspendIcon} w-6"></i>${suspendText}</button><button class="action-menu-item delete-btn"><i class="fa-solid fa-trash-can w-6"></i>Excluir</button>`;
    document.body.appendChild(menu);
    menu.querySelector('.suspend-btn').addEventListener('click', () => { suspendUser(userId); menu.remove(); });
    menu.querySelector('.delete-btn').addEventListener('click', () => { deleteUser(userId); menu.remove(); });
}

// ==========================
// Navegação e Lógica Principal
// ==========================
function setActivePage(hash) {
    const currentHash = hash || '#dashboard';
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.hash === currentHash);
    });
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    const targetSectionId = currentHash.substring(1) + '-section';
    const activeSection = document.getElementById(targetSectionId);
    if (activeSection) {
        activeSection.classList.add('active');
        const titleLink = document.querySelector(`.nav-link[href="${currentHash}"] span`);
        if(titleLink) {
            document.getElementById('page-title').textContent = titleLink.textContent;
        }
    } else {
        document.getElementById('dashboard-section').classList.add('active');
        document.getElementById('page-title').textContent = 'Dashboard';
    }
}

async function initializeApp() {
    await fetchUsers();
    setActivePage(window.location.hash);
    renderUserGrowthChart();
    renderRevenueByPlanChart();
    renderServerStatus();
    setInterval(renderServerStatus, 5000);
    window.addEventListener('hashchange', () => setActivePage(window.location.hash));
    document.getElementById('user-search').addEventListener('input', (e) => { uiState.userSearchQuery = e.target.value; uiState.currentPage = 1; renderUserTable(); });
    document.getElementById('prev-page-btn').addEventListener('click', () => { if (uiState.currentPage > 1) { uiState.currentPage--; renderUserTable(); } });
    document.getElementById('next-page-btn').addEventListener('click', () => { uiState.currentPage++; renderUserTable(); });
    
    const userTableBody = document.getElementById('user-table-body');
    userTableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('plan-selector')) {
            changeUserPlan(e.target.dataset.userid, e.target.value);
        }
    });

    document.querySelector('main').addEventListener('click', (e) => {
        const actionButton = e.target.closest('.user-action-btn');
        if (actionButton) {
            createActionMenu(actionButton.dataset.userid, actionButton);
        } else if (!e.target.closest('.action-menu')) {
            document.querySelectorAll('.action-menu').forEach(menu => menu.remove());
        }
    });
}

// ==========================
// Event Listeners Gerais (Login, Logout, Tema)
// ==========================
window.addEventListener('DOMContentLoaded', () => {
    const loginPage = document.getElementById('login-page');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const loginError = document.getElementById('login-error');
        loginError.textContent = '';
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verificando...';
        try {
            const res = await fetch('http://localhost:4242/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                loginPage.classList.add('hidden');
                adminPanel.classList.remove('hidden');
                adminPanel.classList.add('flex');
                if (data.user) sessionStorage.setItem('adminUser', JSON.stringify(data.user));
                initializeApp();
            } else {
                loginError.textContent = data.error || 'Credenciais inválidas.';
            }
        } catch (err) {
            console.error('Erro ao conectar no servidor:', err);
            loginError.textContent = 'Erro de conexão ao servidor.';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
         adminPanel.classList.add('hidden');
         adminPanel.classList.remove('flex');
         loginPage.classList.remove('hidden');
    });

    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const applyTheme = (theme) => {
        if (theme === 'dark') { document.documentElement.classList.add('dark'); sunIcon.classList.remove('hidden'); moonIcon.classList.add('hidden'); }
        else { document.documentElement.classList.remove('dark'); sunIcon.classList.add('hidden'); moonIcon.classList.remove('hidden'); }
        if(userGrowthChartInstance) renderUserGrowthChart();
        if(revenueByPlanChartInstance) renderRevenueByPlanChart();
    };
    themeToggleBtn.addEventListener('click', () => { const isDark = document.documentElement.classList.contains('dark'); applyTheme(isDark ? 'light' : 'dark'); });
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(systemPrefersDark ? 'dark' : 'light');
});