const User = require('../models/User');

const DEFAULT_OFFICERS = [
  { name: 'Cyber Officer', email: 'cyber.officer@spaces.local', password: 'Officer@123', department: 'Cyber Cell' },
  { name: 'Traffic Officer', email: 'traffic.officer@spaces.local', password: 'Officer@123', department: 'Traffic Control' },
  { name: 'Legal Officer', email: 'legal.officer@spaces.local', password: 'Officer@123', department: 'Legal Affairs' },
  { name: 'Crime Officer', email: 'crime.officer@spaces.local', password: 'Officer@123', department: 'Crime Branch' },
];

async function initOfficers() {
  const seeded = [];

  for (const officer of DEFAULT_OFFICERS) {
    const existing = await User.findOne({
      $or: [{ email: officer.email }, { name: officer.name }],
    }).select('_id name email role department');

    if (existing) {
      let changed = false;

      if (existing.role !== 'officer') {
        existing.role = 'officer';
        changed = true;
      }

      if (!existing.department && officer.department) {
        existing.department = officer.department;
        changed = true;
      }

      if (changed) {
        await existing.save();
      }

      seeded.push({ id: existing._id.toString(), email: existing.email, created: false });
      continue;
    }

    const created = await User.create({
      ...officer,
      role: 'officer',
    });

    seeded.push({ id: created._id.toString(), email: created.email, created: true });
  }

  return seeded;
}

module.exports = initOfficers;
