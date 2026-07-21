"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";

type AttendanceRow = {
  id: string;
  checked_in_at: string;
  members: { name: string } | null;
};

export default function LiveSessionPanel({
  sessionId,
}: {
  sessionId: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function refreshQr() {
      const res = await fetch(`/api/sessions/${sessionId}/token`);
      if (!res.ok) return;
      const { token } = await res.json();
      const url = `${window.location.origin}/checkin/${sessionId}?t=${token}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 1 });
      if (!cancelled) setQrDataUrl(dataUrl);
    }

    async function refreshAttendance() {
      const supabase = createClient();
      const { data } = await supabase
        .from("attendance")
        .select("id, checked_in_at, members(name)")
        .eq("session_id", sessionId)
        .order("checked_in_at", { ascending: false })
        .returns<AttendanceRow[]>();
      if (!cancelled) setAttendance(data ?? []);
    }

    refreshQr();
    refreshAttendance();
    const qrInterval = setInterval(refreshQr, 30_000);
    const attendanceInterval = setInterval(refreshAttendance, 5_000);

    return () => {
      cancelled = true;
      clearInterval(qrInterval);
      clearInterval(attendanceInterval);
    };
  }, [sessionId]);

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="flex flex-col items-center rounded-lg border border-black/10 dark:border-white/10 p-6">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="签到二维码" className="h-80 w-80" />
        ) : (
          <div className="flex h-80 w-80 items-center justify-center text-sm text-zinc-500">
            生成中...
          </div>
        )}
        <p className="mt-3 text-xs text-zinc-500">二维码每 30 秒自动刷新</p>
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <h2 className="mb-3 text-sm font-medium">
          已签到 {attendance.length} 人
        </h2>
        <ul className="max-h-96 divide-y divide-black/10 dark:divide-white/10 overflow-y-auto">
          {attendance.map((row) => (
            <li key={row.id} className="flex justify-between py-2 text-sm">
              <span>{row.members?.name ?? "未知"}</span>
              <span className="text-zinc-500">
                {new Date(row.checked_in_at).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
