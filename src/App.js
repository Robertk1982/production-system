import React, { useState, useEffect, useRef } from 'react';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDKUns-Jmw1RR9afnymTKF1xdjImHJGkNU",
  authDomain: "system-produkcji-d0256.firebaseapp.com",
  databaseURL: "https://system-produkcji-d0256-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "system-produkcji-d0256",
  storageBucket: "system-produkcji-d0256.firebasestorage.app",
  messagingSenderId: "340231895219",
  appId: "1:340231895219:web:50fc85275a51d2114998c6",
  measurementId: "G-B33RZ93QRL"
};

// Minimal Firebase implementation
class FirebaseManager {
  constructor(config) {
    this.config = config;
    this.db = null;
    this.storage = null;
    this.auth = null;
    this.currentUser = null;
    this.ordersCache = [];
  }

  async init() {
    // Simulated Firebase initialization
    console.log('Firebase initialized:', this.config.projectId);
  }

  async login(email, password) {
    // Simulated login - in real app use Firebase Auth
    return { uid: 'user-' + Math.random(), email };
  }

  async createOrder(orderData) {
    const id = 'order-' + Date.now();
    const order = {
      id,
      ...orderData,
      createdAt: new Date().toISOString(),
      problems: [],
      archived: false,
      history: [{
        timestamp: new Date().toLocaleString('pl-PL'),
        user: this.currentUser?.email || 'Unknown',
        action: 'Zamówienie rozpoczęte'
      }]
    };
    this.ordersCache.push(order);
    localStorage.setItem('orders-' + this.config.projectId, JSON.stringify(this.ordersCache));
    return order;
  }

  async getOrders() {
    const stored = localStorage.getItem('orders-' + this.config.projectId);
    this.ordersCache = stored ? JSON.parse(stored) : [];
    return this.ordersCache;
  }

  async updateOrder(orderId, data) {
    this.ordersCache = this.ordersCache.map(o => o.id === orderId ? { ...o, ...data } : o);
    localStorage.setItem('orders-' + this.config.projectId, JSON.stringify(this.ordersCache));
    return this.ordersCache.find(o => o.id === orderId);
  }

  async uploadImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = {
          url: e.target.result,
          uploadedAt: new Date().toISOString()
        };
        resolve(photoData);
      };
      reader.readAsDataURL(file);
    });
  }
}

export default function ProductionSystem() {
  const [firebaseManager] = useState(new FirebaseManager(FIREBASE_CONFIG));
  const [appState, setAppState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('op1@company.com');
  const [loginPassword, setLoginPassword] = useState('1234');
  
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [newOrderNum, setNewOrderNum] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [settings, setSettings] = useState({ notificationEmail: 'manager@company.com' });
  const [newEmail, setNewEmail] = useState(settings.notificationEmail);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    firebaseManager.init();
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const loadedOrders = await firebaseManager.getOrders();
    setOrders(loadedOrders);
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert('Wpisz email i hasło');
      return;
    }
    const user = await firebaseManager.login(loginEmail, loginPassword);
    firebaseManager.currentUser = user;
    setCurrentUser(user);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppState('login');
    setSelectedOrderId(null);
  };

  const handleStartOrder = async () => {
    if (!newOrderNum.trim()) {
      alert('Wpisz numer zamówienia');
      return;
    }
    const existing = orders.find(o => o.id === newOrderNum && !o.archived);
    if (existing) {
      alert('To zamówienie już istnieje!');
      return;
    }
    const order = await firebaseManager.createOrder({ id: newOrderNum });
    setOrders([...orders, order]);
    setSelectedOrderId(newOrderNum);
    setNewOrderNum('');
  };

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Brak dostępu do kamery: ' + err.message);
    }
  };

  const handleTakePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const photoData = canvasRef.current.toDataURL('image/jpeg');
      setIssuePhoto(photoData);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setIssuePhoto(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProblem = async () => {
    if (!issueDesc.trim()) {
      alert('Wpisz opis problemu');
      return;
    }
    if (!selectedOrderId) return;

    const problem = {
      id: Date.now(),
      photo: issuePhoto,
      description: issueDesc,
      cut: false,
      repaired: false,
      addedBy: currentUser?.email || 'Unknown',
      addedAt: new Date().toLocaleString('pl-PL')
    };

    const updatedOrder = orders.find(o => o.id === selectedOrderId);
    if (updatedOrder) {
      updatedOrder.problems.push(problem);
      updatedOrder.history.push({
        timestamp: new Date().toLocaleString('pl-PL'),
        user: currentUser?.email || 'Unknown',
        action: `Dodał problem: "${issueDesc}"`
      });
      await firebaseManager.updateOrder(updatedOrder.id, updatedOrder);
      setOrders([...orders]);
    }
    
    setIssuePhoto(null);
    setIssueDesc('');
  };

  const handleToggleProblem = async (orderId, problemId, field) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const problem = order.problems.find(p => p.id === problemId);
    if (!problem) return;

    problem[field] = !problem[field];

    if (problem.cut && problem.repaired) {
      order.problems = order.problems.filter(p => p.id !== problemId);
      order.history.push({
        timestamp: new Date().toLocaleString('pl-PL'),
        user: currentUser?.email || 'Unknown',
        action: `Rozwiązał problem: "${problem.description}"`
      });
    }

    await firebaseManager.updateOrder(order.id, order);
    setOrders([...orders]);
  };

  const handleCompleteOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (order.problems.some(p => !(p.cut && p.repaired))) {
      alert('Nie możesz zamknąć! Są nienaurawane elementy.');
      return;
    }

    alert(`✉️ Email wysłany na ${settings.notificationEmail}:\n"Zamówienie nr ${orderId} zostało całkowicie wyprodukowane!"`);

    order.archived = true;
    order.history.push({
      timestamp: new Date().toLocaleString('pl-PL'),
      user: currentUser?.email || 'Unknown',
      action: 'Zamówienie zakończone'
    });

    await firebaseManager.updateOrder(order.id, order);
    setOrders([...orders]);
    setSelectedOrderId(null);
  };

  const handleUpdateEmail = () => {
    if (!newEmail.trim()) {
      alert('Wpisz email');
      return;
    }
    setSettings({ notificationEmail: newEmail });
    alert('Email zaktualizowany!');
  };

  const activeOrders = orders.filter(o => !o.archived);
  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;
  const unrepairedCount = orders.reduce((sum, o) => sum + o.problems.filter(p => !(p.cut && p.repaired)).length, 0);

  return (
    <div style={{ padding: '1rem', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
        .btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .btn:hover { background: #f0f0f0; }
        .btn-success { border-color: #4CAF50; color: #4CAF50; }
        .btn-danger { border-color: #f44336; color: #f44336; }
        .btn-primary { border-color: #2196F3; color: #2196F3; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 6px; }
        .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box; }
        .problem-row { background: #f9f9f9; padding: 0.75rem; margin-bottom: 0.75rem; border-radius: 4px; border-left: 3px solid #ff9800; }
        .checkbox-group { display: flex; gap: 1.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
        .order-card { background: white; border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; cursor: pointer; border-radius: 8px; }
        .order-card:hover { background: #f5f5f5; }
        .order-card.active { border: 2px solid #2196F3; background: #e3f2fd; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-box { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #ddd; text-align: center; }
        .stat-number { font-size: 20px; font-weight: bold; }
        .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
        .warning-box { background: #fff3cd; border-left: 3px solid #ff9800; padding: 0.75rem; border-radius: 4px; margin-top: 1rem; font-size: 12px; }
        .success-box { background: #d4edda; border-left: 3px solid #4CAF50; padding: 0.75rem; border-radius: 4px; margin-top: 1rem; font-size: 12px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: white; padding: 1rem; border-radius: 8px; border: 1px solid #ddd; }
        .photo-preview { max-width: 100%; max-height: 200px; border-radius: 4px; margin-top: 8px; }
        .video-container { position: relative; width: 100%; background: #000; border-radius: 8px; overflow: hidden; margin-bottom: 1rem; }
        video { width: 100%; height: auto; }
        canvas { display: none; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
      `}</style>

      {appState === 'login' && (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
          <div className="card">
            <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>🏭 System Zamówień</h1>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="op1@company.com" />
            </div>
            <div className="form-group">
              <label>Hasło</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="1234" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleLogin}>Zaloguj się</button>
            <p style={{ fontSize: '11px', textAlign: 'center', color: '#999', marginTop: '1rem' }}>Demo: op1@company.com / 1234</p>
          </div>
        </div>
      )}

      {appState === 'dashboard' && currentUser && (
        <div>
          <div className="header">
            <div>
              <h1 style={{ margin: '0 0 4px 0' }}>🏭 System Zamówień</h1>
              <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Zalogowany: {currentUser.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={() => setAppState('settings')}>⚙️ Ustawienia</button>
              <button className="btn btn-danger" onClick={handleLogout}>Wyloguj</button>
            </div>
          </div>

          <div className="stats">
            <div className="stat-box">
              <div className="stat-number">{activeOrders.length}</div>
              <div className="stat-label">Aktywne</div>
            </div>
            <div className="stat-box">
              <div className="stat-number" style={{ color: '#ff9800' }}>{unrepairedCount}</div>
              <div className="stat-label">Do naprawy</div>
            </div>
            <div className="stat-box">
              <div className="stat-number" style={{ color: '#4CAF50' }}>{orders.filter(o => o.archived).length}</div>
              <div className="stat-label">Zarchiwizowane</div>
            </div>
          </div>

          <div className="grid">
            <div>
              <h3 style={{ marginBottom: '1rem' }}>+ Nowe zamówienie</h3>
              <div className="card">
                <div className="form-group">
                  <input type="text" value={newOrderNum} onChange={e => setNewOrderNum(e.target.value)} placeholder="Numer zamówienia" />
                </div>
                <button className="btn btn-success" onClick={handleStartOrder}>Rozpocznij</button>
              </div>

              <h3 style={{ marginBottom: '1rem' }}>Zamówienia ({activeOrders.length})</h3>
              {activeOrders.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999' }}>Brak aktywnych zamówień</p>
              ) : (
                activeOrders.map(order => {
                  const unrepairedProblems = order.problems.filter(p => !(p.cut && p.repaired));
                  return (
                    <div key={order.id} className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>#{order.id}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{new Date(order.createdAt).toLocaleString('pl-PL')}</div>
                      {unrepairedProblems.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#ff9800', marginTop: '6px' }}>⚠️ {unrepairedProblems.length} błędy do naprawy</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {selectedOrder && (
              <div>
                <div className="card">
                  <h3 style={{ marginBottom: '1rem' }}>Zamówienie #{selectedOrder.id}</h3>

                  {selectedOrder.problems.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.75rem' }}>Błędy:</h4>
                      {selectedOrder.problems.map(p => (
                        <div key={p.id} className="problem-row">
                          {p.photo && <img src={p.photo} className="photo-preview" />}
                          <p style={{ margin: '6px 0', fontWeight: 'bold' }}>{p.description}</p>
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '11px', color: '#666' }}>Dodał: {p.addedBy} o {p.addedAt}</p>
                          <div className="checkbox-group">
                            <label>
                              <input type="checkbox" checked={p.cut} onChange={() => handleToggleProblem(selectedOrder.id, p.id, 'cut')} />
                              {' '}Wycięty element
                            </label>
                            <label>
                              <input type="checkbox" checked={p.repaired} onChange={() => handleToggleProblem(selectedOrder.id, p.id, 'repaired')} />
                              {' '}Dorobiony
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 style={{ marginBottom: '0.75rem' }}>Dodaj błąd</h4>
                  
                  <div className="form-group">
                    <label>Zdjęcie (z kamery lub plik)</label>
                    <div style={{ marginBottom: '1rem' }}>
                      <button className="btn btn-primary" onClick={handleStartCamera} style={{ marginRight: '8px' }}>📷 Włącz kamerę</button>
                      <button className="btn" onClick={() => fileInputRef.current?.click()}>📤 Prześlij plik</button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </div>
                    {issuePhoto && <img src={issuePhoto} className="photo-preview" />}
                  </div>

                  <div className="video-container" style={{ display: selectedOrder ? 'block' : 'none' }}>
                    <video ref={videoRef} autoPlay playsInline></video>
                    <canvas ref={canvasRef} width={640} height={480}></canvas>
                  </div>

                  {videoRef.current?.srcObject && (
                    <button className="btn btn-success" onClick={handleTakePhoto} style={{ marginBottom: '1rem' }}>Zrób zdjęcie</button>
                  )}

                  <div className="form-group">
                    <label>Opis problemu</label>
                    <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} placeholder="Opis..."></textarea>
                  </div>

                  <button className="btn btn-success" onClick={handleAddProblem}>Dodaj błąd</button>

                  {selectedOrder.problems.filter(p => !(p.cut && p.repaired)).length > 0 && (
                    <div className="warning-box">⚠️ Czekasz na naprawę {selectedOrder.problems.filter(p => !(p.cut && p.repaired)).length} błędu(ów)</div>
                  )}

                  {selectedOrder.problems.filter(p => !(p.cut && p.repaired)).length === 0 && selectedOrder.problems.length > 0 && (
                    <div className="success-box">✓ Wszystkie błędy naprawione!</div>
                  )}

                  <button className="btn btn-success" style={{ width: '100%', marginTop: '1rem' }} disabled={selectedOrder.problems.some(p => !(p.cut && p.repaired))} onClick={() => handleCompleteOrder(selectedOrder.id)}>
                    {selectedOrder.problems.some(p => !(p.cut && p.repaired)) ? '✗ Nie można zamknąć' : '✓ Zlecenie zakończone'}
                  </button>

                  <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Historia</h4>
                  <div style={{ background: '#f9f9f9', padding: '0.75rem', borderRadius: '4px', fontSize: '12px' }}>
                    {selectedOrder.history.map((h, i) => (
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
        </div>
      )}

      {appState === 'settings' && (
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
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
                <button className="btn btn-success" onClick={handleUpdateEmail}>Zapisz</button>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>Aktualny: {settings.notificationEmail}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
