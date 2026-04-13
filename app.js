import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc
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
    showError('Сначала введи почту и пароль');
    return null;
  }

  return { email, password };
};

const setButtonsDisabled = (isDisabled) => {
  loginButton.disabled = isDisabled;
  registerButton.disabled = isDisabled;
};

const ensureUserDocument = async ({ uid, email }) => {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return;
  }

  await setDoc(userRef, {
    email,
    nickname: '',
    position: 'requested',
    createdAt: serverTimestamp()
  });
};

const openNextPageForUser = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    location.href = './nickname.html';
    return;
  }

  const userData = userSnapshot.data();

  if (userData.position === 'verified') {
    location.href = './main.html';
    return;
  }

  location.href = './nickname.html';
};

registerButton.addEventListener('click', async () => {
  clearStatus();
  const credentials = getCredentials();

  if (!credentials) {
    return;
  }

  try {
    setButtonsDisabled(true);
    const credential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);

    await ensureUserDocument({
      uid: credential.user.uid,
      email: credentials.email
    });

    showMessage('Регистрация прошла успешно. Переход на страницу ника...');
    await openNextPageForUser(credential.user.uid);
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
    const credential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);

    await ensureUserDocument({
      uid: credential.user.uid,
      email: credential.user.email ?? credentials.email
    });

    showMessage('Вход выполнен успешно');
    await openNextPageForUser(credential.user.uid);
  } catch (error) {
    showError(error.message);
  } finally {
    setButtonsDisabled(false);
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    return;
  }

  try {
    await ensureUserDocument({
      uid: user.uid,
      email: user.email ?? ''
    });

    await openNextPageForUser(user.uid);
  } catch (error) {
    showError(`Ошибка доступа к профилю: ${error.message}`);
  }
});
