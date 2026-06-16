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
  CLIENT_ID: '736317012952-856e5b7qsgqq346845eb7kgu4qokq49d.apps.googleusercontent.com'
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

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
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const warehouseFileInputRef = useRef(null);
  const streamRef = useRef(null);
  const tokenClientRef = useRef(null);

  // INIT - Load Google API + Users + Orders
  useEffect(() => {
    // Load Google API
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // Load saved token
    const savedToken = localStorage.getItem('google_access_token');
    if (savedToken) setAccessToken(savedToken);

    // Load users
    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      if (snapshot.empty) {
        const demoUsers = [
          { name: 'Operator 1', email: 'op1@company.com', password: '1234', role: 'operator' },
          { name: 'Operator 2', email: 'op2@company.com', password: '1234', role: 'operator' },
          { name: 'Admin Jakości', email: 'qa@company.com', password: '1234', role: 'order_admin' },
          { name: 'Admin', email: 'admin@company.com', password: '1234', role: 'admin' }
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
      alert('Błędne dane');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppState('login');
    stopCamera();
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // ===== ZAMÓWIENIA =====

  const handleStartOrder = async () => {
    if (!newOrderNum.trim()) {
      alert('Wpisz numer');
      return;
    }
    try {
      setIsLoading(true);
      if (orders.find(o => o.id === newOrderNum && o.status !== 'archived')) {
        alert('Istnieje');
        return;
      }
      await addDoc(collection(db, 'orders'), {
        id: newOrderNum,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        problems: [],
        photoCount: 0,
        photoArchived: false
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
        video: { facingMode: 'environment', width: { max: 1920, min: 640 }, height: { max: 1080, min: 480 } }
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
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    setIssuePhoto(canvasRef.current.toDataURL('image/jpeg', 0.7));
  };

  const handleAddProblem = async () => {
    if (!issueDesc.trim()) {
      alert('Wpisz opis');
      return;
    }
    try {
      setIsLoading(true);
      const order = orders.find(o => o.id === selectedOrderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, {
        problems: [...(order.problems || []), { id: Date.now(), description: issueDesc, photoURL: issuePhoto, cut: false, repaired: false }]
      });
      setIssueDesc('');
      setIssuePhoto(null);
    } catch (err) {
      alert('Błąd');
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
      alert('Błąd');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      if ((order.problems || []).some(p => !(p.cut && p.repaired))) {
        alert('Są nienaprawione elementy');
        return;
      }
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { status: 'ready' });
      setSelectedOrderId(null);
    } catch (err) {
      alert('Błąd');
    }
  };

  // ===== GOTOWE =====

  const handleMoveFromReady = async (orderId, newStatus) => {
    if (!window.confirm(`Przenieść do ${newStatus}?`)) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (err) {
      alert('Błąd');
    }
  };

  const handleRevertFromReady = async (orderId) => {
    if (!window.confirm('Cofnąć?')) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { status: 'in_progress' });
    } catch (err) {
      alert('Błąd');
    }
  };

  // ===== ZDJĘCIA =====

  const uploadToGoogleDrive = async (orderId, photoBase64, photoNumber) => {
    if (!accessToken) return false;
    try {
      const byteCharacters = atob(photoBase64.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${orderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&pageSize=1`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const searchData = await searchResponse.json();
      let folderId;

      if (searchData.files && searchData.files.length > 0) {
        folderId = searchData.files[0].id;
      } else {
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: orderId, mimeType: 'application/vnd.google-apps.folder' })
        });
        const folderData = await createResponse.json();
        folderId = folderData.id;
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

      return uploadResponse.ok;
    } catch (err) {
      console.error('Upload error:', err);
      return false;
    }
  };

  const handleAuthorizeGoogle = () => {
    if (!window.google) {
      alert('Google API się ładuje');
      return;
    }

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CONFIG.CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive',
      callback: (response) => {
        if (response.access_token) {
          setAccessToken(response.access_token);
          localStorage.setItem('google_access_token', response.access_token);
          alert('✅ Autoryzacja OK!');
        }
      },
      error_callback: (error) => alert('Błąd: ' + (error.message || JSON.stringify(error)))
    });

    tokenClientRef.current.requestAccessToken();
  };

  const handleStartPhotoSession = (orderId) => {
    setPhotoSession({ orderId, photos: [] });
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
      } else {
        alert('Upload na Drive nie powiódł się');
      }
    } catch (err) {
      alert('Błąd: ' + err.message);
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
      } else {
        alert('Upload na Drive nie powiódł się');
      }
    } catch (err) {
      alert('Błąd');
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
      alert('Min 3 zdjęcia');
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
        status: 'archived'
      });

      stopCamera();
      setPhotoSession(null);
      alert('✓ Zdjęcia zarchiwizowane!');
    } catch (err) {
      alert('Błąd: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FILTERS =====

  const inProgressOrders = orders.filter(o => o.status === 'in_progress');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const palletOrders = orders.filter(o => o.status === 'pallet');
  const dedicatedOrders = orders.filter(o => o.status === 'dedicated');
  const archivedOrders = orders.filter(o => o.status === 'archived');

  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

  const getTabs = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'operator') return ['orders'];
    if (currentUser.role === 'order_admin') return ['orders', 'ready', 'pallet', 'dedicated'];
    if (currentUser.role === 'warehouse') return ['photos'];
    if (currentUser.role === 'admin') return ['orders', 'ready', 'pallet', 'dedicated', 'photos', 'archive'];
    return [];
  };

  const visibleTabs = getTabs();

  return (
    <div style={{ padding: '1rem', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Arial' }}>
      <style>{`
        .card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
        .btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; }
        .btn:disabled { opacity: 0.5; }
        .btn-success { border-color: #4CAF50; color: #4CAF50; }
        .btn-danger { border-color: #f44336; color: #f44336; }
        .btn-primary { border-color: #2196F3; color: #2196F3; }
        .form-group { margin-bottom: 1rem; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        .order-card { background: white; border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; cursor: pointer; border-radius: 8px; }
        .order-card.active { border: 2px solid #2196F3; background: #e3f2fd; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: white; padding: 1rem; border-radius: 8px; border: 1px solid #ddd; }
        .tabs { display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap; }
        .tab-btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; }
        .tab-btn.active { background: #2196F3; border-color: #2196F3; color: white; }
        .photo-preview { max-width: 100%; max-height: 150px; border-radius: 4px; margin: 0.5rem 0; }
        video { width: 100%; height: auto; }
        canvas { display: none; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .photo-item { background: #f0f0f0; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
      `}</style>

      {appState === 'login' && (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
          <div className="card">
            <h1 style={{ textAlign: 'center' }}>🏭 System v16</h1>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={{ width: '100%', marginBottom: '1rem' }} />
            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={{ width: '100%', marginBottom: '1rem' }} />
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
            {visibleTabs.includes('orders') && <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📦 Zamówienia</button>}
            {visibleTabs.includes('ready') && <button className={`tab-btn ${activeTab === 'ready' ? 'active' : ''}`} onClick={() => setActiveTab('ready')}>📋 Gotowe</button>}
            {visibleTabs.includes('pallet') && <button className={`tab-btn ${activeTab === 'pallet' ? 'active' : ''}`} onClick={() => setActiveTab('pallet')}>🎨 Paletowy</button>}
            {visibleTabs.includes('dedicated') && <button className={`tab-btn ${activeTab === 'dedicated' ? 'active' : ''}`} onClick={() => setActiveTab('dedicated')}>📦 Dedykowana</button>}
            {visibleTabs.includes('photos') && <button className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>📸 Zdjęcia</button>}
            {visibleTabs.includes('archive') && <button className={`tab-btn ${activeTab === 'archive' ? 'active' : ''}`} onClick={() => setActiveTab('archive')}>📂 Archiwum2</button>}
          </div>

          {activeTab === 'orders' && (
            <div className="grid">
              <div>
                {currentUser.role === 'operator' && (
                  <div className="card">
                    <h3>Nowe zamówienie</h3>
                    <input type="text" value={newOrderNum} onChange={e => setNewOrderNum(e.target.value)} placeholder="Numer" style={{ width: '100%', marginBottom: '1rem' }} />
                    <button className="btn btn-success" onClick={handleStartOrder} disabled={isLoading} style={{ width: '100%' }}>Rozpocznij</button>
                  </div>
                )}

                <h3>Zamówienia ({inProgressOrders.length})</h3>
                {inProgressOrders.map(order => (
                  <div key={order.docId} className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                    <div style={{ fontWeight: 'bold' }}>#{order.id}</div>
                    {order.problems?.some(p => !(p.cut && p.repaired)) && <div style={{ fontSize: '11px', color: '#ff9800' }}>⚠️ {order.problems.filter(p => !(p.cut && p.repaired)).length} błędy</div>}
                  </div>
                ))}
              </div>

              {selectedOrder && (
                <div>
                  <div className="card">
                    <h3>#{selectedOrder.id}</h3>

                    {selectedOrder.problems?.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4>Błędy:</h4>
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

                    {currentUser.role === 'operator' && (
                      <>
                        <h4>Dodaj błąd</h4>
                        <button className="btn btn-primary" onClick={handleStartCamera} style={{ marginRight: '0.5rem' }} disabled={isLoading}>📷 Kamera</button>
                        <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>📤 Plik</button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) compressImage(f).then(setIssuePhoto).catch(() => alert('Błąd')); }} style={{ display: 'none' }} />

                        {cameraActive && <video ref={videoRef} autoPlay playsInline style={{ width: '100%', marginTop: '1rem' }}></video>}
                        {cameraActive && <button className="btn btn-success" onClick={handleTakePhoto} style={{ width: '100%', marginTop: '0.5rem' }} disabled={isLoading}>Zrób zdjęcie</button>}

                        <canvas ref={canvasRef}></canvas>
                        {issuePhoto && <img src={issuePhoto} className="photo-preview" alt="Issue" />}

                        <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} placeholder="Opis" style={{ width: '100%', height: '80px', marginTop: '1rem', marginBottom: '1rem' }} />
                        <button className="btn btn-success" onClick={handleAddProblem} disabled={isLoading} style={{ width: '100%' }}>Dodaj błąd</button>

                        {!selectedOrder.problems?.some(p => !(p.cut && p.repaired)) && (
                          <button className="btn btn-success" onClick={() => handleCompleteOrder(selectedOrder.id)} disabled={isLoading} style={{ width: '100%', marginTop: '1rem' }}>Zlecenie zakończone</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ready' && (
            <div>
              <h2>Gotowe ({readyOrders.length})</h2>
              {readyOrders.map(order => (
                <div key={order.docId} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>#{order.id}</h3>
                    <div>
                      <button className="btn btn-primary" onClick={() => handleMoveFromReady(order.id, 'pallet')} disabled={isLoading} style={{ marginRight: '0.5rem' }}>🎨 Paletowy</button>
                      <button className="btn btn-primary" onClick={() => handleMoveFromReady(order.id, 'dedicated')} disabled={isLoading} style={{ marginRight: '0.5rem' }}>📦 Dedykowana</button>
                      <button className="btn btn-danger" onClick={() => handleRevertFromReady(order.id)} disabled={isLoading}>Cofnij</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pallet' && (
            <div>
              <h2>Paletowy ({palletOrders.length})</h2>
              {palletOrders.map(order => (
                <div key={order.docId} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>#{order.id}</h3>
                    <button className="btn btn-danger" onClick={() => handleRevertFromReady(order.id)} disabled={isLoading}>Cofnij</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dedicated' && (
            <div>
              <h2>Dedykowana ({dedicatedOrders.length})</h2>
              {dedicatedOrders.map(order => (
                <div key={order.docId} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>#{order.id}</h3>
                    <button className="btn btn-danger" onClick={() => handleRevertFromReady(order.id)} disabled={isLoading}>Cofnij</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'photos' && (
            <div>
              <h2>📸 Zdjęcia</h2>

              {!accessToken && (
                <div className="card" style={{ background: '#fff3cd', marginBottom: '1rem' }}>
                  <p>Aby uploadować na Google Drive, najpierw autoryzuj dostęp.</p>
                  <button className="btn btn-primary" onClick={handleAuthorizeGoogle} disabled={isLoading} style={{ width: '100%' }}>🔐 Autoryzuj Google Drive</button>
                </div>
              )}

              {!photoSession ? (
                <>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '1rem' }}>Wybierz zamówienie do sfotografowania</p>
                  {orders.filter(o => !['archived'].includes(o.status)).map(order => (
                    <div key={order.docId} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0' }}>#{order.id}</h3>
                          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Status: {order.status} | Zdjęcia: {order.photoCount || 0}</p>
                        </div>
                        {!order.photoArchived && (
                          <button className="btn btn-success" onClick={() => handleStartPhotoSession(order.id)} disabled={isLoading}>Zdjęcia</button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="card">
                  <h3>Fotografowanie #{photoSession.orderId}</h3>

                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', background: '#000', marginBottom: '1rem', borderRadius: '4px' }}></video>
                  <canvas ref={canvasRef}></canvas>

                  {!cameraActive ? (
                    <button className="btn btn-primary" onClick={handleStartCamera} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>📷 Włącz kamerę</button>
                  ) : (
                    <button className="btn btn-success" onClick={handleTakeWarehousePhoto} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>Zrób zdjęcie</button>
                  )}

                  <button className="btn btn-primary" onClick={() => warehouseFileInputRef.current?.click()} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>📤 Z dysku</button>
                  <input ref={warehouseFileInputRef} type="file" accept="image/*" onChange={handlePhotoFileChange} style={{ display: 'none' }} />

                  <div style={{ display: 'inline-block', padding: '6px 12px', background: '#2196F3', color: 'white', borderRadius: '4px', fontWeight: 'bold', marginTop: '1rem' }}>Zdjęcia: {photoSession.photos.length} / 3</div>

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
                    <button className="btn btn-success" onClick={handleArchivePhotos} disabled={isLoading} style={{ width: '100%', marginTop: '1rem' }}>✓ Zarchiwizuj</button>
                  )}

                  {photoSession.photos.length < 3 && (
                    <div style={{ background: '#fff3cd', padding: '0.75rem', marginTop: '1rem', borderRadius: '4px', fontSize: '12px' }}>⚠️ Potrzebujesz {3 - photoSession.photos.length} zdjęcia(ć)</div>
                  )}

                  <button className="btn btn-danger" onClick={() => { stopCamera(); setPhotoSession(null); }} style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>Anuluj</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'archive' && (
            <div>
              <h2>Archiwum2 ({archivedOrders.length})</h2>
              {archivedOrders.map(order => (
                <div key={order.docId} className="card">
                  <h3 style={{ margin: '0 0 8px 0' }}>#{order.id}</h3>
                  {order.photoArchived && <p style={{ fontSize: '12px', color: '#4CAF50', margin: 0 }}>📸 {order.photoCount} zdjęcia wykonane</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
