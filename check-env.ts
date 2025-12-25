import * as dotenv from "dotenv";
dotenv.config();

console.log("Checking environment variables...");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL start:", process.env.DATABASE_URL.substring(0, 20));
} else {
    console.error("DATABASE_URL is missing!");
}
