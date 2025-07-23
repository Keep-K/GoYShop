import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// 캐시 시스템
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// 사용자 프로필 관리
export const userService = {
  // 사용자 프로필 생성/업데이트
  async createOrUpdateUserProfile(userId, userData) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // 캐시 업데이트
      setCachedData(`user_${userId}`, { ...userData, updatedAt: new Date() });
      
      return { success: true };
    } catch (error) {
      console.error('사용자 프로필 저장 오류:', error);
      throw error;
    }
  },

  // 사용자 프로필 조회 (캐시 적용)
  async getUserProfile(userId) {
    try {
      // 캐시 확인
      const cached = getCachedData(`user_${userId}`);
      if (cached) {
        console.log('캐시된 사용자 프로필 사용');
        return cached;
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        // 캐시 저장
        setCachedData(`user_${userId}`, data);
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('사용자 프로필 조회 오류:', error);
      throw error;
    }
  },

  // 사용자 배송 정보 업데이트
  async updateShippingInfo(userId, shippingInfo) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        shippingInfo: {
          ...shippingInfo,
          updatedAt: serverTimestamp()
        }
      });
      
      // 캐시 무효화
      cache.delete(`user_${userId}`);
      
      return { success: true };
    } catch (error) {
      console.error('배송 정보 업데이트 오류:', error);
      throw error;
    }
  }
};

// 상품 관리
export const productService = {
  // 상품 목록 조회 (캐시 적용)
  async getProducts() {
    try {
      // 캐시 확인
      const cached = getCachedData('products');
      if (cached) {
        console.log('캐시된 상품 목록 사용');
        return cached;
      }

      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 캐시 저장
      setCachedData('products', products);
      
      return products;
    } catch (error) {
      console.error('상품 목록 조회 오류:', error);
      throw error;
    }
  },

  // 상품 생성
  async createProduct(productData) {
    try {
      const productsRef = collection(db, 'products');
      const docRef = await addDoc(productsRef, {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 캐시 무효화
      cache.delete('products');
      
      return { id: docRef.id, success: true };
    } catch (error) {
      console.error('상품 생성 오류:', error);
      throw error;
    }
  },

  // 상품 업데이트
  async updateProduct(productId, productData) {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        ...productData,
        updatedAt: serverTimestamp()
      });
      
      // 캐시 무효화
      cache.delete('products');
      
      return { success: true };
    } catch (error) {
      console.error('상품 업데이트 오류:', error);
      throw error;
    }
  },

  // 상품 삭제
  async deleteProduct(productId) {
    try {
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
      
      // 캐시 무효화
      cache.delete('products');
      
      return { success: true };
    } catch (error) {
      console.error('상품 삭제 오류:', error);
      throw error;
    }
  }
};

// 구매 관리
export const purchaseService = {
  // 구매 정보 저장 (개선된 버전)
  async createPurchase(purchaseData) {
    try {
      const purchasesRef = collection(db, 'purchases');
      const docRef = await addDoc(purchasesRef, {
        ...purchaseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 캐시 무효화
      cache.delete('purchases');
      cache.delete(`user_purchases_${purchaseData.userId}`);
      
      return { id: docRef.id, success: true };
    } catch (error) {
      console.error('구매 정보 저장 오류:', error);
      throw error;
    }
  },

  // 사용자별 구매 내역 조회 (캐시 적용)
  async getUserPurchases(userId) {
    try {
      // 캐시 확인
      const cached = getCachedData(`user_purchases_${userId}`);
      if (cached) {
        console.log('캐시된 구매 내역 사용');
        return cached;
      }

      const purchasesRef = collection(db, 'purchases');
      const q = query(
        purchasesRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const purchases = [];
      querySnapshot.forEach((doc) => {
        purchases.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 캐시 저장
      setCachedData(`user_purchases_${userId}`, purchases);
      
      return purchases;
    } catch (error) {
      console.error('구매 내역 조회 오류:', error);
      throw error;
    }
  },

  // 모든 구매 내역 조회 (관리자용, 캐시 적용)
  async getAllPurchases() {
    try {
      // 캐시 확인
      const cached = getCachedData('purchases');
      if (cached) {
        console.log('캐시된 전체 구매 내역 사용');
        return cached;
      }

      const purchasesRef = collection(db, 'purchases');
      const q = query(purchasesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const purchases = [];
      querySnapshot.forEach((doc) => {
        purchases.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 캐시 저장
      setCachedData('purchases', purchases);
      
      return purchases;
    } catch (error) {
      console.error('전체 구매 내역 조회 오류:', error);
      throw error;
    }
  },

  // 구매 상태 업데이트
  async updatePurchaseStatus(purchaseId, status) {
    try {
      const purchaseRef = doc(db, 'purchases', purchaseId);
      await updateDoc(purchaseRef, {
        status: status,
        updatedAt: serverTimestamp()
      });
      
      // 캐시 무효화
      cache.delete('purchases');
      
      return { success: true };
    } catch (error) {
      console.error('구매 상태 업데이트 오류:', error);
      throw error;
    }
  },

  async getPurchasesByUser(userId) {
    const q = query(
      collection(db, 'purchases'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

// 통계 및 분석
export const analyticsService = {
  // 일별 판매 통계 (캐시 적용)
  async getDailySalesStats() {
    try {
      const today = new Date().toDateString();
      const cacheKey = `daily_stats_${today}`;
      
      // 캐시 확인
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('캐시된 일별 통계 사용');
        return cached;
      }

      const purchasesRef = collection(db, 'purchases');
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      const q = query(
        purchasesRef,
        where('createdAt', '>=', todayDate),
        where('status', '==', 'completed')
      );
      const querySnapshot = await getDocs(q);
      
      let totalSales = 0;
      let totalOrders = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalSales += data.totalPrice || 0;
        totalOrders += 1;
      });
      
      const stats = {
        totalSales,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
      };
      
      // 캐시 저장 (1시간)
      setCachedData(cacheKey, stats);
      
      return stats;
    } catch (error) {
      console.error('일별 판매 통계 조회 오류:', error);
      throw error;
    }
  },

  // 인기 상품 조회 (캐시 적용)
  async getPopularProducts() {
    try {
      // 캐시 확인
      const cached = getCachedData('popular_products');
      if (cached) {
        console.log('캐시된 인기 상품 사용');
        return cached;
      }

      const purchasesRef = collection(db, 'purchases');
      const q = query(
        purchasesRef,
        where('status', '==', 'completed')
      );
      const querySnapshot = await getDocs(q);
      
      const productStats = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const productId = data.productId;
        
        if (!productStats[productId]) {
          productStats[productId] = {
            productName: data.productName,
            totalSold: 0,
            totalRevenue: 0
          };
        }
        
        productStats[productId].totalSold += data.quantity || 1;
        productStats[productId].totalRevenue += data.totalPrice || 0;
      });
      
      // 판매량 기준으로 정렬
      const popularProducts = Object.entries(productStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.totalSold - a.totalSold);
      
      // 캐시 저장
      setCachedData('popular_products', popularProducts);
      
      return popularProducts;
    } catch (error) {
      console.error('인기 상품 조회 오류:', error);
      throw error;
    }
  }
};

// 캐시 관리 유틸리티
export const cacheService = {
  // 캐시 초기화
  clearCache() {
    cache.clear();
    console.log('캐시가 초기화되었습니다.');
  },
  
  // 특정 키 캐시 삭제
  clearCacheKey(key) {
    cache.delete(key);
    console.log(`캐시 키 "${key}"가 삭제되었습니다.`);
  },
  
  // 캐시 상태 확인
  getCacheStatus() {
    const keys = Array.from(cache.keys());
    return {
      totalEntries: cache.size,
      keys: keys,
      memoryUsage: JSON.stringify(cache).length
    };
  }
}; 

// 관리자 지갑 주소 관리
export const walletService = {
  // 지갑 주소 저장
  async setWalletAddress(address) {
    try {
      const settingsRef = doc(db, 'settings', 'wallet');
      await setDoc(settingsRef, { address, updatedAt: serverTimestamp() }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('지갑 주소 저장 오류:', error);
      throw error;
    }
  },
  // 지갑 주소 불러오기
  async getWalletAddress() {
    try {
      const settingsRef = doc(db, 'settings', 'wallet');
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        return snap.data().address || '';
      }
      return '';
    } catch (error) {
      console.error('지갑 주소 불러오기 오류:', error);
      throw error;
    }
  }
}; 