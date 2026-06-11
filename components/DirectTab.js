import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const fmt = (n) => Math.round(n).toLocaleString('ja-JP')

function aggregate(data, groupKey) {
  const map = {}
  data.forEach(d => {
    const key = d[groupKey] + '|' + d.factory
    if (!map[key]) {
      map[key] = { period: d[groupKey], factory: d.factory, inspQty: 0, defectQty: 0, inspCost: 0, packCost: 0, diffInspPack: 0, base: 0, diffInspBase: 0 }
    }
    map[key].inspQty     += d.inspQty
    map[key].defectQty   += d.defectQty
    map[key].inspCost    += d.inspCost
    map[key].packCost    += d.packCost
    map[key].diffInspPack += d.diffInspPack
    map[key].base        += d.base
    map[key].diffInspBase += d.diffInspBase
  })
  return Object.values(map).sort((a, b) => a.period.localeCompare(b.period))
}

export default function DirectTab({ data = [] }) {
  const [viewMode, setViewMode] = useState('month')
  const [selectedFactory, setSelectedFactory] = useState('all')

  if (!data.length) return <div className="p-8 text-center text-gray-500">データがありません</div>

  const factories = ['all', ...Array.from(new Set(data.map(d => d.factory))).sort()]
  const filtered = selectedFactory === 'all' ? data : data.filter(d => d.factory === selectedFactory)
  const groupKey = viewMode === 'month' ? 'yearMonth' : 'year'
  const rows = aggregate(filtered, groupKey)

  const total = rows.reduce((acc, r) => ({
    inspQty:      acc.inspQty      + r.inspQty,
    defectQty:    acc.defectQty    + r.defectQty,
    inspCost:     acc.inspCost     + r.inspCost,
    packCost:     acc.packCost     + r.packCost,
    diffInspPack: acc.diffInspPack + r.diffInspPack,
    base:         acc.base         + r.base,
    diffInspBase: acc.diffInspBase + r.diffInspBase,
  }), { inspQty: 0, defectQty: 0, inspCost: 0, packCost: 0, diffInspPack: 0, base: 0, diffInspBase: 0 })

  const chartData = (() => {
    const map = {}
    rows.forEach(r => {
      if (!map[r.period]) map[r.period] = { period: r.period, inspCost: 0, packCost: 0, base: 0 }
      map[r.period].inspCost += r.inspCost
      map[r.period].packCost += r.packCost
      map[r.period].base     += r.base
    })
    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period))
  })()

  const diffCell = (val) => (
    <span className={val < 0 ? 'text-red-600' : 'text-green-600'}>
      {val < 0 ? '-' : '+'}{fmt(Math.abs(val))}
    </span>
  )

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button onClick={() => setViewMode('month')} className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>月別</button>
          <button onClick={() => setViewMode('year')} className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>年別</button>
        </div>
        <select value={selectedFactory} onChange={e => setSelectedFactory(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          {factories.map(f => <option key={f} value={f}>{f === 'all' ? '全工場' : f}</option>)}
        </select>
      </div>

      {/* グラフ */}
      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">コスト推移</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmt(v) + '円'} />
            <Legend />
            <Bar dataKey="inspCost" name="検品会社" fill="#3b82f6" />
            <Bar dataKey="packCost" name="梱包費" fill="#10b981" />
            <Bar dataKey="base" name="BASE" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-3 text-left">期間</th>
              <th className="px-3 py-3 text-left">工場</th>
              <th className="px-3 py-3 text-right">検品数</th>
              <th className="px-3 py-3 text-right">不良数</th>
              <th className="px-3 py-3 text-right">検品会社</th>
              <th className="px-3 py-3 text-right">梱包費</th>
              <th className="px-3 py-3 text-right">BASE</th>
              <th className="px-3 py-3 text-right">検品→直入庫 移行差額</th>
              <th className="px-3 py-3 text-right">国内検品→直入庫 差額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-700">{r.period}</td>
                <td className="px-3 py-2 text-gray-600">{r.factory}</td>
                <td className="px-3 py-2 text-right">{fmt(r.inspQty)}</td>
                <td className="px-3 py-2 text-right">{fmt(r.defectQty)}</td>
                <td className="px-3 py-2 text-right">{fmt(r.inspCost)}</td>
                <td className="px-3 py-2 text-right">{fmt(r.packCost)}</td>
                <td className="px-3 py-2 text-right">{fmt(r.base)}</td>
                <td className="px-3 py-2 text-right font-medium">{diffCell(r.diffInspPack)}</td>
                <td className="px-3 py-2 text-right font-medium">{diffCell(r.diffInspPack + r.diffInspBase)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
            <tr>
              <td className="px-3 py-3 text-gray-700" colSpan={2}>合計</td>
              <td className="px-3 py-3 text-right">{fmt(total.inspQty)}</td>
              <td className="px-3 py-3 text-right">{fmt(total.defectQty)}</td>
              <td className="px-3 py-3 text-right">{fmt(total.inspCost)}</td>
              <td className="px-3 py-3 text-right">{fmt(total.packCost)}</td>
              <td className="px-3 py-3 text-right">{fmt(total.base)}</td>
              <td className="px-3 py-3 text-right">{diffCell(total.diffInspPack)}</td>
              <td className="px-3 py-3 text-right">{diffCell(total.diffInspPack + total.diffInspBase)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
