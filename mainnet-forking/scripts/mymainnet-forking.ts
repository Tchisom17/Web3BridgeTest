import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const LISK = "0x6033F7f88332B8db6ad452B7C6D5bB643990aE3f";

    const TOKEN_HOLDER = "0x28C6c06298d514Db089934071355E5743bf21d60";

    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonateSigner = await ethers.getSigner(TOKEN_HOLDER);

    const designerAmountA = ethers.parseUnits("10", 6);
    const desiredAmountB = ethers.parseUnits("100", 18);

    const minAmountA = ethers.parseUnits("5", 6);
    const minAmountB = ethers.parseUnits("50", 18);

    const USDT_Contract = await ethers.getContractAt("IERC20", USDT, impersonateSigner);
    const LISK_Contract = await ethers.getContractAt("IERC20", LISK,impersonateSigner);

    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonateSigner);

    await USDT_Contract.approve(ROUTER, designerAmountA);
    await LISK_Contract.approve(ROUTER, desiredAmountB);


    const usdtBal = await USDT_Contract.balanceOf(impersonateSigner.address);
    const liskBal = await LISK_Contract.balanceOf(impersonateSigner.address);
    const deadLine = Math.floor(Date.now() / 1000) + (60*60);

    console.log("usdt balance before add liquidity ", Number(usdtBal));
    console.log("lisk balance before swap ", Number(liskBal));

    await ROUTER.addLiquidity(
        USDT,
        LISK,
        designerAmountA,
        desiredAmountB,
        minAmountA,
        minAmountB,
        TOKEN_HOLDER,
        deadLine
    );

    const usdtBalAfter = await USDT_Contract.balanceOf(impersonateSigner.address);
    const liskBalAfter = await LISK_Contract.balanceOf(impersonateSigner.address);

    console.log("==============================")

    console.log("usdt balance after add liquidity ", Number(usdtBalAfter));
    console.log("lisk balance after swap ", Number(liskBalAfter));
}


main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
})