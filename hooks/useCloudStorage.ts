
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp, DocumentData } from 'firebase/firestore';

/**
 * useCloudStorage - simple typed helpers for saving/loading per-user data to Firestore.
 * - Generic T for the shape of `data`.
 * - Uses serverTimestamp for lastUpdated.
 * - Uses setDoc(..., { merge: true }) to avoid clobbering other fields.
 */
export function useCloudStorage<T = unknown>() {
  const saveToCloud = async (data: T, uid?: string): Promise<boolean> => {
    const userId = uid ?? auth.currentUser?.uid;
    const email = auth.currentUser?.email ?? null;

    if (!userId) {
      console.error('useCloudStorage.saveToCloud: no user id available');
      return false;
    }

    try {
      const ref = doc(db, 'users', userId);
      await setDoc(
        ref,
        {
          email,
          data,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('✅ Data saved to cloud!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('❌ Save error:', message);
      return false;
    }
  };

  const loadFromCloud = async (uid?: string): Promise<T | null> => {
    const userId = uid ?? auth.currentUser?.uid;
    if (!userId) {
      console.log('useCloudStorage.loadFromCloud: no user id available');
      return null;
    }

    try {
      const ref = doc(db, 'users', userId);
      const docSnap = await getDoc(ref);
      if (!docSnap.exists()) {
        console.log('No saved data found');
        return null;
      }
      const payload = docSnap.data() as DocumentData & { data?: T };
      console.log('✅ Data loaded from cloud!');
      return payload.data ?? null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('❌ Load error:', message);
      return null;
    }
  };

  return { saveToCloud, loadFromCloud };
}
