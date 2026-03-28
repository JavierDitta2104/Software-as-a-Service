const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const db = process.env.MONGODB_URI;
console.log('Testing connection to DB...');

mongoose.connect(db)
    .then(() => {
        console.log('Successfully connected to MongoDB!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
