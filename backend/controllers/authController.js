const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  const { name, email, address, password } = req.body;

  if (!name || !email || !address || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (name.length < 20 || name.length > 60) {
    return res.status(400).json({ error: 'Name must be between 20 and 60 characters.' });
  }

  if (!/[A-Z]/.test(password) || !/[!@#$%^&*]/.test(password) || password.length < 8 || password.length > 16) {
    return res.status(400).json({ error: 'Password must be 8-16 characters with 1 uppercase & 1 special character.' });
  }

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, address, password: hashedPassword });

    const token = generateToken(user);
    res.status(201).json({ user: { id: user.id, role: user.role }, token });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ user: { id: user.id, role: user.role }, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
};
