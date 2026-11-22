// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyStartupToken
 * @dev ERC-20 token cho dự án khởi nghiệp
 *      Hỗ trợ: mint (chỉ owner), burn, transfer
 */
contract MyStartupToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18; // 100 triệu token

    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    /**
     * @param name       Tên token, VD: "StartupToken"
     * @param symbol     Ký hiệu, VD: "STK"
     * @param initialSupply Tổng cung ban đầu (đơn vị: token, không phải wei)
     * @param initialOwner  Địa chỉ ví owner
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        require(initialOwner != address(0), "Owner is zero address");
        require(initialSupply * 10 ** decimals() <= MAX_SUPPLY, "Exceeds max supply");
        _mint(initialOwner, initialSupply * 10 ** decimals());
    }

    /**
     * @dev Tạo thêm token — chỉ owner mới gọi được
     * @param to     Địa chỉ nhận token
     * @param amount Số lượng token (đơn vị: wei, 18 chữ số thập phân)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Đốt token của chính người gọi
     * @param amount Số lượng token cần đốt (wei)
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Trả về thông tin cơ bản của token
     */
    function tokenInfo()
        external
        view
        returns (
            string memory tokenName,
            string memory tokenSymbol,
            uint256 supply,
            uint256 maxSupply,
            address ownerAddr
        )
    {
        return (name(), symbol(), totalSupply(), MAX_SUPPLY, owner());
    }
}
