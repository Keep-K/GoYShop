import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { productService, purchaseService, analyticsService, walletService } from '../services/database';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [salesStats, setSalesStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletInput, setWalletInput] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMessage, setWalletMessage] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
      loadWalletAddress();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [productsData, purchasesData, statsData] = await Promise.all([
        productService.getProducts(),
        purchaseService.getAllPurchases(),
        analyticsService.getDailySalesStats()
      ]);
      
      setProducts(productsData);
      setPurchases(purchasesData);
      setSalesStats(statsData);
    } catch (error) {
      console.error('대시보드 데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletAddress = async () => {
    setWalletLoading(true);
    try {
      const address = await walletService.getWalletAddress();
      setWalletAddress(address);
      setWalletInput(address);
    } catch (e) {
      setWalletMessage('지갑 주소를 불러오지 못했습니다.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWalletSave = async () => {
    setWalletLoading(true);
    setWalletMessage('');
    try {
      await walletService.setWalletAddress(walletInput);
      setWalletAddress(walletInput);
      setWalletMessage('지갑 주소가 저장되었습니다.');
    } catch (e) {
      setWalletMessage('저장 실패: ' + e.message);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleStatusUpdate = async (purchaseId, newStatus) => {
    try {
      await purchaseService.updatePurchaseStatus(purchaseId, newStatus);
      // 구매 목록 새로고침
      const updatedPurchases = await purchaseService.getAllPurchases();
      setPurchases(updatedPurchases);
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
    }
  };

  const handleProductSubmit = async (productData) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productData);
      } else {
        await productService.createProduct(productData);
      }
      
      // 상품 목록 새로고침
      const updatedProducts = await productService.getProducts();
      setProducts(updatedProducts);
      
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('상품 저장 오류:', error);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      try {
        await productService.deleteProduct(productId);
        
        // 상품 목록 새로고침
        const updatedProducts = await productService.getProducts();
        setProducts(updatedProducts);
      } catch (error) {
        console.error('상품 삭제 오류:', error);
        alert('상품 삭제에 실패했습니다.');
      }
    }
  };

  // 테스트 상품 일괄 삭제 (임시 기능)
  const deleteAllTestProducts = async () => {
    if (window.confirm('모든 테스트 상품을 삭제하시겠습니까?')) {
      try {
        const testProducts = products.filter(product => 
          product.name === '테스트 상품' || 
          product.category === 'test'
        );
        
        for (const product of testProducts) {
          await productService.deleteProduct(product.id);
        }
        
        // 상품 목록 새로고침
        const updatedProducts = await productService.getProducts();
        setProducts(updatedProducts);
        
        alert(`${testProducts.length}개의 테스트 상품이 삭제되었습니다.`);
      } catch (error) {
        console.error('테스트 상품 일괄 삭제 오류:', error);
        alert('테스트 상품 삭제에 실패했습니다.');
      }
    }
  };

  if (adminLoading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading">관리자 권한 확인 중...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="access-denied">
            <h1>🚫 접근 권한이 없습니다</h1>
            <p>관리자 권한이 필요합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading">데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="page-title">관리자 대시보드</h1>
          <p>환영합니다, {currentUser?.email}님!</p>
        </div>

        {/* 지갑 주소 입력란 */}
        <div className="wallet-section">
          <h2>밈 코인 지갑 주소</h2>
          <div className="wallet-form">
            <input
              type="text"
              value={walletInput}
              onChange={e => setWalletInput(e.target.value)}
              placeholder="지갑 주소를 입력하세요"
              className="wallet-input"
              disabled={walletLoading}
            />
            <button
              onClick={handleWalletSave}
              className="wallet-save-btn"
              disabled={walletLoading || !walletInput}
            >
              {walletLoading ? '저장 중...' : '저장'}
            </button>
          </div>
          {walletAddress && (
            <div className="wallet-current">
              <span>현재 저장된 주소: </span>
              <span className="wallet-address">{walletAddress}</span>
            </div>
          )}
          {walletMessage && <div className="wallet-message">{walletMessage}</div>}
        </div>

        {/* 탭 네비게이션 */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            개요
          </button>
          <button 
            className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            상품 관리
          </button>
          <button 
            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            주문 관리
          </button>
        </div>

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>총 상품 수</h3>
                <p className="stat-number">{products.length}</p>
              </div>
              <div className="stat-card">
                <h3>총 주문 수</h3>
                <p className="stat-number">{purchases.length}</p>
              </div>
              <div className="stat-card">
                <h3>대기 중 주문</h3>
                <p className="stat-number">
                  {purchases.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <div className="stat-card">
                <h3>오늘 매출</h3>
                <p className="stat-number">
                  {salesStats?.todaySales?.toLocaleString() || 0} $Guardian
                </p>
              </div>
            </div>

            <div className="recent-orders">
              <h3>최근 주문</h3>
              <div className="orders-list">
                {purchases.slice(0, 5).map((purchase) => (
                  <div key={purchase.id} className="order-item">
                    <div className="order-info">
                      <p><strong>{purchase.customerName}</strong></p>
                      <p>{purchase.productName}</p>
                      <p>{purchase.totalPrice?.toLocaleString()} $Guardian</p>
                    </div>
                    <div className="order-status">
                      <span className={`status-badge ${purchase.status}`}>
                        {purchase.status === 'pending' ? '대기 중' : 
                         purchase.status === 'processing' ? '처리 중' :
                         purchase.status === 'shipped' ? '배송 중' :
                         purchase.status === 'delivered' ? '배송 완료' :
                         purchase.status === 'cancelled' ? '취소됨' : purchase.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 상품 관리 탭 */}
        {activeTab === 'products' && (
          <div className="products-management">
            <div className="section-header">
              <h3>상품 관리</h3>
              <div className="header-actions">
                <button 
                  onClick={deleteAllTestProducts}
                  className="delete-test-btn"
                >
                  테스트 상품 일괄 삭제
                </button>
                <button 
                  onClick={() => setShowProductForm(true)}
                  className="add-product-btn"
                >
                  + 새 상품 추가
                </button>
              </div>
            </div>

            <div className="products-list">
              {products.map((product) => (
                <div key={product.id} className="product-item">
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="placeholder-image">🛍️</div>
                    )}
                  </div>
                  <div className="product-details">
                    <h4>{product.name}</h4>
                    <p>{product.description}</p>
                    <p className="product-price">{product.price?.toLocaleString()} $Guardian</p>
                  </div>
                  <div className="product-actions">
                    <button 
                      onClick={() => handleEditProduct(product)}
                      className="edit-btn"
                    >
                      수정
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="delete-btn"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 주문 관리 탭 */}
        {activeTab === 'orders' && (
          <div className="orders-management">
            <h3>주문 관리</h3>
            <div className="orders-list">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="order-item">
                  <div className="order-info">
                    <p><strong>주문자:</strong> {purchase.customerName}</p>
                    <p><strong>상품:</strong> {purchase.productName}</p>
                    <p><strong>수량:</strong> {purchase.quantity}</p>
                    <p><strong>총액:</strong> {purchase.totalPrice?.toLocaleString()} $Guardian</p>
                    <p><strong>주문일:</strong> {purchase.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                  </div>
                  <div className="order-actions">
                    <select 
                      value={purchase.status} 
                      onChange={(e) => handleStatusUpdate(purchase.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">대기 중</option>
                      <option value="processing">처리 중</option>
                      <option value="shipped">배송 중</option>
                      <option value="delivered">배송 완료</option>
                      <option value="cancelled">취소됨</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상품 추가/수정 폼 */}
        {showProductForm && (
          <ProductForm
            product={editingProduct}
            onSubmit={handleProductSubmit}
            onCancel={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// 상품 추가/수정 폼 컴포넌트
const ProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    imageUrl: product?.imageUrl || '',
    category: product?.category || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseInt(formData.price)
    });
  };

  return (
    <div className="product-form-modal">
      <div className="product-form-content">
        <div className="form-header">
          <h3>{product ? '상품 수정' : '새 상품 추가'}</h3>
          <button onClick={onCancel} className="close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">상품명 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">상품 설명</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">가격 *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">이미지 URL</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">카테고리</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-buttons">
            <button type="button" onClick={onCancel} className="cancel-btn">
              취소
            </button>
            <button type="submit" className="submit-btn">
              {product ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard; 