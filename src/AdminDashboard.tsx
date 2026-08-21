import { useState, useEffect } from "react";
import { auth, loginWithGoogle, logout, getSurveyResponses, deleteSurveyResponse } from "./firebase";
import { Loader2, Trash2, Download } from "lucide-react";
import { User } from "firebase/auth";

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        fetchResponses();
      }
    });
    return () => unsubscribe();
  }, []);

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
      alert("載入失敗：權限不足或發生錯誤。請確認您使用的是具有管理員權限的 Google 帳號。");
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
      alert("刪除失敗");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EBF8] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(103,58,183)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0EBF8] flex flex-col items-center py-20 px-4 font-sans text-neutral-800">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">問卷登錄後台</h1>
          <p className="text-sm text-neutral-600 mb-8">請使用具有管理員權限的 Google 帳號登入</p>
          <button 
            onClick={loginWithGoogle} 
            className="w-full bg-[rgb(103,58,183)] hover:bg-[rgb(88,49,158)] text-white font-medium py-3 rounded transition-colors"
          >
            使用 Google 登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EBF8] p-4 sm:p-8 font-sans text-neutral-800">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <div>
            <h1 className="text-2xl font-bold">問卷結果管理</h1>
            <p className="text-sm text-neutral-600 mt-1">目前登入帳號：{user.email}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-3">
            <button
              onClick={exportToCSV}
              disabled={responses.length === 0 || dataLoading}
              className="flex items-center gap-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
            >
              <Download className="w-4 h-4" />
              匯出 CSV
            </button>
            <button
              onClick={fetchResponses}
              className="text-sm font-medium text-[rgb(103,58,183)] hover:bg-purple-50 px-4 py-2 border border-[rgb(103,58,183)] rounded transition-colors"
            >
              重新整理
            </button>
            <button 
              onClick={logout} 
              className="text-sm border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded text-neutral-700 transition-colors"
            >
              登出
            </button>
            <button 
              onClick={() => window.location.hash = ""} 
              className="text-sm text-neutral-500 hover:text-neutral-800 underline flex-shrink-0"
            >
              返回問卷
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {dataLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[rgb(103,58,183)]" />
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              目前還沒有任何問卷回覆
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-600 border-b border-neutral-200">時間</th>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-600 border-b border-neutral-200">單位</th>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-600 border-b border-neutral-200">姓名</th>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-600 border-b border-neutral-200">分數</th>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-600 border-b border-neutral-200 w-32">簽名</th>
                    <th className="px-6 py-4 text-sm font-medium text-neutral-600 border-b border-neutral-200 w-24">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {responses.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-neutral-600 whitespace-nowrap">
                        {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString('zh-TW', {
                          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                        }) : '未知'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-800 break-words">{r.department}</td>
                      <td className="px-6 py-4 text-sm text-neutral-800 break-words">{r.name}</td>
                      <td className="px-6 py-4 text-sm text-neutral-800">{r.score} 分</td>
                      <td className="px-6 py-4">
                        <img src={r.signatureData} alt="簽名" className="h-12 w-auto border border-neutral-200 rounded shrink-0 object-contain bg-white" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          disabled={deletingId === r.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                          title="刪除紀錄"
                        >
                          {deletingId === r.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
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
    </div>
  );
}
