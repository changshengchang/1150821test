import { useState, useEffect } from "react";
import { getSurveyResponses, deleteSurveyResponse } from "./firebase";
import { Loader2, Trash2, Download, Lock, Eye, EyeOff, ShieldCheck, RefreshCw, ArrowLeft, LogOut } from "lucide-react";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("admin_auth") === "true";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [responses, setResponses] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<{ name: string; img: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchResponses();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "nick620504") {
      sessionStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      setErrorMsg("");
      setPassword("");
    } else {
      setErrorMsg("管理密碼錯誤，請確認後重新輸入");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
    setResponses([]);
    setPassword("");
    setErrorMsg("");
  };

  const fetchResponses = async () => {
    setDataLoading(true);
    try {
      const data = await getSurveyResponses();
      // Sort by creation time descending if possible
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setResponses(data);
    } catch (e: any) {
      console.error(e);
      alert("載入失敗：無法取得資料庫資料，請檢查網路連線後重試。");
    } finally {
      setDataLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`確定要刪除「${name}」的回覆資料嗎？刪除後無法恢復。`)) {
      return;
    }
    
    setDeletingId(id);
    try {
      await deleteSurveyResponse(id);
      setResponses(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error(error);
      alert("刪除失敗，請稍後再試。");
    } finally {
      setDeletingId(null);
    }
  };

  const exportToCSV = () => {
    if (responses.length === 0) return;
    
    const headers = ["時間", "單位", "姓名", "分數"];
    const csvRows = [headers.join(",")];
    
    responses.forEach(r => {
      const date = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }) : '未知';
      const safeDept = `"${(r.department || "").replace(/"/g, '""')}"`;
      const safeName = `"${(r.name || "").replace(/"/g, '""')}"`;
      
      csvRows.push(`${date},${safeDept},${safeName},${r.score}`);
    });
    
    const BOM = "\uFEFF";
    const csvContent = BOM + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "職場霸凌防治教育訓練問卷結果.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Login view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F0EBF8] flex flex-col items-center justify-center p-4 font-sans text-neutral-800">
        <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-8 w-full max-w-md">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-purple-100 text-[rgb(103,58,183)] rounded-full flex items-center justify-center mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">管理者登入</h1>
            <p className="text-sm text-neutral-500 mt-1">請輸入後台管理密碼以存取同仁填答紀錄</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                管理密碼
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="請輸入管理密碼"
                  className="w-full px-4 py-2.5 pr-11 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[rgb(103,58,183)] focus:border-transparent outline-none text-sm transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errorMsg && (
                <p className="text-red-500 text-xs mt-2 font-medium">{errorMsg}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[rgb(103,58,183)] hover:bg-[rgb(88,49,158)] text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm text-sm"
            >
              進入後台
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
            <button
              onClick={() => window.location.hash = ""}
              className="text-xs text-neutral-500 hover:text-[rgb(103,58,183)] inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              返回問卷填寫頁面
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-[#F0EBF8] p-4 sm:p-8 font-sans text-neutral-800">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-neutral-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900">問卷結果管理</h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                已驗證
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              共收到 <span className="font-semibold text-neutral-800">{responses.length}</span> 份回覆
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportToCSV}
              disabled={responses.length === 0 || dataLoading}
              className="flex items-center gap-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              匯出 CSV
            </button>
            <button
              onClick={fetchResponses}
              disabled={dataLoading}
              className="flex items-center gap-1.5 text-sm font-medium text-[rgb(103,58,183)] hover:bg-purple-50 px-3.5 py-2 border border-[rgb(103,58,183)] rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
              重新整理
            </button>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1 text-sm border border-neutral-300 hover:bg-neutral-50 px-3.5 py-2 rounded-lg text-neutral-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              登出
            </button>
            <button 
              onClick={() => window.location.hash = ""} 
              className="text-sm text-neutral-500 hover:text-neutral-800 underline px-2 py-2"
            >
              返回問卷
            </button>
          </div>
        </div>

        {/* Data List Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {dataLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-neutral-500">
              <Loader2 className="w-8 h-8 animate-spin text-[rgb(103,58,183)]" />
              <p className="text-sm">正在載入問卷資料...</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-24 text-neutral-500">
              <p className="text-base font-medium">目前尚無任何問卷回覆</p>
              <p className="text-xs text-neutral-400 mt-1">同仁提交問卷後將會即時顯示於此列表</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold text-neutral-600 uppercase tracking-wider">時間</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-neutral-600 uppercase tracking-wider">單位</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-neutral-600 uppercase tracking-wider">姓名</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-neutral-600 uppercase tracking-wider">測驗分數</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-neutral-600 uppercase tracking-wider w-36">手寫簽名</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-neutral-600 uppercase tracking-wider w-20 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {responses.map((r) => (
                    <tr key={r.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-neutral-600 whitespace-nowrap">
                        {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString('zh-TW', {
                          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                        }) : '剛才'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">{r.department}</td>
                      <td className="px-6 py-4 text-sm text-neutral-800 font-medium">{r.name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          r.score === 100 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.score} 分
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.signatureData ? (
                          <button
                            onClick={() => setSelectedSignature({ name: r.name, img: r.signatureData })}
                            className="group block"
                            title="點擊放大檢視簽名"
                          >
                            <img 
                              src={r.signatureData} 
                              alt="簽名" 
                              className="h-10 w-28 border border-neutral-200 rounded object-contain bg-white group-hover:border-[rgb(103,58,183)] transition-all shadow-xs" 
                            />
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-400">無簽名</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          disabled={deletingId === r.id}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="刪除紀錄"
                        >
                          {deletingId === r.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Signature Preview Modal */}
      {selectedSignature && (
        <div 
          onClick={() => setSelectedSignature(null)}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-neutral-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="font-semibold text-neutral-900">
                {selectedSignature.name} 的手寫簽名
              </h3>
              <button 
                onClick={() => setSelectedSignature(null)}
                className="text-neutral-400 hover:text-neutral-600 text-sm font-medium p-1"
              >
                ✕
              </button>
            </div>
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 flex items-center justify-center">
              <img 
                src={selectedSignature.img} 
                alt="放大簽名" 
                className="max-h-64 object-contain"
              />
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedSignature(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
