const jwt = require('jsonwebtoken');

const TIERS = { free: 0, pro: 1, host: 2 };
const FREE_GUEST_LIMIT = 5;

const REQUIREMENTS = {
  persistentRoom: 'pro',
  spotifyConnect: 'pro',
  appleMusicConnect: 'pro',
  guestOverLimit: 'pro',
};

// WS upgrade requests can't send Authorization headers from the browser
function extractPlan(req) {
  const auth = req.headers?.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
      return payload.plan ?? 'free';
    } catch (_) {}
  }
  // query param: expect a signed JWT
  if (req.query?.token) {
    try {
      const payload = jwt.verify(req.query.token, process.env.JWT_SECRET);
      return payload.plan ?? 'free';
    } catch (_) {}
  }
  return 'free';
}

function tierOf(plan) {
  return TIERS[plan] ?? 0;
}

// Express middleware for HTTP routes
// Usage: router.post('/rooms', planGate('persistentRoom'), handler)
function planGate(feature, { getGuestCount } = {}) {
  return (req, res, next) => {
    if (feature === 'guestOverLimit' && getGuestCount) {
      if (getGuestCount(req) <= FREE_GUEST_LIMIT) return next();
    }

    const plan = extractPlan(req);
    if (tierOf(plan) < tierOf(REQUIREMENTS[feature])) {
      return res.status(403).json({
        error: 'upgrade_required',
        feature,
        required: REQUIREMENTS[feature],
        current: plan,
      });
    }
    next();
  };
}

// Synchronous check for use inside WS message handlers
// Returns { ok: true } or { ok: false, error, required, current }
function checkPlan(plan, feature, { guestCount } = {}) {
  if (feature === 'guestOverLimit' && (guestCount ?? 0) <= FREE_GUEST_LIMIT) {
    return { ok: true };
  }
  const required = REQUIREMENTS[feature];
  if (tierOf(plan) < tierOf(required)) {
    return { ok: false, error: 'upgrade_required', required, current: plan };
  }
  return { ok: true };
}

module.exports = { planGate, checkPlan, extractPlan, FREE_GUEST_LIMIT };