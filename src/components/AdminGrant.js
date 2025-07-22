import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { adminService } from '../services/adminService';
import { userService } from '../services/database';

const AdminGrant = () => {
  const { currentUser } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [step, setStep] = useState('ready');

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage('이메일을 입력해주세요.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setStep('creating');

    try {
      if (currentUser && email === currentUser.email) {
        setMessage('사용자 프로필을 확인하고 생성 중...');
        const existingProfile = await userService.getUserProfile(currentUser.uid);
        if (!existingProfile) {
          await userService.createOrUpdateUserProfile(currentUser.uid, {
            displayName: currentUser.displayName || '',
            email: currentUser.email,
            createdAt: new Date()
          });
          setMessage('사용자 프로필이 생성되었습니다. 관리자 권한을 부여하는 중...');
          setStep('granting');
        } else {
          setMessage('기존 프로필을 찾았습니다. 관리자 권한을 부여하는 중...');
          setStep('granting');
        }
      } else {
        setMessage('관리자 권한을 부여하는 중...');
        setStep('granting');
      }

      await adminService.grantAdminRole(email);
      setMessage(`${email}에게 관리자 권한이 부여되었습니다! 🎉`);
      setMessageType('success');
      setStep('success');
      setEmail('');
      setTimeout(() => {
        setMessage('');
        setStep('ready');
      }, 3000);
    } catch (error) {
      console.error('관리자 권한 부여 오류:', error);
      setMessage(error.message || '관리자 권한 부여에 실패했습니다.');
      setMessageType('error');
      setStep('ready');
    } finally {
      setLoading(false);
    }
  };

  const createProfileForCurrentUser = async () => {
    if (!currentUser) {
      setMessage('로그인이 필요합니다.');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage('사용자 프로필을 생성하는 중...');
    setStep('creating');

    try {
      await userService.createOrUpdateUserProfile(currentUser.uid, {
        displayName: currentUser.displayName || '',
        email: currentUser.email,
        createdAt: new Date()
      });
      setMessage('사용자 프로필이 생성되었습니다! 이제 관리자 권한을 부여할 수 있습니다.');
      setMessageType('success');
      setStep('ready');
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('프로필 생성 오류:', error);
      setMessage('프로필 생성에 실패했습니다.');
      setMessageType('error');
      setStep('ready');
    } finally {
      setLoading(false);
    }
  };

  const getLoadingText = () => {
    switch (step) {
      case 'creating': return '프로필 생성 중...';
      case 'granting': return '권한 부여 중...';
      default: return '처리 중...';
    }
  };

  // 관리자 권한 확인 중
  if (adminLoading) {
    return (
      <div className="admin-grant">
        <div className="container">
          <div className="loading">관리자 권한 확인 중...</div>
        </div>
      </div>
    );
  }

  // 관리자 권한이 없는 경우
  if (!isAdmin) {
    return (
      <div className="admin-grant">
        <div className="container">
          <div className="access-denied">
            <h1>🚫 접근 권한이 없습니다</h1>
            <p>관리자 권한이 필요합니다.</p>
            <p>관리자 권한을 받으려면 시스템 관리자에게 문의하세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-grant">
      <div className="container">
        <h1 className="page-title">관리자 권한 부여</h1>
        
        {/* 관리자 권한 확인 메시지 */}
        <div className="admin-access-confirmed">
          <div className="alert alert-success">
            <h3>✅ 관리자 권한 확인됨</h3>
            <p>관리자 권한을 가진 사용자만 다른 사용자에게 권한을 부여할 수 있습니다.</p>
          </div>
        </div>

        {/* 현재 사용자 정보 */}
        {currentUser && (
          <div className="current-user-info">
            <h3>현재 로그인된 사용자:</h3>
            <p>{currentUser.email}</p>
            <button
              onClick={createProfileForCurrentUser}
              className="create-profile-btn"
              disabled={loading}
            >
              {loading && step === 'creating' ? '프로필 생성 중...' : '내 프로필 생성하기'}
            </button>
          </div>
        )}

        {/* 관리자 권한 부여 폼 */}
        <div className="admin-grant-form">
          <h3>관리자로 지정할 사용자 이메일</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소를 입력하세요"
              className="form-input"
              disabled={loading}
            />
            <button
              type="submit"
              className="form-button"
              disabled={loading}
            >
              {loading ? getLoadingText() : '관리자 권한 부여'}
            </button>
          </form>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {/* 사용 방법 안내 */}
        <div className="usage-guide">
          <h3>사용 방법:</h3>
          <ol>
            <li>관리자로 지정할 사용자가 먼저 회원가입을 완료해야 합니다.</li>
            <li>위에 해당 사용자의 이메일 주소를 입력하세요.</li>
            <li>"관리자 권한 부여" 버튼을 클릭하세요.</li>
          </ol>
          
          <div className="warning">
            <strong>⚠️ 주의사항:</strong>
            <ul>
              <li>관리자 권한은 신중하게 부여해야 합니다.</li>
              <li>관리자는 모든 주문 정보와 사용자 데이터에 접근할 수 있습니다.</li>
              <li>권한을 잘못 부여한 경우 즉시 해제하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGrant; 