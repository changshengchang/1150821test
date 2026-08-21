import { useState, useRef, useEffect } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { questions } from "./constants";
import { cn } from "./lib/utils";
import { submitSurvey } from "./firebase";
import AdminDashboard from "./AdminDashboard";

export default function App() {
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminView(window.location.hash === "#admin");
    };
    handleHashChange(); // initial check
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [signatureError, setSignatureError] = useState("");
  const signatureRef = useRef<SignatureCanvas>(null);
  const topRef = useRef<HTMLDivElement>(null);
  
  const [department, setDepartment] = useState("");
  const [name, setName] = useState("");
  const [isDepartmentMissing, setIsDepartmentMissing] = useState(false);
  const [isNameMissing, setIsNameMissing] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const [missingQuestions, setMissingQuestions] = useState<number[]>([]);

  const handleSubmit = async () => {
    let hasError = false;

    // Check personal info
    if (!department.trim()) {
      setIsDepartmentMissing(true);
      hasError = true;
    } else {
      setIsDepartmentMissing(false);
    }

    if (!name.trim()) {
      setIsNameMissing(true);
      hasError = true;
    } else {
      setIsNameMissing(false);
    }

    // Check validation
    const missing = questions.filter(q => !answers[q.id]).map(q => q.id);
    if (missing.length > 0) {
      setMissingQuestions(missing);
      hasError = true;
    } else {
      setMissingQuestions([]);
    }

    if (signatureRef.current?.isEmpty()) {
      setSignatureError("此為必填問題");
      hasError = true;
    }

    if (hasError) {
      // Scroll to the top to show which ones are missing (simple UX fix)
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    
    // Calculate score
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);

    // Get signature base64
    const signatureData = signatureRef.current?.getTrimmedCanvas().toDataURL("image/png");

    await submitSurvey({
      department: department.trim(),
      name: name.trim(),
      answers,
      score: finalScore,
      signatureData
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
    setSignatureError("");
  };

  if (isAdminView) {
    return <AdminDashboard />;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F0EBF8] flex py-12 px-4 font-sans text-neutral-800">
        <div className="w-full max-w-[640px] mx-auto space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="h-2 bg-[rgb(103,58,183)] w-full" />
            <div className="p-8">
              <h1 className="text-3xl font-normal mb-4">三義鄉公所 115 年度職場霸凌防治教育訓練</h1>
              <p className="text-sm font-medium mb-4 text-neutral-700">測驗完成！您獲得了 {score} 分。</p>
              <p className="text-sm text-neutral-600 mb-6">我們已經收到您回覆的表單與簽名。</p>
              <p className="text-sm text-[rgb(103,58,183)] font-medium">讓光透進來，守護公務職場尊嚴 — 職場霸凌零容忍！</p>
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setAnswers({});
                    setScore(null);
                    setMissingQuestions([]);
                    setDepartment("");
                    setName("");
                  }}
                  className="text-[13px] text-blue-600 hover:underline"
                >
                  提交其他回覆
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="min-h-screen bg-[#F0EBF8] flex py-8 px-4 sm:px-6 font-sans text-neutral-800">
      <div className="w-full max-w-[640px] mx-auto space-y-3">
        
        {/* Title Card */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[8px] bg-[rgb(103,58,183)]"></div>
          <div className="px-6 py-6 pt-8">
            <h1 className="text-[32px] leading-10 font-normal text-neutral-900 mb-2">三義鄉公所 115 年度職場霸凌防治教育訓練</h1>
            <div className="text-[14px] text-neutral-800 space-y-4 mt-4">
              <p>讓光透進來，守護公務職場尊嚴 — 職場霸凌零容忍！</p>
              <p>為建立友善、安全之公務職場，本宣導問卷旨在協助同仁了解：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>認識職場霸凌的四大要素</li>
                <li>了解申訴的有效期限與多元管道</li>
                <li>明白本所對職場霸凌「零報復」的承諾</li>
              </ul>
            </div>
            
            <div className="text-red-600 text-[13px] pt-4 mt-4 border-t border-neutral-100 flex items-center">
              * 表示必填問題
            </div>
          </div>
        </div>

        {/* Identity Info Card 1: Department */}
        <div className={cn(
          "bg-white rounded-lg shadow-sm border px-6 py-6 transition-colors",
          isDepartmentMissing ? "border-red-500" : "border-transparent border-t-neutral-100"
        )}>
          <div className="mb-4 text-[15px] text-neutral-900 flex">
            <span className="font-normal">單位</span>
            <span className="text-red-500 ml-1 mt-0.5">*</span>
          </div>
          <input
            type="text"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setIsDepartmentMissing(false);
            }}
            placeholder="您的回答"
            className="w-full sm:w-1/2 min-w-[200px] border-b border-neutral-300 focus:border-[rgb(103,58,183)] outline-none py-1 text-[14px] transition-colors bg-transparent"
          />
          {isDepartmentMissing && (
            <div className="text-red-600 text-[13px] mt-4 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4"/>
              <span>這個問題是必填問題</span>
            </div>
          )}
        </div>

        {/* Identity Info Card 2: Name */}
        <div className={cn(
          "bg-white rounded-lg shadow-sm border px-6 py-6 transition-colors",
          isNameMissing ? "border-red-500" : "border-transparent border-t-neutral-100"
        )}>
          <div className="mb-4 text-[15px] text-neutral-900 flex">
            <span className="font-normal">姓名</span>
            <span className="text-red-500 ml-1 mt-0.5">*</span>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setIsNameMissing(false);
            }}
            placeholder="您的回答"
            className="w-full sm:w-1/2 min-w-[200px] border-b border-neutral-300 focus:border-[rgb(103,58,183)] outline-none py-1 text-[14px] transition-colors bg-transparent"
          />
          {isNameMissing && (
            <div className="text-red-600 text-[13px] mt-4 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4"/>
              <span>這個問題是必填問題</span>
            </div>
          )}
        </div>

        {/* Question Cards */}
        {questions.map((q, index) => {
          const isMissing = missingQuestions.includes(q.id);
          
          return (
            <div 
              key={q.id} 
              className={cn(
                "bg-white rounded-lg shadow-sm border px-6 py-6 transition-colors",
                isMissing ? "border-red-500" : "border-transparent border-t-neutral-100"
              )}
            >
              <div className="mb-4 text-[15px] text-neutral-900 flex">
                <span className="font-normal">{index + 1}. {q.text}</span>
                <span className="text-red-500 ml-1 mt-0.5">*</span>
              </div>
              
              <div className="space-y-[16px] mt-4">
                {q.options.map((option) => {
                  const isSelected = answers[q.id] === option.value;
                  return (
                    <label
                      key={option.value}
                      className="flex items-start group cursor-pointer"
                    >
                      <div className="relative flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0 mt-0.5">
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={option.value}
                          checked={isSelected}
                          onChange={() => handleAnswer(q.id, option.value)}
                          className="peer sr-only"
                        />
                        <div className={cn(
                          "w-[20px] h-[20px] rounded-full border-[2px] transition-colors",
                          isSelected ? "border-[rgb(103,58,183)]" : "border-neutral-400 group-hover:border-neutral-500"
                        )}></div>
                        {isSelected && (
                          <div className="absolute w-[10px] h-[10px] bg-[rgb(103,58,183)] rounded-full"></div>
                        )}
                      </div>
                      <span className="text-[14px] text-neutral-800 leading-relaxed font-normal">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {isMissing && (
                <div className="text-red-600 text-[13px] mt-4 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4"/>
                  <span>這個問題是必填問題</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Signature Card */}
        <div className={cn(
          "bg-white rounded-lg shadow-sm border px-6 py-6 transition-colors",
          signatureError ? "border-red-500" : "border-transparent border-t-neutral-100"
        )}>
          <div className="mb-4 text-[15px] font-normal text-neutral-900 flex flex-col">
            <div className="flex">
              <span>確認與簽名</span>
              <span className="text-red-500 ml-1 mt-0.5">*</span>
            </div>
            <span className="text-[13px] font-normal text-neutral-600 mt-2 leading-relaxed">
              本人已詳細閱讀「三義鄉公所 115 年度職場霸凌防治教育訓練」相關內容，並充分了解申訴管道與自身權益。請在下方正楷簽名：
            </span>
          </div>

          <div className="mt-4 border border-neutral-300 rounded overflow-hidden bg-neutral-50 relative">
            <SignatureCanvas 
              ref={signatureRef}
              penColor="black"
              canvasProps={{
                className: "w-full h-40 cursor-crosshair block",
              }}
              onBegin={() => setSignatureError("")}
            />
            <button 
              onClick={handleClearSignature}
              className="absolute top-2 right-2 text-xs bg-white border border-neutral-200 px-2 py-1 rounded shadow-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100"
            >
              清除重簽
            </button>
          </div>
          
          {signatureError && (
            <div className="text-red-600 text-[13px] mt-4 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4"/>
              <span>這個問題是必填問題</span>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2 pb-8 flex items-center justify-between">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[rgb(103,58,183)] hover:bg-[rgb(88,49,158)] disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium text-[14px] py-2 px-6 rounded transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                提交中...
              </>
            ) : "提交"}
          </button>
          <button className="text-[rgb(103,58,183)] hover:bg-purple-50 font-medium py-2 px-4 rounded transition-colors text-[14px]"
            onClick={() => setShowConfirmClear(true)}
          >
            清除表單
          </button>
        </div>

      </div>

      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">清除表單</h3>
            <p className="text-sm text-neutral-600 mb-6">確定要清除表單上的所有內容嗎？</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  setAnswers({});
                  setMissingQuestions([]);
                  setDepartment("");
                  setName("");
                  handleClearSignature();
                  setShowConfirmClear(false);
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded"
              >
                確定清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
