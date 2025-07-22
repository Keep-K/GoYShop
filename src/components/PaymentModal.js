import React, { useState } from 'react';
import { Connection, PublicKey, clusterApiUrl, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

const BONK_MINT = 'DezX1kJ6yQj5Q6R9hC6z5pytwR6rQ5uY6z5Q6R9hC6z5';
const SOLANA_NETWORK = 'mainnet-beta';

export default function PaymentModal({ product, adminWallet, onClose, onSuccess, buyerInfo, onBack }) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

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
      // BONK는 소수점 5자리, 예: 1 BONK = 100000
      const amount = (product.price * 100000).toString();

      const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));
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
        <span className="product-price-highlight">가격: {product.price} $Guardian (BONK)</span>
        {buyerInfo && (
          <div className="buyer-info-summary">
            <p><strong>구매자:</strong> {buyerInfo.name}</p>
            <p><strong>이메일:</strong> {buyerInfo.email}</p>
            <p><strong>주소:</strong> {buyerInfo.address}</p>
          </div>
        )}
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