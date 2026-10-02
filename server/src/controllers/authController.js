const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../services/auditService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_production_jwt_key_exam_eval_2026', {
    expiresIn: '30d'
  });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Contact administrator.'
      });
    }

    if (user.role === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Student portal is disabled. Student role has been decommissioned.'
      });
    }

    const token = generateToken(user._id);

    await logAudit({
      user,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id,
      details: { role: user.role }
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, employeeId } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'Welcome@123',
      role,
      department,
      employeeId
    });

    await logAudit({
      req,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user._id,
      details: { role: user.role, email: user.email }
    });

    res.status(201).json({ success: true, message: 'User created successfully', user });
  } catch (error) {
    next(error);
  }
};
