import React, { useState, useEffect } from "react";
import qs from "qs";

import {
  POLYGON_TOKENS_BY_SYMBOL,
  POLYGON_TOKENS_BY_ADDRESS,
} from "../../lib/constants";
import { fetcher } from "../Price/PriceView";
import { formatUnits } from "ethers";
import {
  useAccount,
  useSendTransaction,
  usePrepareSendTransaction,
} from "wagmi";

function QuoteView({ price, quote, setQuote, takerAddress }) {
  const [quoteData, setQuoteData] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  useEffect(() => {
    async function fetchQuote() {
      const query = qs.stringify({
        sellToken: price.sellTokenAddress,
        buyToken: price.buyTokenAddress,
        sellAmount: price.sellAmount,
        takerAddress,
      });
      const response = await fetch(
        // `https://polygon.api.0x.org/swap/v1/quote?${query}`,
        `https://api.0x.org/swap/v1/quote?sellAmount=1000000000&buyToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&sellToken=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`,

        {
          headers: {
            "0x-api-key": "5377b882-05cf-4814-a66d-102a86974012",
          },
        }
      );
      const data = await response.json();
      setQuote(data);
      setQuoteData(data);
      console.log("quote", data);
    }

    fetchQuote();
  }, [price, takerAddress]);

  const { address } = useAccount();

  const { config } = usePrepareSendTransaction({
    to: quoteData?.to,
    data: quoteData?.data,
  });

  const { sendTransaction } = useSendTransaction({
    to: "moxey.eth",
    value: parseInt(0.01),
  });

  if (quoteError) {
    return <div>Error fetching quote: {quoteError.message}</div>;
  }

  if (!quoteData) {
    return <div>Getting best quote...</div>;
  }

  const sellTokenInfo =
    POLYGON_TOKENS_BY_ADDRESS[price.sellTokenAddress.toLowerCase()];

  return (
    <div className="p-3 mx-auto max-w-screen-sm ">
      {quoteData.sellAmount && (
        <form>
          <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-sm mb-3">
            <div className="text-xl mb-2 text-white">You pay</div>
            <div className="flex items-center text-lg sm:text-3xl text-white">
              <img
                alt={sellTokenInfo.symbol}
                className="h-9 w-9 mr-2 rounded-md"
                src={sellTokenInfo.logoURI}
              />
              <span>
                {formatUnits(quoteData.sellAmount, sellTokenInfo.decimals)}
              </span>
              <div className="ml-2">{sellTokenInfo.symbol}</div>
            </div>
          </div>

          <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-sm mb-3">
            <div className="text-xl mb-2 text-white">You receive</div>
            <div className="flex items-center text-lg sm:text-3xl text-white">
              <img
                alt={
                  POLYGON_TOKENS_BY_ADDRESS[price.buyTokenAddress.toLowerCase()]
                    .symbol
                }
                className="h-9 w-9 mr-2 rounded-md"
                src={
                  POLYGON_TOKENS_BY_ADDRESS[price.buyTokenAddress.toLowerCase()]
                    .logoURI
                }
              />
              <span>
                {formatUnits(
                  quoteData.buyAmount,
                  POLYGON_TOKENS_BY_ADDRESS[price.buyTokenAddress.toLowerCase()]
                    .decimals
                )}
              </span>
              <div className="ml-2">
                {
                  POLYGON_TOKENS_BY_ADDRESS[price.buyTokenAddress.toLowerCase()]
                    .symbol
                }
              </div>
            </div>
          </div>
        </form>
      )}

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        onClick={() => {
          console.log("submitting quote to blockchain");
          sendTransaction && sendTransaction();
        }}
      >
        Place Order
      </button>
    </div>
  );
}

export default QuoteView;
