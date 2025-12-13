const User = require("../models/User");
const Message = require("../models/Message");

/**
 * ✅ FIND STUDENT BY SAP ID
 */
exports.findStudentBySapId = async (sapId) => {
  try {
    // Search by sap field (the only SAP ID field in User model)
    const student = await User.findOne({
      sap: sapId
    }).lean();

    if (!student) {
      console.warn(`⚠️ User not found with SAP ID: ${sapId}`);
      return null;
    }

    // Accept both "student" and "Student" roles
    const role = (student.role || '').toLowerCase();
    if (role === 'student') {
      console.log(`✅ Found student: ${student.full_name} (${sapId})`);
      return student;
    }

    console.warn(`⚠️ Found user with SAP ID ${sapId}, but role is "${student.role}" not "student"`);
    console.warn(`   User: ${student.full_name} - allowing anyway for library staff use case`);
    return student; // Return anyway for library staff use case
  } catch (err) {
    console.error("❌ Error finding student:", err);
    throw err;
  }
};

/**
 * ✅ GET STUDENT'S MESSAGES
 */
exports.getStudentMessages = async (studentSapId) => {
  try {
    const messages = await Message.find({
      recipientSapId: studentSapId
    })
      .populate("senderId", "full_name email")
      .sort({ createdAt: -1 })
      .lean();

    return messages;
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    throw err;
  }
};

/**
 * ✅ SEND MESSAGE FROM LIBRARY TO STUDENT
 */
exports.sendMessageToStudent = async (senderData, recipientSapId, subject, message, department) => {
  try {
    // Find the student
    const student = await this.findStudentBySapId(recipientSapId);

    if (!student) {
      throw new Error(`Student with SAP ID ${recipientSapId} not found`);
    }

    // Create conversation ID
    const conversationId = `${senderData.sapid || senderData.sap_id}-${recipientSapId}-${Date.now()}`;

    // Create message
    const newMessage = new Message({
      senderId: senderData._id,
      senderName: senderData.full_name,
      senderRole: senderData.role || "Library",
      senderSapId: senderData.sapid || senderData.sap_id,

      recipientId: student._id,
      recipientName: student.full_name,
      recipientRole: student.role,
      recipientSapId: recipientSapId, // ✅ KEY: Store SAP ID

      recipientDepartment: department || senderData.role,

      subject: subject.trim(),
      message: message.trim(),
      conversationId,

      status: "pending",
      isRead: false,
      createdAt: new Date()
    });

    await newMessage.save();

    console.log(`✅ Message sent from ${senderData.full_name} to ${student.full_name}`);

    return newMessage;
  } catch (err) {
    console.error("❌ Error sending message:", err);
    throw err;
  }
};

/**
 * ✅ GET UNREAD COUNT FOR STUDENT
 */
exports.getUnreadCount = async (studentSapId) => {
  try {
    const count = await Message.countDocuments({
      recipientSapId: studentSapId,
      isRead: false
    });

    return count;
  } catch (err) {
    console.error("❌ Error getting unread count:", err);
    throw err;
  }
};

/**
 * ✅ MARK MESSAGE AS READ
 */
exports.markAsRead = async (messageId) => {
  try {
    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    return message;
  } catch (err) {
    console.error("❌ Error marking as read:", err);
    throw err;
  }
};
