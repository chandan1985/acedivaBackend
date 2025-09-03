const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const bannerSchema = mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  category:{
    type: String,
    required: true,
  },
  status:{
    type: Boolean,
    default: true,
  }
});

bannerSchema.plugin(timestamps);
module.exports = mongoose.model("Banner", bannerSchema);
