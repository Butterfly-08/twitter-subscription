const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, default: null },
  signature: { type: String, default: null },
  amount: { type: Number, required: true }, // in rupees (INR)
  plan: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['created', 'completed', 'failed'], 
    default: 'created' 
  },
  invoiceNumber: { type: String, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
