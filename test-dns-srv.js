const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to bypass local SRV resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const db = 'mongodb+srv://Ditta:67RNUFgR@intento1.siuhljd.mongodb.net/agilflow?retryWrites=true&w=majority&appName=Intento1';

console.log('Testing connection with Google DNS bypass...');

mongoose.connect(db)
    .then(() => {
        console.log('Successfully connected to MongoDB using SRV + Google DNS!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
