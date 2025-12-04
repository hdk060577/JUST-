import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, CheckCircle, AlertCircle, Loader2, Save, X, Eye, EyeOff, Trash2 } from 'lucide-react';
import * as GeminiService from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [inputKey, setInputKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load existing key
      const current = GeminiService.loadSavedKey();
      if (current) setInputKey(current);
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!inputKey.trim()) return;

    setStatus('testing');
    setErrorMsg('');

    const isValid = await GeminiService.testConnection(inputKey);

    if (isValid) {
      GeminiService.saveApiKey(inputKey);
      setStatus('success');
      setTimeout(() => {
        onSuccess();
        onClose();
        setStatus('idle');
      }, 1000);
    } else {
      setStatus('error');
      setErrorMsg('연결 실패: 유효하지 않은 API 키입니다.');
    }
  };

  const handleDelete = () => {
    if (window.confirm('정말 API 키를 삭제하시겠습니까?')) {
        GeminiService.clearApiKey();
        setInputKey('');
        onSuccess(); // Trigger refresh to clear data
        onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          >
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                <Key size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">API 키 설정</h2>
              <p className="text-xs text-slate-500 text-center mt-1 leading-relaxed">
                Google Gemini API 키를 입력해주세요.<br/>
                키는 로컬 스토리지에 암호화되어 안전하게 저장됩니다.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="API Key 입력 (AI Studio)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                />
                <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-50 p-2 rounded-lg">
                  <AlertCircle size={14} />
                  {errorMsg}
                </div>
              )}

              {status === 'success' && (
                <div className="flex items-center gap-2 text-green-600 text-xs font-medium bg-green-50 p-2 rounded-lg justify-center">
                  <CheckCircle size={14} />
                  연결 성공! 저장되었습니다.
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={status === 'testing' || !inputKey}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  status === 'testing' 
                    ? 'bg-slate-100 text-slate-400 cursor-wait'
                    : status === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                }`}
              >
                {status === 'testing' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    연결 테스트 중...
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle size={16} />
                    저장 완료
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    저장 및 테스트
                  </>
                )}
              </button>

              {GeminiService.hasApiKey() && (
                  <button 
                    onClick={handleDelete}
                    className="w-full py-2 text-xs font-medium text-red-400 hover:text-red-600 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} />
                    저장된 키 삭제하기
                  </button>
              )}
              
              <div className="text-[10px] text-slate-400 text-center leading-tight pt-2 border-t border-slate-50">
                * 키가 없으신가요? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 underline font-bold">Google AI Studio</a>에서 발급받으세요.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApiKeyModal;