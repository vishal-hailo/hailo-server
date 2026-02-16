import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
} else {
    console.warn("⚠️ GEMINI_API_KEY is missing. AI Insights will be disabled.");
}

export const geminiService = {
    /**
     * Generate insight for a ride quote
     * @param {Object} currentQuote - The quote to analyze
     * @param {Array} historicalData - Array of past rides in this area
     * @returns {Promise<String>} - Short insight text
     */
    async generateInsight(currentQuote, historicalData) {
        if (!model) return "AI unavailable";

        try {
            const prompt = `
            Context: You are "The Brain" of a ride-hailing app in Mumbai.
            Current Option: ${currentQuote.providerName} (${currentQuote.vehicleType}) for ₹${currentQuote.price}.
            
            Historical Context (Last 3 hours in this area):
            ${historicalData.length > 0 ? JSON.stringify(historicalData.slice(0, 5)) : "No recent data."}
            
            Task: Compare the current price with historical trends. Is this a good deal? 
            Output: A single short sentence (max 10 words) advising the user. 
            Examples: "Great price! 15% lower than average.", "High demand. Price is surging.", "Fair price for this time."
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error("Gemini Error:", error.message);
            return "AI Analysis failed";
        }
    }
};
