import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';

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
  PARENT_FOLDER_ID: null
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
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

export default function ProductionSystem() {
  const [appState, setAppState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [loginEmail, setLoginEmail] = useState('op1@company.com');
  const [loginPassword, setLoginPassword] = useState('1234');
  
  const [activeTab, setActiveTab] = useState('orders');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  // Zamówienia (in_progress)
  const [newOrderNum, setNewOrderNum] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Zdjęcia (niezależne)
  const [photoSession, setPhotoSession] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  
  // Admin
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('operator');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const warehouseFileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Load users
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
            setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        });
        return () => unsubscribe();
      } catch (err) {
        console.error('Błąd załadowania:', err);
      }
    };
    loadUsers();
  }, []);

  // Load orders - REAL TIME
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersList = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
      setOrders(ordersList);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    const user = users.find(u => u.email === loginEmail && u.password === loginPassword);
    if (user) {
      setCurrentUser({ uid: user.id, ...user });
      setAppState('dashboard');
      setActiveTab('orders');
    } else {
      alert('Błędne dane');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAccessToken(null);
    setAppState('login');
    stopCamera();
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // ============ ZAMÓWIENIA (in_progress) ============

  const handleStartOrder = async () => {
    if (!newOrderNum.trim()) {
      alert('Wpisz numer zamówienia');
      return;
    }

    try {
      setIsLoading(true);
      const exists = orders.find(o => o.id === newOrderNum && o.status !== 'archived');
      if (exists) {
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
        history: [{
          timestamp: new Date().toLocaleString('pl-PL'),
          user: currentUser?.name,
          action: 'Rozpoczęto'
        }]
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
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const photoData = canvasRef.current.toDataURL('image/jpeg', 0.7);
      setIssuePhoto(photoData);
    }
  };

  const handleAddProblem = async () => {
    if (!issueDesc.trim()) {
      alert('Wpisz opis');
      return;
    }
    if (!selectedOrderId) return;

    try {
      setIsLoading(true);
      const order = orders.find(o => o.id === selectedOrderId);
      if (!order) return;

      const problem = {
        id: Date.now(),
        description: issueDesc,
        photoURL: issuePhoto,
        cut: false,
        repaired: false
      };

      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, {
        problems: [...(order.problems || []), problem]
      });

      setIssueDesc('');
      setIssuePhoto(null);
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
      alert('Błąd');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if ((order.problems || []).some(p => !(p.cut && p.repaired))) {
        alert('Są nienaprawione elementy!');
        return;
      }

      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { status: 'ready' });
      setSelectedOrderId(null);
    } catch (err) {
      alert('Błąd');
    }
  };

  // ============ GOTOWE (ready - NIEZALEŻNIE OD ZDJĘĆ) ============

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

  // ============ ZDJĘCIA (NIEZALEŻNE) ============

  const handleStartPhotoSession = (orderId) => {
    setPhotoSession({ orderId, photos: [], currentPhoto: null });
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

      const newPhotos = [...photoSession.photos, photoBase64];
      setPhotoSession(prev => ({ ...prev, photos: newPhotos, currentPhoto: photoBase64 }));
    } catch (err) {
      alert('Błąd');
    }
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && photoSession) {
      try {
        const compressedBase64 = await compressImage(file);
        const newPhotos = [...photoSession.photos, compressedBase64];
        setPhotoSession(prev => ({ ...prev, photos: newPhotos, currentPhoto: compressedBase64 }));
        e.target.value = '';
      } catch (err) {
        alert('Błąd');
      }
    }
  };

  const handleDeletePhoto = (idx) => {
    if (!photoSession) return;
    const newPhotos = photoSession.photos.filter((_, i) => i !== idx);
    setPhotoSession(prev => ({ ...prev, photos: newPhotos }));
  };

  const handleArchivePhotos = async () => {
    if (!photoSession || photoSession.photos.length < 3) {
      alert('Min 3 zdjęcia!');
      return;
    }

    try {
      setIsLoading(true);
      const order = orders.find(o => o.id === photoSession.orderId);
      if (!order) return;

      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, {
        photoCount: photoSession.photos.length,
        photoArchived: true
      });

      stopCamera();
      setPhotoSession(null);
      alert('Zdjęcia zarchiwizowane!');
    } catch (err) {
      alert('Błąd: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ ADMIN ============

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert('Wypełnij pola');
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
      alert('Użytkownik dodany');
    } catch (err) {
      alert('Błąd');
    } finally {
      setIsLoading(false);
    }
  };

  // ============ FILTERS ============

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
    if (currentUser.role === 'admin') return ['orders', 'ready', 'pallet', 'dedicated', 'archive', 'photos'];
    return [];
  };

  const visibleTabs = getTabs();

  return (
    <div style={{ padding: '1rem', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
        .btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .btn:hover { background: #f0f0f0; }
        .btn:disabled { opacity: 0.5; }
        .btn-success { border-color: #4CAF50; color: #4CAF50; }
        .btn-danger { border-color: #f44336; color: #f44336; }
        .btn-primary { border-color: #2196F3; color: #2196F3; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 6px; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box; }
        .order-card { background: white; border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; cursor: pointer; border-radius: 8px; }
        .order-card.active { border: 2px solid #2196F3; background: #e3f2fd; }
        .order-card:hover { background: #f5f5f5; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: white; padding: 1rem; border-radius: 8px; border: 1px solid #ddd; }
        .tabs { display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap; }
        .tab-btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .tab-btn.active { background: #2196F3; border-color: #2196F3; color: white; }
        .photo-preview { max-width: 100%; max-height: 150px; border-radius: 4px; margin: 0.5rem 0; }
        .video-container { background: #000; border-radius: 8px; overflow: hidden; margin-bottom: 1rem; }
        video { width: 100%; height: auto; }
        canvas { display: none; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .photo-item { background: #f0f0f0; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; }
        .photo-counter { display: inline-block; padding: 6px 12px; background: #2196F3; color: white; border-radius: 4px; font-weight: bold; margin-top: 0.5rem; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
      `}</style>

      {appState === 'login' && (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
          <div className="card">
            <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>🏭 System Zamówień v16</h1>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Hasło</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleLogin}>Zaloguj</button>
          </div>
        </div>
      )}

      {appState === 'dashboard' && currentUser && (
        <div>
          <div className="header">
            <div>
              <h1 style={{ margin: '0 0 4px 0' }}>🏭 System</h1>
              <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{currentUser.name}</p>
            </div>
            <button className="btn btn-danger" onClick={handleLogout}>Wyloguj</button>
          </div>

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
              <button className={`tab-btn ${activeTab === 'archive' ? 'active' : ''}`} onClick={() => setActiveTab('archive')}>📂 Archiwum2</button>
            )}
          </div>

          {/* ZAMÓWIENIA */}
          {activeTab === 'orders' && (
            <div className="grid">
              <div>
                {currentUser.role === 'operator' && (
                  <>
                    <div className="card">
                      <h3>Nowe zamówienie</h3>
                      <input type="text" value={newOrderNum} onChange={e => setNewOrderNum(e.target.value)} placeholder="Numer" style={{ width: '100%', marginBottom: '1rem' }} />
                      <button className="btn btn-success" onClick={handleStartOrder} disabled={isLoading} style={{ width: '100%' }}>Rozpocznij</button>
                    </div>
                  </>
                )}

                <h3>Zamówienia ({inProgressOrders.length})</h3>
                {inProgressOrders.map(order => (
                  <div key={order.docId} className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                    <div style={{ fontWeight: 'bold' }}>#{order.id}</div>
                    {order.problems && order.problems.some(p => !(p.cut && p.repaired)) && (
                      <div style={{ fontSize: '11px', color: '#ff9800' }}>⚠️ {order.problems.filter(p => !(p.cut && p.repaired)).length} błędy</div>
                    )}
                  </div>
                ))}
              </div>

              {selectedOrder && (
                <div>
                  <div className="card">
                    <h3>#{selectedOrder.id}</h3>

                    {selectedOrder.problems && selectedOrder.problems.length > 0 && (
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
                        <div className="form-group">
                          <button className="btn btn-primary" onClick={handleStartCamera} style={{ marginRight: '0.5rem' }} disabled={isLoading}>📷 Kamera</button>
                          <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>📤 Plik</button>
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) compressImage(file).then(setIssuePhoto).catch(() => alert('Błąd'));
                          }} style={{ display: 'none' }} />
                        </div>

                        {cameraActive && (
                          <div className="video-container">
                            <video ref={videoRef} autoPlay playsInline></video>
                            <canvas ref={canvasRef}></canvas>
                          </div>
                        )}

                        {cameraActive && (
                          <button className="btn btn-success" onClick={handleTakePhoto} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>Zrób zdjęcie</button>
                        )}

                        {issuePhoto && <img src={issuePhoto} className="photo-preview" alt="Issue" />}

                        <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} placeholder="Opis" style={{ width: '100%', height: '80px', marginBottom: '1rem' }} />
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

          {/* GOTOWE - NIEZALEŻNE OD ZDJĘĆ */}
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
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '0.5rem' }}>Liczba zdjęć: {order.photoCount || 0}</p>
                </div>
              ))}
            </div>
          )}

          {/* PALETOWY */}
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

          {/* DEDYKOWANA */}
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

          {/* ZDJĘCIA - NIEZALEŻNE */}
          {activeTab === 'photos' && (
            <div>
              <h2>📸 Zdjęcia</h2>
              {!photoSession ? (
                <>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '1rem' }}>Wybierz zamówienie ze statusem READY lub innym</p>
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

                  <div className="video-container">
                    <video ref={videoRef} autoPlay playsInline></video>
                    <canvas ref={canvasRef}></canvas>
                  </div>

                  {!cameraActive ? (
                    <button className="btn btn-primary" onClick={handleStartCamera} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>📷 Włącz kamerę</button>
                  ) : (
                    <button className="btn btn-success" onClick={handleTakeWarehousePhoto} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>Zrób zdjęcie</button>
                  )}

                  <button className="btn btn-primary" onClick={() => warehouseFileInputRef.current?.click()} style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>📤 Z dysku</button>
                  <input ref={warehouseFileInputRef} type="file" accept="image/*" onChange={handlePhotoFileChange} style={{ display: 'none' }} />

                  <div className="photo-counter">Zdjęcia: {photoSession.photos.length} / min. 3</div>

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

          {/* ARCHIWUM2 */}
          {activeTab === 'archive' && (
            <div>
              <h2>Archiwum2 ({archivedOrders.length})</h2>
              {archivedOrders.map(order => (
                <div key={order.docId} className="card">
                  <h3 style={{ margin: '0 0 8px 0' }}>#{order.id}</h3>
                  {order.photoArchived && (
                    <p style={{ fontSize: '12px', color: '#4CAF50', margin: 0 }}>📸 {order.photoCount} zdjęcia wykonane</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
