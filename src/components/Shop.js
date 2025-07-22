import React, { useState, useEffect } from 'react';
import { productService, walletService } from '../services/database';
import PaymentModal from './PaymentModal';
import { useAuth } from '../contexts/AuthContext';

const Shop = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adminWallet, setAdminWallet] = useState('');
  const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '', address: '' });
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  // 구매 버튼 클릭 시
  const handlePurchaseClick = (product) => {
    if (!currentUser) {
      alert('로그인 후 구매할 수 있습니다.');
      return;
    }
    setSelectedProduct(product);
    setBuyerInfo({ name: '', email: '', address: '' });
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
    alert('결제 성공! 트랜잭션: ' + txHash);
    setShowPaymentModal(false);
    setSelectedProduct(null);
  };

  return (
    <div className="shop">
      <div className="container">
        <h1 className="page-title">상품 목록</h1>
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
                  {product.price?.toLocaleString()} $Guardian
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
      </div>
    </div>
  );
};

export default Shop; 