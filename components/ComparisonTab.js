import { useState, useEffect } from 'react'

export default function ComparisonTab({ inspData, directData }) {
  const [naishokuData, setNaishokuData] = useState([])
  const [filterType, setFilterType] = useState('month') // month, year, all
  const [yearMonth, setYearMonth] = useState('')
  const [year, setYear] = useState('')
  const [yearMonths, setYearMonths] = useState([])
  const [years, setYears] = useState([])

  useEffect(() => {
    fetch('/api/naishoku').then(r => r.json()).then(setNaishokuData)
  }, [])

  useEffect(() => {
    const yms = [...new Set([
      ...naishokuData.map(d => d.yearMonth),
      ...inspData.map(d => d.yearMonth),
      ...directData.map(d => d.yearMonth),
    ])].sort()
    setYearMonths(yms)
    if (yms.length > 0) setYearMonth(yms[yms.length - 1])

    const ys = [...new Set(yms.map(ym => ym.split('/')[0]))].sort()
    setYears(ys)
    if (ys.length > 0) setYear(ys[ys.length - 1])
  }, [naishokuData, inspData, directData])

  // フィルター
  const filterData = (data) => {
    if (filterType === 'month') return data.filter(d => d.yearMonth === yearMonth)
    if (filterType === 'year')  return data.filter(d => d.yearMonth?.startsWith(year))
    return data
  }

  const inspFiltered   = filterData(inspData)
  const directFiltered = filterData(directData)
  const naishokuFiltered = filterType === 'month'
    ? naishokuData.filter(d => d.yearMonth === yearMonth)
    : filterType === 'year'
    ? naishokuData.filter(d => d.yearMonth?.startsWith(year))
    : naishokuData

  const naishokuTotal = {
    totalCost: naishokuFiltered.reduce((s, d) => s + d.totalCost, 0),
    totalQty:  naishokuFiltered.reduce((s, d) => s + d.totalQty, 0),
  }
  naishokuTotal.avgPrice = naishokuTotal.totalQty > 0
    ? naishokuTotal.totalCost / naishokuTotal.totalQty : 0

  const factories = [...new Set([
    ...inspFiltered.map(d => d.factory),
    ...directFiltered.map(d => d.factory),
  ])].sort()

  const inspByFactory = (factory) => {
    const rows = inspFiltered.filter(d => d.factory === factory)
    const cost = rows.reduce((s, d) => s + d.inspCost, 0)
    const qty  = rows.reduce((s, d) => s + d.totalQty, 0)
    return { cost, qty, perPcs: qty > 0 ? cost / qty : 0 }
  }

  const directByFactory = (factory) => {
    const rows = directFiltered.filter(d => d.factory === factory)
    const cost = rows.reduce((s, d) => s + (d.inspCost || 0), 0)
    const qty  = rows.reduce((s, d) => s + d.totalQty, 0)
    return { cost, qty, perPcs: qty > 0 ? cost / qty : 0 }
  }

  const inspTotal = {
    cost: inspFiltered.reduce((s, d) => s + d.inspCost, 0),
    qty:  inspFiltered.reduce((s, d) => s + d.totalQty, 0),
  }
  inspTotal.perPcs = inspTotal.qty > 0 ? inspTotal.cost / inspTotal.qty : 0

  const directTotal = {
    cost: directFiltered.reduce((s, d) => s + (d.inspCost || 0), 0),
    qty:  directFiltered.reduce((s, d) => s + d.totalQty, 0),
  }
  directTotal.perPcs = directTotal.qty > 0 ? directTotal.cost / directTotal.qty : 0

  const fmt  = (n) => Math.round(n).toLocaleString()
  const fmtD = (n) => isNaN(n) || !isFinite(n) ? '-' : n.toFixed(1)

  // コスト削減差額（検品費）
  const diffCost1 = naishokuTotal.totalCost - inspTotal.cost
  const diffCost2 = inspTotal.cost - directTotal.cost
  const diffCost3 = naishokuTotal.totalCost - directTotal.cost

  return (
    <div>
      {/* フィルター */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div>
          <label style={{ marginRight: 8 }}>表示：</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="month">年月</option>
            <option value="year">年</option>
            <option value="all">全期間</option>
          </select>
        </div>
        {filterType === 'month' && (
          <div>
            <label style={{ marginRight: 8 }}>年月：</label>
            <select value={yearMonth} onChange={e => setYearMonth(e.target.value)}>
              {yearMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
            </select>
          </div>
        )}
        {filterType === 'year' && (
          <div>
            <label style={{ marginRight: 8 }}>年：</label>
            <select value={year} onChange={e => setYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#1e293b', color: 'white' }}>
              <th rowSpan={2} style={th}>工場</th>
              <th colSpan={3} style={th}>日本検品</th>
              <th colSpan={3} style={th}>第三者検品会社</th>
              <th colSpan={3} style={th}>直入庫</th>
              <th colSpan={3} style={{ ...th, background: '#166534' }}>コスト削減差額（検品費）</th>
            </tr>
            <tr style={{ background: '#334155', color: 'white' }}>
              <th style={th}>検品数</th><th style={th}>検品費</th><th style={th}>1PCS</th>
              <th style={th}>検品数</th><th style={th}>検品費</th><th style={th}>1PCS</th>
              <th style={th}>検品数</th><th style={th}>検品費</th><th style={th}>1PCS</th>
              <th style={{ ...th, background: '#166534' }}>日本→検品会社</th>
              <th style={{ ...th, background: '#166534' }}>検品会社→直入庫</th>
              <th style={{ ...th, background: '#166534' }}>日本→直入庫</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ fontWeight: 'bold', background: '#f1f5f9' }}>
              <td style={td}>合計</td>
              <td style={td}>{fmt(naishokuTotal.totalQty)}</td>
              <td style={td}>¥{fmt(naishokuTotal.totalCost)}</td>
              <td style={td}>{fmtD(naishokuTotal.avgPrice)}</td>
              <td style={td}>{fmt(inspTotal.qty)}</td>
              <td style={td}>¥{fmt(inspTotal.cost)}</td>
              <td style={td}>{fmtD(inspTotal.perPcs)}</td>
              <td style={td}>{fmt(directTotal.qty)}</td>
              <td style={td}>¥{fmt(directTotal.cost)}</td>
              <td style={td}>{fmtD(directTotal.perPcs)}</td>
              <td style={{ ...td, color: diffCost1 > 0 ? 'green' : 'red' }}>¥{fmt(diffCost1)}</td>
              <td style={{ ...td, color: diffCost2 > 0 ? 'green' : 'red' }}>¥{fmt(diffCost2)}</td>
              <td style={{ ...td, color: diffCost3 > 0 ? 'green' : 'red' }}>¥{fmt(diffCost3)}</td>
            </tr>
            {factories.map(factory => {
              const insp = inspByFactory(factory)
              const dir  = directByFactory(factory)
              const d2   = insp.cost - dir.cost
              return (
                <tr key={factory} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={td}>{factory}</td>
                  <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                  <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                  <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                  <td style={td}>{fmt(insp.qty)}</td>
                  <td style={td}>¥{fmt(insp.cost)}</td>
                  <td style={td}>{fmtD(insp.perPcs)}</td>
                  <td style={td}>{fmt(dir.qty)}</td>
                  <td style={td}>¥{fmt(dir.cost)}</td>
                  <td style={td}>{fmtD(dir.perPcs)}</td>
                  <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                  <td style={{ ...td, color: d2 > 0 ? 'green' : 'red' }}>¥{fmt(d2)}</td>
                  <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th = { padding: '8px 12px', border: '1px solid #475569', textAlign: 'center' }
const td = { padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }
