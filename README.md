# StartupToken (STK) ERC-20 — Đồ Án Học Phần Lập Trình Blockchain

> **ĐỀ TÀI SỐ 11:** PHÁT HÀNH TOKEN ERC-20 CHO MỘT DỰ ÁN KHỞI NGHIỆP (STARTUP)  
> **Yêu cầu kỹ thuật cốt lõi:** Token có tên, ký hiệu, tổng cung; cho phép đúc (mint), tiêu hủy (burn), chuyển nhượng (transfer), và ủy quyền (approve).  

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-Contracts%20v5.0-red.svg)](https://openzeppelin.com/)
[![Hardhat Tests](https://img.shields.io/badge/Hardhat%20Tests-22%2F22%20Passed-brightgreen.svg)](https://hardhat.org/)
[![Truffle Tests](https://img.shields.io/badge/Truffle%20Tests-7%2F7%20Passed-success.svg)](https://trufflesuite.com/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6.9.0-orange.svg)](https://docs.ethers.org/v6/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎓 Thông Tin Đề Tài & Sinh Viên Thực Hiện

* **Cơ sở đào tạo:** Bộ Công Thương — Trường Đại học Điện Lực (EPU)
* **Khoa:** Khoa Công nghệ Thông tin
* **Chuyên ngành:** Công nghệ Phần mềm
* **Sinh viên thực hiện:** **PHẠM TIẾN VINH**
* **Mã số sinh viên:** **23810310085**
* **Lớp khóa học:** **D18CNPM2** (Khóa học 2023 - 2028)
* **Giảng viên hướng dẫn:** **TS. Nguyễn Thị Hồng Khánh**

---

## 📌 1. Giới Thiệu & Thông Số Token Kỹ Thuật

Dự án hiện thực giải pháp **Phát hành Token ERC-20** hoàn chỉnh cho một doanh nghiệp khởi nghiệp công nghệ (Startup) theo chuẩn EIP-20 quốc tế:

| Thuộc tính Smart Contract | Giá trị cấu hình | Mô tả kỹ thuật |
|:---|:---|:---|
| **Tên Token (Name)** | `StartupToken` | Tên định danh của tài sản số |
| **Ký hiệu (Symbol)** | `STK` | Mã niêm yết trên các sàn giao dịch |
| **Số chữ số thập phân (Decimals)** | `18` | Độ chia nhỏ nhất chuẩn EVM ($10^{18}$) |
| **Tổng cung khởi tạo (Initial Supply)** | `10,000,000 STK` | Tự động đúc về ví Owner khi Deploy |
| **Trần cung tối đa (Max Supply / Hard Cap)** | `100,000,000 STK` | Giới hạn bất biến, chống lạm phát vô căn cứ |
| **Chuẩn hợp đồng nền tảng** | OpenZeppelin v5 | `ERC20`, `ERC20Burnable`, `Ownable` |
| **Trình biên dịch (Compiler)** | Solidity `0.8.20` | Bật Optimizer 200 runs, checked arithmetic |

---

## ✨ 2. Các Phân Hệ & Tính Năng Nổi Bật

### A. Hợp đồng thông minh OpenZeppelin thế hệ mới (`contracts/MyStartupToken.sol`)
1. **Chuyển nhượng (`transfer`):** Chuyển token an toàn giữa các ví, tự động kiểm tra số dư và chặn ví nhận `0x0`.
2. **Đúc token (`mint` - Admin Only):** Dành riêng cho Quản trị viên (Owner) để gọi vốn theo từng vòng, kiểm tra nghiêm ngặt không vượt trần $100,000,000 \text{ STK}$.
3. **Tiêu hủy giảm phát (`burn`):** Người nắm giữ tự đốt token trong ví để giảm vĩnh viễn tổng cung lưu hành trên toàn mạng.
4. **Ủy quyền chi tiêu (`approve` & `allowance`):** Cấp quyền hạn mức cho bên thứ ba (sàn DEX Router Uniswap) chi tiêu token thay cho chủ ví.
5. **Truy vấn hợp nhất (`tokenInfo`):** Trả về đồng thời 5 thông số cốt lõi trong một lần gọi EVM duy nhất, tối ưu 80% số lượng request RPC.

### B. Kiến trúc Giao diện Web3 DApp 3 Phân Hệ Độc Lập (`frontend/`)
* **⚡ Phân hệ Bàn điều khiển Tác vụ (View Dashboard):**
  - **Bố cục trọng tâm 60/40:** Trung tâm Tác vụ Smart Contract chiếm 60% diện tích màn hình với thanh capsule tab tối giản, rõ ràng (`Chuyển nhượng`, `Đúc token`, `Tiêu hủy`, `Ủy quyền`).
  - **Khối tài sản cá nhân & Tra cứu (40%):** Hiển thị đồng thời số dư Token STK và số dư Gas khả dụng (GO / ETH), tích hợp công cụ tra cứu số dư On-chain tức thời.
* **📊 Phân hệ Cơ cấu Tokenomics (View Tokenomics):**
  - Trực quan hóa chi tiết cấu trúc phân bổ nguồn cung 100M STK qua thanh phân bổ lớn (`large-track`) và 4 thẻ phân tích chi tiết (Sáng lập 20%, Seed Sale 25%, Thanh khoản DEX 35%, Quỹ sinh thái 20%).
* **🛡️ Phân hệ Cổng Kiểm toán & Lịch sử Giao dịch (View Audit Log):**
  - Tách biệt thành một trang độc lập toàn màn hình, tích hợp huy hiệu đếm giao dịch thời gian thực trên Navbar, 3 thẻ thống kê kiểm toán và bảng nhật ký chi tiết có liên kết Etherscan Explorer.
* **Header đối xứng & Loại bỏ Icon thừa:**
  - Cấu trúc lưới 3 cột đối xứng (`grid-template-columns: 1fr auto 1fr`), căn Tab điều hướng chính giữa màn hình, loại bỏ toàn bộ emoji màu mè và đồng bộ chiều cao chuẩn 34px.

### C. Hỗ trợ song song cả 2 Framework phát triển Web3
* **Hardhat Framework:** Mô phỏng EVM tốc độ cao, hỗ trợ bộ kiểm thử 22 Test cases tự động và script triển khai / xác thực Etherscan.
* **Truffle Suite (v5.11.5):** Tích hợp trình quản lý di trú (Migrations), Ganache provider và bộ kiểm thử 7 Test cases độc lập.

---

## 📂 3. Cấu Trúc Thư Mục Dự Án

```
laptrinhblockchain/
├── contracts/
│   ├── MyStartupToken.sol            ← Smart Contract ERC-20 chính (Solidity 0.8.20)
│   └── Migrations.sol                ← Hợp đồng quản lý di trú chuẩn Truffle
├── migrations/
│   ├── 1_initial_migration.js        ← Kịch bản khởi tạo di trú Truffle
│   └── 2_deploy_token.js             ← Kịch bản triển khai StartupToken bằng Truffle
├── scripts/
│   └── deploy.js                     ← Kịch bản triển khai bằng Hardhat (Localhost / Sepolia)
├── test/
│   └── MyStartupToken.test.js        ← 22 Kịch bản Unit Test tự động (Hardhat + Chai)
├── test_truffle/
│   └── MyStartupToken.truffle.test.js← 7 Kịch bản Unit Test tự động (Truffle Suite)
├── backend/
│   ├── server.js                     ← Web Server Express.js (Port 3000)
│   ├── routes/token.js               ← RESTful API Router (/api/token/*)
│   └── services/contractService.js   ← Service tương tác Smart Contract (Ethers.js v6)
├── frontend/
│   ├── index.html                    ← Giao diện Web3 DApp 3-View Architecture
│   ├── style.css                     ← CSS Design System (Cyber Violet & Neon Cyan)
│   ├── app.js                        ← Controller Web3, Ethers.js & MetaMask Handler
│   └── sepolia_etherscan.html        ← Trang mô phỏng Etherscan Block Explorer
├── hardhat.config.js                 ← Cấu hình Hardhat, mạng Localhost và Sepolia
├── truffle-config.js                 ← Cấu hình Truffle Suite (Solc 0.8.20, Ganache, Sepolia)
├── package.json                      ← Khai báo npm scripts và thư viện phụ thuộc
├── .env                              ← File cấu hình biến môi trường (Private key, RPC, Contract)
├── .env.example                      ← File mẫu cấu hình biến môi trường
├── BAO_CAO_DO_AN_BLOCKCHAIN_v4.docx     ← Báo cáo chuyên đề Word chính thức (Chuẩn EPU)
└── README.md                         ← Hướng dẫn sử dụng và tài liệu kỹ thuật dự án
```

---

## ⚡ 4. Hướng Dẫn Cài Đặt & Chạy Dự Án Theo Thứ Tự Chuẩn

### Bước 1: Cài đặt các gói phụ thuộc
Mở Terminal tại thư mục gốc của dự án:
```bash
npm install
```

### Bước 2: Khởi động Blockchain Node cục bộ
Mở **Terminal 1** và chạy node Hardhat (Chain ID: 31337 / Port: 8545):
```bash
npx hardhat node
```
> *Terminal 1 sẽ sinh ra 20 tài khoản thử nghiệm có sẵn 10,000 ETH/GO test coin. Hãy giữ Terminal này chạy ngầm.*

### Bước 3: Triển khai Smart Contract (Deploy)
Mở **Terminal 2** và chọn một trong hai cách triển khai:
* **Cách A (Triển khai bằng Hardhat):**
  ```bash
  npm run deploy:local
  ```
* **Cách B (Triển khai bằng Truffle):**
  ```bash
  npm run truffle:migrate
  ```
Sau khi triển khai thành công, Terminal sẽ in ra địa chỉ hợp đồng (ví dụ: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`). Đảm bảo biến `CONTRACT_ADDRESS` trong file `.env` đã khớp với địa chỉ này.

### Bước 4: Chạy kiểm thử tự động (Verification)
Trong **Terminal 2**, kiểm tra toàn diện chất lượng hợp đồng:
* **Chạy bộ kiểm thử Hardhat (22 Tests):**
  ```bash
  npm test
  ```
  *(Kết quả: `22 passing`)*
* **Chạy bộ kiểm thử Truffle (7 Tests):**
  ```bash
  npm run truffle:test
  ```
  *(Kết quả: `7 passing`)*

### Bước 5: Khởi động Backend API & Giao diện DApp
Trong **Terminal 2**, chạy lệnh:
```bash
npm run dev
```
1. Mở trình duyệt truy cập: **`http://localhost:3000`**
2. Nhấn nút **"Kết nối ví"** trên Navbar để liên kết ví MetaMask và bắt đầu trải nghiệm các chức năng.

---

## 🌐 5. Hướng Dẫn Triển Khai Mạng Sepolia Testnet

### Bước 1: Cấu hình biến môi trường `.env`
Cập nhật file `.env` với RPC Endpoint và Private Key của bạn:
```ini
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=0xYOUR_METAMASK_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
CONTRACT_ADDRESS=
```

### Bước 2: Triển khai hợp đồng lên Sepolia
* **Triển khai qua Hardhat:**
  ```bash
  npm run deploy:sepolia
  ```
* **Triển khai qua Truffle:**
  ```bash
  npm run truffle:migrate:sepolia
  ```

### Bước 3: Xác thực mã nguồn mở trên Etherscan Sepolia
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "StartupToken" "STK" 10000000 "<OWNER_WALLET_ADDRESS>"
```

---

## 📡 6. Danh Sách RESTful API Gateway

| Phương thức | Endpoint | Dữ liệu Body (JSON) | Chức năng nghiệp vụ |
|:---:|:---|:---|:---|
| `GET` | `/api/health` | — | Kiểm tra trạng thái máy chủ & kết nối Contract |
| `GET` | `/api/token/info` | — | Đọc trọn gói: Tên, Ký hiệu, Tổng cung, Cung tối đa, Owner |
| `GET` | `/api/token/balance/:address` | — | Tra cứu số dư token STK của địa chỉ ví bất kỳ |
| `POST` | `/api/token/transfer` | `{ "to": "0x...", "amount": "500" }` | Chuyển token từ ví hệ thống sang ví nhận |
| `POST` | `/api/token/mint` | `{ "to": "0x...", "amount": "1000" }` | Đúc token mới (Độc quyền kiểm tra quyền Owner) |
| `POST` | `/api/token/burn` | `{ "amount": "200" }` | Tiêu hủy token để giảm phát nguồn cung |
| `POST` | `/api/token/approve` | `{ "spender": "0x...", "amount": "1000" }` | Cấp quyền hạn mức chi tiêu cho bên thứ ba |
| `GET` | `/api/token/allowance/:owner/:spender` | — | Tra cứu hạn mức đã phê duyệt giữa 2 ví |

---

## 🛠️ 7. Hướng Dẫn Khắc Phục Lỗi Thường Gặp (Troubleshooting)

### 1. Lỗi lệch Nonce: `Nonce too high. Expected nonce to be X but got Y`
* **Nguyên nhân:** Khi khởi động lại node cục bộ (Hardhat), số đếm giao dịch on-chain được đặt lại từ đầu, trong khi tiện ích MetaMask trên trình duyệt vẫn lưu cache số nonce cũ.
* **Cách khắc phục trong 10 giây:**
  1. Mở tiện ích **MetaMask** trên trình duyệt.
  2. Nhấp vào menu **3 dấu chấm (⋮)** ở góc trên bên phải &rarr; Chọn **Cài đặt (Settings)**.
  3. Chọn mục **Nâng cao (Advanced)**.
  4. Cuộn xuống và nhấn nút **Xóa dữ liệu hoạt động tab** *(Clear activity tab data / Reset account)* &rarr; Chọn **Xác nhận**.
  *(Thao tác này hoàn toàn an toàn, không làm mất tài sản hay private key).*

### 2. Lỗi giao dịch báo thiếu Gas hoặc dùng nhầm mạng Ethereum Mainnet
* **Nguyên nhân:** MetaMask đang kết nối nhầm mạng Ethereum Mainnet (Chain ID: 1) nơi ví có 0 ETH thật.
* **Cách khắc phục:**
  - Nhấp trực tiếp vào chip **Localhost** trên thanh Navbar của ứng dụng, hệ thống sẽ tự động gửi lệnh yêu cầu MetaMask chuyển sang mạng cục bộ (Chain ID: 31337 / GoChain Testnet) nơi ví có sẵn 10,000 test coin.

### 3. Lỗi API 500: `could not decode result data (value="0x")`
* **Nguyên nhân:** Node blockchain đã khởi động lại làm mất state cũ, hoặc địa chỉ `CONTRACT_ADDRESS` trong `.env` chưa được cập nhật sau lần deploy mới nhất.
* **Cách khắc phục:** Chạy lại lệnh deploy `npm run deploy:local`, sau đó dán địa chỉ contract mới vào `.env` và khởi động lại backend.

---

## 🛡️ 8. Phân Tích An Toàn Bảo Mật Hợp Đồng Thông Minh

1. **Phòng chống Tràn số (Integer Overflow / Underflow):** Sử dụng Solidity `^0.8.20` tích hợp cơ chế checked arithmetic ở mức mã máy opcode EVM, tự động revert khi xảy ra tràn số.
2. **Kiểm soát Truy cập (Access Control):** Hàm `mint` được bảo vệ độc quyền bởi modifier `onlyOwner` kế thừa từ `Ownable.sol`.
3. **Chống Tấn công Tái vào (Reentrancy Guard):** Tuân thủ nghiêm ngặt mô hình thiết kế Checks-Effects-Interactions (CEI) từ OpenZeppelin v5, cập nhật trạng thái số dư trước khi hoàn tất giao dịch.
4. **Ngăn chặn Địa chỉ Rác (Zero-Address Check):** Bắt buộc kiểm tra `require(to != address(0))` và kế thừa các custom error `ERC20InvalidReceiver`, `ERC20InvalidSender`.
5. **Cố định Trần cung (Hard Cap Invariance):** Khóa cứng `MAX_SUPPLY = 100,000,000 STK` bằng biến `constant` không thể can thiệp, bảo vệ nhà đầu tư khỏi nguy cơ lạm phát vô căn cứ.

---

## 📜 9. Kết Luận & Bản Quyền

* **Học phần:** Lập trình Blockchain — Đề tài số 11
* **Sinh viên thực hiện:** **PHẠM TIẾN VINH** — Mã SV: **23810310085**
* **Khoa Công nghệ Thông tin — Trường Đại học Điện Lực**
* **Giấy phép:** [MIT License](LICENSE)
