import Summary from "../../components/tokenOverview-profileSummary";
import { MainContainer } from "../../themes/container";
import { ManagerMain } from "./styles";
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import Select from 'react-select'
import TokenManagerScripts from "../../components/TokenManagerScripts";
import TransactionHistory from "../transaction-history";
import TopHoldersHistory from "../holders-history";
import { isPausable} from '../../pages/token-generator/token-generator';
import { ERC20_ABI, ERC20_PAUSABLE_ABI, tokenPriceConsumerABI  } from "../../abis/constants";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { currencyFormat, convertToDecimals } from './utils/currencyFormat'
import IUniswapV2Pair from "@uniswap/v2-core/build/IUniswapV2Pair.json";

const TokenManager = (props) => {
  const {user,Moralis} = useMoralis()
  const USDCtoWei = (num) =>  (num * (10 ** (18-6))).toString()
  const fromWei = (num) => ethers.utils.formatEther(num)

  useEffect(() => {
    props.loadUserAddress()
  }, [user])
  
  const [pausable, setPausable] = useState({
    isPaused: false
  })
  const [token, setToken] = useState("")
  const [tokenTotalSupply, setTokenTotalSupply] = useState("")
  const [owner, setOwner] = useState("")
  const [tokenOverview, setTokenOverview] = useState("")
  const [userTokenList, setUserTokenList] = useState([])

  useEffect(() => {
    if (user) {
      let listTokens = [];
      Moralis.Cloud.run("getERC20Tokens", {userAddress: user.attributes.ethAddress}).then((data)=> {
        if(data){
          data.map((token) => {
            listTokens.push({value: token, label: token.attributes.name});
            if(listTokens.length > 0){
              setUserTokenList(listTokens)
            }
         })
        }
      }).catch((error) => {
          console.error(error);
      })
    }
  }, [user])

  useEffect(() => {
    const tokenAddress = token?.attributes?.address;
    if(tokenAddress){
      const fetchData = async () => {
        await Moralis.enableWeb3();
        const sendOptions = {
          contractAddress: token?.attributes?.address,
          functionName: "totalSupply",
          abi: ERC20_ABI
        }
        const totalSupply = await Moralis.executeFunction(sendOptions);
        setTokenTotalSupply(totalSupply.toString());
        if(isPausable(token.attributes.type)){
          const contractAddress = token?.attributes?.address;
          const sendOptions = {
            contractAddress: contractAddress,
            functionName: "paused",
            abi: ERC20_PAUSABLE_ABI,
            params: {
              account: contractAddress
            },
          }
          const isPaused = await Moralis.executeFunction(sendOptions)  
          .catch(
            (error) => {toast.error(error.message)}
          );
          setPausable({ ...pausable, ["isPaused"]: isPaused })
        }
        await tokenPriceInUSD();
      }
      fetchData().catch((error) => {
        console.error(error)
      })
    }

  }, [token])

  const tokenPriceInUSD = async () => {
    const USDCAddress = '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede';
    const tokenPriceConsumer = '0x14A46bB8d9e6c9F133CA1445891E01E1fdAbE0A3';
    if(token?.attributes?.pairAddress){
      let sendOptions = {
        contractAddress: token?.attributes?.pairAddress,
        functionName: "getReserves",
        abi: IUniswapV2Pair.abi,
        params: {
          from: user?.get("ethAddress")
        }
      }
      const reserves = await Moralis.executeFunction(sendOptions)
      sendOptions.functionName = "token0"
      const token0 = await Moralis.executeFunction(sendOptions)
      let tokenReserves; 
      let usdcReserves;
      if(token0 === USDCAddress) {
        tokenReserves = reserves.reserve1;
        usdcReserves =  reserves.reserve0;
      }else{
        tokenReserves = reserves.reserve0;
        usdcReserves =  reserves.reserve1;
      }
      const USDCperToken = USDCtoWei(usdcReserves)/tokenReserves;
      sendOptions = {
        contractAddress: tokenPriceConsumer,
        functionName: "getLatestUSDCPrice",
        abi: tokenPriceConsumerABI,
        params: {
          from: user?.get("ethAddress")
        }
      }
      const USDLivePrice = await Moralis.executeFunction(sendOptions);
      sendOptions = {
        contractAddress: token?.attributes?.address,
        functionName: "balanceOf",
        abi: ERC20_ABI,
        params: {
          from: user?.get("ethAddress"),
          account: user?.get("ethAddress")
        }
      }
      const ownerBalance = await Moralis.executeFunction(sendOptions);
      const tokenUSDPrice = currencyFormat(USDCperToken * convertToDecimals(USDLivePrice));
      const ownerBalanceInUSD = currencyFormat(fromWei(ownerBalance) * tokenUSDPrice);
      const owner = {
        tokenAmount: ownerBalance, 
        tokenInUSD: ownerBalanceInUSD
      }
      setOwner(owner);
      sendOptions = {
        contractAddress: token?.attributes?.address,
        functionName: "totalSupply",
        abi: ERC20_ABI
      }
      const totalSupply = await Moralis.executeFunction(sendOptions);
      const marketCap = currencyFormat(fromWei(totalSupply) * tokenUSDPrice);
      const holderCap = currencyFormat((fromWei(totalSupply) - fromWei(ownerBalance)) * tokenUSDPrice);
      let overview = {
        tokenUSDPrice: tokenUSDPrice,
        marketCap: marketCap, 
        holderCap: holderCap
      }
      setTokenOverview(overview);
      token.set("tokenUSDPrice", tokenUSDPrice)
      token.set("marketCap", marketCap)
      token.set("holderCap", holderCap)
      token.save();
    }
  }

  const selected = (e) => {
    console.log(e.value)
    setToken(e.value)
  }

  return (
      <MainContainer>
      <Summary token={token} tokenOverview={tokenOverview} totalSupply={tokenTotalSupply} owner={owner}/>
      <ManagerMain>
        {props.scripts && <h3 className="bold color-primary">Manager</h3>}
        {props.tokenHistory && <h3 className="bold color-primary">Transaction History</h3>}
        {props.topTokenHolders && <h3 className="bold color-primary">Top Holders</h3>}
        <Select options={userTokenList} onChange={selected}/>
        {props.scripts && <TokenManagerScripts token={token} isPaused={pausable.isPaused} setPausable={setPausable} setTokenTotalSupply={setTokenTotalSupply} tokenPriceInUSD={tokenPriceInUSD}/>}
        {props.tokenHistory && <TransactionHistory token={token} />}
        {props.topTokenHolders && <TopHoldersHistory token={token} totalSupply={tokenTotalSupply}/>}
      </ManagerMain>
    </MainContainer>
  );
};

export default TokenManager;
