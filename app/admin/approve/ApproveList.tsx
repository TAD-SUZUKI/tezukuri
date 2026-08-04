"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  status: string;
}

interface ApproveListProps {
  initialEvents: Event[];
}

export default function ApproveList({ initialEvents }: ApproveListProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    location: string;
    date: string;
    startTime: string;
    endTime: string;
  }>({
    title: "",
    description: "",
    location: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  const handleStartEdit = (event: Event) => {
    setEditingId(event.id);
    const dateObj = new Date(event.date);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    
    setEditForm({
      title: event.title,
      description: event.description || "",
      location: event.location,
      date: `${yyyy}-${mm}-${dd}`,
      startTime: event.startTime || "",
      endTime: event.endTime || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error("Failed to update event");

      const data = await res.json();
      
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data.event, date: new Date(data.event.date) } : e))
      );
      setEditingId(null);
      showMessage("イベント内容を更新しました", "success");
    } catch (err: any) {
      showMessage(err.message || "更新に失敗しました", "error");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (!res.ok) throw new Error("Failed to approve event");

      setEvents((prev) => prev.filter((e) => e.id !== id));
      showMessage("イベントを公開（承認）しました", "success");
      router.refresh();
    } catch (err: any) {
      showMessage(err.message || "承認に失敗しました", "error");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("このイベントを却下して削除しますか？")) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to reject event");

      setEvents((prev) => prev.filter((e) => e.id !== id));
      showMessage("イベントを却下（削除）しました", "success");
      router.refresh();
    } catch (err: any) {
      showMessage(err.message || "削除に失敗しました", "error");
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium transition-all shadow-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-500 font-medium text-lg">承認待ちのイベントはありません。</p>
          <p className="text-sm text-slate-400 mt-2">AIクローラーが収集したデータ、またはユーザーからの申請があるとここに表示されます。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {events.map((event) => {
            const isEditing = editingId === event.id;
            const formattedDate = new Date(event.date).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            });

            return (
              <div
                key={event.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300"
              >
                {isEditing ? (
                  /* 編集モードのフォーム */
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">イベント情報の編集</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">イベント名</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">開催場所</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">開催日</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">開始時間</label>
                        <input
                          type="text"
                          placeholder="例: 10:00"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                          value={editForm.startTime}
                          onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">終了時間</label>
                        <input
                          type="text"
                          placeholder="例: 16:00"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                          value={editForm.endTime}
                          onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">説明文 / 詳細情報</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => handleSaveEdit(event.id)}
                        className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm"
                      >
                        変更を保存
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 表示モード */
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          承認待ち
                        </span>
                        <span className="text-xs text-slate-400">ID: {event.id}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-800">{event.title}</h3>
                      
                      <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">📅 日時:</span>
                          <span>{formattedDate}</span>
                          {(event.startTime || event.endTime) && (
                            <span className="font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-xs text-indigo-600">
                              {event.startTime || "??:??"} 〜 {event.endTime || "??:??"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">📍 場所:</span>
                          <span>{event.location}</span>
                        </div>
                      </div>

                      {event.description && (
                        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 text-sm text-slate-600 whitespace-pre-wrap mt-2">
                          {event.description}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 min-w-[120px] justify-end border-t md:border-t-0 pt-4 md:pt-0">
                      <button
                        onClick={() => handleApprove(event.id)}
                        className="flex-1 md:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
                      >
                        承認（公開）
                      </button>
                      <button
                        onClick={() => handleStartEdit(event)}
                        className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleReject(event.id)}
                        className="flex-1 md:flex-initial px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-sm border border-rose-200 transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
                      >
                        却下（削除）
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
