// Backward-compatible re-export — prefer require('../middleware')
const { isLoggedIn } = require('../middleware/auth');

module.exports = { isLoggedIn };
