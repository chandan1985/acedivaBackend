const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Installation = require("../model/installation.Schema");
const installationController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

installationController.post("/create", upload.single("banner"), async (req, res) => {
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
    const installationCreated = await Installation.create(obj);
    sendResponse(res, 200, "Success", {
      message: "Installlation created successfully!",
      data: installationCreated,
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
installationController.post("/list", async (req, res) => {
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
     const sortField = sortByField || "createdAt"; 
     const sortOrder = sortByOrder === "asc" ? 1 : -1; 
     const sortOption = { [sortField]: sortOrder };
    const serviceList = await Installation
    .find(query)
    .sort(sortOption)
    .limit(parseInt(pageCount))
    .skip(parseInt(pageNo-1) * parseInt(pageCount))
    const totalCount = await Installation.countDocuments({});
    const activeCount = await Installation.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Installation list retrieved successfully!",
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
installationController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const installationItem = await Installation.findById(id);
    if (!installationItem) {
      return sendResponse(res, 404, "Failed", {
        message: "Installation not found",
      });
    }
    await Installation.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "Installation deleted successfully!",
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
installationController.put("/update", upload.single("image"), async (req, res) => {
  try {
    const id = req.body.id;
    const installationData = await Installation.findById(id);
    if (!installationData) {
      return sendResponse(res, 404, "Failed", {
        message: "Installation not found",
      });
    }
    let updatedData = { ...req.body };
    if (req.file) {
      if (installationData.image) {
        const publicId = installationData.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error deleting old image from Cloudinary:", error);
          } else {
            console.log("Old image deleted from Cloudinary:", result);
          }
        });
      }
      const image = await cloudinary.uploader.upload(req.file.path);
      updatedData.image = image.url;
    }
    const updatedInstallation = await Installation.findByIdAndUpdate(id, updatedData, {
      new: true, 
    });
    sendResponse(res, 200, "Success", {
      message: "Installation updated successfully!",
      data: updatedInstallation,
      statusCode:"200"
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
installationController.put("/create-how-it-works", upload.single("image"), async (req, res) => {
  try {
    const { id, title, subTitle } = req.body;

    // Find the installation by ID
    const installationData = await Installation.findById(id);
    if (!installationData) {
      return sendResponse(res, 404, "Failed", {
        message: "Installation not found",
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
    const updatedInstallation = await Installation.findByIdAndUpdate(
      id,
      { $push: { howItWorks: howItWorks } }, // Corrected push operation
      { new: true }
    );
    sendResponse(res, 200, "Success", {
      message: "How It Works updated successfully!",
      data: updatedInstallation,
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
installationController.put("/delete-how-it-works", async (req, res) => {
  try {
    const { id, title } = req.body;

    // Find the installation by ID
    const installationData = await Installation.findOne({_id :id});
    if (!installationData) {
      return sendResponse(res, 404, "Failed", {
        message: "Installation not found",
      });
    }

    // Remove object with matching title from howItWorks array
    const updatedInstallation = await Installation.findByIdAndUpdate(
      id,
      { $pull: { howItWorks: { title: title } } }, // Removes the object with the matching title
      { new: true }
    );

    sendResponse(res, 200, "Success", {
      message: "How It Works entry deleted successfully!",
      data: updatedInstallation,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
installationController.post("/details", async (req, res) => {
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
      let response = await Installation.findOne({ _id: id });
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
installationController.post("/delete-how-it-works", async (req, res) => {
  try {
    const { id, title } = req.body;
    const serviceData = await Installation.findOne({_id :id});
    if (!serviceData) {
      return sendResponse(res, 404, "Failed", {
        message: "Installation not found",
      });
    }

    // Remove object with matching title from howItWorks array
    const updatedRepair = await Installation.findByIdAndUpdate(
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
module.exports = installationController;
