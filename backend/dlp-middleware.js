// Simple DLP middleware: redacts common sensitive patterns from JSON responses.
// This is a lightweight, best-effort filter and should be complemented by stricter DLP tooling.
const EMAIL_RE = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const CPF_RE = /(\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b)/g;
const CC_RE = /\b(?:\d[ -]*?){13,19}\b/g; // broad match for card-like sequences
const APIKEY_RE = /(sk_live_[A-Za-z0-9_-]+|sk_test_[A-Za-z0-9_-]+|pk_live_[A-Za-z0-9_-]+|pk_test_[A-Za-z0-9_-]+|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35})/g;
const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+/g;

function redactString(s) {
    if (typeof s !== 'string') return s;
    let out = s;
    out = out.replace(EMAIL_RE, '[REDACTED_EMAIL]');
    out = out.replace(CPF_RE, '[REDACTED_CPF]');
    out = out.replace(CC_RE, '[REDACTED_CARD]');
    out = out.replace(APIKEY_RE, '[REDACTED_API_KEY]');
    out = out.replace(JWT_RE, '[REDACTED_JWT]');
    return out;
}

function redactObject(value, seen = new WeakSet()) {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return redactString(value);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.map(v => redactObject(v, seen));
    if (typeof value === 'object') {
        if (seen.has(value)) return '[CIRCULAR]';
        seen.add(value);
        const out = {};
        for (const k of Object.keys(value)) {
            try {
                out[k] = redactObject(value[k], seen);
            } catch (e) {
                out[k] = '[UNREDACTABLE]';
            }
        }
        return out;
    }
    return value;
}

module.exports = function dlpMiddleware(req, res, next) {
    const oldJson = res.json && res.json.bind(res);
    if (!oldJson) return next();
    res.json = function (body) {
        try {
            const redacted = redactObject(body);
            return oldJson(redacted);
        } catch (e) {
            // On any error, fall back to original body but log the issue
            console.error('DLP middleware error:', e && e.message);
            return oldJson(body);
        }
    };
    next();
};
