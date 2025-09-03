const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Address = require("../model/address.Schema");
const addressController = express.Router();
require("dotenv").config();

addressController.post("/create", async (req, res) => {
  try {
    const addressCreated = await Address.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "Address created successfully!",
      data: addressCreated,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});
addressController.get("/list/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const addressList = await Address.find({ userId: id });
    sendResponse(res, 200, "Success", {
      message: "Address list retrived successfully!",
      data: addressList,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 200,
    });
  }
});
addressController.put("/update", async (req, res) => {
  try {
    const id = req.body._id;
    const address = await Address.findById(id);
    if (!address) {
      return sendResponse(res, 404, "Failed", {
        message: "Address not found",
        statusCode: 403,
      });
    }
    const updatedAddress = await Address.findByIdAndUpdate(id, req.body, {
      new: true, 
    });

    sendResponse(res, 200, "Success", {
      message: "Address updated successfully!",
      data: updatedAddress,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});
addressController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findById(id);
    if (!address) {
      return sendResponse(res, 404, "Failed", {
        message: "Address not found",
      });
    }
    await Address.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "Address  deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 200,
    });
  }
});

module.exports = addressController;
