import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Goal, Post, Friend } from './types';
import * as GeminiService from './services/geminiService';
import Splash from './components/Splash';
import BottomNav from './components/BottomNav';
import ApiKeyModal from './components/ApiKeyModal';
import { 
  Plus, CheckCircle, Video, MicOff, 
  Send, Heart, Lock, Globe, Trophy, ShoppingBag, MessageCircle, Mic, Settings, Key, RefreshCw
} from 'lucide-react';

// --- Mock Data ---
const MOCK_FRIENDS: Friend[] = [
  { id: '1', nickname: '공부왕', isOnline: true, studyTime: 120, goalRate: 80, statusMessage: '오늘 끝까지 달린다' },
  { id: '2', nickname: '새벽반', isOnline: true, studyTime: 45, goalRate: 30, statusMessage: '졸리다...' },
  { id: '3', nickname: 'JustDoIt', isOnline: false, studyTime: 200, goalRate: 100, statusMessage: '완료' },
];

// --- Components ---

// 1. Onboarding Page
const Onboarding: React.FC<{ onComplete: (name: string) => void }> = ({ onComplete }) => {
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center"
      >
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-indigo-600 tracking-widest mb-2">JUST</h1>
          <p className="text-gray-400 text-sm">Just Start, Just Do It.</p>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">환영합니다!</h2>
        <p className="text-gray-500 mb-6">앱에서 사용할 닉네임을 입력해주세요.</p>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="닉네임 입력"
          className="w-full border-b-2 border-indigo-200 py-2 text-center text-xl focus:outline-none focus:border-indigo-600 transition-colors mb-8 bg-transparent"
        />
        <button 
          onClick={() => name && onComplete(name)}
          disabled={!name}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          시작하기
        </button>
      </motion.div>
    </div>
  );
};

// 2. Dashboard Page
interface DashboardProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  onOpenSettings: () => void;
  keyVersion: number; // Used to trigger data refresh
}

const Dashboard: React.FC<DashboardProps> = ({ user, setUser, onOpenSettings, keyVersion }) => {
  const [quote, setQuote] = useState<string>("오늘도 힘찬 하루 보내세요!");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);

  useEffect(() => {
    // Refresh data whenever keyVersion changes (key saved/deleted)
    const fetchData = async () => {
      if (GeminiService.hasApiKey()) {
        const q = await GeminiService.getDailyQuote();
        setQuote(q);
        loadAIRecommendation();
      } else {
        setQuote("설정에서 API 키를 등록하면 AI 응원을 받을 수 있어요!");
        // Load default goals if no key
        const defaults = await GeminiService.getRecommendedGoals();
        setGoals(prev => {
            if (prev.length > 0) return prev; // Don't overwrite if user has goals
            return defaults;
        });
      }
    };
    fetchData();
  }, [keyVersion]);

  const loadAIRecommendation = async () => {
    setLoadingGoals(true);
    const recGoals = await GeminiService.getRecommendedGoals();
    setGoals(prev => {
        // Simple de-duplication
        const newGoals = recGoals.filter(ng => !prev.some(pg => pg.text === ng.text));
        return [...prev, ...newGoals];
    });
    setLoadingGoals(false);
  };

  const toggleGoal = (id: string) => {
    const updatedGoals = goals.map(g => {
      if (g.id === id) {
        return { ...g, completed: !g.completed };
      }
      return g;
    });
    setGoals(updatedGoals);

    const allCompleted = updatedGoals.length > 0 && updatedGoals.every(g => g.completed);
    const todayIndex = new Date().getDay(); 
    
    if (allCompleted && !user.stamps[todayIndex]) {
       const newStamps = [...user.stamps];
       newStamps[todayIndex] = true;
       
       let newPoints = user.points + 100; 
       let newStreak = user.streak + 1;

       if (newStamps.every(s => s)) {
         newPoints += 700;
         alert("🎉 일주일 연속 달성! 700포인트가 적립되었습니다!");
       }

       setUser(prev => ({
         ...prev,
         stamps: newStamps,
         points: newPoints,
         streak: newStreak
       }));
    }
  };

  return (
    <div className="pb-24 p-6 space-y-6 animate-fade-in relative">
      {!GeminiService.hasApiKey() && (
        <div onClick={onOpenSettings} className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center justify-between cursor-pointer active:bg-red-100 transition-colors">
            <div className="flex items-center gap-2 text-red-600 text-xs font-bold">
                <Key size={14} />
                <span>AI 기능을 위해 API 키를 설정해주세요</span>
            </div>
            <Settings size={14} className="text-red-400" />
        </div>
      )}

      {/* Header / Quote */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200"
      >
        <p className="font-medium opacity-80 mb-2 text-sm flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">Today's Pick</span>
            오늘의 응원
        </p>
        <h2 className="text-lg font-bold leading-relaxed tracking-wide">"{quote}"</h2>
      </motion.div>

      {/* Stamp Board */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <Trophy className="text-yellow-500 fill-yellow-500" size={20} />
              스탬프 챌린지
            </h3>
            <p className="text-xs text-slate-400 mt-1">목표를 모두 달성하고 스탬프를 받으세요!</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-indigo-600">{user.points} P</span>
            <span className="text-xs text-slate-400">보유 포인트</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
          {user.stamps.map((active, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <motion.div 
                animate={{ scale: active ? 1.2 : 1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${active ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-200 text-slate-300'}`}
              >
                {active ? <CheckCircle size={16} strokeWidth={3} /> : <div className="w-1 h-1 bg-slate-300 rounded-full" />}
              </motion.div>
              <span className={`text-[10px] font-bold ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
                {['일','월','화','수','목','금','토'][idx]}
              </span>
            </div>
          ))}
        </div>
        
        {user.stamps.filter(s => s).length === 7 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 text-center text-sm text-green-700 font-bold bg-green-100 py-3 rounded-xl border border-green-200"
          >
            🎉 Perfect Week! 700P 추가 적립 완료
          </motion.div>
        )}
      </div>

      {/* Today's Goals */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="font-bold text-lg text-slate-800">오늘의 작은 목표</h3>
            <p className="text-xs text-slate-400">하나씩 천천히 달성해보세요</p>
          </div>
          <button 
            onClick={loadAIRecommendation} 
            disabled={loadingGoals}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
          >
             {loadingGoals ? <RefreshCw size={12} className="animate-spin"/> : <Plus size={12} />}
             AI 추천받기
          </button>
        </div>
        
        <div className="space-y-3">
            {goals.map((goal) => (
            <motion.div 
                key={goal.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`group p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 cursor-pointer ${goal.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-200'}`}
                onClick={() => toggleGoal(goal.id)}
            >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${goal.completed ? 'bg-indigo-100 border-indigo-100' : 'border-indigo-200 group-hover:border-indigo-400'}`}>
                {goal.completed && <CheckCircle size={14} className="text-indigo-600" />}
                </div>
                <div className="flex-1">
                <span className={`block font-medium transition-colors ${goal.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {goal.text}
                </span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    goal.type === 'health' ? 'bg-green-100 text-green-600' : 
                    goal.type === 'social' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                }`}>
                    {goal.type}
                </span>
                </div>
            </motion.div>
            ))}
            
            {goals.length === 0 && !loadingGoals && (
                <div className="text-center py-8 text-slate-400 text-sm">
                    아직 목표가 없어요. AI에게 추천을 받아보세요!
                </div>
            )}
        </div>

        {loadingGoals && (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-xs text-indigo-400">AI가 맞춤 목표를 생각중입니다...</p>
          </div>
        )}
      </div>
      
      {/* Shop Teaser */}
      <div className="bg-orange-50 p-5 rounded-2xl flex items-center justify-between border border-orange-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="text-orange-500" size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">포인트 상점</p>
            <p className="text-xs text-slate-500">열심히 모은 포인트, 커피로 바꿔보세요!</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-white text-orange-600 text-xs font-bold rounded-xl shadow-sm border border-orange-100 hover:bg-orange-50 transition-colors">
          구경하기
        </button>
      </div>
    </div>
  );
};

// 3. Study Group (Cam Study)
const StudyGroup: React.FC<{ user: User }> = ({ user }) => {
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (videoEnabled) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: micEnabled })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
            console.error("Cam/Mic access denied", err);
            alert("카메라/마이크 권한이 필요합니다.");
            setVideoEnabled(false);
        });
    }
    return () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [videoEnabled, micEnabled]);

  return (
    <div className="pb-24 p-6 min-h-screen bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">스터디 그룹</h2>
            <p className="text-xs text-slate-500">함께하면 더 오래할 수 있어요</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
           <span className={`w-2 h-2 rounded-full ${user.isPublic ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
           <span className="text-xs font-bold text-slate-600">{user.isPublic ? '공개 중' : '비공개'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* My Cam */}
        <div className="bg-slate-800 rounded-2xl aspect-video overflow-hidden relative shadow-lg ring-1 ring-slate-900/5">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted={true} // Always mute self
            className={`w-full h-full object-cover transform scale-x-[-1] ${!videoEnabled ? 'hidden' : ''}`} 
          />
          {!videoEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Video size={32} className="mb-2 opacity-50" />
              <span className="text-xs">카메라 꺼짐</span>
            </div>
          )}
          
          {/* Controls Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
            <div className="flex items-center gap-1.5 text-white">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <span className="text-xs font-medium truncate max-w-[80px]">나 ({user.nickname})</span>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`p-1.5 rounded-full backdrop-blur-md ${micEnabled ? 'bg-white/20 text-white' : 'bg-red-500/80 text-white'}`}
                >
                    {micEnabled ? <Mic size={12} /> : <MicOff size={12} />}
                </button>
                <button 
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    className={`p-1.5 rounded-full backdrop-blur-md ${videoEnabled ? 'bg-white/20 text-white' : 'bg-red-500/80 text-white'}`}
                >
                    <Video size={12} />
                </button>
            </div>
          </div>
        </div>

        {/* Friend Cams (Mock) */}
        {MOCK_FRIENDS.map(friend => (
          <div key={friend.id} className="bg-slate-200 rounded-2xl aspect-video overflow-hidden relative shadow-inner">
             {friend.isOnline ? (
               <div className="w-full h-full bg-slate-700 flex flex-col items-center justify-center text-slate-500">
                 <div className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-indigo-500 animate-spin mb-2"></div>
                 <span className="text-[10px] text-slate-400">공부 중...</span>
               </div>
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center bg-slate-300 text-slate-500">
                 <div className="w-8 h-8 rounded-full bg-slate-400 mb-2"></div>
                 <span className="text-[10px]">오프라인</span>
               </div>
             )}
             <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs">
                {friend.nickname}
             </div>
             {friend.isOnline && (
               <div className="absolute top-2 right-2 bg-indigo-600/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-bold border border-indigo-500/50">
                 {friend.goalRate}%
               </div>
             )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 text-lg">친구 현황</h3>
        <div className="space-y-6">
          {MOCK_FRIENDS.map(friend => (
            <div key={friend.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {friend.nickname[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{friend.nickname}</p>
                  <p className="text-xs text-slate-400 truncate w-32">{friend.statusMessage}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-indigo-600">{Math.floor(friend.studyTime / 60)}h {friend.studyTime % 60}m</p>
                <div className="w-24 h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${friend.goalRate}%` }}
                    className="h-full bg-indigo-500 rounded-full"
                  ></motion.div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 4. Community Page
const Community: React.FC<{ user: User }> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([
    { id: '1', author: '익명', content: '오늘 진짜 아무것도 하기 싫었는데, 물 한잔 마시기 목표 달성하고 나니까 책상에 앉게 되더라. 다들 힘내!', likes: 12, timestamp: new Date(), isAuthorPublic: false },
    { id: '2', author: '공부왕', content: '스탬프 일주일 연속 찍었다!! 700포인트 개이득 ㅎㅎ', likes: 24, timestamp: new Date(), isAuthorPublic: true },
    { id: '3', author: '익명', content: '3년째 쉬는중인데 다시 시작할 수 있을까..?', likes: 45, timestamp: new Date(), isAuthorPublic: false },
    { id: '4', author: 'JustStarter', content: '오늘 그룹 스터디 처음 해봤는데 딴짓 안하게 되서 좋네요.', likes: 8, timestamp: new Date(), isAuthorPublic: true },
  ]);
  const [isWriting, setIsWriting] = useState(false);
  const [newContent, setNewContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handlePost = () => {
    if (!newContent.trim()) return;
    const newPost: Post = {
      id: Date.now().toString(),
      author: user.isPublic ? user.nickname : '익명',
      content: newContent,
      likes: 0,
      timestamp: new Date(),
      isAuthorPublic: user.isPublic
    };
    setPosts([newPost, ...posts]);
    setNewContent('');
    setIsWriting(false);
    // Scroll to top
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-screen relative flex flex-col h-screen">
      <div className="bg-white p-4 z-30 shadow-sm border-b border-slate-100 flex-none">
        <h2 className="text-xl font-bold text-slate-800">함께해요</h2>
        <p className="text-xs text-slate-500">서로 응원하고 고민을 나누는 공간</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {posts.map(post => (
          <motion.div 
            key={post.id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${post.isAuthorPublic ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                {post.author[0]}
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800">{post.author}</span>
                <span className="text-xs text-slate-400 ml-2">방금 전</span>
              </div>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center gap-4 border-t border-slate-50 pt-3">
              <button className="flex items-center gap-1.5 text-slate-400 hover:text-pink-500 text-xs transition-colors">
                <Heart size={16} />
                <span>공감 {post.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 text-xs transition-colors">
                <MessageCircle size={16} />
                <span>댓글</span>
              </button>
            </div>
          </motion.div>
        ))}
        <div className="h-4"></div>
      </div>

      {/* Small FAB Bottom Right */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsWriting(true)}
        className="fixed bottom-20 right-6 w-12 h-12 bg-indigo-600 rounded-full text-white shadow-xl flex items-center justify-center z-40 hover:bg-indigo-700 ring-4 ring-indigo-50"
      >
        <Plus size={24} />
      </motion.button>

      {/* Write Modal */}
      <AnimatePresence>
        {isWriting && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsWriting(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4 text-slate-800">새로운 글 작성</h3>
              <textarea 
                className="w-full h-32 p-4 bg-slate-50 rounded-2xl mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-700 placeholder:text-slate-400"
                placeholder="오늘 어떤 일이 있었나요? 따뜻한 위로가 필요하신가요?"
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                  {user.isPublic ? <Globe size={12}/> : <Lock size={12}/>}
                  {user.isPublic ? '공개 모드 (닉네임)' : '비공개 모드 (익명)'}
                </div>
                <button 
                  onClick={handlePost}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  <Send size={14} />
                  등록
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 5. Profile / Settings Page
const Profile: React.FC<{ user: User, setUser: React.Dispatch<React.SetStateAction<User>>, onOpenSettings: () => void }> = ({ user, setUser, onOpenSettings }) => {
  const toggleMode = () => {
    setUser(prev => ({ ...prev, isPublic: !prev.isPublic }));
  };

  return (
    <div className="pb-24 p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">내 정보</h2>
        <button 
            onClick={onOpenSettings} 
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors border border-slate-200"
        >
            <Key size={16} className="text-slate-600" />
            <span className="text-xs font-bold text-slate-600">API Key 설정</span>
        </button>
      </div>
      
      <div className="bg-slate-50 p-6 rounded-3xl mb-8 flex items-center gap-5 border border-slate-100">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold shadow-sm">
          {user.nickname[0]}
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">{user.nickname}</h3>
          <p className="text-sm text-slate-500 mt-0.5">Lv. 3 성장하는 나무</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
          <div>
            <h4 className="font-bold text-slate-800">공개 모드 설정</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              {user.isPublic 
                ? "학습 현황과 목표를 친구들에게 공유합니다." 
                : "활동을 비공개로 전환하고 익명으로 활동합니다."}
            </p>
          </div>
          <button 
            onClick={toggleMode}
            className={`w-14 h-8 rounded-full transition-colors relative ${user.isPublic ? 'bg-indigo-500' : 'bg-slate-200'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-all duration-300 ${user.isPublic ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-6 rounded-3xl text-center border border-indigo-100">
                <span className="block text-3xl font-black text-indigo-600 mb-1">{user.points}</span>
                <span className="text-xs font-bold text-indigo-400">보유 포인트</span>
            </div>
            <div className="bg-green-50 p-6 rounded-3xl text-center border border-green-100">
                <span className="block text-3xl font-black text-green-600 mb-1">{user.streak}일</span>
                <span className="text-xs font-bold text-green-400">연속 달성</span>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Shell ---

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyVersion, setApiKeyVersion] = useState(0); // Increments to reload AI data

  useEffect(() => {
    // Check API Key on boot
    const savedKey = GeminiService.loadSavedKey();
    if (savedKey) {
        GeminiService.initializeAI(savedKey);
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = (nickname: string) => {
    setUser({
      nickname,
      isPublic: true,
      points: 0,
      streak: 0,
      stamps: [false, false, false, false, false, false, false]
    });
    // Prompt for API key if not present after onboarding
    if (!GeminiService.hasApiKey()) {
        setShowApiKeyModal(true);
    }
  };

  const handleKeySaved = () => {
    setApiKeyVersion(prev => prev + 1);
  };

  return (
    <Router>
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden relative font-sans text-slate-800">
        <ApiKeyModal 
            isOpen={showApiKeyModal} 
            onClose={() => setShowApiKeyModal(false)}
            onSuccess={handleKeySaved} 
        />
        
        <AnimatePresence mode="wait">
          {showSplash && <Splash key="splash" />}
        </AnimatePresence>

        {!showSplash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen"
          >
            {!user ? (
              <Onboarding onComplete={handleOnboardingComplete} />
            ) : (
              <>
                <Routes>
                  <Route path="/" element={<Dashboard user={user} setUser={setUser} onOpenSettings={() => setShowApiKeyModal(true)} keyVersion={apiKeyVersion} />} />
                  <Route path="/group" element={<StudyGroup user={user} />} />
                  <Route path="/community" element={<Community user={user} />} />
                  <Route path="/profile" element={<Profile user={user} setUser={setUser} onOpenSettings={() => setShowApiKeyModal(true)} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                <BottomNav />
              </>
            )}
          </motion.div>
        )}
      </div>
    </Router>
  );
};

export default App;