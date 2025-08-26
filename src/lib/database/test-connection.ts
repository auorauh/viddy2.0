import { initializeDatabase, closeDatabase } from './init';

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    await initializeDatabase();
    console.log('✅ Database connection test passed');
    await closeDatabase();
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    process.exit(1);
  }
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnection();
}

export { testConnection };