const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
  },
  description: {
    type: String,
  },
  otp: {
    type: String,
  },
  token: {
    type: String,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  countryCode: {
    type: String,
    default: "91",
  },
  profileStatus:{
    type: String,
    default: "incompleted",
    required: true,
      enum: ["incompleted", "completed"],
  },
  wishList: [
    {
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ObjectId of the referenced model
      modelType: {
        type: String,
        required: true,
        enum: ["service", "repair", "installation"], // Allowed types
      },
    },
  ],
  deviceId: {
    type: String,
  },
});

userSchema.plugin(timestamps);
module.exports = mongoose.model("User", userSchema);
