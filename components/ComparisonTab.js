import { useState, useEffect } from 'react'

export default function ComparisonTab({ inspData, directData }) {
  const [naishokuData, setNaishokuData] = useState([])
  const [filterType, setFilterType] = useState('month')
  const [yearMonth, setYearMonth] = useState('')
  const [year, setYear] = useState('')
  const [yearMonths, setYearMonths] = useState([])
  const [years, setYears] = useState([])
  const [factory, setFactory] = useState('all')
  const [factories, setFactories] = useState([])

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

    const fs = [...new Set([
      ...inspData.map(d => d.factory),
      ...directData.map(d => d.factory),
    ])].sort()
    setFactories(fs)
  }, [naishokuData, inspData, directData])

  const filterByDate = (data) => {
    if (filterType === 'month') return data.filter(d => d.yearMonth === yearMonth)
    if (filterType === 'year')  return data.filter(d => d.yearMonth?.startsWith(year))
    return data
  }

  const inspFiltered   = filterByDate(inspData)
  const directFiltered = filterByDate(directData)
  const naishokuFiltered = filterByDate(naishokuData)

  // 工場フィルター
  const inspForFactory   = factory === 'all' ? inspFiltered   : inspFiltered.filter(d => d.factory === factory)
  const directForFactory = factory === 'all' ? directFiltered : directFiltered.filter(d => d.factory === factory)

  const naishokuTotal = {
    totalCost: naishokuFiltered.reduce((s, d) => s + d.totalCost, 0),
    totalQty:  naishokuFiltered.reduce((s, d) => s + d.totalQty, 0),
  }
  naishokuTotal.avgPrice = naishokuTotal.totalQty > 0
    ? naishokuTotal.totalCost / naishokuTotal.totalQty : 0

  const displayFactories = factory === 'all'
    ? [...new Set([...inspFiltered.map(d => d.factory), ...directFiltered.map(d => d.factory)])].sort()
    : [factory]

  const inspByFactory = (f) => {
    const rows = inspFiltered.filter(d => d.factory === f)
    const cost = rows.reduce((s, d) => s + d.inspCost, 0)
    const qty  = rows.reduce((s, d) => s + d.totalQty, 0)
    const diff = rows.reduce((s, d) => s + d.diff, 0)
    return { cost, qty, perPcs: qty > 0 ? cost / qty : 0, diff }
  }

  const directByFactory = (f) => {
    const rows = directFiltered.filter(d => d.factory === f)
    const cost        = rows.reduce((s, d) => s + (d.inspCost || 0), 0)
    const qty         = rows.reduce((s, d) => s + d.inspQty, 0)
    const packCost    = rows.reduce((s, d) => s + (d.packCost || 0), 0)
    const diffInspPack = rows.reduce((s, d) => s + (d.diffInspPack || 0), 0)
    const diffInspBase = rows.reduce((s, d) => s + (d.diffInspBase || 0), 0)
    return { cost, qty, perPcs: qty > 0 ? cost / qty : 0, packCost, diffInspPack, diffInspBase }
  }

  const inspTotal = {
    cost: inspForFactory.reduce((s, d) => s + d.inspCost, 0),
    qty:  inspForFactory.reduce((s, d) => s + d.totalQty, 0),
    diff: inspForFactory.reduce((s, d) => s + d.diff, 0),
  }
  inspTotal.perPcs = inspTotal.qty > 0 ? inspTotal.cost / inspTotal.qty : 0

  const directTotal = {
    cost:         directForFactory.reduce((s, d) => s + (d.inspCost || 0), 0),
    qty:          directForFactory.reduce((s, d) => s + d.inspQty, 0),
    packCost:     directForFactory.reduce((s, d) => s + (d.packCost || 0), 0),
    diffInspPack: directForFactory.reduce((s, d) => s + (d.diffInspPack || 0), 0),
    diffInspBase: directForFactory.reduce((s, d) => s + (d.diffInspBase || 0), 0),
  }
  directTotal.perPcs = directTotal.qty > 0 ? directTotal.cost / directTotal.qty : 0

  // 差額計算
  // 国内検品→検品会社 = 直入庫Q列 + 検品コストU列(diff)
  const diffToInsp = (f) => {
    const insp = inspByFactory(f)
    const dir  = directByFactory(f)
    return dir.diffInspBase + insp.diff
  }
  const diffToInspTotal = directTotal.diffInspBase + inspTotal.diff

  // 検品→直入庫 移行差額 = 直入庫I列
  const diffToDirect = (f) => directByFactory(f).diffInspPack
  const diffToDirectTotal = directTotal.diffInspPack

  // 国内検品→直入庫 = Q列 + 検品コストU列 + I列（サンリーフはH列を引く）
  const diffNaishokuToDirect = (f) => {
    const insp = inspByFactory(f)
    const dir  = directByFactory(f)
    const base = dir.diffInspBase + insp.diff + dir.diffInspPack
    return f === 'サンリーフ' ? base - dir.packCost : base
  }
  const diffNaishokuToDirectTotal = displayFactories.reduce((s, f) => s + diffNaishokuToDirect(f), 0)

  const fmt  = (n) => Math.round(n).toLocaleString()
  const fmtD = (n) => isNaN(n) || !isFinite(n) ? '-' : n.toFixed(1)
  const color = (n) => ({ color: n > 0 ? 'green' : n < 0 ? 'red' : 'inherit' })

  return (
    <div>
      {/* フィルター */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
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
        <div>
          <label style={{ marginRight: 8 }}>工場：</label>
          <select value={factory} onChange={e => setFactory(e.target.value)}>
            <option value="all">全工場</option>
            {factories.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#1e293b', color: 'white' }}>
              <th rowSpan={2} style={th}>工場</th>
              <th colSpan={3} style={th}>日本検品</th>
              <th colSpan={3} style={th}>第三者検品会社</th>
              <th colSpan={3} style={th}>直入庫</th>
              <th colSpan={3} style={{ ...th, background: '#166534' }}>コスト削減差額</th>
            </tr>
            <tr style={{ background: '#334155', color: 'white' }}>
              <th style={th}>検品数</th><th style={th}>検品費</th><th style={th}>1PCS</th>
              <th style={th}>検品数</th><th style={th}>検品費</th><th style={th}>1PCS</th>
              <th style={th}>検品数</th><th style={th}>検品費</th><th style={th}>1PCS</th>
              <th style={{ ...th, background: '#166534' }}>国内検品→検品会社</th>
              <th style={{ ...th, background: '#166534' }}>検品会社→直入庫</th>
              <th style={{ ...th, background: '#166534' }}>国内検品→直入庫</th>
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
              <td style={{ ...td, ...color(diffToInspTotal) }}>¥{fmt(diffToInspTotal)}</td>
              <td style={{ ...td, ...color(diffToDirectTotal) }}>¥{fmt(diffToDirectTotal)}</td>
              <td style={{ ...td, ...color(diffNaishokuToDirectTotal) }}>¥{fmt(diffNaishokuToDirectTotal)}</td>
            </tr>
            {displayFactories.map(f => {
              const insp = inspByFactory(f)
              const dir  = directByFactory(f)
              const d1   = diffToInsp(f)
              const d2   = diffToDirect(f)
              const d3   = diffNaishokuToDirect(f)
              return (
                <tr key={f} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={td}>{f}</td>
                  <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                  <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                  <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                  <td style={td}>{fmt(insp.qty)}</td>
                  <td style={td}>¥{fmt(insp.cost)}</td>
                  <td style={td}>{fmtD(insp.perPcs)}</td>
                  <td style={td}>{fmt(dir.qty)}</td>
                  <td style={td}>¥{fmt(dir.cost)}</td>
                  <td style={td}>{fmtD(dir.perPcs)}</td>
                  <td style={{ ...td, ...color(d1) }}>¥{fmt(d1)}</td>
                  <td style={{ ...td, ...color(d2) }}>¥{fmt(d2)}</td>
                  <td style={{ ...td, ...color(d3) }}>¥{fmt(d3)}</td>
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
