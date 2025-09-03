const Notification = require("../model/notification.Schema");
const admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
exports.sendNotification = async (data) => {
  console.log(data)
  try {
    // Save notification to DB
    const notificationCreated = await Notification.create(data);

    // Check if FCM token is present
    if (!data?.fcmToken) {
      console.warn("FCM token missing — notification not sent.");
      return notificationCreated;
    }

    // Prepare FCM message
    const message = {
      notification: {
        title: data?.title || "Default Title",
        body: data?.subTitle || "Default Body",
        image: data?.icon || null,
      },
      token: data.fcmToken,
    };

    // Send notification via Firebase
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);

    // Return both DB entry & FCM response (optional)
    return {
      notification: notificationCreated,
      fcmResponse: response,
    };

  } catch (error) {
    console.error("Error while sending notification:", error.message);
    throw error;
  }
};

