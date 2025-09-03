const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const bookingSchema = mongoose.Schema({
  location: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    default: true,
  },
  serviceId: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, 
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: {
    type: String,
    required: true,
  },
  landmark: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  pincode: {
    type: Number,
    required: true,
  },
  tipAmount: {
    type: Number,
  },
  modeOfPayment: {
    type: String,
    required: true,
    enum: ["cod", "online"], 
  },
  bookingStatus: {
    type: String,
    required: true,
    default: "orderPlaced",
    enum: ["orderPlaced", "venderAssigned", "bookingCompleted", "cancel"], 
  },
  paymentId: {
    type: String,
  },
  bookingId: {
    type: String,
  },
  signature: {
    type: String,
  },
  isRefunded:{
    type: Boolean,
  },
  totalAmount:{
    type: String,
    required: true
  },
  venderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vender",
  }, 
  canceledBy: {
    type: String,
    enum: ["user", "vendor", "admin"], 
  },
  cancelationReason: {
    type: String,
  }
});

bookingSchema.plugin(timestamps);
module.exports = mongoose.model("Booking", bookingSchema);
