import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fmt, diffColor, groupAndSum, getMonths, getYears } from '../lib/utils'

const SUM_FIELDS = ['totalQty','inspCost','base','sampling','other','othersTotal','inspPlusOthers','baseVsDiff']

export default function InspectionTab({ data }) {
  const [period, setPeriod] = useState('month')   // 'month' | 'year'
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [groupBy, setGroupBy] = useState('factory') // 'factory' | 'inspector' | 'both'

  const months = useMemo(() => getMonths(data), [data])
  const years  = useMemo(() => getYears(data), [data])
  const periods = period === 'month' ? months : years

  // フィルタリング
  const filtered = useMemo(() => {
    if (selectedPeriod === 'all') return data
    const key = period === 'month' ? 'yearMonth' : 'year'
    return data.filter(d => d[key] === selectedPeriod)
  }, [data, selectedPeriod, period])

  // グループ化
  const groupKey = groupBy === 'both'
    ? ['factory', 'inspector']
    : groupBy === 'factory' ? 'factory' : 'inspector'

  const rows = useMemo(() => {
    const grouped = groupAndSum(filtered, groupKey, SUM_FIELDS)
    return grouped.map(r => ({
      ...r,
      perPcs: r.totalQty > 0 ? Math.round((r.inspCost / r.totalQty) * 100) / 100 : 0,
      label: Array.isArray(groupKey)
        ? `${r.factory} / ${r.inspector}`
        : r[groupKey] || '不明',
    })).sort((a, b) => b.inspCost - a.inspCost)
  }, [filtered, groupKey])

  // グラフ用：月別 / 年別の推移（全体）
  const trendData = useMemo(() => {
    const key = period === 'month' ? 'yearMonth' : 'year'
    const map = {}
    for (const d of data) {
      const k = d[key]
      if (!k) continue
      if (!map[k]) map[k] = { period: k, inspCost: 0, base: 0, inspPlusOthers: 0 }
      map[k].inspCost       += d.inspCost
      map[k].base           += d.base
      map[k].inspPlusOthers += d.inspPlusOthers
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
          {period === 'month' ? '月別' : '年別'}コスト推移
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={trendData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `${(v/10000).toFixed(0)}万`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `¥${fmt(v)}`} />
            <Legend />
            <Bar dataKey="base" name="BASE" fill="#94a3b8" radius={[3,3,0,0]} />
            <Bar dataKey="inspPlusOthers" name="検品費+抜取+その他" fill="#3b82f6" radius={[3,3,0,0]} />
            <Bar dataKey="inspCost" name="検品費のみ" fill="#6366f1" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 明細テーブル */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-700">
            {groupBy === 'factory' ? '工場別' : groupBy === 'inspector' ? '検品会社別' : '工場＋検品会社別'}　コスト明細
            <span className="text-sm font-normal text-slate-400 ml-2">
              {selectedPeriod === 'all' ? '全期間' : selectedPeriod}
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs">
                <th className="px-4 py-3 text-left sticky left-0 bg-slate-50 min-w-[140px]">
                  {groupBy === 'factory' ? '工場' : groupBy === 'inspector' ? '検品会社' : '工場 / 検品会社'}
                </th>
                <th className="px-4 py-3 text-right">検品数</th>
                <th className="px-4 py-3 text-right">検品費</th>
                <th className="px-4 py-3 text-right">抜取+その他</th>
                <th className="px-4 py-3 text-right bg-blue-50">検品費+抜取+その他</th>
                <th className="px-4 py-3 text-right">BASE</th>
                <th className="px-4 py-3 text-right bg-amber-50">BASE差額</th>
                <th className="px-4 py-3 text-right bg-green-50">1pcs平均コスト</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">データがありません</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-800 sticky left-0 bg-white">{r.label}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fmt(r.totalQty)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">¥{fmt(r.inspCost)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">¥{fmt(r.othersTotal)}</td>
                  <td className="px-4 py-3 text-right bg-blue-50 font-semibold text-blue-800">¥{fmt(r.inspPlusOthers)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">¥{fmt(r.base)}</td>
                  <td className={`px-4 py-3 text-right bg-amber-50 ${diffColor(r.baseVsDiff)}`}>
                    {r.baseVsDiff >= 0 ? '+' : ''}¥{fmt(r.baseVsDiff)}
                  </td>
                  <td className="px-4 py-3 text-right bg-green-50 text-emerald-700 font-semibold">
                    ¥{fmt(r.perPcs, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-800 text-sm">
                  <td className="px-4 py-3 sticky left-0 bg-slate-100">合計</td>
                  <td className="px-4 py-3 text-right">{fmt(rows.reduce((s,r)=>s+r.totalQty,0))}</td>
                  <td className="px-4 py-3 text-right">¥{fmt(rows.reduce((s,r)=>s+r.inspCost,0))}</td>
                  <td className="px-4 py-3 text-right">¥{fmt(rows.reduce((s,r)=>s+r.othersTotal,0))}</td>
                  <td className="px-4 py-3 text-right bg-blue-100">¥{fmt(rows.reduce((s,r)=>s+r.inspPlusOthers,0))}</td>
                  <td className="px-4 py-3 text-right">¥{fmt(rows.reduce((s,r)=>s+r.base,0))}</td>
                  <td className={`px-4 py-3 text-right bg-amber-100 ${diffColor(rows.reduce((s,r)=>s+r.baseVsDiff,0))}`}>
                    {rows.reduce((s,r)=>s+r.baseVsDiff,0) >= 0 ? '+' : ''}¥{fmt(rows.reduce((s,r)=>s+r.baseVsDiff,0))}
                  </td>
                  <td className="px-4 py-3 text-right bg-green-100">
                    {(() => {
                      const tQty = rows.reduce((s,r)=>s+r.totalQty,0)
                      const tCost = rows.reduce((s,r)=>s+r.inspCost,0)
                      return `¥${fmt(tQty > 0 ? tCost/tQty : 0, 2)}`
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
