import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

const Navbar = () => {
  const location = useLocation();
  const { currentUser, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-brand-link">
            GoY Shop
          </Link>
        </div>
        
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className={isActive('/')}>
              Main
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/shop" className={isActive('/shop')}>
              Shop
            </Link>
          </li>
          
          {currentUser ? (
            <>
              <li className="nav-item">
                <Link to="/purchases" className={isActive('/purchases')}>
                  구매내역
                </Link>
              </li>
              {isAdmin && (
                <li className="nav-item">
                  <Link to="/admin" className={isActive('/admin')}>
                    관리자
                  </Link>
                </li>
              )}
              <li className="nav-item">
                <span className="user-info">
                  안녕하세요, {currentUser.displayName || currentUser.email}님!
                </span>
              </li>
              <li className="nav-item">
                <button onClick={handleSignOut} className="nav-link logout-btn">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className={isActive('/login')}>
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className={isActive('/register')}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 