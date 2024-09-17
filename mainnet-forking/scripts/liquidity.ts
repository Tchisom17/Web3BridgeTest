import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH address

    // const LISK = "0x6033F7f88332B8db6ad452B7C6D5bB643990aE3f";

    const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonateSigner = await ethers.getSigner(TOKEN_HOLDER);


    const designerAmountA = ethers.parseUnits("100", 6);
    // const desiredAmountB = ethers.parseUnits("1000", 18);
    const amountETHDesired = ethers.parseEther("1");

    const minAmountA = ethers.parseUnits("50", 6);
    const minAmountB = ethers.parseEther("0.02");

    const USDT_Contract = await ethers.getContractAt("IERC20", USDT, impersonateSigner);
    const WETH_Contract = await ethers.getContractAt("IERC20", WETH,impersonateSigner);

    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonateSigner);

    await USDT_Contract.approve(ROUTER, designerAmountA);
    // await LISK_Contract.approve(ROUTER, desiredAmountB);


    const usdtBal = await USDT_Contract.balanceOf(impersonateSigner.address);
    const wethBal = await WETH_Contract.balanceOf(impersonateSigner.address);
    const deadLine = Math.floor(Date.now() / 1000) + (60*60);

    console.log("usdt balance before add liquidity ", Number(usdtBal));
    console.log("weth balance before swap ", Number(wethBal));
    

    await ROUTER.addLiquidityETH(
        USDT,
        // LISK,
        designerAmountA,
        // desiredAmountB,
        minAmountA,
        minAmountB,
        impersonateSigner.address,
        deadLine,
        {value : amountETHDesired}
    );

    const usdtBalAfter = await USDT_Contract.balanceOf(impersonateSigner.address);
    const wethBalAfter = await WETH_Contract.balanceOf(impersonateSigner.address);

    console.log("==============================")

    console.log("usdt balance after add liquidity ", Number(usdtBalAfter));
    console.log("weth balance after add liquidity", Number(wethBalAfter));
}


main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
})