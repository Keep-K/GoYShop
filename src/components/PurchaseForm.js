import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService, purchaseService } from '../services/database';

const PurchaseForm = ({ product, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    quantity: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  // 사용자 프로필 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser) {
        try {
          const profile = await userService.getUserProfile(currentUser.uid);
          setUserProfile(profile);
          
          // 프로필이 있으면 기본값으로 설정
          if (profile) {
            setFormData(prev => ({
              ...prev,
              name: profile.displayName || profile.name || currentUser.displayName || '',
              email: profile.email || currentUser.email || '',
              phone: profile.phone || '',
              address: profile.shippingInfo?.address || ''
            }));
          } else {
            // 프로필이 없으면 기본값 설정
            setFormData(prev => ({
              ...prev,
              name: currentUser.displayName || '',
              email: currentUser.email || ''
            }));
          }
        } catch (error) {
          console.error('사용자 프로필 로드 오류:', error);
        }
      }
    };

    loadUserProfile();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. 사용자 프로필 업데이트 (배송 정보 포함)
      const userData = {
        displayName: formData.name,
        email: formData.email,
        phone: formData.phone,
        shippingInfo: {
          address: formData.address,
          updatedAt: new Date()
        }
      };
      
      await userService.createOrUpdateUserProfile(currentUser.uid, userData);

      // 2. 구매 정보 저장
      const purchaseData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: parseInt(formData.quantity),
        totalPrice: product.price * parseInt(formData.quantity),
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        status: 'pending'
      };

      const result = await purchaseService.createPurchase(purchaseData);
      
      console.log('구매 완료! 문서 ID:', result.id);
      onSuccess(result.id);
    } catch (error) {
      console.error('구매 오류:', error);
      setError('구매 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = product.price * formData.quantity;

  return (
    <div className="purchase-modal">
      <div className="purchase-modal-content">
        <div className="purchase-modal-header">
          <h2>상품 구매</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="product-summary">
          <img src={product.image} alt={product.name} className="product-summary-image" />
          <div className="product-summary-info">
            <h3>{product.name}</h3>
            <p className="product-price">{product.price.toLocaleString('ko-KR')} $Guardian</p>
            <p>{product.description}</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">구매자 이름 *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="구매자 이름을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">이메일 *</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">전화번호 *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="전화번호를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">배송 주소 *</label>
            <textarea
              id="address"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
              placeholder="배송 주소를 입력하세요"
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity" className="form-label">수량</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              className="form-input"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              max="10"
              required
            />
          </div>

          <div className="total-price">
            <strong>총 결제 금액: {totalPrice.toLocaleString('ko-KR')} $Guardian</strong>
          </div>

          <div className="form-buttons">
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel-button"
              disabled={loading}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="purchase-button"
              disabled={loading}
            >
              {loading ? '처리 중...' : '구매하기'}
            </button>
          </div>
        </form>

        {userProfile && (
          <div className="profile-info">
            <p className="profile-note">
              💡 저장된 배송 정보가 자동으로 입력되었습니다. 
              필요시 수정하실 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseForm; 