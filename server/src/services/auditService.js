const AuditLog = require('../models/AuditLog');

const logAudit = async ({ req, user, action, entity, entityId, details }) => {
  try {
    const actor = user || (req && req.user);
    const ip = (req && (req.headers['x-forwarded-for'] || req.socket.remoteAddress)) || '127.0.0.1';

    await AuditLog.create({
      user: actor ? actor._id : null,
      userName: actor ? actor.name : 'System',
      userRole: actor ? actor.role : 'SYSTEM',
      action,
      entity,
      entityId: entityId ? entityId.toString() : '',
      details: details || {},
      ipAddress: ip
    });
  } catch (error) {
    console.error('Audit Log Error:', error.message);
  }
};

module.exports = { logAudit };
