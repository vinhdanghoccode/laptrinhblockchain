const express = require("express");
const router  = express.Router();
const svc     = require("../services/contractService");

function handleError(res, err) {
  console.error("[API]", err.message);
  const status = err.message.includes("không hợp lệ") ? 400 : 500;
  res.status(status).json({ success: false, error: err.message });
}

// GET /api/token/info
router.get("/info", async (req, res) => {
  try { res.json({ success: true, data: await svc.getTokenInfo() }); }
  catch (e) { handleError(res, e); }
});

// GET /api/token/balance/:address
router.get("/balance/:address", async (req, res) => {
  try { res.json({ success: true, data: await svc.getBalance(req.params.address) }); }
  catch (e) { handleError(res, e); }
});

// POST /api/token/mint  { to, amount }
router.post("/mint", async (req, res) => {
  const { to, amount } = req.body;
  if (!to || !amount) return res.status(400).json({ success: false, error: "Thiếu 'to' hoặc 'amount'" });
  try { res.json({ success: true, data: await svc.mintTokens(to, amount) }); }
  catch (e) { handleError(res, e); }
});

// POST /api/token/burn  { amount }
router.post("/burn", async (req, res) => {
  const { amount } = req.body;
  if (!amount) return res.status(400).json({ success: false, error: "Thiếu 'amount'" });
  try { res.json({ success: true, data: await svc.burnTokens(amount) }); }
  catch (e) { handleError(res, e); }
});

// POST /api/token/transfer  { to, amount }
router.post("/transfer", async (req, res) => {
  const { to, amount } = req.body;
  if (!to || !amount) return res.status(400).json({ success: false, error: "Thiếu 'to' hoặc 'amount'" });
  try { res.json({ success: true, data: await svc.transferTokens(to, amount) }); }
  catch (e) { handleError(res, e); }
});

// GET /api/token/allowance/:owner/:spender
router.get("/allowance/:owner/:spender", async (req, res) => {
  try {
    res.json({
      success: true,
      data: await svc.getAllowance(req.params.owner, req.params.spender)
    });
  } catch (e) { handleError(res, e); }
});

// POST /api/token/approve  { spender, amount }
router.post("/approve", async (req, res) => {
  const { spender, amount } = req.body;
  if (!spender || amount === undefined) return res.status(400).json({ success: false, error: "Thiếu 'spender' hoặc 'amount'" });
  try { res.json({ success: true, data: await svc.approveSpender(spender, amount) }); }
  catch (e) { handleError(res, e); }
});

module.exports = router;

