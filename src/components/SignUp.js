import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
      console.error('회원가입 오류:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('이미 사용 중인 이메일입니다.');
          break;
        case 'auth/invalid-email':
          setError('유효하지 않은 이메일 형식입니다.');
          break;
        case 'auth/weak-password':
          setError('비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.');
          break;
        default:
          setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">회원가입</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">이메일</label>
          <input
            type="email"
            id="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">비밀번호</label>
          <input
            type="password"
            id="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요 (최소 6자)"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">비밀번호 확인</label>
          <input
            type="password"
            id="confirmPassword"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="비밀번호를 다시 입력하세요"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="form-button" 
          disabled={loading}
        >
          {loading ? '회원가입 중...' : '회원가입'}
        </button>
      </form>

      <div className="divider">
        <span>또는</span>
      </div>

      <button 
        onClick={handleGoogleSignIn}
        className="google-signin-btn"
        disabled={loading}
      >
        <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
        Google로 회원가입
      </button>
      
      <div className="link-text">
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </div>
    </div>
  );
};

export default SignUp; 