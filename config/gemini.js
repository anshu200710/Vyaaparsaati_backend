import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the model
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export const generateAIResponse = async (conversationHistory) => {
    try {
        // Build chat history for Gemini
        const chat = model.startChat({
            history: conversationHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.message }],
            })),
        });

        // Generate response
        const result = await chat.sendMessage('Based on our conversation, please provide a helpful response.');
        const response = result.response.text();

        return response;
    } catch (error) {
        console.error('Error generating AI response:', error);
        throw error;
    }
};

// Alternative: Simple question answering (no history)
export const askGemini = async (question) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(question);
        const response = result.response.text();
        return response;
    } catch (error) {
        console.error('Error asking Gemini:', error);
        throw error;
    }
};

export default genAI;
