import qs from "qs";
import { ConnectKitButton } from "connectkit";
import { useState, ChangeEvent, useEffect } from "react";
import { formatUnits, parseUnits } from "ethers";
import {
  erc20ABI,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import {
  POLYGON_TOKENS,
  POLYGON_TOKENS_BY_SYMBOL,
  MAX_ALLOWANCE,
  exchangeProxy,
} from "../../lib/constants";
import axios from "axios";

export const fetcher = (endpoint, params) => {
  const { sellAmount, buyAmount } = params;
  if (!sellAmount && !buyAmount) return;
  const query = qs.stringify(params);

  return fetch(`${endpoint}?${query}`).then((res) => res.json());
};

export default function PriceView({ setPrice, setFinalize, takerAddress }) {
  // fetch price here
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [tradeDirection, setTradeDirection] = useState("sell");
  const [sellToken, setSellToken] = useState("wmatic");
  const [buyToken, setBuyToken] = useState("dai");
  const [isLoadingPrice, setisLoadingPrice] = useState(false);

  const handleSellTokenChange = (e) => {
    setSellToken(e.target.value);
  };

  function handleBuyTokenChange(e) {
    setBuyToken(e.target.value);
  }

  const sellTokenDecimals = POLYGON_TOKENS_BY_SYMBOL[sellToken].decimals;

  const parsedSellAmount =
    sellAmount && tradeDirection === "sell"
      ? parseUnits(sellAmount, sellTokenDecimals).toString()
      : undefined;

  const buyTokenDecimals = POLYGON_TOKENS_BY_SYMBOL[buyToken].decimals;

  const parsedBuyAmount =
    buyAmount && tradeDirection === "buy"
      ? parseUnits(buyAmount, buyTokenDecimals).toString()
      : undefined;

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setisLoadingPrice(true);
        const sellTokenAddress = POLYGON_TOKENS_BY_SYMBOL[sellToken].address;
        const buyTokenAddress = POLYGON_TOKENS_BY_SYMBOL[buyToken].address;
        const query = qs.stringify({
          sellToken: sellTokenAddress,
          buyToken: buyTokenAddress,
          sellAmount: parsedSellAmount,
          buyAmount: parsedBuyAmount,
          takerAddress,
        });
        const url = `https://polygon.api.0x.org/swap/v1/price?${query}`;
        const response = await fetch(url, {
          headers: {
            "0x-api-key": "c9f13c84-9fcb-4f42-aa30-a11b0d016aa5", // process.env.NEXT_PUBLIC_0X_API_KEY,
          },
        });
        const data = await response.json();
        setPrice(data);
        setisLoadingPrice(false);
        if (tradeDirection === "sell") {
          setBuyAmount(formatUnits(data.buyAmount, buyTokenDecimals));
        } else {
          setSellAmount(formatUnits(data.sellAmount, sellTokenDecimals));
        }
      } catch (error) {
        console.error("Error fetching price: ", error);
        setisLoadingPrice(false);
      }
    };

    fetchPrice();
  }, [sellToken, buyToken, sellAmount, buyAmount]);

  return (
    <form>
      <h1 className="text-3xl font-bold mb-4">0x Swap API Demo</h1>
      <p className="text-md mb-2">
        Check out the <a href="https://0x.org/docs/">0x Docs</a> and{" "}
        <a href="https://0x.org/docs/">Code</a> to build your own
      </p>
      <p className="text-md font-bold mb-2">Polygon Network</p>

      <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-md mb-3">
        <section className="mt-4 flex items-start justify-center">
          <label htmlFor="sell-select" className="sr-only"></label>
          <img
            alt={sellToken}
            className="h-9 w-9 mr-2 rounded-md"
            src={POLYGON_TOKENS_BY_SYMBOL[sellToken].logoURI}
          />
          <div className="h-14 sm:w-full sm:mr-2">
            <select
              value={sellToken}
              name="sell-token-select"
              id="sell-token-select"
              className="mr-2 w-50 sm:w-full h-9 rounded-md"
              onChange={handleSellTokenChange}
            >
              {/* <option value="">--Choose a token--</option> */}
              {POLYGON_TOKENS.map((token) => {
                return (
                  <option
                    key={token.address}
                    value={token.symbol.toLowerCase()}
                  >
                    {token.symbol}
                  </option>
                );
              })}
            </select>
          </div>
          <label htmlFor="sell-amount" className="sr-only"></label>
          <input
            id="sell-amount"
            value={sellAmount}
            className="h-9 rounded-md"
            style={{ border: "1px solid black" }}
            onChange={(e) => {
              setTradeDirection("sell");
              setSellAmount(e.target.value);
            }}
          />
        </section>
        <section className="flex mb-6 mt-4 items-start justify-center">
          <label htmlFor="buy-token" className="sr-only"></label>
          <img
            alt={buyToken}
            className="h-9 w-9 mr-2 rounded-md"
            src={POLYGON_TOKENS_BY_SYMBOL[buyToken].logoURI}
          />
          <select
            name="buy-token-select"
            id="buy-token-select"
            value={buyToken}
            className="mr-2 w-50 sm:w-full h-9 rounded-md"
            onChange={(e) => handleBuyTokenChange(e)}
          >
            {/* <option value="">--Choose a token--</option> */}
            {POLYGON_TOKENS.map((token) => {
              return (
                <option key={token.address} value={token.symbol.toLowerCase()}>
                  {token.symbol}
                </option>
              );
            })}
          </select>
          <label htmlFor="buy-amount" className="sr-only"></label>
          <input
            id="buy-amount"
            value={buyAmount}
            className="h-9 rounded-md bg-white cursor-not-allowed"
            style={{ border: "1px solid black" }}
            disabled
            onChange={(e) => {
              setTradeDirection("buy");
              setBuyAmount(e.target.value);
            }}
          />
        </section>
      </div>

      {takerAddress ? (
        <ApproveOrReviewButton
          sellTokenAddress={POLYGON_TOKENS_BY_SYMBOL[sellToken].address}
          takerAddress={takerAddress}
          onClick={() => {
            setFinalize(true);
          }}
        />
      ) : (
        <ConnectKitButton.Custom>
          {({
            isConnected,
            isConnecting,
            show,
            hide,
            address,
            ensName,
            chain,
          }) => {
            return (
              <button
                onClick={show}
                type="button"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                {isConnected ? address : "Connect Wallet"}
              </button>
            );
          }}
        </ConnectKitButton.Custom>
      )}

      {isLoadingPrice && (
        <div className="text-center mt-2">Fetching the best price...</div>
      )}
    </form>
  );
}

function ApproveOrReviewButton({ takerAddress, onClick, sellTokenAddress }) {
  const [isApproving, setIsApproving] = useState(false);
  const MAX_ALLOWANCE =
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

  // 1. Read from erc20, does spender (0x Exchange Proxy) have allowance?
  const { data: allowance, refetch } = useContractRead(
    sellTokenAddress,
    erc20ABI,
    "allowance",
    [takerAddress, exchangeProxy]
  );

  // 2. (only if no allowance): write to erc20, approve 0x Exchange Proxy to spend max integer
  const { config } = usePrepareContractWrite(
    sellTokenAddress,
    erc20ABI,
    "approve",
    [exchangeProxy, MAX_ALLOWANCE]
  );
  const {
    data: writeContractResult,
    writeAsync: approveAsync,
    error,
  } = useContractWrite(config);

  const { hash } = useWaitForTransaction({
    hash: writeContractResult ? writeContractResult.hash : undefined,
    onSuccess(data) {
      refetch();
      setIsApproving(false);
    },
  });

  if (error) {
    return <div>Something went wrong: {error.message}</div>;
  }

  if (allowance === 0 && approveAsync) {
    return (
      <>
        <button
          type="button"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
          onClick={async () => {
            setIsApproving(true);
            await approveAsync();
          }}
          disabled={isApproving}
        >
          {isApproving ? "Approving..." : "Approve"}
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
    >
      Review Trade
    </button>
  );
}
