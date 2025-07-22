import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { purchaseService } from '../services/database';

const PurchaseHistory = () => {
  const { currentUser } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPurchases = async () => {
      if (!currentUser) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      try {
        const userPurchases = await purchaseService.getUserPurchases(currentUser.uid);
        setPurchases(userPurchases);
      } catch (error) {
        console.error('구매 내역 로드 오류:', error);
        setError('구매 내역을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, [currentUser]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '날짜 없음';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: '결제 대기', class: 'status-pending' },
      completed: { text: '구매 완료', class: 'status-completed' },
      cancelled: { text: '취소됨', class: 'status-cancelled' },
      shipped: { text: '배송 중', class: 'status-shipped' }
    };

    const config = statusConfig[status] || { text: status, class: 'status-unknown' };
    
    return (
      <span className={`status-badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="purchase-history">
        <div className="container">
          <h1 className="page-title">구매 내역</h1>
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="purchase-history">
        <div className="container">
          <h1 className="page-title">구매 내역</h1>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="purchase-history">
      <div className="container">
        <h1 className="page-title">구매 내역</h1>
        
        {purchases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>구매 내역이 없습니다</h3>
            <p>첫 번째 상품을 구매해보세요!</p>
          </div>
        ) : (
          <div className="purchases-list">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="purchase-card">
                <div className="purchase-header">
                  <div className="purchase-info">
                    <h3 className="purchase-title">{purchase.productName}</h3>
                    <p className="purchase-date">구매일: {formatDate(purchase.createdAt)}</p>
                    <p className="purchase-id">주문번호: {purchase.id}</p>
                  </div>
                  <div className="purchase-status">
                    {getStatusBadge(purchase.status)}
                  </div>
                </div>
                
                <div className="purchase-details">
                  <div className="detail-row">
                    <span className="detail-label">수량:</span>
                    <span className="detail-value">{purchase.quantity}개</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">단가:</span>
                    <span className="detail-value">{purchase.productPrice.toLocaleString('ko-KR')} $Guardian</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">총 금액:</span>
                    <span className="detail-value total-price">{purchase.totalPrice.toLocaleString('ko-KR')} $Guardian</span>
                  </div>
                </div>
                
                <div className="purchase-shipping">
                  <h4>배송 정보</h4>
                  <div className="shipping-info">
                    <p><strong>받는 사람:</strong> {purchase.customerName}</p>
                    <p><strong>연락처:</strong> {purchase.customerPhone}</p>
                    <p><strong>배송지:</strong> {purchase.customerAddress}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseHistory; 