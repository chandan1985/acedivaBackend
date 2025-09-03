const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const repair = require("../model/repair.Schema");
const repairController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

repairController.post("/create", upload.single("banner"), async (req, res) => {
  try {
    let obj;
    if (req.file) {
      let banner = await cloudinary.uploader.upload(req.file.path, function (err, result) {
        if (err) {
          return err;
        } else {
          return result;
        }
      });
      obj = { ...req.body, banner: banner.url };
    }
    const repairCreated = await repair.create(obj);
    sendResponse(res, 200, "Success", {
      message: "Repair created successfully!",
      data: repairCreated,
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode:500
    });
  }
});
repairController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "", 
      status, 
      pageNo=1, 
      pageCount = 10,
      sortByField, 
      sortByOrder
    } = req.body;

    const query = {};
    if (status) query.status = status;
    if (searchKey) query.name = { $regex: searchKey, $options: "i" };

     // Construct sorting object
     const sortField = sortByField || "createdAt"; 
     const sortOrder = sortByOrder === "asc" ? 1 : -1; 
     const sortOption = { [sortField]: sortOrder };

    // Fetch the category list
    const serviceList = await repair
    .find(query)
    .sort(sortOption)
    .limit(parseInt(pageCount))
    .skip(parseInt(pageNo-1) * parseInt(pageCount))
     
    const totalCount = await repair.countDocuments({});
    const activeCount = await repair.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Repair list retrieved successfully!",
      documentCount: { totalCount, activeCount, inactiveCount: totalCount - activeCount },
      data: serviceList,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
repairController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const repairItem = await repair.findById(id);
    if (!repairItem) {
      return sendResponse(res, 404, "Failed", {
        message: "Repair not found",
      });
    }

    

    // Delete the category from the database
    await repair.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Repair deleted successfully!",
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
repairController.put("/update", upload.single("image"), async (req, res) => {
  try {
    const id = req.body.id;
    const repairData = await repair.findById(id);
    if (!repairData) {
      return sendResponse(res, 404, "Failed", {
        message: "Repair Id not found",
      });
    }

    let updatedData = { ...req.body };

    // If a new image is uploaded
    if (req.file) {
      // Delete the old image from Cloudinary
      if (repairData.image) {
        const publicId = repairData.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error deleting old image from Cloudinary:", error);
          } else {
            console.log("Old image deleted from Cloudinary:", result);
          }
        });
      }

      // Upload the new image to Cloudinary
      const image = await cloudinary.uploader.upload(req.file.path);
      updatedData.image = image.url;
    }

    // Update the category in the database
    const updatedRepairData = await repair.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
    });

    sendResponse(res, 200, "Success", {
      message: "Repair updated successfully!",
      data: updatedRepairData,
      statusCode:"200"
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
repairController.put("/create-how-it-works", upload.single("image"), async (req, res) => {
  try {
    const { id, title, subTitle } = req.body;

    // Find the service by ID
    const repairData = await repair.findById(id);
    if (!repairData) {
      return sendResponse(res, 404, "Failed", {
        message: "Repair not found",
      });
    }

    // Create howItWorks object
    const howItWorks = { title, subTitle };

    // Upload image to Cloudinary if file is provided
    if (req.file) {
      const image = await cloudinary.uploader.upload(req.file.path);
      howItWorks.image = image.url;
    }

    // Append howItWorks object to the array
    const updatedRepair = await repair.findByIdAndUpdate(
      id,
      { $push: { howItWorks: howItWorks } }, // Corrected push operation
      { new: true }
    );

    sendResponse(res, 200, "Success", {
      message: "How It Works updated successfully!",
      data: updatedRepair,
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

repairController.post("/details", async (req, res) => {
  try {
    const { id, serviceType } = req.body;
    if (!id || !serviceType) {
      sendResponse(res, 200, "Success", {
        message: "Id aur service type not provided",
        statusCode: 403,
      });
      return;
    }
    if (serviceType == "service") {
      let response = await service.findOne({ _id: id });
      sendResponse(res, 200, "Success", {
        message: "Service details fetched successfully",
        data: response,
        statusCode: 200,
      });
      return;
    }
    if (serviceType == "repair") {
      let response = await repair.findOne({ _id: id });
      sendResponse(res, 200, "Success", {
        message: "Service details fetched successfully",
        data: response,
        statusCode: 200,
      });
      return;
    }
    if (serviceType == "installation") {
      let response = await installation.findOne({ _id: id });
      sendResponse(res, 200, "Success", {
        message: "Service details fetched successfully",
        data: response,
        statusCode: 200,
      });
      return;
    }
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
repairController.post("/delete-how-it-works", async (req, res) => {
  try {
    const { id, title } = req.body;
    const serviceData = await repair.findOne({_id :id});
    if (!serviceData) {
      return sendResponse(res, 404, "Failed", {
        message: "Repair not found",
      });
    }

    // Remove object with matching title from howItWorks array
    const updatedRepair = await repair.findByIdAndUpdate(
      id,
      { $pull: { howItWorks: { title: title } } }, // Removes the object with the matching title
      { new: true }
    );

    sendResponse(res, 200, "Success", {
      message: "How It Works entry deleted successfully!",
      data: updatedRepair,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
module.exports = repairController;
