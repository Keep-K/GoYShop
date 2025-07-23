import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { purchaseService } from '../services/database';

// 날짜 변환 유틸
const getDateString = (createdAt) => {
  if (!createdAt) return '-';
  if (createdAt.toDate) return createdAt.toDate().toLocaleString(); // Firestore Timestamp
  if (typeof createdAt === 'string') {
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString();
  }
  if (createdAt instanceof Date) return createdAt.toLocaleString();
  return '-';
};

const PurchaseHistory = () => {
  const { currentUser } = useAuth();
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    purchaseService.getPurchasesByUser(currentUser.uid).then(data => {
      setPurchases(data);
    });
  }, [currentUser]);

  return (
    <div style={{
      maxWidth: '700px',
      margin: '2rem auto',
      padding: '2rem',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      minHeight: '400px',
    }}>
      <h2 style={{
        fontSize: '2rem',
        fontWeight: 700,
        marginBottom: '2rem',
        textAlign: 'center',
        letterSpacing: '-1px',
        color: '#222'
      }}>구매 내역</h2>
      {purchases.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#888',
          fontSize: '1.1rem',
          marginTop: '4rem',
        }}>
          <span style={{fontSize: '2.5rem', display: 'block', marginBottom: '1rem'}}>🛒</span>
          구매 내역이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {purchases.map(p => (
            <div key={p.id} style={{
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '1.2rem 1.5rem',
              background: '#fafbfc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#333' }}>{p.productName}</span>
                {/* 상태 뱃지 + 아이콘: 상품명과 가격 사이 */}
                {p.status && (
                  <span style={{
                    padding: '0.18em 0.7em',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.97em',
                    margin: '0 0.7em',
                    background:
                      p.status === 'pending' ? '#fffbe6' :
                      p.status === 'processing' ? '#e3f0ff' :
                      p.status === 'shipped' ? '#eaf6ff' :
                      p.status === 'delivered' ? '#e8f8f5' :
                      p.status === 'cancelled' ? '#fff0f0' : '#f4f4f4',
                    color:
                      p.status === 'pending' ? '#f7b731' :
                      p.status === 'processing' ? '#3867d6' :
                      p.status === 'shipped' ? '#4b7bec' :
                      p.status === 'delivered' ? '#20bf6b' :
                      p.status === 'cancelled' ? '#eb3b5a' : '#888',
                    border:
                      p.status === 'pending' ? '1px solid #ffe58f' :
                      p.status === 'processing' ? '1px solid #a5c8ff' :
                      p.status === 'shipped' ? '1px solid #a5d8ff' :
                      p.status === 'delivered' ? '1px solid #b8e994' :
                      p.status === 'cancelled' ? '1px solid #ffb3b3' : '1px solid #eee',
                    display: 'inline-flex',
                    alignItems: 'center',
                    minWidth: '90px',
                    textAlign: 'center',
                    gap: '0.3em',
                  }}>
                    {/* 상태별 이모지 */}
                    {p.status === 'pending' && '⏳'}
                    {p.status === 'processing' && '🔄'}
                    {p.status === 'shipped' && '🚚'}
                    {p.status === 'delivered' && '✅'}
                    {p.status === 'cancelled' && '❌'}
                    {/* 상태명 */}
                    {p.status === 'pending' && '대기 중'}
                    {p.status === 'processing' && '처리 중'}
                    {p.status === 'shipped' && '배송 중'}
                    {p.status === 'delivered' && '배송 완료'}
                    {p.status === 'cancelled' && '취소됨'}
                    {/* 기타 상태는 그대로 노출 */}
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].indexOf(p.status) === -1 && p.status}
                  </span>
                )}
                <span style={{ color: '#4b7bec', fontWeight: 700, fontSize: '1.1rem' }}>{(p.price ?? p.totalPrice ?? 0).toLocaleString()} <span style={{fontWeight: 500, fontSize: '0.95rem'}}>Guardian</span></span>
              </div>
              <div style={{ fontSize: '0.98rem', color: '#666', marginTop: '0.2rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ marginRight: '1.2rem' }}>
                  <strong>구매일:</strong> {getDateString(p.createdAt)}
                </span>
                <span style={{ marginRight: '1.2rem' }}>
                  <strong>트랜잭션:</strong> {p.txHash ? (
                    <a href={`https://solscan.io/tx/${p.txHash}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ color: '#20bf6b', textDecoration: 'underline', wordBreak: 'break-all' }}>
                      {p.txHash.length > 16 ? `${p.txHash.slice(0, 8)}...${p.txHash.slice(-8)}` : p.txHash}
                    </a>
                  ) : '-'}
                </span>
                {/* 상태 뱃지 추가 */}
                {p.status && (
                  <span style={{
                    padding: '0.18em 0.7em',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.97em',
                    marginLeft: '0.5em',
                    background:
                      p.status === 'pending' ? '#fffbe6' :
                      p.status === 'processing' ? '#e3f0ff' :
                      p.status === 'shipped' ? '#eaf6ff' :
                      p.status === 'delivered' ? '#e8f8f5' :
                      p.status === 'cancelled' ? '#fff0f0' : '#f4f4f4',
                    color:
                      p.status === 'pending' ? '#f7b731' :
                      p.status === 'processing' ? '#3867d6' :
                      p.status === 'shipped' ? '#4b7bec' :
                      p.status === 'delivered' ? '#20bf6b' :
                      p.status === 'cancelled' ? '#eb3b5a' : '#888',
                    border:
                      p.status === 'pending' ? '1px solid #ffe58f' :
                      p.status === 'processing' ? '1px solid #a5c8ff' :
                      p.status === 'shipped' ? '1px solid #a5d8ff' :
                      p.status === 'delivered' ? '1px solid #b8e994' :
                      p.status === 'cancelled' ? '1px solid #ffb3b3' : '1px solid #eee',
                    display: 'inline-block',
                    minWidth: '70px',
                    textAlign: 'center',
                  }}>
                    {p.status === 'pending' && '대기 중'}
                    {p.status === 'processing' && '처리 중'}
                    {p.status === 'shipped' && '배송 중'}
                    {p.status === 'delivered' && '배송 완료'}
                    {p.status === 'cancelled' && '취소됨'}
                    {/* 기타 상태는 그대로 노출 */}
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].indexOf(p.status) === -1 && p.status}
                  </span>
                )}
              </div>
              {p.buyerInfo && (
                <div style={{ fontSize: '0.95rem', color: '#888', marginTop: '0.2rem' }}>
                  <strong>구매자:</strong> {p.buyerInfo.name || '-'} / {p.buyerInfo.email || '-'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory; 