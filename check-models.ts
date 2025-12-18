
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No GEMINI_API_KEY found in environment variables.");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(key);
    console.log("Checking models via HTTP API...");

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);

        if (!response.ok) {
            console.error(`API Request Failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response body:", text);
        } else {
            const data = await response.json();
            console.log("Available Models:");
            if (data.models) {
                data.models.forEach((m: any) => {
                    if (m.name.includes("pro")) {
                        console.log(`- ${m.name}`);
                    }
                });
            } else {
                console.log("No models returned in list.");
                console.log("Full response:", JSON.stringify(data, null, 2));
            }
        }
    } catch (error: any) {
        console.error("Network error fetching models:", error.message);
    }
}

listModels();
