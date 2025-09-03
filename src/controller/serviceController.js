const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const serviceController = express.Router();
require("dotenv").config();
const repair = require("../model/repair.Schema");
const installation = require("../model/installation.Schema");
const service = require("../model/service.Schema");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");

serviceController.post("/create", upload.single("banner"), async (req, res) => {
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
    const serviceCreated = await service.create(obj);
    sendResponse(res, 200, "Success", {
      message: "Services created successfully!",
      data: serviceCreated,
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
serviceController.post("/list", async (req, res) => {
  try {
    const { searchKey = "", status, pageNo = 1, pageCount = 10, sortByField, sortByOrder } = req.body;

    const query = {};
    if (status) query.status = status;
    if (searchKey) query.name = { $regex: searchKey, $options: "i" };

    // Construct sorting object
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // Fetch the category list
    const serviceList = await service
      .find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));

    const totalCount = await service.countDocuments({});
    const activeCount = await service.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Service list retrieved successfully!",
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
serviceController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Find the category by ID
    const serviceItem = await service.findById(id);
    if (!serviceItem) {
      return sendResponse(res, 404, "Failed", {
        message: "Service not found",
      });
    }
    // Delete the category from the database
    await service.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Service deleted successfully",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
serviceController.put("/update", upload.single("banner"), async (req, res) => {
  try {
    const id = req.body.id;

    // Find the category by ID
    const serviceData = await service.findById(id);
    if (!serviceData) {
      return sendResponse(res, 404, "Failed", {
        message: "Service not found",
      });
    }

    let updatedData = { ...req.body };
    // Ensure descriptions is an array
    if (typeof req.body.descriptions === "string") {
      updatedData.descriptions = JSON.parse(req.body.descriptions);
    }
    if (req.file) {
      // Upload the new image to Cloudinary
      const banner = await cloudinary.uploader.upload(req.file.path);
      updatedData.banner = banner.url;
    }
    // Update the category in the database
    const updatedService = await service.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
    });

    sendResponse(res, 200, "Success", {
      message: "Service updated successfully!",
      data: updatedService,
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
serviceController.put("/create-how-it-works", upload.single("image"), async (req, res) => {
  try {
    const { id, title, subTitle } = req.body;

    // Find the service by ID
    const serviceData = await service.findById(id);
    if (!serviceData) {
      return sendResponse(res, 404, "Failed", {
        message: "Service not found",
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
    const updatedService = await service.findByIdAndUpdate(
      id,
      { $push: { howItWorks: howItWorks } }, 
      { new: true }
    );

    sendResponse(res, 200, "Success", {
      message: "How It Works updated successfully!",
      data: updatedService,
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
serviceController.post("/details", async (req, res) => {
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
serviceController.post("/search-list",auth, async (req, res) => {
  try {
    const { searchKey = "", status, pageNo = 1, pageCount = 10, sortByField, sortByOrder } = req.body;
    const query = {};
    if (searchKey) query.name = { $regex: searchKey, $options: "i" };
    // Fetch the category list
    const serviceList = await service.find(query);
    const repairList = await repair.find(query);
    const installationList = await installation.find(query);
     // Wishlist IDs extract karna
     const wishListIds = req.user.wishList.map((item) => item.modelId.toString());
    const updateListWithWishlist = (list, type) => {
      return list.map((item) => ({
        ...item._doc,
        serviceType:type,
        isFavourite: wishListIds.includes(item._id.toString()) && 
                 req.user.wishList.some(w => w.modelId.toString() === item._id.toString() && w.modelType === type)
      }));
    };
    const updatedServiceList = updateListWithWishlist(serviceList, "service");
    const updatedRepairList = updateListWithWishlist(repairList, "repair");
    const updatedInstallationList = updateListWithWishlist(installationList, "installation");
    sendResponse(res, 200, "Success", {
      message: "Service list retrieved successfully!",
      data: [...updatedServiceList, ...updatedRepairList, ...updatedInstallationList],
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
serviceController.post("/delete-how-it-works", async (req, res) => {
  try {
    const { id, title } = req.body;

    // Find the installation by ID
    const serviceData = await service.findOne({_id :id});
    if (!serviceData) {
      return sendResponse(res, 404, "Failed", {
        message: "Service not found",
      });
    }

    // Remove object with matching title from howItWorks array
    const updatedService = await service.findByIdAndUpdate(
      id,
      { $pull: { howItWorks: { title: title } } }, // Removes the object with the matching title
      { new: true }
    );

    sendResponse(res, 200, "Success", {
      message: "How It Works entry deleted successfully!",
      data: updatedService,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
module.exports = serviceController;
