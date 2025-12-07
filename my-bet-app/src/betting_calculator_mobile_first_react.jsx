import React, { useEffect, useState } from "react";

// Mobile-first betting calculator with local history (localStorage)
// Tailwind CSS assumed. Single-file component export.

export default function BettingCalculator() {
  const oddsList = [
    { label: "10/10", value: 1 },
    { label: "10/9", value: 1.11 },
    { label: "5/4", value: 1.25 },
    { label: "11/8", value: 1.37 },
    { label: "3/2", value: 1.5 },
    { label: "5/3", value: 1.66 },
    { label: "7/4", value: 1.75 },
    { label: "2/1", value: 2 },
    { label: "5/2", value: 2.5 },
    { label: "7/2", value: 3.5 }
  ];

  const [stake, setStake] = useState(1);
  const [oddIndex, setOddIndex] = useState(0);
  const [mode, setMode] = useState("ต่อ"); // "ต่อ" or "รอง"
  const [side, setSide] = useState("น้ำเงิน"); // "น้ำเงิน" or "แดง"
  const [matchName, setMatchName] = useState("");

  const [history, setHistory] = useState([]);

  // load history from localStorage (user's own network - local only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bet_history_v1");
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      console.error("load history", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("bet_history_v1", JSON.stringify(history));
    } catch (e) {
      console.error("save history", e);
    }
  }, [history]);

  const odd = oddsList[oddIndex].value;
  const oddLabel = oddsList[oddIndex].label;
  const s = Number(stake) || 0;

  const winAmount = mode === "ต่อ" ? s : + (s * odd).toFixed(2);
  const loseAmount = mode === "ต่อ" ? + (s * odd).toFixed(2) : s;

  // Place bet and save to history
  function placeBet() {
    if (!matchName.trim()) {
      alert("ใส่ชื่อคู่แข่งขัน / คู่ที่จะแทงก่อน (เช่น คู่ A vs B)");
      return;
    }
    if (s <= 0) {
      alert("ใส่เงินเดิมพันมากกว่า 0");
      return;
    }
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const item = {
      id,
      ts: new Date().toISOString(),
      match: matchName.trim(),
      side, // น้ำเงิน or แดง
      mode, // ต่อ or รอง
      oddLabel,
      odd,
      stake: s,
      winAmount,
      loseAmount,
      result: null, // 'น้ำเงิน' | 'แดง' | 'cancelled'
      net: null // numeric profit (+) or loss (-) after result
    };
    setHistory(prev => [item, ...prev]);
  }

  // mark winner for a single history item and calculate net
  function markResult(id, winner) {
    setHistory(prev => prev.map(h => {
      if (h.id !== id) return h;
      const won = h.side === winner; // bettor picked side === winner
      const net = won ? h.winAmount : -h.loseAmount;
      return { ...h, result: winner, net };
    }));
  }

  // mark winner for all items in a match
  function markMatchResult(match, winner) {
    setHistory(prev => prev.map(h => {
      if (h.match !== match) return h;
      const won = h.side === winner;
      const net = won ? h.winAmount : -h.loseAmount;
      return { ...h, result: winner, net };
    }));
  }

  function deleteEntry(id) {
    setHistory(prev => prev.filter(h => h.id !== id));
  }

  function deleteMatch(match) {
    setHistory(prev => prev.filter(h => h.match !== match));
  }

  function clearHistory() {
    if (!confirm("ลบประวัติทั้งหมด?")) return;
    setHistory([]);
  }

  // group history by match name
  const grouped = history.reduce((acc, h) => {
    acc[h.match] = acc[h.match] || [];
    acc[h.match].push(h);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 flex flex-col items-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-4 sm:p-6">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">เครื่องคิดราคาพนัน</h1>
            <p className="text-sm text-slate-500">มือถือเป็นหลัก — อินเตอร์เฟซใช้งานง่าย</p>
          </div>
        </header>

        <main className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="col-span-1 sm:col-span-2">
              <div className="text-xs text-slate-600 mb-1">คู่ / แมตช์</div>
              <input
                type="text"
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                placeholder="เช่น ทีม A vs ทีม B"
                className="w-full rounded-xl border px-3 py-2 text-lg font-medium"
              />
            </label>

            <label>
              <div className="text-xs text-slate-600 mb-1">เลือกฝ่าย</div>
              <div className="flex gap-2">
                <button onClick={() => setSide("น้ำเงิน")} className={`flex-1 py-2 rounded-xl text-lg font-semibold ${side === "น้ำเงิน" ? "bg-blue-600 text-white" : "bg-slate-100"}`}>น้ำเงิน</button>
                <button onClick={() => setSide("แดง")} className={`flex-1 py-2 rounded-xl text-lg font-semibold ${side === "แดง" ? "bg-red-600 text-white" : "bg-slate-100"}`}>แดง</button>
              </div>
            </label>

            <label className="sm:col-span-1">
              <div className="text-xs text-slate-600 mb-1">เงินเดิมพัน (บาท)</div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-lg font-medium"
              />
            </label>

            <label>
              <div className="text-xs text-slate-600 mb-1">ออดส์ (Fraction)</div>
              <select value={oddIndex} onChange={(e) => setOddIndex(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 text-lg">
                {oddsList.map((o, i) => (
                  <option key={o.label} value={i}>{o.label} =&gt; {o.value}</option>
                ))}
              </select>
            </label>

            <div>
              <div className="text-xs text-slate-600 mb-1">เลือกโหมด</div>
              <div className="flex gap-2">
                <button onClick={() => setMode("ต่อ")} className={`flex-1 py-2 rounded-xl text-lg font-semibold ${mode === "ต่อ" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>ต่อ</button>
                <button onClick={() => setMode("รอง")} className={`flex-1 py-2 rounded-xl text-lg font-semibold ${mode === "รอง" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>รอง</button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-sm text-slate-600">ออดส์ที่เลือก</div>
                <div className="font-bold text-lg">{oddLabel} =&gt; {odd}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600">เลือก</div>
                <div className="font-semibold">{mode} / {side}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="text-xs text-slate-500">ถ้าฝ่ายของคุณชนะ (Win)</div>
                <div className="text-xl font-bold mt-1">{winAmount} ฿</div>
                <div className="text-sm text-slate-500">{mode === "ต่อ" ? `ได้ = เงินเดิมพัน` : `ได้ = เงินเดิมพัน × ${odd}`}</div>
              </div>

              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="text-xs text-slate-500">ถ้าฝ่ายของคุณแพ้ (Lose)</div>
                <div className="text-xl font-bold mt-1">{loseAmount} ฿</div>
                <div className="text-sm text-slate-500">{mode === "ต่อ" ? `เสีย = เงินเดิมพัน × ${odd}` : `เสีย = เงินเดิมพัน`}</div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={placeBet} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow">เดิมพัน (บันทึก)</button>
              <button onClick={() => { setStake(1); setOddIndex(0); setMode("ต่อ"); setSide("น้ำเงิน"); setMatchName(""); }} className="py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold">รีเซ็ต</button>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">ประวัติเดิมพัน</h2>
              <div className="text-sm text-slate-500">เก็บในเครื่องคุณ (localStorage)</div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2 mb-2">
                <button onClick={clearHistory} className="py-2 px-3 rounded-lg bg-red-100 text-red-700 text-sm">ลบทั้งหมด</button>
              </div>

              {history.length === 0 && <div className="text-sm text-slate-500">ยังไม่มีประวัติ</div>}

              {Object.entries(grouped).map(([match, items]) => {
                const totalStake = items.reduce((sum, it) => sum + Number(it.stake), 0);
                const hasResult = items.every(it => it.result !== null);
                const totalNet = items.reduce((sum, it) => sum + (it.net || 0), 0);
                return (
                  <div key={match} className="p-3 bg-white rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-slate-600">{match}</div>
                        <div className="font-bold">ยอดรวม: {totalStake} ฿ · รายการ: {items.length}</div>
                        <div className="text-xs text-slate-500">ล่าสุดวาง: {new Date(items[0].ts).toLocaleString()}</div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-semibold ${hasResult ? (totalNet >= 0 ? "text-emerald-600" : "text-red-600") : "text-slate-600"}`}>{hasResult ? (totalNet >= 0 ? `รวม +${totalNet} ฿` : `รวม ${totalNet} ฿`) : "รอดำเนินการ"}</div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {items.map(h => (
                        <div key={h.id} className="p-2 border rounded-lg">
                          <div className="flex justify-between">
                            <div className="text-sm">{h.side} · {h.mode} · {h.oddLabel} · {h.stake} ฿</div>
                            <div className="text-sm">{h.result ? (h.net >= 0 ? `+${h.net} ฿` : `${h.net} ฿`) : ''}</div>
                          </div>
                          <div className="text-xs text-slate-400">วางเมื่อ: {new Date(h.ts).toLocaleString()}</div>
                          <div className="mt-2 flex gap-2">
                            <button onClick={() => markResult(h.id, "น้ำเงิน")} className="py-1 px-2 rounded-lg bg-blue-50 text-blue-700 text-xs">น้ำเงินชนะ</button>
                            <button onClick={() => markResult(h.id, "แดง")} className="py-1 px-2 rounded-lg bg-red-50 text-red-700 text-xs">แดงชนะ</button>
                            <button onClick={() => deleteEntry(h.id)} className="py-1 px-2 rounded-lg bg-slate-100 text-xs">ลบ</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button onClick={() => markMatchResult(match, "น้ำเงิน")} className="flex-1 py-2 rounded-lg bg-blue-600 text-white">ตั้งน้ำเงินชนะทั้งบิล</button>
                      <button onClick={() => markMatchResult(match, "แดง")} className="flex-1 py-2 rounded-lg bg-red-600 text-white">ตั้งแดงชนะทั้งบิล</button>
                      <button onClick={() => deleteMatch(match)} className="py-2 px-3 rounded-lg bg-slate-100">ลบทั้งบิล</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-slate-500">
              หมายเหตุ: ประวัติถูกเก็บในเครื่องของคุณ (localStorage) — เหมาะสำหรับใช้งานบนมือถือและสามารถนำไฟล์นี้ไป build เป็นเว็บสแตติกเพื่อ deploy บน GitHub Pages / Cloudflare Pages / Firebase Hosting ได้
            </div>
          </section>

        </main>

      </div>
    </div>
  );
}
