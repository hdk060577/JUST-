import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Goal, Post, Friend } from './types';
import * as GeminiService from './services/geminiService';
import Splash from './components/Splash';
import BottomNav from './components/BottomNav';
import { 
  Plus, CheckCircle, Circle, Video, MicOff, 
  Send, Heart, Lock, Globe, Trophy, ShoppingBag, MessageCircle 
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
        <h1 className="text-2xl font-bold text-gray-800 mb-2">환영합니다!</h1>
        <p className="text-gray-500 mb-6">JUST에서 사용할 닉네임을 알려주세요.</p>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="닉네임 입력"
          className="w-full border-b-2 border-indigo-200 py-2 text-center text-xl focus:outline-none focus:border-indigo-600 transition-colors mb-8"
        />
        <button 
          onClick={() => name && onComplete(name)}
          disabled={!name}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
        >
          시작하기
        </button>
      </motion.div>
    </div>
  );
};

// 2. Dashboard Page
const Dashboard: React.FC<{ user: User, setUser: React.Dispatch<React.SetStateAction<User>> }> = ({ user, setUser }) => {
  const [quote, setQuote] = useState<string>("오늘도 힘찬 하루 보내세요!");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);

  useEffect(() => {
    GeminiService.getDailyQuote().then(setQuote);
    loadAIRecommendation();
  }, []);

  const loadAIRecommendation = async () => {
    setLoadingGoals(true);
    const recGoals = await GeminiService.getRecommendedGoals();
    setGoals(prev => [...prev, ...recGoals]);
    setLoadingGoals(false);
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        const newCompleted = !g.completed;
        // Logic for stamps: if all goals completed (simple logic for demo: completing any goal triggers check)
        // In real app, check if ALL daily goals are done.
        return { ...g, completed: newCompleted };
      }
      return g;
    }));
  };

  const completedCount = goals.filter(g => g.completed).length;
  const progress = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;

  // Simulate Stamp Collection when progress is 100%
  useEffect(() => {
    if (progress === 100 && goals.length > 0 && !user.stamps[new Date().getDay()]) {
       // Just a demo logic to fill today's stamp
       const today = new Date().getDay(); // 0-6
       const newStamps = [...user.stamps];
       newStamps[today] = true;
       
       // Calculate points
       let newPoints = user.points + 50; 
       let newStreak = user.streak;
       
       // Check streak logic (simplified)
       if (newStamps.every(s => s)) {
         newPoints += 700; // Bonus
       }

       setUser(prev => ({
         ...prev,
         stamps: newStamps,
         points: newPoints
       }));
    }
  }, [progress]);

  return (
    <div className="pb-24 p-6 space-y-6">
      {/* Header / Quote */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg"
      >
        <p className="font-medium opacity-80 mb-2">오늘의 응원</p>
        <h2 className="text-xl font-bold leading-relaxed">"{quote}"</h2>
      </motion.div>

      {/* Stamp Board */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            스탬프 챌린지
          </h3>
          <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {user.points} P
          </span>
        </div>
        <div className="flex justify-between px-2">
          {user.stamps.map((active, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${active ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-200 text-gray-300'}`}>
                {active && <CheckCircle size={16} />}
              </div>
              <span className="text-xs text-gray-400">{['일','월','화','수','목','금','토'][idx]}</span>
            </div>
          ))}
        </div>
        {user.stamps.every(s => s) && (
          <div className="mt-4 text-center text-sm text-green-600 font-bold bg-green-50 py-2 rounded-lg">
            🎉 1주일 연속 달성! 700P 지급 완료
          </div>
        )}
      </div>

      {/* Today's Goals */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">오늘의 작은 목표</h3>
          <button onClick={loadAIRecommendation} className="text-xs text-indigo-600 underline">
            AI 추천 더보기
          </button>
        </div>
        
        {goals.map((goal) => (
          <motion.div 
            key={goal.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${goal.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-indigo-100 shadow-sm'}`}
            onClick={() => toggleGoal(goal.id)}
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${goal.completed ? 'bg-gray-400 border-gray-400' : 'border-indigo-500'}`}>
              {goal.completed && <CheckCircle size={14} className="text-white" />}
            </div>
            <div className="flex-1">
              <span className={`block font-medium ${goal.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {goal.text}
              </span>
              <span className="text-xs text-gray-400 uppercase">{goal.type}</span>
            </div>
          </motion.div>
        ))}

        {loadingGoals && (
          <div className="text-center py-4 text-gray-400 text-sm animate-pulse">
            AI가 맞춤 목표를 생각중입니다...
          </div>
        )}
      </div>
      
      {/* Shop Teaser */}
      <div className="bg-orange-50 p-4 rounded-xl flex items-center justify-between border border-orange-100">
        <div className="flex items-center gap-3">
          <ShoppingBag className="text-orange-500" />
          <div>
            <p className="font-bold text-gray-800 text-sm">포인트 상점</p>
            <p className="text-xs text-gray-500">모은 포인트로 기프티콘 교환하기</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-white text-orange-600 text-xs font-bold rounded-lg shadow-sm">
          가기
        </button>
      </div>
    </div>
  );
};

// 3. Study Group (Cam Study)
const StudyGroup: React.FC<{ user: User }> = ({ user }) => {
  const [videoEnabled, setVideoEnabled] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoEnabled) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Cam access denied", err));
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [videoEnabled]);

  return (
    <div className="pb-24 p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">스터디 그룹</h2>
        <div className="flex items-center gap-2">
           <span className={`w-2 h-2 rounded-full ${user.isPublic ? 'bg-green-500' : 'bg-gray-400'}`}></span>
           <span className="text-xs font-medium text-gray-600">{user.isPublic ? '공개 모드' : '비공개 모드'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* My Cam */}
        <div className="bg-gray-800 rounded-2xl aspect-video overflow-hidden relative shadow-lg">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`} 
          />
          {!videoEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <Video size={32} className="mb-2 opacity-50" />
              <span className="text-xs">카메라 꺼짐</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            나 ({user.nickname})
          </div>
          <button 
            onClick={() => setVideoEnabled(!videoEnabled)}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            {videoEnabled ? <Video size={16} /> : <Video size={16} className="text-red-400" />}
          </button>
          <div className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-full text-white">
            <MicOff size={14} />
          </div>
        </div>

        {/* Friend Cams (Mock) */}
        {MOCK_FRIENDS.map(friend => (
          <div key={friend.id} className="bg-gray-200 rounded-2xl aspect-video overflow-hidden relative shadow-sm">
             {friend.isOnline ? (
               <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500">
                 {/* Simulate video feed */}
                 <span className="text-xs animate-pulse">실시간 공부중...</span>
               </div>
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500">
                 <span className="text-xs">오프라인</span>
               </div>
             )}
             <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                {friend.nickname}
             </div>
             {friend.isOnline && (
               <div className="absolute top-2 right-2 bg-indigo-500 px-2 py-0.5 rounded text-[10px] text-white font-bold">
                 {friend.goalRate}% 달성
               </div>
             )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">친구 현황</h3>
        <div className="space-y-4">
          {MOCK_FRIENDS.map(friend => (
            <div key={friend.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {friend.nickname[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{friend.nickname}</p>
                  <p className="text-xs text-gray-500 truncate w-32">{friend.statusMessage}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-indigo-600">{Math.floor(friend.studyTime / 60)}시간 {friend.studyTime % 60}분</p>
                <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${friend.goalRate}%` }}></div>
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
  ]);
  const [isWriting, setIsWriting] = useState(false);
  const [newContent, setNewContent] = useState('');

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
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen relative">
      <div className="bg-white p-4 sticky top-0 z-30 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">함께해요</h2>
        <p className="text-xs text-gray-500">서로 응원하고 고민을 나누는 공간</p>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {posts.map(post => (
          <motion.div 
            key={post.id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${post.isAuthorPublic ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                {post.author[0]}
              </div>
              <div>
                <span className="text-sm font-bold text-gray-800">{post.author}</span>
                <span className="text-xs text-gray-400 ml-2">방금 전</span>
              </div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center gap-4 border-t border-gray-50 pt-3">
              <button className="flex items-center gap-1 text-gray-400 hover:text-pink-500 text-xs transition-colors">
                <Heart size={16} />
                <span>공감 {post.likes}</span>
              </button>
              <button className="flex items-center gap-1 text-gray-400 hover:text-indigo-500 text-xs transition-colors">
                <MessageCircle size={16} />
                <span>댓글</span>
              </button>
            </div>
          </motion.div>
        ))}
        {/* Spacer for FAB */}
        <div className="h-12"></div>
      </div>

      {/* FAB */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsWriting(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 rounded-full text-white shadow-xl flex items-center justify-center z-40 hover:bg-indigo-700"
      >
        <Plus size={28} />
      </motion.button>

      {/* Write Modal */}
      <AnimatePresence>
        {isWriting && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsWriting(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">글쓰기</h3>
              <textarea 
                className="w-full h-32 p-3 bg-gray-50 rounded-xl mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="오늘 어떤 일이 있었나요? 따뜻한 위로가 필요하신가요?"
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {user.isPublic ? <Globe size={14}/> : <Lock size={14}/>}
                  {user.isPublic ? '공개 모드 (닉네임 노출)' : '비공개 모드 (익명)'}
                </div>
                <button 
                  onClick={handlePost}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center gap-2"
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
const Profile: React.FC<{ user: User, setUser: React.Dispatch<React.SetStateAction<User>> }> = ({ user, setUser }) => {
  const toggleMode = () => {
    setUser(prev => ({ ...prev, isPublic: !prev.isPublic }));
  };

  return (
    <div className="pb-24 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">내 정보</h2>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold">
          {user.nickname[0]}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">{user.nickname}</h3>
          <p className="text-sm text-gray-500">Lv. 3 성장하는 나무</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-800">공개 모드 설정</h4>
            <p className="text-xs text-gray-400 mt-1">
              {user.isPublic 
                ? "내 학습 현황과 목표를 친구들에게 공유합니다." 
                : "나의 활동을 비공개로 전환합니다."}
            </p>
          </div>
          <button 
            onClick={toggleMode}
            className={`w-12 h-7 rounded-full transition-colors relative ${user.isPublic ? 'bg-indigo-500' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all ${user.isPublic ? 'left-6' : 'left-1'}`}></div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-xl text-center">
                <span className="block text-2xl font-bold text-indigo-600">{user.points}</span>
                <span className="text-xs text-gray-500">보유 포인트</span>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
                <span className="block text-2xl font-bold text-green-600">{user.streak}일</span>
                <span className="text-xs text-gray-500">연속 달성</span>
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

  useEffect(() => {
    // Simulate Splash Screen Duration
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2 seconds
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
  };

  return (
    <Router>
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden relative">
        <AnimatePresence>
          {showSplash && (
            <motion.div 
              key="splash"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50"
            >
              <Splash />
            </motion.div>
          )}
        </AnimatePresence>

        {!showSplash && !user ? (
          <Onboarding onComplete={handleOnboardingComplete} />
        ) : !showSplash && user ? (
          <>
            <Routes>
              <Route path="/" element={<Dashboard user={user} setUser={setUser} />} />
              <Route path="/group" element={<StudyGroup user={user} />} />
              <Route path="/community" element={<Community user={user} />} />
              <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <BottomNav />
          </>
        ) : null}
      </div>
    </Router>
  );
};

export default App;