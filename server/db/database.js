const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// Data is stored in db.json — you can open this file to see all your transactions!
const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// Set default structure if db.json doesn't exist yet
db.defaults({ transactions: [] }).write();

console.log('✅ Database ready — data stored in server/db/db.json');

module.exports = db;
