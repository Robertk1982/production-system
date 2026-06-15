import React, { useState, useEffect, useRef } from 'react';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDKUns-Jmw1RR9afnymTKF1xdjImHJGkNU",
  authDomain: "system-produkcji-d0256.firebaseapp.com",
  projectId: "system-produkcji-d0256",
  storageBucket: "system-produkcji-d0256.firebasestorage.app",
  messagingSenderId: "340231895219",
  appId: "1:340231895219:web:50fc85275a51d2114998c6"
};

class FirebaseManager {
  constructor(config) {
    this.config = config;
    this.currentUser = null;
    this.ordersCache = [];
    this.usersCache = [];
  }

  async init() {
    console.log('Firebase initialized:', this.config.projectId);
  }

  async login(email, password) {
    const user = this.usersCache.find(u => u.email === email && u.password === password);
    if (user) {
      return { uid: user.id, email: user.email, name: user.name, role: user.role };
    }
    return null;
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

  async createOrder(orderData) {
    const id = 'order-' + Date.now();
    const order = {
      id,
      ...orderData,
      createdAt: new Date().toISOString(),
      problems: [],
      status: 'in_progress', // in_progress, ready, archived
      history: [{
        timestamp: new Date().toLocaleString('pl-PL'),
        user: this.currentUser?.name || 'Unknown',
        action: 'Zamówienie rozpoczęte'
      }]
    };
    this.ordersCache.push(order);
    localStorage.setItem('orders-' + this.config.projectId, JSON.stringify(this.ordersCache));
    return order;
  }

  async getUsers() {
    const stored = localStorage.getItem('users-' + this.config.projectId);
    this.usersCache = stored ? JSON.parse(stored) : [
      { id: 1, name: 'Operator 1', email: 'op1@company.com', password: '1234', role: 'operator' },
      { id: 2, name: 'Operator 2', email: 'op2@company.com', password: '1234', role: 'operator' },
      { id: 3, name: 'Admin Jakości', email: 'qa@company.com', password: '1234', role: 'order_admin' },
      { id: 4, name: 'Admin', email: 'admin@company.com', password: '1234', role: 'admin' }
    ];
    return this.usersCache;
  }

  async saveUsers() {
    localStorage.setItem('users-' + this.config.projectId, JSON.stringify(this.usersCache));
  }

  async addUser(user) {
    const newUser = {
      id: Math.max(...this.usersCache.map(u => u.id), 0) + 1,
      ...user
    };
    this.usersCache.push(newUser);
    await this.saveUsers();
    return newUser;
  }

  async deleteUser(userId) {
    this.usersCache = this.usersCache.filter(u => u.id !== userId);
    await this.saveUsers();
  }
}

export default function ProductionSystem() {
  const [firebaseManager] = useState(new FirebaseManager(FIREBASE_CONFIG));
  const [appState, setAppState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
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
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('operator');
  
  const [activeTab, setActiveTab] = useState('orders');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const init = async () => {
      await firebaseManager.init();
      const loadedOrders = await firebaseManager.getOrders();
      const loadedUsers = await firebaseManager.getUsers();
      setOrders(loadedOrders);
      setUsers(loadedUsers);
    };
    init();
  }, [firebaseManager]);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert('Wpisz email i hasło');
      return;
    }
    const user = await firebaseManager.login(loginEmail, loginPassword);
    if (user) {
      firebaseManager.currentUser = user;
      setCurrentUser(user);
      setAppState('dashboard');
      setActiveTab('orders');
    } else {
      alert('Błędny email lub hasło');
    }
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
    const existing = orders.find(o => o.id === newOrderNum && o.status !== 'archived');
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
      addedBy: currentUser?.name || 'Unknown',
      addedAt: new Date().toLocaleString('pl-PL')
    };

    const updatedOrder = orders.find(o => o.id === selectedOrderId);
    if (updatedOrder) {
      updatedOrder.problems.push(problem);
      updatedOrder.history.push({
        timestamp: new Date().toLocaleString('pl-PL'),
        user: currentUser?.name || 'Unknown',
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
        user: currentUser?.name || 'Unknown',
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

    order.status = 'ready'; // Zamówienie przechodzi do "Gotowe"
    order.history.push({
      timestamp: new Date().toLocaleString('pl-PL'),
      user: currentUser?.name || 'Unknown',
      action: 'Zamówienie zakończone - oczekuje na zmianę statusu'
    });

    await firebaseManager.updateOrder(order.id, order);
    setOrders([...orders]);
    setSelectedOrderId(null);
  };

  const handleConfirmStatus = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = 'archived';
    order.history.push({
      timestamp: new Date().toLocaleString('pl-PL'),
      user: currentUser?.name || 'Unknown',
      action: 'Status zmieniony w sklepie - Zamówienie zarchiwizowane'
    });

    alert(`✉️ Email wysłany na ${settings.notificationEmail}:\n"Zamówienie nr ${orderId} zostało całkowicie wyprodukowane i wysłane!"`);

    await firebaseManager.updateOrder(order.id, order);
    setOrders([...orders]);
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert('Wypełnij wszystkie pola');
      return;
    }
    await firebaseManager.addUser({
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole
    });
    setUsers(firebaseManager.usersCache);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('operator');
    alert('Użytkownik dodany!');
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Usunąć tego użytkownika?')) {
      await firebaseManager.deleteUser(userId);
      setUsers(firebaseManager.usersCache);
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

  // Filtrowanie zamówień wg statusu
  const inProgressOrders = orders.filter(o => o.status === 'in_progress');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const archivedOrders = orders.filter(o => o.status === 'archived');
  
  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;
  const unrepairedCount = orders.reduce((sum, o) => sum + o.problems.filter(p => !(p.cut && p.repaired)).length, 0);

  // Określenie widocznych zakładek zg rolą
  const getTabs = () => {
    if (currentUser.role === 'operator') {
      return ['orders']; // Tylko "Zamówienia"
    } else if (currentUser.role === 'order_admin') {
      return ['orders', 'ready']; // "Zamówienia" + "Gotowe"
    } else if (currentUser.role === 'admin') {
      return ['orders', 'ready', 'archive']; // Wszystkie 3
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
        .btn-success { border-color: #4CAF50; color: #4CAF50; }
        .btn-danger { border-color: #f44336; color: #f44336; }
        .btn-primary { border-color: #2196F3; color: #2196F3; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 6px; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box; }
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
        .info-box { background: #d1ecf1; border-left: 3px solid #17a2b8; padding: 0.75rem; border-radius: 4px; margin-top: 1rem; font-size: 12px; }
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
              <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Zalogowany: {currentUser.name} ({currentUser.role})</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {currentUser.role === 'admin' && (
                <button className="btn btn-primary" onClick={() => { setActiveTab('settings'); setAppState('settings'); }}>⚙️ Ustawienia</button>
              )}
              <button className="btn btn-danger" onClick={handleLogout}>Wyloguj</button>
            </div>
          </div>

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

          <div className="tabs">
            {visibleTabs.includes('orders') && (
              <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📦 Zamówienia</button>
            )}
            {visibleTabs.includes('ready') && (
              <button className={`tab-btn ${activeTab === 'ready' ? 'active' : ''}`} onClick={() => setActiveTab('ready')}>📋 Gotowe</button>
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
                      <button className="btn btn-success" onClick={handleStartOrder}>Rozpocznij</button>
                    </div>
                  </>
                )}

                <h3 style={{ marginBottom: '1rem' }}>Zamówienia ({inProgressOrders.length})</h3>
                {inProgressOrders.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999' }}>Brak aktywnych zamówień</p>
                ) : (
                  inProgressOrders.map(order => {
                    const unrepairedProblems = order.problems.filter(p => !(p.cut && p.repaired));
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

                    {selectedOrder.problems.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem' }}>Błędy:</h4>
                        {selectedOrder.problems.map(p => (
                          <div key={p.id} className="problem-row">
                            {p.photo && <img src={p.photo} className="photo-preview" alt="Problem photo" />}
                            <p style={{ margin: '6px 0', fontWeight: 'bold' }}>{p.description}</p>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '11px', color: '#666' }}>Dodał: {p.addedBy} o {p.addedAt}</p>
                            {currentUser.role === 'operator' && (
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
                            )}
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
                            <button className="btn btn-primary" onClick={handleStartCamera} style={{ marginRight: '8px' }}>📷 Włącz kamerę</button>
                            <button className="btn" onClick={() => fileInputRef.current?.click()}>📤 Prześlij plik</button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                          </div>
                          {issuePhoto && <img src={issuePhoto} className="photo-preview" alt="Issue photo" />}
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

                        {selectedOrder.problems.filter(p => !(p.cut && p.repaired)).length === 0 && selectedOrder.problems.length === 0 && (
                          <button className="btn btn-success" style={{ width: '100%', marginTop: '1rem' }} onClick={() => handleCompleteOrder(selectedOrder.id)}>
                            ✓ Zlecenie zakończone
                          </button>
                        )}

                        {selectedOrder.problems.filter(p => !(p.cut && p.repaired)).length === 0 && selectedOrder.problems.length > 0 && (
                          <button className="btn btn-success" style={{ width: '100%', marginTop: '1rem' }} onClick={() => handleCompleteOrder(selectedOrder.id)}>
                            ✓ Zlecenie zakończone
                          </button>
                        )}
                      </>
                    )}

                    <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Historia</h4>
                    <div style={{ background: '#f9f9f9', padding: '0.75rem', borderRadius: '4px', fontSize: '12px', maxHeight: '200px', overflowY: 'auto' }}>
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
                      {currentUser.role === 'order_admin' && (
                        <button className="btn btn-success" onClick={() => handleConfirmStatus(order.id)}>✓ Zmieniony w sklepie</button>
                      )}
                    </div>
                    {order.problems.length > 0 && (
                      <div>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '0.5rem' }}>Naprawiane elementy:</p>
                        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px' }}>
                          {order.problems.map(p => (
                            <li key={p.id}>{p.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
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
                  <div key={order.id} className="order-card" onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>#{order.id}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>Rozpoczęto: {new Date(order.createdAt).toLocaleString('pl-PL')}</div>
                    {order.problems.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#666' }}>Naprawianych elementów: {order.problems.length}</div>
                    )}
                  </div>
                ))
              )}

              {selectedOrderId && selectedOrder && selectedOrder.status === 'archived' && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem' }}>Szczegóły zamówienia #{selectedOrder.id}</h3>
                  
                  {selectedOrder.problems.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.75rem' }}>Naprawiane elementy:</h4>
                      {selectedOrder.problems.map(p => (
                        <div key={p.id} className="problem-row">
                          {p.photo && <img src={p.photo} className="photo-preview" alt="Problem photo" />}
                          <p style={{ margin: '6px 0', fontWeight: 'bold' }}>{p.description}</p>
                          <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>Dodał: {p.addedBy} o {p.addedAt}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 style={{ marginBottom: '0.75rem' }}>Historia:</h4>
                  <div style={{ background: '#f9f9f9', padding: '0.75rem', borderRadius: '4px', fontSize: '12px' }}>
                    {selectedOrder.history.map((h, i) => (
                      <div key={i} style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #ddd' }}>
                        <strong>{h.user}</strong> - {h.action}<br />
                        <span style={{ fontSize: '11px', color: '#999' }}>{h.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
                <button className="btn btn-success" onClick={handleUpdateEmail}>Zapisz</button>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>Aktualny: {settings.notificationEmail}</p>
              </div>
            </div>

            <div>
              <h3>Zarządzanie pracownikami</h3>
              <div className="card">
                <h4 style={{ margin: '0 0 1rem 0' }}>Dodaj nowego pracownika</h4>
                <div className="form-group">
                  <label>Imię i nazwisko</label>
                  <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Jan Kowalski" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="jan@company.com" />
                </div>
                <div className="form-group">
                  <label>Hasło</label>
                  <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="1234" />
                </div>
                <div className="form-group">
                  <label>Rola</label>
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                    <option value="operator">Operator</option>
                    <option value="order_admin">Admin Jakości</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <button className="btn btn-success" onClick={handleAddUser}>Dodaj pracownika</button>

                <h4 style={{ margin: '1.5rem 0 1rem 0' }}>Aktualni pracownicy</h4>
                {users.map(u => (
                  <div key={u.id} className="user-row">
                    <div className="user-info">
                      <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{u.email}</div>
                      <span className="user-role">{u.role === 'order_admin' ? 'Admin Jakości' : u.role === 'admin' ? 'Administrator' : 'Operator'}</span>
                    </div>
                    {u.id !== currentUser.uid && (
                      <button className="btn btn-danger" onClick={() => handleDeleteUser(u.id)}>Usuń</button>
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
