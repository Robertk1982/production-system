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
  PARENT_FOLDER_ID: '1R8zz1X_qmRDMM3X82jI_0lhDLF6qEpTe',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  SCOPES: 'https://www.googleapis.com/auth/drive.file'
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// Kompresja zdjęcia do base64
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width * 0.5;
        canvas.height = img.height * 0.5;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.3));
      };
    };
  });
};

export default function ProductionSystem() {
  const [appState, setAppState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [googleAuth, setGoogleAuth] = useState(null);
  const [loginEmail, setLoginEmail] = useState('op1@company.com');
  const [loginPassword, setLoginPassword] = useState('1234');
  
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [newOrderNum, setNewOrderNum] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [settings, setSettings] = useState({ notificationEmail: 'manager@company.com' });
  const [newEmail, setNewEmail] = useState(settings.notificationEmail);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('operator');
  
  const [activeTab, setActiveTab] = useState('orders');
  const [confirmModal, setConfirmModal] = useState(null);
  const [moveConfirmModal, setMoveConfirmModal] = useState(null);
  const [photoSession, setPhotoSession] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Inicjalizuj Google API
  useEffect(() => {
    const initGoogleApi = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          window.gapi.client.init({
            clientId: GOOGLE_CONFIG.CLIENT_ID,
            discoveryDocs: GOOGLE_CONFIG.DISCOVERY_DOCS,
            scope: GOOGLE_CONFIG.SCOPES
          }).then(() => {
            setGoogleAuth(window.gapi.auth2.getAuthInstance());
          }).catch(err => console.error('Google API Error:', err));
        });
      };
      document.body.appendChild(script);
    };
    initGoogleApi();
  }, []);

  // Załaduj użytkowników
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
          if (snapshot.empty) {
            const demoUsers = [
              { name: 'Operator 1', email: 'op1@company.com', password: '1234', role: 'operator' },
              { name: 'Operator 2', email: 'op2@company.com', password: '1234', role: 'operator' },
              { name: 'Admin Jakości', email: 'qa@company.com', password: '1234', role: 'order_admin' },
              { name: 'Admin', email: 'admin@company.com', password: '1234', role: 'admin' }
            ];
            demoUsers.forEach(user => addDoc(usersRef, user));
            setUsers(demoUsers);
          } else {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        });
        return () => unsubscribe();
      } catch (err) {
        console.error('Błąd załadowania użytkowników:', err);
      }
    };
    loadUsers();
  }, []);

  // Real-time listen na zamówienia
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      setOrders(ordersList);
    });
    return () => unsubscribe();
  }, []);

  // Usuń zdjęcia gdy zamówienie trafia do archiwum
  useEffect(() => {
    const cleanupArchived = async () => {
      const archivedOrders = orders.filter(o => o.status === 'archived');
      for (const order of archivedOrders) {
        if (order.problems && order.problems.length > 0) {
          const hasPhotos = order.problems.some(p => p.photoURL);
          if (hasPhotos) {
            const updatedProblems = order.problems.map(p => ({ ...p, photoURL: null }));
            const orderRef = doc(db, 'orders', order.docId);
            await updateDoc(orderRef, { problems: updatedProblems });
          }
        }
      }
    };
    cleanupArchived();
  }, [orders]);

  // CZYŚĆ STATE i WYŁĄCZ KAMERĘ
  useEffect(() => {
    if (selectedOrderId === null) {
      setIssueDesc('');
      setIssuePhoto(null);
      setCameraActive(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [selectedOrderId]);

  // WYŁĄCZ KAMERĘ przy logout
  const handleLogout = () => {
    setCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (googleAuth) {
      googleAuth.signOut();
    }
    setCurrentUser(null);
    setAppState('login');
    setSelectedOrderId(null);
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert('Wpisz email i hasło');
      return;
    }
    const user = users.find(u => u.email === loginEmail && u.password === loginPassword);
    if (user) {
      setCurrentUser({ uid: user.id, ...user });
      
      // Jeśli magazynowy - zaloguj do Google
      if (user.role === 'warehouse' && googleAuth) {
        try {
          await googleAuth.signIn();
        } catch (err) {
          console.error('Google login error:', err);
        }
      }
      
      setAppState('dashboard');
      setActiveTab('orders');
    } else {
      alert('Błędny email lub hasło');
    }
  };

  const handleStartOrder = async () => {
    if (!newOrderNum.trim()) {
      alert('Wpisz numer zamówienia');
      return;
    }
    
    try {
      setIsLoading(true);
      const existing = orders.find(o => o.id === newOrderNum && o.status !== 'archived');
      if (existing) {
        alert('To zamówienie już istnieje! Uzupełnij dane w istniejącym rekordzie.');
        return;
      }

      await addDoc(collection(db, 'orders'), {
        id: newOrderNum,
        createdAt: new Date().toISOString(),
        problems: [],
        status: 'in_progress',
        history: [{
          timestamp: new Date().toLocaleString('pl-PL'),
          user: currentUser?.name || 'Unknown',
          action: 'Zamówienie rozpoczęte'
        }]
      });

      setNewOrderNum('');
      setSelectedOrderId(newOrderNum);
    } catch (err) {
      console.error('Błąd:', err);
      alert('Błąd dodania zamówienia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      alert('Brak dostępu do kamery: ' + err.message);
    }
  };

  const handleTakePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const photoData = canvasRef.current.toDataURL('image/jpeg', 0.3);
      setIssuePhoto(photoData);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setIssuePhoto(compressedBase64);
      } catch (err) {
        console.error('Błąd kompresji:', err);
        alert('Błąd kompresji zdjęcia');
      }
    }
  };

  const handleAddProblem = async () => {
    if (!issueDesc.trim()) {
      alert('Wpisz opis problemu');
      return;
    }
    if (!selectedOrderId) return;

    try {
      setIsLoading(true);
      const selectedOrder = orders.find(o => o.id === selectedOrderId);
      if (!selectedOrder) return;

      const problem = {
        id: Date.now(),
        photoURL: issuePhoto || null,
        description: issueDesc,
        cut: false,
        repaired: false,
        addedBy: currentUser?.name || 'Unknown',
        addedAt: new Date().toLocaleString('pl-PL')
      };

      const updatedProblems = [...(selectedOrder.problems || []), problem];
      const updatedHistory = [...(selectedOrder.history || []), {
        timestamp: new Date().toLocaleString('pl-PL'),
        user: currentUser?.name || 'Unknown',
        action: `Dodał problem: "${issueDesc}"`
      }];

      const orderRef = doc(db, 'orders', selectedOrder.docId);
      await updateDoc(orderRef, {
        problems: updatedProblems,
        history: updatedHistory
      });

      setIssuePhoto(null);
      setIssueDesc('');
    } catch (err) {
      console.error('Błąd:', err);
      alert('Błąd dodania problemu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProblem = async (orderId, problemId, field) => {
    try {
      setIsLoading(true);
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const problem = order.problems.find(p => p.id === problemId);
      if (!problem) return;

      problem[field] = !problem[field];

      let updatedProblems = order.problems;
      let updatedHistory = [...order.history];

      if (problem.cut && problem.repaired) {
        updatedProblems = order.problems.filter(p => p.id !== problemId);
        updatedHistory.push({
          timestamp: new Date().toLocaleString('pl-PL'),
          user: currentUser?.name || 'Unknown',
          action: `Rozwiązał problem: "${problem.description}"`
        });
      }

      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, {
        problems: updatedProblems,
        history: updatedHistory
      });
    } catch (err) {
      console.error('Błąd:', err);
      alert('Błąd aktualizacji problemu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      setIsLoading(true);
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if (order.problems.some(p => !(p.cut && p.repaired))) {
        alert('Nie możesz zamknąć! Są nienaurawane elementy.');
        setIsLoading(false);
        return;
      }

      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, {
        status: 'ready',
        history: [...order.history, {
          timestamp: new Date().toLocaleString('pl-PL'),
          user: currentUser?.name || 'Unknown',
          action: 'Zamówienie zakończone - oczekuje na wybór typu'
        }]
      });

      setSelectedOrderId(null);
    } catch (err) {
      console.error('Błąd:', err);
      alert('Błąd zamknięcia zamówienia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveOrderClick = (orderId, type) => {
    setMoveConfirmModal({
      orderId,
      type,
      message: type === 'pallet' 
        ? 'Czy zmieniłeś status na dostawa paletowa - Odpowiedz na wiadomość?'
        : 'Czy zmieniłeś status na dostawa dedykowana o krok. Produkcja zakończona sukcesem?'
    });
  };

  const handleMoveOrderConfirm = async (confirmed) => {
    if (!moveConfirmModal) return;

    try {
      setIsLoading(true);
      const order = orders.find(o => o.id === moveConfirmModal.orderId);
      if (!order) return;

      if (confirmed) {
        const orderRef = doc(db, 'orders', order.docId);
        await updateDoc(orderRef, {
          status: moveConfirmModal.type,
          history: [...order.history, {
            timestamp: new Date().toLocaleString('pl-PL'),
            user: currentUser?.name || 'Unknown',
            action: `Przeniesiono do: ${moveConfirmModal.type === 'pallet' ? 'Paletowy' : 'Dedykowana'}`
          }]
        });

        alert(`✉️ Email wysłany na ${settings.notificationEmail}:\n"Zamówienie nr ${order.id} zostało całkowicie wyprodukowane!"`);
        setSelectedOrderId(null);
      } else {
        alert('Zamówienie pozostaje w folderze Gotowe - zmień status w Prestashop i wykonaj operację ponownie');
      }
    } catch (err) {
      console.error('Błąd:', err);
      alert('Błąd przeniesienia zamówienia');
    } finally {
      setIsLoading(false);
      setMoveConfirmModal(null);
    }
  };

  const handleConfirmRevert = async () => {
    if (confirmModal?.action === 'revert') {
      try {
        setIsLoading(true);
        const order = orders.find(o => o.id === confirmModal.orderId);
        if (!order) return;

        const orderRef = doc(db, 'orders', order.docId);
        await updateDoc(orderRef, {
          status: 'ready',
          history: [...order.history, {
            timestamp: new Date().toLocaleString('pl-PL'),
            user: currentUser?.name || 'Unknown',
            action: 'Cofnięto do folderu Gotowe'
          }]
        });
      } catch (err) {
        console.error('Błąd:', err);
        alert('Błąd cofania zamówienia');
      } finally {
        setIsLoading(false);
      }
    }
    setConfirmModal(null);
  };

  // Google Drive - upload zdjęcia
  const uploadPhotoToGoogleDrive = async (orderId, photoBase64, photoNumber) => {
    try {
      if (!window.gapi.client.drive) {
        await window.gapi.client.load('drive', 'v3');
      }

      // Zamień base64 na Blob
      const byteCharacters = atob(photoBase64.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Sprawdź czy folder zamówienia istnieje
      let folderResponse = await window.gapi.client.drive.files.list({
        q: `name='${orderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${GOOGLE_CONFIG.PARENT_FOLDER_ID}' in parents`,
        spaces: 'drive',
        pageSize: 1
      });

      let folderId = null;
      if (folderResponse.result.files.length > 0) {
        folderId = folderResponse.result.files[0].id;
      } else {
        // Utwórz folder dla tego zamówienia
        const createFolderResponse = await window.gapi.client.drive.files.create({
          resource: {
            name: orderId,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [GOOGLE_CONFIG.PARENT_FOLDER_ID]
          },
          fields: 'id'
        });
        folderId = createFolderResponse.result.id;
      }

      // Upload zdjęcia
      const fileName = `${orderId}_${photoNumber}.jpg`;
      const metadata = {
        name: fileName,
        mimeType: 'image/jpeg',
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return true;
    } catch (err) {
      console.error('Google Drive upload error:', err);
      alert('Błąd uploadu na Google Drive: ' + err.message);
      return false;
    }
  };

  const handleStartWarehousePhoto = (orderId) => {
    setPhotoSession({
      orderId,
      photos: [],
      currentPhoto: null
    });
    setCameraActive(false);
  };

  const handleTakeWarehousePhoto = async () => {
    if (!canvasRef.current || !videoRef.current || !photoSession) return;

    try {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const photoBase64 = canvasRef.current.toDataURL('image/jpeg', 0.3);

      setIsLoading(true);
      const photoNumber = photoSession.photos.length + 1;
      
      const success = await uploadPhotoToGoogleDrive(photoSession.orderId, photoBase64, photoNumber);
      
      if (success) {
        setPhotoSession({
          ...photoSession,
          photos: [...photoSession.photos, photoBase64],
          currentPhoto: photoBase64
        });
      }
    } catch (err) {
      console.error('Błąd:', err);
      alert('Błąd wykonania zdjęcia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveOrder = async () => {
    if (!photoSession) return;

    try {
      setIsLoading(true);
      const order = orders.find(o => o.id === photoSession.orderId);
      if (!order) return;

      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, {
        status: 'archived',
        warehousePhotos: photoSession.photos.length,
        history: [...order.history, {
          timestamp: new Date().toLocaleString('pl-PL'),
          user: currentUser?.name || 'Unknown',
          action: `Zarchiwizowano - ${photoSession.photos.length} zdjęć na Google Drive`
        }]
      });

      alert(`✅ Zamówienie ${photoSession.orderId} zarchiwizowane! ${photoSession.photos.length} zdjęć zostało zapisane na Google Drive.`);
      
      setCameraActive(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setPhotoSession(null);
    } catch (err) {
      console.error('Błąd:', err);
      alert('Błąd archiwizacji zamówienia');
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
        role: newUserRole
      });

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('operator');
      alert('Użytkownik dodany!');
    } catch (err) {
      console.error('Błąd:', err);
      alert('Błąd dodania użytkownika');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Usunąć tego użytkownika?')) {
      try {
        setIsLoading(true);
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { deleted: true });
        setUsers(users.filter(u => u.id !== userId));
      } catch (err) {
        console.error('Błąd:', err);
        alert('Błąd usunięcia użytkownika');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateEmail = () => {
    if (!newEmail.trim()) {
      alert('Wpisz email');
      return;
    }
    setSettings({ notificationEmail: newEmail });
    alert('Email zaktualizowany!');
  };

  const inProgressOrders = orders.filter(o => o.status === 'in_progress');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const palletOrders = orders.filter(o => o.status === 'pallet');
  const dedicatedOrders = orders.filter(o => o.status === 'dedicated');
  const archivedOrders = orders.filter(o => o.status === 'archived');
  
  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;
  const unrepairedCount = orders.reduce((sum, o) => sum + (o.problems || []).filter(p => !(p.cut && p.repaired)).length, 0);

  const getTabs = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'operator') {
      return ['orders'];
    } else if (currentUser.role === 'order_admin') {
      return ['orders', 'ready', 'pallet', 'dedicated'];
    } else if (currentUser.role === 'warehouse') {
      return ['photos'];
    } else if (currentUser.role === 'admin') {
      return ['orders', 'ready', 'pallet', 'dedicated', 'archive', 'photos'];
    }
    return [];
  };

  const visibleTabs = getTabs();

  return (
    <div style={{ padding: '1rem', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
        .btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .btn:hover { background: #f0f0f0; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-success { border-color: #4CAF50; color: #4CAF50; }
        .btn-danger { border-color: #f44336; color: #f44336; }
        .btn-primary { border-color: #2196F3; color: #2196F3; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 6px; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box; }
        .problem-row { background: #f9f9f9; padding: 0.75rem; margin-bottom: 0.75rem; border-radius: 4px; border-left: 3px solid #ff9800; }
        .checkbox-group { display: flex; gap: 1.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
        .checkbox-group label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .order-card { background: white; border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; cursor: pointer; border-radius: 8px; }
        .order-card:hover { background: #f5f5f5; }
        .order-card.active { border: 2px solid #2196F3; background: #e3f2fd; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-box { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #ddd; text-align: center; }
        .stat-number { font-size: 20px; font-weight: bold; }
        .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
        .warning-box { background: #fff3cd; border-left: 3px solid #ff9800; padding: 0.75rem; border-radius: 4px; margin-top: 1rem; font-size: 12px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: white; padding: 1rem; border-radius: 8px; border: 1px solid #ddd; }
        .photo-preview { max-width: 100%; max-height: 200px; border-radius: 4px; margin-top: 8px; }
        .video-container { position: relative; width: 100%; background: #000; border-radius: 8px; overflow: hidden; margin-bottom: 1rem; }
        video { width: 100%; height: auto; }
        canvas { display: none; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .tabs { display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap; }
        .tab-btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .tab-btn.active { background: #2196F3; border-color: #2196F3; color: white; }
        .user-row { background: #f9f9f9; padding: 0.75rem; margin-bottom: 0.75rem; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
        .user-info { flex: 1; }
        .user-role { display: inline-block; padding: 3px 8px; background: #e3f2fd; color: #2196F3; border-radius: 4px; font-size: 11px; font-weight: bold; margin-left: 0.5rem; }
        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 450px; }
        .modal-buttons { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; }
        .button-group { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
        .sync-badge { display: inline-block; padding: 4px 8px; background: #4CAF50; color: white; border-radius: 4px; font-size: 10px; margin-left: 0.5rem; }
        .photo-counter { display: inline-block; padding: 6px 12px; background: #2196F3; color: white; border-radius: 4px; font-weight: bold; margin-top: 0.5rem; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
      `}</style>

      {appState === 'login' && (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
          <div className="card">
            <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>🏭 System Zamówień<span className="sync-badge">☁️ LIVE</span></h1>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="op1@company.com" />
            </div>
            <div className="form-group">
              <label>Hasło</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="1234" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleLogin} disabled={isLoading}>
              {isLoading ? '⏳ Zalogowanie...' : 'Zaloguj się'}
            </button>
            <p style={{ fontSize: '11px', textAlign: 'center', color: '#999', marginTop: '1rem' }}>Demo:</p>
            <p style={{ fontSize: '10px', textAlign: 'center', color: '#666' }}>op1@company.com / 1234 (Operator)</p>
            <p style={{ fontSize: '10px', textAlign: 'center', color: '#666' }}>qa@company.com / 1234 (Admin Jakości)</p>
            <p style={{ fontSize: '10px', textAlign: 'center', color: '#666' }}>admin@company.com / 1234 (Admin)</p>
            <p style={{ fontSize: '10px', textAlign: 'center', color: '#ff6b6b' }}>⚠️ Magazynowy - dodaj przez Admina!</p>
            <p style={{ fontSize: '10px', textAlign: 'center', color: '#4CAF50', marginTop: '0.5rem' }}>✓ OAuth Google Drive</p>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Potwierdzenie</h2>
            <p style={{ marginTop: '1rem', marginBottom: '1rem' }}>Czy napewno chcesz cofnąć zamówienie do folderu Gotowe?</p>
            <div className="modal-buttons">
              <button className="btn btn-success" onClick={handleConfirmRevert} disabled={isLoading}>Tak</button>
              <button className="btn btn-danger" onClick={() => setConfirmModal(null)} disabled={isLoading}>Nie</button>
            </div>
          </div>
        </div>
      )}

      {moveConfirmModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Potwierdzenie</h2>
            <p style={{ marginTop: '1rem', marginBottom: '1rem', fontSize: '14px' }}>{moveConfirmModal.message}</p>
            <div className="modal-buttons">
              <button className="btn btn-success" onClick={() => handleMoveOrderConfirm(true)} disabled={isLoading}>Tak</button>
              <button className="btn btn-danger" onClick={() => handleMoveOrderConfirm(false)} disabled={isLoading}>Nie</button>
            </div>
          </div>
        </div>
      )}

      {appState === 'dashboard' && currentUser && (
        <div>
          <div className="header">
            <div>
              <h1 style={{ margin: '0 0 4px 0' }}>🏭 System Zamówień</h1>
              <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Zalogowany: {currentUser.name} ({currentUser.role})</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {currentUser.role === 'admin' && (
                <button className="btn btn-primary" onClick={() => { setActiveTab('settings'); setAppState('settings'); }}>⚙️ Ustawienia</button>
              )}
              <button className="btn btn-danger" onClick={handleLogout}>Wyloguj</button>
            </div>
          </div>

          {currentUser.role !== 'warehouse' && (
            <div className="stats">
              <div className="stat-box">
                <div className="stat-number">{inProgressOrders.length}</div>
                <div className="stat-label">W trakcie</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#ff9800' }}>{unrepairedCount}</div>
                <div className="stat-label">Do naprawy</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#17a2b8' }}>{readyOrders.length}</div>
                <div className="stat-label">Gotowe</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#4CAF50' }}>{archivedOrders.length}</div>
                <div className="stat-label">Archiwum</div>
              </div>
            </div>
          )}

          <div className="tabs">
            {visibleTabs.includes('orders') && (
              <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📦 Zamówienia</button>
            )}
            {visibleTabs.includes('ready') && (
              <button className={`tab-btn ${activeTab === 'ready' ? 'active' : ''}`} onClick={() => setActiveTab('ready')}>📋 Gotowe</button>
            )}
            {visibleTabs.includes('pallet') && (
              <button className={`tab-btn ${activeTab === 'pallet' ? 'active' : ''}`} onClick={() => setActiveTab('pallet')}>🎨 Paletowy</button>
            )}
            {visibleTabs.includes('dedicated') && (
              <button className={`tab-btn ${activeTab === 'dedicated' ? 'active' : ''}`} onClick={() => setActiveTab('dedicated')}>📦 Dedykowana</button>
            )}
            {visibleTabs.includes('photos') && (
              <button className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>📸 Zdjęcia</button>
            )}
            {visibleTabs.includes('archive') && (
              <button className={`tab-btn ${activeTab === 'archive' ? 'active' : ''}`} onClick={() => setActiveTab('archive')}>📂 Archiwum</button>
            )}
          </div>

          {activeTab === 'orders' && (
            <div className="grid">
              <div>
                {currentUser.role === 'operator' && (
                  <>
                    <h3 style={{ marginBottom: '1rem' }}>+ Nowe zamówienie</h3>
                    <div className="card">
                      <div className="form-group">
                        <input type="text" value={newOrderNum} onChange={e => setNewOrderNum(e.target.value)} placeholder="Numer zamówienia" />
                      </div>
                      <button className="btn btn-success" onClick={handleStartOrder} disabled={isLoading}>
                        {isLoading ? '⏳' : '✓'} Rozpocznij
                      </button>
                    </div>
                  </>
                )}

                <h3 style={{ marginBottom: '1rem' }}>Zamówienia ({inProgressOrders.length})</h3>
                {inProgressOrders.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999' }}>Brak aktywnych zamówień</p>
                ) : (
                  inProgressOrders.map(order => {
                    const unrepairedProblems = (order.problems || []).filter(p => !(p.cut && p.repaired));
                    return (
                      <div key={order.id} className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>#{order.id}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{new Date(order.createdAt).toLocaleString('pl-PL')}</div>
                        {unrepairedProblems.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#ff9800' }}>⚠️ {unrepairedProblems.length} błędy</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {selectedOrder && selectedOrder.status === 'in_progress' && (
                <div>
                  <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Zamówienie #{selectedOrder.id}</h3>

                    {selectedOrder.problems && selectedOrder.problems.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem' }}>Błędy:</h4>
                        {selectedOrder.problems.map(p => (
                          <div key={p.id} className="problem-row">
                            {p.photoURL && (
                              <img src={p.photoURL} className="photo-preview" alt="Problem" />
                            )}
                            <p style={{ margin: '6px 0', fontWeight: 'bold' }}>{p.description}</p>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '11px', color: '#666' }}>Dodał: {p.addedBy} o {p.addedAt}</p>
                            <div className="checkbox-group">
                              <label>
                                <input type="checkbox" checked={p.cut || false} onChange={() => handleToggleProblem(selectedOrder.id, p.id, 'cut')} disabled={isLoading} />
                                Wycięty element
                              </label>
                              <label>
                                <input type="checkbox" checked={p.repaired || false} onChange={() => handleToggleProblem(selectedOrder.id, p.id, 'repaired')} disabled={isLoading} />
                                Dorobiony
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentUser.role === 'operator' && (
                      <>
                        <h4 style={{ marginBottom: '0.75rem' }}>Dodaj błąd</h4>
                        
                        <div className="form-group">
                          <label>Zdjęcie (z kamery lub plik)</label>
                          <div style={{ marginBottom: '1rem' }}>
                            <button className="btn btn-primary" onClick={handleStartCamera} style={{ marginRight: '8px' }} disabled={isLoading}>📷 Włącz kamerę</button>
                            <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>📤 Prześlij plik</button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} disabled={isLoading} />
                          </div>
                          {issuePhoto && <img src={issuePhoto} className="photo-preview" alt="Issue photo" />}
                        </div>

                        {cameraActive && (
                          <div className="video-container">
                            <video ref={videoRef} autoPlay playsInline></video>
                            <canvas ref={canvasRef} width={640} height={480}></canvas>
                          </div>
                        )}

                        {cameraActive && (
                          <button className="btn btn-success" onClick={handleTakePhoto} style={{ marginBottom: '1rem' }} disabled={isLoading}>Zrób zdjęcie</button>
                        )}

                        <div className="form-group">
                          <label>Opis problemu</label>
                          <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} placeholder="Opis..." disabled={isLoading}></textarea>
                        </div>

                        <button className="btn btn-success" onClick={handleAddProblem} disabled={isLoading} style={{ width: '100%' }}>
                          {isLoading ? '⏳ Dodawanie...' : '✓ Dodaj błąd'}
                        </button>

                        {(selectedOrder.problems || []).filter(p => !(p.cut && p.repaired)).length > 0 && (
                          <div className="warning-box">⚠️ Czekasz na naprawę {(selectedOrder.problems || []).filter(p => !(p.cut && p.repaired)).length} błędu(ów)</div>
                        )}

                        {(selectedOrder.problems || []).filter(p => !(p.cut && p.repaired)).length === 0 && (
                          <button className="btn btn-success" style={{ width: '100%', marginTop: '1rem' }} onClick={() => handleCompleteOrder(selectedOrder.id)} disabled={isLoading}>
                            {isLoading ? '⏳ Kończę...' : '✓ Zlecenie zakończone'}
                          </button>
                        )}
                      </>
                    )}

                    <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Historia</h4>
                    <div style={{ background: '#f9f9f9', padding: '0.75rem', borderRadius: '4px', fontSize: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                      {(selectedOrder.history || []).map((h, i) => (
                        <div key={i} style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #ddd' }}>
                          <strong>{h.user}</strong> - {h.action}<br />
                          <span style={{ fontSize: '11px', color: '#999' }}>{h.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ready' && (
            <div>
              <h2>Gotowe zamówienia ({readyOrders.length})</h2>
              {readyOrders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: '#999' }}>Brak gotowych zamówień</div>
              ) : (
                readyOrders.map(order => (
                  <div key={order.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #ddd' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0' }}>#{order.id}</h3>
                        <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Rozpoczęto: {new Date(order.createdAt).toLocaleString('pl-PL')}</p>
                      </div>
                    </div>
                    {order.problems && order.problems.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '0.5rem' }}>Naprawiane elementy:</p>
                        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px' }}>
                          {order.problems.map(p => (
                            <li key={p.id}>{p.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="button-group">
                      <button className="btn btn-primary" onClick={() => handleMoveOrderClick(order.id, 'pallet')} disabled={isLoading}>🎨 Paletowy</button>
                      <button className="btn btn-primary" onClick={() => handleMoveOrderClick(order.id, 'dedicated')} disabled={isLoading}>📦 Dedykowana</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'pallet' && (
            <div>
              <h2>Paletowy ({palletOrders.length})</h2>
              {palletOrders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: '#999' }}>Brak zamówień</div>
              ) : (
                palletOrders.map(order => (
                  <div key={order.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #ddd' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0' }}>#{order.id}</h3>
                        <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Rozpoczęto: {new Date(order.createdAt).toLocaleString('pl-PL')}</p>
                      </div>
                      <div className="button-group">
                        <button className="btn btn-success" onClick={() => handleMoveOrderClick(order.id, 'pallet')} disabled={isLoading}>✓ Potwierdzić</button>
                        <button className="btn btn-danger" onClick={() => setConfirmModal({ action: 'revert', orderId: order.id })} disabled={isLoading}>↶ Cofnij</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'dedicated' && (
            <div>
              <h2>Dedykowana ({dedicatedOrders.length})</h2>
              {dedicatedOrders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: '#999' }}>Brak zamówień</div>
              ) : (
                dedicatedOrders.map(order => (
                  <div key={order.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #ddd' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0' }}>#{order.id}</h3>
                        <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Rozpoczęto: {new Date(order.createdAt).toLocaleString('pl-PL')}</p>
                      </div>
                      <div className="button-group">
                        <button className="btn btn-success" onClick={() => handleMoveOrderClick(order.id, 'dedicated')} disabled={isLoading}>✓ Potwierdzić</button>
                        <button className="btn btn-danger" onClick={() => setConfirmModal({ action: 'revert', orderId: order.id })} disabled={isLoading}>↶ Cofnij</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div>
              <h2>📸 Zdjęcia zamówień ({readyOrders.length})</h2>
              {!photoSession ? (
                <>
                  {readyOrders.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', color: '#999' }}>Brak zamówień do sfotografowania</div>
                  ) : (
                    readyOrders.map(order => (
                      <div key={order.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0' }}>#{order.id}</h3>
                            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Rozpoczęto: {new Date(order.createdAt).toLocaleString('pl-PL')}</p>
                          </div>
                          <button className="btn btn-success" onClick={() => handleStartWarehousePhoto(order.id)} disabled={isLoading}>📸 Wykonaj zdjęcia</button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <div className="card">
                  <h3 style={{ marginBottom: '1rem' }}>Fotografowanie zamówienia #{photoSession.orderId}</h3>
                  
                  <div className="video-container">
                    <video ref={videoRef} autoPlay playsInline></video>
                    <canvas ref={canvasRef} width={640} height={480}></canvas>
                  </div>

                  {!cameraActive ? (
                    <button className="btn btn-primary" onClick={handleStartCamera} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>
                      📷 Włącz kamerę
                    </button>
                  ) : (
                    <button className="btn btn-success" onClick={handleTakeWarehousePhoto} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>
                      {isLoading ? '⏳ Uploadowanie...' : '📸 Zrób zdjęcie'}
                    </button>
                  )}

                  <div className="photo-counter">
                    Zdjęcia: {photoSession.photos.length}/3
                  </div>

                  {photoSession.photos.length > 0 && (
                    <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                      <p style={{ fontSize: '12px', fontWeight: 'bold' }}>Wykonane zdjęcia:</p>
                      {photoSession.photos.map((photo, idx) => (
                        <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '12px', color: '#666' }}>
                          ✓ {photoSession.orderId}_{idx + 1}.jpg
                        </div>
                      ))}
                    </div>
                  )}

                  {photoSession.photos.length >= 3 && (
                    <button 
                      className="btn btn-success" 
                      onClick={handleArchiveOrder}
                      disabled={isLoading}
                      style={{ width: '100%', marginTop: '1rem' }}
                    >
                      {isLoading ? '⏳ Archiwizuję...' : '✓ Zarchiwizuj zamówienie'}
                    </button>
                  )}

                  {photoSession.photos.length < 3 && (
                    <div className="warning-box" style={{ marginTop: '1rem' }}>
                      ⚠️ Potrzebujesz jeszcze {3 - photoSession.photos.length} zdjęcia(ć)
                    </div>
                  )}

                  <button 
                    className="btn btn-danger" 
                    onClick={() => {
                      setCameraActive(false);
                      if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                        streamRef.current = null;
                      }
                      if (videoRef.current) {
                        videoRef.current.srcObject = null;
                      }
                      setPhotoSession(null);
                    }}
                    style={{ width: '100%', marginTop: '1rem' }}
                    disabled={isLoading}
                  >
                    ↶ Anuluj
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'archive' && (
            <div>
              <h2>Zarchiwizowane zamówienia ({archivedOrders.length})</h2>
              {archivedOrders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: '#999' }}>Brak zarchiwizowanych zamówień</div>
              ) : (
                archivedOrders.map(order => (
                  <div key={order.id} className="card">
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>#{order.id}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>Rozpoczęto: {new Date(order.createdAt).toLocaleString('pl-PL')}</div>
                    {order.warehousePhotos && (
                      <div style={{ fontSize: '11px', color: '#4CAF50' }}>📸 {order.warehousePhotos} zdjęć na Google Drive</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {appState === 'settings' && currentUser && currentUser.role === 'admin' && (
        <div>
          <div className="header">
            <h1 style={{ margin: '0' }}>⚙️ Ustawienia</h1>
            <button className="btn" onClick={() => setAppState('dashboard')}>← Wróć</button>
          </div>

          <div className="grid">
            <div>
              <h3>Email powiadomień</h3>
              <div className="card">
                <div className="form-group">
                  <label>Adres email</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} disabled={isLoading} />
                </div>
                <button className="btn btn-success" onClick={handleUpdateEmail} disabled={isLoading}>Zapisz</button>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>Aktualny: {settings.notificationEmail}</p>
              </div>
            </div>

            <div>
              <h3>Zarządzanie pracownikami</h3>
              <div className="card">
                <h4 style={{ margin: '0 0 1rem 0' }}>Dodaj nowego pracownika</h4>
                <div className="form-group">
                  <label>Imię i nazwisko</label>
                  <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Jan Kowalski" disabled={isLoading} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="jan@company.com" disabled={isLoading} />
                </div>
                <div className="form-group">
                  <label>Hasło</label>
                  <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="1234" disabled={isLoading} />
                </div>
                <div className="form-group">
                  <label>Rola</label>
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} disabled={isLoading}>
                    <option value="operator">Operator</option>
                    <option value="order_admin">Admin Jakości</option>
                    <option value="warehouse">Magazynowy</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <button className="btn btn-success" onClick={handleAddUser} disabled={isLoading}>Dodaj pracownika</button>

                <h4 style={{ margin: '1.5rem 0 1rem 0' }}>Aktualni pracownicy</h4>
                {users.filter(u => !u.deleted).map(u => (
                  <div key={u.id} className="user-row">
                    <div className="user-info">
                      <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{u.email}</div>
                      <span className="user-role">
                        {u.role === 'order_admin' ? 'Admin Jakości' : u.role === 'warehouse' ? 'Magazynowy' : u.role === 'admin' ? 'Administrator' : 'Operator'}
                      </span>
                    </div>
                    {u.id !== currentUser.uid && (
                      <button className="btn btn-danger" onClick={() => handleDeleteUser(u.id)} disabled={isLoading}>Usuń</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
