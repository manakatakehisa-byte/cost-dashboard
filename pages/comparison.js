import { useState, useEffect } from 'react'

export default function Comparison() {
  const [naishokuData, setNaishokuData] = useState([])
  const [inspectionData, setInspectionData] = useState([])
  const [directData, setDirectData] = useState([])
  const [yearMonth, setYearMonth] = useState('')
  const [yearMonths, setYearMonths] = useState([])

  useEffect(() => {
    fetch('/api/naishoku').then(r => r.json()).then(setNaishokuData)
    fetch('/api/inspection').then(r => r.json()).then(setInspectionData)
    fetch('/api/direct').then(r => r.json()).then(setDirectData)
  }, [])

  useEffect(() => {
    const yms = [...new Set([
      ...naishokuData.map(d => d.yearMonth),
      ...inspectionData.map(d => d.yearMonth),
      ...directData.map(d => d.yearMonth),
    ])].sort()
    setYearMonths(yms)
    if (yms.length > 0) setYearMonth(yms[yms.length - 1])
  }, [naishokuData, inspectionData, directData])

  // 日本検品（月合計）
  const naishoku = naishokuData.find(d => d.yearMonth === yearMonth) || {}

  // 第三者検品（工場別）
  const inspFiltered = inspectionData.filter(d => d.yearMonth === yearMonth)
  const factories = [...new Set(inspFiltered.map(d => d.factory))].sort()

  const inspByFactory = (factory) => {
    const rows = inspFiltered.filter(d => d.factory === factory)
    const cost = rows.reduce((s, d) => s + d.inspCost, 0)
    const qty  = rows.reduce((s, d) => s + d.totalQty, 0)
    return { cost, qty, perPcs: qty > 0 ? cost / qty : 0 }
  }

  // 直入庫（工場別）
  const directFiltered = directData.filter(d => d.yearMonth === yearMonth)
  const directByFactory = (factory) => {
    const rows = directFiltered.filter(d => d.factory === factory)
    const cost = rows.reduce((s, d) => s + (d.inspCost || 0), 0)
    const qty  = rows.reduce((s, d) => s + d.totalQty, 0)
    return { cost, qty, perPcs: qty > 0 ? cost / qty : 0 }
  }

  // 合計
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

  const fmt = (n) => Math.round(n).toLocaleString()
  const fmtD = (n) => n.toFixed(1)

  // コスト削減差額
  const diff1 = (naishoku.avgPrice || 0) - inspTotal.perPcs  // 日本検品→検品会社
  const diff2 = inspTotal.perPcs - directTotal.perPcs         // 検品会社→直入庫
  const diff3 = (naishoku.avgPrice || 0) - directTotal.perPcs // 日本検品→直入庫

  return (
    <div style={{ padding: 24 }}>
      <h1>コスト比較</h1>

      <div style={{ marginBottom: 16 }}>
        <label>年月：</label>
        <select value={yearMonth} onChange={e => setYearMonth(e.target.value)}>
          {yearMonths.map(ym => <option key={ym} value={ym}>{ym}</option>)}
        </select>
      </div>

      <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th rowSpan={2}>工場</th>
            <th colSpan={3}>日本検品</th>
            <th colSpan={3}>第三者検品会社</th>
            <th colSpan={3}>直入庫</th>
            <th colSpan={3}>コスト削減差額（1PCS）</th>
          </tr>
          <tr>
            <th>検品数</th><th>検品費</th><th>1PCS</th>
            <th>検品数</th><th>検品費</th><th>1PCS</th>
            <th>検品数</th><th>検品費</th><th>1PCS</th>
            <th>日本→検品会社</th><th>検品会社→直入庫</th><th>日本→直入庫</th>
          </tr>
        </thead>
        <tbody>
          {/* 合計行 */}
          <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
            <td>合計</td>
            <td>{fmt(naishoku.totalQty || 0)}</td>
            <td>{fmt(naishoku.totalCost || 0)}</td>
            <td>{fmtD(naishoku.avgPrice || 0)}</td>
            <td>{fmt(inspTotal.qty)}</td>
            <td>{fmt(inspTotal.cost)}</td>
            <td>{fmtD(inspTotal.perPcs)}</td>
            <td>{fmt(directTotal.qty)}</td>
            <td>{fmt(directTotal.cost)}</td>
            <td>{fmtD(directTotal.perPcs)}</td>
            <td>{fmtD(diff1)}</td>
            <td>{fmtD(diff2)}</td>
            <td>{fmtD(diff3)}</td>
          </tr>
          {/* 工場別 */}
          {factories.map(factory => {
            const insp = inspByFactory(factory)
            const dir  = directByFactory(factory)
            const d2 = insp.perPcs - dir.perPcs
            return (
              <tr key={factory}>
                <td>{factory}</td>
                <td>ー</td><td>ー</td><td>ー</td>
                <td>{fmt(insp.qty)}</td>
                <td>{fmt(insp.cost)}</td>
                <td>{fmtD(insp.perPcs)}</td>
                <td>{fmt(dir.qty)}</td>
                <td>{fmt(dir.cost)}</td>
                <td>{fmtD(dir.perPcs)}</td>
                <td>ー</td>
                <td>{fmtD(d2)}</td>
                <td>ー</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
