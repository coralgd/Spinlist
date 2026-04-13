import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const nicknameInput = document.querySelector('#nickname');
const submitNicknameButton = document.querySelector('#submitNicknameButton');
const nicknameError = document.querySelector('#nicknameError');
const nicknameFormBlock = document.querySelector('#nicknameFormBlock');
const nicknameSubmittedBlock = document.querySelector('#nicknameSubmittedBlock');
const submittedNickname = document.querySelector('#submittedNickname');
const logoutButton = document.querySelector('#logoutButton');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let activeUserId = null;

const showError = (message) => {
  nicknameError.textContent = message;
};

const clearError = () => {
  nicknameError.textContent = '';
};

const showSubmitted = (nickname) => {
  nicknameFormBlock.classList.add('hidden');
  nicknameSubmittedBlock.classList.remove('hidden');
  submittedNickname.textContent = nickname;
};

const showForm = () => {
  nicknameSubmittedBlock.classList.add('hidden');
  nicknameFormBlock.classList.remove('hidden');
};

const loadUserState = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    showError('Документ пользователя не найден');
    showForm();
    return;
  }

  const userData = userSnapshot.data();

  if (userData.position === 'verified') {
    location.href = './main.html';
    return;
  }

  if (userData.nickname) {
    showSubmitted(userData.nickname);
    return;
  }

  showForm();
};

submitNicknameButton.addEventListener('click', async () => {
  clearError();

  const nickname = nicknameInput.value.trim();

  if (!nickname) {
    showError('Введи ник перед отправкой');
    return;
  }

  if (!activeUserId) {
    showError('Сессия не найдена, войди снова');
    return;
  }

  try {
    submitNicknameButton.disabled = true;
    await updateDoc(doc(db, 'users', activeUserId), {
      nickname,
      position: 'requested',
      nicknameRequestedAt: serverTimestamp()
    });

    showSubmitted(nickname);
  } catch (error) {
    showError(error.message);
  } finally {
    submitNicknameButton.disabled = false;
  }
});


logoutButton.addEventListener('click', async () => {
  clearError();

  try {
    logoutButton.disabled = true;
    await signOut(auth);
    location.href = './index.html';
  } catch (error) {
    showError(error.message);
  } finally {
    logoutButton.disabled = false;
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = './index.html';
    return;
  }

  activeUserId = user.uid;
  await loadUserState(user.uid);
});
