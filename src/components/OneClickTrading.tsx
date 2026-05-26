import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { generatePrivateKey } from 'viem/accounts';
import { saveSignerToBackend } from '../services/api';

export const OneClickTrading = () => {
  const { authenticated, getAccessToken } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!authenticated) return null;

  const handleEnable1Click = async () => {
    setLoading(true);
    setStatus('idle');
    try {
      const newPrivateKey = generatePrivateKey();

      // TODO:  SDK Nado,sign linkSigner onchain
      // await nadoClient.subaccount.linkSigner({ signer: addressFromPrivateKey });


      const token = await getAccessToken();

      if (!token) {
        throw new Error('Privy token generation failed');
      }
      await saveSignerToBackend(token, newPrivateKey);

      setStatus('success');
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-white p-6 max-w-md bg-black mt-6 rounded-none">
      <h3 className="text-lg font-bold tracking-widest uppercase mb-2 text-white">
        [1-Click Trading]
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Delegate trading permissions to a secure, encrypted session key. Trade instantly without wallet popups.
      </p>

      {status === 'success' && (
        <p className="text-green-400 text-sm mb-4 uppercase font-bold tracking-wider">
          >>> SESSION INITIATED SUCCESSFULLY
        </p>
      )}

      {status === 'error' && (
        <p className="text-red-500 text-sm mb-4 uppercase font-bold tracking-wider">
          >>> ERROR ENABLING SESSION
        </p>
      )}

      <button
        onClick={handleEnable1Click}
        disabled={loading}
        className="w-full border-2 border-green-400 p-3 text-sm font-bold uppercase tracking-widest bg-black text-green-400 hover:bg-green-400 hover:text-black transition-all disabled:opacity-50 rounded-none"
      >
        {loading ? 'PROCESSING...' : 'ENABLE 1-CLICK TRADING'}
      </button>
    </div>
  );
};