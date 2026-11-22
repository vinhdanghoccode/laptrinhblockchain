const MyStartupToken = artifacts.require("MyStartupToken");

contract("MyStartupToken (Truffle Suite)", (accounts) => {
  const [owner, recipient, user] = accounts;
  const name = "StartupToken";
  const symbol = "STK";
  const initialSupply = 10000000; // 10 triệu tokens
  let token;

  beforeEach(async () => {
    token = await MyStartupToken.new(name, symbol, initialSupply, owner);
  });

  describe("Thông tin cơ bản của Token", () => {
    it("Trả về đúng tên và ký hiệu token", async () => {
      const tokenName = await token.name();
      const tokenSymbol = await token.symbol();
      assert.equal(tokenName, name, "Tên token không khớp");
      assert.equal(tokenSymbol, symbol, "Ký hiệu token không khớp");
    });

    it("Khởi tạo đúng số dư ban đầu cho chủ sở hữu", async () => {
      const decimals = await token.decimals();
      const expectedSupply = web3.utils.toBN(initialSupply).mul(web3.utils.toBN(10).pow(decimals));
      const ownerBalance = await token.balanceOf(owner);
      const totalSupply = await token.totalSupply();

      assert.equal(ownerBalance.toString(), expectedSupply.toString(), "Số dư owner không khớp");
      assert.equal(totalSupply.toString(), expectedSupply.toString(), "Tổng cung không khớp");
    });

    it("Xác nhận đúng địa chỉ chủ sở hữu (Owner)", async () => {
      const contractOwner = await token.owner();
      assert.equal(contractOwner, owner, "Owner không khớp");
    });
  });

  describe("Cơ chế Đúc token (Mint)", () => {
    it("Chủ sở hữu có thể đúc token mới cho tài khoản khác", async () => {
      const mintAmount = web3.utils.toWei("500", "ether");
      await token.mint(recipient, mintAmount, { from: owner });

      const recipientBal = await token.balanceOf(recipient);
      assert.equal(recipientBal.toString(), mintAmount, "Số dư recipient sau mint không đúng");
    });

    it("Tài khoản không phải chủ sở hữu không thể gọi hàm mint", async () => {
      const mintAmount = web3.utils.toWei("100", "ether");
      try {
        await token.mint(recipient, mintAmount, { from: user });
        assert.fail("Lẽ ra phải revert khi không phải owner gọi mint");
      } catch (err) {
        assert(err.message.includes("revert") || err.message.includes("OwnableUnauthorizedAccount"), "Lỗi không đúng");
      }
    });
  });

  describe("Cơ chế Đốt token (Burn)", () => {
    it("Người nắm giữ có thể đốt token của chính mình và giảm tổng cung", async () => {
      const burnAmount = web3.utils.toWei("1000", "ether");
      const initialTotalSupply = await token.totalSupply();

      await token.burn(burnAmount, { from: owner });

      const finalTotalSupply = await token.totalSupply();
      const expectedFinal = initialTotalSupply.sub(web3.utils.toBN(burnAmount));
      assert.equal(finalTotalSupply.toString(), expectedFinal.toString(), "Tổng cung sau khi đốt không đúng");
    });
  });

  describe("Cơ chế Chuyển nhượng (Transfer)", () => {
    it("Có thể chuyển token giữa các tài khoản hợp lệ", async () => {
      const transferAmount = web3.utils.toWei("250", "ether");
      await token.transfer(recipient, transferAmount, { from: owner });

      const recipientBal = await token.balanceOf(recipient);
      assert.equal(recipientBal.toString(), transferAmount, "Số dư người nhận không đúng");
    });
  });
});
