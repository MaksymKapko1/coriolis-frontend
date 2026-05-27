import { Header } from "./components/Header";
import { useNadoAccount } from "./hooks/useNadoAccount";

function App() {
  const { loading, account } = useNadoAccount();
  return (
    <div className="min-h-screen bg-black">
      <Header account={account} />

      <main className="max-w-7xl mx-auto p-4 mt-10">
        <div className="border-2 border-green-400 p-8 text-center text-green-400">
          <h1 className="text-2xl mb-4">TERMINAL INITIATED...</h1>
          <p className="text-gray-400">
            Please connect your wallet to proceed.
          </p>
          <p className="text-sm text-gray-400">
            {loading
              ? "Parsing x18 engine data chunks..."
              : "Metrics mapped to symbols successfully. Check DevTools Console."}
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
