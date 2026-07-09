const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  action: { type: String, required: true }, // e.g. LANGUAGE_CHANGE_REQUEST
  channel: { type: String, default: null },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  status: { type: String, required: true } // success, failure
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
