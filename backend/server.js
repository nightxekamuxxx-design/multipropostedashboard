// SUBSTITUA O CONTEÚDO DESTE ARQUIVO: server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./database.js'); // Importa nossa conexão com o DB

const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Security and middleware
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
// Attach DLP middleware to redact sensitive patterns from JSON responses
const dlpMiddleware = require('./dlp-middleware');

app.set('trust proxy', 1); // behind ALB/CloudFront
app.use(helmet());
app.use(dlpMiddleware);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// --- ROTAS DA API DE AUTENTICAÇÃO E USUÁRIOS ---

app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email e password são obrigatórios.' });
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Erro ao gerar hash da senha.' });
        const newUser = {
            id: `user-${Date.now()}`,
            name,
            email,
            password: hash,
            plan: 'free',
            status: 'Ativo',
            registeredAt: new Date().toISOString().split('T')[0]
        };
        const sql = `INSERT INTO users (id, name, email, password, plan, status, registeredAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [newUser.id, newUser.name, newUser.email, newUser.password, newUser.plan, newUser.status, newUser.registeredAt];
        db.run(sql, params, function(err) {
            if (err) {
                if (err.message && err.message.includes('UNIQUE')) {
                    return res.status(409).json({ error: 'Este e-mail já está em uso.' });
                }
                return res.status(500).json({ error: err.message });
            }
            return res.status(201).json({ message: 'Usuário criado com sucesso!', userId: newUser.id });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
        const sql = `SELECT * FROM users WHERE email = ?`;
        db.get(sql, [email], (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
            const bcrypt = require('bcryptjs');
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) return res.status(500).json({ error: 'Erro ao verificar senha.' });
                if (result) {
                    const userSafe = { ...user };
                    delete userSafe.password;
                    // create JWT
                    const token = jwt.sign({ id: userSafe.id, email: userSafe.email }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '8h' });
                    // set cookie (HttpOnly, Secure in production)
                    const cookieOptions = {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Strict',
                        maxAge: 8 * 60 * 60 * 1000 // 8 hours
                    };
                    res.cookie('token', token, cookieOptions);
                    res.json({ message: 'Login bem-sucedido!', user: userSafe });
                } else {
                    res.status(401).json({ error: 'E-mail ou senha inválidos.' });
                }
            });
        });
});

// Logout route clears the cookie
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout realizado.' });
});

// Auth middleware
function verifyAuth(req, res, next) {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Não autenticado.' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
        req.user = payload;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token inválido.' });
    }
}

app.get('/api/users', verifyAuth, (req, res) => {
    // Retornar apenas campos não sensíveis
    db.all("SELECT id, name, email, plan, status, registeredAt FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

app.put('/api/users/:id/plan', verifyAuth, (req, res) => {
    const { plan } = req.body;
    db.run(`UPDATE users SET plan = ? WHERE id = ?`, [plan, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Plano atualizado com sucesso!', changes: this.changes });
    });
});

app.put('/api/users/:id/status', verifyAuth, (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE users SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Status atualizado com sucesso!', changes: this.changes });
    });
});

app.delete('/api/users/:id', verifyAuth, (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Usuário deletado", changes: this.changes });
    });
});

// --- ROTA DO STRIPE (sem alterações) ---
app.post('/create-checkout-session', async (req, res) => {
    // ...código do stripe...
});

const port = process.env.PORT || 4242;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

// Serve planos.html com injeção da chave publishable do Stripe (meta tag)
const fs = require('fs');
const path = require('path');
app.get('/planos', (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', 'app-usuario', 'planos.html');
        let html = fs.readFileSync(filePath, 'utf8');
        const publishable = process.env.STRIPE_PUBLISHABLE_KEY || '';
        const metaTag = `<meta name="stripe-key" content="${publishable}">`;
        if (!html.includes('name="stripe-key"')) {
            html = html.replace('</head>', `  ${metaTag}\n</head>`);
        }
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('Erro ao servir planos.html:', err);
        res.status(500).send('Erro interno');
    }
});