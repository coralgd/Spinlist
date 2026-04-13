import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { doc, getDoc, getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ensureVerifiedAccess = async (userId) => {
  const snapshot = await getDoc(doc(db, 'users', userId));

  if (!snapshot.exists()) {
    location.href = './nickname.html';
    return;
  }

  const userData = snapshot.data();

  if (userData.position !== 'verified') {
    location.href = './nickname.html';
  }
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = './index.html';
    return;
  }

  await ensureVerifiedAccess(user.uid);
});
