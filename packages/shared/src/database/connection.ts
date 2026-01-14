import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/code-runner';

interface MongooseConnection {
  isConnected: boolean;
}

const connection: MongooseConnection = {
  isConnected: false,
};

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (connection.isConnected) {
    console.log('Using existing MongoDB connection');
    return mongoose;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    connection.isConnected = db.connections[0].readyState === 1;
    console.log('Connected to MongoDB via Mongoose');

    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (!connection.isConnected) {
    return;
  }

  await mongoose.disconnect();
  connection.isConnected = false;
  console.log('Disconnected from MongoDB');
}
