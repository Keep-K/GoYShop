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
  const [salesPeriod, setSalesPeriod] = useState('daily'); // 'daily', 'monthly', 'yearly'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 매출 집계 함수들
  const getDailySales = () => {
    const salesByDate = {};
    purchases.forEach(p => {
      if (p.createdAt) {
        let date = null;
        if (p.createdAt.toDate) date = p.createdAt.toDate();
        else if (typeof p.createdAt === 'string') date = new Date(p.createdAt);
        else if (p.createdAt instanceof Date) date = p.createdAt;
        
        if (date && !isNaN(date.getTime())) {
          const dateKey = date.toDateString();
          const price = p.price ?? p.totalPrice ?? 0;
          salesByDate[dateKey] = (salesByDate[dateKey] || 0) + price;
        }
      }
    });
    
    return Object.entries(salesByDate)
      .map(([date, total]) => ({ date, total, count: purchases.filter(p => {
        let pDate = null;
        if (p.createdAt?.toDate) pDate = p.createdAt.toDate();
        else if (typeof p.createdAt === 'string') pDate = new Date(p.createdAt);
        else if (p.createdAt instanceof Date) pDate = p.createdAt;
        return pDate && pDate.toDateString() === date;
      }).length }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30); // 최근 30일
  };

  const getMonthlySales = () => {
    const salesByMonth = {};
    purchases.forEach(p => {
      if (p.createdAt) {
        let date = null;
        if (p.createdAt.toDate) date = p.createdAt.toDate();
        else if (typeof p.createdAt === 'string') date = new Date(p.createdAt);
        else if (p.createdAt instanceof Date) date = p.createdAt;
        
        if (date && !isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const price = p.price ?? p.totalPrice ?? 0;
          salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + price;
        }
      }
    });
    
    return Object.entries(salesByMonth)
      .map(([month, total]) => ({ 
        month, 
        total, 
        count: purchases.filter(p => {
          let pDate = null;
          if (p.createdAt?.toDate) pDate = p.createdAt.toDate();
          else if (typeof p.createdAt === 'string') pDate = new Date(p.createdAt);
          else if (p.createdAt instanceof Date) pDate = p.createdAt;
          if (!pDate) return false;
          const pMonthKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
          return pMonthKey === month;
        }).length
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12); // 최근 12개월
  };

  const getYearlySales = () => {
    const salesByYear = {};
    purchases.forEach(p => {
      if (p.createdAt) {
        let date = null;
        if (p.createdAt.toDate) date = p.createdAt.toDate();
        else if (typeof p.createdAt === 'string') date = new Date(p.createdAt);
        else if (p.createdAt instanceof Date) date = p.createdAt;
        
        if (date && !isNaN(date.getTime())) {
          const year = date.getFullYear();
          const price = p.price ?? p.totalPrice ?? 0;
          salesByYear[year] = (salesByYear[year] || 0) + price;
        }
      }
    });
    
    return Object.entries(salesByYear)
      .map(([year, total]) => ({ 
        year: parseInt(year), 
        total, 
        count: purchases.filter(p => {
          let pDate = null;
          if (p.createdAt?.toDate) pDate = p.createdAt.toDate();
          else if (typeof p.createdAt === 'string') pDate = new Date(p.createdAt);
          else if (p.createdAt instanceof Date) pDate = p.createdAt;
          return pDate && pDate.getFullYear() === parseInt(year);
        }).length
      }))
      .sort((a, b) => b.year - a.year);
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
      loadWalletAddress();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [productsData, purchasesData] = await Promise.all([
        productService.getProducts(),
        purchaseService.getAllPurchases(),
        // analyticsService.getDailySalesStats() // 임시 비활성화 - 인덱스 에러 방지
      ]);
      
      setProducts(productsData);
      setPurchases(purchasesData);
      // setSalesStats(statsData); // 임시 비활성화
      setSalesStats(null); // 기본값으로 설정
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
          <button 
            className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            매출 내역
          </button>
        </div>

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.5rem',
              marginBottom: '2.5rem',
              maxWidth: '900px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              <div className="stat-card" style={{
                background: '#f7fafc',
                borderRadius: '14px',
                padding: '1.5rem 1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #e3e8ee',
              }}>
                <div className="stat-icon" style={{fontSize: '2.2rem', marginBottom: '0.5rem'}}>💰</div>
                <div className="stat-label" style={{color: '#888', fontWeight: 500, fontSize: '1rem'}}>오늘 매출</div>
                <div className="stat-value" style={{fontWeight: 700, fontSize: '1.4rem', color: '#222', marginTop: '0.2rem'}}>
                  {(() => {
                    // 오늘 날짜와 동일한 구매들의 price/totalPrice 합계 (더 안전한 방식)
                    const today = new Date();
                    const todayDateString = today.toDateString(); // "Mon Dec 25 2023" 형태
                    let sum = 0;
                    
                    purchases.forEach(p => {
                      let createdAt = p.createdAt;
                      if (createdAt) {
                        let purchaseDate = null;
                        
                        // createdAt 타입별 처리
                        if (createdAt.toDate) {
                          // Firestore Timestamp
                          purchaseDate = createdAt.toDate();
                        } else if (typeof createdAt === 'string') {
                          // ISO string
                          purchaseDate = new Date(createdAt);
                        } else if (createdAt instanceof Date) {
                          // Date 객체
                          purchaseDate = createdAt;
                        }
                        
                        // 날짜 비교 (년-월-일만 비교)
                        if (purchaseDate && !isNaN(purchaseDate.getTime())) {
                          const purchaseDateString = purchaseDate.toDateString();
                          if (purchaseDateString === todayDateString) {
                            // price 또는 totalPrice 합계
                            const price = p.price ?? p.totalPrice ?? 0;
                            sum += (typeof price === 'number' ? price : 0);
                          }
                        }
                      }
                    });
                    
                    return (sum || 0).toLocaleString();
                  })()} <span className="stat-unit" style={{fontWeight: 500, fontSize: '1rem', color: '#4b7bec'}}>$Guardian</span>
                </div>
              </div>
              <div className="stat-card" style={{
                background: '#f7fafc',
                borderRadius: '14px',
                padding: '1.5rem 1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #e3e8ee',
              }}>
                <div className="stat-icon" style={{fontSize: '2.2rem', marginBottom: '0.5rem'}}>🛒</div>
                <div className="stat-label" style={{color: '#888', fontWeight: 500, fontSize: '1rem'}}>총 주문</div>
                <div className="stat-value" style={{fontWeight: 700, fontSize: '1.4rem', color: '#222', marginTop: '0.2rem'}}>{purchases.length}</div>
              </div>
              <div className="stat-card" style={{
                background: '#f7fafc',
                borderRadius: '14px',
                padding: '1.5rem 1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #e3e8ee',
              }}>
                <div className="stat-icon" style={{fontSize: '2.2rem', marginBottom: '0.5rem'}}>⏳</div>
                <div className="stat-label" style={{color: '#888', fontWeight: 500, fontSize: '1rem'}}>대기 주문</div>
                <div className="stat-value" style={{fontWeight: 700, fontSize: '1.4rem', color: '#222', marginTop: '0.2rem'}}>{purchases.filter(p => p.status === 'pending').length}</div>
              </div>
              <div className="stat-card" style={{
                background: '#f7fafc',
                borderRadius: '14px',
                padding: '1.5rem 1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #e3e8ee',
              }}>
                <div className="stat-icon" style={{fontSize: '2.2rem', marginBottom: '0.5rem'}}>📦</div>
                <div className="stat-label" style={{color: '#888', fontWeight: 500, fontSize: '1rem'}}>총 상품</div>
                <div className="stat-value" style={{fontWeight: 700, fontSize: '1.4rem', color: '#222', marginTop: '0.2rem'}}>{products.length}</div>
              </div>
            </div>

            <div className="recent-orders" style={{marginTop: '2.5rem'}}>
              <h3 style={{fontSize: '1.3rem', fontWeight: 600, marginBottom: '1.2rem', color: '#222'}}>최근 주문</h3>
              {purchases.length === 0 ? (
                <div className="empty-orders" style={{textAlign: 'center', color: '#aaa', fontSize: '1.1rem', padding: '2.5rem 0'}}>
                  <span style={{fontSize: '2rem', display: 'block', marginBottom: '0.7rem'}}>🛒</span>
                  최근 주문이 없습니다.
                </div>
              ) : (
                <div className="orders-list" style={{display: 'flex', flexDirection: 'column', gap: '1.1rem'}}>
                  {purchases.slice(0, 5).map((purchase) => (
                    <div key={purchase.id} className="order-card" style={{
                      background: '#fff',
                      border: '1px solid #e3e8ee',
                      borderRadius: '12px',
                      padding: '1.1rem 1.3rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem',
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                        <span className="order-product" style={{fontWeight: 600, fontSize: '1.08rem', color: '#333'}}>{purchase.productName}</span>
                        <span className="order-amount" style={{color: '#4b7bec', fontWeight: 700, fontSize: '1.08rem'}}>{(purchase.totalPrice || purchase.price)?.toLocaleString()} <span style={{fontWeight: 500, fontSize: '0.95rem'}}> $Guardian</span></span>
                      </div>
                      <div style={{fontSize: '0.97rem', color: '#666', marginTop: '0.1rem', display: 'flex', gap: '1.2rem', flexWrap: 'wrap'}}>
                        <span className="order-customer"><strong>구매자:</strong> {purchase.customerName || purchase.buyerInfo?.name || '-'}</span>
                        <span className={`order-status ${purchase.status}`} style={{fontWeight: 500, color: purchase.status === 'pending' ? '#f7b731' : purchase.status === 'delivered' ? '#20bf6b' : purchase.status === 'cancelled' ? '#eb3b5a' : '#778ca3'}}>
                          {purchase.status === 'pending' ? '대기 중' : 
                           purchase.status === 'processing' ? '처리 중' :
                           purchase.status === 'shipped' ? '배송 중' :
                           purchase.status === 'delivered' ? '배송 완료' :
                           purchase.status === 'cancelled' ? '취소됨' : purchase.status}
                        </span>
                        <span className="order-date"><strong>주문일:</strong> {purchase.createdAt ? (purchase.createdAt.toDate ? purchase.createdAt.toDate().toLocaleString() : new Date(purchase.createdAt).toLocaleString()) : '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    <p><strong>주문자:</strong> {purchase.customerName || purchase.buyerInfo?.name || '-'}</p>
                    <p><strong>상품명:</strong> {purchase.productName || '-'}</p>
                    <p><strong>주소지:</strong> {purchase.buyerInfo?.address || purchase.shippingAddress || '-'}</p>
                    <p><strong>수량:</strong> {purchase.buyerInfo?.quantity ?? purchase.quantity ?? '-'}</p>
                    <p><strong>총액:</strong> {purchase.totalPrice?.toLocaleString() || purchase.price?.toLocaleString() || 0} $Guardian</p>
                    <p><strong>주문일:</strong> {purchase.createdAt?.toDate?.()?.toLocaleDateString() || (typeof purchase.createdAt === 'string' ? new Date(purchase.createdAt).toLocaleDateString() : '-')}</p>
                    <p><strong>트랜잭션:</strong> {purchase.txHash ? (
                      <a href={`https://solscan.io/tx/${purchase.txHash}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ color: '#20bf6b', textDecoration: 'underline', wordBreak: 'break-all' }}>
                        {purchase.txHash.length > 16 ? `${purchase.txHash.slice(0, 8)}...${purchase.txHash.slice(-8)}` : purchase.txHash}
                      </a>
                    ) : '-'}</p>
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

        {/* 매출 내역 탭 */}
        {activeTab === 'sales' && (
          <div className="sales-management" style={{maxWidth: '1000px', margin: '0 auto'}}>
            <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
              <h3 style={{fontSize: '1.5rem', fontWeight: 600, color: '#222'}}>매출 내역</h3>
              <div className="period-selector" style={{display: 'flex', gap: '0.5rem'}}>
                <button 
                  onClick={() => setSalesPeriod('daily')}
                  className={salesPeriod === 'daily' ? 'active' : ''}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: salesPeriod === 'daily' ? '#4b7bec' : '#fff',
                    color: salesPeriod === 'daily' ? '#fff' : '#666',
                    cursor: 'pointer'
                  }}
                >
                  일별
                </button>
                <button 
                  onClick={() => setSalesPeriod('monthly')}
                  className={salesPeriod === 'monthly' ? 'active' : ''}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: salesPeriod === 'monthly' ? '#4b7bec' : '#fff',
                    color: salesPeriod === 'monthly' ? '#fff' : '#666',
                    cursor: 'pointer'
                  }}
                >
                  월별
                </button>
                <button 
                  onClick={() => setSalesPeriod('yearly')}
                  className={salesPeriod === 'yearly' ? 'active' : ''}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: salesPeriod === 'yearly' ? '#4b7bec' : '#fff',
                    color: salesPeriod === 'yearly' ? '#fff' : '#666',
                    cursor: 'pointer'
                  }}
                >
                  연도별
                </button>
              </div>
            </div>

            {/* 일별 매출 */}
            {salesPeriod === 'daily' && (
              <div className="daily-sales">
                <h4 style={{marginBottom: '1.5rem', color: '#444'}}>최근 30일 매출</h4>
                <div className="sales-list" style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                  {getDailySales().map((item, index) => (
                    <div key={index} className="sales-item" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.5rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div>
                        <span style={{fontWeight: 600, fontSize: '1rem'}}>{new Date(item.date).toLocaleDateString()}</span>
                        <span style={{color: '#666', marginLeft: '1rem', fontSize: '0.9rem'}}>주문 {item.count}건</span>
                      </div>
                      <span style={{fontWeight: 700, color: '#4b7bec', fontSize: '1.1rem'}}>{item.total.toLocaleString()} $Guardian</span>
                    </div>
                  ))}
                  {getDailySales().length === 0 && (
                    <div style={{textAlign: 'center', color: '#999', padding: '2rem'}}>매출 데이터가 없습니다.</div>
                  )}
                </div>
              </div>
            )}

            {/* 월별 매출 */}
            {salesPeriod === 'monthly' && (
              <div className="monthly-sales">
                <h4 style={{marginBottom: '1.5rem', color: '#444'}}>최근 12개월 매출</h4>
                <div className="sales-list" style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                  {getMonthlySales().map((item, index) => (
                    <div key={index} className="sales-item" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.5rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div>
                        <span style={{fontWeight: 600, fontSize: '1rem'}}>{item.month}</span>
                        <span style={{color: '#666', marginLeft: '1rem', fontSize: '0.9rem'}}>주문 {item.count}건</span>
                      </div>
                      <span style={{fontWeight: 700, color: '#4b7bec', fontSize: '1.1rem'}}>{item.total.toLocaleString()} $Guardian</span>
                    </div>
                  ))}
                  {getMonthlySales().length === 0 && (
                    <div style={{textAlign: 'center', color: '#999', padding: '2rem'}}>매출 데이터가 없습니다.</div>
                  )}
                </div>
              </div>
            )}

            {/* 연도별 매출 */}
            {salesPeriod === 'yearly' && (
              <div className="yearly-sales">
                <h4 style={{marginBottom: '1.5rem', color: '#444'}}>연도별 매출</h4>
                <div className="sales-list" style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                  {getYearlySales().map((item, index) => (
                    <div key={index} className="sales-item" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.5rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div>
                        <span style={{fontWeight: 600, fontSize: '1rem'}}>{item.year}년</span>
                        <span style={{color: '#666', marginLeft: '1rem', fontSize: '0.9rem'}}>주문 {item.count}건</span>
                      </div>
                      <span style={{fontWeight: 700, color: '#4b7bec', fontSize: '1.1rem'}}>{item.total.toLocaleString()} $Guardian</span>
                    </div>
                  ))}
                  {getYearlySales().length === 0 && (
                    <div style={{textAlign: 'center', color: '#999', padding: '2rem'}}>매출 데이터가 없습니다.</div>
                  )}
                </div>
              </div>
            )}
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