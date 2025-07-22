// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBKD83lQHryrXLuOcDx3znfFHRkFh7D-SU",
  authDomain: "goyshop-cea39.firebaseapp.com",
  projectId: "goyshop-cea39",
  storageBucket: "goyshop-cea39.firebasestorage.app",
  messagingSenderId: "762574685339",
  appId: "1:762574685339:web:2490d954d12a1bdf69b23e",
  measurementId: "G-W2J3VKJH83"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 성능 최적화 설정
const initializeFirebaseOptimizations = async () => {
  try {
    // Firestore 오프라인 지속성 활성화 (성능 향상)
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true
    });
    console.log('Firestore 오프라인 지속성이 활성화되었습니다.');
  } catch (error) {
    if (error.code === 'failed-precondition') {
      console.warn('Firestore 오프라인 지속성 설정 실패: 여러 탭에서 실행 중');
    } else if (error.code === 'unimplemented') {
      console.warn('Firestore 오프라인 지속성이 지원되지 않습니다.');
    } else {
      console.error('Firestore 최적화 오류:', error);
    }
  }
};

// Initialize Analytics (optional - only if you need analytics)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Firebase 최적화 초기화
initializeFirebaseOptimizations();

// Export Firebase services
export { app, auth, db, storage, analytics };
export default app; 