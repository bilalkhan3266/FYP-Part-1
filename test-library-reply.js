// Test script to verify Library reply message delivery to student
const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test credentials
const studentEmail = 'ahmed@example.com';
const studentPassword = 'password123';
const libraryStaffEmail = 'librarystaff@example.com';
const libraryStaffPassword = 'LibraryPass123!';

let studentToken = '';
let libraryToken = '';
let studentUserId = '';
let libraryMessageId = '';

async function test() {
  try {
    console.log('🧪 Testing Library Reply Message Delivery\n');
    
    // 1. Login as Student
    console.log('1️⃣ Logging in as Student...');
    const studentLogin = await axios.post(`${API_URL}/api/login`, {
      email: studentEmail,
      password: studentPassword
    });
    
    studentToken = studentLogin.data.data.token;
    studentUserId = studentLogin.data.data.id;
    console.log(`   ✅ Student logged in. Token: ${studentToken.substring(0, 20)}...`);
    console.log(`   Student ID: ${studentUserId}\n`);
    
    // 2. Login as Library Staff
    console.log('2️⃣ Logging in as Library Staff...');
    const libraryLogin = await axios.post(`${API_URL}/api/login`, {
      email: libraryStaffEmail,
      password: libraryStaffPassword
    });
    
    libraryToken = libraryLogin.data.data.token;
    console.log(`   ✅ Library Staff logged in. Token: ${libraryToken.substring(0, 20)}...`);
    console.log(`   Library Staff ID: ${libraryLogin.data.data.id}\n`);
    
    // 3. Student sends message to Library
    console.log('3️⃣ Student sending message to Library...');
    const studentMessage = await axios.post(`${API_URL}/api/send`, {
      recipientDepartment: 'Library',
      subject: 'Book Request',
      message: 'Can I request a specific book?'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    const sentMessageId = studentMessage.data.messageId;
    console.log(`   ✅ Message sent. Message ID: ${sentMessageId}\n`);
    
    // 4. Library Staff views their messages
    console.log('4️⃣ Library Staff viewing their messages...');
    const libraryMessages = await axios.get(`${API_URL}/api/messages/my-messages`, {
      headers: { Authorization: `Bearer ${libraryToken}` }
    });
    
    console.log(`   ✅ Library Staff has ${libraryMessages.data.messages.length} messages`);
    if (libraryMessages.data.messages.length > 0) {
      const firstMessage = libraryMessages.data.messages[0];
      libraryMessageId = firstMessage._id;
      console.log(`   First message ID: ${libraryMessageId}`);
      console.log(`   From: ${firstMessage.sender_name}`);
      console.log(`   Subject: ${firstMessage.subject}\n`);
    }
    
    // 5. Library Staff replies to the message
    console.log('5️⃣ Library Staff replying to message...');
    const reply = await axios.post(`${API_URL}/api/messages/reply/${libraryMessageId}`, {
      message: 'Yes, we can help you find that book. Please visit the library counter.'
    }, {
      headers: { Authorization: `Bearer ${libraryToken}` }
    });
    
    console.log(`   ✅ Reply sent. Reply ID: ${reply.data.data._id}`);
    console.log(`   Recipient SAP ID: ${reply.data.data.recipient_sapid}`);
    console.log(`   Recipient ID: ${reply.data.data.recipient_id}\n`);
    
    // 6. Student checks their messages AFTER reply
    console.log('6️⃣ Student checking their messages for the reply...');
    const studentMessages = await axios.get(`${API_URL}/api/messages/my-messages`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    console.log(`   ✅ Student has ${studentMessages.data.messages.length} messages`);
    
    // Find the reply message
    const replyMessage = studentMessages.data.messages.find(msg => msg.message_type === 'reply');
    
    if (replyMessage) {
      console.log(`   ✅ REPLY FOUND IN STUDENT INBOX!`);
      console.log(`   Reply ID: ${replyMessage._id}`);
      console.log(`   From: ${replyMessage.sender_name}`);
      console.log(`   Message: "${replyMessage.message}"`);
      console.log(`   \n🎉 SUCCESS! Library reply is now visible to the student!\n`);
    } else {
      console.log(`   ❌ REPLY NOT FOUND IN STUDENT INBOX!`);
      console.log(`   \n   All student messages:`);
      studentMessages.data.messages.forEach((msg, idx) => {
        console.log(`   [${idx + 1}] ${msg.message_type.toUpperCase()}: ${msg.sender_name} - ${msg.subject}`);
      });
      console.log(`\n❌ FAILURE! The library reply is not appearing in student inbox.\n`);
    }
    
  } catch (err) {
    console.error('❌ Error during test:');
    if (err.response) {
      console.error(`   Status: ${err.response.status}`);
      console.error(`   Message: ${err.response.data.message}`);
    } else {
      console.error(`   ${err.message}`);
    }
  }
}

test();
