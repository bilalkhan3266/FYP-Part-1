// Script to add sample library messages to MongoDB
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/role_based_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const messageSchema = new mongoose.Schema({
  conversation_id: { type: String, index: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender_name: String,
  sender_role: String,
  sender_sapid: String,
  recipient_sapid: { type: String, required: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient_department: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  message_type: { type: String, enum: ['info', 'warning', 'error', 'success', 'question', 'reply', 'library_request', 'library_approval', 'library_rejection'], default: 'reply' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  is_read: { type: Boolean, default: false },
  read_at: Date,
  remarks: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parent_message_id: mongoose.Schema.Types.ObjectId,
  studentId: String,
  studentName: String,
  sapid: String,
  department: String,
  program: String,
  semester: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

async function seedMessages() {
  try {
    console.log('🌱 Starting to seed library messages...\n');

    // Delete existing library requests
    await Message.deleteMany({ message_type: 'library_request' });
    console.log('🗑️  Cleared existing library requests\n');

    // Sample library messages
    const sampleMessages = [
      {
        sender_name: 'Ali Khan',
        sender_sapid: '23-ARID-001',
        recipient_sapid: '23-ARID-001',
        subject: 'Library Book Request - Advanced JavaScript',
        message: 'I need access to the Advanced JavaScript programming book for my semester project. Please approve my library clearance.',
        message_type: 'library_request',
        status: 'Pending',
        studentId: new mongoose.Types.ObjectId(),
        studentName: 'Ali Khan',
        sapid: '23-ARID-001',
        department: 'Computer Science',
        program: 'BS Computer Science',
        semester: '6th'
      },
      {
        sender_name: 'Fatima Ahmed',
        sender_sapid: '23-ARID-002',
        recipient_sapid: '23-ARID-002',
        subject: 'Library Access Request',
        message: 'I am requesting library clearance to access the digital database and research materials for my thesis work.',
        message_type: 'library_request',
        status: 'Pending',
        studentId: new mongoose.Types.ObjectId(),
        studentName: 'Fatima Ahmed',
        sapid: '23-ARID-002',
        department: 'Computer Science',
        program: 'BS Information Technology',
        semester: '7th'
      },
      {
        sender_name: 'Muhammad Hassan',
        sender_sapid: '23-ARID-003',
        recipient_sapid: '23-ARID-003',
        subject: 'Clearance for Library Research Access',
        message: 'Requesting approval for library clearance to access journals and academic papers.',
        message_type: 'library_request',
        status: 'Pending',
        studentId: new mongoose.Types.ObjectId(),
        studentName: 'Muhammad Hassan',
        sapid: '23-ARID-003',
        department: 'Software Engineering',
        program: 'BS Software Engineering',
        semester: '5th'
      }
    ];

    // Insert all sample messages
    const inserted = await Message.insertMany(sampleMessages);
    console.log(`✅ Successfully added ${inserted.length} library messages!\n`);

    inserted.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.studentName} (${msg.sapid})`);
      console.log(`   Subject: ${msg.subject}`);
      console.log(`   Status: ${msg.status}\n`);
    });

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding messages:', err);
    process.exit(1);
  }
}

// Wait for connection and then seed
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB\n');
  seedMessages();
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
