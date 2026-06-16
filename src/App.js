import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDKUns-Jmw1RR9afnymTKF1xdjImHJGkNU",
  authDomain: "system-produkcji-d0256.firebaseapp.com",
  projectId: "system-produkcji-d0256",
  storageBucket: "system-produkcji-d0256.firebasestorage.app",
  messagingSenderId: "340231895219",
  appId: "1:340231895219:web:50fc85275a51d2114998c6"
};

const GOOGLE_CONFIG = {
  CLIENT_ID: '736317012952-856e5b7qsgqq346845eb7kgu4qokq49d.apps.googleusercontent.com',
  PARENT_FOLDER_ID: '1R8zz1X_qmRDMM3X82jI_0lhDLF6qEpTe'
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

const ACCESS_FOLDERS = [
  { key: 'orders', label: 'Zamówienia (widok)' },
  { key: 'orders_manage', label: 'Zamówienia (dodawanie)' },
  { key: 'ready', label: 'Gotowe' },
  { key: 'pallet', label: 'Paletowy' },
  { key: 'dedicated', label: 'Dedykowana' },
  { key: 'photos', label: 'Zdjęcia' },
  { key: 'raben', label: 'Raben (widok)' },
  { key: 'raben_manage', label: 'Raben (zarządzanie)' },
  { key: 'transport', label: 'Transporty własne (widok)' },
  { key: 'transport_manage', label: 'Transporty własne (zarządzanie)' },
  { key: 'archive2', label: 'Archiwum zdjęć' },
  { key: 'archive1', label: 'Archiwum zamówień' },
  { key: 'admin', label: 'Administracja' }
];

const DEFAULT_ACCESS = Object.fromEntries(ACCESS_FOLDERS.map(f => [f.key, false]));

const getUserAccess = (user) => {
  if (user.access) return user.access;
  // Backward compat: convert old roles
  const a = { ...DEFAULT_ACCESS };
  if (user.role === 'operator') { a.orders = true; a.orders_manage = true; }
  if (user.role === 'order_admin') { a.orders = true; a.ready = true; a.pallet = true; a.dedicated = true; }
  if (user.role === 'warehouse') { a.photos = true; }
  if (user.role === 'admin') { Object.keys(a).forEach(k => a[k] = true); }
  return a;
};

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

const compressImageSmall = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = Math.min(1, 800 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.4));
      };
    };
  });
};

export default function App() {
  const [appState, setAppState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  
  const [activeTab, setActiveTab] = useState('orders');
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('op1@company.com');
  const [loginPassword, setLoginPassword] = useState('1234');
  
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [newOrderNum, setNewOrderNum] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  const [photoSession, setPhotoSession] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserAccess, setNewUserAccess] = useState({ ...DEFAULT_ACCESS });
  const [editingUserId, setEditingUserId] = useState(null);
  const [dateEditOrderId, setDateEditOrderId] = useState(null);

  const historyEntry = (action) => ({
    timestamp: new Date().toISOString(),
    user: currentUser?.name || currentUser?.email || '?',
    action
  });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const warehouseFileInputRef = useRef(null);
  const attachmentFileInputRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Load Google API
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // NIE ładuj starego tokenu - zawsze czysty start!
    setAccessToken(null);

    // Load users
    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      if (snapshot.empty) {
        const demoUsers = [
          { name: 'Operator 1', email: 'op1@company.com', password: '1234', role: 'operator', access: { ...DEFAULT_ACCESS, orders: true, orders_manage: true } },
          { name: 'Operator 2', email: 'op2@company.com', password: '1234', role: 'operator', access: { ...DEFAULT_ACCESS, orders: true, orders_manage: true } },
          { name: 'Admin Jakości', email: 'qa@company.com', password: '1234', role: 'order_admin', access: { ...DEFAULT_ACCESS, orders: true, ready: true, pallet: true, dedicated: true } },
          { name: 'Admin', email: 'admin@company.com', password: '1234', role: 'admin', access: Object.fromEntries(ACCESS_FOLDERS.map(f => [f.key, true])) }
        ];
        demoUsers.forEach(u => addDoc(usersRef, u));
      } else {
        setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });

    // Load orders
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ docId: d.id, ...d.data() })));
    });

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, []);

  const handleLogin = () => {
    const user = users.find(u => u.email === loginEmail && u.password === loginPassword);
    if (user) {
      setCurrentUser({ uid: user.id, ...user });
      setAppState('dashboard');
    } else {
      alert('Błędne dane logowania');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppState('login');
    setAccessToken(null);
    localStorage.removeItem('google_access_token');
    stopCamera();
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const handleStartOrder = async () => {
    if (!newOrderNum.trim()) {
      alert('Wpisz numer zamówienia');
      return;
    }
    try {
      setIsLoading(true);
      if (orders.find(o => o.id === newOrderNum && o.status !== 'archived')) {
        alert('Zamówienie już istnieje');
        return;
      }
      await addDoc(collection(db, 'orders'), {
        id: newOrderNum,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        problems: [],
        photoCount: 0,
        photoArchived: false,
        history: [historyEntry('Utworzono zamówienie')]
      });
      setNewOrderNum('');
      setSelectedOrderId(newOrderNum);
    } catch (err) {
      alert('Błąd: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      alert('Brak dostępu do kamery');
    }
  };

  const handleTakePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const scale = Math.min(1, 800 / Math.max(videoRef.current.videoWidth, videoRef.current.videoHeight));
    canvasRef.current.width = videoRef.current.videoWidth * scale;
    canvasRef.current.height = videoRef.current.videoHeight * scale;
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    setIssuePhoto(canvasRef.current.toDataURL('image/jpeg', 0.4));
  };

  const handleAddProblem = async () => {
    if (!issueDesc.trim()) {
      alert('Wpisz opis błędu');
      return;
    }
    try {
      setIsLoading(true);
      const order = orders.find(o => o.id === selectedOrderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, {
        problems: [...(order.problems || []), { id: Date.now(), description: issueDesc, photoURL: issuePhoto, cut: false, repaired: false }], history: [...(order.history || []), historyEntry(`Dodano błąd: ${issueDesc}`)]
      });
      setIssueDesc('');
      setIssuePhoto(null);
      alert('✅ Błąd dodany');
    } catch (err) {
      alert('Błąd: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProblem = async (orderId, problemId, field) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const problem = order.problems.find(p => p.id === problemId);
      if (!problem) return;
      problem[field] = !problem[field];
      let updatedProblems = order.problems;
      if (problem.cut && problem.repaired) {
        updatedProblems = order.problems.filter(p => p.id !== problemId);
      }
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { problems: updatedProblems });
    } catch (err) {
      alert('Błąd zmiany statusu');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      if ((order.problems || []).some(p => !(p.cut && p.repaired))) {
        alert('❌ Są nienaprawione elementy - nie można zamknąć');
        return;
      }
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { status: 'ready', history: [...(order.history || []), historyEntry('Zlecenie zakończone → Gotowe')] });
      setSelectedOrderId(null);
      alert('✅ Zamówienie przeniesione do Gotowych');
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const handleMoveFromReady = async (orderId, newStatus) => {
    let confirmMsg = '';
    if (newStatus === 'pallet') {
      confirmMsg = 'Czy potwierdzasz, że status w Prestashop został zmieniony na "! Dostawa paletowa - Odpowiedz na wiadomość" i chcesz przenieść zamówienie do katalogu Paletowy?';
    } else if (newStatus === 'dedicated') {
      confirmMsg = 'Czy potwierdzasz, że status w Prestashop został zmieniony na "! Dostawa dedykowana o krok. Produkcja zakończona sukcesem." i chcesz przenieść zamówienie do Dedykowana?';
    }

    if (!window.confirm(confirmMsg)) return;
    
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { status: newStatus, history: [...(order.history || []), historyEntry(`Przeniesiono do ${newStatus === 'pallet' ? 'Paletowy' : 'Dedykowana'}`)] });
      alert(`✅ Zamówienie przeniesione`);
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const handleRevertFromReady = async (orderId) => {
    if (!window.confirm(`Czy cofnąć zamówienie #${orderId} do Gotowych?`)) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { status: 'ready', history: [...(order.history || []), historyEntry('Cofnięto do Gotowych')] });
      alert('✅ Cofnięto do Gotowych');
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const uploadToGoogleDrive = async (orderId, photoBase64, photoNumber) => {
    if (!accessToken) {
      setUploadMessage('❌ Brak autoryzacji - kliknij "Autoryzuj Google Drive"');
      return false;
    }
    try {
      setUploadMessage(`⏳ Upload zdjęcia ${photoNumber}...`);
      
      const byteCharacters = atob(photoBase64.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${orderId}' and '${GOOGLE_CONFIG.PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&pageSize=1`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const searchData = await searchResponse.json();
      let folderId;

      if (searchData.files && searchData.files.length > 0) {
        folderId = searchData.files[0].id;
        setUploadMessage(`📁 Folder znaleziony: ${orderId}`);
      } else {
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: orderId, 
            mimeType: 'application/vnd.google-apps.folder',
            parents: [GOOGLE_CONFIG.PARENT_FOLDER_ID]
          })
        });
        const folderData = await createResponse.json();
        if (!folderData.id) throw new Error('Nie udało się utworzyć folderu');
        folderId = folderData.id;
        setUploadMessage(`📁 Folder utworzony: ${orderId}`);
      }

      const fileName = `${orderId}_${photoNumber}.jpg`;
      const metadata = { name: fileName, mimeType: 'image/jpeg', parents: [folderId] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });

      if (uploadResponse.ok) {
        setUploadMessage(`✅ Zdjęcie ${photoNumber} uploadowane`);
        return true;
      } else {
        const error = await uploadResponse.text();
        setUploadMessage(`❌ Upload zdjęcia ${photoNumber} nie powiódł się`);
        return false;
      }
    } catch (err) {
      setUploadMessage(`❌ Błąd uploadu: ${err.message}`);
      console.error('Upload error:', err);
      return false;
    }
  };

  const handleAuthorizeGoogle = () => {
    if (!window.google) {
      alert('Google API się ładuje, spróbuj za moment');
      return;
    }

    setUploadMessage('⏳ Czekam na autoryzację...');

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CONFIG.CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive',
      callback: (response) => {
        console.log('OAuth response:', response);
        if (response && response.access_token) {
          const token = response.access_token;
          setAccessToken(token);
          localStorage.setItem('google_access_token', token);
          setUploadMessage('✅ Google Drive autoryzowany! Możesz teraz robić zdjęcia.');
        } else {
          setUploadMessage('❌ Autoryzacja nie powiodła się');
          console.error('No access token in response');
        }
      },
      error_callback: (error) => {
        console.error('OAuth error:', error);
        setUploadMessage(`❌ Błąd autoryzacji`);
      }
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  };

  const handleStartPhotoSession = (orderId) => {
    setPhotoSession({ orderId, photos: [] });
    setUploadMessage('');
    setCameraActive(false);
  };

  const handleTakeWarehousePhoto = async () => {
    if (!canvasRef.current || !videoRef.current || !photoSession) return;
    try {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const photoBase64 = canvasRef.current.toDataURL('image/jpeg', 0.7);

      setIsLoading(true);
      const photoNumber = photoSession.photos.length + 1;
      const success = await uploadToGoogleDrive(photoSession.orderId, photoBase64, photoNumber);

      if (success) {
        setPhotoSession(prev => ({
          ...prev,
          photos: [...prev.photos, photoBase64]
        }));
      }
    } catch (err) {
      setUploadMessage(`❌ Błąd: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !photoSession) return;
    try {
      setIsLoading(true);
      const compressedBase64 = await compressImage(file);
      const photoNumber = photoSession.photos.length + 1;
      const success = await uploadToGoogleDrive(photoSession.orderId, compressedBase64, photoNumber);

      if (success) {
        setPhotoSession(prev => ({
          ...prev,
          photos: [...prev.photos, compressedBase64]
        }));
      }
    } catch (err) {
      setUploadMessage(`❌ Błąd: ${err.message}`);
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = (idx) => {
    if (!photoSession) return;
    setPhotoSession(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx)
    }));
  };

  const handleArchivePhotos = async () => {
    if (!photoSession || photoSession.photos.length < 3) {
      alert('❌ Min 3 zdjęcia potrzebne');
      return;
    }

    try {
      setIsLoading(true);
      const order = orders.find(o => o.id === photoSession.orderId);
      if (!order) return;

      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, {
        photoCount: photoSession.photos.length,
        photoArchived: true,
        history: [...(order.history || []), historyEntry(`Zarchiwizowano ${photoSession.photos.length} zdjęć`)]
      });

      stopCamera();
      setPhotoSession(null);
      setUploadMessage('');
      alert(`✅ Zdjęcia zarchiwizowane! (${photoSession.photos.length} zdjęć)`);
    } catch (err) {
      alert('Błąd: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert('Wypełnij wszystkie pola');
      return;
    }
    try {
      setIsLoading(true);
      await addDoc(collection(db, 'users'), {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        access: { ...newUserAccess }
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserAccess({ ...DEFAULT_ACCESS });
      alert('✅ Użytkownik dodany!');
    } catch (err) {
      alert('Błąd: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserAccess = async (userId, access) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { access });
      alert('✅ Uprawnienia zapisane');
      setEditingUserId(null);
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Czy na pewno usunąć tego użytkownika?')) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { deleted: true });
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const handleUpdateOrderField = async (orderId, field, value) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { [field]: value });
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const handleConfirmDate = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (!order.transportDate) { alert('Wybierz datę transportu'); return; }
    if (!window.confirm(`Potwierdzić datę transportu ${order.transportDate} dla zamówienia #${orderId}?`)) return;
    try {
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { dateConfirmed: true, history: [...(order.history || []), historyEntry(`Potwierdzono datę: ${order.transportDate}`)] });
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const handleUnconfirmDate = async (orderId) => {
    if (!window.confirm('Czy na pewno chcesz zmienić potwierdzoną datę?')) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { dateConfirmed: false, history: [...(order.history || []), historyEntry('Odblokowano datę do zmiany')] });
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const ATTACHMENTS_FOLDER_ID = '1EtAmIu6Cr8f3jD9JQC3G3nNE0M3Gf_bD';

  const handleUploadAttachment = async (orderId, file) => {
    if (!accessToken) { alert('Najpierw autoryzuj Google Drive w zakładce Zdjęcia'); return; }
    try {
      setIsLoading(true);
      setUploadMessage(`⏳ Upload ${file.name}...`);

      // Find or create order subfolder in attachments folder
      const searchResp = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${orderId}' and '${ATTACHMENTS_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&pageSize=1`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const searchData = await searchResp.json();
      let folderId;

      if (searchData.files && searchData.files.length > 0) {
        folderId = searchData.files[0].id;
      } else {
        const createResp = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: orderId, mimeType: 'application/vnd.google-apps.folder', parents: [ATTACHMENTS_FOLDER_ID] })
        });
        const folderData = await createResp.json();
        if (!folderData.id) throw new Error('Nie udało się utworzyć folderu');
        folderId = folderData.id;
      }

      const metadata = { name: file.name, parents: [folderId] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const uploadResp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });

      if (!uploadResp.ok) throw new Error('Upload nie powiódł się');
      const uploadData = await uploadResp.json();

      // Save attachment info in Firebase
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      const currentAttachments = order.attachments || [];
      await updateDoc(orderRef, {
        attachments: [...currentAttachments, { name: file.name, driveFileId: uploadData.id, driveLink: uploadData.webViewLink || '', uploadedAt: new Date().toISOString() }], history: [...(order.history || []), historyEntry(`Dodano załącznik: ${file.name}`)]
      });

      setUploadMessage(`✅ ${file.name} uploadowany`);
    } catch (err) {
      setUploadMessage(`❌ Błąd: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAttachment = async (orderId, attachmentIdx) => {
    if (!window.confirm('Usunąć załącznik?')) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      const updated = (order.attachments || []).filter((_, i) => i !== attachmentIdx);
      await updateDoc(orderRef, { attachments: updated, history: [...(order.history || []), historyEntry('Usunięto załącznik')] });
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const handleToggleShipping = async (orderId, field) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { [field]: !(order[field] || false), history: [...(order.history || []), historyEntry(`${!(order[field] || false) ? 'Zaznaczono' : 'Odznaczono'}: ${field}`)] });
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const handleMoveToArchive = async (orderId) => {
    if (!window.confirm(`Przenieść zamówienie #${orderId} do archiwum?`)) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { status: 'archived', archivedAt: new Date().toISOString(), history: [...(order.history || []), historyEntry('Przeniesiono do archiwum')] });
      alert('✅ Przeniesiono do archiwum');
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const handlePasswordDateEdit = (orderId) => {
    const pwd = window.prompt('Wpisz hasło aby zmienić datę:');
    if (pwd !== 'FlexM') { if (pwd !== null) alert('❌ Nieprawidłowe hasło'); return; }
    setDateEditOrderId(orderId);
  };

  const handleSaveDateEdit = async (orderId, newDate) => {
    if (!newDate) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { transportDate: newDate, dateConfirmed: true, history: [...(order.history || []), historyEntry(`Zmieniono datę na: ${newDate} (hasło)`)] });
      setDateEditOrderId(null);
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const handleTransferOrder = (orderId, fromStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (!order.transportDate) { alert('Najpierw wybierz datę transportu'); return; }

    const defaultTarget = fromStatus === 'pallet' ? 'raben' : 'transport';
    const altTarget = fromStatus === 'pallet' ? 'transport' : 'raben';
    const defaultLabel = fromStatus === 'pallet' ? 'Raben' : 'Transporty własne';
    const altLabel = fromStatus === 'pallet' ? 'Transporty własne' : 'Raben';

    const choice = window.prompt(
      `Przenieś zamówienie #${orderId}:\n\n1 = ${defaultLabel} (domyślnie)\n2 = Nie przenoś\n3 = ${altLabel}\n\nWpisz 1, 2 lub 3:`,
      '1'
    );

    if (!choice || choice === '2') return;

    if (choice === '3') {
      if (!window.confirm(`Czy na pewno chcesz zmienić rodzaj transportu na "${altLabel}"?`)) return;
      const orderRef = doc(db, 'orders', order.docId);
      updateDoc(orderRef, { status: altTarget, history: [...(order.history || []), historyEntry(`Przeniesiono do ${altLabel} (zmiana rodzaju)`)] }).then(() => alert(`✅ Przeniesiono do ${altLabel}`));
    } else {
      const orderRef = doc(db, 'orders', order.docId);
      updateDoc(orderRef, { status: defaultTarget, history: [...(order.history || []), historyEntry(`Przeniesiono do ${defaultLabel}`)] }).then(() => alert(`✅ Przeniesiono do ${defaultLabel}`));
    }
  };

  const sortByNum = (a, b) => parseInt(a.id) - parseInt(b.id);
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').sort(sortByNum);
  const readyOrders = orders.filter(o => o.status === 'ready').sort(sortByNum);
  const palletOrders = orders.filter(o => o.status === 'pallet').sort(sortByNum);
  const dedicatedOrders = orders.filter(o => o.status === 'dedicated').sort(sortByNum);
  const archive2Orders = orders.filter(o => o.photoArchived === true).sort(sortByNum);
  const sortByDate = (a, b) => (a.transportDate || '9999').localeCompare(b.transportDate || '9999');
  const rabenOrders = orders.filter(o => o.status === 'raben').sort(sortByDate);
  const transportOrders = orders.filter(o => o.status === 'transport').sort(sortByNum);
  const archive1Orders = orders.filter(o => o.status === 'archived').sort(sortByNum);

  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

  const getTabs = () => {
    if (!currentUser) return [];
    const a = getUserAccess(currentUser);
    const tabs = [];
    if (a.orders || a.orders_manage) tabs.push('orders');
    if (a.ready) tabs.push('ready');
    if (a.pallet) tabs.push('pallet');
    if (a.dedicated) tabs.push('dedicated');
    if (a.photos) tabs.push('photos');
    if (a.raben || a.raben_manage) tabs.push('raben');
    if (a.transport || a.transport_manage) tabs.push('transport');
    if (a.archive2) tabs.push('archive2');
    if (a.archive1) tabs.push('archive1');
    if (a.admin) tabs.push('admin');
    return tabs;
  };

  const visibleTabs = getTabs();

  return (
    <div style={{ padding: '1rem', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Arial' }}>
      <style>{`
        .card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
        .btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-success { border-color: #4CAF50; color: #4CAF50; }
        .btn-danger { border-color: #f44336; color: #f44336; }
        .btn-primary { border-color: #2196F3; color: #2196F3; }
        input, textarea, select { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .order-card { background: white; border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; cursor: pointer; border-radius: 8px; }
        .order-card.active { border: 2px solid #2196F3; background: #e3f2fd; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: white; padding: 1rem; border-radius: 8px; border: 1px solid #ddd; }
        .tabs { display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap; }
        .tab-btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; }
        .tab-btn.active { background: #2196F3; border-color: #2196F3; color: white; }
        .photo-preview { max-width: 100%; max-height: 150px; border-radius: 4px; margin: 0.5rem 0; }
        video { width: 100%; height: auto; background: #000; border-radius: 4px; }
        canvas { display: none; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .photo-item { background: #f0f0f0; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; }
        .msg { padding: 0.75rem; margin: 0.5rem 0; border-radius: 4px; font-size: 12px; }
        .msg-info { background: #e3f2fd; color: #1976d2; }
        .msg-success { background: #e8f5e9; color: #388e3c; }
        .msg-error { background: #ffebee; color: #c62828; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
        .search-box { position: relative; margin-bottom: 1rem; }
        .search-box input { width: 100%; padding: 8px 8px 8px 32px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; box-sizing: border-box; }
        .search-box::before { content: '🔍'; position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; }
      `}</style>

      {appState === 'login' && (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
          <div className="card">
            <h1 style={{ textAlign: 'center' }}>🏭 System v22</h1>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email" style={{ width: '100%', marginBottom: '1rem' }} />
            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Hasło" style={{ width: '100%', marginBottom: '1rem' }} />
            <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%' }}>Zaloguj</button>
          </div>
        </div>
      )}

      {appState === 'dashboard' && currentUser && (
        <div>
          <div className="header">
            <h1 style={{ margin: 0 }}>🏭 System</h1>
            <button className="btn btn-danger" onClick={handleLogout}>Wyloguj</button>
          </div>

          <div className="tabs">
            {visibleTabs.includes('orders') && <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}>📦 Zamówienia</button>}
            {visibleTabs.includes('ready') && <button className={`tab-btn ${activeTab === 'ready' ? 'active' : ''}`} onClick={() => { setActiveTab('ready'); setSearchQuery(''); }}>📋 Gotowe</button>}
            {visibleTabs.includes('pallet') && <button className={`tab-btn ${activeTab === 'pallet' ? 'active' : ''}`} onClick={() => { setActiveTab('pallet'); setSearchQuery(''); }}>🎨 Paletowy</button>}
            {visibleTabs.includes('dedicated') && <button className={`tab-btn ${activeTab === 'dedicated' ? 'active' : ''}`} onClick={() => { setActiveTab('dedicated'); setSearchQuery(''); }}>📦 Dedykowana</button>}
            {visibleTabs.includes('photos') && <button className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => { setActiveTab('photos'); setSearchQuery(''); }}>📸 Zdjęcia</button>}
            {visibleTabs.includes('raben') && <button className={`tab-btn ${activeTab === 'raben' ? 'active' : ''}`} onClick={() => { setActiveTab('raben'); setSearchQuery(''); }}>🚚 Raben</button>}
            {visibleTabs.includes('transport') && <button className={`tab-btn ${activeTab === 'transport' ? 'active' : ''}`} onClick={() => { setActiveTab('transport'); setSearchQuery(''); }}>🚛 Transporty</button>}
            {visibleTabs.includes('archive2') && <button className={`tab-btn ${activeTab === 'archive2' ? 'active' : ''}`} onClick={() => { setActiveTab('archive2'); setSearchQuery(''); }}>📂 Archiwum zdjęć</button>}
            {visibleTabs.includes('archive1') && <button className={`tab-btn ${activeTab === 'archive1' ? 'active' : ''}`} onClick={() => { setActiveTab('archive1'); setSearchQuery(''); }}>🗄️ Archiwum</button>}
            {visibleTabs.includes('admin') && <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => { setActiveTab('admin'); setSearchQuery(''); }}>⚙️ Admin</button>}
          </div>

          {activeTab === 'orders' && (
            <div>
              <div className="search-box">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
              </div>

              {getUserAccess(currentUser).orders_manage && (
                <div className="card">
                  <h3>Nowe zamówienie</h3>
                  <input type="text" value={newOrderNum} onChange={e => setNewOrderNum(e.target.value)} placeholder="Numer" style={{ width: '100%', marginBottom: '1rem' }} />
                  <button className="btn btn-success" onClick={handleStartOrder} disabled={isLoading} style={{ width: '100%' }}>Rozpocznij</button>
                </div>
              )}

              <h3>Zamówienia ({inProgressOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).length})</h3>
              {inProgressOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).length === 0 && <p style={{ color: '#999', fontSize: '12px' }}>Brak zamówień</p>}
              {inProgressOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => (
                <React.Fragment key={order.docId}>
                  <div className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                    <div style={{ fontWeight: 'bold' }}>#{order.id}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {order.problems?.length > 0 ? (
                        <>Błędy: {order.problems.length} | Naprawione: {order.problems.filter(p => p.cut && p.repaired).length}</>
                      ) : (
                        <>Brak błędów - gotowe do zamknięcia</>
                      )}
                    </div>
                  </div>

                  {selectedOrderId === order.id && selectedOrder && (
                    <div className="card" style={{ borderLeft: '3px solid #2196F3' }}>
                      <h3>#{selectedOrder.id}</h3>

                      {selectedOrder.problems?.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4>Błędy ({selectedOrder.problems.length}):</h4>
                          {selectedOrder.problems.map(p => (
                            <div key={p.id} style={{ background: '#f9f9f9', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '4px' }}>
                              {p.photoURL && <img src={p.photoURL} className="photo-preview" alt="Problem" />}
                              <p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>{p.description}</p>
                              <label style={{ marginRight: '1rem' }}>
                                <input type="checkbox" checked={p.cut || false} onChange={() => handleToggleProblem(selectedOrder.id, p.id, 'cut')} disabled={isLoading} />
                                Wycięty
                              </label>
                              <label>
                                <input type="checkbox" checked={p.repaired || false} onChange={() => handleToggleProblem(selectedOrder.id, p.id, 'repaired')} disabled={isLoading} />
                                Dorobiony
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      {getUserAccess(currentUser).orders_manage && (
                        <>
                          <h4>Dodaj błąd</h4>
                          <button className="btn btn-primary" onClick={handleStartCamera} style={{ marginRight: '0.5rem' }} disabled={isLoading}>📷 Kamera</button>
                          <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>📤 Plik</button>
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) compressImageSmall(f).then(setIssuePhoto).catch(() => alert('Błąd kompresji')); }} style={{ display: 'none' }} />

                          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', marginTop: '1rem', display: cameraActive ? 'block' : 'none' }}></video>
                          {cameraActive && <button className="btn btn-success" onClick={handleTakePhoto} style={{ width: '100%', marginTop: '0.5rem' }} disabled={isLoading}>Zrób zdjęcie</button>}

                          <canvas ref={canvasRef}></canvas>
                          {issuePhoto && <img src={issuePhoto} className="photo-preview" alt="Issue" />}

                          <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} placeholder="Opis" style={{ width: '100%', height: '80px', marginTop: '1rem', marginBottom: '1rem' }} />
                          <button className="btn btn-success" onClick={handleAddProblem} disabled={isLoading} style={{ width: '100%' }}>Dodaj błąd</button>

                          {!selectedOrder.problems?.some(p => !(p.cut && p.repaired)) && (
                            <button className="btn btn-success" onClick={() => handleCompleteOrder(selectedOrder.id)} disabled={isLoading} style={{ width: '100%', marginTop: '1rem' }}>✓ Zlecenie zakończone</button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {activeTab === 'ready' && (
            <div>
              <h2>Gotowe ({readyOrders.length})</h2>
              <div className="search-box">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
              </div>
              {readyOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).length === 0 && <p style={{ color: '#999' }}>Brak zamówień</p>}
              {readyOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => (
                <div key={order.docId} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>#{order.id}</h3>
                    <div>
                      <button className="btn btn-primary" onClick={() => handleMoveFromReady(order.id, 'pallet')} disabled={isLoading} style={{ marginRight: '0.5rem' }}>🎨 Paletowy</button>
                      <button className="btn btn-primary" onClick={() => handleMoveFromReady(order.id, 'dedicated')} disabled={isLoading} style={{ marginRight: '0.5rem' }}>📦 Dedykowana</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'pallet' || activeTab === 'dedicated') && (() => {
            const isPallet = activeTab === 'pallet';
            const tabOrders = isPallet ? palletOrders : dedicatedOrders;
            const tabLabel = isPallet ? 'Paletowy' : 'Dedykowana';
            return (
              <div>
                <h2>{isPallet ? '🎨' : '📦'} {tabLabel} ({tabOrders.length})</h2>
                <div className="search-box">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
                </div>

                {uploadMessage && (
                  <div className={`msg ${uploadMessage.includes('✅') ? 'msg-success' : uploadMessage.includes('❌') ? 'msg-error' : 'msg-info'}`}>
                    {uploadMessage}
                  </div>
                )}

                {tabOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).length === 0 && <p style={{ color: '#999' }}>Brak zamówień</p>}
                {tabOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => (
                  <React.Fragment key={order.docId}>
                    <div className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0' }}>#{order.id}</h3>
                          {order.uwagi && <p style={{ fontSize: '12px', color: '#1976d2', margin: '0 0 2px 0' }}>💬 {order.uwagi}</p>}
                          <div style={{ fontSize: '11px', color: '#666', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {order.transportDate && <span>📅 {order.transportDate}</span>}
                            {order.dateConfirmed && <span style={{ color: '#388e3c' }}>✅ data potwierdzona</span>}
                            {order.attachments?.length > 0 && <span>📎 {order.attachments.length} plik(ów)</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: '18px' }}>{selectedOrderId === order.id ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {selectedOrderId === order.id && (
                      <div className="card" style={{ borderLeft: '3px solid #2196F3' }}>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📅 Data transportu:</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="date" value={order.transportDate || ''} onChange={e => handleUpdateOrderField(order.id, 'transportDate', e.target.value)} style={{ flex: 1 }} disabled={order.dateConfirmed} />
                            {!order.dateConfirmed && order.transportDate && (
                              <button className="btn btn-success" onClick={() => handleConfirmDate(order.id)} disabled={isLoading} style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}>✓ Potwierdź</button>
                            )}
                            {order.dateConfirmed && (
                              <button className="btn btn-danger" onClick={() => handleUnconfirmDate(order.id)} disabled={isLoading} style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}>🔓 Zmień datę</button>
                            )}
                          </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>💬 Uwagi (widoczne na liście, max 60 znaków):</label>
                          <input type="text" maxLength={60} value={order.uwagi || ''} onChange={e => handleUpdateOrderField(order.id, 'uwagi', e.target.value)} placeholder="Krótka uwaga..." style={{ width: '100%' }} />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📝 Notatki:</label>
                          <textarea value={order.notatki || ''} onChange={e => handleUpdateOrderField(order.id, 'notatki', e.target.value)} placeholder="Dłuższa notatka..." style={{ width: '100%', height: '60px' }} />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📎 Załączniki (list przewozowy, dokumenty):</label>
                          {!accessToken ? (
                            <button className="btn btn-primary" onClick={handleAuthorizeGoogle} disabled={isLoading} style={{ fontSize: '12px', width: '100%' }}>🔐 Autoryzuj Google Drive (wymagane do załączników)</button>
                          ) : (
                            <button className="btn btn-primary" onClick={() => attachmentFileInputRef.current?.click()} disabled={isLoading} style={{ fontSize: '12px', marginBottom: '0.5rem' }}>📤 Dodaj plik</button>
                          )}
                          <input ref={attachmentFileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAttachment(order.id, f); e.target.value = ''; }} style={{ display: 'none' }} />

                          {(order.attachments || []).length > 0 && (
                            <div style={{ marginTop: '0.5rem' }}>
                              {order.attachments.map((att, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f0f0', padding: '6px 10px', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                                  <a href={att.driveLink || '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>📄 {att.name}</a>
                                  <button className="btn btn-danger" onClick={() => handleDeleteAttachment(order.id, idx)} disabled={isLoading} style={{ padding: '2px 6px', fontSize: '10px' }}>✕</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                          <button className="btn btn-success" onClick={() => handleTransferOrder(order.id, isPallet ? 'pallet' : 'dedicated')} disabled={isLoading || !order.transportDate} style={{ flex: 1 }}>
                            {isPallet ? '🚚 → Raben' : '🚛 → Transporty'}
                          </button>
                          <button className="btn btn-danger" onClick={() => handleRevertFromReady(order.id)} disabled={isLoading} style={{ padding: '8px 12px' }}>↩ Cofnij</button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            );
          })()}

          {activeTab === 'photos' && (
            <div>
              <h2>📸 Zdjęcia</h2>

              {!accessToken && (
                <div className="card" style={{ background: '#fff3cd', marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 1rem 0' }}>👉 NAJPIERW: Kliknij przycisk poniżej i autoryzuj dostęp do Google Drive!</p>
                  <button className="btn btn-primary" onClick={handleAuthorizeGoogle} disabled={isLoading} style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold' }}>🔐 AUTORYZUJ GOOGLE DRIVE</button>
                </div>
              )}

              {accessToken && (
                <div className="card" style={{ background: '#e8f5e9', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, color: '#388e3c', fontWeight: 'bold' }}>✅ Google Drive autoryzowany!</p>
                </div>
              )}

              {uploadMessage && (
                <div className={`msg ${uploadMessage.includes('✅') ? 'msg-success' : uploadMessage.includes('❌') ? 'msg-error' : 'msg-info'}`}>
                  {uploadMessage}
                </div>
              )}

              {!photoSession ? (
                <>
                  <div className="search-box">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '1rem' }}>Wybierz zamówienie do fotografowania</p>
                  {orders.filter(o => !o.photoArchived && o.status !== 'in_progress').filter(o => !searchQuery || o.id.includes(searchQuery)).sort(sortByNum).map(order => (
                    <div key={order.docId} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0' }}>#{order.id}</h3>
                          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Status: {order.status} | Zdjęcia: {order.photoCount || 0}</p>
                        </div>
                        <button className="btn btn-success" onClick={() => handleStartPhotoSession(order.id)} disabled={isLoading || !accessToken}>Zdjęcia</button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="card">
                  <h3>Fotografowanie #{photoSession.orderId}</h3>

                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', marginBottom: '1rem' }}></video>
                  <canvas ref={canvasRef}></canvas>

                  {!cameraActive ? (
                    <button className="btn btn-primary" onClick={handleStartCamera} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>📷 Włącz kamerę</button>
                  ) : (
                    <button className="btn btn-success" onClick={handleTakeWarehousePhoto} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>Zrób zdjęcie</button>
                  )}

                  <button className="btn btn-primary" onClick={() => warehouseFileInputRef.current?.click()} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>📤 Z dysku</button>
                  <input ref={warehouseFileInputRef} type="file" accept="image/*" onChange={handlePhotoFileChange} style={{ display: 'none' }} />

                  <div style={{ display: 'inline-block', padding: '6px 12px', background: '#2196F3', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>Zdjęcia: {photoSession.photos.length} / 3</div>

                  {photoSession.photos.length > 0 && (
                    <div style={{ marginTop: '1rem', marginBottom: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                      {photoSession.photos.map((_, idx) => (
                        <div key={idx} className="photo-item">
                          <span>✓ {photoSession.orderId}_{idx + 1}.jpg</span>
                          <button className="btn btn-danger" onClick={() => handleDeletePhoto(idx)} disabled={isLoading} style={{ padding: '4px 8px', fontSize: '11px' }}>Usuń</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {photoSession.photos.length >= 3 && (
                    <button className="btn btn-success" onClick={handleArchivePhotos} disabled={isLoading} style={{ width: '100%', marginTop: '1rem' }}>✓ Zarchiwizuj zdjęcia</button>
                  )}

                  {photoSession.photos.length < 3 && (
                    <div style={{ background: '#fff3cd', padding: '0.75rem', marginTop: '1rem', borderRadius: '4px', fontSize: '12px' }}>⚠️ Potrzebujesz {3 - photoSession.photos.length} zdjęcia(ć) więcej</div>
                  )}

                  <button className="btn btn-danger" onClick={() => { stopCamera(); setPhotoSession(null); }} style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>Anuluj sesję</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'archive2' && (
            <div>
              <h2>Archiwum2 ({archive2Orders.length})</h2>
              <div className="search-box">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
              </div>
              {archive2Orders.filter(o => !searchQuery || o.id.includes(searchQuery)).length === 0 && <p style={{ color: '#999' }}>Brak zamówień</p>}
              {archive2Orders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => (
                <div key={order.docId} className="card">
                  <h3 style={{ margin: '0 0 8px 0' }}>#{order.id}</h3>
                  <p style={{ fontSize: '12px', color: '#4CAF50', margin: 0 }}>📸 {order.photoCount} zdjęcia wykonane</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'archive1' && (
            <div>
              <h2>🗄️ Archiwum zamówień ({archive1Orders.length})</h2>
              <div className="search-box">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
              </div>
              {archive1Orders.filter(o => !searchQuery || o.id.includes(searchQuery)).length === 0 && <p style={{ color: '#999' }}>Brak zamówień</p>}
              {archive1Orders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => (
                <div key={order.docId} className="card">
                  <h3 style={{ margin: '0 0 8px 0' }}>#{order.id}</h3>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.75rem' }}>
                    {order.transportDate && <span style={{ marginRight: '12px' }}>📅 {order.transportDate}</span>}
                    {order.uwagi && <span style={{ marginRight: '12px' }}>💬 {order.uwagi}</span>}
                    {order.attachments?.length > 0 && <span style={{ marginRight: '12px' }}>📎 {order.attachments.length} plik(ów)</span>}
                    {order.photoCount > 0 && <span>📸 {order.photoCount} zdjęć</span>}
                  </div>
                  {order.notatki && <p style={{ fontSize: '12px', color: '#555', margin: '0 0 8px 0', fontStyle: 'italic' }}>📝 {order.notatki}</p>}
                  {order.archivedAt && <p style={{ fontSize: '11px', color: '#388e3c', margin: '0 0 8px 0' }}>🗄️ Zarchiwizowano: {new Date(order.archivedAt).toLocaleString('pl-PL')}</p>}

                  {(order.history || []).length > 0 && (
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '8px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#333' }}>📋 Historia zamówienia:</p>
                      {order.history.map((h, idx) => (
                        <div key={idx} style={{ fontSize: '11px', color: '#666', padding: '3px 0', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: '8px' }}>
                          <span style={{ color: '#999', whiteSpace: 'nowrap' }}>{new Date(h.timestamp).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{ color: '#1976d2', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{h.user}</span>
                          <span>{h.action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'raben' || activeTab === 'transport') && (() => {
            const isRaben = activeTab === 'raben';
            const tabOrders = isRaben ? rabenOrders : transportOrders;
            const tabLabel = isRaben ? '🚚 Raben' : '🚛 Transporty własne';
            const ua = getUserAccess(currentUser);
            const canManage = isRaben ? ua.raben_manage : ua.transport_manage;
            const checkboxes = isRaben
              ? [{ key: 'spakowane', label: 'Spakowane' }, { key: 'wyslane', label: 'Wysłane' }]
              : [{ key: 'spakowane', label: 'Spakowane' }, { key: 'wyslane', label: 'Wysłane' }, { key: 'dostarczone', label: 'Dostarczone' }];
            const allChecked = (order) => checkboxes.every(cb => order[cb.key]);

            return (
              <div>
                <h2>{tabLabel} ({tabOrders.length})</h2>
                <div className="search-box">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
                </div>

                {uploadMessage && (
                  <div className={`msg ${uploadMessage.includes('✅') ? 'msg-success' : uploadMessage.includes('❌') ? 'msg-error' : 'msg-info'}`}>
                    {uploadMessage}
                  </div>
                )}

                {tabOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).length === 0 && <p style={{ color: '#999' }}>Brak zamówień</p>}
                {tabOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => (
                  <React.Fragment key={order.docId}>
                    <div className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0 }}>#{order.id}</h3>
                            {order.transportDate && <span style={{ fontSize: '11px', color: '#666' }}>📅 {order.transportDate}</span>}
                            {order.spakowane && <span style={{ fontSize: '10px', background: '#fff3cd', padding: '1px 6px', borderRadius: '4px' }}>📦 spak.</span>}
                            {order.wyslane && <span style={{ fontSize: '10px', background: '#d4edda', padding: '1px 6px', borderRadius: '4px' }}>🚚 wysł.</span>}
                            {order.dostarczone && <span style={{ fontSize: '10px', background: '#cce5ff', padding: '1px 6px', borderRadius: '4px' }}>✅ dost.</span>}
                          </div>
                          {order.uwagi && <p style={{ fontSize: '12px', color: '#1976d2', margin: '4px 0 0 0' }}>💬 {order.uwagi}</p>}
                        </div>
                        <span style={{ fontSize: '18px' }}>{selectedOrderId === order.id ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {selectedOrderId === order.id && (
                      <div className="card" style={{ borderLeft: `3px solid ${isRaben ? '#ff9800' : '#9c27b0'}` }}>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📅 Data transportu:</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold' }}>{order.transportDate || 'Brak'}</span>
                            {dateEditOrderId === order.id ? (
                              <>
                                <input type="date" defaultValue={order.transportDate || ''} onChange={e => handleSaveDateEdit(order.id, e.target.value)} style={{ padding: '4px' }} />
                                <button className="btn" onClick={() => setDateEditOrderId(null)} style={{ padding: '4px 8px', fontSize: '11px' }}>Anuluj</button>
                              </>
                            ) : (
                              <button className="btn" onClick={() => handlePasswordDateEdit(order.id)} disabled={isLoading} style={{ padding: '4px 8px', fontSize: '11px' }}>🔒 Zmień datę</button>
                            )}
                          </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>💬 Uwagi (widoczne na liście):</label>
                          <input type="text" maxLength={60} value={order.uwagi || ''} onChange={e => handleUpdateOrderField(order.id, 'uwagi', e.target.value)} placeholder="Krótka uwaga..." style={{ width: '100%' }} />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📝 Notatki:</label>
                          <textarea value={order.notatki || ''} onChange={e => handleUpdateOrderField(order.id, 'notatki', e.target.value)} placeholder="Dłuższa notatka..." style={{ width: '100%', height: '60px' }} />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📎 Załączniki:</label>
                          {canManage && (
                            <>
                              {!accessToken ? (
                                <button className="btn btn-primary" onClick={handleAuthorizeGoogle} disabled={isLoading} style={{ fontSize: '12px', width: '100%', marginBottom: '0.5rem' }}>🔐 Autoryzuj Google Drive</button>
                              ) : (
                                <button className="btn btn-primary" onClick={() => attachmentFileInputRef.current?.click()} disabled={isLoading} style={{ fontSize: '12px', marginBottom: '0.5rem' }}>📤 Dodaj plik</button>
                              )}
                              <input ref={attachmentFileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAttachment(order.id, f); e.target.value = ''; }} style={{ display: 'none' }} />
                            </>
                          )}
                          {(order.attachments || []).length === 0 && <p style={{ fontSize: '12px', color: '#999' }}>Brak załączników</p>}
                          {(order.attachments || []).map((att, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f0f0', padding: '6px 10px', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                              <a href={att.driveLink || '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>📄 {att.name}</a>
                              {canManage && <button className="btn btn-danger" onClick={() => handleDeleteAttachment(order.id, idx)} disabled={isLoading} style={{ padding: '2px 6px', fontSize: '10px' }}>✕</button>}
                            </div>
                          ))}
                        </div>

                        <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem', marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Status wysyłki:</label>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {checkboxes.map(cb => (
                              <label key={cb.key} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="checkbox" checked={order[cb.key] || false} onChange={() => handleToggleShipping(order.id, cb.key)} disabled={isLoading} />
                                {cb.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {allChecked(order) && (
                          <button className="btn btn-success" onClick={() => handleMoveToArchive(order.id)} disabled={isLoading} style={{ width: '100%' }}>🗄️ Przenieś do archiwum</button>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            );
          })()}

          {activeTab === 'admin' && (
            <div>
              <h2>⚙️ Administracja</h2>

              <div className="card">
                <h3>Dodaj użytkownika</h3>
                <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Imię i nazwisko" style={{ width: '100%', marginBottom: '0.5rem' }} />
                <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email" style={{ width: '100%', marginBottom: '0.5rem' }} />
                <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Hasło" style={{ width: '100%', marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dostęp do katalogów:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '1rem' }}>
                  {ACCESS_FOLDERS.map(f => (
                    <label key={f.key} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" checked={newUserAccess[f.key] || false} onChange={e => setNewUserAccess(prev => ({ ...prev, [f.key]: e.target.checked }))} />
                      {f.label}
                    </label>
                  ))}
                </div>
                <button className="btn btn-success" onClick={handleAddUser} disabled={isLoading} style={{ width: '100%' }}>Dodaj użytkownika</button>
              </div>

              <h3 style={{ marginTop: '1.5rem' }}>Użytkownicy ({users.filter(u => !u.deleted).length})</h3>
              {users.filter(u => !u.deleted).map(user => {
                const ua = getUserAccess(user);
                const isEditing = editingUserId === user.id;
                return (
                  <div key={user.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditing ? '1rem' : 0 }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                        {!isEditing && (
                          <div style={{ fontSize: '11px', color: '#2196F3', marginTop: '4px' }}>
                            {ACCESS_FOLDERS.filter(f => ua[f.key]).map(f => f.label).join(', ') || 'Brak dostępu'}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-primary" onClick={() => setEditingUserId(isEditing ? null : user.id)} style={{ padding: '4px 8px', fontSize: '11px' }}>{isEditing ? 'Zamknij' : 'Edytuj'}</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteUser(user.id)} style={{ padding: '4px 8px', fontSize: '11px' }}>Usuń</button>
                      </div>
                    </div>
                    {isEditing && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '0.75rem' }}>
                          {ACCESS_FOLDERS.map(f => (
                            <label key={f.key} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input type="checkbox" checked={ua[f.key] || false} onChange={e => {
                                const updated = { ...ua, [f.key]: e.target.checked };
                                handleUpdateUserAccess(user.id, updated);
                              }} />
                              {f.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
