import React, { useState, useEffect } from 'react';
import { productService, walletService } from '../services/database';
import PaymentModal from './PaymentModal';
import { useAuth } from '../contexts/AuthContext';
import { Connection, PublicKey } from '@solana/web3.js';

const GUARDIAN_MINT = '9AYqowFKZPpJQia3DuT2q1aV6fX1EQh4x2HotVcp4Ast';

function getTokenName(mint) {
  if (mint === GUARDIAN_MINT) return 'Guardian';
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

const Shop = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adminWallet, setAdminWallet] = useState('');
  const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '', address: '' });
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    async function fetchData() {
      const productsData = await productService.getProducts();
      setProducts(productsData);
      if (currentUser) {
        const addr = await walletService.getWalletAddress();
        setAdminWallet(addr);
      } else {
        setAdminWallet('');
      }
    }
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    if (showBuyerForm && currentUser) {
      setBuyerInfo(prev => ({ ...prev, email: currentUser.email || '' }));
    }
  }, [currentUser, showBuyerForm]);

  useEffect(() => {
    if (window.solana && window.solana.isPhantom && window.solana.publicKey) {
      setWalletAddress(window.solana.publicKey.toString());
    }
  }, []);

  const tokens = useSplTokenAccounts(walletAddress);

  // 구매 버튼 클릭 시
  const handlePurchaseClick = (product) => {
    if (!currentUser) {
      alert('로그인 후 구매할 수 있습니다.');
      return;
    }
    setSelectedProduct(product);
    setBuyerInfo({ name: '', email: currentUser.email || '', address: '' });
    setShowBuyerForm(true);
  };

  // 구매자 정보 입력 후 결제 버튼 클릭 시
  const handleBuyerFormSubmit = (e) => {
    e.preventDefault();
    setShowBuyerForm(false);
    setShowPaymentModal(true);
  };

  // 결제 완료 후
  const handlePaymentSuccess = (txHash) => {
    setTxHash(txHash);
    setPaymentSuccess(true);
    setShowPaymentModal(false);
    setSelectedProduct(null);
  };

  return (
    <div className="shop">
      <div className="container">
        <h1 className="page-title">상품 목록</h1>
        {/* 중앙 정렬된 내 계좌 잔고 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '2rem 0 2rem 0'
        }}>
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
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} />
                ) : (
                  <div className="placeholder-image">🛍️</div>
                )}
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-price">
                  {product.price?.toLocaleString()} Guardian
                </div>
                <button
                  onClick={() => handlePurchaseClick(product)}
                  className="purchase-btn"
                >
                  구매하기
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* 구매자 정보 입력 폼 모달 */}
        {showBuyerForm && (
          <div className="buyer-form-modal">
            <div className="buyer-form-content">
              <h2>구매자 정보 입력</h2>
              <form onSubmit={handleBuyerFormSubmit}>
                <div className="form-group">
                  <label>이름</label>
                  <input
                    type="text"
                    value={buyerInfo.name}
                    onChange={e => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>이메일</label>
                  <input
                    type="email"
                    value={buyerInfo.email}
                    onChange={e => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>주소</label>
                  <input
                    type="text"
                    value={buyerInfo.address}
                    onChange={e => setBuyerInfo({ ...buyerInfo, address: e.target.value })}
                    required
                  />
                </div>
                <div className="form-buttons">
                  <button type="button" onClick={() => setShowBuyerForm(false)}>취소</button>
                  <button type="submit">결제하기</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* 결제 모달 */}
        {showPaymentModal && selectedProduct && (
          <PaymentModal
            product={selectedProduct}
            adminWallet={adminWallet}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedProduct(null);
            }}
            onSuccess={handlePaymentSuccess}
            buyerInfo={buyerInfo}
            onBack={() => {
              setShowPaymentModal(false);
              setShowBuyerForm(true);
            }}
          />
        )}
        {paymentSuccess && (
          <div className="success-modal">
            <div className="success-modal-content">
              <div className="success-icon">✅</div>
              <h2>결제 완료!</h2>
              <p>결제가 성공적으로 완료되었습니다.</p>
              <p style={{ fontSize: '0.95rem', wordBreak: 'break-all' }}>
                <strong>트랜잭션:</strong><br />
                <a href={`https://solscan.io/tx/${txHash}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                  {txHash}
                </a>
              </p>
              <button className="success-close-btn" onClick={() => setPaymentSuccess(false)}>
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop; 