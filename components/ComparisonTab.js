import { useState, useEffect } from 'react'

export default function ComparisonTab({ inspData, directData }) {
  const [naishokuData, setNaishokuData] = useState([])
  const [yearMonth, setYearMonth] = useState('')
  const [yearMonths, setYearMonths] = useState([])

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
  }, [naishokuData, inspData, directData])

  const naishoku = naishokuData.find(d => d.yearMonth === yearMonth) || {}

  const inspFiltered = inspData.filter(d => d.yearMonth === yearMonth)
  const directFiltered = directData.filter(d => d.yearMonth === yearMonth)

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
  const fmtD = (n) => isNaN(n) ? '-' : n.toFixed(1)

  const diff1 = (naishoku.avgPrice || 0) - inspTotal.perPcs
  const diff2 = inspTotal.perPcs - directTotal.perPcs
  const diff3 = (naishoku.avgPrice || 0) - directTotal.perPcs

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>年月：</label>
        <select value={yearMonth} onChange={e => setYearMonth(e.target.value)}>
          {yearMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#1e293b', color: 'white' }}>
              <th rowSpan={2} style={th}>工場</th>
              <th colSpan={3} style={th}>日本検品</th>
              <th colSpan={3} style={th}>第三者検品会社</th>
              <th colSpan={3} style={th}>直入庫</th>
              <th colSpan={3} style={{ ...th, background: '#166534' }}>コスト削減差額（1PCS）</th>
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
              <td style={td}>{fmt(naishoku.totalQty || 0)}</td>
              <td style={td}>¥{fmt(naishoku.totalCost || 0)}</td>
              <td style={td}>{fmtD(naishoku.avgPrice || 0)}</td>
              <td style={td}>{fmt(inspTotal.qty)}</td>
              <td style={td}>¥{fmt(inspTotal.cost)}</td>
              <td style={td}>{fmtD(inspTotal.perPcs)}</td>
              <td style={td}>{fmt(directTotal.qty)}</td>
              <td style={td}>¥{fmt(directTotal.cost)}</td>
              <td style={td}>{fmtD(directTotal.perPcs)}</td>
              <td style={{ ...td, color: diff1 > 0 ? 'green' : 'red' }}>{fmtD(diff1)}</td>
              <td style={{ ...td, color: diff2 > 0 ? 'green' : 'red' }}>{fmtD(diff2)}</td>
              <td style={{ ...td, color: diff3 > 0 ? 'green' : 'red' }}>{fmtD(diff3)}</td>
            </tr>
            {factories.map(factory => {
              const insp = inspByFactory(factory)
              const dir  = directByFactory(factory)
              const d2   = insp.perPcs - dir.perPcs
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
                  <td style={{ ...td, color: d2 > 0 ? 'green' : 'red' }}>{fmtD(d2)}</td>
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
