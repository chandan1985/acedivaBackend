const express = require("express");
const { sendResponse, generateOTP } = require("../utils/common");
require("dotenv").config();
const User = require("../model/user.Schema");
const Booking = require("../model/booking.Schema");
const Address = require("../model/address.Schema");
const SubCategory = require("../model/subCategory.Schema");
const repair = require("../model/repair.Schema");
const service = require("../model/service.Schema");
const installation = require("../model/installation.Schema");
const userController = express.Router();
const Category = require("../model/category.Schema");
const request = require("request");
const axios = require("axios");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const moment = require("moment");
const Support = require("../model/support.Schema");
const { sendNotification } = require("../utils/sendNotification");

userController.post("/send-otp", async (req, res) => {
  try {
    const { phoneNumber, ...otherDetails } = req.body;
    if (!phoneNumber) {
      return sendResponse(res, 400, "Failed", {
        message: "Phone number is required.",
        statusCode: 400,
      });
    }
    const otp = generateOTP();

    // Check if the user exists
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      // Create a new user with the provided details and OTP
      user = await User.create({
        phoneNumber,
        otp,
        ...otherDetails,
      });
      const token = jwt.sign(
        { userId: user._id, phoneNumber: user.phoneNumber },
        process.env.JWT_KEY
      );
      user.token = token;
      const admin = await User.findOne({role:"admin"})
  
      await  sendNotification({
        icon: "https://cdn-icons-png.flaticon.com/128/3177/3177440.png",
        title: `A new user has registered to the portal`,
        subTitle: `A new user has registered to the portal`,
        notifyUserId: "Admin",
        category: "User",
        subCategory: "Registration",
        notifyUser: "Admin",
        fcmToken:
        admin?.deviceId,
      });
      user = await User.findByIdAndUpdate(user.id, { token }, { new: true });
    } else {
      // Update the existing user's OTP
      user = await User.findByIdAndUpdate(user.id, { otp }, { new: true });
    }
    const appHash = "ems/3nG2V1H"; // Apne app ka actual hash yahan dalein

    // Properly formatted OTP message for autofill
    const otpMessage = `<#> ${otp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

    let optResponse = await axios.post(
      `https://api.authkey.io/request?authkey=${
        process.env.AUTHKEY_API_KEY
      }&mobile=${phoneNumber}&country_code=91&sid=${
        process.env.AUTHKEY_SENDER_ID
      }&company=Acediva&otp=${otp}&message=${encodeURIComponent(otpMessage)}`
    );

    if (optResponse?.status == "200") {
      return sendResponse(res, 200, "Success", {
        message: "OTP send successfully",
        data: user,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 422, "Failed", {
        message: "Unable to send OTP",
        statusCode: 200,
      });
    }
  } catch (error) {
    console.error("Error in /send-otp:", error.message);
    // Respond with failure
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
    });
  }
});
userController.post("/otp-verification", async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const user = await User.findOne({ phoneNumber: phoneNumber, otp: otp });
    if (user) {
      return sendResponse(res, 200, "Success", {
        message: "User logged in successfully",
        data: user,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 422, "Failed", {
        message: "Wrong OTP",
        statusCode: 422,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});
userController.post("/create-admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: email,
      password: password,
      role: "admin",
    });
    if (user) {
      return sendResponse(res, 422, "Failed", {
        message: "Admin already exists",
        data: user,
        statusCode: 422,
      });
    }
    let admin = await User.create(req.body);
    return sendResponse(res, 200, "Failed", {
      message: "Admin created successfully",
      data: admin,
      statusCode: 200,
    });
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});
userController.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({
      email: email,
      password: password,
      role: "admin",
    });
    if (user) {
      // Generate JWT token for the new user
      const token = jwt.sign(
        { userId: user._id, phoneNumber: user.phoneNumber },
        process.env.JWT_KEY
      );
      // Store the token in the user object or return it in the response
      user.token = token;
      user = await User.findByIdAndUpdate(
        user.id,
        { token, deviceId: req?.body?.deviceId },
        { new: true }
      );
      return sendResponse(res, 200, "Success", {
        message: "Admin logged in successfully",
        data: user,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 400, "Success", {
        message: "Invalid Credintials",
        statusCode: 400,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});
userController.post("/add-wish-list", async (req, res) => {
  try {
    const { userId, modelId, modelType } = req.body;

    // Validate input
    if (!userId || !modelId || !modelType) {
      return sendResponse(res, 400, "Failed", {
        message: "userId, modelId, and modelType are required.",
        statusCode: 400,
      });
    }

    // Check if the modelType is valid
    const validModelTypes = ["service", "repair", "installation"];
    if (!validModelTypes.includes(modelType)) {
      return sendResponse(res, 400, "Failed", {
        message: `Invalid modelType. Valid types are: ${validModelTypes.join(
          ", "
        )}`,
        statusCode: 400,
      });
    }

    // Find the user by ID
    let user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 404, "Failed", {
        message: "User not found.",
        statusCode: 404,
      });
    }

    // Check if the item is already in the wish list
    const itemIndex = user.wishList.findIndex(
      (item) =>
        item.modelId.toString() === modelId && item.modelType === modelType
    );

    if (itemIndex !== -1) {
      // Remove the item if it exists
      user.wishList.splice(itemIndex, 1);
      await user.save();

      return sendResponse(res, 200, "Success", {
        message: "Item removed from wish list successfully.",
        data: user.wishList,
        statusCode: 200,
      });
    } else {
      // Add the item to the wish list if it doesn't exist
      user.wishList.push({ modelId, modelType });
      await user.save();

      return sendResponse(res, 200, "Success", {
        message: "Item added to wish list successfully.",
        data: user.wishList,
        statusCode: 200,
      });
    }
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});
userController.get("/get-wish-list/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate input
    if (!userId) {
      return sendResponse(res, 400, "Failed", {
        message: "userId is required.",
        statusCode: 400,
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 404, "Failed", {
        message: "User not found.",
        statusCode: 404,
      });
    }

    // Define the model mapping for dynamic population
    const modelMapping = {
      service: service,
      repair: repair,
      installation: installation,
    };

    // Populate the wish list with model details based on modelType
    const populatedWishList = await Promise.all(
      user.wishList.map(async (item) => {
        const Model = modelMapping[item.modelType]; // Dynamically select the model
        if (Model) {
          // Find the model item and populate it with the details
          const populatedItem = await Model.findById(item.modelId);
          return {
            id: item._id, // Adding user-friendly field names
            modelId: item.modelId,
            modelType: item.modelType,
            modelDetails: populatedItem
              ? {
                  id: populatedItem._id,
                  name: populatedItem.name,
                  description: populatedItem.description,
                  rate: populatedItem.rate,
                  distance: populatedItem.distance,
                  status: populatedItem.status,
                  isFavourite: true,
                }
              : null,
          };
        }
        return item; // If no model found, return as is
      })
    );

    return sendResponse(res, 200, "Success", {
      message: "Wish list retrieved successfully.",
      data: populatedWishList,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});
userController.put("/update", upload.single("image"), async (req, res) => {
  try {
    const id = req.body._id;
    // Find the user by ID
    const userData = await User.findById(id);
    if (!userData) {
      return sendResponse(res, 404, "Failed", {
        message: "User not found",
      });
    }
    let updatedData = { ...req.body };
    if (req.body.firstName && req.body.lastName && req.body.email) {
      updatedData = { ...req.body, profileStatus: "completed" };
    }
    // Handle image upload if a new image is provided
    if (req.file) {
      let image = await cloudinary.uploader.upload(
        req.file.path,
        function (err, result) {
          if (err) {
            return err;
          } else {
            return result;
          }
        }
      );
      updatedData = { ...req.body, image: image.url };
    }
    // Update the user in the database
    const updatedUserData = await User.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
    });
    const admin = await User.findOne({role:"admin"})
    sendNotification({
      icon: `${updatedUserData.profilePic}`,
      title: `${updatedUserData.firstName} has completed the profile`,
      subTitle: `${updatedUserData.firstName} has completed the profile`,
      notifyUserId: "Admin",
      category: "User",
      subCategory: "Registration",
      notifyUser: "Admin",
      fcmToken:
      admin?.deviceId,
    });
    sendResponse(res, 200, "Success", {
      message: "User updated successfully!",
      data: updatedUserData,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
userController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
    } = req.body;
    const query = {};
    if (status) query.profileStatus = status;
    if (searchKey) query.firstName = { $regex: searchKey, $options: "i" };
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };
    const userList = await User.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));

    const totalCount = await User.countDocuments({});
    const activeCount = await User.countDocuments({
      profileStatus: "completed",
    });

    // Define the model mapping for dynamic population
    const modelMapping = {
      service,
      repair,
      installation,
    };

    const updatedUserList = await Promise.all(
      userList.map(async (user) => {
        const populatedWishList = await Promise.all(
          user.wishList.map(async (item) => {
            const Model = modelMapping[item.modelType]; // Dynamically select the model
            if (Model) {
              const populatedItem = await Model.findById(item.modelId);
              return {
                id: item._id,
                modelId: item.modelId,
                modelType: item.modelType,
                modelDetails: populatedItem
                  ? {
                      id: populatedItem._id,
                      name: populatedItem.name,
                      description: populatedItem.description,
                      rate: populatedItem.rate,
                      distance: populatedItem.distance,
                      status: populatedItem.status,
                    }
                  : null,
              };
            }
            return item;
          })
        );
        const bookingList = await Booking.find({ userId: user?._id });
        const addressList = await Address.find({ userId: user?._id });
        return {
          ...user.toObject(),
          wishList: populatedWishList,
          bookingList,
          addressList,
        };
      })
    );

    sendResponse(res, 200, "Success", {
      message: "User list retrieved successfully!",
      data: updatedUserList,
      documentCount: {
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
      },
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
userController.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userDetails = await User.findOne({ _id: id });
    if (!userDetails) {
      return sendResponse(res, 404, "Failed", {
        message: "User not found",
      });
    }
    sendResponse(res, 200, "Success", {
      message: "User details retrived Successfully",
      data: userDetails,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
userController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return sendResponse(res, 404, "Failed", {
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "User Deleted Successfully",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
userController.get("/dashboard-details", async (req, res) => {
  try {
    const [
      totalUser,
      activeUser,
      inactiveUser,
      totalCategory,
      activeCategory,
      inactiveCategory,
      totalSubCategory,
      activeSubCategory,
      inactiveSubCategory,
      totalBooking,
      activeBooking,
      bookingRequest,
      bookingCompleted,
      totalServices,
      totalRepair,
      totalInstallation,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ profileStatus: "completed" }),
      User.countDocuments({ profileStatus: "incompleted" }),

      Category.countDocuments({}),
      Category.countDocuments({ status: true }),
      Category.countDocuments({ status: false }),

      SubCategory.countDocuments({}),
      SubCategory.countDocuments({ status: true }),
      SubCategory.countDocuments({ status: false }),

      Booking.countDocuments({}),
      Booking.countDocuments({ bookingStatus: "venderAssigned" }),
      Booking.countDocuments({ bookingStatus: "orderPlaced" }),
      Booking.countDocuments({ bookingStatus: "bookingCompleted" }),

      service.countDocuments({}),
      repair.countDocuments({}),
      installation.countDocuments({}),
    ]);

    // **Last 15 Days Booking Count Logic**
    const last15Days = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: moment().subtract(15, "days").startOf("day").toDate(),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          noOfBookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    let bookingsLast15Days = [];
    for (let i = 14; i >= 0; i--) {
      let dateObj = moment().subtract(i, "days");
      let formattedDate = dateObj.format("Do MMM"); // "1st Jan" format
      let mongoDate = dateObj.format("YYYY-MM-DD"); // MongoDB ke format ke liye

      let bookingData = last15Days.find((b) => b._id === mongoDate); // Compare in same format

      bookingsLast15Days.push({
        date: formattedDate, // "1st Jan"
        noOfBookings: bookingData ? bookingData.noOfBookings : 0,
        mongoDate: mongoDate,
      });
    }
    const support = await Support.findOne({});
    sendResponse(res, 200, "Success", {
      message: "Dashboard details retrieved successfully",
      data: {
        users: { totalUser, activeUser, inactiveUser },
        categories: { totalCategory, activeCategory, inactiveCategory },
        subCategories: {
          totalSubCategory,
          activeSubCategory,
          inactiveSubCategory,
        },
        bookings: {
          totalBooking,
          activeBooking,
          bookingRequest,
          bookingCompleted,
        },
        services: { totalServices, totalRepair, totalInstallation },
        support: support,
        last15DaysBookings: bookingsLast15Days, // Reverse for ascending order
      },
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

module.exports = userController;
