exports.suggestSections = async (req, res) => {
  try {
    const description = String(req.body?.description || '').toLowerCase();
    const sections = [];

    if (/theft|steal|stolen|robbery|snatch|burgl/.test(description)) sections.push('IPC 378');
    if (/harassment|harass|stalk|molest/.test(description)) sections.push('IPC 354');
    if (/fraud|scam|cheat|forgery/.test(description)) sections.push('IPC 420');
    if (/cyber|online|hack|phish|upi|otp/.test(description)) sections.push('IT Act');

    res.json({ sections: [...new Set(sections)] });
  } catch (err) {
    console.error('AI suggestion error:', err);
    res.status(500).json({ message: 'Unable to suggest sections' });
  }
};
