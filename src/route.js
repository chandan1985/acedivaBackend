const express = require("express");
const router = express.Router();
const userController = require("./controller/userController");
const categoryController = require("./controller/categoryController");
const subCategoryController = require("./controller/subCategoryController");
const serviceController = require("./controller/serviceController");
const repairController = require("./controller/repairController");
const installationController = require("./controller/installationController");
const bookingController = require("./controller/bookingController");
const bannerController = require("./controller/bannerController");
const addressController = require("./controller/addressController");
const supportController = require("./controller/supportController");
const venderController = require("./controller/venderController");
const notificationController = require("./controller/notificationController");

router.use("/user", userController);
router.use("/category", categoryController);
router.use("/sub-category", subCategoryController);
router.use("/service", serviceController);
router.use("/repair", repairController);
router.use("/installation", installationController);
router.use("/booking", bookingController);
router.use("/banner", bannerController);
router.use("/address", addressController);
router.use("/support", supportController);
router.use("/vendor", venderController);
router.use("/notification", notificationController);


module.exports = router;