import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultTrip, initialTrip, quiz, Trip } from './data';

export type TabName = 'home' | 'explore' | 'itinerary' | 'game' | 'profile';
export type RouteName = TabName | 'welcome' | 'login' | 'register' | 'forgot' | 'verify' | 'reset' | 'place' | 'map' | 'tripInfo' | 'tripPreferences' | 'tripPlaces' | 'tripReview' | 'tripSaved' | 'tripDetail' | 'tripEdit' | 'tripEditPlaces' | 'weather' | 'replacement' | 'replacementConfirm' | 'gameIntro' | 'quiz' | 'quizResult' | 'quizAnswers' | 'rewards' | 'rewardDetail' | 'redeemed' | 'myRewards' | 'editProfile' | 'favorites';
export type Route = { name: RouteName; id?: string };

type AppContextValue = {
  route: Route;
  signedIn: boolean;
  name: string;
  email: string;
  phone: string;
  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  login: () => void;
  logout: () => void;
  navigate: (name: RouteName, id?: string) => void;
  back: () => void;
  tab: (name: TabName) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  trips: Trip[];
  draft: Trip;
  setDraft: (trip: Trip) => void;
  startCreate: () => void;
  saveDraft: () => void;
  startEdit: (id: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  replaceSonTra: () => void;
  quizIndex: number;
  quizSelected: number | null;
  quizAnswers: (number | null)[];
  quizConfirmed: boolean;
  quizCompleted: boolean;
  points: number;
  startQuiz: () => void;
  selectAnswer: (index: number) => void;
  confirmAnswer: () => void;
  nextQuestion: () => void;
  rewardRedeemed: boolean;
  redeemReward: () => void;
  notify: (message: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE_KEY = 'danangacy.demo.v1';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'welcome' }]);
  const [signedIn, setSignedIn] = useState(false);
  const [name, setName] = useState('Nguyễn Hân');
  const [email, setEmail] = useState('han.nguyen@email.com');
  const [phone, setPhone] = useState('');
  const [favorites, setFavorites] = useState(['cham', 'son-tra', 'cau-rong']);
  const [trips, setTrips] = useState<Trip[]>([initialTrip]);
  const [draft, setDraft] = useState<Trip>(defaultTrip);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(() => [quiz[0].correct, ...Array(quiz.length - 1).fill(null)]);
  const [quizConfirmed, setQuizConfirmed] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [points, setPoints] = useState(120);
  const [rewardRedeemed, setRewardRedeemed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!active || !raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.name === 'string') setName(saved.name);
      if (typeof saved.email === 'string') setEmail(saved.email);
      if (typeof saved.phone === 'string') setPhone(saved.phone);
      if (Array.isArray(saved.favorites)) setFavorites(saved.favorites.filter((id: unknown) => typeof id === 'string'));
      if (Array.isArray(saved.trips)) setTrips(saved.trips);
      if (typeof saved.quizCompleted === 'boolean') setQuizCompleted(saved.quizCompleted);
      if (Array.isArray(saved.quizAnswers) && saved.quizAnswers.length === quiz.length) setQuizAnswers(saved.quizAnswers);
      if (typeof saved.points === 'number') setPoints(saved.points);
      if (typeof saved.rewardRedeemed === 'boolean') setRewardRedeemed(saved.rewardRedeemed);
      if (saved.signedIn === true) { setSignedIn(true); setStack([{ name: 'home' }]); }
    }).catch(() => {}).finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ signedIn, name, email, phone, favorites, trips, quizCompleted, quizAnswers, points, rewardRedeemed })).catch(() => {});
    }, 100);
    return () => clearTimeout(timer);
  }, [hydrated, signedIn, name, email, phone, favorites, trips, quizCompleted, quizAnswers, points, rewardRedeemed]);

  const route = stack[stack.length - 1];
  const navigate = (name: RouteName, id?: string) => setStack((s) => [...s, { name, id }]);
  const back = () => setStack((s) => s.length > 1 ? s.slice(0, -1) : s);
  const tab = (name: TabName) => setStack([{ name }]);
  const login = () => { setSignedIn(true); tab('home'); };
  const logout = () => { setSignedIn(false); setStack([{ name: 'welcome' }]); };
  const notify = (message: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(message);
    } else Alert.alert('DANANGACY', message);
  };
  const toggleFavorite = (id: string) => setFavorites((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const startCreate = () => { setEditingId(null); setDraft({ ...defaultTrip, stops: defaultTrip.stops.map((s) => ({ ...s })) }); navigate('tripInfo'); };
  const saveDraft = () => {
    const saved = { ...draft, id: `trip-${Date.now()}`, saved: true };
    setTrips((s) => [saved, ...s]);
    setDraft(saved);
    navigate('tripSaved', saved.id);
  };
  const startEdit = (id: string) => {
    const found = trips.find((trip) => trip.id === id);
    if (!found) return;
    setEditingId(id);
    setDraft({ ...found, stops: found.stops.map((stop) => ({ ...stop })) });
    navigate('tripEdit', id);
  };
  const saveEdit = () => {
    if (!editingId) return;
    setTrips((s) => s.map((trip) => trip.id === editingId ? { ...draft, id: editingId, saved: true } : trip));
    setStack([{ name: 'tripDetail', id: editingId }]);
  };
  const cancelEdit = () => {
    if (!editingId) return;
    setStack([{ name: 'tripDetail', id: editingId }]);
  };
  const replaceSonTra = () => {
    const trip = trips.find((item) => item.id === route.id) ?? trips.find((item) => item.id !== 'hoi-an');
    if (!trip) return;
    setTrips((s) => s.map((item) => item.id === trip.id ? { ...item, stops: item.stops.map((stop) => stop.placeId === 'son-tra' ? { ...stop, placeId: 'bao-tang-dn' } : stop) } : item));
    setStack([{ name: 'tripDetail', id: trip.id }]);
  };
  const startQuiz = () => { const next = quizAnswers.findIndex((answer) => answer === null); setQuizIndex(next < 0 ? 0 : next); setQuizSelected(null); setQuizConfirmed(false); navigate('quiz'); };
  const selectAnswer = (index: number) => { if (!quizConfirmed) setQuizSelected(index); };
  const confirmAnswer = () => {
    if (quizSelected === null) return;
    setQuizAnswers((s) => s.map((v, i) => i === quizIndex ? quizSelected : v));
    setQuizConfirmed(true);
  };
  const nextQuestion = () => {
    if (quizIndex < quiz.length - 1) {
      setQuizIndex((s) => s + 1); setQuizSelected(null); setQuizConfirmed(false);
    } else {
      if (!quizCompleted) { setPoints((s) => s + 50); setQuizCompleted(true); }
      navigate('quizResult');
    }
  };
  const redeemReward = () => {
    if (rewardRedeemed || points < 100) return;
    setPoints((s) => s - 100); setRewardRedeemed(true); navigate('redeemed');
  };

  if (!hydrated) return null;
  return <AppContext.Provider value={{ route, signedIn, name, email, phone, setName, setEmail, setPhone, login, logout, navigate, back, tab, favorites, toggleFavorite, trips, draft, setDraft, startCreate, saveDraft, startEdit, saveEdit, cancelEdit, replaceSonTra, quizIndex, quizSelected, quizAnswers, quizConfirmed, quizCompleted, points, startQuiz, selectAnswer, confirmAnswer, nextQuestion, rewardRedeemed, redeemReward, notify }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used within AppProvider');
  return value;
}
