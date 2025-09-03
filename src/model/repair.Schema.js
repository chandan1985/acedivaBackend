const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const repairSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  banner: {
    type: String,
    required: true,
  },
  rate: {
    type: String,
    required: true,
  },
  distance: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: true,
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "subCategory",
    required: true,
  },
  description: [{ type: String }],
  price: {
    type: Number,
    required: true,
  },
  howItWorks : [
    {
      title:{
        type:String,
        // required: true,
      },
      subTitle:{
        type:String,
        // required:true,
      },
      image:{
        type:String,
        // required:true,
      }
    }
  ],
  launchType:{
    type: String,
  }
});

repairSchema.plugin(timestamps);
module.exports = mongoose.model("repair", repairSchema);
