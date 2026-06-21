/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import * as XLSX from 'xlsx';
import { getFirestore, collection, addDoc, updateDoc, setDoc, getDoc, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

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

const LOGO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCADZA6kDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoooo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bAAGWZSTgAD8KrxfC3wZBIkkfhLQo5EbcrLpsIII5BB28GuoooAKKKKACk20tFAHMeMPhj4R+IMQj8TeGtK10Bdqtf2ccroPRWIyv4GvLr39hf4G38xkl8Bwqx/546hdxD8kmAr3iigDwzTf2Ifghpcokh8BWrsDn/Sby5nH5SSkV6n4V+H/AIY8CwtF4c8O6XoMbDDLptnHb7h77AM/jXQUUAN2+9OoooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9k=';

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

const ACCESS_FOLDERS = [
  { key: 'wydane_na_produkcje', label: 'Wydane na produkcję - PS (widok)' },
  { key: 'wydane_na_produkcje_manage', label: 'Wydane na produkcję - PS (zarządzanie)' },
  { key: 'planowanie', label: 'Planowanie produkcji' },
  { key: 'konsultacje', label: 'Konsultacje' },
  { key: 'probki', label: 'Próbki' },
  { key: 'wydane', label: 'Wydane na produkcję (widok)' },
  { key: 'wydane_manage', label: 'Wydane na produkcję (zarządzanie)' },
  { key: 'akcesoria', label: 'Akcesoria' },
  { key: 'prestashop', label: 'Prestashop (widok)' },
  { key: 'prestashop_manage', label: 'Prestashop (zarządzanie)' },
  { key: 'prestashop_poprawione', label: 'Prestashop (poprawione)' },
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
  { key: 'archive3', label: 'Archiwum akcesoriów' },
  { key: 'archive2', label: 'Archiwum zdjęć' },
  { key: 'archive1', label: 'Archiwum zamówień' },
  { key: 'trudny_klient', label: 'Trudny klient' },
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
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [newOrderNum, setNewOrderNum] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  const [photoSession, setPhotoSession] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [orderMessages, setOrderMessages] = useState({});
  const [akcesoriaKatalog, setAkcesoriaKatalog] = useState([]);
  const [akcesoriaKatalogLoading, setAkcesoriaKatalogLoading] = useState(false);
  const [brakiSearchQuery, setBrakiSearchQuery] = useState('');
  const [probkiKatalog, setProbkiKatalog] = useState([]);
  const [probkiKatalogLoading, setProbkiKatalogLoading] = useState(false);
  const [showMagazyn, setShowMagazyn] = useState(false);
  const [showDodajProbki, setShowDodajProbki] = useState(false);
  const [dodajProbkiRows, setDodajProbkiRows] = useState([]);
  const [probkiSearchQ, setProbkiSearchQ] = useState('');
  const [magazynSearchQ, setMagazynSearchQ] = useState('');
  const [magazynSortBy, setMagazynSortBy] = useState('nazwa');
  const [showPominieteLista, setShowPominieteLista] = useState(false);
  const [showWyprodukujPanel, setShowWyprodukujPanel] = useState(false);
  const [wyprodukujZlecone, setWyprodukujZlecone] = useState({});
  const [wyprodukujWyprodukowane, setWyprodukujWyprodukowane] = useState({});
  const [showZamowProbki, setShowZamowProbki] = useState(false);
  const [zamowProbkiRows, setZamowProbkiRows] = useState([]);
  const [zamowProbkiSearchQ, setZamowProbkiSearchQ] = useState('');
  const [oczekiwanieSet, setOczekiwanieSet] = useState({});
  const [konsultacjeDataQ, setKonsultacjeDataQ] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserAccess, setNewUserAccess] = useState({ ...DEFAULT_ACCESS });
  const [editingUserId, setEditingUserId] = useState(null);
  const [dateEditOrderId, setDateEditOrderId] = useState(null);
  const [wydaneOrderNum, setWydaneOrderNum] = useState('');
  const [wydaneTermin, setWydaneTermin] = useState('');
  const [tkOrderNum, setTkOrderNum] = useState('');
  const [tkNote, setTkNote] = useState('');
  const [importingExcel, setImportingExcel] = useState(false);
  const [psSortBy, setPsSortBy] = useState('id');
  const [psFilterZaproj, setPsFilterZaproj] = useState(false);
  const [psFilterSprawdzone, setPsFilterSprawdzone] = useState(false);
  const [psFilterBledy, setPsFilterBledy] = useState(false);
  const [psFilterDekor, setPsFilterDekor] = useState('');
  const [psFilterKodPoczt, setPsFilterKodPoczt] = useState('');
  const [manualOrderId, setManualOrderId] = useState('');
  const [manualDataRealizacji, setManualDataRealizacji] = useState('');
  const [manualTransport, setManualTransport] = useState('');
  const [manualWartosc, setManualWartosc] = useState('');
  const [manualKodPocztowy, setManualKodPocztowy] = useState('');
  const [wydaneKanapka, setWydaneKanapka] = useState('');

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
      setOrders(snapshot.docs.map(d => ({ docId: d.id, ...d.data() })).filter(o => !o.deleted));
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
      // Reset to first available tab for THIS user
      const a = getUserAccess(user);
      const firstTab = (a.prestashop || a.prestashop_manage || a.prestashop_poprawione) ? 'prestashop' : (a.wydane || a.wydane_manage) ? 'wydane' : a.akcesoria ? 'akcesoria' : (a.orders || a.orders_manage) ? 'orders' : a.ready ? 'ready' : a.pallet ? 'pallet' : a.dedicated ? 'dedicated' : a.photos ? 'photos' : (a.raben || a.raben_manage) ? 'raben' : (a.transport || a.transport_manage) ? 'transport' : a.archive3 ? 'archive3' : a.archive2 ? 'archive2' : a.archive1 ? 'archive1' : a.trudny_klient ? 'trudny_klient' : a.admin ? 'admin' : 'orders';
      setActiveTab(firstTab);
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
      if (orders.find(o => o.id === newOrderNum && o.status !== 'archived' && o.status !== 'none')) {
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
      const updates = { status: newStatus, history: [...(order.history || []), historyEntry(`Przeniesiono do ${newStatus === 'pallet' ? 'Paletowy' : 'Dedykowana'}`)] };
      if (newStatus === 'pallet' && order.photoArchived) { updates.spakowane = true; }
      await updateDoc(orderRef, updates);
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

  // Magazyn próbek — oddzielny dokument w Firestore
  const [magazynProbek, setMagazynProbek] = useState({});
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'magazyn', 'probki'), snap => {
      if (snap.exists()) setMagazynProbek(snap.data() || {});
    });
    // Also pre-load probki katalog from Firestore cache silently
    getDoc(doc(db, 'katalogi', 'probki')).then(snap => {
      if (snap.exists()) {
        const cached = snap.data().items || [];
        if (cached.length > 0) setProbkiKatalog(cached);
      }
    }).catch(() => {});
    // Load zamow probki list
    getDoc(doc(db, 'magazyn', 'zamowProbki')).then(snap => {
      if (snap.exists()) setZamowProbkiRows(snap.data().items || []);
    }).catch(() => {});
    return unsub;
  }, []);

  const updateZamowProbkiList = async (newList) => {
    await setDoc(doc(db, 'magazyn', 'zamowProbki'), { items: newList, updatedAt: new Date().toISOString() });
  };

  const updateMagazynProbek = async (dekorNr, delta, logEntry) => {
    const current = parseInt(magazynProbek[dekorNr] || 0);
    const newVal = Math.max(0, current + delta);
    const ref = doc(db, 'magazyn', 'probki');
    await updateDoc(ref, { [dekorNr]: newVal }).catch(() => setDoc(ref, { ...magazynProbek, [dekorNr]: newVal }));
    // Log to archiwum
    if (logEntry) {
      await addDoc(collection(db, 'magazynLog'), { ...logEntry, timestamp: new Date().toISOString(), dekorNr, before: current, after: newVal });
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
      const photoUpdates = {
        photoCount: photoSession.photos.length,
        photoArchived: true,
        history: [...(order.history || []), historyEntry(`Zarchiwizowano ${photoSession.photos.length} zdjęć`)]
      };
      if (order.status === 'pallet' || order.status === 'raben') { photoUpdates.spakowane = true; }
      await updateDoc(orderRef, photoUpdates);

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
    // Gdy zatwierdzamy kolory — kasuj też dekoryNeedCheck
    if (field === 'colorChecked' && value === true) {
      try {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const orderRef = doc(db, 'orders', order.docId);
        await updateDoc(orderRef, {
          colorChecked: true,
          dekoryNeedCheck: false,
          history: [...(order.history || []), historyEntry('Kolory sprawdzone — dekory zatwierdzone')]
        });
      } catch (err) { alert('Blad: ' + err.message); }
      return;
    }
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
  const WYDANE_FOLDER_ID = '1tpZdY9yDGnbXUD-5e4ev_Sk962Z4MnMf';
  const PRODUKCJA_FOLDER_ID = '1r3zjtvSfPa36a1q_GG9giDaNtmtPCvew';
  const CSV_DRIVE_FOLDER_ID = '0ALO7nCAWeZ9QUk9PVA';

  const AKCESORIA_SHEET_ID = '1xUYJb8WGiEsOcvBaUgfSjGlUwGMVb-1E-aQz0bjeeaE';

  const PROBKI_SHEET_ID = '10yCRrMI88UVkXngxgkmFxEXkpJqL2ZANWJBiWoQFg-M';
  const PROBKI_FOLDER_ID = '1PBQalfDxjuXNmaMU7f3au_lzT3FX0Iqw';

  const fetchProbkiKatalog = async (force = false) => {
    setProbkiKatalogLoading(true);
    try {
      // Load from Firestore cache first (fast, no network)
      const cacheSnap = await getDoc(doc(db, 'katalogi', 'probki'));
      const cached = cacheSnap.exists() ? (cacheSnap.data().items || []) : [];
      if (cached.length > 0 && !force) {
        setProbkiKatalog(cached);
        setProbkiKatalogLoading(false);
        return;
      }
      // Fetch from Google Sheets via Drive API
      if (!accessToken) {
        if (cached.length > 0) { setProbkiKatalog(cached); }
        else { alert('Autoryzuj Google Drive aby pobrać listę próbek.'); }
        setProbkiKatalogLoading(false);
        return;
      }
      const exportResp = await fetch(
        'https://www.googleapis.com/drive/v3/files/' + PROBKI_SHEET_ID + '/export?mimeType=text%2Fcsv',
        { headers: { Authorization: 'Bearer ' + accessToken } }
      );
      if (!exportResp.ok) throw new Error('HTTP ' + exportResp.status);
      const text = await exportResp.text();
      const lines = text.split('\n').filter(l => l.trim());
      const result = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = [];
        let cur = '', inQ = false;
        for (const ch of lines[i]) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
          else { cur += ch; }
        }
        cols.push(cur.trim());
        if (cols[0]) result.push({ nazwa: cols[0], kod: cols[1] || '' });
      }
      if (result.length > 0) {
        // Merge: keep existing, add only new entries
        const existingNames = new Set(cached.map(e => e.nazwa));
        const merged = [...cached, ...result.filter(r => !existingNames.has(r.nazwa))];
        await setDoc(doc(db, 'katalogi', 'probki'), { items: merged, updatedAt: new Date().toISOString() });
        setProbkiKatalog(merged);
      }
    } catch(e) {
      console.error('Blad katalogu probek:', e);
      alert('Błąd pobierania: ' + e.message);
    }
    finally { setProbkiKatalogLoading(false); }
  };

  // Extract dekor number from product name e.g. "4436 VL" -> "4436", "U335 ST9" -> "335"
  const extractDekorNr = (name) => {
    const m = name.match(/[Uu]?([0-9]{3,5})/);
    return m ? m[1].replace(/^0+/, '') : '';
  };

  const fetchAkcesoriaKatalog = async () => {
    if (akcesoriaKatalog.length > 0) return; // already loaded
    setAkcesoriaKatalogLoading(true);
    try {
      const url = 'https://docs.google.com/spreadsheets/d/' + AKCESORIA_SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=Sheet1';
      const resp = await fetch(url);
      const text = await resp.text();
      const rows = text.split('\n').slice(1).map(r => {
        const cols = r.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        return { nazwa: cols[0] || '', kod: cols[1] || '' };
      }).filter(r => r.nazwa);
      setAkcesoriaKatalog(rows);
    } catch(e) {
      console.error('Blad pobierania katalogu akcesoriow:', e);
    } finally {
      setAkcesoriaKatalogLoading(false);
    }
  };

  const setOrderMsg = (orderId, msg, autoClose = true) => {
    setUploadMessage(msg); // keep global for CSV section
    // Also store per-order message
    setOrderMessages(prev => ({ ...prev, [orderId]: msg }));
    if (autoClose) {
      setTimeout(() => setOrderMessages(prev => {
        const n = { ...prev };
        if (n[orderId] === msg) delete n[orderId];
        return n;
      }), 8000);
    }
  };

  const handleUploadAttachment = async (orderId, file, targetFolderId) => {
    const driveFolderId = targetFolderId || ATTACHMENTS_FOLDER_ID;
    if (!accessToken) { alert('Najpierw autoryzuj Google Drive w zakładce Zdjęcia'); return; }
    try {
      setIsLoading(true);
      setOrderMsg(orderId, '⏳ Upload ' + file.name + '...', false);

      // Find or create subfolder — full shared drive support
      const qStr = encodeURIComponent("name='" + orderId + "' and '" + driveFolderId + "' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false");
      const searchResp = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=' + qStr + '&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives&pageSize=1&fields=files(id,name)',
        { headers: { Authorization: 'Bearer ' + accessToken } }
      );
      const searchData = await searchResp.json();
      let folderId;

      if (searchData.files && searchData.files.length > 0) {
        folderId = searchData.files[0].id;
      } else {
        // Try to create subfolder
        const createResp = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: String(orderId), mimeType: 'application/vnd.google-apps.folder', parents: [driveFolderId] })
        });
        const folderData = await createResp.json();
        // Whether folder creation succeeded or not, use it or fallback to parent
        folderId = folderData.id || driveFolderId;
      }

      const metadata = { name: file.name, parents: [folderId] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const uploadResp = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true',
        { method: 'POST', headers: { Authorization: 'Bearer ' + accessToken }, body: form }
      );

      if (!uploadResp.ok) {
        const errText = await uploadResp.text();
        throw new Error('Upload ' + uploadResp.status + ': ' + errText.substring(0, 100));
      }
      const uploadData = await uploadResp.json();
      if (!uploadData.id) throw new Error('Brak id pliku w odpowiedzi Drive');

      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      const currentAttachments = order.attachments || [];
      await updateDoc(orderRef, {
        attachments: [...currentAttachments, { name: file.name, driveFileId: uploadData.id, driveLink: uploadData.webViewLink || '', uploadedAt: new Date().toISOString(), uploadedBy: currentUser?.name || currentUser?.email || '?' }],
        history: [...(order.history || []), historyEntry('Dodano zalacznik: ' + file.name)]
      });

      setOrderMsg(orderId, '✅ ' + file.name + ' uploadowany');
    } catch (err) {
      setOrderMsg(orderId, '❌ Błąd uploadu: ' + err.message);
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

  const handleAddWydane = async () => {
    if (!wydaneOrderNum.trim()) { alert('Wpisz numer zamówienia'); return; }
    try {
      setIsLoading(true);
      const existing = orders.find(o => o.id === wydaneOrderNum);
      if (existing) {
        if (existing.wydane) { alert('Zamówienie już jest w Wydanych'); return; }
        const orderRef = doc(db, 'orders', existing.docId);
        await updateDoc(orderRef, { wydane: true, kanapka: wydaneKanapka || '', terminRealizacji: wydaneTermin || '', history: [...(existing.history || []), historyEntry('Wydano na produkcję')] });
      } else {
        await addDoc(collection(db, 'orders'), {
          id: wydaneOrderNum, status: 'none', createdAt: new Date().toISOString(),
          problems: [], photoCount: 0, photoArchived: false,
          wydane: true, kanapka: wydaneKanapka || '', terminRealizacji: wydaneTermin || '',
          history: [historyEntry('Wydano na produkcję')]
        });
      }
      setWydaneOrderNum(''); setWydaneKanapka(''); setWydaneTermin('');
    } catch (err) { alert('Błąd: ' + err.message); }
    finally { setIsLoading(false); }
  };

  const handleAddToAkcesoria = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    try {
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { inAkcesoria: true, history: [...(order.history || []), historyEntry('Dodano do akcesoriów')] });
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const handleWyciete = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (!order.kanapka) { alert('Uzupełnij numer kanapki przed wycięciem'); return; }
    try {
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { wycięte: true, inAkcesoria: true, history: [...(order.history || []), historyEntry('Wycięte + przeniesiono do akcesoriów')] });
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const handleToggleAkcesoria = async (orderId, field) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      const newVal = !(order[field] || false);
      const updates = { [field]: newVal, history: [...(order.history || []), historyEntry(`${newVal ? 'Zaznaczono' : 'Odznaczono'}: ${field}`)] };
      if (field === 'brakAkcesoriow' && newVal) { updates['złożone'] = false; updates['dołożone'] = false; }
      await updateDoc(orderRef, updates);
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const handleMoveToArchive3 = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      const archiveEntry = {
        archivedAt: new Date().toISOString(),
        archivedBy: currentUser?.name || currentUser?.email || '?',
        brakAkcesoriow: order.brakAkcesoriow || false,
        brakiMagazynowe: order.brakiMagazynowe || false,
        brakiList: order.brakiList || [],
        akcesoriaUwagi: order.akcesoriaUwagi || '',
        złożone: order.złożone || false,
        dołożone: order.dołożone || false,
      };
      await updateDoc(orderRef, {
        akcesoriaArchived: true,
        inAkcesoria: false,
        akcesoriaArchiveData: archiveEntry,
        history: [...(order.history || []), historyEntry('Przeniesiono do archiwum akcesoriów')]
      });
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const handleAddTrudnyKlient = async () => {
    if (!tkOrderNum.trim()) { alert('Wpisz numer zamówienia'); return; }
    try {
      setIsLoading(true);
      const existing = orders.find(o => o.id === tkOrderNum);
      const noteEntry = tkNote.trim() ? [{ text: tkNote, date: new Date().toISOString(), user: currentUser?.name || '?' }] : [];
      if (existing) {
        const orderRef = doc(db, 'orders', existing.docId);
        await updateDoc(orderRef, {
          trudnyKlient: true,
          trudnyKlientNotatki: [...(existing.trudnyKlientNotatki || []), ...noteEntry],
          history: [...(existing.history || []), historyEntry('Oznaczono jako Trudny klient')]
        });
      } else {
        await addDoc(collection(db, 'orders'), {
          id: tkOrderNum, status: 'none', createdAt: new Date().toISOString(),
          problems: [], photoCount: 0, photoArchived: false,
          trudnyKlient: true, trudnyKlientNotatki: noteEntry,
          history: [historyEntry('Oznaczono jako Trudny klient')]
        });
      }
      setTkOrderNum(''); setTkNote('');
    } catch (err) { alert('Błąd: ' + err.message); }
    finally { setIsLoading(false); }
  };

  const handleAddTkNote = async (orderId, noteText) => {
    if (!noteText?.trim()) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, {
        trudnyKlientNotatki: [...(order.trudnyKlientNotatki || []), { text: noteText, date: new Date().toISOString(), user: currentUser?.name || '?' }],
        history: [...(order.history || []), historyEntry(`Dodano notatkę TK: ${noteText.substring(0, 30)}...`)]
      });
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const handleArchiveTrudnyKlient = async (orderId) => {
    if (!window.confirm('Przenieść do archiwum trudnych klientów?')) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { trudnyKlientArchived: true, history: [...(order.history || []), historyEntry('Trudny klient → archiwum')] });
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const handlePasswordTerminEdit = (orderId) => {
    const pwd = window.prompt('Wpisz hasło aby zmienić termin realizacji:');
    if (pwd !== 'FlexM') { if (pwd !== null) alert('❌ Nieprawidłowe hasło'); return; }
    setDateEditOrderId('termin_' + orderId);
  };

  const handleSaveTerminEdit = async (orderId, newDate) => {
    if (!newDate) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { terminRealizacji: newDate, history: [...(order.history || []), historyEntry(`Zmieniono termin realizacji na: ${newDate}`)] });
      setDateEditOrderId(null);
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const PALETA_OPTIONS = ['1200', '1400', '1600', '1800', '2000', '2200', '2400', '2600', '2800', 'NASZA'];

  const DEFAULT_TRANSPORTS = [
    'Dostawa kurierska paletowa (Raben)',
    'Dostawa kurierska paletowa (DPD)',
    'Dostawa kurierska paletowa (DHL)',
    'Dostawa dedykowana Flexmeble',
    'Dostawa kurierska (DPD)',
    'Dostawa kurierska (DHL)',
    'Odbiór własny',
  ];

  // Get all unique transports from orders + defaults, sorted
  const getKnownTransports = () => {
    const fromOrders = orders
      .filter(o => o.prestashopData?.transport)
      .map(o => o.prestashopData.transport.trim())
      .filter(t => t.length > 0);
    const all = [...new Set([...DEFAULT_TRANSPORTS, ...fromOrders])];
    return all.sort();
  };

  const handleImportExcel = async (file) => {
    if (!file) return;
    try {
      setImportingExcel(true);
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      let added = 0, skipped = 0;
      for (const row of rows) {
        const orderId = String(row['ID Zamówienia'] || '').trim();
        if (!orderId) continue;

        // Skip if already in ANY active folder
        const existingAny = orders.find(o => o.id === orderId);
        if (existingAny && (existingAny.inPrestashop || existingAny.inKonsultacje || existingAny.inProbki || existingAny.wydaneNaProdukcje)) {
          skipped++; continue;
        }

        // Parse date helper
        const parseD = (d) => {
          if (!d) return '';
          if (typeof d === 'number' || (!isNaN(Number(d)) && String(d).match(/^\d+\.\d+$/))) {
            const dt = new Date(new Date(1899, 11, 30).getTime() + Math.floor(typeof d === 'number' ? d : Number(d)) * 86400000);
            return dt.toLocaleDateString('pl-PL');
          }
          if (d instanceof Date) return d.toLocaleDateString('pl-PL');
          const s = String(d).split(' ')[0].split('T')[0];
          return s.includes('-') ? s.split('-').reverse().join('.') : s;
        };

        const produktyRaw2 = String(row['Produkty'] || '');
        const parsedProds = parseProduktyFromRaw(produktyRaw2);
        const hasProbka = parsedProds.some(p => p.name.toLowerCase().includes('próbka') || p.name.toLowerCase().includes('probka'));
        const hasZdalna = parsedProds.some(p => p.name.toLowerCase().includes('zdalna pomoc'));
        const isOnlyZdalna = hasZdalna && parsedProds.every(p => p.name.toLowerCase().includes('zdalna pomoc'));
        const hasOtherThanZdalna = hasZdalna && !isOnlyZdalna;

        // Determine target folder BEFORE any save
        let targetFolder = { inPrestashop: true, inKonsultacje: false, inProbki: false };
        if (hasProbka) {
          targetFolder = { inPrestashop: false, inKonsultacje: false, inProbki: true };
        } else if (isOnlyZdalna) {
          targetFolder = { inPrestashop: false, inKonsultacje: true, inProbki: false };
        } else if (hasOtherThanZdalna) {
          const choice = window.confirm('Zamówienie #' + orderId + ': "Zdalna pomoc" + inne produkty.\n\nOK = Konsultacje\nAnuluj = Prestashop');
          targetFolder = choice
            ? { inPrestashop: false, inKonsultacje: true, inProbki: false }
            : { inPrestashop: true, inKonsultacje: false, inProbki: false };
        }

        const psData2 = {
          dataDodania: parseD(row['Data dodania']),
          dataRealizacji: String(row['Data Realizacji'] || ''),
          transport: String(row['Transport'] || ''),
          wartosc: String(row['Wartość zamówienia'] || ''),
          kodPocztowy: String(row['Kod pocztowy klienta'] || ''),
          produkty: produktyRaw2,
          dekoryRaw: String(row['Dekory'] || '')
        };

        // ONE save with correct folder
        if (existingAny) {
          await updateDoc(doc(db, 'orders', existingAny.docId), {
            ...targetFolder, prestashopData: psData2,
            history: [...(existingAny.history || []), historyEntry('Import Excel')]
          });
        } else {
          await addDoc(collection(db, 'orders'), {
            id: orderId, status: 'none', createdAt: new Date().toISOString(),
            problems: [], photoCount: 0, photoArchived: false,
            ...targetFolder, prestashopData: psData2,
            history: [historyEntry('Import Excel')]
          });
        }
        added++;
      }
      alert('Import zakończony: ' + added + ' dodanych, ' + skipped + ' pominiętych (już w systemie)');
    } catch (err) {
      alert('Błąd importu: ' + err.message);
    } finally { setImportingExcel(false); }
  };

  const handleLoadCsv = async (orderId) => {
    if (!accessToken) { alert('Najpierw autoryzuj Google Drive'); return; }
    try {
      setIsLoading(true);
      setUploadMessage(`⏳ Szukam plików CSV dla zamówienia #${orderId}...`);

      const searchResp = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${CSV_DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '${orderId}' and trashed=false&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=10`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const folders = await searchResp.json();

      if (!folders.files || folders.files.length === 0) {
        setUploadMessage(`❌ Nie znaleziono folderu dla zamówienia #${orderId}`);
        return;
      }

      const allCsvData = [];
      for (const folder of folders.files) {
        const csvResp = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folder.id}' in parents and name contains '_out.csv' and trashed=false&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=50&fields=files(id,name)`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const csvFiles = await csvResp.json();
        if (!csvFiles.files) continue;

        for (const csvFile of csvFiles.files) {
          const contentResp = await fetch(
            `https://www.googleapis.com/drive/v3/files/${csvFile.id}?alt=media&supportsAllDrives=true`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const csvText = await contentResp.text();
          const rows = csvText.trim().split('\n').map(r => r.trim().replace(/\r/g, '').split(';'));

          const fileName = csvFile.name;
          const parts = fileName.replace('_out.csv', '').split('_');
          const colorName = parts.slice(1).join('_');
          const isThickened = fileName.includes('_36_out');
          const isCountertop = fileName.includes('_38_out');

          allCsvData.push({
            fileName, colorName, isThickened, isCountertop,
            rowCount: rows.length,
            rows: rows.map((cols, idx) => ({
              idx,
              name: cols[0] || '', part: cols[1] || '', material: cols[2] || '',
              length: cols[3] || '', width: cols[4] || '', qty: cols[5] || '',
              edgeLong1: cols[6] || '', edgeLong2: cols[7] || '',
              edgeShort1: cols[8] || '', edgeShort2: cols[9] || '',
              col11: cols[10] || '', barcode1: cols[11] || '',
              barcode: cols[12] || '', col14: cols[13] || '',
              scanned: false
            }))
          });
        }
      }

      const order = orders.find(o => o.id === orderId);
      if (order) {
        const orderRef = doc(db, 'orders', order.docId);
        const totalFormats = allCsvData.reduce((sum, c) => sum + c.rowCount, 0);
        const hasNoDrilling = allCsvData.every(c => c.rows.every(r => !r.barcode1?.trim()));
        const colorCountExclHdf = allCsvData.filter(c => !c.colorName.toLowerCase().includes('hdf')).length;

        // Calculate surface area, edge banding, longest element per color
        let longestElement = 0;
        for (const color of allCsvData) {
          let area = 0, edgeMeters = 0;
          for (const r of color.rows) {
            const l = parseFloat(r.length) || 0;
            const w = parseFloat(r.width) || 0;
            area += (l * w) / 1000000;
            if (l > longestElement) longestElement = l;
            if (w > longestElement) longestElement = w;
            const qty = parseInt(r.qty) || 1;
            if (r.edgeLong1) edgeMeters += (l * qty) / 1000;
            if (r.edgeLong2) edgeMeters += (l * qty) / 1000;
            if (r.edgeShort1) edgeMeters += (w * qty) / 1000;
            if (r.edgeShort2) edgeMeters += (w * qty) / 1000;
          }
          color.surfaceArea = Math.round(area * 1000) / 1000;
          color.edgeMeters = Math.round(edgeMeters * 100) / 100;
        }
        // Auto-set palette based on transport type (only if not already set)
        let autoPaleta = null;
        if (!order.paletaPrestashop) {
          const transport = (order.prestashopData?.transport || '').toLowerCase();
          if (transport.includes('dedykowana')) {
            autoPaleta = 'NASZA';
          } else if (transport.includes('paletowa') || transport.includes('paletowy')) {
            // Paleta longer by min 40mm than longest element, from series 1200..2800
            const PALETA_SERIES = [1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800];
            const minLen = longestElement + 40;
            const suggested = PALETA_SERIES.find(p => p >= minLen);
            autoPaleta = suggested ? String(suggested) : '2800';
          }
        }

        await updateDoc(orderRef, {
          csvData: allCsvData, csvLoaded: true, totalFormats, hasNoDrilling, colorCountExclHdf, longestElement,
          ...(autoPaleta ? { paletaPrestashop: autoPaleta } : {}),
          dekoryNeedCheck: true,
          history: [...(order.history || []), historyEntry('Pobrano ' + allCsvData.length + ' plikow CSV (' + totalFormats + ' formatek)' + (autoPaleta ? ' | Auto-paleta: ' + autoPaleta : ''))]
        });

        // Auto-pobierz linki do plikow akcesoriow i produkcyjnych
        setUploadMessage('Szukam plikow akcesoriow dla #' + orderId + '...');
        let okucLink = null, ciecieLink = null, aFile = null, bFile = null;
        for (const folder of folders.files) {
          const allFilesResp = await fetch(
            'https://www.googleapis.com/drive/v3/files?q=\'' + folder.id + '\' in parents and trashed=false&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=100&fields=files(id,name,webViewLink)',
            { headers: { Authorization: 'Bearer ' + accessToken } }
          );
          const allFilesData = await allFilesResp.json();
          if (!allFilesData.files) continue;
          for (const f of allFilesData.files) {
            if (f.name === 'PL-01_Raport_okuc_skrocony.pdf') okucLink = f.webViewLink;
            if (f.name === 'PL_Ciecie_dluzycy.pdf') ciecieLink = f.webViewLink;
            if (f.name === 'A_' + orderId || f.name === 'A_' + orderId + '.pdf') aFile = f.webViewLink;
            if (f.name === 'B_' + orderId || f.name === 'B_' + orderId + '.pdf') bFile = f.webViewLink;
          }
        }
        const hasNoAcc = !okucLink && !ciecieLink;
        let confirmedBrakAcc = false;
        if (hasNoAcc) {
          const ok1 = window.confirm('Czy w zamówieniu nie ma akcesoriów?\n\nOK = Tak, nie ma akcesoriów\nAnuluj = W zamówieniu są akcesoria, zapomniano dodać plik — uzupełnię i pobiorę CSV ponownie');
          if (!ok1) {
            // User says there ARE accessories — abort CSV load entirely
            const orderRef2 = doc(db, 'orders', order.docId);
            await updateDoc(orderRef2, {
              csvLoaded: false, csvData: [], totalFormats: 0, hasNoDrilling: false,
              colorCountExclHdf: 0, longestElement: 0, dekoryNeedCheck: false,
              accessoryLinks: null,
              history: [...(order.history || []), historyEntry('Przerwano pobieranie CSV — użytkownik wskazał brak pliku akcesoriów w katalogu')]
            });
            setUploadMessage('❌ Pobieranie CSV anulowane. Uzupełnij pliki w katalogu i spróbuj ponownie.');
            setIsLoading(false);
            return;
          }
          // User confirms no accessories — double confirm
          const ok2 = window.confirm('Czy jesteś pewien że w zamówieniu nie powinno być akcesoriów i bierzesz odpowiedzialność za ewentualne nie dołożenie ich do zamówienia?\n\nOK = Tak, potwierdzam\nAnuluj = Cofnij');
          if (!ok2) {
            const orderRef2 = doc(db, 'orders', order.docId);
            await updateDoc(orderRef2, {
              csvLoaded: false, csvData: [], totalFormats: 0, hasNoDrilling: false,
              colorCountExclHdf: 0, longestElement: 0, dekoryNeedCheck: false,
              accessoryLinks: null,
              history: [...(order.history || []), historyEntry('Przerwano pobieranie CSV — cofnięto potwierdzenie braku akcesoriów')]
            });
            setUploadMessage('❌ Pobieranie CSV anulowane.');
            setIsLoading(false);
            return;
          }
          confirmedBrakAcc = true;
        }
        const accUpdates = {
          accessoryLinks: { okucLink, ciecieLink, aFile, bFile },
          history: [...(order.history || []), historyEntry('Linki plikow: akcesoria=' + (hasNoAcc ? 'brak' : 'tak') + ', A=' + (aFile ? 'tak' : 'brak') + ', B=' + (bFile ? 'tak' : 'brak'))]
        };
        if (confirmedBrakAcc) accUpdates.brakAkcesoriow = true;
        await updateDoc(orderRef, accUpdates);
        setUploadMessage('CSV pobrane' + (autoPaleta ? ' | Paleta: ' + autoPaleta : '') + (hasNoAcc ? ' | Brak akcesoriow' : ' | Akcesoria: OK') + ([aFile && 'A_' + orderId, bFile && 'B_' + orderId].filter(Boolean).length ? ' | Prod: ' + [aFile && 'A_' + orderId, bFile && 'B_' + orderId].filter(Boolean).join(', ') : ''));
      }
    } catch (err) {
      setUploadMessage(`❌ Błąd: ${err.message}`);
    } finally { setIsLoading(false); }
  };

  const handleFetchAccessoryLinks = async (orderId) => {
    if (!accessToken) { alert('Najpierw autoryzuj Google Drive'); return; }
    try {
      setIsLoading(true);
      setUploadMessage(`⏳ Szukam plików dla #${orderId}...`);

      // Find order subfolder in CSV drive
      const searchResp = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${CSV_DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '${orderId}' and trashed=false&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=10`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const folders = await searchResp.json();

      if (!folders.files || folders.files.length === 0) {
        setUploadMessage(`❌ Nie znaleziono folderu dla #${orderId}`);
        return;
      }

      let okucLink = null, ciecieLink = null, aFile = null, bFile = null;

      for (const folder of folders.files) {
        const filesResp = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folder.id}' in parents and trashed=false&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=100&fields=files(id,name,webViewLink)`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const filesData = await filesResp.json();
        if (!filesData.files) continue;

        for (const f of filesData.files) {
          if (f.name === 'PL-01_Raport_okuc_skrocony.pdf') okucLink = f.webViewLink;
          if (f.name === 'PL_Ciecie_dluzycy.pdf') ciecieLink = f.webViewLink;
          if (f.name === `A_${orderId}` || f.name === `A_${orderId}.pdf`) aFile = f.webViewLink;
          if (f.name === `B_${orderId}` || f.name === `B_${orderId}.pdf`) bFile = f.webViewLink;
        }
      }

      const order = orders.find(o => o.id === orderId);
      const hasNoAcc = !okucLink && !ciecieLink;

      if (hasNoAcc) {
        // Ask user: confirm no accessories
        const userChoice = window.confirm(
          'Czy jesteś pewny, że w zamówieniu nie ma akcesoriów?\n\nOK = Brak akcesoriów\nAnuluj = Są akcesoria – uzupełnię katalog CSV i ponowię próbę'
        );
        if (!userChoice) {
          setUploadMessage('⚠️ Uzupełnij katalog CSV i ponów pobieranie linków.');
          return;
        }
      }

      if (order) {
        const orderRef = doc(db, 'orders', order.docId);
        await updateDoc(orderRef, {
          accessoryLinks: { okucLink, ciecieLink, aFile, bFile },
          history: [...(order.history || []), historyEntry(`Pobrano linki do plików (akcesoria: ${hasNoAcc ? 'brak' : 'tak'})`)]
        });
        setUploadMessage(`✅ Linki pobrane${hasNoAcc ? ' — brak akcesoriów' : ''}`);
      }
    } catch (err) {
      setUploadMessage(`❌ Błąd: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const canMoveToProduction = (order) => {
    if (!order.prestashopData) return false;
    const d = order.prestashopData;
    if (!d.dataRealizacji || !d.transport || !d.wartosc || !d.kodPocztowy) return false;
    if (!order.paletaPrestashop) return false;
    if (!order.csvLoaded) return false;
    if (!order.sprawdzone) return false;
    if (order.bledy && !order.poprawione) return false;
    if (order.bledy && !order.sprawdzoneBledy) return false;
    // dekoryNeedCheck blokuje TYLKO gdy colorChecked nie jest jeszcze true
    if (order.dekoryNeedCheck && !order.colorChecked) return false;
    if (!order.colorChecked) return false;
    return true;
  };

  const canMoveToProductionReasons = (order) => {
    const reasons = [];
    if (!order.prestashopData) return ['brak danych Prestashop'];
    const d = order.prestashopData;
    if (!d.dataRealizacji) reasons.push('data realizacji');
    if (!d.transport) reasons.push('transport');
    if (!d.wartosc) reasons.push('wartość');
    if (!d.kodPocztowy) reasons.push('kod pocztowy');
    if (!order.paletaPrestashop) reasons.push('paleta');
    if (!order.csvLoaded) reasons.push('CSV');
    if (!order.sprawdzone) reasons.push('sprawdzone');
    if (order.bledy && !order.poprawione) reasons.push('poprawione');
    if (order.bledy && !order.sprawdzoneBledy) reasons.push('sprawdzone błędy');
    if (order.dekoryNeedCheck) reasons.push('dekory');
    if (!order.colorChecked) reasons.push('🎨 KOLORY NIE SPRAWDZONE');
    return reasons;
  };

  // Parse produkty from XLS column 2 into structured rows
  const parseProduktyFromRaw = (raw) => {
    if (!raw) return [];
    // Split on pattern: newline or space before "N x " where N is quantity at start of product
    // Use lookahead that matches ONLY "1 x", "2 x" etc. preceded by newline or start
    const results = [];
    // Split by pattern: "\n1 x " or "\n2 x " etc — product separator
    // Also handle when products are separated by newlines
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l);
    let currentProduct = null;
    for (const line of lines) {
      const qtyMatch = line.match(/^(\d+) x (.+)/);
      if (qtyMatch) {
        if (currentProduct) results.push(currentProduct);
        const qty = qtyMatch[1];
        const rest = qtyMatch[2];
        // Name = everything before first "(" 
        const parenIdx = rest.indexOf('(');
        const name = parenIdx > -1 ? rest.substring(0, parenIdx).trim() : rest.trim();
        let wys = '', szer = '', gl = '';
        const wysMatch = rest.match(/wys\.?\s*(\d+)\s*mm/i);
        const szerMatch = rest.match(/szer\.?\s*(\d+)\s*mm/i);
        const glMatch = rest.match(/g[lł]\.?\s*(\d+)\s*mm/i);
        if (wysMatch) wys = wysMatch[1];
        if (szerMatch) szer = szerMatch[1];
        if (glMatch) gl = glMatch[1];
        currentProduct = { name, qty, wys, szer, gl, link: '' };
      }
      // Ignore continuation lines (like "200" from "250 x 200")
    }
    if (currentProduct) results.push(currentProduct);
    return results;
  };

  const parseDekoryFromExcel = (raw) => {
    if (!raw || raw === 'nan' || raw === 'NaN') return [];
    return raw.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('---'))
      .filter(line => !line.toLowerCase().includes('obr'))
      .filter(line => !line.toLowerCase().includes('drążek'))
      .filter(line => !line.toLowerCase().includes('wiór'))
      .filter(line => !line.toLowerCase().includes('kkolor czarny'))
      .filter(line => !line.includes('0 m²') && !line.includes('0 mb'))
      .map(line => {
        const name = line.replace(/\s*\(.*\)/, '').trim();
        const m2Match = line.match(/([\d.,]+)\s*m²/);
        const mbMatch = line.match(/([\d.,]+)\s*mb/);
        return { name, m2: m2Match ? parseFloat(m2Match[1].replace(',','.')) : 0, mb: mbMatch ? parseFloat(mbMatch[1].replace(',','.')) : 0, type: line.includes('m²') ? 'dekor' : 'edge' };
      })
      .filter(d => d.type === 'dekor');
  };

  const getUniqueDekory = (dekoryList) => {
    const seen = new Set();
    return dekoryList.filter(d => {
      const key = d.name.toLowerCase().replace('hdf bialy','hdf').replace('hdf biały','hdf');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handleDeletePrestashop = async (orderId) => {
    const pwd = window.prompt('Wpisz hasło aby usunąć:');
    if (pwd !== 'FlexM') { if (pwd !== null) alert('❌ Nieprawidłowe hasło'); return; }
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, { inPrestashop: false, history: [...(order.history || []), historyEntry('Usunięto z Prestashop')] });
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const handleManualPrestashopOrder = async () => {
    if (!manualOrderId.trim()) { alert('Wpisz numer zamówienia'); return; }
    try {
      setIsLoading(true);
      const existing = orders.find(o => o.id === manualOrderId && o.inPrestashop);
      if (existing) { alert('Zamówienie już jest w Prestashop'); setIsLoading(false); return; }
      const existingOrder = orders.find(o => o.id === manualOrderId);
      const psData = { dataDodania: new Date().toLocaleDateString('pl-PL'), dataRealizacji: manualDataRealizacji, transport: manualTransport, wartosc: manualWartosc, kodPocztowy: manualKodPocztowy, produkty: '', dekoryRaw: '' };
      if (existingOrder) {
        await updateDoc(doc(db, 'orders', existingOrder.docId), { inPrestashop: true, prestashopData: psData, history: [...(existingOrder.history || []), historyEntry('Dodano ręcznie do Prestashop')] });
      } else {
        await addDoc(collection(db, 'orders'), { id: manualOrderId, status: 'none', createdAt: new Date().toISOString(), problems: [], photoCount: 0, photoArchived: false, inPrestashop: true, prestashopData: psData, history: [historyEntry('Dodano ręcznie do Prestashop')] });
      }
      setManualOrderId(''); setManualDataRealizacji(''); setManualTransport(''); setManualWartosc(''); setManualKodPocztowy('');
    } catch (err) { alert('Błąd: ' + err.message); }
    finally { setIsLoading(false); }
  };

  const handleClearAllOrders = async () => {
    const pwd = window.prompt('UWAGA: Usuwa WSZYSTKIE zamówienia, magazyn próbek i katalogi. Hasło:');
    if (pwd !== 'FlexM') { if (pwd !== null) alert('❌ Hasło'); return; }
    if (!window.confirm('OSTATNIE OSTRZEŻENIE! Usunąć wszystkie dane (zamówienia + magazyn próbek)?')) return;
    try {
      setIsLoading(true);
      // Delete all orders
      const ordersSnap = await getDocs(collection(db, 'orders'));
      for (const d2 of ordersSnap.docs) { await deleteDoc(doc(db, 'orders', d2.id)); }
      // Clear magazyn probek
      await setDoc(doc(db, 'magazyn', 'probki'), {});
      // Clear zamow probki list
      await setDoc(doc(db, 'magazyn', 'zamowProbki'), { items: [] });
      // Clear probki katalog cache (keep it as it's from external source)
      // Reset local state
      setMagazynProbek({});
      setZamowProbkiRows([]);
      alert('✅ Wszystkie dane wyczyszczone');
    } catch (err) { alert('Błąd: ' + err.message); }
    finally { setIsLoading(false); }
  };

  const handleRedownloadCsv = async (orderId) => {
    const pwd = window.prompt('Hasło do ponownego pobrania CSV:');
    if (pwd !== 'FlexM') { if (pwd !== null) alert('❌ Hasło'); return; }
    await handleLoadCsv(orderId);
  };

  const handleEditDataRealizacji = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.prestashopData?.dataRealizacji) {
      const pwd = window.prompt('Hasło do zmiany daty realizacji:');
      if (pwd !== 'FlexM') { if (pwd !== null) alert('❌ Hasło'); return; }
    }
    setDateEditOrderId('ps_date_' + orderId);
  };

  // Convert any date format to DD.MM.YYYY
  const toDisplayDate = (d) => {
    if (!d) return '';
    if (d.includes('-') && d.length === 10) {
      const [y, m, day] = d.split('-');
      return day + '.' + m + '.' + y;
    }
    return d; // already DD.MM.YYYY
  };

  const handleSavePsDate = async (orderId, newDate) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      const displayDate = toDisplayDate(newDate);
      const newPs = { ...(order.prestashopData || {}), dataRealizacji: displayDate };
      await updateDoc(orderRef, { prestashopData: newPs, history: [...(order.history || []), historyEntry('Zmieniono datę realizacji: ' + displayDate)] });
      setDateEditOrderId(null);
    } catch (err) { alert('Błąd: ' + err.message); }
  };

  const handleMoveToProduction = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (!canMoveToProduction(order)) {
      const missing = canMoveToProductionReasons(order);
      alert('Nie mozna wydac na produkcje. Brakuje: ' + missing.join(', '));
      return;
    }

    if (!window.confirm('Przeniesc zamowienie #' + orderId + ' na produkcje?')) return;

    try {
      const orderRef = doc(db, 'orders', order.docId);
      const updates = {
        movedToProduction: true,
        wydaneNaProdukcje: true,
        wydaneNaProdukcjeAt: new Date().toISOString(),
        wydaneNaProdukcjeBy: currentUser?.name || currentUser?.email || '?',
        // NIE dodajemy inPlanowanie — planowanie jest osobnym krokiem
        history: [...(order.history || []), historyEntry('Wydano na produkcje (Prestashop)')]
      };

      // Do akcesoriów tylko jeśli nie ma potwierdzonego braku akcesoriów
      if (!order.brakAkcesoriow) {
        updates.inAkcesoria = true;
      }

      await updateDoc(orderRef, updates);
      alert('Zamowienie #' + orderId + ' wydane na produkcje');
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  const handleCofnijDoPrestashop = async (orderId) => {
    if (!window.confirm('Czy na pewno cofnąć zamówienie #' + orderId + ' do Prestashop? Będzie można je edytować.')) return;
    const pwd = window.prompt('Podaj hasło:');
    if (pwd !== 'FlexM') { alert('Nieprawidłowe hasło.'); return; }
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, 'orders', order.docId);
      await updateDoc(orderRef, {
        movedToProduction: false,
        wydaneNaProdukcje: false,
        wydaneNaProdukcjeAt: null,
        wydaneNaProdukcjeBy: null,
        inAkcesoria: false,
        history: [...(order.history || []), historyEntry('Cofnieto do Prestashop (haslo FlexM) przez ' + (currentUser?.name || currentUser?.email || '?'))]
      });
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  const handleTransferOrder = (orderId, fromStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (!order.dateConfirmed) { alert('Najpierw potwierdź datę transportu'); return; }

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
      const updates = { status: altTarget, history: [...(order.history || []), historyEntry(`Przeniesiono do ${altLabel} (zmiana rodzaju)`)] };
      if (altTarget === 'raben' && order.photoArchived) { updates.spakowane = true; }
      updateDoc(orderRef, updates).then(() => alert(`✅ Przeniesiono do ${altLabel}`));
    } else {
      const orderRef = doc(db, 'orders', order.docId);
      const updates = { status: defaultTarget, history: [...(order.history || []), historyEntry(`Przeniesiono do ${defaultLabel}`)] };
      if (defaultTarget === 'raben' && order.photoArchived) { updates.spakowane = true; }
      updateDoc(orderRef, updates).then(() => alert(`✅ Przeniesiono do ${defaultLabel}`));
    }
  };

  const sortByNum = (a, b) => parseInt(a.id) - parseInt(b.id);
  const sortByDateThenNum = (a, b) => {
    const aHas = !!a.transportDate; const bHas = !!b.transportDate;
    if (aHas && !bHas) return -1; if (!aHas && bHas) return 1;
    if (aHas && bHas) return a.transportDate.localeCompare(b.transportDate);
    return parseInt(a.id) - parseInt(b.id);
  };
  const sortByDate = (a, b) => (a.transportDate || '9999').localeCompare(b.transportDate || '9999');
  const sortByDateThenPaleta = (a, b) => {
    const d = (a.transportDate || '9999').localeCompare(b.transportDate || '9999');
    if (d !== 0) return d;
    const parsePaleta = (p) => { if (!p) return 999; const parts = String(p).split('.'); return parseInt(parts[0]) * 100 + parseInt(parts[1] || 0); };
    return parsePaleta(a.paleta) - parsePaleta(b.paleta);
  };
  const sortByKanapka = (a, b) => {
    const getNum = (k) => { if (!k) return 999999; return parseInt(k.replace(/[^0-9]/g, '')) || 999999; };
    return getNum(a.kanapka) - getNum(b.kanapka);
  };
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').sort(sortByNum);
  const readyOrders = orders.filter(o => o.status === 'ready').sort(sortByNum);
  const palletOrders = orders.filter(o => o.status === 'pallet').sort(sortByDateThenNum);
  const dedicatedOrders = orders.filter(o => o.status === 'dedicated').sort(sortByDateThenNum);
  const archive2Orders = orders.filter(o => o.photoArchived === true).sort(sortByNum);
  const rabenOrders = orders.filter(o => o.status === 'raben').sort(sortByDate);
  const transportOrders = orders.filter(o => o.status === 'transport').sort(sortByDateThenPaleta);
  const archive1Orders = orders.filter(o => o.status === 'archived').sort(sortByNum);
  const wydaneOrders = orders.filter(o => o.wydane && !o.wycięte).sort(sortByKanapka);
  const akcesoriaOrders = orders.filter(o => o.inAkcesoria && !o.akcesoriaArchived).sort(sortByKanapka);
  const archive3Orders = orders.filter(o => o.akcesoriaArchived === true).sort(sortByNum);
  const trudnyKlientOrders = orders.filter(o => o.trudnyKlient && !o.trudnyKlientArchived).sort(sortByNum);
  const getOrderDekorCount = (o) => {
    if (o.colorCountExclHdf > 0) return o.colorCountExclHdf;
    // fallback: count dekory from excel, exclude HDF
    if (o.prestashopData?.dekoryRaw) {
      try {
        return getUniqueDekory(parseDekoryFromExcel(o.prestashopData.dekoryRaw))
          .filter(d => !d.name.toLowerCase().includes('hdf'))
          .length;
      } catch(e) { return 0; }
    }
    return 0;
  };

  const getOrderDekoryNames = (o) => {
    const names = [];
    if (o.csvData) o.csvData.forEach(c => names.push(c.colorName.toLowerCase()));
    if (o.prestashopData?.dekoryRaw) {
      try { getUniqueDekory(parseDekoryFromExcel(o.prestashopData.dekoryRaw)).forEach(d => names.push(d.name.toLowerCase())); } catch(e) {}
    }
    return names;
  };

  const applyPsFilters = (list) => {
    let result = list;
    if (psFilterZaproj) result = result.filter(o => o.zaprojektowane);
    if (psFilterSprawdzone) result = result.filter(o => o.sprawdzone);
    if (psFilterBledy) result = result.filter(o => o.bledy);
    if (psFilterKodPoczt.trim()) result = result.filter(o => (o.prestashopData?.kodPocztowy || '').includes(psFilterKodPoczt.trim()));
    if (psFilterDekor.trim()) {
      const q = psFilterDekor.trim().toLowerCase();
      result = result.filter(o => getOrderDekoryNames(o).some(n => n.includes(q)));
    }
    return result;
  };

  const prestashopSorted = orders.filter(o => o.inPrestashop && !o.movedToProduction);
  const wydaneNaProdukcjeOrders = orders.filter(o => o.wydaneNaProdukcje).sort(sortByKanapka);
  const konsultacjeOrders = orders.filter(o => o.inKonsultacje && !o.konsultacjeArchived).sort((a,b) => {
    const ad = a.prestashopData?.dataKonsultacji || '9999';
    const bd = b.prestashopData?.dataKonsultacji || '9999';
    return ad.localeCompare(bd);
  });
  const today = new Date().toLocaleDateString('pl-PL');
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('pl-PL');
  const konsultacjeDzisiaj = konsultacjeOrders.filter(o => {
    const dk = o.prestashopData?.dataKonsultacji || '';
    return dk.startsWith(today.split('.').reverse().join('-')) || dk.includes(today);
  });
  const konsultacjeJutro = konsultacjeOrders.filter(o => {
    const dk = o.prestashopData?.dataKonsultacji || '';
    return dk.startsWith(tomorrow.split('.').reverse().join('-')) || dk.includes(tomorrow);
  });
  const probkiOrders = orders.filter(o => o.inProbki && !o.probkiArchived);
  const planowanieOrders = orders.filter(o => o.inPlanowanie && !o.planowanieArchived).sort((a, b) => {
    const aSpak = (a.spakowane || false) ? 1 : 0;
    const bSpak = (b.spakowane || false) ? 1 : 0;
    if (aSpak !== bSpak) return aSpak - bSpak;
    return sortByKanapka(a, b);
  });
  const prestashopOrders = psSortBy === 'date' ? prestashopSorted.sort((a,b) => (a.prestashopData?.dataRealizacji||'9999').localeCompare(b.prestashopData?.dataRealizacji||'9999'))
    : psSortBy === 'value' ? prestashopSorted.sort((a,b) => parseFloat((a.prestashopData?.wartosc||'0').replace(',','.')) - parseFloat((b.prestashopData?.wartosc||'0').replace(',','.')))
    : psSortBy === 'colors' ? prestashopSorted.sort((a,b) => getOrderDekorCount(b) - getOrderDekorCount(a))
    : prestashopSorted.sort(sortByNum);

  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

  const getTabs = () => {
    if (!currentUser) return [];
    const a = getUserAccess(currentUser);
    const tabs = [];
    if (a.prestashop || a.prestashop_manage || a.prestashop_poprawione) tabs.push('prestashop');
    if (a.wydane_na_produkcje || a.wydane_na_produkcje_manage) tabs.push('wydane_na_produkcje');
    if (a.planowanie) tabs.push('planowanie');
    if (a.konsultacje) tabs.push('konsultacje');
    if (a.probki) tabs.push('probki');
    if (a.wydane || a.wydane_manage) tabs.push('wydane');
    if (a.akcesoria) tabs.push('akcesoria');
    if (a.orders || a.orders_manage) tabs.push('orders');
    if (a.ready) tabs.push('ready');
    if (a.pallet) tabs.push('pallet');
    if (a.dedicated) tabs.push('dedicated');
    if (a.photos) tabs.push('photos');
    if (a.raben || a.raben_manage) tabs.push('raben');
    if (a.transport || a.transport_manage) tabs.push('transport');
    if (a.archive3) tabs.push('archive3');
    if (a.archive2) tabs.push('archive2');
    if (a.archive1) tabs.push('archive1');
    if (a.trudny_klient) tabs.push('trudny_klient');
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
            <img src={LOGO} alt='Flexmeble' style={{ height: '50px', display: 'block', margin: '0 auto 1rem auto' }} /><h2 style={{ textAlign: 'center', margin: '0 0 0.5rem 0', color: '#555' }}>System produkcyjny</h2><div style={{ textAlign: 'center', fontSize: '12px', color: '#bbb', marginBottom: '1.5rem' }}>v25.16</div>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email" style={{ width: '100%', marginBottom: '1rem' }} />
            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Hasło" style={{ width: '100%', marginBottom: '1rem' }} />
            <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%' }}>Zaloguj</button>
          </div>
        </div>
      )}

      {appState === 'dashboard' && currentUser && (
        <div>
          <div className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><img src={LOGO} alt='Flexmeble' style={{ height: '35px' }} /><span style={{ fontSize: '14px', color: '#999' }}>System</span></div>
            <button className="btn btn-danger" onClick={handleLogout}>Wyloguj</button>
          </div>

          <div className="tabs">
            {visibleTabs.includes('prestashop') && <button className={`tab-btn ${activeTab === 'prestashop' ? 'active' : ''}`} onClick={() => { setActiveTab('prestashop'); setSearchQuery(''); }}>🛒 Prestashop</button>}
            {visibleTabs.includes('wydane_na_produkcje') && <button className={`tab-btn ${activeTab === 'wydane_na_produkcje' ? 'active' : ''}`} onClick={() => { setActiveTab('wydane_na_produkcje'); setSearchQuery(''); }}>🏭 Wydane PS</button>}
            {visibleTabs.includes('konsultacje') && <button className={`tab-btn ${activeTab === 'konsultacje' ? 'active' : ''}`} onClick={() => { setActiveTab('konsultacje'); setSearchQuery(''); }}>💬 Konsultacje</button>}
            {visibleTabs.includes('probki') && <button className={`tab-btn ${activeTab === 'probki' ? 'active' : ''}`} onClick={() => { setActiveTab('probki'); setSearchQuery(''); }}>🎨 Próbki</button>}
            {visibleTabs.includes('planowanie') && <button className={`tab-btn ${activeTab === 'planowanie' ? 'active' : ''}`} onClick={() => { setActiveTab('planowanie'); setSearchQuery(''); }}>📅 Planowanie</button>}
            {visibleTabs.includes('wydane') && <button className={`tab-btn ${activeTab === 'wydane' ? 'active' : ''}`} onClick={() => { setActiveTab('wydane'); setSearchQuery(''); }}>🔧 Wydane</button>}
            {visibleTabs.includes('akcesoria') && <button className={`tab-btn ${activeTab === 'akcesoria' ? 'active' : ''}`} onClick={() => { setActiveTab('akcesoria'); setSearchQuery(''); }}>🧩 Akcesoria</button>}
            {visibleTabs.includes('orders') && <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}>📦 Zamówienia</button>}
            {visibleTabs.includes('ready') && <button className={`tab-btn ${activeTab === 'ready' ? 'active' : ''}`} onClick={() => { setActiveTab('ready'); setSearchQuery(''); }}>📋 Gotowe</button>}
            {visibleTabs.includes('pallet') && <button className={`tab-btn ${activeTab === 'pallet' ? 'active' : ''}`} onClick={() => { setActiveTab('pallet'); setSearchQuery(''); }}>🎨 Paletowy</button>}
            {visibleTabs.includes('dedicated') && <button className={`tab-btn ${activeTab === 'dedicated' ? 'active' : ''}`} onClick={() => { setActiveTab('dedicated'); setSearchQuery(''); }}>📦 Dedykowana</button>}
            {visibleTabs.includes('photos') && <button className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => { setActiveTab('photos'); setSearchQuery(''); }}>📸 Zdjęcia</button>}
            {visibleTabs.includes('raben') && <button className={`tab-btn ${activeTab === 'raben' ? 'active' : ''}`} onClick={() => { setActiveTab('raben'); setSearchQuery(''); }}>🚚 Raben</button>}
            {visibleTabs.includes('transport') && <button className={`tab-btn ${activeTab === 'transport' ? 'active' : ''}`} onClick={() => { setActiveTab('transport'); setSearchQuery(''); }}>🚛 Transporty</button>}
            {visibleTabs.includes('archive2') && <button className={`tab-btn ${activeTab === 'archive2' ? 'active' : ''}`} onClick={() => { setActiveTab('archive2'); setSearchQuery(''); }}>📂 Archiwum zdjęć</button>}
            {visibleTabs.includes('archive3') && <button className={`tab-btn ${activeTab === 'archive3' ? 'active' : ''}`} onClick={() => { setActiveTab('archive3'); setSearchQuery(''); }}>🧩 Archiwum akces.</button>}
            {visibleTabs.includes('archive1') && <button className={`tab-btn ${activeTab === 'archive1' ? 'active' : ''}`} onClick={() => { setActiveTab('archive1'); setSearchQuery(''); }}>🗄️ Archiwum</button>}
            {visibleTabs.includes('trudny_klient') && <button className={`tab-btn ${activeTab === 'trudny_klient' ? 'active' : ''}`} style={activeTab === 'trudny_klient' ? {background:'#f44336',borderColor:'#f44336',color:'white'} : {borderColor:'#f44336',color:'#f44336'}} onClick={() => { setActiveTab('trudny_klient'); setSearchQuery(''); }}>⚠️ Trudny klient</button>}
            {visibleTabs.includes('admin') && <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => { setActiveTab('admin'); setSearchQuery(''); }}>⚙️ Admin</button>}
          </div>

          {/* ===== WYDANE NA PRODUKCJĘ (z Prestashop) ===== */}
          {activeTab === 'wydane_na_produkcje' && (() => {
            const canManage = getUserAccess(currentUser).wydane_na_produkcje_manage;
            const filtered = wydaneNaProdukcjeOrders.filter(o => !searchQuery || o.id.includes(searchQuery));
            return (
              <div>
                <h2>🏭 Wydane na produkcję ({filtered.length})</h2>
                <div className="search-box">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px', alignItems: 'center', background: '#f5f5f5', padding: '8px', borderRadius: '6px' }}>
                  <input type="text" value={psFilterKodPoczt} onChange={e => setPsFilterKodPoczt(e.target.value)} placeholder="Kod pocztowy..." style={{ padding: '3px 7px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', width: '130px' }} />
                  {psFilterKodPoczt && <button className="btn" onClick={() => setPsFilterKodPoczt('')} style={{ fontSize: '11px', padding: '2px 8px' }}>✕</button>}
                </div>
                {applyPsFilters(filtered).map(order => {
                  const ps = order.prestashopData || {};
                  return (
                    <React.Fragment key={order.docId}>
                      <div className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0 }}>#{order.id}</h3>
                          {ps.dataRealizacji && <span style={{ fontSize: '14px', fontWeight: 'bold' }}>📅 {ps.dataRealizacji}</span>}
                          {order.kanapka && <span style={{ fontSize: '13px', background: '#fff9c4', padding: '2px 6px', borderRadius: '4px' }}>🥪 {order.kanapka}</span>}
                          {order.paletaPrestashop && <span style={{ fontSize: '12px', background: '#e3f2fd', padding: '2px 6px', borderRadius: '4px' }}>🎨 {order.paletaPrestashop}</span>}
                          {ps.transport && <span style={{ fontSize: '11px', color: '#666' }}>{ps.transport.substring(0, 35)}{ps.transport.length > 35 ? '...' : ''}</span>}
                          {order.wydaneNaProdukcjeBy && <span style={{ fontSize: '11px', color: '#999' }}>by {order.wydaneNaProdukcjeBy}</span>}
                          {order.trudnyKlient && <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '4px' }}>⚠️ TK</span>}
                        </div>
                      </div>
                      {selectedOrderId === order.id && (
                        <div className="card" style={{ borderLeft: '3px solid #4caf50' }}>
                          {/* === WYDANE PS: identyczny widok jak PS, bez edycji === */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#4caf50', fontWeight: 'bold' }}>🏭 Wydano: {order.wydaneNaProdukcjeAt ? new Date(order.wydaneNaProdukcjeAt).toLocaleString('pl-PL') : '—'} przez {order.wydaneNaProdukcjeBy || '?'}</span>
                          </div>

                          {/* Dane podstawowe — identyczne jak PS */}
                          <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                            <div><strong>Data dodania:</strong> {ps.dataDodania || '—'}</div>
                            <div><strong>Transport:</strong> {ps.transport || '—'}</div>
                            <div><strong>Data realizacji:</strong> {ps.dataRealizacji || '—'} {ps.dataRealizacji && <span style={{ background: '#ffecb3', padding: '1px 5px', borderRadius: '3px', fontSize: '12px' }}>🔒</span>}</div>
                            <div><strong>Wartość:</strong> {ps.wartosc || '—'} zł</div>
                            <div><strong>Kod pocztowy:</strong> {ps.kodPocztowy || '—'}</div>
                          </div>

                          {/* Produkty — identyczne jak PS */}
                          {order.prestashopData?.produkty && (() => {
                            const rows = parseProduktyFromRaw(order.prestashopData.produkty);
                            if (!rows.length) return null;
                            return (
                              <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>📦 Produkty w zamówieniu:</div>
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                    <thead>
                                      <tr style={{ background: '#f5f5f5' }}>
                                        <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #ddd' }}>Nazwa produktu</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>Ilość</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>Wys. mm</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>Szer. mm</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>Gł. mm</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>Link</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rows.map((row, idx) => {
                                        const savedLink = (order.prestashopData?.produktyLinks || [])[idx] || '';
                                        return (
                                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>{row.name}</td>
                                            <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{row.qty}</td>
                                            <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{row.wys || '—'}</td>
                                            <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{row.szer || '—'}</td>
                                            <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{row.gl || '—'}</td>
                                            <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>
                                              {savedLink ? <a href={savedLink} target="_blank" rel="noreferrer" style={{ color: '#1976d2', fontSize: '11px' }}>🔗 otwórz</a> : '—'}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Najdłuższy element */}
                          {order.longestElement > 0 && (
                            <div style={{ background: '#e3f2fd', padding: '8px', borderRadius: '4px', marginBottom: '1rem', fontSize: '14px', fontWeight: 'bold' }}>
                              📏 Najdłuższy element: {order.longestElement} mm
                            </div>
                          )}

                          {/* Tabela CSV kolorów */}
                          {order.csvData && order.csvData.length > 0 && (() => {
                            const totalFormats2 = order.csvData.reduce((s, c) => s + (c.formatCount || 0), 0);
                            const totalArea = order.csvData.reduce((s, c) => s + (c.surfaceArea || 0), 0);
                            return (
                              <div style={{ marginBottom: '1rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                  <thead>
                                    <tr style={{ background: '#f5f5f5' }}>
                                      <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #ddd' }}>Kolor</th>
                                      <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd' }}>Formatki</th>
                                      <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd' }}>m²</th>
                                      <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd' }}>Okl. MB</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.csvData.map((color, idx) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>{color.isCountertop ? 'blat_' : ''}{color.colorName}</td>
                                        <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{color.formatCount || 0}</td>
                                        <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{(color.surfaceArea || 0).toFixed(3)} m²</td>
                                        <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{(color.edgeMeters || 0).toFixed(2)} mb</td>
                                      </tr>
                                    ))}
                                    <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                                      <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>RAZEM</td>
                                      <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{totalFormats2}</td>
                                      <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{totalArea.toFixed(3)} m²</td>
                                      <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}

                          {/* Paleta */}
                          {order.paletaPrestashop && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>🎨 Paleta:</div>
                              <div style={{ fontSize: '14px' }}>{order.paletaPrestashop}</div>
                            </div>
                          )}

                          {/* Checkboxy status — tylko podgląd */}
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', opacity: 0.7 }}>
                            <label style={{ fontSize: '13px' }}><input type="checkbox" checked={order.zaprojektowane || false} readOnly disabled /> Zaprojektowane</label>
                            <label style={{ fontSize: '13px' }}><input type="checkbox" checked={order.sprawdzone || false} readOnly disabled /> Sprawdzone</label>
                            {order.bledy && <label style={{ fontSize: '13px' }}><input type="checkbox" checked={order.bledy || false} readOnly disabled /> Błędy</label>}
                          </div>

                          {/* Uwagi — tylko podgląd */}
                          {order.prestashopUwagi && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>📝 Uwagi:</div>
                              <div style={{ fontSize: '13px', background: '#f9f9f9', padding: '6px', borderRadius: '4px' }}>{order.prestashopUwagi}</div>
                            </div>
                          )}

                          {/* Kolory sprawdzone */}
                          {order.colorChecked && (
                            <div style={{ background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: '6px', padding: '8px', marginBottom: '1rem', fontSize: '13px', fontWeight: 'bold' }}>✅ Kolory sprawdzone</div>
                          )}

                          {/* Akcesoria (raporty) */}
                          {order.accessoryLinks && (order.accessoryLinks.okucLink || order.accessoryLinks.ciecieLink) && (
                            <div style={{ background: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>📎 Akcesoria (raporty):</div>
                              {order.accessoryLinks.okucLink ? <a href={order.accessoryLinks.okucLink} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#7b1fa2' }}>📄 PL-01_Raport_okuc_skrocony.pdf</a> : null}
                              {order.accessoryLinks.ciecieLink ? <a href={order.accessoryLinks.ciecieLink} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#7b1fa2' }}>📄 PL_Ciecie_dluzycy.pdf</a> : null}
                            </div>
                          )}

                          {/* Brak akcesoriów info */}
                          {order.brakAkcesoriow && (
                            <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: '6px', padding: '8px', marginBottom: '8px', fontSize: '13px' }}>❌ Brak akcesoriów — potwierdzone</div>
                          )}

                          {/* Pliki produkcyjne A_ B_ */}
                          {order.accessoryLinks && (order.accessoryLinks.aFile || order.accessoryLinks.bFile) && (
                            <div style={{ background: '#e8eaf6', border: '1px solid #9fa8da', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>🗂️ Pliki produkcyjne:</div>
                              {order.accessoryLinks.aFile ? <a href={order.accessoryLinks.aFile} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#283593' }}>📁 A_{order.id}</a> : null}
                              {order.accessoryLinks.bFile ? <a href={order.accessoryLinks.bFile} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#283593' }}>📁 B_{order.id}</a> : null}
                            </div>
                          )}

                          {/* Dodaj plik produkcyjny */}
                          <div style={{ background: '#e0f2f1', border: '1px solid #80cbc4', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>📤 Dodaj plik produkcyjny:</div>
                            {accessToken
                              ? <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAttachment(order.id, f, PRODUKCJA_FOLDER_ID); e.target.value = ''; }} style={{ fontSize: '12px' }} />
                              : <button className="btn btn-primary" onClick={handleAuthorizeGoogle} style={{ fontSize: '12px' }}>🔐 Autoryzuj Drive</button>}
                            {(order.attachments || []).filter(a => a.type === 'produkcyjny' || !a.type).map((att, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px', marginTop: '4px', fontSize: '11px' }}>
                                <a href={att.driveLink || '#'} target="_blank" rel="noreferrer" style={{ color: '#00695c' }}>📄 {att.name}</a>
                              </div>
                            ))}
                          </div>

                          {/* Uwagi produkcyjne — edytowalne */}
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📝 Uwagi produkcyjne:</label>
                            <textarea defaultValue={order.uwagiProdukcyjne || ''} onBlur={e => { if (e.target.value !== (order.uwagiProdukcyjne || '')) handleUpdateOrderField(order.id, 'uwagiProdukcyjne', e.target.value); }} placeholder="Uwagi do produkcji..." style={{ width: '100%', height: '50px' }} />
                          </div>

                          {/* Cofnij do Prestashop */}
                          {canManage && (
                            <button className="btn btn-danger" onClick={() => handleCofnijDoPrestashop(order.id)} disabled={isLoading} style={{ width: '100%', fontSize: '12px' }}>↩️ Cofnij do Prestashop i edytuj</button>
                          )}

                          {/* Historia */}
                          {order.history && order.history.length > 0 && (
                            <details style={{ marginTop: '8px' }}>
                              <summary style={{ fontSize: '12px', cursor: 'pointer' }}>📋 Historia</summary>
                              <div style={{ maxHeight: '150px', overflow: 'auto', marginTop: '4px' }}>
                                {[...order.history].reverse().map((h, i) => (
                                  <div key={i} style={{ fontSize: '11px', padding: '2px 0', borderBottom: '1px solid #eee' }}>
                                    {new Date(h.timestamp).toLocaleString('pl-PL')} — <strong>{h.user}</strong>: {h.action}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })()}

          {activeTab === 'konsultacje' && (
            <div>
              <h2>💬 Konsultacje ({konsultacjeOrders.length})</h2>

              {/* Dzisiaj i jutro */}
              {(konsultacjeDzisiaj.length > 0 || konsultacjeJutro.length > 0) && (
                <div style={{ background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: '8px', padding: '10px', marginBottom: '1rem' }}>
                  {konsultacjeDzisiaj.length > 0 && <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#2e7d32' }}>📅 Dziś: {konsultacjeDzisiaj.map(o => '#' + o.id + ' ' + (o.prestashopData?.dataKonsultacji || '')).join(' | ')}</div>}
                  {konsultacjeJutro.length > 0 && <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1565c0', marginTop: '4px' }}>📅 Jutro: {konsultacjeJutro.map(o => '#' + o.id + ' ' + (o.prestashopData?.dataKonsultacji || '')).join(' | ')}</div>}
                </div>
              )}

              <div className="search-box"><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj..." /></div>
              {konsultacjeOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => {
                const ps = order.prestashopData || {};
                const dataK = ps.dataKonsultacji || '';
                const potwierdzona = ps.dataKonsultacjiPotwierdzona || false;
                return (
                  <React.Fragment key={order.docId}>
                    <div className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0 }}>#{order.id}</h3>
                        {ps.dataDodania && <span style={{ fontSize: '12px', color: '#666' }}>dodano: {ps.dataDodania}</span>}
                        {dataK && !potwierdzona && <span style={{ fontSize: '12px', background: '#fff3e0', padding: '1px 6px', borderRadius: '4px' }}>🕐 {dataK}</span>}
                        {dataK && potwierdzona && <span style={{ fontSize: '12px', background: '#e8f5e9', color: '#2e7d32', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>✅ {dataK} — {ps.konsultantImie || ''}</span>}
                        {order.konsultacjaOdbyta && <span style={{ fontSize: '12px', background: '#e3f2fd', padding: '1px 6px', borderRadius: '4px' }}>📞 odbyta</span>}
                      </div>
                    </div>
                    {selectedOrderId === order.id && (
                      <div className="card" style={{ borderLeft: '3px solid #2196F3' }}>
                        <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                          <div><strong>Data dodania:</strong> {ps.dataDodania || '—'}</div>
                          <div><strong>Transport:</strong> {ps.transport || '—'}</div>
                          <div><strong>Wartość:</strong> {ps.wartosc || '—'} zł</div>
                          <div style={{ marginTop: '6px' }}><strong>Produkty:</strong> {ps.produkty || '—'}</div>
                        </div>

                        {/* Data konsultacji — datetime picker */}
                        {!potwierdzona ? (
                          <div style={{ background: '#fff8e1', border: '1px solid #ffcc02', borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>📅 Data konsultacji:</div>
                            <input type="datetime-local" value={konsultacjeDataQ[order.id] || dataK || ''}
                              onChange={e => setKonsultacjeDataQ(prev => ({ ...prev, [order.id]: e.target.value }))}
                              style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', marginRight: '6px' }} />
                            {(konsultacjeDataQ[order.id] || dataK) && (
                              <button className="btn btn-primary" onClick={async () => {
                                const newDate = konsultacjeDataQ[order.id] || dataK;
                                if (!newDate) return;
                                const newPs = { ...ps, dataKonsultacji: newDate };
                                await handleUpdateOrderField(order.id, 'prestashopData', newPs);
                                setKonsultacjeDataQ(prev => { const n = {...prev}; delete n[order.id]; return n; });
                              }} style={{ fontSize: '12px' }}>💾 Zapisz datę</button>
                            )}
                            {dataK && (
                              <div style={{ marginTop: '8px' }}>
                                <button className="btn btn-success" onClick={async () => {
                                  if (!window.confirm('Czy potwierdzasz umówienie z klientem konsultacji w dniu ' + new Date(dataK).toLocaleDateString('pl-PL') + ' o godzinie ' + new Date(dataK).toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'}) + '?')) return;
                                  const imie = window.prompt('Kto odbędzie konsultację (imię lub imię i nazwisko):');
                                  if (!imie || !imie.trim()) return;
                                  const newPs = { ...ps, dataKonsultacjiPotwierdzona: true, konsultantImie: imie.trim() };
                                  await handleUpdateOrderField(order.id, 'prestashopData', newPs);
                                }} style={{ fontSize: '12px', width: '100%' }}>✅ Potwierdź datę konsultacji</button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: '6px', padding: '10px', marginBottom: '8px', fontSize: '13px' }}>
                            <strong style={{ color: '#2e7d32' }}>✅ Data potwierdzona:</strong> {new Date(dataK).toLocaleDateString('pl-PL')} {new Date(dataK).toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'})}
                            <span style={{ marginLeft: '8px', color: '#555' }}>— {ps.konsultantImie}</span>
                          </div>
                        )}

                        {/* Konsultacja odbyta */}
                        {potwierdzona && !order.konsultacjaOdbyta && (
                          <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={order.konsultacjaOdbyta || false} onChange={async () => {
                              if (!window.confirm('Czy zmieniłeś status w sklepie?')) return;
                              await handleUpdateOrderField(order.id, 'konsultacjaOdbyta', true);
                            }} /> Konsultacja odbyta
                          </label>
                        )}

                        {/* Archiwum */}
                        {order.konsultacjaOdbyta && (
                          <button className="btn btn-success" onClick={async () => {
                            const orderRef2 = doc(db, 'orders', order.docId);
                            await updateDoc(orderRef2, { konsultacjeArchived: true, inKonsultacje: false, history: [...(order.history || []), historyEntry('Archiwum konsultacji')] });
                          }} style={{ width: '100%', fontSize: '13px' }}>🗄️ Przenieś do archiwum</button>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {activeTab === 'probki' && (
            <div>
              <h2>🎨 Próbki ({probkiOrders.length})</h2>

              {/* Górne przyciski — Magazyn i Dodaj na magazyn */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button className="btn btn-primary" onClick={() => { fetchProbkiKatalog(); setShowDodajProbki(!showDodajProbki); setShowMagazyn(false); }} style={{ fontSize: '12px' }}>
                  {showDodajProbki ? '✕ Zamknij' : '➕ Dodaj na magazyn'}
                </button>
                {accessToken && (
                  <button className="btn" onClick={() => fetchProbkiKatalog(true)} disabled={probkiKatalogLoading} style={{ fontSize: '12px' }} title="Pobiera nowe pozycje z arkusza Google, nie nadpisuje istniejących">
                    {probkiKatalogLoading ? '⏳' : '🔄'} Aktualizuj listę próbek
                  </button>
                )}
                <button className="btn" onClick={() => { fetchProbkiKatalog(); setShowMagazyn(!showMagazyn); setShowDodajProbki(false); }} style={{ fontSize: '12px' }}>
                  {showMagazyn ? '✕ Zamknij' : '📦 Sprawdź stany magazynowe'}
                </button>
                <button className="btn" onClick={() => setShowPominieteLista(!showPominieteLista)} style={{ fontSize: '12px' }}>
                  {showPominieteLista ? '✕ Zamknij' : '⏭️ Lista pominiętych'}
                </button>
                <button className="btn" onClick={() => setShowWyprodukujPanel(!showWyprodukujPanel)} style={{ fontSize: '12px' }}>
                  {showWyprodukujPanel ? '✕ Zamknij' : '🔨 Do wyprodukowania'}
                </button>
              </div>

              {/* Panel dodaj na magazyn */}
              {showDodajProbki && (
                <div style={{ background: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: '8px', padding: '12px', marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 8px' }}>➕ Dodaj próbki do magazynu</h3>
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <input type="text" value={probkiSearchQ} onChange={e => setProbkiSearchQ(e.target.value)} placeholder="Szukaj po nazwie lub numerze dekoru..."
                      style={{ width: '100%', padding: '7px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                    {probkiSearchQ && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '4px', maxHeight: '200px', overflow: 'auto', zIndex: 10 }}>
                        {probkiKatalogLoading && <div style={{ padding: '8px', fontSize: '12px', color: '#999' }}>Ładowanie...</div>}
                        {(() => {
                          const q2 = probkiSearchQ.toLowerCase();
                          const fil = probkiKatalog.filter(p => p.nazwa.toLowerCase().includes(q2) || extractDekorNr(p.nazwa).includes(q2));
                          return fil.slice(0, 20).map((p, i) => (
                            <div key={i} style={{ padding: '6px 10px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid #f0f0f0' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#e3f2fd'}
                              onMouseLeave={e => e.currentTarget.style.background = ''}
                              onClick={() => {
                                const il = window.prompt('Ile sztuk probki dodajesz do magazynu? ' + p.nazwa);
                                if (!il || isNaN(parseInt(il))) return;
                                setDodajProbkiRows(prev => [...prev, { nazwa: p.nazwa, dekorNr: extractDekorNr(p.nazwa), ilosc: parseInt(il) }]);
                                setProbkiSearchQ('');
                              }}>
                              {p.nazwa}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                  {dodajProbkiRows.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead><tr style={{ background: '#f5f5f5' }}>
                          <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'left' }}>Próbka</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Ilość</th>
                          <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Usuń</th>
                        </tr></thead>
                        <tbody>
                          {dodajProbkiRows.map((r, i) => (
                            <tr key={i}>
                              <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>{r.nazwa}</td>
                              <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                                <input type="number" value={r.ilosc} onChange={e => setDodajProbkiRows(prev => prev.map((x, j) => j === i ? { ...x, ilosc: parseInt(e.target.value) || 0 } : x))}
                                  style={{ width: '60px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '3px', padding: '2px' }} />
                              </td>
                              <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                                <button onClick={() => setDodajProbkiRows(prev => prev.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#f44336', fontSize: '14px' }}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" onClick={() => setProbkiSearchQ(' ')} style={{ fontSize: '12px' }}>+ Dodaj kolejną</button>
                    {dodajProbkiRows.length > 0 && (
                      <button className="btn btn-success" onClick={async () => {
                        for (const r of dodajProbkiRows) {
                          if (r.dekorNr) await updateMagazynProbek(r.dekorNr, r.ilosc, { type: 'dodanie', user: currentUser?.name || currentUser?.email || '?' });
                        }
                        setDodajProbkiRows([]);
                        setShowDodajProbki(false);
                        alert('Dodano do magazynu: ' + dodajProbkiRows.length + ' pozycji');
                      }} style={{ fontSize: '12px' }}>💾 Dodaj na magazyn</button>
                    )}
                  </div>
                </div>
              )}

              {/* Panel stany magazynowe */}
              {showMagazyn && (
                <div style={{ background: '#e8eaf6', border: '1px solid #9fa8da', borderRadius: '8px', padding: '12px', marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 8px' }}>📦 Stany magazynowe próbek</h3>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" value={magazynSearchQ} onChange={e => setMagazynSearchQ(e.target.value)} placeholder="Szukaj..." style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', width: '150px' }} />
                    {['nazwa','ilosc'].map(s => (
                      <button key={s} className={`btn ${magazynSortBy === s ? 'btn-primary' : ''}`} onClick={() => setMagazynSortBy(s)} style={{ fontSize: '11px', padding: '3px 8px' }}>{s === 'nazwa' ? 'Nazwa' : 'Ilość'}</button>
                    ))}
                  </div>
                  <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead><tr style={{ background: '#c5cae9', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '4px 6px', border: '1px solid #9fa8da', textAlign: 'left' }}>Próbka</th>
                        <th style={{ padding: '4px 6px', border: '1px solid #9fa8da', textAlign: 'center' }}>Dostępne</th>
                        <th style={{ padding: '4px 6px', border: '1px solid #9fa8da', textAlign: 'center' }}>Remanent</th>
                      </tr></thead>
                      <tbody>
                        {probkiKatalog
                          .filter(p => !magazynSearchQ || p.nazwa.toLowerCase().includes(magazynSearchQ.toLowerCase()) || extractDekorNr(p.nazwa).includes(magazynSearchQ))
                          .sort((a, b) => {
                            if (magazynSortBy === 'ilosc') return (parseInt(magazynProbek[extractDekorNr(b.nazwa)] || 0)) - (parseInt(magazynProbek[extractDekorNr(a.nazwa)] || 0));
                            return a.nazwa.localeCompare(b.nazwa);
                          })
                          .map((p, i) => {
                            const nr = extractDekorNr(p.nazwa);
                            const ilosc = parseInt(magazynProbek[nr] || 0);
                            return (
                              <tr key={i} style={{ background: ilosc === 0 ? '#fff8e1' : '' }}>
                                <td style={{ padding: '3px 6px', border: '1px solid #e8eaf6' }}>{p.nazwa}</td>
                                <td style={{ padding: '3px 6px', border: '1px solid #e8eaf6', textAlign: 'center', fontWeight: ilosc > 0 ? 'bold' : 'normal', color: ilosc === 0 ? '#999' : '#2e7d32' }}>{ilosc}</td>
                                <td style={{ padding: '3px 6px', border: '1px solid #e8eaf6', textAlign: 'center' }}>
                                  <button className="btn" onClick={() => {
                                    const fiz = window.prompt('Ile sztuk "' + p.nazwa + '" jest fizycznie na magazynie?', String(ilosc));
                                    if (fiz === null || isNaN(parseInt(fiz))) return;
                                    const fizN = parseInt(fiz);
                                    const diff = fizN - ilosc;
                                    if (diff === 0) { alert('Zgodne — brak różnicy'); return; }
                                    const msg = diff > 0 ? 'Mamy o ' + diff + ' szt. więcej niż w systemie — dodaję do magazynu' : 'Brakuje ' + Math.abs(diff) + ' szt. — odejmuję z magazynu';
                                    if (window.confirm(msg + '\nCzy kontynuować?')) {
                                      updateMagazynProbek(nr, diff, { type: 'remanent', user: currentUser?.name || currentUser?.email || '?', fizyczne: fizN, systemowe: ilosc });
                                    }
                                  }} style={{ fontSize: '10px', padding: '1px 5px' }}>🔄</button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Panel Do wyprodukowania */}
              {showWyprodukujPanel && (() => {
                // Build list: all wyprodukuj rows not yet spakowane
                const toWyprodukuj = [];
                probkiOrders.forEach(ord => {
                  const ps2 = ord.prestashopData || {};
                  const rows2 = parseProduktyFromRaw(ps2.produkty || '');
                  rows2.forEach((r, i) => {
                    const rs = (ord.probkiRowStatus || [])[i] || {};
                    if (rs.wyprodukuj) {
                      const dekorNr2 = extractDekorNr(r.name);
                      const dostepne2 = parseInt(magazynProbek[dekorNr2] || 0);
                      // Check total needed across all orders for this dekor
                      let totalNeeded = 0;
                      probkiOrders.forEach(o2 => {
                        const r2 = parseProduktyFromRaw((o2.prestashopData?.produkty) || '');
                        r2.forEach((rr, ii) => {
                          const rs2 = (o2.probkiRowStatus || [])[ii] || {};
                          if (!rs2.spakowane && extractDekorNr(rr.name) === dekorNr2) totalNeeded += parseInt(rr.qty || 1);
                        });
                      });
                      const isPilne = dostepne2 < totalNeeded && !oczekiwanieSet[dekorNr2];
                      toWyprodukuj.push({ orderId: ord.id, orderDocId: ord.docId, rowIdx: i, name: r.name, qty: r.qty, dekorNr: dekorNr2, key: ord.id + '_' + i, isPilne, dostepne: dostepne2 });
                    }
                  });
                });
                const pilne = toWyprodukuj.filter(x => x.isPilne);
                const niepilne = toWyprodukuj.filter(x => !x.isPilne);

                const WyprodukujTabela = ({ items, isPilne }) => (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '8px' }}>
                    <thead><tr style={{ background: isPilne ? '#ffcdd2' : '#c8e6c9' }}>
                      <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'left' }}>Próbka</th>
                      <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Szt.</th>
                      <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Zam.</th>
                      <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Dostępne</th>
                      <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Zlecone</th>
                      <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Wyprodukowane</th>
                      {isPilne && <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Oczekiwanie</th>}
                    </tr></thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.key} style={{ background: wyprodukujZlecone[item.key] ? '#e8f5e9' : '' }}>
                          <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>{item.name}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>{item.qty}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '11px' }}>#{item.orderId}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center', color: item.dostepne > 0 ? '#2e7d32' : '#999' }}>{item.dostepne}</td>
                          <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                            <input type="checkbox" checked={wyprodukujZlecone[item.key] || false}
                              onChange={async () => {
                                const newVal = !wyprodukujZlecone[item.key];
                                setWyprodukujZlecone(prev => ({ ...prev, [item.key]: newVal }));
                                if (newVal) {
                                  // Mark this dekor as zlecone in all orders that have it
                                  const dekorKey = item.dekorNr;
                                  probkiOrders.forEach(async ord2 => {
                                    const rows2 = parseProduktyFromRaw(ord2.prestashopData?.produkty || '');
                                    rows2.forEach(async (rr, ii) => {
                                      if (extractDekorNr(rr.name) === dekorKey) {
                                        const ns2 = [...(ord2.probkiRowStatus || Array(rows2.length).fill({}))];
                                        while (ns2.length < rows2.length) ns2.push({});
                                        ns2[ii] = { ...ns2[ii], zleconeNaProdukcje: true };
                                        await handleUpdateOrderField(ord2.id, 'probkiRowStatus', ns2);
                                      }
                                    });
                                  });
                                }
                              }} />
                          </td>
                          <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                            <input type="checkbox" checked={wyprodukujWyprodukowane[item.key] || false}
                              onChange={async () => {
                                if (wyprodukujWyprodukowane[item.key]) return;
                                const il = window.prompt('Ile sztuk wyprodukowano? (' + item.name + ')');
                                if (!il || isNaN(parseInt(il))) return;
                                const ilN = parseInt(il);
                                setWyprodukujWyprodukowane(prev => ({ ...prev, [item.key]: true }));
                                // Add to magazyn
                                if (item.dekorNr) await updateMagazynProbek(item.dekorNr, ilN, { type: 'wyprodukowanie', orderId: item.orderId, user: currentUser?.name || currentUser?.email || '?' });
                                // Update all orders with this dekor: wyprodukuj=false, zleconeNaProdukcje=false, gotowe=true
                                probkiOrders.forEach(async ord2 => {
                                  const rows2 = parseProduktyFromRaw(ord2.prestashopData?.produkty || '');
                                  const hasDekor = rows2.some(rr => extractDekorNr(rr.name) === item.dekorNr);
                                  if (!hasDekor) return;
                                  const ns2 = [...(ord2.probkiRowStatus || Array(rows2.length).fill({}))];
                                  while (ns2.length < rows2.length) ns2.push({});
                                  rows2.forEach((rr, ii) => {
                                    if (extractDekorNr(rr.name) === item.dekorNr) {
                                      ns2[ii] = { ...ns2[ii], wyprodukuj: false, zleconeNaProdukcje: false, gotowe: true };
                                    }
                                  });
                                  await handleUpdateOrderField(ord2.id, 'probkiRowStatus', ns2);
                                });
                              }} />
                          </td>
                          {isPilne && (
                            <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                              <input type="checkbox" checked={oczekiwanieSet[item.dekorNr] || false}
                                title="Przenieś do niepilnych — pojawi się info o korekcie w zamówieniach"
                                onChange={async () => {
                                  const newOczek = { ...oczekiwanieSet, [item.dekorNr]: true };
                                  setOczekiwanieSet(newOczek);
                                  // Mark in all orders with this dekor that it's on hold
                                  probkiOrders.forEach(async ord2 => {
                                    const rows2 = parseProduktyFromRaw(ord2.prestashopData?.produkty || '');
                                    rows2.forEach(async (rr, ii) => {
                                      if (extractDekorNr(rr.name) === item.dekorNr) {
                                        const ns2 = [...(ord2.probkiRowStatus || Array(rows2.length).fill({}))];
                                        while (ns2.length < rows2.length) ns2.push({});
                                        ns2[ii] = { ...ns2[ii], naOczekiwaniu: true };
                                        await handleUpdateOrderField(ord2.id, 'probkiRowStatus', ns2);
                                      }
                                    });
                                  });
                                }} />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );

                return (
                  <div style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', padding: '12px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0 }}>🔨 Do wyprodukowania</h3>
                      <button className="btn btn-primary" onClick={() => setShowZamowProbki(!showZamowProbki)} style={{ fontSize: '11px' }}>
                        {showZamowProbki ? '✕' : '📋 Zamów próbki'}
                      </button>
                    </div>

                    {/* Panel zamów próbki — zintegrowany w panelu */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e65100' }}>📋 Zamów próbki (nie pilne):</div>
                        <button className="btn" onClick={() => setShowZamowProbki(!showZamowProbki)} style={{ fontSize: '11px' }}>
                          {showZamowProbki ? '✕' : '+ Dodaj'}
                        </button>
                      </div>
                      {showZamowProbki && (
                        <div style={{ position: 'relative', marginBottom: '6px' }}>
                          <input type="text" value={zamowProbkiSearchQ} onChange={e => setZamowProbkiSearchQ(e.target.value)}
                            onFocus={() => { if (probkiKatalog.length === 0) fetchProbkiKatalog(); if (!zamowProbkiSearchQ) setZamowProbkiSearchQ(' '); }}
                            placeholder="Szukaj próbki..."
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }} />
                          {zamowProbkiSearchQ.trim() && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', maxHeight: '150px', overflow: 'auto', zIndex: 10, borderRadius: '4px' }}>
                              {probkiKatalog.filter(p => p.nazwa.toLowerCase().includes(zamowProbkiSearchQ.trim().toLowerCase()) || extractDekorNr(p.nazwa).includes(zamowProbkiSearchQ.trim())).slice(0, 20).map((p, pi) => (
                                <div key={pi} style={{ padding: '5px 8px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid #f0f0f0' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#fff3e0'}
                                  onMouseLeave={e => e.currentTarget.style.background = ''}
                                  onClick={async () => {
                                    const newList = [...zamowProbkiRows, { nazwa: p.nazwa, dekorNr: extractDekorNr(p.nazwa), addedAt: new Date().toISOString(), user: currentUser?.name || '?' }];
                                    setZamowProbkiRows(newList); await updateZamowProbkiList(newList); setZamowProbkiSearchQ('');
                                  }}>{p.nazwa}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {zamowProbkiRows.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead><tr style={{ background: '#ffe0b2' }}>
                            <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'left' }}>Próbka</th>
                            <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Zlecone</th>
                            <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Wyprodukowane</th>
                            <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Usuń</th>
                          </tr></thead>
                          <tbody>
                            {zamowProbkiRows.map((zr, zi) => (
                              <tr key={zi} style={{ background: zr.wyprodukowane ? '#e8f5e9' : '' }}>
                                <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>{zr.nazwa}</td>
                                <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                                  <input type="checkbox" checked={zr.zlecone || false} onChange={async () => {
                                    const nl = zamowProbkiRows.map((x, j) => j === zi ? { ...x, zlecone: !x.zlecone } : x);
                                    setZamowProbkiRows(nl); await updateZamowProbkiList(nl);
                                  }} />
                                </td>
                                <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                                  <input type="checkbox" checked={zr.wyprodukowane || false} onChange={async () => {
                                    if (zr.wyprodukowane) return;
                                    const il = window.prompt('Ile sztuk dodać do magazynu? (' + zr.nazwa + ')');
                                    if (!il || isNaN(parseInt(il))) return;
                                    if (zr.dekorNr) await updateMagazynProbek(zr.dekorNr, parseInt(il), { type: 'wyprodukowanie-zamow', user: currentUser?.name || '?' });
                                    const nl = zamowProbkiRows.map((x, j) => j === zi ? { ...x, wyprodukowane: true } : x);
                                    setZamowProbkiRows(nl); await updateZamowProbkiList(nl);
                                  }} />
                                </td>
                                <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                                  <button onClick={async () => {
                                    const nl = zamowProbkiRows.filter((_, j) => j !== zi);
                                    setZamowProbkiRows(nl); await updateZamowProbkiList(nl);
                                  }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#f44336', fontSize: '13px' }}>✕</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {zamowProbkiRows.length === 0 && !showZamowProbki && <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>Brak zamówionych próbek</p>}
                    </div>

                    {pilne.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#c62828', marginBottom: '4px' }}>🚨 PILNE — niewystarczające stany:</div>
                        <WyprodukujTabela items={pilne} isPilne={true} />
                      </div>
                    )}
                    {niepilne.length > 0 && (
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '4px' }}>📋 Do wyprodukowania:</div>
                        <WyprodukujTabela items={niepilne} isPilne={false} />
                      </div>
                    )}
                    {toWyprodukuj.length === 0 && <p style={{ fontSize: '12px', color: '#666' }}>Brak zaznaczonych do wyprodukowania.</p>}
                  </div>
                );
              })()}

              {/* Lista pominiętych */}
              {showPominieteLista && (
                <div style={{ background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: '8px', padding: '12px', marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 8px' }}>⏭️ Zamówienia z pominiętymi próbkami</h3>
                  {probkiOrders.filter(o => (o.probkiRowStatus || []).some(r => r.pomin)).map(order => {
                    const ps = order.prestashopData || {};
                    const rows2 = parseProduktyFromRaw(ps.produkty || '');
                    return (
                      <div key={order.docId} style={{ background: '#fff', border: '1px solid #ffe0b2', borderRadius: '4px', padding: '8px', marginBottom: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>#{order.id}</div>
                        {rows2.map((r, i) => {
                          const rs = (order.probkiRowStatus || [])[i] || {};
                          if (!rs.pomin) return null;
                          return (
                            <div key={i} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>⏭️ {r.name}</span>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="checkbox" checked={rs.korekta || false} onChange={() => {
                                  const ns = [...(order.probkiRowStatus || Array(rows2.length).fill({}))];
                                  ns[i] = { ...ns[i], korekta: !rs.korekta };
                                  handleUpdateOrderField(order.id, 'probkiRowStatus', ns);
                                }} /> Korekta
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="search-box"><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj..." /></div>
              {probkiOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => {
                const ps = order.prestashopData || {};
                const rows = parseProduktyFromRaw(ps.produkty || '');
                return (
                  <React.Fragment key={order.docId}>
                    {(() => {
                      const rows2 = parseProduktyFromRaw(ps.produkty || '');
                      const allStatuses = rows2.map((r2, i2) => {
                        const rs2 = (order.probkiRowStatus || [])[i2] || {};
                        const nr2 = extractDekorNr(r2.name);
                        const dostepne2 = parseInt(magazynProbek[nr2] || 0);
                        const qty2 = parseInt(r2.qty || 1);
                        return { ...rs2, dostepne: dostepne2, qty: qty2, name: r2.name };
                      });
                      const allDone = allStatuses.length > 0 && allStatuses.every(s => s.spakowane || s.pomin);
                      // canSend: all rows either spakowane, pominięte, available enough, or gotowe/korekta
                      const allAvail = allStatuses.length > 0 && allStatuses.every(s =>
                        s.spakowane || s.pomin || s.naOczekiwaniu || s.gotowe || s.dostepne >= s.qty
                      );
                      const hasWyprodukuj = allStatuses.some(s => s.wyprodukuj && !s.spakowane && !s.zleconeNaProdukcje && !s.gotowe);
                      const hasZlecone = allStatuses.some(s => s.zleconeNaProdukcje && !s.spakowane && !s.gotowe);
                      const hasGotowe = allStatuses.some(s => s.gotowe && !s.spakowane);
                      // Auto-check gotowe when all done
                      if (allDone && !order.probkiGotowe) {
                        handleUpdateOrderField(order.id, 'probkiGotowe', true);
                      }
                      return (
                        <div className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0 }}>#{order.id}</h3>
                            {ps.dataDodania && <span style={{ fontSize: '12px', color: '#666' }}>📅 {ps.dataDodania}</span>}
                            {ps.transport && <span style={{ fontSize: '11px', color: '#888' }}>{ps.transport.substring(0, 30)}</span>}
                            {(allAvail || allDone) && <span title="Można wysłać" style={{ fontSize: '14px' }}>📬</span>}
                            {hasZlecone && <span title="Oczekiwanie na produkcję" style={{ fontSize: '14px' }}>⏳</span>}
                            {hasWyprodukuj && <span title="Do wyprodukowania" style={{ fontSize: '14px' }}>🔨</span>}
                            {!allAvail && !allDone && hasGotowe && !hasZlecone && !hasWyprodukuj && <span title="Część próbek gotowa" style={{ fontSize: '14px' }}>✅</span>}
                            {order.probkiGotowe && !order.probkiWyslane && <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>📦 gotowe</span>}
                            {order.probkiWyslane && <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>✅ wysłane</span>}
                          </div>
                        </div>
                      );
                    })()}
                    {selectedOrderId === order.id && (
                      <div className="card" style={{ borderLeft: '3px solid #9c27b0' }}>
                        <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                          <div><strong>Data dodania:</strong> {ps.dataDodania || '—'}</div>
                          <div><strong>Transport:</strong> {ps.transport || '—'}</div>
                        </div>

                        {/* Tabela produktów z magazynem */}
                        {rows.length > 0 && (
                          <div style={{ marginBottom: '1rem', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: '#f3e5f5' }}>
                                  <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'left' }}>Nazwa próbki</th>
                                  <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Szt.</th>
                                  <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Dostępne</th>
                                  <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Spakowane</th>
                                  <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Wyprodukuj</th>
                                  <th style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>Pomiń</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((r, i) => {
                                  const rs = (order.probkiRowStatus || [])[i] || {};
                                  const dekorNr = extractDekorNr(r.name);
                                  const dostepne = parseInt(magazynProbek[dekorNr] || 0);
                                  return (
                                    <tr key={i} style={{ background: rs.pomin ? '#fff8e1' : rs.spakowane ? '#e8f5e9' : '' }}>
                                      <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>{r.name}</td>
                                      <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>{r.qty}</td>
                                      <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center', color: dostepne > 0 ? '#2e7d32' : '#999', fontWeight: dostepne > 0 ? 'bold' : 'normal' }}>{dostepne}</td>
                                      <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        <input type="checkbox" checked={rs.spakowane || false}
                                          disabled={rs.pomin || (!rs.spakowane && dostepne < parseInt(r.qty || 1))}
                                          title={!rs.spakowane && dostepne < parseInt(r.qty || 1) ? 'Brak wystarczającej ilości na magazynie (' + dostepne + ' / ' + r.qty + ')' : ''}
                                          onChange={async () => {
                                            const newVal = !rs.spakowane;
                                            const ns = [...(order.probkiRowStatus || Array(rows.length).fill({}))];
                                            while (ns.length < rows.length) ns.push({});
                                            ns[i] = { ...ns[i], spakowane: newVal, pomin: false };
                                            handleUpdateOrderField(order.id, 'probkiRowStatus', ns);
                                            if (dekorNr && newVal) await updateMagazynProbek(dekorNr, -parseInt(r.qty || 1), { type: 'spakowanie', orderId: order.id, user: currentUser?.name || currentUser?.email || '?' });
                                            if (dekorNr && !newVal) await updateMagazynProbek(dekorNr, parseInt(r.qty || 1), { type: 'cofniecie spakowania', orderId: order.id, user: currentUser?.name || currentUser?.email || '?' });
                                          }} />
                                      </td>
                                      <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        {rs.naOczekiwaniu ? (
                                          <span style={{ fontSize: '10px', color: '#e65100', fontWeight: 'bold' }} title="Nie będzie teraz zrealizowany — wystaw korektę">⚠️ korekta</span>
                                        ) : rs.gotowe ? (
                                          <span style={{ fontSize: '10px', color: '#2e7d32', fontWeight: 'bold' }} title="Wyprodukowane — dostępne na magazynie">✅ gotowe</span>
                                        ) : rs.zleconeNaProdukcje ? (
                                          <span style={{ fontSize: '10px', color: '#1565c0' }} title="Zlecono na produkcję">⏳ zlecone</span>
                                        ) : (
                                          <input type="checkbox" checked={rs.wyprodukuj || false}
                                            onChange={() => {
                                              const ns = [...(order.probkiRowStatus || Array(rows.length).fill({}))];
                                              while (ns.length < rows.length) ns.push({});
                                              ns[i] = { ...ns[i], wyprodukuj: !rs.wyprodukuj };
                                              handleUpdateOrderField(order.id, 'probkiRowStatus', ns);
                                            }} />
                                        )}
                                      </td>
                                      <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        <input type="checkbox" checked={rs.pomin || false}
                                          disabled={rs.spakowane}
                                          title={rs.spakowane ? 'Nie można pominąć spakowanej pozycji' : ''}
                                          onChange={() => {
                                            const ns = [...(order.probkiRowStatus || Array(rows.length).fill({}))];
                                            while (ns.length < rows.length) ns.push({});
                                            ns[i] = { ...ns[i], pomin: !rs.pomin };
                                            handleUpdateOrderField(order.id, 'probkiRowStatus', ns);
                                          }} />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Uwagi */}
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>📝 Uwagi:</label>
                          <textarea defaultValue={order.probkiUwagi || ''} onBlur={e => { if (e.target.value !== (order.probkiUwagi || '')) handleUpdateOrderField(order.id, 'probkiUwagi', e.target.value); }} placeholder="Uwagi..." style={{ width: '100%', height: '50px' }} />
                        </div>

                        {/* Pliki */}
                        <div style={{ background: '#e0f2f1', border: '1px solid #80cbc4', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>📎 Pliki:</div>
                          {accessToken
                            ? <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAttachment(order.id, f, PROBKI_FOLDER_ID); e.target.value = ''; }} style={{ fontSize: '12px' }} />
                            : <button className="btn btn-primary" onClick={handleAuthorizeGoogle} style={{ fontSize: '12px' }}>🔐 Autoryzuj Drive</button>}
                          {(order.attachments || []).map((att, idx) => (
                            <div key={idx} style={{ fontSize: '11px', marginTop: '3px' }}>
                              <a href={att.driveLink || '#'} target="_blank" rel="noreferrer" style={{ color: '#00695c' }}>📄 {att.name}</a>
                            </div>
                          ))}
                          {orderMessages[order.id] && <div style={{ fontSize: '11px', marginTop: '4px', color: orderMessages[order.id].includes('✅') ? '#2e7d32' : '#c62828' }}>{orderMessages[order.id]}</div>}
                        </div>

                        {/* Gotowe + Wysłane */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                          <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input type="checkbox" checked={order.probkiGotowe || false} onChange={() => handleUpdateOrderField(order.id, 'probkiGotowe', !order.probkiGotowe)} /> Gotowe do wysyłki
                          </label>
                          <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', opacity: order.probkiGotowe ? 1 : 0.4 }}>
                            <input type="checkbox" checked={order.probkiWyslane || false} disabled={!order.probkiGotowe}
                              title={!order.probkiGotowe ? 'Najpierw zaznacz Gotowe do wysyłki' : ''}
                              onChange={() => handleUpdateOrderField(order.id, 'probkiWyslane', !order.probkiWyslane)} /> Wysłane
                          </label>
                        </div>

                        {(() => {
                          const allDone = rows.every((r, i) => {
                            const rs = (order.probkiRowStatus || [])[i] || {};
                            return rs.spakowane || rs.pomin;
                          });
                          const canArchive = order.probkiGotowe && order.probkiWyslane && allDone;
                          return canArchive ? (
                            <button className="btn btn-success" onClick={async () => {
                              const orderRef2 = doc(db, 'orders', order.docId);
                              await updateDoc(orderRef2, { probkiArchived: true, inProbki: false, history: [...(order.history || []), historyEntry('Archiwum próbek')] });
                            }} style={{ width: '100%', fontSize: '13px' }}>🗄️ Przenieś do archiwum</button>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* ===== PLANOWANIE PRODUKCJI ===== */}
          {activeTab === 'planowanie' && (() => {
            const canManage = getUserAccess(currentUser).planowanie;
            const filtered = planowanieOrders.filter(o => !searchQuery || o.id.includes(searchQuery));
            return (
              <div>
                <h2>📅 Planowanie produkcji ({filtered.length})</h2>
                <div className="search-box">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
                </div>
                <p style={{ fontSize: '12px', color: '#666' }}>Sortowanie: niespakowane na górze · spakowane na dole · wg kanapki</p>
                {filtered.map(order => {
                  const ps = order.prestashopData || {};
                  return (
                    <React.Fragment key={order.docId}>
                      <div className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`}
                           style={{ opacity: order.spakowane ? 0.55 : 1, borderLeft: order.spakowane ? '3px solid #aaa' : '3px solid #2196F3' }}
                           onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0 }}>#{order.id}</h3>
                          {ps.dataRealizacji && <span style={{ fontSize: '14px', fontWeight: 'bold' }}>📅 {ps.dataRealizacji}</span>}
                          {order.kanapka && <span style={{ fontSize: '13px', background: '#fff9c4', padding: '2px 6px', borderRadius: '4px' }}>🥪 {order.kanapka}</span>}
                          {order.paletaPrestashop && <span style={{ fontSize: '12px', background: '#e3f2fd', padding: '2px 6px', borderRadius: '4px' }}>🎨 {order.paletaPrestashop}</span>}
                          {order.spakowane && <span style={{ fontSize: '12px', background: '#e0e0e0', padding: '2px 6px', borderRadius: '4px' }}>📦 spakowane</span>}
                          {order.trudnyKlient && <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '4px' }}>⚠️ TK</span>}
                        </div>
                      </div>
                      {selectedOrderId === order.id && (
                        <div className="card" style={{ borderLeft: '3px solid #2196F3' }}>
                          <div style={{ fontSize: '13px', marginBottom: '6px' }}><strong>Transport:</strong> {ps.transport || '—'}</div>
                          <div style={{ fontSize: '13px', marginBottom: '6px' }}><strong>Data realizacji:</strong> {ps.dataRealizacji || '—'}</div>
                          <div style={{ fontSize: '13px', marginBottom: '6px' }}><strong>Paleta:</strong> {order.paletaPrestashop || '—'}</div>

                          {/* Kanapka w planowaniu */}
                          {canManage && (
                            <div style={{ marginBottom: '8px' }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>🥪 Numer kanapki:</label>
                              <input type="text" defaultValue={order.kanapka || ''} placeholder="K123 lub R45"
                                onBlur={e => { if (e.target.value !== (order.kanapka || '')) handleUpdateOrderField(order.id, 'kanapka', e.target.value); }}
                                style={{ width: '100%', padding: '4px', marginTop: '2px' }} />
                            </div>
                          )}

                          {/* Akcesoria */}
                          {order.accessoryLinks && (
                            <div style={{ background: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>📎 Akcesoria:</div>
                              {order.accessoryLinks.okucLink ? <a href={order.accessoryLinks.okucLink} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#7b1fa2' }}>📄 PL-01_Raport_okuc_skrocony.pdf</a> : null}
                              {order.accessoryLinks.ciecieLink ? <a href={order.accessoryLinks.ciecieLink} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#7b1fa2' }}>📄 PL_Ciecie_dluzycy.pdf</a> : null}
                              {!order.accessoryLinks.okucLink && !order.accessoryLinks.ciecieLink && <span style={{ fontSize: '12px', color: '#888' }}>🚫 Brak akcesoriów</span>}
                              {order.accessoryLinks.aFile ? <a href={order.accessoryLinks.aFile} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#4a148c' }}>📁 A_{order.id}</a> : null}
                              {order.accessoryLinks.bFile ? <a href={order.accessoryLinks.bFile} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#4a148c' }}>📁 B_{order.id}</a> : null}
                            </div>
                          )}

                          {/* Upload produkcyjny */}
                          {canManage && (
                            <div style={{ marginBottom: '8px' }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📤 Dodaj plik:</label>
                              <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAttachment(order.id, f, PRODUKCJA_FOLDER_ID); e.target.value = ''; }} style={{ fontSize: '12px' }} />
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })()}

          {activeTab === 'wydane' && (
            <div>
              <h2>🔧 Wydane na produkcję ({wydaneOrders.length})</h2>
              {getUserAccess(currentUser).wydane_manage && (
                <div className="card">
                  <h3>Dodaj zamówienie</h3>
                  <input type="text" value={wydaneOrderNum} onChange={e => setWydaneOrderNum(e.target.value)} placeholder="Numer zamówienia" style={{ width: '100%', marginBottom: '0.5rem' }} />
                  <input type="text" value={wydaneKanapka} onChange={e => setWydaneKanapka(e.target.value)} placeholder="Numer kanapki (opcjonalnie)" style={{ width: '100%', marginBottom: '0.5rem' }} />
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>📅 Termin realizacji:</label>
                  <input type="date" value={wydaneTermin} onChange={e => setWydaneTermin(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem' }} />
                  <button className="btn btn-success" onClick={handleAddWydane} disabled={isLoading} style={{ width: '100%' }}>Dodaj</button>
                </div>
              )}

              {uploadMessage && <div className={`msg ${uploadMessage.includes('✅') ? 'msg-success' : uploadMessage.includes('❌') ? 'msg-error' : 'msg-info'}`}>{uploadMessage}</div>}

              <div className="search-box">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
              </div>
              {wydaneOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).length === 0 && <p style={{ color: '#999' }}>Brak zamówień</p>}
              {wydaneOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => {
                const canManageW = getUserAccess(currentUser).wydane_manage;
                const canEditKanapka = canManageW || (!order.kanapkaSetByManage && !order.kanapka);
                return (
                <React.Fragment key={order.docId}>
                  <div className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 2px 0' }}>#{order.id}</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {order.kanapka ? <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>🥪 {order.kanapka}</span> : <span style={{ fontSize: '14px', color: '#f44336' }}>⚠️ Brak kanapki</span>}
                          {order.inAkcesoria && <span style={{ fontSize: '13px', color: '#388e3c' }} title="W akcesoriach">✅ akc.</span>}
                          {order.attachments?.length > 0 && <span style={{ fontSize: '13px', color: '#666' }} title="Załączniki">📎 {order.attachments.length}</span>}
                          {order.terminRealizacji && <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1976d2' }} title="Termin realizacji">📅 {order.terminRealizacji}</span>}
                          {order.brakAkcesoriow && <span style={{ fontSize: '13px', background: '#ffebee', color: '#c62828', padding: '2px 6px', borderRadius: '4px' }} title="Brak akcesoriów">❌ brak akces.</span>}
                          {order.trudnyKlient && <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '4px' }}>⚠️ TK</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: '18px' }}>{selectedOrderId === order.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {selectedOrderId === order.id && (
                    <div className="card" style={{ borderLeft: '3px solid #ff9800' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📅 Termin realizacji:</label>
                        {!order.terminRealizacji ? (
                          <input type="date" value="" onChange={e => handleUpdateOrderField(order.id, 'terminRealizacji', e.target.value)} style={{ width: '100%' }} />
                        ) : dateEditOrderId === 'termin_' + order.id ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="date" defaultValue={order.terminRealizacji} onChange={e => handleSaveTerminEdit(order.id, e.target.value)} style={{ flex: 1 }} />
                            <button className="btn" onClick={() => setDateEditOrderId(null)} style={{ padding: '4px 8px', fontSize: '11px' }}>Anuluj</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{order.terminRealizacji}</span>
                            <button className="btn" onClick={() => handlePasswordTerminEdit(order.id)} style={{ padding: '4px 8px', fontSize: '11px' }}>🔒 Zmień</button>
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>🥪 Numer kanapki:</label>
                        {canEditKanapka ? (
                          <input type="text" value={order.kanapka || ''} onChange={e => { handleUpdateOrderField(order.id, 'kanapka', e.target.value); if (canManageW) handleUpdateOrderField(order.id, 'kanapkaSetByManage', true); }} placeholder="K lub R + numer..." style={{ width: '100%', fontSize: '16px', fontWeight: 'bold' }} />
                        ) : (
                          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{order.kanapka || '—'}</span>
                        )}
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📎 Załączniki:</label>
                        {canManageW && (
                          <>
                            {!accessToken ? (
                              <button className="btn btn-primary" onClick={handleAuthorizeGoogle} disabled={isLoading} style={{ fontSize: '12px', width: '100%', marginBottom: '0.5rem' }}>🔐 Autoryzuj Google Drive</button>
                            ) : (
                              <button className="btn btn-primary" onClick={() => attachmentFileInputRef.current?.click()} disabled={isLoading} style={{ fontSize: '12px', marginBottom: '0.5rem' }}>📤 Dodaj plik</button>
                            )}
                            <input ref={attachmentFileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAttachment(order.id, f, WYDANE_FOLDER_ID); e.target.value = ''; }} style={{ display: 'none' }} />
                          </>
                        )}
                        {(order.attachments || []).length === 0 && <p style={{ fontSize: '12px', color: '#999' }}>Brak załączników</p>}
                        {(order.attachments || []).map((att, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f0f0', padding: '6px 10px', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                            <a href={att.driveLink || '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>📄 {att.name}</a>
                            {canManageW && <button className="btn btn-danger" onClick={() => handleDeleteAttachment(order.id, idx)} disabled={isLoading} style={{ padding: '2px 6px', fontSize: '10px' }}>✕</button>}
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📝 Braki / uwagi:</label>
                        <textarea value={order.akcesoriaUwagi || ''} onChange={e => handleUpdateOrderField(order.id, 'akcesoriaUwagi', e.target.value)} placeholder="Braki, uwagi..." style={{ width: '100%', height: '50px' }} />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input type="checkbox" checked={order.brakAkcesoriow || false} onChange={() => handleToggleAkcesoria(order.id, 'brakAkcesoriow')} />
                          ❌ Brak akcesoriów
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {canManageW && (
                          <button className="btn btn-success" onClick={() => handleAddToAkcesoria(order.id)} disabled={isLoading || order.inAkcesoria} style={{ flex: 1 }}>🧩 Dodaj do akcesoriów</button>
                        )}
                        <button className="btn btn-danger" onClick={() => handleWyciete(order.id)} disabled={isLoading || !order.kanapka} style={{ flex: 1 }}>✂️ Wycięte</button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
                );
              })}
            </div>
          )}

          {activeTab === 'akcesoria' && (
            <div>
              <h2>🧩 Akcesoria ({akcesoriaOrders.length})</h2>
              <button className="btn" onClick={() => {
                const allBraki = [];
                akcesoriaOrders.forEach(o => {
                  if (!o.brakiMagazynowe) return;
                  (o.brakiList || []).filter(b => !b.zamowione && !b.uzupelnione).forEach(b => {
                    const existing = allBraki.find(x => x.kod === b.kod && x.nazwa === b.nazwa);
                    if (existing) {
                      existing.ilosc = (parseFloat(existing.ilosc) || 0) + (parseFloat(b.ilosc) || 0);
                    } else {
                      allBraki.push({ nazwa: b.nazwa, kod: b.kod || '', ilosc: parseFloat(b.ilosc) || 1 });
                    }
                  });
                });
                if (!allBraki.length) { alert('Brak aktywnych braków do zliczenia.'); return; }
                const lines = ['Nazwa;Kod;Ilość', ...allBraki.map(b => b.nazwa + ';' + b.kod + ';' + b.ilosc)];
                const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'braki_akcesoriow.txt'; a.click();
                URL.revokeObjectURL(url);
              }} style={{ fontSize: '12px', marginBottom: '8px' }}>📥 Zlicz brakujące akcesoria</button>

              {uploadMessage && <div className={`msg ${uploadMessage.includes('✅') ? 'msg-success' : uploadMessage.includes('❌') ? 'msg-error' : 'msg-info'}`}>{uploadMessage}</div>}

              <div className="search-box">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
              </div>
              {akcesoriaOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).length === 0 && <p style={{ color: '#999' }}>Brak zamówień</p>}
              {akcesoriaOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => {
                const ps = order.prestashopData || {};
                return (
                <React.Fragment key={order.docId}>
                  <div className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0 }}>#{order.id}</h3>
                          {ps.dataRealizacji && <span style={{ fontSize: '13px', fontWeight: 'bold' }}>📅 {ps.dataRealizacji}</span>}
                          {order.kanapka && <span style={{ fontSize: '13px', background: '#fff9c4', padding: '1px 5px', borderRadius: '4px' }}>🥪 {order.kanapka}</span>}
                          {order.attachments?.length > 0 && <span style={{ fontSize: '13px', color: '#666' }}>📎 {order.attachments.length}</span>}
                          {order.accessoryLinks?.okucLink && <span style={{ fontSize: '12px', color: '#7b1fa2' }}>📄</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          {ps.dataDodania && <span style={{ marginRight: '8px' }}>📅 {ps.dataDodania}</span>}
                          {ps.transport && <span>{ps.transport.substring(0, 40)}{ps.transport.length > 40 ? '...' : ''}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', marginTop: '2px' }}>
                          {order.złożone && <span style={{ background: '#d4edda', padding: '1px 6px', borderRadius: '4px' }}>✅ złożone</span>}
                          {order.dołożone && <span style={{ background: '#cce5ff', padding: '1px 6px', borderRadius: '4px' }}>📦 dołożone</span>}
                          {order.brakiMagazynowe && (() => {
                            const braki = (order.brakiList || []).filter(b => !b.uzupelnione);
                            const wszystkieZamowione = braki.length > 0 && braki.every(b => b.zamowione);
                            const maBraki = braki.some(b => !b.zamowione);
                            if (maBraki) return <span style={{ background: '#ffebee', color: '#c62828', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>❌ BRAKI</span>;
                            if (wszystkieZamowione) return <span style={{ background: '#fff3e0', color: '#e65100', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>⏳ oczekiwanie</span>;
                            return null;
                          })()}
                          {order.trudnyKlient && <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '4px' }}>⚠️ TK</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: '18px' }}>{selectedOrderId === order.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {selectedOrderId === order.id && (
                    <div className="card" style={{ borderLeft: '3px solid #9c27b0' }}>

                      {/* Akcesoria raporty — tylko okuc i ciecie */}
                      {order.accessoryLinks && (order.accessoryLinks.okucLink || order.accessoryLinks.ciecieLink) && (
                        <div style={{ background: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>📎 Akcesoria (raporty):</div>
                          {order.accessoryLinks.okucLink ? <a href={order.accessoryLinks.okucLink} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#7b1fa2' }}>📄 PL-01_Raport_okuc_skrocony.pdf</a> : null}
                          {order.accessoryLinks.ciecieLink ? <a href={order.accessoryLinks.ciecieLink} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#7b1fa2' }}>📄 PL_Ciecie_dluzycy.pdf</a> : null}
                        </div>
                      )}

                      {/* Produkty z aktywnymi linkami */}
                      {order.prestashopData?.produkty && (() => {
                        const rows = parseProduktyFromRaw(order.prestashopData.produkty);
                        if (!rows.length) return null;
                        return (
                          <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>📦 Produkty w zamówieniu:</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                              <thead><tr style={{ background: '#f5f5f5' }}>
                                <th style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'left' }}>Nazwa</th>
                                <th style={{ padding: '3px 5px', border: '1px solid #ddd' }}>Szt.</th>
                                <th style={{ padding: '3px 5px', border: '1px solid #ddd' }}>Wys</th>
                                <th style={{ padding: '3px 5px', border: '1px solid #ddd' }}>Szer</th>
                                <th style={{ padding: '3px 5px', border: '1px solid #ddd' }}>Gł</th>
                                <th style={{ padding: '3px 5px', border: '1px solid #ddd' }}>Link</th>
                              </tr></thead>
                              <tbody>{rows.map((r, i) => {
                                const lnk = (order.prestashopData?.produktyLinks || [])[i] || '';
                                return (<tr key={i}>
                                  <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>{r.name}</td>
                                  <td style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>{r.qty}</td>
                                  <td style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>{r.wys||'—'}</td>
                                  <td style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>{r.szer||'—'}</td>
                                  <td style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>{r.gl||'—'}</td>
                                  <td style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>{lnk ? <a href={lnk} target="_blank" rel="noreferrer" style={{ color: '#1976d2', fontSize: '11px' }}>🔗</a> : '—'}</td>
                                </tr>);
                              })}</tbody>
                            </table>
                          </div>
                        );
                      })()}

                      {orderMessages[order.id] && (
                        <div style={{ background: orderMessages[order.id].includes('✅') ? '#e8f5e9' : '#ffebee', color: orderMessages[order.id].includes('✅') ? '#2e7d32' : '#c62828', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', marginBottom: '8px' }}>
                          {orderMessages[order.id]}
                        </div>
                      )}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📝 Braki / uwagi:</label>
                        <textarea value={order.akcesoriaUwagi || ''} onChange={e => handleUpdateOrderField(order.id, 'akcesoriaUwagi', e.target.value)} placeholder="Braki, uwagi..." style={{ width: '100%', height: '60px' }} />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📎 Załączniki:</label>
                        {!accessToken ? (
                          <button className="btn btn-primary" onClick={handleAuthorizeGoogle} disabled={isLoading} style={{ fontSize: '12px', width: '100%', marginBottom: '0.5rem' }}>🔐 Autoryzuj Google Drive</button>
                        ) : (
                          <button className="btn btn-primary" onClick={() => attachmentFileInputRef.current?.click()} disabled={isLoading} style={{ fontSize: '12px', marginBottom: '0.5rem' }}>📤 Dodaj plik (akcesoria)</button>
                        )}
                        <input ref={attachmentFileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAttachment(order.id, f, WYDANE_FOLDER_ID); e.target.value = ''; }} style={{ display: 'none' }} />
                        {(order.attachments || []).length === 0 && <p style={{ fontSize: '12px', color: '#999' }}>Brak załączników</p>}
                        {(order.attachments || []).map((att, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f0f0', padding: '6px 10px', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                            <a href={att.driveLink || '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>📄 {att.name}</a>
                            <button className="btn btn-danger" onClick={() => handleDeleteAttachment(order.id, idx)} disabled={isLoading} style={{ padding: '2px 6px', fontSize: '10px' }}>✕</button>
                          </div>
                        ))}
                      </div>

                      {/* BRAKI MAGAZYNOWE */}
                      <div style={{ background: '#fff8e1', border: '1px solid #ffcc02', borderRadius: '8px', padding: '10px', marginBottom: '1rem' }}>
                        <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: order.brakiMagazynowe ? 'default' : 'pointer', marginBottom: '6px' }}>
                          <input type="checkbox" checked={order.brakiMagazynowe || false}
                            onChange={async () => {
                              if (order.brakiMagazynowe) return; // nie można odklikać — znika automatycznie gdy wszystko uzupełnione
                              const orderRef2 = doc(db, 'orders', order.docId);
                              await updateDoc(orderRef2, { brakiMagazynowe: true, history: [...(order.history || []), historyEntry('Zaznaczono braki magazynowe')] });
                            }}
                          />
                          <span style={{ fontWeight: 'bold' }}>⚠️ Brak akcesoriów na magazynie</span>
                          {order.brakiMagazynowe && <span style={{ fontSize: '10px', color: '#999' }}>(znika gdy wszystkie uzupełnione)</span>}
                        </label>
                        {order.brakiMagazynowe && (() => {
                          const braki = order.brakiList || [];
                          const aktualizujBraki = async (newBraki) => {
                            const orderRef2 = doc(db, 'orders', order.docId);
                            await updateDoc(orderRef2, { brakiList: newBraki, history: [...(order.history || []), historyEntry('Zaktualizowano liste brakow')] });
                          };
                          return (
                            <div>
                              <button className="btn btn-primary" onClick={() => { fetchAkcesoriaKatalog(); setBrakiSearchQuery('__open__' + order.id); }} style={{ fontSize: '11px', padding: '3px 8px', marginBottom: '6px' }}>+ Dodaj brak</button>
                              {brakiSearchQuery.startsWith('__open__' + order.id) && (
                                <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                                  <input type="text" autoFocus placeholder="Szukaj nazwy lub kodu..." value={brakiSearchQuery.replace('__open__' + order.id, '').replace('__', '')}
                                    onChange={e => setBrakiSearchQuery('__open__' + order.id + '__' + e.target.value)}
                                    style={{ width: '100%', padding: '5px', marginBottom: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }} />
                                  {akcesoriaKatalogLoading && <p style={{ fontSize: '11px', color: '#999' }}>Ładowanie...</p>}
                                  <div style={{ maxHeight: '160px', overflow: 'auto' }}>
                                    {(() => {
                                      const rawQ = brakiSearchQuery.includes('__') ? brakiSearchQuery.split('__').pop() : '';
                                      const q = rawQ.toLowerCase();
                                      const filtered2 = q.length > 0 ? akcesoriaKatalog.filter(a => a.nazwa.toLowerCase().includes(q) || a.kod.toLowerCase().includes(q)) : akcesoriaKatalog;
                                      const showManual = q.length > 1 && filtered2.length === 0;
                                      return (
                                        <>
                                          {showManual && (
                                            <div style={{ padding: '6px', background: '#fff3e0', borderRadius: '4px', marginBottom: '4px' }}>
                                              <p style={{ fontSize: '11px', color: '#e65100', margin: '0 0 4px' }}>Nie znaleziono "{rawQ}" w katalogu</p>
                                              <button className="btn btn-primary" onClick={() => {
                                                const nazwaR = window.prompt('Nazwa akcesorium:', rawQ);
                                                if (!nazwaR || !nazwaR.trim()) return;
                                                const ilR = window.prompt('Ilość:');
                                                if (!ilR || !ilR.trim()) return;
                                                aktualizujBraki([...braki, { nazwa: nazwaR.trim(), kod: '', ilosc: ilR.trim(), zamowione: false, uzupelnione: false }]);
                                                setBrakiSearchQuery('');
                                              }} style={{ fontSize: '11px' }}>+ Dodaj ręcznie</button>
                                            </div>
                                          )}
                                          {filtered2.slice(0, 30).map((a, ai) => (
                                            <div key={ai} onClick={() => {
                                              const il = window.prompt('Ilość dla:\n' + a.nazwa + (a.kod ? ' (' + a.kod + ')' : '') + ':');
                                              if (!il || !il.trim()) return;
                                              aktualizujBraki([...braki, { nazwa: a.nazwa, kod: a.kod, ilosc: il.trim(), zamowione: false, uzupelnione: false }]);
                                              setBrakiSearchQuery('');
                                            }} style={{ padding: '5px 8px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}
                                              onMouseEnter={e => e.currentTarget.style.background = '#e3f2fd'}
                                              onMouseLeave={e => e.currentTarget.style.background = ''}>
                                              <strong>{a.nazwa}</strong> {a.kod && <span style={{ color: '#888', marginLeft: '6px' }}>{a.kod}</span>}
                                            </div>
                                          ))}
                                          {filtered2.length === 0 && !showManual && akcesoriaKatalog.length === 0 && (
                                            <p style={{ fontSize: '11px', color: '#999', padding: '4px' }}>Wpisz frazę aby wyszukać w katalogu...</p>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <button className="btn" onClick={() => setBrakiSearchQuery('')} style={{ fontSize: '10px', marginTop: '4px' }}>✕ Zamknij</button>
                                </div>
                              )}
                              {braki.length > 0 && (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                  <thead>
                                    <tr style={{ background: '#f5f5f5' }}>
                                      <th style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'left' }}>Nazwa</th>
                                      <th style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>Ilość</th>
                                      <th style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>Zamówione</th>
                                      <th style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>Uzupełnione</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {braki.filter(b => !b.uzupelnione).map((b, i) => (
                                      <tr key={i} style={{ background: b.zamowione ? '#e8f5e9' : '#fff' }}>
                                        <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>{b.nazwa}</td>
                                        <td style={{ padding: '3px 5px', border: '1px solid #ddd', fontSize: '10px', color: '#666' }}>{b.kod || '—'}</td>
                                        <td style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>{b.ilosc}</td>
                                        <td style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>
                                          <input type="checkbox" checked={b.zamowione || false} onChange={() => {
                                            const nb = braki.map((x, j) => j === i ? { ...x, zamowione: !x.zamowione } : x);
                                            aktualizujBraki(nb);
                                          }} />
                                        </td>
                                        <td style={{ padding: '3px 5px', border: '1px solid #ddd', textAlign: 'center' }}>
                                          <input type="checkbox" checked={b.uzupelnione || false}
                                            disabled={!b.zamowione}
                                            title={!b.zamowione ? 'Najpierw zaznacz Zamówione' : ''}
                                            onChange={async () => {
                                              const nb = braki.map((x, j) => j === i ? { ...x, uzupelnione: true } : x);
                                              const allDone = nb.every(x => x.uzupelnione);
                                              const orderRef2 = doc(db, 'orders', order.docId);
                                              await updateDoc(orderRef2, {
                                                brakiList: nb,
                                                // Gdy wszystkie uzupełnione — ukryj brakiMagazynowe
                                                ...(allDone ? { brakiMagazynowe: false } : {}),
                                                history: [...(order.history || []), historyEntry('Uzupelniono brak: ' + b.nazwa)]
                                              });
                                            }} />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {(() => {
                        const activeBraki = order.brakiMagazynowe && (order.brakiList || []).some(b => !b.uzupelnione);
                        return (
                          <div>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '1rem', flexWrap: 'wrap', opacity: activeBraki ? 0.4 : 1 }}>
                              <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }} title={activeBraki ? 'Najpierw uzupełnij braki magazynowe' : ''}>
                                <input type="checkbox" checked={order.złożone || false} onChange={() => handleToggleAkcesoria(order.id, 'złożone')} disabled={isLoading || activeBraki} /> Przygotowane
                              </label>
                              <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }} title={activeBraki ? 'Najpierw uzupełnij braki magazynowe' : ''}>
                                <input type="checkbox" checked={order.dołożone || false} onChange={() => handleToggleAkcesoria(order.id, 'dołożone')} disabled={isLoading || activeBraki} /> Dołożone do palety
                              </label>
                            </div>
                            {activeBraki && <p style={{ fontSize: '11px', color: '#e65100', margin: '-8px 0 8px' }}>Uzupełnij braki magazynowe przed oznaczeniem przygotowane/dołożone</p>}
                            {(order.złożone && order.dołożone && !activeBraki) && (
                              <button className="btn btn-success" onClick={() => handleMoveToArchive3(order.id)} disabled={isLoading} style={{ width: '100%' }}>🗄️ Archiwum akcesoriów</button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </React.Fragment>
              );})}
            </div>
          )}

          {activeTab === 'prestashop' && (() => {
            const ua = getUserAccess(currentUser);
            const canManagePS = ua.prestashop_manage;
            const canPoprawione = ua.prestashop_poprawione || canManagePS;
            return (
              <div>
                <h2>🛒 Prestashop ({prestashopOrders.length})</h2>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {['id','date','value','colors'].map(s => (
                    <button key={s} className={`btn ${psSortBy === s ? 'btn-primary' : ''}`} onClick={() => setPsSortBy(s)} style={{ padding: '4px 10px', fontSize: '11px' }}>
                      {s === 'id' ? '# Numer' : s === 'date' ? '📅 Data' : s === 'value' ? '💰 Wartość' : '🎨 Kolory'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '6px', alignItems: 'center', background: '#f5f5f5', padding: '8px', borderRadius: '6px' }}>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="checkbox" checked={psFilterZaproj} onChange={e => setPsFilterZaproj(e.target.checked)} /> Zaprojektowane
                  </label>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="checkbox" checked={psFilterSprawdzone} onChange={e => setPsFilterSprawdzone(e.target.checked)} /> Sprawdzone
                  </label>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="checkbox" checked={psFilterBledy} onChange={e => setPsFilterBledy(e.target.checked)} /> Błędy
                  </label>
                  <input type="text" value={psFilterKodPoczt} onChange={e => setPsFilterKodPoczt(e.target.value)} placeholder="Kod pocztowy..." style={{ padding: '3px 7px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', width: '110px' }} />
                  <div style={{ position: 'relative' }}>
                    <input type="text" value={psFilterDekor} onChange={e => setPsFilterDekor(e.target.value)} placeholder="Szukaj dekoru..." style={{ padding: '3px 7px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', width: '130px' }} />
                  </div>
                  {(psFilterZaproj || psFilterSprawdzone || psFilterBledy || psFilterKodPoczt || psFilterDekor) && (
                    <button className="btn" onClick={() => { setPsFilterZaproj(false); setPsFilterSprawdzone(false); setPsFilterBledy(false); setPsFilterKodPoczt(''); setPsFilterDekor(''); }} style={{ fontSize: '11px', padding: '2px 8px' }}>✕ Wyczyść filtry</button>
                  )}
                </div>

                {canManagePS && (
                  <>
                    <div className="card">
                      <h3>📥 Import z Excel</h3>
                      <input type="file" accept=".xlsx,.xls" onChange={e => { const f = e.target.files?.[0]; if (f) handleImportExcel(f); e.target.value = ''; }} disabled={importingExcel} />
                      {importingExcel && <p style={{ color: '#1976d2', fontSize: '12px' }}>⏳ Importowanie...</p>}
                    </div>
                    <div className="card">
                      <h3>✏️ Dodaj ręcznie</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <input type="text" value={manualOrderId} onChange={e => setManualOrderId(e.target.value)} placeholder="Nr zamówienia" />
                        <input type="date" value={manualDataRealizacji} onChange={e => setManualDataRealizacji(e.target.value)} />
                        <div style={{ gridColumn: '1 / -1' }}>
                          <select value={manualTransport} onChange={e => setManualTransport(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <option value="">-- wybierz transport --</option>
                            {getKnownTransports().map(t => <option key={t} value={t}>{t}</option>)}
                            <option value="__custom__">+ Wpisz własny...</option>
                          </select>
                          {manualTransport === '__custom__' && (
                            <input type="text" placeholder="Wpisz rodzaj transportu" onChange={e => setManualTransport(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #2196F3', borderRadius: '4px', marginTop: '4px' }} autoFocus />
                          )}
                        </div>
                        <input type="text" value={manualWartosc} onChange={e => setManualWartosc(e.target.value)} placeholder="Wartość" />
                        <input type="text" value={manualKodPocztowy} onChange={e => setManualKodPocztowy(e.target.value)} placeholder="Kod pocztowy" />
                        <button className="btn btn-success" onClick={handleManualPrestashopOrder} disabled={isLoading} style={{ gridColumn: '1 / -1' }}>Dodaj</button>
                      </div>
                    </div>
                  </>
                )}

                {uploadMessage && <div className={`msg ${uploadMessage.includes('✅') ? 'msg-success' : uploadMessage.includes('❌') ? 'msg-error' : 'msg-info'}`}>{uploadMessage}</div>}

                <div className="search-box">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
                </div>

                {applyPsFilters(prestashopOrders.filter(o => !searchQuery || o.id.includes(searchQuery))).map(order => {
                  const ps = order.prestashopData || {};
                  return (
                    <React.Fragment key={order.docId}>
                      <div className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0 }}>#{order.id}</h3>
                            {ps.dataRealizacji && <span style={{ fontSize: '14px', fontWeight: 'bold' }}>📅 {ps.dataRealizacji}</span>}
                            {order.paletaPrestashop && <span style={{ fontSize: '12px', background: '#e3f2fd', padding: '2px 6px', borderRadius: '4px' }}>🎨 {order.paletaPrestashop}</span>}
                            {order.hasNoDrilling && <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ff6f00', background: '#fff8e1', padding: '2px 8px', borderRadius: '4px' }}>⚠️ BRAK NAWIERTÓW</span>}
                            {order.dekoryNeedCheck && <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '4px' }}>🔍 SPRAWDŹ DEKORY</span>}
                            {order.zaprojektowane && <span style={{ fontSize: '13px' }} title="Zaprojektowane">📐</span>}
                            {order.sprawdzone && <span style={{ fontSize: '13px' }} title="Sprawdzone">✅</span>}
                            {order.bledy && <span style={{ fontSize: '13px' }} title="Błędy">❌</span>}
                            {order.poprawione && <span style={{ fontSize: '13px' }} title="Poprawione">🔧</span>}
                            {order.csvLoaded && <span style={{ fontSize: '12px', background: '#e8f5e9', padding: '2px 6px', borderRadius: '4px' }}>📄 {order.colorCountExclHdf || order.csvData?.length || 0} kol.</span>}
                            {order.trudnyKlient && <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '4px' }}>⚠️ TK</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            {ps.transport && <span>{ps.transport.substring(0, 40)}{ps.transport.length > 40 ? '...' : ''}</span>}
                            {ps.wartosc && <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>💰 {ps.wartosc} zł</span>}
                          </div>
                        </div>
                      </div>

                      {selectedOrderId === order.id && (
                        <div className="card" style={{ borderLeft: '3px solid #2196F3' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '1rem', fontSize: '13px' }}>
                            <div><strong>Data dodania:</strong> {ps.dataDodania || '—'}</div>
                            <div>
                              <strong>Data realizacji:</strong>{' '}
                              {dateEditOrderId === 'ps_date_' + order.id ? (
                                <span><input type="date" defaultValue={ps.dataRealizacji || ''} onChange={e => handleSavePsDate(order.id, e.target.value)} style={{ padding: '2px' }} /> <button className="btn" onClick={() => setDateEditOrderId(null)} style={{ padding: '2px 6px', fontSize: '10px' }}>✕</button></span>
                              ) : ps.dataRealizacji ? (
                                <span>{ps.dataRealizacji} <button className="btn" onClick={() => handleEditDataRealizacji(order.id)} style={{ padding: '1px 6px', fontSize: '10px' }}>🔒</button></span>
                              ) : (
                                <span style={{ color: '#f44336' }}><button className="btn btn-primary" onClick={() => setDateEditOrderId('ps_date_' + order.id)} style={{ padding: '2px 8px', fontSize: '11px' }}>📅 Ustaw datę</button></span>
                              )}
                            </div>
                            <div><strong>Transport:</strong> {ps.transport || <span style={{ color: '#f44336' }}>⚠️ brak</span>}</div>
                            <div><strong>Wartość:</strong> {ps.wartosc || <span style={{ color: '#f44336' }}>⚠️ brak</span>} zł</div>
                            <div><strong>Kod pocztowy:</strong> {ps.kodPocztowy
                              ? <span>{ps.kodPocztowy} <button className="btn" onClick={() => {
                                  const v = window.prompt('Nowy kod pocztowy:', ps.kodPocztowy || '');
                                  if (v !== null && v.trim()) {
                                    const newPs = { ...(order.prestashopData || {}), kodPocztowy: v.trim() };
                                    handleUpdateOrderField(order.id, 'prestashopData', newPs);
                                  }
                                }} style={{ fontSize: '10px', padding: '1px 5px' }}>✏️</button></span>
                              : <span><span style={{ color: '#f44336' }}>⚠️ brak </span><button className="btn btn-primary" onClick={() => {
                                  const v = window.prompt('Wpisz kod pocztowy:');
                                  if (v !== null && v.trim()) {
                                    const newPs = { ...(order.prestashopData || {}), kodPocztowy: v.trim() };
                                    handleUpdateOrderField(order.id, 'prestashopData', newPs);
                                  }
                                }} style={{ fontSize: '10px', padding: '2px 8px' }}>+ Dodaj</button></span>
                            }</div>
                            <div><strong>Formatki:</strong> {order.totalFormats || '—'}</div>
                          </div>

                          {/* PRODUKTY TABLE */}
                          {order.prestashopData?.produkty && (() => {
                            const rows = parseProduktyFromRaw(order.prestashopData.produkty);
                            if (rows.length === 0) return null;
                            return (
                              <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>📦 Produkty w zamówieniu:</div>
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                    <thead>
                                      <tr style={{ background: '#f5f5f5' }}>
                                        <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #ddd' }}>Nazwa produktu</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>Ilość</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>Wys. mm</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>Szer. mm</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>Gł. mm</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>Link</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rows.map((row, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                          <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>{row.name}</td>
                                          <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{row.qty}</td>
                                          <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{row.wys || '—'}</td>
                                          <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{row.szer || '—'}</td>
                                          <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>{row.gl || '—'}</td>
                                          <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #ddd' }}>
                                            {(() => {
                                              const savedLink = (order.prestashopData?.produktyLinks || [])[idx] || '';
                                              return savedLink
                                                ? <a href={savedLink} target="_blank" rel="noreferrer" style={{ color: '#1976d2', fontSize: '11px' }}>🔗 otwórz</a>
                                                : <input type="text" placeholder="wklej link..." defaultValue=""
                                                    onBlur={e => {
                                                      const val = e.target.value.trim();
                                                      if (!val) return;
                                                      const rows2 = parseProduktyFromRaw(order.prestashopData?.produkty || '');
                                                      const links = [...(order.prestashopData?.produktyLinks || Array(rows2.length).fill(''))];
                                                      while (links.length < rows2.length) links.push('');
                                                      links[idx] = val;
                                                      const newPs = { ...(order.prestashopData || {}), produktyLinks: links };
                                                      handleUpdateOrderField(order.id, 'prestashopData', newPs);
                                                    }}
                                                    style={{ fontSize: '10px', width: '80px', padding: '2px' }} />;
                                            })()}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              <button className="btn" onClick={() => {
                                const nazwa = window.prompt('Nazwa produktu:'); if (!nazwa) return;
                                const qty = window.prompt('Ilość:', '1'); if (!qty) return;
                                const wys = window.prompt('Wysokość (mm):', '');
                                const szer = window.prompt('Szerokość (mm):', '');
                                const gl = window.prompt('Głębokość (mm):', '');
                                const manualEntry = qty + ' x ' + nazwa + ' (wys. ' + (wys||'-') + 'mm | szer. ' + (szer||'-') + 'mm | gl. ' + (gl||'-') + 'mm)';
                                const existing = order.prestashopData?.produkty || '';
                                const newPs = { ...(order.prestashopData || {}), produkty: existing ? existing + ' ' + manualEntry : manualEntry };
                                handleUpdateOrderField(order.id, 'prestashopData', newPs);
                              }} style={{ fontSize: '11px', marginTop: '6px' }}>+ Dodaj produkt</button>
                              </div>
                            );
                          })()}

                          {order.longestElement > 0 && (
                            <div style={{ background: '#e3f2fd', padding: '8px', borderRadius: '4px', marginBottom: '1rem', fontSize: '14px', fontWeight: 'bold' }}>
                              📏 Najdłuższy element: {order.longestElement} mm
                            </div>
                          )}

                          {order.hasNoDrilling && (
                            <div style={{ background: '#fff8e1', border: '2px solid #ff6f00', padding: '12px', borderRadius: '8px', marginBottom: '1rem', fontSize: '18px', fontWeight: 'bold', color: '#ff6f00', textAlign: 'center' }}>
                              ⚠️ BRAK NAWIERTÓW
                            </div>
                          )}

                          {order.csvData && order.csvData.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead><tr style={{ background: '#f5f5f5' }}>
                                  <th style={{ padding: '6px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Kolor</th>
                                  <th style={{ padding: '6px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Formatki</th>
                                  <th style={{ padding: '6px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>m²</th>
                                  <th style={{ padding: '6px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Okleinowanie MB</th>
                                  <th style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Info</th>
                                </tr></thead>
                                <tbody>
                                  {order.csvData.map((c, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                      <td style={{ padding: '4px 6px', fontWeight: 'bold' }}>{c.colorName}</td>
                                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>{c.rowCount}</td>
                                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>{c.surfaceArea} m²</td>
                                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>{c.edgeMeters} mb</td>
                                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                        {c.isThickened && <span title="Pogrubienie">🔲</span>}
                                        {c.isCountertop && <span title="Blat">🍳</span>}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                                    <td style={{ padding: '6px' }}>RAZEM</td>
                                    <td style={{ padding: '6px', textAlign: 'right' }}>{order.totalFormats}</td>
                                    <td style={{ padding: '6px', textAlign: 'right' }}>{order.csvData.reduce((s,c) => s + (c.surfaceArea||0), 0).toFixed(3)} m²</td>
                                    <td style={{ padding: '6px', textAlign: 'right' }}>{order.csvData.reduce((s,c) => s + (c.edgeMeters||0), 0).toFixed(2)} mb</td>
                                    <td></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}

                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>🎨 Paleta:</label>
                            {canManagePS ? (
                              <select value={order.paletaPrestashop || ''} onChange={e => handleUpdateOrderField(order.id, 'paletaPrestashop', e.target.value || null)} style={{ width: '100%', padding: '6px' }}>
                                <option value="">-- wybierz --</option>
                                {PALETA_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            ) : <span>{order.paletaPrestashop || '—'}</span>}
                          </div>

                          <div style={{ display: 'flex', gap: '12px', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input type="checkbox" checked={order.zaprojektowane || false} onChange={() => canPoprawione && handleUpdateOrderField(order.id, 'zaprojektowane', !(order.zaprojektowane || false))} disabled={!canPoprawione} /> Zaprojektowane
                            </label>
                            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input type="checkbox" checked={order.sprawdzone || false} onChange={() => canManagePS && handleUpdateOrderField(order.id, 'sprawdzone', !(order.sprawdzone || false))} disabled={!canManagePS} /> Sprawdzone
                            </label>
                            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: order.bledy ? '#c62828' : 'inherit' }}>
                              <input type="checkbox" checked={order.bledy || false} onChange={() => canManagePS && handleUpdateOrderField(order.id, 'bledy', !(order.bledy || false))} disabled={!canManagePS} /> Błędy
                            </label>
                            {order.bledy && (
                              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="checkbox" checked={order.poprawione || false} onChange={() => canPoprawione && handleUpdateOrderField(order.id, 'poprawione', !(order.poprawione || false))} disabled={!canPoprawione} /> Poprawione
                              </label>
                            )}
                            {order.bledy && order.poprawione && (
                              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="checkbox" checked={order.sprawdzoneBledy || false} onChange={() => canManagePS && handleUpdateOrderField(order.id, 'sprawdzoneBledy', !(order.sprawdzoneBledy || false))} disabled={!canManagePS} /> Sprawdzone błędy
                              </label>
                            )}
                          </div>

                          {order.bledy && (
                            <div style={{ marginBottom: '1rem' }}>
                              <textarea value={order.opisBledu || ''} onChange={e => handleUpdateOrderField(order.id, 'opisBledu', e.target.value)} placeholder="Opis błędów..." style={{ width: '100%', height: '50px', borderColor: '#f44336' }} />
                            </div>
                          )}

                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📝 Uwagi:</label>
                            <textarea value={order.prestashopUwagi || ''} onChange={e => handleUpdateOrderField(order.id, 'prestashopUwagi', e.target.value)} placeholder="Uwagi..." style={{ width: '100%', height: '50px' }} />
                          </div>

                          {/* 🎨 SPRAWDZENIE KOLORÓW — tabela drag&drop */}
                          <div style={{ background: order.colorChecked ? '#e8f5e9' : '#fff3e0', border: '2px solid ' + (order.colorChecked ? '#4caf50' : '#ff9800'), borderRadius: '8px', padding: '10px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{order.colorChecked ? '✅ Kolory sprawdzone' : '⚠️ KOLORY NIE SPRAWDZONE'}</span>
                              {canManagePS && order.colorChecked && (
                                <button className="btn" onClick={() => handleUpdateOrderField(order.id, 'colorChecked', false)} style={{ fontSize: '11px', padding: '2px 8px', borderColor: '#f44336', color: '#f44336' }}>Cofnij</button>
                              )}
                            </div>
                            {!order.colorChecked && order.csvLoaded && (() => {
                              // Wszystkie kolory z CSV (łącznie z HDF)
                              const csvColors = (order.csvData || []).map(c => {
                                let name = c.colorName;
                                if (c.isCountertop) name = 'blat_' + name;
                                return { key: c.fileName, name, surfaceArea: c.surfaceArea || 0 };
                              });
                              const excelDekory = order.prestashopData?.dekoryRaw ? parseDekoryFromExcel(order.prestashopData.dekoryRaw) : [];
                              const uniqueDekory = getUniqueDekory(excelDekory);
                              const matched = order.dekorMatches || {};
                              const matchedValues = Object.values(matched);
                              const hiddenDekory = order.dekorHidden || [];
                              const allCsvMatched = csvColors.length > 0 && csvColors.every(c => matched[c.key]);

                              const removeFromCsv = (key) => {
                                const nm = { ...(order.dekorMatches || {}) };
                                delete nm[key];
                                handleUpdateOrderField(order.id, 'dekorMatches', nm);
                              };
                              const removeFromExcel = async (dekorName) => {
                                // Remove from matches
                                const nm = { ...(order.dekorMatches || {}) };
                                Object.keys(nm).forEach(k => { if (nm[k] === dekorName) delete nm[k]; });
                                // Add to hidden list so it stays removed
                                const hidden = [...(order.dekorHidden || [])];
                                if (!hidden.includes(dekorName)) hidden.push(dekorName);
                                try {
                                  const orderRef2 = doc(db, 'orders', order.docId);
                                  await updateDoc(orderRef2, { dekorMatches: nm, dekorHidden: hidden });
                                } catch(e) { alert('Blad: ' + e.message); }
                              };

                              return (
                                <div>
                                  <p style={{ fontSize: '11px', color: '#555', margin: '0 0 6px' }}>Przeciągnij dekor z prawej na kolor CSV po lewej. Prawy klik = usuń powiązanie.</p>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                    <div>
                                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>CSV (kolory):</div>
                                      {csvColors.map(c => (
                                        <div key={c.key}
                                          onDragOver={e => e.preventDefault()}
                                          onDrop={e => { e.preventDefault(); const dn = e.dataTransfer.getData('text/plain'); const nm = { ...(order.dekorMatches || {}), [c.key]: dn }; handleUpdateOrderField(order.id, 'dekorMatches', nm); }}
                                          onContextMenu={e => { e.preventDefault(); if (matched[c.key] && window.confirm('Usunac powiazanie ' + c.name + '?')) removeFromCsv(c.key); }}
                                          style={{ background: matched[c.key] ? '#c8e6c9' : '#fff8e1', border: '1px solid ' + (matched[c.key] ? '#4caf50' : '#ffcc02'), borderRadius: '4px', padding: '4px 6px', marginBottom: '3px', fontSize: '11px', minHeight: '28px', cursor: matched[c.key] ? 'context-menu' : 'default' }}>
                                          {matched[c.key]
                                            ? <span>{c.name} <span style={{ color: '#4caf50', fontSize: '10px' }}>✓ {matched[c.key]}</span> <button onClick={() => removeFromCsv(c.key)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#f44336', fontSize: '11px', marginLeft: '2px' }}>✕</button></span>
                                            : <span style={{ color: '#888' }}>{c.name}{c.surfaceArea > 0 ? ' (' + c.surfaceArea + ' m²)' : ''} <span style={{ fontSize: '9px' }}>← upuść</span></span>}
                                        </div>
                                      ))}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>Dekory z Excel:</div>
                                      {uniqueDekory.filter(d => !hiddenDekory.includes(d.name)).map((d, i) => {
                                        const isUsed = matchedValues.includes(d.name);
                                        return (
                                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
                                            <div draggable={!isUsed}
                                              onDragStart={e => { if (!isUsed) e.dataTransfer.setData('text/plain', d.name); }}
                                              onContextMenu={e => { e.preventDefault(); if (window.confirm('Usunąć dekor ' + d.name + ' z listy?')) removeFromExcel(d.name); }}
                                              style={{ flex: 1, background: isUsed ? '#e8f5e9' : '#e3f2fd', border: '1px solid ' + (isUsed ? '#a5d6a7' : '#90caf9'), borderRadius: '4px', padding: '4px 6px', fontSize: '11px', cursor: isUsed ? 'default' : 'grab', opacity: isUsed ? 0.7 : 1 }}>
                                              {d.name} <span style={{ color: isUsed ? '#4caf50' : '#1976d2', fontSize: '10px' }}>{isUsed ? '✓' : d.m2 + ' m²'}</span>
                                            </div>
                                            <button
                                              onClick={() => { if (window.confirm('Usunąć dekor ' + d.name + ' z listy?')) removeFromExcel(d.name); }}
                                              title="Usuń dekor z listy"
                                              style={{ border: 'none', background: '#ffebee', color: '#f44336', cursor: 'pointer', borderRadius: '4px', padding: '2px 5px', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>✕</button>
                                          </div>
                                        );
                                      })}
                                      {uniqueDekory.length === 0 && <span style={{ fontSize: '11px', color: '#888' }}>Brak dekorów w zamówieniu (import Excel bez kolumny Dekory)</span>}
                                    </div>
                                  </div>
                                  <button className="btn btn-success" onClick={() => handleUpdateOrderField(order.id, 'colorChecked', true)} style={{ width: '100%', fontSize: '13px' }}>
                                    {allCsvMatched ? '✅ Zatwierdź — kolory sprawdzone' : '✅ Zatwierdź mimo niesparowanych'}
                                  </button>
                                </div>
                              );
                            })()}
                            {!order.colorChecked && (!order.csvLoaded || !order.prestashopData?.dekoryRaw) && (
                              <p style={{ fontSize: '11px', color: '#e65100', margin: '4px 0 0' }}>Pobierz CSV i załaduj zamówienie z dekorami aby sprawdzić kolory.</p>
                            )}
                          </div>

                          {/* BLOK 1: AKCESORIA */}
                          <div style={{ background: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>📎 Akcesoria (raporty):</div>
                            {order.accessoryLinks ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {order.accessoryLinks.okucLink
                                  ? <a href={order.accessoryLinks.okucLink} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#7b1fa2' }}>📄 PL-01_Raport_okuc_skrocony.pdf</a>
                                  : null}
                                {order.accessoryLinks.ciecieLink
                                  ? <a href={order.accessoryLinks.ciecieLink} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#7b1fa2' }}>📄 PL_Ciecie_dluzycy.pdf</a>
                                  : null}
                                {!order.accessoryLinks.okucLink && !order.accessoryLinks.ciecieLink && (
                                  <span style={{ fontSize: '12px', color: '#888' }}>🚫 Brak akcesoriów</span>
                                )}
                              </div>
                            ) : <span style={{ fontSize: '12px', color: '#aaa' }}>Brak danych — pobierz CSV</span>}
                          </div>

                          {/* BLOK 2: PLIKI PRODUKCYJNE A_ B_ */}
                          <div style={{ background: '#e8eaf6', border: '1px solid #9fa8da', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>🗂️ Pliki produkcyjne:</div>
                            {order.accessoryLinks ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {order.accessoryLinks.aFile
                                  ? <a href={order.accessoryLinks.aFile} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#283593' }}>📁 A_{order.id}</a>
                                  : <span style={{ fontSize: '12px', color: '#888' }}>Brak A_{order.id}</span>}
                                {order.accessoryLinks.bFile
                                  ? <a href={order.accessoryLinks.bFile} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#283593' }}>📁 B_{order.id}</a>
                                  : <span style={{ fontSize: '12px', color: '#888' }}>Brak B_{order.id}</span>}
                              </div>
                            ) : <span style={{ fontSize: '12px', color: '#aaa' }}>Brak danych — pobierz CSV</span>}
                          </div>

                          {/* BLOK 3: UPLOAD WŁASNY + lista dodanych */}
                          <div style={{ background: '#e0f2f1', border: '1px solid #80cbc4', borderRadius: '8px', padding: '10px', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>📤 Dodaj plik produkcyjny:</div>
                            {accessToken ? (
                              <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAttachment(order.id, f, PRODUKCJA_FOLDER_ID); e.target.value = ''; }} style={{ fontSize: '12px' }} />
                            ) : (
                              <button className="btn btn-primary" onClick={handleAuthorizeGoogle} style={{ fontSize: '12px' }}>🔐 Autoryzuj Drive</button>
                            )}
                            {(order.attachments || []).length > 0 && (
                              <div style={{ marginTop: '6px' }}>
                                {(order.attachments || []).map((att, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px', marginBottom: '3px', fontSize: '11px' }}>
                                    <a href={att.driveLink || '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#00695c' }}>📄 {att.name}</a>
                                    {canManagePS && <button onClick={() => handleDeleteAttachment(order.id, idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#f44336', fontSize: '11px' }}>✕</button>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {canManagePS && order.csvLoaded && (
                              <button className="btn" onClick={() => handleFetchAccessoryLinks(order.id)} disabled={isLoading} style={{ fontSize: '10px', padding: '2px 8px', marginTop: '6px', display: 'block' }}>🔄 Odśwież linki do plików</button>
                            )}
                          </div>

                          {/* BRAK AKCESORIÓW — checkbox z hasłem FlexM */}
                          {order.csvLoaded && (
                            <div style={{ background: order.brakAkcesoriow ? '#fff3e0' : '#f5f5f5', border: '1px solid ' + (order.brakAkcesoriow ? '#ff9800' : '#ddd'), borderRadius: '8px', padding: '10px', marginBottom: '1rem' }}>
                              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: order.brakAkcesoriow ? 'default' : 'pointer' }}>
                                <input type="checkbox" checked={order.brakAkcesoriow || false} readOnly={order.brakAkcesoriow}
                                  onChange={async () => {
                                    if (order.brakAkcesoriow) return; // nie można odklikać ręcznie
                                    // Wymaga hasła
                                    const pwd = window.prompt('Podaj hasło aby potwierdzić brak akcesoriów:');
                                    if (pwd !== 'FlexM') { alert('Nieprawidłowe hasło.'); return; }
                                    // Podwójne potwierdzenie
                                    const ok1 = window.confirm('Czy w zamowieniu nie ma akcesoriow?\n\nOK = Tak, nie ma akcesoriow\nAnuluj = W zamowieniu sa akcesoria');
                                    if (!ok1) return;
                                    const ok2 = window.confirm('Czy jestes pewien ze w zamowieniu nie powinno byc akcesoriow i bierzesz odpowiedzialnosc za ewentualne nie dolozenie ich do zamowienia?');
                                    if (!ok2) return;
                                    const orderRef2 = doc(db, 'orders', order.docId);
                                    await updateDoc(orderRef2, { brakAkcesoriow: true, history: [...(order.history || []), historyEntry('Ręcznie potwierdzono brak akcesoriów (hasło FlexM)')] });
                                  }}
                                />
                                <span style={{ fontWeight: 'bold' }}>❌ Brak akcesoriów w zamówieniu</span>
                                {order.brakAkcesoriow && <span style={{ fontSize: '10px', color: '#999' }}>(zablokowane)</span>}
                              </label>
                              {order.brakAkcesoriow && <p style={{ fontSize: '11px', color: '#e65100', margin: '4px 0 0' }}>Zamówienie nie trafi do katalogu Akcesoria po wydaniu na produkcję.</p>}
                              {!order.brakAkcesoriow && <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0' }}>Zaznaczenie wymaga hasła i podwójnego potwierdzenia.</p>}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {canManagePS && !order.csvLoaded && (
                              <button className="btn btn-primary" onClick={() => handleLoadCsv(order.id)} disabled={isLoading} style={{ flex: 1 }}>📄 Pobierz CSV z Drive</button>
                            )}
                            {canManagePS && order.csvLoaded && (
                              <button className="btn" onClick={() => handleRedownloadCsv(order.id)} disabled={isLoading} style={{ fontSize: '11px' }}>🔄 Pobierz ponownie CSV</button>
                            )}
                            {canManagePS && (
                              <button className="btn btn-success" onClick={() => handleMoveToProduction(order.id)} disabled={isLoading || !canMoveToProduction(order)} style={{ flex: 1 }}>🏭 Na produkcję</button>
                            )}
                            {canManagePS && (
                              <button className="btn btn-danger" onClick={() => handleDeletePrestashop(order.id)} disabled={isLoading} style={{ padding: '8px 12px' }}>🗑️</button>
                            )}
                          </div>
                          {!canMoveToProduction(order) && (
                            <div style={{ fontSize: '11px', color: '#c62828', background: '#ffebee', padding: '6px 8px', borderRadius: '4px', marginTop: '4px' }}>
                              ⛔ Brakuje: {canMoveToProductionReasons(order).join(' • ')}
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })()}

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
                    {order.trudnyKlient && <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>⚠️ TRUDNY KLIENT</div>}
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
                    <h3 style={{ margin: 0 }}>#{order.id}
                      {order.kanapka && <span style={{ fontSize: '13px', color: '#666', marginLeft: '8px' }}>🥪 {order.kanapka}</span>}
                      {order.brakAkcesoriow && <span style={{ fontSize: '13px', background: '#ffebee', color: '#c62828', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>❌</span>}
                    </h3>
                    {order.trudnyKlient && <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '4px' }}>⚠️ TRUDNY KLIENT</span>}
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
                          <h3 style={{ margin: '0 0 4px 0' }}>#{order.id} {order.trudnyKlient && <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '4px' }}>⚠️ TK</span>}</h3>
                          {order.uwagi && <p style={{ fontSize: '13px', color: '#1976d2', margin: '0 0 2px 0' }}>💬 {order.uwagi}</p>}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {order.transportDate && <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>📅 {order.transportDate}</span>}
                            {order.dateConfirmed && <span style={{ fontSize: '13px', color: '#388e3c' }}>✅ potwierdzona</span>}
                            {order.attachments?.length > 0 && <span style={{ fontSize: '13px', color: '#666' }} title="Załączniki">📎 {order.attachments.length}</span>}
                            {order.kanapka && <span style={{ fontSize: '13px', color: '#666' }}>🥪 {order.kanapka}</span>}
                            {order.złożone && <span style={{ fontSize: '13px', background: '#d4edda', padding: '1px 6px', borderRadius: '4px' }} title="Akcesoria złożone">🧩 złożone</span>}
                            {order.dołożone && <span style={{ fontSize: '13px', background: '#cce5ff', padding: '1px 6px', borderRadius: '4px' }} title="Dołożone do palety">📦 dołożone</span>}
                            {order.brakAkcesoriow && <span style={{ fontSize: '13px', background: '#ffebee', color: '#c62828', padding: '2px 6px', borderRadius: '4px' }} title="Brak akcesoriów">❌</span>}
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
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }} title="Załączniki">📎 Załączniki (list przewozowy, dokumenty):</label>
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

                        {order.trudnyKlient && (order.trudnyKlientNotatki || []).length > 0 && (
                          <div style={{ background: '#ffebee', border: '1px solid #f44336', borderRadius: '4px', padding: '8px', marginBottom: '1rem' }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#c62828', fontSize: '12px' }}>⚠️ TRUDNY KLIENT</p>
                            {order.trudnyKlientNotatki.map((n, i) => <p key={i} style={{ margin: '2px 0', fontSize: '11px' }}><span style={{ color: '#999' }}>{new Date(n.date).toLocaleDateString('pl-PL')}</span> {n.text}</p>)}
                          </div>
                        )}

                        {isPallet && (
                          <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem', marginBottom: '1rem' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Status Raben (tylko odczyt):</label>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                                <input type="checkbox" checked={order.spakowane || false} disabled /> Spakowane {order.spakowane && order.photoArchived && <span style={{ fontSize: '10px', color: '#388e3c' }}>(auto-zdjęcia)</span>}
                              </label>
                              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                                <input type="checkbox" checked={order.wyslane || false} disabled /> Wysłane
                              </label>
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                          <button className="btn btn-success" onClick={() => handleTransferOrder(order.id, isPallet ? 'pallet' : 'dedicated')} disabled={isLoading || !order.dateConfirmed} style={{ flex: 1 }}>
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
                    {order.attachments?.length > 0 && <span style={{ marginRight: '12px' }} title="Załączniki">📎 {order.attachments.length} plik(ów)</span>}
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

          {activeTab === 'archive3' && (
            <div>
              <h2>🧩 Archiwum akcesoriów ({archive3Orders.length})</h2>
              <div className="search-box">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
              </div>
              {archive3Orders.filter(o => !searchQuery || o.id.includes(searchQuery)).length === 0 && <p style={{ color: '#999' }}>Brak zamówień</p>}
              {archive3Orders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => {
                const ps = order.prestashopData || {};
                const akcesoriaHistory = (order.history || []).filter(h =>
                  h.action && (h.action.toLowerCase().includes('akces') || h.action.toLowerCase().includes('złożon') || h.action.toLowerCase().includes('dołożon') || h.action.toLowerCase().includes('brak akc'))
                );
                return (
                  <div key={order.docId} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0' }}>#{order.id} {order.kanapka && <span style={{ fontSize: '13px', color: '#666' }}>🥪 {order.kanapka}</span>}</h3>
                        {ps.dataRealizacji && <div style={{ fontSize: '12px', color: '#666' }}>📅 {ps.dataRealizacji}</div>}
                        {order.akcesoriaUwagi && <p style={{ fontSize: '12px', color: '#555', margin: '4px 0' }}>📝 {order.akcesoriaUwagi}</p>}
                        <div style={{ fontSize: '12px', color: '#388e3c', marginTop: '4px' }}>
                          {order.brakAkcesoriow ? '❌ Brak akcesoriów' : '✅ złożone · 📦 dołożone'}
                        </div>
                      </div>
                    </div>
                    {order.akcesoriaArchiveData && (
                      <div style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>📋 Dane z archiwizacji:</div>
                        <div style={{ fontSize: '11px', color: '#555' }}>
                          Zarchiwizował: <strong>{order.akcesoriaArchiveData.archivedBy}</strong> — {new Date(order.akcesoriaArchiveData.archivedAt).toLocaleString('pl-PL')}
                        </div>
                        {order.akcesoriaArchiveData.akcesoriaUwagi && <div style={{ fontSize: '11px', color: '#555' }}>Uwagi: {order.akcesoriaArchiveData.akcesoriaUwagi}</div>}
                        {order.akcesoriaArchiveData.brakiList?.length > 0 && (
                          <div style={{ marginTop: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Braki magazynowe:</div>
                            {order.akcesoriaArchiveData.brakiList.map((b, i) => (
                              <div key={i} style={{ fontSize: '11px', color: '#555', paddingLeft: '8px' }}>
                                • {b.nazwa} ({b.ilosc}) — {b.uzupelnione ? '✅ uzupełnione' : b.zamowione ? '⏳ zamówione' : '❌ niezamówione'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {akcesoriaHistory.length > 0 && (
                      <div style={{ marginTop: '6px', borderTop: '1px solid #eee', paddingTop: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>📋 Historia:</div>
                        {akcesoriaHistory.map((h, i) => (
                          <div key={i} style={{ fontSize: '11px', color: '#555', padding: '2px 0' }}>
                            {new Date(h.timestamp).toLocaleString('pl-PL')} — <strong>{h.user}</strong>: {h.action}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Linki do akcesoriów */}
                    {order.accessoryLinks && (order.accessoryLinks.okucLink || order.accessoryLinks.ciecieLink) && (
                      <div style={{ marginTop: '6px', fontSize: '12px' }}>
                        {order.accessoryLinks.okucLink && <a href={order.accessoryLinks.okucLink} target="_blank" rel="noreferrer" style={{ color: '#7b1fa2', marginRight: '8px' }}>📄 Okuc</a>}
                        {order.accessoryLinks.ciecieLink && <a href={order.accessoryLinks.ciecieLink} target="_blank" rel="noreferrer" style={{ color: '#7b1fa2' }}>📄 Cięcie</a>}
                      </div>
                    )}
                  </div>
                );
              })}
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
            const paletaOptions = [];
            for (let p = 1; p <= 4; p++) { for (let m = 1; m <= 10; m++) { paletaOptions.push(`${p}.${m}`); } }

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
                            <h3 style={{ margin: 0 }}>#{order.id} {order.trudnyKlient && <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '4px' }}>⚠️ TK</span>}</h3>
                            {order.transportDate && <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>📅 {order.transportDate}</span>}
                            {!isRaben && order.paleta && <span style={{ fontSize: '15px', background: '#e1bee7', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>P{order.paleta}</span>}
                            {order.spakowane && <span style={{ fontSize: '15px', background: '#fff3cd', padding: '2px 8px', borderRadius: '4px' }} title="Spakowane">📦</span>}
                            {order.wyslane && <span style={{ fontSize: '15px', background: '#d4edda', padding: '2px 8px', borderRadius: '4px' }} title="Wysłane">🚚</span>}
                            {order.dostarczone && <span style={{ fontSize: '15px', background: '#cce5ff', padding: '2px 8px', borderRadius: '4px' }} title="Dostarczone">✅</span>}
                            {order.attachments?.length > 0 && <span style={{ fontSize: '15px', color: '#666' }} title="Załączniki">📎 {order.attachments.length}</span>}
                            {order.kanapka && <span style={{ fontSize: '14px', color: '#666' }}>🥪 {order.kanapka}</span>}
                            {order.złożone && <span style={{ fontSize: '15px', background: '#d4edda', padding: '2px 8px', borderRadius: '4px' }} title="Akcesoria złożone">🧩</span>}
                            {order.dołożone && <span style={{ fontSize: '15px', background: '#cce5ff', padding: '2px 8px', borderRadius: '4px' }} title="Dołożone do palety">📦dł</span>}
                            {order.brakAkcesoriow && <span style={{ fontSize: '15px', background: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: '4px' }} title="Brak akcesoriów">❌</span>}
                          </div>
                          {order.uwagi && <p style={{ fontSize: '13px', color: '#1976d2', margin: '4px 0 0 0' }}>💬 {order.uwagi}</p>}
                        </div>
                        <span style={{ fontSize: '18px' }}>{selectedOrderId === order.id ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {selectedOrderId === order.id && (
                      <div className="card" style={{ borderLeft: `3px solid ${isRaben ? '#ff9800' : '#9c27b0'}` }}>

                        {order.trudnyKlient && (order.trudnyKlientNotatki || []).length > 0 && (
                          <div style={{ background: '#ffebee', border: '1px solid #f44336', borderRadius: '4px', padding: '8px', marginBottom: '1rem' }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#c62828', fontSize: '12px' }}>⚠️ TRUDNY KLIENT</p>
                            {order.trudnyKlientNotatki.map((n, i) => <p key={i} style={{ margin: '2px 0', fontSize: '11px' }}><span style={{ color: '#999' }}>{new Date(n.date).toLocaleDateString('pl-PL')}</span> {n.text}</p>)}
                          </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📅 Data transportu:</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold' }}>{order.transportDate || 'Brak'}</span>
                            {canManage && (dateEditOrderId === order.id ? (
                              <>
                                <input type="date" defaultValue={order.transportDate || ''} onChange={e => handleSaveDateEdit(order.id, e.target.value)} style={{ padding: '4px' }} />
                                <button className="btn" onClick={() => setDateEditOrderId(null)} style={{ padding: '4px 8px', fontSize: '11px' }}>Anuluj</button>
                              </>
                            ) : (
                              <button className="btn" onClick={() => handlePasswordDateEdit(order.id)} disabled={isLoading} style={{ padding: '4px 8px', fontSize: '11px' }}>🔒 Zmień datę</button>
                            ))}
                          </div>
                        </div>

                        {!isRaben && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>🎨 Paleta:</label>
                            {canManage ? (() => {
                              const usedPaletas = transportOrders.filter(o => o.transportDate === order.transportDate && o.id !== order.id && o.paleta).map(o => o.paleta);
                              return (
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <select value={order.paleta || ''} onChange={e => handleUpdateOrderField(order.id, 'paleta', e.target.value || null)} style={{ padding: '4px' }}>
                                    <option value="">-- brak --</option>
                                    {paletaOptions.map(n => <option key={n} value={n} disabled={usedPaletas.includes(n)}>P{n}{usedPaletas.includes(n) ? ' (zajęte)' : ''}</option>)}
                                  </select>
                                  {order.paleta && <button className="btn btn-danger" onClick={() => handleUpdateOrderField(order.id, 'paleta', null)} style={{ padding: '2px 8px', fontSize: '11px' }}>Usuń</button>}
                                </div>
                              );
                            })() : (
                              <span>{order.paleta ? `P${order.paleta}` : 'Brak'}</span>
                            )}
                          </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>💬 Uwagi (widoczne na liście):</label>
                          {canManage ? (
                            <input type="text" maxLength={60} value={order.uwagi || ''} onChange={e => handleUpdateOrderField(order.id, 'uwagi', e.target.value)} placeholder="Krótka uwaga..." style={{ width: '100%' }} />
                          ) : (
                            <p style={{ fontSize: '12px', color: '#333', margin: 0 }}>{order.uwagi || '—'}</p>
                          )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📝 Notatki biuro:</label>
                          {canManage ? (
                            <textarea value={order.notatki || ''} onChange={e => handleUpdateOrderField(order.id, 'notatki', e.target.value)} placeholder="Notatki biuro..." style={{ width: '100%', height: '50px' }} />
                          ) : (
                            <p style={{ fontSize: '12px', color: '#333', margin: 0, whiteSpace: 'pre-wrap' }}>{order.notatki || '—'}</p>
                          )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📝 Notatki magazyn:</label>
                          <textarea value={order.notatki_magazyn || ''} onChange={e => handleUpdateOrderField(order.id, 'notatki_magazyn', e.target.value)} placeholder="Notatki magazyn..." style={{ width: '100%', height: '50px' }} />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }} title="Załączniki">📎 Załączniki:</label>
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

                        {allChecked(order) && canManage && (
                          <button className="btn btn-success" onClick={() => handleMoveToArchive(order.id)} disabled={isLoading} style={{ width: '100%' }}>🗄️ Przenieś do archiwum</button>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            );
          })()}

          {activeTab === 'trudny_klient' && (
            <div>
              <h2 style={{ color: '#c62828' }}>⚠️ Trudny klient ({trudnyKlientOrders.length})</h2>
              <div className="card">
                <h3>Dodaj zamówienie</h3>
                <input type="text" value={tkOrderNum} onChange={e => setTkOrderNum(e.target.value)} placeholder="Numer zamówienia" style={{ width: '100%', marginBottom: '0.5rem' }} />
                <textarea value={tkNote} onChange={e => setTkNote(e.target.value)} placeholder="Notatka (opcjonalnie)" style={{ width: '100%', height: '60px', marginBottom: '0.5rem' }} />
                <button className="btn btn-danger" onClick={handleAddTrudnyKlient} disabled={isLoading} style={{ width: '100%' }}>⚠️ Dodaj</button>
              </div>
              <div className="search-box">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj zamówienia..." />
              </div>
              {trudnyKlientOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).length === 0 && <p style={{ color: '#999' }}>Brak zamówień</p>}
              {trudnyKlientOrders.filter(o => !searchQuery || o.id.includes(searchQuery)).map(order => (
                <div key={order.docId} className="card" style={{ borderLeft: '3px solid #f44336' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, color: '#c62828' }}>⚠️ #{order.id}</h3>
                    <button className="btn btn-danger" onClick={() => handleArchiveTrudnyKlient(order.id)} disabled={isLoading} style={{ padding: '4px 10px', fontSize: '11px' }}>🗄️ Archiwum</button>
                  </div>
                  {(order.trudnyKlientNotatki || []).map((n, idx) => (
                    <div key={idx} style={{ background: '#ffebee', padding: '8px 12px', borderRadius: '4px', marginBottom: '4px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 'bold', color: '#c62828' }}>{n.user}</span>
                        <span style={{ fontSize: '11px', color: '#999' }}>{new Date(n.date).toLocaleString('pl-PL')}</span>
                      </div>
                      <p style={{ margin: 0 }}>{n.text}</p>
                    </div>
                  ))}
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '8px' }}>
                    <textarea id={`tk-note-${order.id}`} placeholder="Nowa notatka..." style={{ flex: 1, height: '50px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    <button className="btn btn-primary" onClick={() => { const el = document.getElementById(`tk-note-${order.id}`); handleAddTkNote(order.id, el.value); el.value = ''; }} disabled={isLoading} style={{ padding: '8px 16px', alignSelf: 'flex-end' }}>Dodaj</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'admin' && (
            <div>
              <h2>⚙️ Administracja</h2>

              <div className="card" style={{ background: '#ffebee' }}>
                <h3 style={{ color: '#c62828' }}>🗑️ Czyszczenie danych testowych</h3>
                <p style={{ fontSize: '12px', color: '#666' }}>Usuwa WSZYSTKIE zamówienia z systemu.</p>
                <button className="btn btn-danger" onClick={handleClearAllOrders} disabled={isLoading} style={{ width: '100%' }}>🗑️ Wyczyść wszystkie zamówienia</button>
              </div>

              <div className="card">
                <h3>Dodaj użytkownika</h3>
                <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Imię i nazwisko" style={{ width: '100%', marginBottom: '0.5rem' }} />
                <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email" style={{ width: '100%', marginBottom: '0.5rem' }} />
                <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Hasło" autoComplete="new-password" style={{ width: '100%', marginBottom: '0.75rem' }} />
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
