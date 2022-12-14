import { TokenManagerForm, ButtonGroups } from './styles'
import logo from "../../assets/alien-reading-book-animation.gif"
import LoadingSpinner from "../../components/LoadingSpinner/index";
import InputComponent from '../../components/Input'
import Button from '../../components/ButtonComponent/Button'
import ReactTooltip from 'react-tooltip'
import { ERC20_ABI, ERC20_MINT_ABI, ERC20_PAUSABLE_ABI, ERC20_BURNABLE_ABI, ERC20_AIRDROP_ABI} from "../../abis/constants"
import { useMoralis } from "react-moralis";
import { useState, useEffect } from 'react'
import { ethers} from "ethers";
import IUniswapV2Router02 from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import IUniswapV2Factory from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { isBurnable, isMint, isPausable, isSnaphots, isAirdrop} from '../../pages/token-generator/token-generator';
import { toast } from "react-toastify";
import {createMerkleRoot} from "./utils/merkleTreeUtils";

const TokenManagerScripts = (props) => {
  const {user, Moralis} = useMoralis();
  const toWei = (num) => ethers.utils.parseEther(num.toString())
  const fromWei = (num) => ethers.utils.formatEther(num)
  const toUSDC = (num) =>  (num * (10 ** (6))).toString()
  const [isLoading, setIsLoading] = useState(false)

  // Inject Liquidity properties
  const [liquidityProps, setLiquidityProps] = useState({
    tokenAmount: "", 
    USDCAmount: "", 
  })

  const [liquidityPrices, setLiquidityPrices] = useState({
    TokenPerUSDCPrice: "",
    USDCPerTokenPrice: ""
  })

  // BalanceOf properties
  const [balanceOf, setBalanceOf] = useState({
    address: "",
    amount: ""
  })
  // Mint properties
  const [mint, setMint] = useState({
    recipientAddress: "",
    amount: ""
  })
  // Transfer properties
  const [transfer, setTransfer] = useState({
    recipientAddress: "",
    amount: ""
  })
  // Allowance Properties
  const [allowance, setAllowance] = useState({
    ownerAddress: "",
    spenderAddress: "",
    allowedAddress:"",
    amount: ""
  })
  // Increase Allowance Properties
  const [increaseAllowance, setIncreaseAllowance] = useState({
    spenderAddress: "",
    amount: ""
  })
  // Decrease Allowance Properties
  const [decreaseAllowance, setDecreaseAllowance] = useState({
    spenderAddress: "",
    amount: ""
  })
  // TransferFrom properties
  const [transferFrom, setTransferFrom] = useState({
    senderAddress: "",
    recipientAddress: "",
    amount: ""
  })
  // Approve properties
  const [approve, setApprove] = useState({
    spenderAddress: "",
    amount: ""
  })
  // Burn properties
  const [burn, setBurn] = useState({
    amount: ""
  })
  // Airdrop properties
  const [airDrop, setAirDrop] = useState({
    amount: "",
    addresses: ""
  })

  const onInjectLiquidityChangeHandler = (e) => {
    const { name, value } = e.target
    setLiquidityProps({ ...liquidityProps, [name]: value })
  }

 function shouldCalculate() {
  return props.token?.attributes?.address && 
          liquidityProps.USDCAmount !== "" && 
          liquidityProps.tokenAmount !== "";
 }

  useEffect(() => {
    if(shouldCalculate()){
      const USDC = toWei(liquidityProps.USDCAmount); 
      const token = toWei(liquidityProps.tokenAmount);
      const tokenPerUSDCPrice = token/USDC;
      const USDCPerTokenPrice = USDC/token;
      let lqPrices = {
        TokenPerUSDCPrice: tokenPerUSDCPrice, 
        USDCPerTokenPrice: USDCPerTokenPrice
      }
      setLiquidityPrices(lqPrices)
    }else{
      let lqPrices = {
        TokenPerUSDCPrice: "", 
        USDCPerTokenPrice: ""
      }
      setLiquidityPrices(lqPrices)

    }
  }, [liquidityProps])

  const onTransferFromChangeHandler = (e) => {
    const { name, value } = e.target
    setTransferFrom({ ...transferFrom, [name]: value })
  }

  const onTransferChangeHandler = (e) => {
    const { name, value } = e.target
    setTransfer({ ...transfer, [name]: value })
  }

  const onApproveChangeHandler = (e) => {
    const { name, value } = e.target
    setApprove({ ...approve, [name]: value })
  }

  const onAllowanceChangeHandler = (e) => {
    const { name, value } = e.target
    setAllowance({ ...allowance, [name]: value })
  }

  const onIncreaseAllowanceChangeHandler = (e) => {
    const { name, value } = e.target
    setIncreaseAllowance({ ...increaseAllowance, [name]: value })
  }

  const onDecreaseAllowanceChangeHandler = (e) => {
    const { name, value } = e.target
    setDecreaseAllowance({ ...decreaseAllowance, [name]: value })
  }  

  const onBalanceChangeHandler = (e) => {
    const { name, value } = e.target
    setBalanceOf({ ...balanceOf, [name]: value })
  }

  const onMintChangeHandler = (e) => {
    const { name, value } = e.target
    setMint({ ...mint, [name]: value })
  }

  const onBurnChangeHandler = (e) => {
    const { name, value } = e.target
    setBurn({ ...mint, [name]: value })
  }

  const onAirDropChangeHandler = (e) => {
    const { name, value } = e.target
    setAirDrop({ ...airDrop, [name]: value })
  } 

  const submit = async () => {
    alert("Not implemented");
  }

  const supply = async () => {
    //TODO: move to an environment file - based on the network 
     const USDCAddress = '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede';
     const uniswapV2Router02Address = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
     const uniswapV2FactoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
     const tokenAddress = props.token?.attributes?.address;
     setIsLoading(true)
     console.log(liquidityProps);
     await Moralis.enableWeb3();
     //check for allowance for USDC
     const amountUSDCAllowed = await checkAllowanceAmount(USDCAddress, user?.get("ethAddress"), uniswapV2Router02Address);
     if(amountUSDCAllowed < liquidityProps.USDCAmount){
       // need to give allowance
       const transaction = await approveToken(USDCAddress, uniswapV2Router02Address, toUSDC(liquidityProps.USDCAmount));
       console.log(`Transaction Hash: ${transaction.hash}`)
       const result = await transaction.wait();
       console.log(result)
     }
     //check for allowance for TOKEN
     const tokenAllowed = await checkAllowanceAmount(tokenAddress, user?.get("ethAddress"), uniswapV2Router02Address);
     if(tokenAllowed < liquidityProps.tokenAmount){
       // need to give allowance
       const transaction = await approveToken(tokenAddress, uniswapV2Router02Address, toWei(liquidityProps.tokenAmount));
       console.log(`Transaction Hash: ${transaction.hash}`)
       const result = await transaction.wait();
       console.log(result)
     }
     console.log("adding liquidity... uniswap v2")
     const date = new Date();
     date.setMinutes(date.getMinutes() + 30); 
     console.log(`with parameters: Token_0: ${tokenAddress},  Token_1: ${USDCAddress}, Amount_0: ${toWei(liquidityProps.tokenAmount)}, Amount_1: ${toUSDC(liquidityProps.USDCAmount)}, To: ${uniswapV2Router02Address},  deadline: ${date.getTime()}`)  
     let sendOptions = {
       contractAddress: uniswapV2Router02Address,
       functionName: "addLiquidity",
       abi: IUniswapV2Router02.abi,
       params: {
         from: user?.get("ethAddress"),
         tokenA: tokenAddress,
         tokenB: USDCAddress,
          amountADesired: toWei(liquidityProps.tokenAmount),
          amountBDesired: toUSDC(liquidityProps.USDCAmount),
          amountAMin: toWei(liquidityProps.tokenAmount),
          amountBMin: toUSDC(liquidityProps.USDCAmount),
         to:  user?.get("ethAddress"),
         deadline: date.getTime()
       },
     };
     const transaction = await Moralis.executeFunction(sendOptions)
     .catch(
       (error) => {
         toast.error(error.message);
         setIsLoading(false);
       }
     );
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result);
    sendOptions = {
      contractAddress: uniswapV2FactoryAddress,
      functionName: "getPair",
      abi: IUniswapV2Factory.abi,
      params: {
        from: user?.get("ethAddress"),
        tokenA: tokenAddress,
        tokenB: USDCAddress
      }
    }
    const pairAddress = await Moralis.executeFunction(sendOptions)
    const token = props.token;
    token.set("pairAddress", pairAddress)
    token.save()
    await props.tokenPriceInUSD();
    toast.success("Injected liquidity successfully");
    setIsLoading(false);
  }

  const sendBalanceOf = async () => {
    console.log(balanceOf)
    setBalanceOf({ ...balanceOf, ["amount"]: "" })
    await Moralis.enableWeb3();
    const sendOptions = {
      contractAddress: props.token?.attributes?.address,
      functionName: "balanceOf",
      abi: ERC20_ABI,
      params: {
        account: balanceOf.address
      },
    }
    const balance = await Moralis.executeFunction(sendOptions)  
    .catch(
      (error) => {toast.error(error.message)}
    );
    console.log(balance)
    setBalanceOf({ ...balanceOf, ["amount"]: fromWei(balance) })     
  }
  
  const sendMint = async () => {
    setIsLoading(true)
    await Moralis.enableWeb3();
    let sendOptions = {
      contractAddress: props.token?.attributes?.address,
      functionName: "mint",
      abi: ERC20_MINT_ABI,
      params: {
        from: user?.get("ethAddress"),
        to: mint.recipientAddress,
        amount: toWei(mint.amount)
      },
    }
    const transaction = await Moralis.executeFunction(sendOptions)
    .catch(
      (error) => {
        toast.error(error.message)
        setIsLoading(false)
      },
    );
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result)
    sendOptions = {
      contractAddress: props.token?.attributes?.address,
      functionName: "totalSupply",
      abi: ERC20_ABI
    }
    const totalSupply = await Moralis.executeFunction(sendOptions);
    props.setTokenTotalSupply(totalSupply.toString());
    setIsLoading(false)
    toast.success("Minted successfully");
  }

  const sendTransfer = async () => {
    setIsLoading(true)
    console.log(transfer)
    await Moralis.enableWeb3();
    const sendOptions = {
      contractAddress: props.token?.attributes?.address,
      functionName: "transfer",
      abi: ERC20_ABI,
      params: {
        from: user?.get("ethAddress"),
        to: transfer.recipientAddress,
        amount: toWei(transfer.amount)
      },
    }
    const transaction = await Moralis.executeFunction(sendOptions)
    .catch(
      (error) => {
        toast.error(error.message)
        setIsLoading(false)
      },
    );
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result)
    setIsLoading(false)
    toast.success("Transfered successfully");
  }  
  
  const sendAllowance = async () => {
    setIsLoading(true)
    setAllowance({ ...allowance, ["amount"]: "" })
    console.log(allowance)
    tokenAddressToCheck = props.token?.attributes?.address;
    const amount = await checkAllowanceAmount(tokenAddressToCheck, allowance.ownerAddress, allowance.spenderAddress);
    let newAllowance = {
      ownerAddress: allowance.ownerAddress,
      spenderAddress: allowance.spenderAddress,
      allowedAddress: allowance.spenderAddress,
      amount: amount
    }
    setAllowance(newAllowance)
    setIsLoading(false)
  }  
  
  const sendIncreaseAllowance = async () => {
    setIsLoading(true)
    console.log(increaseAllowance)
    await Moralis.enableWeb3();
    const sendOptions = {
      contractAddress: props.token?.attributes?.address,
      functionName: "increaseAllowance",
      abi: ERC20_ABI,
      params: {
        from: user?.get("ethAddress"),
        addedValue: toWei(increaseAllowance.amount),
        spender: increaseAllowance.spenderAddress
      },
    }
    const transaction = await Moralis.executeFunction(sendOptions)
    .catch(
      (error) => {
        toast.error(error.message)
        setIsLoading(false)
      },
    );
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result)
    setIsLoading(false)
    toast.success("Increased successfully");
  }
  
  const sendDecreaseAllowance = async () => {
    setIsLoading(true)
    console.log(decreaseAllowance)
    await Moralis.enableWeb3();
    const sendOptions = {
      contractAddress: props.token?.attributes?.address,
      functionName: "decreaseAllowance",
      abi: ERC20_ABI,
      params: {
        from: user?.get("ethAddress"),
        subtractedValue: toWei(decreaseAllowance.amount),
        spender: decreaseAllowance.spenderAddress
      },
    }
    const transaction = await Moralis.executeFunction(sendOptions)
    .catch(
      (error) => {
        toast.error(error.message)
        setIsLoading(false)
      },
    );
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result)
    setIsLoading(false)
    toast.success("Decreased successfully");
  }

  const sendTransferFrom = async () => {
    setIsLoading(true)
    console.log(transferFrom)
    await Moralis.enableWeb3();
    const sendOptions = {
      contractAddress: props.token?.attributes?.address,
      functionName: "transfer",
      abi: ERC20_ABI,
      params: {
        from: transferFrom.senderAddress,
        to: transferFrom.recipientAddress,
        amount: toWei(transferFrom.amount)
      },
    }
    const transaction = await Moralis.executeFunction(sendOptions)
    .catch(
      (error) => {
        toast.error(error.message)
        setIsLoading(false)
      },
    );
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result)
    setIsLoading(false)
    toast.success("Transfered successfully");
  }

  const sendBurn = async () => {
    setIsLoading(true)
    console.log(burn)
    await Moralis.enableWeb3();
    let sendOptions = {
      contractAddress: props.token?.attributes?.address,
      functionName: "burn",
      abi: ERC20_BURNABLE_ABI,
      params: {
        from: user?.get("ethAddress"),
        amount: toWei(burn.amount)
      },
    }
    const transaction = await Moralis.executeFunction(sendOptions)
    .catch(
      (error) => {
        toast.error(error.message)
        setIsLoading(false)
      },
    );
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result)
    sendOptions = {
      contractAddress: props.token?.attributes?.address,
      functionName: "totalSupply",
      abi: ERC20_ABI
    }
    const totalSupply = await Moralis.executeFunction(sendOptions);
    props.setTokenTotalSupply(totalSupply.toString());
    setIsLoading(false)
    toast.success("Burned successfully");
  }    

  const sendApprove = async () => {
    setIsLoading(true)
    console.log(approve)
    const tokenAddress = props.token?.attributes?.address;
    const spenderAddress = approve.spenderAddress;
    const amount = approve.amount;
    const transaction = await approveToken(tokenAddress, spenderAddress, toWei(amount));
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result)
    setIsLoading(false)
    toast.success("Approved successfully");
  } 

  const sendPause = async () => {
    await Moralis.enableWeb3();
    setIsLoading(true)
    const contractAddress = props.token?.attributes?.address;
    const sendOptions = {
      contractAddress: contractAddress,
      functionName: "pause",
      abi: ERC20_PAUSABLE_ABI
    }
    const transaction = await Moralis.executeFunction(sendOptions)
    .catch(
      (error) => {toast.error(error.message)}
    );
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result)
    setIsLoading(false)
    toast.success("Paused successfully");
    props.setPausable({ ...pausable, ["isPaused"]: true })     
  } 

  const sendUnpause = async () => {
    await Moralis.enableWeb3();
    const contractAddress = props.token?.attributes?.address;
    const sendOptions = {
      contractAddress: contractAddress,
      functionName: "unpause",
      abi: ERC20_PAUSABLE_ABI
    }
    const transaction = await Moralis.executeFunction(sendOptions)  
    .catch(
      (error) => {toast.error(error.message)}
    );
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result)
    setIsLoading(false)
    toast.success("Unpaused successfully");
    props.setPausable({ ...pausable, ["isPaused"]: false })   
  }

  const sendAirDrop = async () => {
    setIsLoading(true)
    console.log(airDrop)
    const addressesArray = airDrop.addresses.split(",");
    const merkleRoot = createMerkleRoot(addressesArray);
    props.token.set("airDropAddresses", addressesArray);
    props.token.save();
    await Moralis.enableWeb3();
    const sendOptions = {
      contractAddress: props.token?.attributes?.address,
      functionName: "airDropTokens",
      abi: ERC20_AIRDROP_ABI,
      params: {
        root_: merkleRoot,
        rewardAmount_: toWei(airDrop.amount)
      },
    }
    const transaction = await Moralis.executeFunction(sendOptions)
    .catch(
      (error) => {
        toast.error(error.message)
        setIsLoading(false)
      },
    );
    console.log(`Transaction Hash: ${transaction.hash}`)
    const result = await transaction.wait();
    console.log(result)
    setIsLoading(false)
    toast.success("Air Drop created successfully");
  }

  async function approveToken(tokenAddress, spenderAddress, amount) {
    await Moralis.enableWeb3();
    const sendOptions = {
      contractAddress: tokenAddress,
      functionName: "approve",
      abi: ERC20_ABI,
      params: {
        from: user?.get("ethAddress"),
        spender: spenderAddress,
        amount: amount
      },
    };
    const transaction = await Moralis.executeFunction(sendOptions)
      .catch(
        (error) => {
          toast.error(error.message);
          setIsLoading(false);
        }
      );
    return transaction;
  }
  
  async function checkAllowanceAmount(tokenAddress, ownerAddress, spenderAddress) {
    await Moralis.enableWeb3();
    const sendOptions = {
      contractAddress: tokenAddress,
      functionName: "allowance",
      abi: ERC20_ABI,
      params: {
        from: user?.get("ethAddress"),
        owner: ownerAddress,
        spender: spenderAddress
      },
    };
    const amount = await Moralis.executeFunction(sendOptions)
      .catch(
        (error) => {
          toast.error(error.message);
          setIsLoading(false);
        }
      );
    return amount;
  }

  return (
    <>
    {isLoading ? (
      <LoadingSpinner logo={logo}/>
    ) : (
    props.token?.attributes?.address &&
    <TokenManagerForm>
      {/* row #0 */}
      {props.token?.attributes?.pairAddress === "" || props.token?.attributes?.pairAddress === undefined &&
      <div className="row">
        <div className="column">
          <InputComponent
            type="number"
            label="USDCAmount"
            labelName="Inject Liquidity"
            toolTip="liquidity"
            value={liquidityProps.USDCAmount}
            onChange={onInjectLiquidityChangeHandler}
            placeholder="Amount in USDC"
          />
          <ReactTooltip id="liquidity" place="top" effect="solid">
            When you add liquidity, you will receive pool tokens represeting your position. 
          </ReactTooltip>
          <InputComponent
            tokenManager={'tokenManager'}
            type="number"
            label="tokenAmount"
            value={liquidityProps.tokenAmount}
            onChange={onInjectLiquidityChangeHandler}
            placeholder="Amount of tokens"
          />
          <Button
            label={'Supply'}
            onClick={supply}
            classnames={[' secondary-btn snapshot']}
          />
        </div>
        {shouldCalculate() && 
        <div className="column">  
          <br/>
          Initial prices:
          <div>  
           1 {props.token?.attributes?.symbol} = {liquidityPrices.USDCPerTokenPrice} USDC
          </div>
          <div>
           1 USDC = {liquidityPrices.TokenPerUSDCPrice} {props.token?.attributes?.symbol}
          </div>
        </div>
        }
      </div>}
      {/* row #1 */}
      <div className="row">
        <div className="column">
          <InputComponent
            type="text"
            label="address"
            labelName="BalanceOf"
            value={balanceOf.address}
            toolTip="BalanceOf"
            onChange={onBalanceChangeHandler}
            placeholder="Owner Address"
          />
          <ReactTooltip id="BalanceOf" place="top" effect="solid">
            Returns the account balance of another account address.
          </ReactTooltip>
          <Button
            label={'Query Balance'}
            onClick={sendBalanceOf}
            classnames={[' secondary-btn snapshot']}
          />
        {balanceOf.amount !== "" && `Balance: ${balanceOf.amount} ${props.token?.attributes?.symbol}`}
        </div>
        <div className="column">
          <InputComponent
            type="text"
            label="recipientAddress"
            labelName="Transfer"
            toolTip="Transfer"
            value={transfer.recipientAddress}
            onChange={onTransferChangeHandler}
            placeholder="Recipient Address"
          />
          <ReactTooltip id="Transfer" place="top" effect="solid">
            Transfers _value amount of tokens to address _to, and MUST fire the Transfer event.
          </ReactTooltip>
          <InputComponent
            tokenManager={'tokenManager'}
            type="number"
            label="amount"
            value={transfer.amount}
            onChange={onTransferChangeHandler}
            placeholder="Amount"
          />
          <Button
            label={'Transfer'}
            onClick={sendTransfer}
            classnames={[' secondary-btn snapshot']}
          />
        </div>
      </div>
      {/* row #2 */}
      <div className="row">        
        <div className="column">
          <InputComponent
            type="text"
            label="senderAddress"
            labelName="TransferFrom"
            toolTip="TransferFrom"
            value={transferFrom.senderAddress}
            onChange={onTransferFromChangeHandler}
            placeholder="Owner Address"
          />
          <ReactTooltip id="TransferFrom" place="top" effect="solid">
            Transfers _value amount of tokens to address _to.
          </ReactTooltip>
          <InputComponent
            tokenManager={'tokenManager'}
            type="text"
            label="recipientAddress"
            value={transferFrom.recipientAddress}
            onChange={onTransferFromChangeHandler}
            placeholder="Recipient Address"
          />
          <InputComponent
            tokenManager={'tokenManager'}
            type="number"
            label="amount"
            value={transferFrom.amount}
            onChange={onTransferFromChangeHandler}
            placeholder="Amount"
          />
          <Button
            label={'TransferFrom'}
            onClick={sendTransferFrom}
            classnames={[' secondary-btn snapshot']}
          />
        </div>
        <div className="column">
          <InputComponent
            type="text"
            label="ownerAddress"
            labelName="Check Allowance"
            value={allowance.ownerAddress}
            toolTip="Allowance"
            onChange={onAllowanceChangeHandler}
            placeholder="Owner Address"
          />
          <ReactTooltip id="Allowance" place="top" effect="solid">
            Returns the amount which _spender is still allowed to withdraw from _owner.
          </ReactTooltip>
          <InputComponent
            tokenManager={'tokenManager'}
            type="text"
            label="spenderAddress"
            value={allowance.spenderAddress}
            onChange={onAllowanceChangeHandler}
            placeholder="Spender Address"
          />
          <Button
            label={'Allowance'}
            onClick={sendAllowance}
            classnames={[' secondary-btn snapshot']}
          />
        {allowance.amount !== "" && `Allowance to ${allowance.allowedAddress}: ${fromWei(allowance.amount)} ${props.token?.attributes?.symbol}`}
        </div>
      </div>
      {/* row #3 */}
      <div className="row">        
        <div className="column">
          <InputComponent
            type="text"
            label="spenderAddress"
            labelName="Increase Allowance"
            toolTip="IncreaseAllowance"
            value={increaseAllowance.spenderAddress}
            onChange={onIncreaseAllowanceChangeHandler}
            placeholder="Spender Address"
          />
          <ReactTooltip id="IncreaseAllowance" place="top" effect="solid">
            Atomically increases the allowance granted to `spender` by the caller.
          </ReactTooltip>
          <InputComponent
            tokenManager={'tokenManager'}
            type="number"
            label="amount"
            value={increaseAllowance.amount}
            onChange={onIncreaseAllowanceChangeHandler}
            placeholder="Add Amount"
          />
          <Button
            label={'Increase'}
            onClick={sendIncreaseAllowance}
            classnames={[' secondary-btn snapshot']}
          />
        </div>
        <div className="column">
          <InputComponent
            type="text"
            label="spenderAddress"
            labelName="Decrease Allowance"
            toolTip="DecreaseAllowance"
            value={decreaseAllowance.spenderAddress}
            onChange={onDecreaseAllowanceChangeHandler}
            placeholder="Spender Address"
          />
          <ReactTooltip id="DecreaseAllowance" place="top" effect="solid">
            Atomically decreases the allowance granted to `spender` by the caller.
          </ReactTooltip>
          <InputComponent
            tokenManager={'tokenManager'}
            type="number"
            label="amount"
            value={decreaseAllowance.amount}
            onChange={onDecreaseAllowanceChangeHandler}
            placeholder="Subtract Amount"
          />
          <Button
            label={'Decrease'}
            onClick={sendDecreaseAllowance}
            classnames={[' secondary-btn snapshot']}
          />
        </div>
      </div>
      {/* row #4 */}
      <div className="row">
      <div className="column">
          <InputComponent
            type="text"
            label="spenderAddress"
            labelName="Approve"
            value={approve.spenderAddress}
            toolTip="Approve"
            onChange={onApproveChangeHandler}
            placeholder="Spender Address"
          />
          <ReactTooltip id="Approve" place="top" effect="solid">
            Allows _spender to withdraw from your account multiple times, up to the _value amount.
          </ReactTooltip>
          <InputComponent
            tokenManager={'tokenManager'}
            type="number"
            label="amount"
            value={approve.amount}
            onChange={onApproveChangeHandler}
            placeholder="Amount"
          />
          <Button
            label={'Approve'}
            onClick={sendApprove}
            classnames={[' secondary-btn snapshot']}
          />
        </div>
        {isMint(props.token?.attributes?.type) && 
          <div className="column">
            <InputComponent
              type="text"
              label="recipientAddress"
              labelName="Mintable"
              toolTip="Mintable"
              value={mint.recipientAddress}
              onChange={onMintChangeHandler}
              placeholder="Recipient Address"
            />
            <InputComponent
              tokenManager={'tokenManager'}
              type="number"
              label="amount"
              value={mint.amount}
              onChange={onMintChangeHandler}
              placeholder="Amount"
            />
            <ReactTooltip id="Mintable" place="top" effect="solid">
              Privileged accounts will be able to emit new tokens.
            </ReactTooltip>
            <Button
              label={'Increase Supply'}
              onClick={sendMint}
              classnames={[' secondary-btn snapshot']}
            />
          </div>
        }     
      </div>
      {/* row #5 */}
      <div className="row">
        {isBurnable(props.token?.attributes?.type) && 
          <div className="column">
            <InputComponent
              type="number"
              label="amount"
              labelName="Burnable"
              toolTip="Burnable"
              value={burn.amount}
              onChange={onBurnChangeHandler}
              placeholder="Amount"
            />
            <ReactTooltip id="Burnable" place="top" effect="solid">
              Privileged accounts will be able to burn tokens.
            </ReactTooltip>
            <Button
              label={'Burn'}
              onClick={sendBurn}
              classnames={[' secondary-btn snapshot']}
            />
          </div>
        }
        {isAirdrop(props.token?.attributes?.type) && 
        <div className="column">
          <InputComponent
            type="number"
            label="amount"
            labelName="Air Drop"
            toolTip="AirDrop"
            value={airDrop.amount}
            onChange={onAirDropChangeHandler}
            placeholder="Number of Tokens"
          />
          <InputComponent
            type="text"
            label="addresses"
            value={airDrop.addresses}
            onChange={onAirDropChangeHandler}
            placeholder="Address separeted by comma"
          />
          <ReactTooltip id="AirDrop" place="top" effect="solid">
            Provide csv or json file with addresses to bulk send tokens to
          </ReactTooltip>
          <ButtonGroups>
            <Button
              label={'Choose File'}
              onClick={submit}
              classnames={[' secondary-btn snapshot']}
            />
            <Button
              label={'Airdrop'}
              onClick={sendAirDrop}
              classnames={[' secondary-btn snapshot']}
            />
          </ButtonGroups>
        </div>
        }
      </div>
  
      <div className="snapshot-pause-btn">
      {isSnaphots(props.token?.attributes?.type) &&
        <Button
          label={'Take Snapshot'}
          classnames={[' secondary-btn snapshot']}
        />
      }
        {isPausable(props.token?.attributes?.type) && !props.isPaused ?
          <Button
            label={'Emergency Pause'}
            onClick={sendPause}
            classnames={[' secondary-btn emergency']}
          />
          : isPausable(props.token?.attributes?.type) && props.isPaused &&
          <Button
            label={'Unpause'}
            onClick={sendUnpause}
            classnames={[' secondary-btn emergency']}
          />
        }
      </div>
    </TokenManagerForm>  
    )}
  </>
  )
}

export default TokenManagerScripts
