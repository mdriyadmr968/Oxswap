import React, { useState, useEffect } from "react";
import { WagmiConfig, createConfig, useAccount } from "wagmi";
import {
  ConnectKitProvider,
  ConnectKitButton,
  getDefaultConfig,
} from "connectkit";
import PriceView from "./components/Price/PriceView";
import QuoteView from "./components/Quote/QuoteView";

const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    alchemyId: "MzUaa0A87yexjd8UKcHm8HIr1f4aghxT",
    walletConnectProjectId: "a8024e8262cb4e7102941a3577b5a5c0",

    // Required
    appName: "0x React.js Demo App",

    // Optional
    appDescription: "A React.js demo app for 0x Swap API and ConnectKit",
  })
);

const App = () => {
  const [tradeDirection, setTradeDirection] = useState("sell");
  const [finalize, setFinalize] = useState(false);
  const [price, setPrice] = useState();
  const [quote, setQuote] = useState();
  const { address } = useAccount();

  return (
    <div style={{ padding: "20px" }}>
      <WagmiConfig config={config}>
        <ConnectKitProvider>
          <ConnectKitButton />
          <div
            className={`flex min-h-screen flex-col items-center justify-between p-24`}
          >
            {finalize && price ? (
              <QuoteView
                takerAddress={address}
                price={price}
                quote={quote}
                setQuote={setQuote}
              />
            ) : (
              <PriceView
                takerAddress={address}
                price={price}
                setPrice={setPrice}
                setFinalize={setFinalize}
              />
            )}
          </div>
        </ConnectKitProvider>
      </WagmiConfig>
    </div>
  );
};

export default App;
