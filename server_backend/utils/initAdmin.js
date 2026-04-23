const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Initialize default admin user if not present.
 * Returns an object describing the outcome instead of throwing.
 */
async function initAdmin() {
  const emailEnv = process.env.ADMIN_EMAIL;
  const pwdEnv = process.env.ADMIN_PASSWORD;

  const email = (emailEnv || 'admin@gmail.com').toLowerCase().trim();
  const password = pwdEnv || 'admin123';
  try {
    let admin = await User.findOne({ email }).select('+password');

    if (!admin) {
      admin = new User({ name: 'Admin', email, password, role: 'admin' });
      await admin.save();
      console.info('Admin created:', email);
      return { created: true, email, id: admin._id.toString() };
    }

    let changed = false;

    if (admin.role !== 'admin') {
      admin.role = 'admin';
      changed = true;
    }

    const hasBcryptPrefix = typeof admin.password === 'string' && /^\$2[aby]\$/.test(admin.password);
    let passwordMatches = false;

    if (hasBcryptPrefix) {
      passwordMatches = await bcrypt.compare(password, admin.password);
    }

    if (!hasBcryptPrefix || !passwordMatches) {
      admin.password = password;
      changed = true;
      console.info('Admin password repaired from environment for:', email);
    }

    if (changed) {
      await admin.save();
    }

    console.info('Admin already exists:', email);
    return { created: false, reason: 'exists', email, repaired: changed };
  } catch (error) {
    console.error('Failed to initialize admin user:', error && error.message ? error.message : error);
    return { created: false, reason: 'error', error };
  }
}

module.exports = initAdmin;
