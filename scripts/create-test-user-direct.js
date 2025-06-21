const bcrypt = require('bcryptjs');

console.log("🚀 We're on the Moon Yall!");

// Test user credentials
const testUser = {
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'testpassword1'
};

console.log('🧪 Creating test user...');
console.log(`Username: ${testUser.username}`);
console.log(`Email: ${testUser.email}`);
console.log(`Password: ${testUser.password}`);

// Hash the password
bcrypt.hash(testUser.password, 10).then(hashedPassword => {
  console.log('\n✅ Password hashed successfully');
  console.log(`Hashed password: ${hashedPassword.substring(0, 20)}...`);
  
  console.log('\n📋 Test user data ready for API:');
  console.log(JSON.stringify({
    username: testUser.username,
    email: testUser.email,
    password: testUser.password
  }, null, 2));
  
  console.log('\n🚀 To create the test user, run:');
  console.log(`curl -X POST http://localhost:3000/api/auth/register \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '${JSON.stringify({
    username: testUser.username,
    email: testUser.email,
    password: testUser.password
  })}'`);
  
  console.log('\n🔐 To login with the test user, run:');
  console.log(`curl -X POST http://localhost:3000/api/auth/login \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '${JSON.stringify({
    username: testUser.username,
    password: testUser.password
  })}'`);
  
  console.log('\n💡 The server should be running on http://localhost:3000');
  console.log('   Run "npm start" in another terminal to start the server');
}); 