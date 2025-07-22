import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home">
      <div className="container">
        <div className="hero-section">
          <h1 className="hero-title">GoY Shop에 오신 것을 환영합니다!</h1>
          <p className="hero-subtitle">
            최고의 상품들을 만나보세요
          </p>
          
          {currentUser ? (
            <div className="welcome-message">
              <p>안녕하세요, <strong>{currentUser.email}</strong>님!</p>
              <div className="action-buttons">
                <a href="/shop" className="btn btn-primary">쇼핑하기</a>
                <a href="/purchase-history" className="btn btn-secondary">구매내역</a>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <a href="/login" className="btn btn-primary">로그인</a>
              <a href="/register" className="btn btn-secondary">회원가입</a>
            </div>
          )}
        </div>

        <div className="features-section">
          <h2>서비스 특징</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🛒 다양한 상품</h3>
              <p>다양한 카테고리의 상품들을 만나보세요</p>
            </div>
            <div className="feature-card">
              <h3>🚚 빠른 배송</h3>
              <p>신속하고 안전한 배송 서비스</p>
            </div>
            <div className="feature-card">
              <h3>💳 안전한 결제</h3>
              <p>안전하고 편리한 결제 시스템</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 