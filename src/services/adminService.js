import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// 관리자 권한 관리
export const adminService = {
  // 관리자 권한 확인
  async checkAdminRole(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData.role === 'admin';
      }
      return false;
    } catch (error) {
      console.error('관리자 권한 확인 오류:', error);
      return false;
    }
  },

  // 관리자 권한 부여 (수동으로 실행)
  async grantAdminRole(userEmail) {
    try {
      // 이메일로 사용자 찾기
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('해당 이메일의 사용자를 찾을 수 없습니다.');
      }
      
      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      
      // 관리자 권한 부여
      await updateDoc(doc(db, 'users', userId), {
        role: 'admin',
        adminGrantedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, userId };
    } catch (error) {
      console.error('관리자 권한 부여 오류:', error);
      throw error;
    }
  },

  // 관리자 권한 해제
  async revokeAdminRole(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'user',
        adminRevokedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('관리자 권한 해제 오류:', error);
      throw error;
    }
  },

  // 모든 관리자 목록 조회
  async getAllAdmins() {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);
      
      const admins = [];
      querySnapshot.forEach((doc) => {
        admins.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return admins;
    } catch (error) {
      console.error('관리자 목록 조회 오류:', error);
      throw error;
    }
  }
}; 