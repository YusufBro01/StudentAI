import React, { useState, useEffect, useCallback } from 'react';
import { UserData, TestState, Step, Receipt, TestResult } from './types';
import StepWelcome from './components/StepWelcome';
import StepUniversity from './components/StepUniversity';
import StepMajor from './components/StepMajor';
import StepTest from './components/StepTest';
import StepSubjects from './components/StepSubjects';
import StepResults from './components/StepResults';
import AdminLoginModal from './components/AdminLoginModal';
import AdminDashboard from './components/AdminDashboard';
import VipModal from './components/VipModal';
import { ALL_QUESTIONS } from './constants';
import { AdminIcon } from './components/icons';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.Welcome);
  const [userData, setUserData] = useState<UserData>({ name: '', university: '', course: '', major: '' });
  const [testState, setTestState] = useState<TestState>({ subject: '', questions: [], total: 0 });
  const [finalResult, setFinalResult] = useState<TestResult | null>(null);

  const [isAdminLoginVisible, setAdminLoginVisible] = useState(false);
  const [isAdminAuthenticated, setAdminAuthenticated] = useState(false);
  const [isVipModalVisible, setVipModalVisible] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
      const bgColor = '#eef2f7';
      window.Telegram.WebApp.setHeaderColor(bgColor);
      window.Telegram.WebApp.setBackgroundColor(bgColor);
    }
  }, []);

  const goToStep = useCallback((targetStep: Step) => setStep(targetStep), []);

  const updateUserData = (data: Partial<UserData>) => setUserData((prev) => ({ ...prev, ...data }));

  const startTest = (subject: string) => {
    const questions = ALL_QUESTIONS[subject] || [{ q: `${subject} fani bo'yicha savollar tez kunda qo'shiladi!`, o: ["Tushunarli"], a: 0 }];
    setTestState({ subject, questions, total: questions.length });
    goToStep(Step.Test);
  };

  const finishTest = (finalScore: number) => {
    setFinalResult({ score: finalScore, total: testState.total });
    goToStep(Step.Results);
  };
  
  const handleRestart = () => {
      setUserData({ name: '', university: '', course: '', major: '' });
      setTestState({ subject: '', questions: [], total: 0 });
      setFinalResult(null);
      setIsVip(false);
      goToStep(Step.Welcome);
  }

  const handleAdminLogin = (password: string) => {
    if (password === 'AD4863403') {
      setAdminAuthenticated(true);
      setAdminLoginVisible(false);
    } else {
      alert('Parol noto‘g‘ri!');
    }
  };
  
  const handleReceiptUpload = (imageBase64: string) => {
      setReceipts(prev => [...prev, { user: userData, image: imageBase64 }]);
      setIsVip(true);
      setVipModalVisible(false);
      alert('Rahmat! Toʻlovingiz qabul qilindi va VIP statusi berildi.');
  }
  
  const handleHintRequest = () => {
    if (isVip) {
      // TODO: Implement actual hint logic for VIPs
      alert('VIP yordami tez kunda ishga tushadi!');
    } else {
      setVipModalVisible(true);
    }
  };

  const renderAppContent = () => {
    if (isAdminAuthenticated) {
      return <AdminDashboard receipts={receipts} onLogout={() => setAdminAuthenticated(false)} />;
    }

    switch (step) {
      case Step.Welcome: return <StepWelcome onNext={() => goToStep(Step.University)} updateUserData={updateUserData} />;
      case Step.University: return <StepUniversity onNext={() => goToStep(Step.Major)} updateUserData={updateUserData} />;
      case Step.Major: return <StepMajor onNext={() => goToStep(Step.Subjects)} updateUserData={updateUserData} />;
      case Step.Subjects: return <StepSubjects onStartTest={startTest} />;
      case Step.Test: return <StepTest subject={testState.subject} questions={testState.questions} onFinish={finishTest} onHintRequest={handleHintRequest} />;
      case Step.Results: return <StepResults result={finalResult!} onRestart={handleRestart} />;
      default: return <StepWelcome onNext={() => goToStep(Step.University)} updateUserData={updateUserData} />;
    }
  };

  return (
    <div className="bg-[#eef2f7] min-h-screen w-full flex flex-col items-center justify-center p-4 relative">
      {!isAdminAuthenticated && (
          <div className="absolute top-4 left-4 z-20">
              <button onClick={() => setAdminLoginVisible(true)} className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition">
                  <AdminIcon className="h-6 w-6 text-gray-600"/>
              </button>
          </div>
      )}
      
      {isAdminLoginVisible && <AdminLoginModal onSubmit={handleAdminLogin} onClose={() => setAdminLoginVisible(false)} />}
      
      {isVipModalVisible && <VipModal onReceiptUpload={handleReceiptUpload} onClose={() => setVipModalVisible(false)} />}

      <div className="w-full max-w-md mx-auto">
        {renderAppContent()}
      </div>
    </div>
  );
};

export default App;