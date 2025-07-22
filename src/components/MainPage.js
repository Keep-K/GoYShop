import React from 'react';

const MainPage = () => {
  return (
    <div className="main-page">
      <div className="container">
        <div className="hero-section">
          <h1 className="hero-title">Guardian of Yangtze</h1>
          <p className="hero-subtitle">가디언 오브 양쯔 메인 페이지</p>
          <div className="hero-content">
            <p>이곳은 테스팅용 메인 페이지입니다.</p>
            <p>위의 네비게이션 바를 통해 다른 페이지로 이동할 수 있습니다.</p>
          </div>
        </div>
        
        <div className="features-section">
          <h2>주요 기능</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>쇼핑</h3>
              <p>다양한 상품을 구매할 수 있습니다.</p>
            </div>
            <div className="feature-card">
              <h3>로그인</h3>
              <p>계정으로 로그인하여 서비스를 이용하세요.</p>
            </div>
            <div className="feature-card">
              <h3>회원가입</h3>
              <p>새로운 계정을 만들어보세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage; 