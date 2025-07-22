import React, { useState, useEffect } from 'react';
import { cacheService } from '../services/database';

const PerformanceMonitor = () => {
  const [cacheStatus, setCacheStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 개발 환경에서만 성능 모니터 표시
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }
  }, []);

  const updateCacheStatus = () => {
    const status = cacheService.getCacheStatus();
    setCacheStatus(status);
  };

  const clearAllCache = () => {
    cacheService.clearCache();
    updateCacheStatus();
  };

  useEffect(() => {
    updateCacheStatus();
    
    // 5초마다 캐시 상태 업데이트
    const interval = setInterval(updateCacheStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h4>성능 모니터 (개발용)</h4>
        <button onClick={() => setIsVisible(false)} className="close-btn">×</button>
      </div>
      
      <div className="monitor-content">
        <div className="cache-info">
          <h5>캐시 상태</h5>
          {cacheStatus && (
            <div className="cache-stats">
              <p><strong>캐시 항목:</strong> {cacheStatus.totalEntries}</p>
              <p><strong>메모리 사용량:</strong> {(cacheStatus.memoryUsage / 1024).toFixed(2)} KB</p>
              <button onClick={clearAllCache} className="clear-cache-btn">
                캐시 초기화
              </button>
            </div>
          )}
        </div>
        
        <div className="performance-tips">
          <h5>성능 팁</h5>
          <ul>
            <li>캐시된 데이터는 5분간 유지됩니다</li>
            <li>Firestore 오프라인 지속성이 활성화되어 있습니다</li>
            <li>네트워크 상태를 확인하세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor; 