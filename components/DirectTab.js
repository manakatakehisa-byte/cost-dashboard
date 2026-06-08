import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fmt, diffColor, groupAndSum, getMonths, getYears } from '../lib/utils'

const SUM_FIELDS = ['totalQty','inspFee','packCost','base','diff','diffInspector','inspVsBase','packVsBase','inspPackTotal','inspPackDiff']

export default function DirectTab({ data }) {
  const [period, setPeriod] = useState('month')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [groupBy, setGroupBy] = useState('factory')

  const months = useMemo(() => getMonths(data), [data])
  const years  = useMemo(() => getYears(data), [data])
  const periods = period === 'month' ? months : years

  const filtered = useMemo(() => {
    if (selectedPeriod === 'all') return data
    const key = period === 'month' ? 'yearMonth' : 'year'
    return data.filter(d => d[key] === selectedPeriod)
  }, [data, selectedPeriod, period])

  const groupKey = groupBy === 'both'
    ? ['factory', 'inspector']
    : groupBy === 'factory' ? 'factory' : 'inspector'

  const rows = useMemo(() => {
    const grouped = groupAndSum(filtered, groupKey, SUM_FIELDS)
    return grouped.map(r => ({
      ...r,
      perPcsInsp: r.totalQty > 0 ? Math.round((r.inspFee / r.totalQty) * 100) / 100 : 0,
      perPcsPack: r.totalQty > 0 ? Math.round((r.packCost / r.totalQty) * 100) / 100 : 0,
      label: Array.isArray(groupKey)
        ? `${r.factory} / ${r.inspector}`
        : r[groupKey] || '不明',
    })).sort((a, b) => b.inspFee - a.inspFee)
  }, [filtered, groupKey])

  const trendData = useMemo(() => {
    const key = period === 'month' ? 'yearMonth' : 'year'
    const map = {}
    for (const d of data) {
      const k = d[key]
      if (!k) continue
      if (!map[k]) map[k] = { period: k, inspFee: 0, packCost: 0, base: 0 }
      map[k].inspFee  += d.inspFee
      map[k].packCost += d.packCost
      map[k].base     += d.base
    }
    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period))
  }, [data, period])

  const handlePeriodTypeChange = (p) => {
    setPeriod(p)
    setSelectedPeriod('all')
  }

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <label className="text-sm font-medium text-slate-600">期間：</label>
          {['month','year'].map(p => (
            <button key={p}
              onClick={() => handlePeriodTypeChange(p)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${period === p ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >{p === 'month' ? '月別' : '年別'}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-3 py-1 rounded-full text-sm transition ${selectedPeriod === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >全期間</button>
          {periods.map(p => (
            <button key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1 rounded-full text-sm transition ${selectedPeriod === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >{p}</button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <label className="text-sm font-medium text-slate-600">グループ：</label>
          {[['factory','工場'],['inspector','検品会社'],['both','工場＋会社']].map(([v,l]) => (
            <button key={v}
              onClick={() => setGroupBy(v)}
              className={`px-3 py-1 rounded-full text-sm transition ${groupBy === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* トレンドグラフ */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-base font-bold text-slate-700 mb-4">
          {period === 'month' ? '月別' : '年別'}コスト推移（検品費 / 梱包費 / BASE）
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={trendData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `${(v/10000).toFixed(0)}万`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `¥${fmt(v)}`} />
            <Legend />
            <Bar dataKey="base" name="BASE" fill="#94a3b8" radius={[3,3,0,0]} />
            <Bar dataKey="inspFee" name="検品会社費" fill="#3b82f6" radius={[3,3,0,0]} />
            <Bar dataKey="packCost" name="梱包費" fill="#f59e0b" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 明細テーブル */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-700">
            {groupBy === 'factory' ? '工場別' : groupBy === 'inspector' ? '検品会社別' : '工場＋検品会社別'}　直入庫コスト明細
            <span className="text-sm font-normal text-slate-400 ml-2">
              {selectedPeriod === 'all' ? '全期間' : selectedPeriod}
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs">
                <th className="px-3 py-3 text-left sticky left-0 bg-slate-50 min-w-[140px]">工場 / 検品会社</th>
                <th className="px-3 py-3 text-right">検品数</th>
                <th className="px-3 py-3 text-right">検品会社費</th>
                <th className="px-3 py-3 text-right">梱包費</th>
                <th className="px-3 py-3 text-right bg-blue-50">検品+梱包 合計</th>
                <th className="px-3 py-3 text-right">BASE</th>
                <th className="px-3 py-3 text-right bg-amber-50">検品費 vs BASE</th>
                <th className="px-3 py-3 text-right bg-orange-50">梱包費 vs BASE</th>
                <th className="px-3 py-3 text-right bg-rose-50">合計 vs BASE</th>
                <th className="px-3 py-3 text-right bg-green-50">検品1pcs</th>
                <th className="px-3 py-3 text-right bg-green-50">梱包1pcs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr><td colSpan={11} className="text-center py-8 text-slate-400">データがありません</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-3 py-3 font-medium text-slate-800 sticky left-0 bg-white">{r.label}</td>
                  <td className="px-3 py-3 text-right text-slate-600">{fmt(r.totalQty)}</td>
                  <td className="px-3 py-3 text-right text-slate-700">¥{fmt(r.inspFee)}</td>
                  <td className="px-3 py-3 text-right text-slate-700">¥{fmt(r.packCost)}</td>
                  <td className="px-3 py-3 text-right bg-blue-50 font-semibold text-blue-800">¥{fmt(r.inspPackTotal)}</td>
                  <td className="px-3 py-3 text-right text-slate-700">¥{fmt(r.base)}</td>
                  <td className={`px-3 py-3 text-right bg-amber-50 ${diffColor(r.inspVsBase)}`}>
                    {r.inspVsBase >= 0 ? '+' : ''}¥{fmt(r.inspVsBase)}
                  </td>
                  <td className={`px-3 py-3 text-right bg-orange-50 ${diffColor(r.packVsBase)}`}>
                    {r.packVsBase >= 0 ? '+' : ''}¥{fmt(r.packVsBase)}
                  </td>
                  <td className={`px-3 py-3 text-right bg-rose-50 ${diffColor(r.inspPackDiff)}`}>
                    {r.inspPackDiff >= 0 ? '+' : ''}¥{fmt(r.inspPackDiff)}
                  </td>
                  <td className="px-3 py-3 text-right bg-green-50 text-emerald-700 font-semibold">¥{fmt(r.perPcsInsp, 2)}</td>
                  <td className="px-3 py-3 text-right bg-green-50 text-emerald-700 font-semibold">¥{fmt(r.perPcsPack, 2)}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-800 text-sm">
                  <td className="px-3 py-3 sticky left-0 bg-slate-100">合計</td>
                  <td className="px-3 py-3 text-right">{fmt(rows.reduce((s,r)=>s+r.totalQty,0))}</td>
                  <td className="px-3 py-3 text-right">¥{fmt(rows.reduce((s,r)=>s+r.inspFee,0))}</td>
                  <td className="px-3 py-3 text-right">¥{fmt(rows.reduce((s,r)=>s+r.packCost,0))}</td>
                  <td className="px-3 py-3 text-right bg-blue-100">¥{fmt(rows.reduce((s,r)=>s+r.inspPackTotal,0))}</td>
                  <td className="px-3 py-3 text-right">¥{fmt(rows.reduce((s,r)=>s+r.base,0))}</td>
                  <td className={`px-3 py-3 text-right bg-amber-100 ${diffColor(rows.reduce((s,r)=>s+r.inspVsBase,0))}`}>
                    {rows.reduce((s,r)=>s+r.inspVsBase,0) >= 0 ? '+' : ''}¥{fmt(rows.reduce((s,r)=>s+r.inspVsBase,0))}
                  </td>
                  <td className={`px-3 py-3 text-right bg-orange-100 ${diffColor(rows.reduce((s,r)=>s+r.packVsBase,0))}`}>
                    {rows.reduce((s,r)=>s+r.packVsBase,0) >= 0 ? '+' : ''}¥{fmt(rows.reduce((s,r)=>s+r.packVsBase,0))}
                  </td>
                  <td className={`px-3 py-3 text-right bg-rose-100 ${diffColor(rows.reduce((s,r)=>s+r.inspPackDiff,0))}`}>
                    {rows.reduce((s,r)=>s+r.inspPackDiff,0) >= 0 ? '+' : ''}¥{fmt(rows.reduce((s,r)=>s+r.inspPackDiff,0))}
                  </td>
                  <td className="px-3 py-3 text-right bg-green-100">
                    {(() => {
                      const tQ = rows.reduce((s,r)=>s+r.totalQty,0)
                      const tI = rows.reduce((s,r)=>s+r.inspFee,0)
                      return `¥${fmt(tQ > 0 ? tI/tQ : 0, 2)}`
                    })()}
                  </td>
                  <td className="px-3 py-3 text-right bg-green-100">
                    {(() => {
                      const tQ = rows.reduce((s,r)=>s+r.totalQty,0)
                      const tP = rows.reduce((s,r)=>s+r.packCost,0)
                      return `¥${fmt(tQ > 0 ? tP/tQ : 0, 2)}`
                    })()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
