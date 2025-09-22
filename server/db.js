import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://lab:Santheesh2006@lab.vuljlg2.mongodb.net/?retryWrites=true&w=majority&appName=Lab';
const DB_NAME = 'lab_booking_system';

let client = null;
let db = null;

/**
 * Connect to MongoDB database
 * @returns {Promise<import('mongodb').Db>} Database instance
 */
export async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Get database instance
 * @returns {Promise<import('mongodb').Db>} Database instance
 */
export async function getDatabase() {
  if (!db) {
    return await connectToDatabase();
  }
  return db;
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
