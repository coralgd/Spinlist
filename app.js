import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const loginButton = document.querySelector('#loginButton');
const registerButton = document.querySelector('#registerButton');
const authError = document.querySelector('#authError');
const authMessage = document.querySelector('#authMessage');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const clearStatus = () => {
  authError.textContent = '';
  authMessage.textContent = '';
};

const showError = (message) => {
  authError.textContent = message;
  authMessage.textContent = '';
};

const showMessage = (message) => {
  authMessage.textContent = message;
  authError.textContent = '';
};

const getCredentials = () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showError('сначала введи данные');
    return null;
  }

  return { email, password };
};

const setButtonsDisabled = (isDisabled) => {
  loginButton.disabled = isDisabled;
  registerButton.disabled = isDisabled;
};

const upsertUserDocument = async (user, isNewUser = false) => {
  const userRef = doc(db, 'users', user.uid);

  if (isNewUser) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      // Пароль в Firestore не сохраняем: Firebase Auth хранит его безопасно в хешированном виде.
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
    return;
  }

  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
    return;
  }

  await updateDoc(userRef, {
    email: user.email,
    lastLoginAt: serverTimestamp()
  });
};

registerButton.addEventListener('click', async () => {
  clearStatus();
  const credentials = getCredentials();

  if (!credentials) {
    return;
  }

  try {
    setButtonsDisabled(true);
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    await upsertUserDocument(userCredential.user, true);
    showMessage('Регистрация прошла успешно');
  } catch (error) {
    showError(error.message);
  } finally {
    setButtonsDisabled(false);
  }
});

loginButton.addEventListener('click', async () => {
  clearStatus();
  const credentials = getCredentials();

  if (!credentials) {
    return;
  }

  try {
    setButtonsDisabled(true);
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    await upsertUserDocument(userCredential.user);
    showMessage('Вход выполнен успешно');
  } catch (error) {
    showError(error.message);
  } finally {
    setButtonsDisabled(false);
  }
});
