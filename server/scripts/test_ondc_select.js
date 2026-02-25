import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/Transaction.js';

dotenv.config();

// Connect to DB to fetch the latest transaction
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hailo')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function runSelectTest() {
    try {
        console.log('🔍 Looking for the most recent Search transaction...');
        // Find the most recent transaction that has results
        const transaction = await Transaction.findOne({ results: { $not: { $size: 0 } } })
            .sort({ createdAt: -1 });

        if (!transaction) {
            console.error('❌ No transactions with search results found in the database. Run the search test first.');
            process.exit(1);
        }

        console.log(`✅ Found Transaction ID: ${transaction.transactionId}`);
        console.log(`📊 Found ${transaction.results.length} quotes.`);

        // Pick the first quote
        const selectedQuote = transaction.results[0];
        console.log(`\n👉 Selecting Quote:`);
        console.log(`   Provider ID: ${selectedQuote.providerId}`);
        console.log(`   Item ID: ${selectedQuote.id}`);
        console.log(`   Fulfillment ID: ${selectedQuote.fulfillmentId}`);
        console.log(`   Price: ${selectedQuote.currency} ${selectedQuote.price}`);

        console.log('\n🚀 Initiating Select Request to Local Backend...');

        const backendSelectUrl = 'http://localhost:3000/api/v1/ondc/select'; // Or production if testing remotely

        const payload = {
            transactionId: transaction.transactionId,
            providerId: selectedQuote.providerId,
            itemId: selectedQuote.id
        };

        const response = await axios.post(backendSelectUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('\n✅ Backend /select endpoint responded with: 200 OK');
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        console.log('\n👉 Check the backend terminal logs to see if the outbound ONDC gateway Select call succeeded.');
        console.log('👉 If successful, go to the Pramaan dashboard and check if the dropdown updates to the next step.');

    } catch (error) {
        console.error('\n❌ SELECT TEST FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        await mongoose.disconnect();
    }
}

runSelectTest();
