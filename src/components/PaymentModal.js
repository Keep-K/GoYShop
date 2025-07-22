import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

const BONK_MINT = '9AYqowFKZPpJQia3DuT2q1aV6fX1EQh4x2HotVcp4Ast';
const SOLANA_NETWORK = 'devnet'; // devnet, mainnet-beta 테스트용으로 전환시 데브넷 이용

function getTokenName(mint) {
  if (mint === BONK_MINT) return 'Guardian';
  return 'Unknown Token';
}

function useSplTokenAccounts(walletAddress) {
  const [tokens, setTokens] = useState([]);
  useEffect(() => {
    if (!walletAddress) return;
    const connection = new Connection(process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    (async () => {
      const accounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );
      const tokens = accounts.value.map(({ account }) => ({
        mint: account.data.parsed.info.mint,
        amount: account.data.parsed.info.tokenAmount.uiAmount,
      }));
      setTokens(tokens);
    })();
  }, [walletAddress]);
  return tokens;
}

export default function PaymentModal({ product, adminWallet, onClose, onSuccess, buyerInfo, onBack }) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    if (window.solana && window.solana.isPhantom && window.solana.publicKey) {
      setWalletAddress(window.solana.publicKey.toString());
    }
  }, []);

  const tokens = useSplTokenAccounts(walletAddress);

  async function handlePay() {
    setLoading(true);
    setError('');
    try {
      if (!window.solana || !window.solana.isPhantom) {
        setError('Phantom Wallet을 설치해주세요!');
        setLoading(false);
        return;
      }
      await window.solana.connect();
      const from = window.solana.publicKey.toString();
      const to = adminWallet;
      const GUARDIAN_DECIMALS = 9; // 실제 decimals 값으로 맞추세요
      const amount = (product.price * Math.pow(10, GUARDIAN_DECIMALS)).toString();

      const connection = new Connection(process.env.REACT_APP_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK));
      const fromPubkey = new PublicKey(from);
      const toPubkey = new PublicKey(to);
      const mint = new PublicKey(BONK_MINT);

      const fromTokenAccount = await getAssociatedTokenAddress(mint, fromPubkey);
      const toTokenAccount = await getAssociatedTokenAddress(mint, toPubkey);

      const tx = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          fromPubkey,
          amount
        )
      );
      tx.feePayer = fromPubkey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedTx = await window.solana.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');
      setTxHash(signature);

      if (onSuccess) onSuccess(signature);

    } catch (e) {
      setError(e.message || '결제 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-content">
        <h2>Phantom + BONK 결제</h2>
        <p><strong>상품:</strong> {product.name}</p>
        <span className="product-price-highlight">
          가격: {product.price} {getTokenName(BONK_MINT)}
        </span>
        {buyerInfo && (
          <div className="buyer-info-summary">
            <p><strong>구매자:</strong> {buyerInfo.name}</p>
            <p><strong>이메일:</strong> {buyerInfo.email}</p>
            <p><strong>주소:</strong> {buyerInfo.address}</p>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '1rem 2rem 0 0' }}>
          <div style={{
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '0.7rem 1.5rem',
            fontSize: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <strong>내 계좌 잔고:</strong>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {tokens.length === 0 && <li>잔고 없음</li>}
              {tokens.map(token => (
                <li key={token.mint}>
                  {token.amount} {getTokenName(token.mint)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button onClick={handlePay} disabled={loading} className="purchase-btn" style={{width:'100%', marginTop:'1.5rem'}}>
          {loading ? '결제 중...' : 'Phantom으로 결제'}
        </button>
        {txHash && <div style={{marginTop:'1rem'}}>결제 성공! 트랜잭션: <a href={`https://solscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a></div>}
        {error && <div style={{color:'red', marginTop:'0.5rem'}}>{error}</div>}
        <div className="payment-modal-buttons">
          {onBack && <button onClick={onBack} className="back-btn">뒤로가기</button>}
          <button onClick={onClose} className="close-btn">닫기</button>
        </div>
      </div>
    </div>
  );
}