import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router
    const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap V2 Factory
    const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT address
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH address

    const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621"; // Token holder address for impersonation

    // Impersonate account to get access to the token holder's signer
    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonateSigner = await ethers.getSigner(TOKEN_HOLDER);

    const designerAmountA = ethers.parseUnits("100", 6); // USDT amount to add as liquidity
    const amountETHDesired = ethers.parseEther("1"); // ETH amount to add as liquidity

    const minAmountA = ethers.parseUnits("50", 6); // Minimum USDT to add
    const minAmountB = ethers.parseEther("0.02"); // Minimum ETH to add

    const minUSDT = ethers.parseUnits("50", 6);  // Minimum USDT to receive when removing liquidity
    const minETH = ethers.parseEther("0.02");    // Minimum ETH to receive when removing liquidity

    const USDT_Contract = await ethers.getContractAt("IERC20", USDT, impersonateSigner);
    const WETH_Contract = await ethers.getContractAt("IERC20", WETH, impersonateSigner);
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonateSigner);
    const FACTORY = await ethers.getContractAt("IUniswapV2Factory", FACTORY_ADDRESS, impersonateSigner);

    const pairAddress = await FACTORY.getPair(USDT, WETH); // Get pair address for USDT/WETH
    const lpToken = await ethers.getContractAt("IERC20", pairAddress, impersonateSigner); // LP token contract

    const deadLine = Math.floor(Date.now() / 1000) + (60 * 20); // Set deadline 20 minutes in the future

    // Approve USDT and WETH for the router
    await USDT_Contract.approve(ROUTER_ADDRESS, designerAmountA);

    const usdtBal = await USDT_Contract.balanceOf(impersonateSigner.address);
    const wethBal = await WETH_Contract.balanceOf(impersonateSigner.address);
    console.log("USDT balance before adding liquidity ETH:", Number(usdtBal));
    console.log("WETH balance before adding liquidity ETH:", Number(wethBal));

    // Add liquidity
    await ROUTER.addLiquidityETH(
        USDT,
        designerAmountA,
        minAmountA,
        minAmountB,
        impersonateSigner.address,
        deadLine,
        { value: amountETHDesired }
    );

    const usdtBalAfter = await USDT_Contract.balanceOf(impersonateSigner.address);
    console.log("USDT balance after adding liquidity ETH:", Number(usdtBalAfter));

    // Check LP Token balance
    const liquidity = await lpToken.balanceOf(impersonateSigner.address);
    console.log("LP Token balance before removing liquidity:", liquidity.toString());

    // Approve LP tokens for the router
    await lpToken.approve(ROUTER_ADDRESS, liquidity);

    console.log("Removing liquidity...");

    // Remove liquidity
    await ROUTER.removeLiquidityETH(
        USDT,
        liquidity,           // LP token balance
        minUSDT,             // Minimum amount of USDT to receive
        minETH,              // Minimum amount of ETH to receive
        impersonateSigner.address,
        deadLine
    );

    // await txRemove.wait();
    const usdtBalRem = await USDT_Contract.balanceOf(impersonateSigner.address);
    const wethBalRem = await WETH_Contract.balanceOf(impersonateSigner.address);
    // const wethAfter = WETH_Contract.connect(impersonateSigner).withdr
    console.log("USDT balance after removing liquidity ETH:", Number(usdtBalRem));
    console.log("WETH balance after removing liquidity ETH:", Number(wethBalRem));
    
    if (wethBalRem.gt(0)) {
        await WETH_Contract.withdraw(wethBalAfter); // This will convert WETH back to ETH
        console.log("WETH unwrapped back to ETH");
    }
    console.log("Liquidity removed successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
