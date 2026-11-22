require("@nomicfoundation/hardhat-chai-matchers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyStartupToken", function () {
  let token, owner, addr1, addr2;
  const TOKEN_NAME       = "StartupToken";
  const TOKEN_SYMBOL     = "STK";
  const INITIAL_SUPPLY   = 10_000_000n;
  const DECIMALS         = 18n;
  const INITIAL_SUPPLY_WEI = INITIAL_SUPPLY * 10n ** DECIMALS;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MyStartupToken");
    token = await Factory.deploy(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY, owner.address);
    await token.waitForDeployment();
  });

  // ─── Deployment ────────────────────────────────────────────────
  describe("Deployment", function () {
    it("Correct name and symbol", async function () {
      expect(await token.name()).to.equal(TOKEN_NAME);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
    });
    it("Mints initial supply to owner", async function () {
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY_WEI);
    });
    it("Correct owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });
    it("Reverts if owner is zero address", async function () {
      const Factory = await ethers.getContractFactory("MyStartupToken");
      await expect(
        Factory.deploy(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(Factory, "OwnableInvalidOwner");
    });
    it("Reverts if initial supply exceeds MAX_SUPPLY", async function () {
      const Factory = await ethers.getContractFactory("MyStartupToken");
      await expect(
        Factory.deploy(TOKEN_NAME, TOKEN_SYMBOL, 100_000_001n, owner.address)
      ).to.be.revertedWith("Exceeds max supply");
    });
  });

  // ─── Mint ──────────────────────────────────────────────────────
  describe("Mint", function () {
    it("Owner can mint", async function () {
      const amt = ethers.parseEther("1000");
      await token.mint(addr1.address, amt);
      expect(await token.balanceOf(addr1.address)).to.equal(amt);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY_WEI + amt);
    });
    it("Non-owner cannot mint", async function () {
      await expect(
        token.connect(addr1).mint(addr1.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
    it("Cannot mint to zero address", async function () {
      await expect(
        token.mint(ethers.ZeroAddress, ethers.parseEther("1"))
      ).to.be.revertedWith("Mint to zero address");
    });
    it("Cannot exceed MAX_SUPPLY", async function () {
      const MAX = await token.MAX_SUPPLY();
      await expect(token.mint(addr1.address, MAX - INITIAL_SUPPLY_WEI + 1n))
        .to.be.revertedWith("Exceeds max supply");
    });
    it("Emits TokensMinted", async function () {
      const amt = ethers.parseEther("500");
      await expect(token.mint(addr1.address, amt))
        .to.emit(token, "TokensMinted").withArgs(addr1.address, amt);
    });
  });

  // ─── Burn ──────────────────────────────────────────────────────
  describe("Burn", function () {
    it("User can burn own tokens", async function () {
      const amt = ethers.parseEther("100");
      await token.burn(amt);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI - amt);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY_WEI - amt);
    });
    it("Cannot burn more than balance", async function () {
      await expect(token.burn(INITIAL_SUPPLY_WEI + 1n))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
    it("Emits TokensBurned", async function () {
      const amt = ethers.parseEther("50");
      await expect(token.burn(amt))
        .to.emit(token, "TokensBurned").withArgs(owner.address, amt);
    });
  });

  // ─── Transfer ──────────────────────────────────────────────────
  describe("Transfer", function () {
    it("Transfers between accounts", async function () {
      const amt = ethers.parseEther("200");
      await token.transfer(addr1.address, amt);
      expect(await token.balanceOf(addr1.address)).to.equal(amt);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI - amt);
    });
    it("Cannot transfer more than balance", async function () {
      await expect(token.transfer(addr1.address, INITIAL_SUPPLY_WEI + 1n))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
    it("Cannot transfer to zero address", async function () {
      await expect(token.transfer(ethers.ZeroAddress, ethers.parseEther("1")))
        .to.be.revertedWithCustomError(token, "ERC20InvalidReceiver");
    });
    it("Emits Transfer event", async function () {
      const amt = ethers.parseEther("300");
      await expect(token.transfer(addr1.address, amt))
        .to.emit(token, "Transfer").withArgs(owner.address, addr1.address, amt);
    });
  });

  // ─── Approve & TransferFrom ────────────────────────────────────
  describe("Approve & TransferFrom", function () {
    it("Sets allowance", async function () {
      const amt = ethers.parseEther("500");
      await token.approve(addr1.address, amt);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(amt);
    });
    it("TransferFrom within allowance", async function () {
      const amt = ethers.parseEther("500");
      await token.approve(addr1.address, amt);
      await token.connect(addr1).transferFrom(owner.address, addr2.address, amt);
      expect(await token.balanceOf(addr2.address)).to.equal(amt);
    });
    it("TransferFrom exceeding allowance should revert", async function () {
      const amt = ethers.parseEther("500");
      await token.approve(addr1.address, amt);
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, amt + 1n)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
    it("Emits Approval event on approve", async function () {
      const amt = ethers.parseEther("250");
      await expect(token.approve(addr1.address, amt))
        .to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, amt);
    });
  });

  // ─── tokenInfo ─────────────────────────────────────────────────
  describe("tokenInfo()", function () {
    it("Returns correct metadata", async function () {
      const info = await token.tokenInfo();
      expect(info.tokenName).to.equal(TOKEN_NAME);
      expect(info.tokenSymbol).to.equal(TOKEN_SYMBOL);
      expect(info.supply).to.equal(INITIAL_SUPPLY_WEI);
      expect(info.ownerAddr).to.equal(owner.address);
    });
  });
});
