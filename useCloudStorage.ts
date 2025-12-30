import { auth, db } from './firebase-config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export function useCloudStorage() {
  const saveToCloud = async (data) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      return false;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        data: data,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Data saved to cloud!');
      return true;
    } catch (error) {
      console.error('❌ Save error:', error);
      return false;
    }
  };

  const loadFromCloud = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in');
      return null;
    }

    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        console.log('✅ Data loaded from cloud!');
        return docSnap.data().data;
      } else {
        console.log('No saved data found');
        return null;
      }
    } catch (error) {
      console.error('❌ Load error:', error);
      return null;
    }
  };

  return { saveToCloud, loadFromCloud };
}
