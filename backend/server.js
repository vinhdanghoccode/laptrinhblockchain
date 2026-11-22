require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express     = require("express");
const cors        = require("cors");
const path        = require("path");
const tokenRoutes = require("./routes/token");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/token", tokenRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), contract: process.env.CONTRACT_ADDRESS || "chưa cấu hình" });
});

app.use((req, res) => res.status(404).json({ success: false, error: "Route không tồn tại" }));

app.listen(PORT, () => {
  console.log(`\nServer: http://localhost:${PORT}`);
  console.log(`Contract: ${process.env.CONTRACT_ADDRESS || "chưa cấu hình"}`);
  console.log("\nEndpoints:");
  console.log("  GET  /api/health");
  console.log("  GET  /api/token/info");
  console.log("  GET  /api/token/balance/:address");
  console.log("  POST /api/token/mint     { to, amount }");
  console.log("  POST /api/token/burn     { amount }");
  console.log("  POST /api/token/transfer { to, amount }");
  console.log("  POST /api/token/approve  { spender, amount }");
  console.log("  GET  /api/token/allowance/:owner/:spender");
});
