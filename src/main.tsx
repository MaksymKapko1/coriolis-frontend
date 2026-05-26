import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PrivyProvider } from "@privy-io/react-auth";
import { inkSepolia } from "./config/chains";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PrivyProvider
      appId="cmpm7bvj000720djvvdn8mlzh"
      config={{
        loginMethods: ["wallet"],
        supportedChains: [inkSepolia],
        appearance: {
          theme: "dark",
          accentColor: "#4ade80",
          logo: "",
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
);
