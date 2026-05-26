import { Header } from './components/Header';

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-7xl mx-auto p-4 mt-10">
        <div className="border-2 border-green-400 p-8 text-center text-green-400">
          <h1 className="text-2xl mb-4">TERMINAL INITIATED...</h1>
          <p className="text-gray-400">Please connect your wallet to proceed.</p>
        </div>
      </main>
    </div>
  );
}

export default App;