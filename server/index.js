import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:5173'].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json({ limit: '15mb' }));

connectDB();

app.get("/api/health", (req, res) =>{
    res.json({status: "ok", message: "Hookgen API is running"});
});

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/ai", aiRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>{
    console.log(`Server running on http://localhost:${PORT}`);
})
