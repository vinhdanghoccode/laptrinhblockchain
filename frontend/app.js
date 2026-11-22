/* ============================================================
   StartupToken (STK) ERC-20 DApp — Frontend Controller Logic
   Hỗ trợ 2 chế độ linh hoạt:
     1. Trực tiếp qua MetaMask Web3 + Ethers.js v6 (Client-side)
     2. Thông qua Backend Node.js/Express API (Server-side)
   ============================================================ */

const API_BASE = "http://localhost:3000/api/token";
const HEALTH_URL = "http://localhost:3000/api/health";

// ─── ERC-20 Full ABI ──────────────────────────────────────────
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function owner() view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function tokenInfo() view returns (string,string,uint256,uint256,address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event TokensMinted(address indexed to, uint256 amount)",
  "event TokensBurned(address indexed from, uint256 amount)"
];

// ─── Default Configuration & State ───────────────────────────
const DEFAULT_CONTRACT = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
let contractAddress = "";
let walletAddress = null;
let provider = null;
let signer = null;
let contract = null;
let useBackend = false;
let myBalanceStk = "0";
let txHistory = JSON.parse(localStorage.getItem("stk_tx_history") || "[]");

// ─── Initialization ──────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  renderTxHistory();
  await checkBackendConnection();
  await initWeb3IfAvailable();
  await loadTokenInfo();
  updateContractDisplay();
  applyUrlState();
});

// ─── Main View Navigation (Tabs) ─────────────────────────────
function switchMainView(viewName) {
  const validViews = ["dashboard", "tokenomics", "audit"];
  if (!validViews.includes(viewName)) viewName = "dashboard";

  // Cập nhật trạng thái active của các nút trên Navbar
  validViews.forEach((v) => {
    const btn = document.getElementById(`nav-tab-${v}`);
    const viewContainer = document.getElementById(`view-${v}`);
    if (btn) {
      if (v === viewName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
    if (viewContainer) {
      if (v === viewName) {
        viewContainer.classList.remove("hidden");
      } else {
        viewContainer.classList.add("hidden");
      }
    }
  });

  // Đồng bộ URL query param nếu cần
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("view", viewName);
    window.history.replaceState({}, "", url);
  } catch (e) {}
}
window.switchMainView = switchMainView;

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  const state = params.get("state");
  const view = params.get("view");

  if (view) {
    switchMainView(view);
  } else if (state === "history" || state === "audit") {
    switchMainView("audit");
  } else if (state === "tokenomics") {
    switchMainView("tokenomics");
  }

  if (!state) return;

  // Auto-connect demo wallet if requested
  if (state !== "initial") {
    walletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    updateWalletUI(walletAddress);
    myBalanceStk = "10000000";
    setText("my-token-balance", fmtNumber(myBalanceStk));
    setText("my-eth-val", "10000.00 ETH");
    const ownerBadge = document.getElementById("is-owner-badge");
    if (ownerBadge) {
      ownerBadge.textContent = "✓ Bạn là Quản trị viên (Owner)";
      ownerBadge.style.color = "#10b981";
    }
  }

  if (state === "lookup") {
    const addr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const inp = document.getElementById("input-balance-addr");
    if (inp) inp.value = addr;
    const box = document.getElementById("balance-result-box");
    if (box) box.classList.remove("hidden");
    setText("res-balance-addr", shortAddr(addr));
    setText("res-balance-val", "50,000 STK");
  } else if (state === "transfer") {
    const btn = document.querySelector(`.seg-btn[data-tab="transfer"]`);
    if (btn) switchTab("transfer", btn);
    const to = document.getElementById("transfer-to");
    const amt = document.getElementById("transfer-amount");
    if (to) to.value = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    if (amt) amt.value = "50000";
  } else if (state === "mint") {
    const btn = document.querySelector(`.seg-btn[data-tab="mint"]`);
    if (btn) switchTab("mint", btn);
    const to = document.getElementById("mint-to");
    const amt = document.getElementById("mint-amount");
    if (to) to.value = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    if (amt) amt.value = "1000000";
  } else if (state === "burn") {
    const btn = document.querySelector(`.seg-btn[data-tab="burn"]`);
    if (btn) switchTab("burn", btn);
    const amt = document.getElementById("burn-amount");
    if (amt) amt.value = "25000";
  } else if (state === "approve") {
    const btn = document.querySelector(`.seg-btn[data-tab="approve"]`);
    if (btn) switchTab("approve", btn);
    const sp = document.getElementById("approve-spender");
    const amt = document.getElementById("approve-amount");
    if (sp) sp.value = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    if (amt) amt.value = "100000";
  } else if (state === "history" || state === "dashboard" || state === "connected") {
    txHistory = [
      { type: "TRANSFER", txHash: "0x4a1f9e2b10c87421de83fa09bc12658421890cd17e4367980ef5246738192a01", blockNumber: 104, detail: "Gửi 50,000 STK đến 0x7099...79C8", time: "09:15:22" },
      { type: "MINT", txHash: "0x8e3b7401cdef2391054a8b7263541890abce341902837461908ef1234567890a", blockNumber: 103, detail: "Đúc 1,000,000 STK cho 0xf39F...2266", time: "09:12:05" },
      { type: "APPROVE", txHash: "0x19cd88ef39120485710293847561029384756102938475610293847561029384", blockNumber: 102, detail: "Ủy quyền 100,000 STK cho 0x3C44...93BC", time: "09:08:41" },
      { type: "BURN", txHash: "0x77ae550183920192837461920384756102938475610293847561029384756102", blockNumber: 101, detail: "Tiêu hủy 25,000 STK", time: "09:04:18" }
    ];
    renderTxHistory();
  } else if (state === "settings") {
    const dd = document.getElementById("settings-dropdown");
    if (dd) dd.classList.remove("hidden");
  } else if (state === "tokenomics") {
    const card = document.getElementById("tokenomics-card");
    if (card) {
      card.style.borderColor = "#2563eb";
      card.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.2)";
    }
  } else if (state === "toast") {
    showToast("Giao dịch chuyển 50,000 STK thành công! Khối: #105 | TxHash: 0x4a1f...2a01", "success");
  } else if (state === "mint_toast") {
    const btn = document.querySelector(`.seg-btn[data-tab="mint"]`);
    if (btn) switchTab("mint", btn);
    showToast("Giao dịch đúc 1,000,000 STK thành công! Khối: #106 | TxHash: 0x8e3b...890a", "success");
  } else if (state === "burn_toast") {
    const btn = document.querySelector(`.seg-btn[data-tab="burn"]`);
    if (btn) switchTab("burn", btn);
    showToast("Giao dịch tiêu hủy 25,000 STK thành công! Khối: #107 | TxHash: 0x77ae...6102", "success");
  }
}

// ─── Backend & Mode Detection ────────────────────────────────
async function checkBackendConnection() {
  const statusPill = document.getElementById("backend-status");
  const statusText = document.getElementById("backend-status-text");
  const modeBadge = document.getElementById("mode-badge");

  try {
    const res = await fetch(HEALTH_URL);
    if (res.ok) {
      const data = await res.json();
      useBackend = true;
      if (statusPill) statusPill.className = "nav-chip status-connected";
      if (statusText) statusText.textContent = "API Sẵn sàng";
      if (modeBadge) modeBadge.textContent = "Hybrid";

      // Luôn đồng bộ địa chỉ contract mới nhất từ backend
      if (data.contract && data.contract.startsWith("0x")) {
        contractAddress = data.contract;
        localStorage.setItem("stk_contract_address", contractAddress);
      } else if (!contractAddress) {
        contractAddress = DEFAULT_CONTRACT;
      }
      return;
    }
  } catch (err) {
    // Backend offline
  }

  useBackend = false;
  if (statusPill) statusPill.className = "nav-chip status-disconnected";
  if (statusText) statusText.textContent = "Web3";
  if (modeBadge) modeBadge.textContent = "Web3";
}

// ─── Web3 & Network Helper ────────────────────────────────────
async function ensureCorrectNetwork() {
  if (!window.ethereum) return false;
  try {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    // 0x7a69 = 31337 (Localhost / GoChain Testnet), 0x539 = 1337, 0xaa36a7 = 11155111 (Sepolia)
    if (currentChainId !== "0x7a69" && currentChainId !== "0x539" && currentChainId !== "0xaa36a7") {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x7a69" }],
        });
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x7a69",
              chainName: "GoChain Testnet (Localhost)",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "GO", symbol: "GO", decimals: 18 }
            }]
          });
        }
      }
    }
    return true;
  } catch (err) {
    console.warn("Lỗi kiểm tra/chuyển mạng:", err);
    return false;
  }
}

async function updateNetworkUI() {
  const networkNameEl = document.getElementById("network-name");
  if (!window.ethereum || !networkNameEl) return;
  try {
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
    const chainId = parseInt(chainIdHex, 16);
    if (chainId === 11155111) {
      networkNameEl.textContent = "Sepolia Testnet";
      networkNameEl.style.color = "";
    } else if (chainId === 31337 || chainId === 1337) {
      networkNameEl.textContent = "GoChain Testnet (Localhost)";
      networkNameEl.style.color = "";
    } else if (chainId === 1) {
      networkNameEl.textContent = "⚠️ Đang ở Ethereum Mainnet (Nhấp để đổi)";
      networkNameEl.style.color = "#ef4444";
    } else {
      networkNameEl.textContent = `Chain ID: ${chainId}`;
      networkNameEl.style.color = "";
    }
  } catch (e) {
    console.warn("Lỗi đọc mạng:", e);
  }
}

// ─── Web3 & MetaMask ─────────────────────────────────────────
async function initWeb3IfAvailable() {
  if (window.ethereum) {
    try {
      await ensureCorrectNetwork();
      provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        walletAddress = accounts[0].address;
        signer = await provider.getSigner();
        updateWalletUI(walletAddress);
        setupContractInstance();
        await refreshMyBalance();
      }
      await updateNetworkUI();
    } catch (e) {
      console.warn("Lỗi khởi tạo Web3:", e);
    }

    // MetaMask Event Listeners
    window.ethereum.on("accountsChanged", (accs) => {
      location.reload();
    });

    window.ethereum.on("chainChanged", () => {
      location.reload();
    });
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    showToast("MetaMask chưa được cài đặt. Vui lòng cài tiện ích MetaMask!", "error");
    window.open("https://metamask.io/download/", "_blank");
    return;
  }

  try {
    await ensureCorrectNetwork();
    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    walletAddress = accounts[0];
    signer = await provider.getSigner();

    await updateNetworkUI();
    updateWalletUI(walletAddress);
    setupContractInstance();
    await refreshMyBalance();
    await loadTokenInfo();
    showToast("Kết nối ví MetaMask thành công!", "success");
  } catch (err) {
    showToast("Lỗi kết nối ví: " + (err.reason || err.message), "error");
  }
}

function updateWalletUI(address) {
  document.getElementById("btn-connect").classList.add("hidden");
  const walletInfo = document.getElementById("wallet-info");
  walletInfo.classList.remove("hidden");
  document.getElementById("wallet-address").textContent = shortAddr(address);
  const gasChip = document.getElementById("wallet-gas-chip");
  if (gasChip) gasChip.classList.remove("hidden");
}

function setupContractInstance() {
  if (contractAddress && ethers.isAddress(contractAddress) && (signer || provider)) {
    contract = new ethers.Contract(contractAddress, TOKEN_ABI, signer || provider);
  }
}

// ─── Token Info Loader ───────────────────────────────────────
async function loadTokenInfo() {
  try {
    let info = null;

    if (useBackend) {
      const res = await fetch(`${API_BASE}/info`);
      const json = await res.json();
      if (json.success) {
        info = json.data;
      }
    }

    if (!info && contract) {
      const raw = await contract.tokenInfo();
      info = {
        name: raw[0],
        symbol: raw[1],
        totalSupply: ethers.formatEther(raw[2]),
        maxSupply: ethers.formatEther(raw[3]),
        owner: raw[4],
        contractAddress: contractAddress
      };
    }

    if (info) {
      setText("info-name", info.name);
      setText("info-symbol", info.symbol);
      setText("info-supply", fmtNumber(info.totalSupply));
      setText("unit-supply", info.symbol);
      setText("info-max", fmtNumber(info.maxSupply));
      setText("info-owner", shortAddr(info.owner));
      const ownerEl = document.getElementById("info-owner");
      if (ownerEl) ownerEl.title = info.owner;

      if (info.contractAddress && !contractAddress) {
        contractAddress = info.contractAddress;
        localStorage.setItem("stk_contract_address", contractAddress);
        updateContractDisplay();
      }

      // Progress & Cap percentage
      if (info.totalSupply && info.maxSupply) {
        const supplyVal = parseFloat(info.totalSupply);
        const maxVal = parseFloat(info.maxSupply);
        if (maxVal > 0) {
          const pct = Math.min(100, (supplyVal / maxVal) * 100).toFixed(1);
          setText("supply-pct-sub", `${pct}% trên tổng cung trần`);
          const fill = document.getElementById("supply-progress-fill");
          if (fill) fill.style.width = `${pct}%`;
        }
      }

      // Owner check
      const ownerBadge = document.getElementById("is-owner-badge");
      if (ownerBadge) {
        if (walletAddress && info.owner && walletAddress.toLowerCase() === info.owner.toLowerCase()) {
          ownerBadge.textContent = "✓ Bạn là Quản trị viên (Owner)";
          ownerBadge.style.color = "#10b981";
        } else if (walletAddress) {
          ownerBadge.textContent = "Vai trò: Thành viên (Holder)";
          ownerBadge.style.color = "";
        } else {
          ownerBadge.textContent = "Quyền hạn: Đúc thêm (Mint)";
          ownerBadge.style.color = "";
        }
      }
    }
  } catch (err) {
    console.warn("Chưa tải được Token Info:", err.message);
  }
}

// ─── My Balance & Balance Checker ────────────────────────────
async function refreshMyBalance() {
  if (!walletAddress) return;
  try {
    // 1. Cập nhật số dư Gas (GO / ETH) khả dụng
    if (window.ethereum) {
      const p = provider || new ethers.BrowserProvider(window.ethereum);
      try {
        const net = await p.getNetwork();
        const symbol = (net.chainId === 31337n || net.chainId === 1337n) ? "GO" : "ETH";
        const rawGas = await p.getBalance(walletAddress);
        const gasNum = parseFloat(ethers.formatEther(rawGas));
        const gasFormatted = gasNum.toLocaleString("vi-VN", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

        setText("my-eth-val", `${gasFormatted} ${symbol}`);
        const gasChip = document.getElementById("wallet-gas-chip");
        if (gasChip) {
          gasChip.classList.remove("hidden");
          setText("nav-gas-val", `${gasFormatted} ${symbol}`);
        }
      } catch (gasErr) {
        console.warn("Lỗi đọc số dư Gas:", gasErr);
      }
    }

    // 2. Cập nhật số dư Token STK
    if (contract) {
      const rawBal = await contract.balanceOf(walletAddress);
      myBalanceStk = ethers.formatEther(rawBal);
      setText("my-token-balance", fmtNumber(myBalanceStk));
    } else if (useBackend && contractAddress) {
      const res = await fetch(`${API_BASE}/balance/${walletAddress}`);
      const json = await res.json();
      if (json.success) {
        myBalanceStk = json.data.balance;
        setText("my-token-balance", fmtNumber(myBalanceStk));
      }
    }
  } catch (err) {
    console.warn("Lỗi cập nhật số dư:", err);
  }
}

async function checkBalance() {
  const addr = document.getElementById("input-balance-addr").value.trim();
  if (!addr) {
    showToast("Vui lòng nhập địa chỉ ví cần kiểm tra", "error");
    return;
  }
  if (!ethers.isAddress(addr)) {
    showToast("Địa chỉ ví không hợp lệ (phải bắt đầu bằng 0x...)", "error");
    return;
  }

  const resultBox = document.getElementById("balance-result-box");
  try {
    let balance = "0";
    let symbol = document.getElementById("info-symbol").textContent || "STK";

    if (useBackend) {
      const res = await fetch(`${API_BASE}/balance/${addr}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      balance = json.data.balance;
    } else if (contract) {
      const raw = await contract.balanceOf(addr);
      balance = ethers.formatEther(raw);
    } else {
      throw new Error("Chưa kết nối ví hoặc chưa nhập địa chỉ Contract.");
    }

    resultBox.classList.remove("hidden");
    setText("res-balance-addr", shortAddr(addr));
    setText("res-balance-val", `${fmtNumber(balance)} ${symbol}`);
    showToast(`Đã tìm thấy số dư của ${shortAddr(addr)}`, "success");
  } catch (err) {
    showToast("Lỗi kiểm tra số dư: " + err.message, "error");
  }
}

function fillConnectedAddress() {
  if (!walletAddress) {
    showToast("Vui lòng kết nối ví MetaMask trước!", "error");
    return;
  }
  document.getElementById("input-balance-addr").value = walletAddress;
  checkBalance();
}

function fillMaxTransfer() {
  document.getElementById("transfer-amount").value = myBalanceStk || "0";
}

function fillMaxBurn() {
  document.getElementById("burn-amount").value = myBalanceStk || "0";
}

async function prepareContractExecution() {
  if (window.ethereum) {
    await ensureCorrectNetwork();
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    setupContractInstance();
    await updateNetworkUI();
  }
}

// ─── Smart Contract Operations ───────────────────────────────

// 1. Transfer
async function doTransfer() {
  await prepareContractExecution();
  const to = document.getElementById("transfer-to").value.trim();
  const amount = document.getElementById("transfer-amount").value.trim();

  if (!to || !amount) {
    return showOpResult("transfer-result", "Vui lòng nhập đầy đủ địa chỉ nhận và số lượng.", "error");
  }
  if (!ethers.isAddress(to)) {
    return showOpResult("transfer-result", "Địa chỉ người nhận không hợp lệ.", "error");
  }
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return showOpResult("transfer-result", "Số lượng token phải lớn hơn 0.", "error");
  }
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    return showOpResult("transfer-result", "Chưa có địa chỉ Hợp đồng! Vui lòng Deploy contract và dán địa chỉ vào thanh 'Hợp đồng thông minh' ở trên cùng (hoặc điền CONTRACT_ADDRESS vào file .env).", "error");
  }
  if (!walletAddress && !useBackend) {
    return showOpResult("transfer-result", "Vui lòng bấm nút 'Kết nối ví' ở góc trên bên phải trước khi chuyển token!", "error");
  }

  setSpinner("transfer-spinner", true);
  try {
    let txHash, blockNumber;

    if (contract && signer) {
      const tx = await contract.transfer(to, ethers.parseEther(amount));
      showToast("Đang xác nhận giao dịch chuyển token trên Blockchain...", "info");
      const receipt = await tx.wait();
      txHash = receipt.hash;
      blockNumber = receipt.blockNumber;
    } else if (useBackend) {
      const res = await fetch(`${API_BASE}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, amount })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      txHash = json.data.txHash;
      blockNumber = json.data.blockNumber;
    } else {
      throw new Error("Vui lòng kết nối ví MetaMask và nhập địa chỉ Contract, hoặc khởi động Backend!");
    }

    const msg = `✓ Chuyển token thành công!\nTx Hash: ${txHash}\nKhối: ${blockNumber}\nĐến: ${to}\nSố lượng: ${amount} STK`;
    showOpResult("transfer-result", msg, "success");
    showToast("Giao dịch Chuyển Token thành công!", "success");

    addTxAudit("TRANSFER", txHash, blockNumber, `Gửi ${amount} STK đến ${shortAddr(to)}`);
    await refreshMyBalance();
    await loadTokenInfo();
    document.getElementById("transfer-amount").value = "";
  } catch (err) {
    const errorMsg = parseFriendlyError(err);
    showOpResult("transfer-result", errorMsg, "error");
    showToast(errorMsg.length > 80 ? "Chuyển token thất bại (Lệch Nonce - xem hướng dẫn)" : errorMsg, "error");
  } finally {
    setSpinner("transfer-spinner", false);
  }
}

// 2. Mint (Owner Only)
async function doMint() {
  await prepareContractExecution();
  const to = document.getElementById("mint-to").value.trim();
  const amount = document.getElementById("mint-amount").value.trim();

  if (!to || !amount) {
    return showOpResult("mint-result", "Vui lòng nhập địa chỉ nhận và số lượng token cần Mint.", "error");
  }
  if (!ethers.isAddress(to)) {
    return showOpResult("mint-result", "Địa chỉ nhận không hợp lệ.", "error");
  }

  setSpinner("mint-spinner", true);
  try {
    let txHash, blockNumber;

    if (contract && signer) {
      const tx = await contract.mint(to, ethers.parseEther(amount));
      showToast("Đang xác nhận giao dịch Mint trên Blockchain...", "info");
      const receipt = await tx.wait();
      txHash = receipt.hash;
      blockNumber = receipt.blockNumber;
    } else if (useBackend) {
      const res = await fetch(`${API_BASE}/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, amount })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      txHash = json.data.txHash;
      blockNumber = json.data.blockNumber;
    } else {
      throw new Error("Vui lòng kết nối ví MetaMask và nhập địa chỉ Contract, hoặc khởi động Backend!");
    }

    const msg = `✓ Đúc (Mint) token thành công!\nTx Hash: ${txHash}\nKhối: ${blockNumber}\nNhận: ${to}\nSố lượng: ${amount} STK`;
    showOpResult("mint-result", msg, "success");
    showToast("Mint token thành công!", "success");

    addTxAudit("MINT", txHash, blockNumber, `Đúc ${amount} STK cho ${shortAddr(to)}`);
    await refreshMyBalance();
    await loadTokenInfo();
    document.getElementById("mint-amount").value = "";
  } catch (err) {
    const errorMsg = parseFriendlyError(err);
    showOpResult("mint-result", errorMsg, "error");
    showToast(errorMsg.length > 80 ? "Mint token thất bại (Lệch Nonce - xem hướng dẫn)" : errorMsg, "error");
  } finally {
    setSpinner("mint-spinner", false);
  }
}

// 3. Burn
async function doBurn() {
  await prepareContractExecution();
  const amount = document.getElementById("burn-amount").value.trim();
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return showOpResult("burn-result", "Vui lòng nhập số lượng token hợp lệ cần Burn.", "error");
  }

  setSpinner("burn-spinner", true);
  try {
    let txHash, blockNumber;

    if (contract && signer) {
      const tx = await contract.burn(ethers.parseEther(amount));
      showToast("Đang xác nhận giao dịch Đốt token trên Blockchain...", "info");
      const receipt = await tx.wait();
      txHash = receipt.hash;
      blockNumber = receipt.blockNumber;
    } else if (useBackend) {
      const res = await fetch(`${API_BASE}/burn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      txHash = json.data.txHash;
      blockNumber = json.data.blockNumber;
    } else {
      throw new Error("Vui lòng kết nối ví MetaMask và nhập địa chỉ Contract, hoặc khởi động Backend!");
    }

    const msg = `✓ Đốt (Burn) token thành công!\nTx Hash: ${txHash}\nKhối: ${blockNumber}\nSố lượng đã tiêu hủy: ${amount} STK`;
    showOpResult("burn-result", msg, "success");
    showToast("Đốt token thành công!", "success");

    addTxAudit("BURN", txHash, blockNumber, `Tiêu hủy ${amount} STK`);
    await refreshMyBalance();
    await loadTokenInfo();
    document.getElementById("burn-amount").value = "";
  } catch (err) {
    const errorMsg = parseFriendlyError(err);
    showOpResult("burn-result", errorMsg, "error");
    showToast(errorMsg.length > 80 ? "Burn token thất bại (Lệch Nonce - xem hướng dẫn)" : errorMsg, "error");
  } finally {
    setSpinner("burn-spinner", false);
  }
}

// 4. Approve (Ủy quyền chi tiêu)
async function doApprove() {
  await prepareContractExecution();
  const spender = document.getElementById("approve-spender").value.trim();
  const amount = document.getElementById("approve-amount").value.trim();

  if (!spender || !amount) {
    return showOpResult("approve-result", "Vui lòng nhập địa chỉ được ủy quyền và số lượng.", "error");
  }
  if (!ethers.isAddress(spender)) {
    return showOpResult("approve-result", "Địa chỉ người được ủy quyền không hợp lệ.", "error");
  }

  setSpinner("approve-spinner", true);
  try {
    let txHash, blockNumber;

    if (contract && signer) {
      const tx = await contract.approve(spender, ethers.parseEther(amount));
      showToast("Đang xác nhận giao dịch Ủy quyền (Approve)...", "info");
      const receipt = await tx.wait();
      txHash = receipt.hash;
      blockNumber = receipt.blockNumber;
    } else if (useBackend) {
      const res = await fetch(`${API_BASE}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spender, amount })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      txHash = json.data.txHash;
      blockNumber = json.data.blockNumber;
    } else {
      throw new Error("Vui lòng kết nối ví MetaMask và nhập địa chỉ Contract, hoặc khởi động Backend!");
    }

    const msg = `✓ Ủy quyền chi tiêu thành công!\nTx Hash: ${txHash}\nKhối: ${blockNumber}\nNgười được ủy quyền: ${spender}\nHạn mức: ${amount} STK`;
    showOpResult("approve-result", msg, "success");
    showToast("Phê duyệt Ủy quyền thành công!", "success");

    addTxAudit("APPROVE", txHash, blockNumber, `Ủy quyền ${amount} STK cho ${shortAddr(spender)}`);
  } catch (err) {
    const errorMsg = parseFriendlyError(err);
    showOpResult("approve-result", errorMsg, "error");
    showToast(errorMsg.length > 80 ? "Ủy quyền thất bại (Lệch Nonce - xem hướng dẫn)" : errorMsg, "error");
  } finally {
    setSpinner("approve-spinner", false);
  }
}

// ─── Contract Configuration Management ───────────────────────
function updateContractDisplay() {
  const label = document.getElementById("contract-address-label");
  const link = document.getElementById("contract-etherscan-link");

  if (contractAddress && ethers.isAddress(contractAddress)) {
    label.textContent = shortAddr(contractAddress);
    label.title = contractAddress;
    if (link) {
      link.href = `https://sepolia.etherscan.io/address/${contractAddress}`;
      link.classList.remove("hidden");
    }
    setupContractInstance();
  } else {
    label.textContent = "0x5FbD...aa3";
    if (link) link.classList.add("hidden");
  }
}

function copyContractAddress() {
  const addr = contractAddress || DEFAULT_CONTRACT;
  if (!addr) return;
  navigator.clipboard.writeText(addr).then(() => {
    showToast("Đã sao chép địa chỉ Smart Contract!", "success");
  });
}

function saveCustomContract() {
  const customAddr = document.getElementById("input-custom-contract").value.trim();
  if (!customAddr || !ethers.isAddress(customAddr)) {
    showToast("Địa chỉ Hợp đồng không hợp lệ (phải bắt đầu bằng 0x)!", "error");
    return;
  }
  contractAddress = customAddr;
  localStorage.setItem("stk_contract_address", contractAddress);
  updateContractDisplay();
  loadTokenInfo();
  refreshMyBalance();
  showToast("Đã lưu địa chỉ Contract mới!", "success");
  document.getElementById("input-custom-contract").value = "";
}

function resetDefaultContract() {
  contractAddress = DEFAULT_CONTRACT;
  localStorage.setItem("stk_contract_address", contractAddress);
  updateContractDisplay();
  loadTokenInfo();
  refreshMyBalance();
  showToast("Đã khôi phục địa chỉ Contract mẫu!", "info");
}

function copyWalletAddress() {
  if (!walletAddress) return;
  navigator.clipboard.writeText(walletAddress).then(() => {
    showToast("Đã sao chép địa chỉ ví vào bộ nhớ tạm!", "success");
  });
}

// ─── Tabs UI ─────────────────────────────────────────────────
function switchTab(tabName, el) {
  // 1. Ẩn toàn bộ nội dung tab-pane
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

  // 2. Xóa trạng thái active của TẤT CẢ các nút tab (.seg-btn và .tab-btn)
  document.querySelectorAll(".seg-btn, .tab-btn").forEach(b => {
    b.classList.remove("active");
    b.setAttribute("aria-selected", "false");
  });

  // 3. Hiển thị đúng tab-pane được chọn
  const targetPane = document.getElementById("tab-" + tabName);
  if (targetPane) targetPane.classList.add("active");

  // 4. Kích hoạt trạng thái active cho DUY NHẤT nút được click
  let targetBtn = el;
  if (!targetBtn || !(targetBtn instanceof HTMLElement)) {
    targetBtn = document.querySelector(`.seg-btn[data-tab="${tabName}"], .tab-btn[data-tab="${tabName}"]`);
  }
  if (targetBtn) {
    targetBtn.classList.add("active");
    targetBtn.setAttribute("aria-selected", "true");
  }
}
window.switchTab = switchTab;

// ─── Transaction History & Audit Log ─────────────────────────
function addTxAudit(type, txHash, blockNumber, detail) {
  const item = {
    type,
    txHash: txHash || "0x...",
    blockNumber: blockNumber || "Pending",
    detail,
    time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  };
  txHistory.unshift(item);
  if (txHistory.length > 30) txHistory.pop();
  localStorage.setItem("stk_tx_history", JSON.stringify(txHistory));
  renderTxHistory();
}

function renderTxHistory() {
  const tbody = document.getElementById("tx-table-body");
  const countBadge = document.getElementById("audit-count-badge");
  const statTotal = document.getElementById("stat-total-txs");
  
  const count = txHistory.length;
  if (countBadge) countBadge.textContent = count.toString();
  if (statTotal) statTotal.textContent = count.toString();

  if (!tbody) return;

  if (count === 0) {
    tbody.innerHTML = `
      <tr id="empty-tx-row">
        <td colspan="4" class="empty-audit-state">
          <div class="empty-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>Chưa phát sinh giao dịch nào trong phiên này. Hãy thực hiện Chuyển, Đúc hoặc Tiêu hủy token để ghi nhận nhật ký!</span>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = txHistory.map(item => {
    const explorerUrl = `https://sepolia.etherscan.io/tx/${item.txHash}`;
    const hashDisplay = item.txHash && item.txHash.length > 14
      ? `${item.txHash.slice(0, 8)}...${item.txHash.slice(-4)}`
      : (item.txHash || "0x...");

    const badgeClass = `tx-badge tx-badge-${(item.type || "").toLowerCase()}`;

    return `
      <tr>
        <td><span class="${badgeClass}">${item.type}</span></td>
        <td><a class="tx-hash-link" href="${explorerUrl}" target="_blank" title="${item.txHash}">${hashDisplay}</a></td>
        <td>${item.detail}</td>
        <td style="text-align: right;" class="text-muted font-mono">${item.time}</td>
      </tr>`;
  }).join("");
}

function clearTxHistory() {
  txHistory = [];
  localStorage.removeItem("stk_tx_history");
  renderTxHistory();
  showToast("Đã xóa lịch sử", "info");
}

// ─── Helpers & Toast Notifications ───────────────────────────
function parseFriendlyError(err) {
  if (!err) return "Giao dịch bị từ chối.";
  
  const raw = (err.message || "") + " " + (err.reason || "") + " " + (typeof err === "object" ? JSON.stringify(err) : "");
  
  if (raw.includes("Nonce too high") || raw.includes("Nonce too low") || raw.includes("nonce")) {
    return "Lỗi lệch số Nonce giữa MetaMask và mạng Localhost (do node vừa được khởi động lại).\n\nCách khắc phục (10 giây):\n1. Mở tiện ích MetaMask trên trình duyệt\n2. Nhấn vào menu 3 chấm (⋮) hoặc avatar góc trên -> Chọn 'Cài đặt' (Settings)\n3. Chọn 'Nâng cao' (Advanced)\n4. Nhấn nút 'Xóa dữ liệu hoạt động tab' (Clear activity tab data / Đặt lại tài khoản) để đồng bộ lại Nonce chuẩn!";
  }
  
  if (raw.includes("user rejected") || raw.includes("ACTION_REJECTED") || raw.includes("4001")) {
    return "Bạn đã hủy / từ chối ký xác nhận giao dịch trên ví MetaMask.";
  }
  
  if (raw.includes("insufficient funds")) {
    return "Số dư Gas (GO / ETH) trong ví không đủ để thanh toán phí mạng.";
  }

  if (raw.includes("Exceeds max supply")) {
    return "Lỗi: Số lượng đúc vượt quá tổng cung trần tối đa (100,000,000 STK)!";
  }

  if (raw.includes("ERC20InsufficientBalance") || raw.includes("transfer amount exceeds balance")) {
    return "Lỗi: Số dư token STK của bạn không đủ để thực hiện giao dịch này.";
  }

  if (raw.includes("OwnableUnauthorizedAccount") || raw.includes("caller is not the owner")) {
    return "Lỗi phân quyền: Chỉ tài khoản Quản trị viên (Owner) mới có quyền thực hiện thao tác này!";
  }

  return "Lỗi: " + (err.reason || err.message || "Giao dịch bị từ chối");
}

function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${msg}</span>
    <button class="btn-icon" onclick="this.parentElement.remove()">Đóng</button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

function showOpResult(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.className = `operation-result ${type}`;
  el.classList.remove("hidden");
}

function setSpinner(spinnerId, active) {
  const el = document.getElementById(spinnerId);
  if (el) el.classList.toggle("hidden", !active);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || "—";
}

function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr || "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function fmtNumber(numStr) {
  const n = parseFloat(numStr);
  if (isNaN(n)) return numStr || "0";
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 4 });
}

// ─── Settings Dropdown & Theme Management ────────────────────
function toggleSettingsDropdown() {
  const dd = document.getElementById("settings-dropdown");
  if (dd) {
    dd.classList.toggle("hidden");
  }
}

// Close settings when clicking outside
document.addEventListener("click", (e) => {
  const wrapper = document.querySelector(".settings-wrapper");
  const dd = document.getElementById("settings-dropdown");
  if (wrapper && dd && !wrapper.contains(e.target)) {
    dd.classList.add("hidden");
  }
});

function initTheme() {
  const savedTheme = localStorage.getItem("stk_theme") || "light";
  applyTheme(savedTheme);
}

function setTheme(theme) {
  applyTheme(theme);
  localStorage.setItem("stk_theme", theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btnLight = document.getElementById("theme-btn-light");
  const btnDark = document.getElementById("theme-btn-dark");
  if (btnLight && btnDark) {
    if (theme === "dark") {
      btnLight.classList.remove("active");
      btnDark.classList.add("active");
    } else {
      btnLight.classList.add("active");
      btnDark.classList.remove("active");
    }
  }
}
