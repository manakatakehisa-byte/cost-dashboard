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

  const inspFiltered     = filterByDate(inspData)
  const directFiltered   = filterByDate(directData)
  const naishokuFiltered = filterByDate(naishokuData)

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

  const inspByFactory = (f, inspRows) => {
    const rows = (inspRows || inspFiltered).filter(d => d.factory === f)
    const cost       = rows.reduce((s, d) => s + d.inspCost, 0)
    const qty        = rows.reduce((s, d) => s + d.totalQty, 0)
    const goodQty    = rows.reduce((s, d) => s + (d.goodQty || 0), 0)
    const baseVsDiff = rows.reduce((s, d) => s + d.baseVsDiff, 0)
    return { cost, qty, goodQty, perPcs: qty > 0 ? cost / qty : 0, baseVsDiff }
  }

  const directByFactory = (f, dirRows) => {
    const rows = (dirRows || directFiltered).filter(d => d.factory === f)
    const qty          = rows.reduce((s, d) => s + d.inspQty, 0)
    const goodQty      = rows.reduce((s, d) => s + (d.goodQty || 0), 0)
    const packCost     = rows.reduce((s, d) => s + (d.packCost || 0), 0)
    const diffInspPack = rows.reduce((s, d) => s + (d.diffInspPack || 0), 0)
    const diffInspBase = rows.reduce((s, d) => s + (d.diffInspBase || 0), 0)
    return { cost: packCost, qty, goodQty, perPcs: qty > 0 ? packCost / qty : 0, packCost, diffInspPack, diffInspBase }
  }

  const inspTotal = {
    cost:       inspForFactory.reduce((s, d) => s + d.inspCost, 0),
    qty:        inspForFactory.reduce((s, d) => s + d.totalQty, 0),
    goodQty:    inspForFactory.reduce((s, d) => s + (d.goodQty || 0), 0),
    baseVsDiff: inspForFactory.reduce((s, d) => s + d.baseVsDiff, 0),
  }
  inspTotal.perPcs = inspTotal.qty > 0 ? inspTotal.cost / inspTotal.qty : 0

  const directTotal = {
    qty:          directForFactory.reduce((s, d) => s + d.inspQty, 0),
    goodQty:      directForFactory.reduce((s, d) => s + (d.goodQty || 0), 0),
    packCost:     directForFactory.reduce((s, d) => s + (d.packCost || 0), 0),
    diffInspPack: directForFactory.reduce((s, d) => s + (d.diffInspPack || 0), 0),
    diffInspBase: directForFactory.reduce((s, d) => s + (d.diffInspBase || 0), 0),
  }
  directTotal.cost   = directTotal.packCost
  directTotal.perPcs = directTotal.qty > 0 ? directTotal.cost / directTotal.qty : 0

  const diffToInsp = (f, inspRows, dirRows) => {
    const insp = inspByFactory(f, inspRows)
    const dir  = directByFactory(f, dirRows)
    return insp.baseVsDiff + dir.diffInspBase
  }
  const diffToInspTotal = inspTotal.baseVsDiff + directTotal.diffInspBase

  const diffToDirect = (f, dirRows) => {
    const dir = directByFactory(f, dirRows)
    return f === 'サンリーフ' ? dir.diffInspPack + dir.packCost : dir.diffInspPack
  }
  const diffToDirectTotal = displayFactories.reduce((s, f) => s + diffToDirect(f), 0)

  const diffTotal = (f, inspRows, dirRows) => diffToInsp(f, inspRows, dirRows) + diffToDirect(f, dirRows)
  const diffTotalAll = diffToInspTotal + diffToDirectTotal

  const getTrendRows = (groupKey) => {
    const periods = [...new Set([
      ...inspData.map(d => d[groupKey]),
      ...directData.map(d => d[groupKey]),
      ...naishokuData.map(d => groupKey === 'year' ? d.yearMonth?.split('/')[0] : d.yearMonth),
    ])].filter(Boolean).sort()

    return periods.map(period => {
      const inspRows = inspData.filter(d => d[groupKey] === period)
      const dirRows  = directData.filter(d => d[groupKey] === period)
      const nRows    = naishokuData.filter(d =>
        groupKey === 'year' ? d.yearMonth?.startsWith(period) : d.yearMonth === period
      )

      const allFactories = [...new Set([...inspRows.map(d => d.factory), ...dirRows.map(d => d.factory)])].sort()

      const nTotal = {
        totalCost: nRows.reduce((s, d) => s + d.totalCost, 0),
        totalQty:  nRows.reduce((s, d) => s + d.totalQty, 0),
      }
      nTotal.avgPrice = nTotal.totalQty > 0 ? nTotal.totalCost / nTotal.totalQty : 0

      const iTotal = {
        cost:       inspRows.reduce((s, d) => s + d.inspCost, 0),
        qty:        inspRows.reduce((s, d) => s + d.totalQty, 0),
        goodQty:    inspRows.reduce((s, d) => s + (d.goodQty || 0), 0),
        baseVsDiff: inspRows.reduce((s, d) => s + d.baseVsDiff, 0),
      }
      iTotal.perPcs = iTotal.qty > 0 ? iTotal.cost / iTotal.qty : 0

      const dTotal = {
        qty:          dirRows.reduce((s, d) => s + d.inspQty, 0),
        goodQty:      dirRows.reduce((s, d) => s + (d.goodQty || 0), 0),
        packCost:     dirRows.reduce((s, d) => s + (d.packCost || 0), 0),
        diffInspPack: dirRows.reduce((s, d) => s + (d.diffInspPack || 0), 0),
        diffInspBase: dirRows.reduce((s, d) => s + (d.diffInspBase || 0), 0),
      }
      dTotal.cost   = dTotal.packCost
      dTotal.perPcs = dTotal.qty > 0 ? dTotal.cost / dTotal.qty : 0

      const d1 = iTotal.baseVsDiff + dTotal.diffInspBase
      const d2 = allFactories.reduce((s, f) => {
        const dir = directByFactory(f, dirRows)
        return s + (f === 'サンリーフ' ? dir.diffInspPack + dir.packCost : dir.diffInspPack)
      }, 0)
      const d3 = d1 + d2

      const saanriifuPackCost = dirRows
        .filter(d => d.factory === 'サンリーフ')
        .reduce((s, d) => s + (d.packCost || 0), 0)

      return { period, nTotal, iTotal, dTotal, d1, d2, d3, saanriifuPackCost }
    })
  }

  const fmt  = (n) => Math.round(n).toLocaleString()
  const fmtD = (n) => isNaN(n) || !isFinite(n) ? '-' : n.toFixed(1)
  const color = (n) => ({ color: n > 0 ? 'green' : n < 0 ? 'red' : 'inherit' })

  const isTrend = filterType === 'trendMonth' || filterType === 'trendYear'
  const trendRows = isTrend ? getTrendRows(filterType === 'trendMonth' ? 'yearMonth' : 'year') : []

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: 8 }}>表示：</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="month">年月</option>
            <option value="year">年</option>
            <option value="all">全期間</option>
            <option value="trendMonth">月別推移（全工場）</option>
            <option value="trendYear">年別推移（全工場）</option>
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
        {!isTrend && (
          <div>
            <label style={{ marginRight: 8 }}>工場：</label>
            <select value={factory} onChange={e => setFactory(e.target.value)}>
              <option value="all">全工場</option>
              {factories.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        {isTrend ? (
          <table style={{ borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#1e293b', color: 'white' }}>
                <th rowSpan={2} style={th}>期間</th>
                <th colSpan={3} style={th}>日本検品</th>
                <th colSpan={4} style={th}>第三者検品会社</th>
                <th colSpan={5} style={th}>直入庫</th>
                <th colSpan={3} style={{ ...th, background: '#166534' }}>コスト削減差額</th>
              </tr>
              <tr style={{ background: '#334155', color: 'white' }}>
                <th style={th}>検品数</th><th style={th}>検品費</th><th style={th}>1PCS</th>
                <th style={th}>検品数</th><th style={th}>良品数</th><th style={th}>検品費</th><th style={th}>1PCS</th>
                <th style={th}>検品数</th><th style={th}>良品数</th><th style={th}>検品費</th><th style={th}>1PCS</th><th style={th}>備考（梱包費）</th>
                <th style={{ ...th, background: '#166534' }}>国内検品→検品会社</th>
                <th style={{ ...th, background: '#166534' }}>検品会社→直入庫</th>
                <th style={{ ...th, background: '#166534' }}>合計差額</th>
              </tr>
            </thead>
            <tbody>
              {trendRows.map(r => (
                <tr key={r.period} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ ...td, fontWeight: 'bold' }}>{r.period}</td>
                  <td style={td}>{fmt(r.nTotal.totalQty)}</td>
                  <td style={td}>¥{fmt(r.nTotal.totalCost)}</td>
                  <td style={td}>{fmtD(r.nTotal.avgPrice)}</td>
                  <td style={td}>{fmt(r.iTotal.qty)}</td>
                  <td style={td}>{fmt(r.iTotal.goodQty)}</td>
                  <td style={td}>¥{fmt(r.iTotal.cost)}</td>
                  <td style={td}>{fmtD(r.iTotal.perPcs)}</td>
                  <td style={td}>{fmt(r.dTotal.qty)}</td>
                  <td style={td}>{fmt(r.dTotal.goodQty)}</td>
                  <td style={td}>¥{fmt(r.dTotal.cost)}</td>
                  <td style={td}>{fmtD(r.dTotal.perPcs)}</td>
                  <td style={td}>{r.saanriifuPackCost ? '¥' + fmt(r.saanriifuPackCost) : 'ー'}</td>
                  <td style={{ ...td, ...color(r.d1) }}>¥{fmt(r.d1)}</td>
                  <td style={{ ...td, ...color(r.d2) }}>¥{fmt(r.d2)}</td>
                  <td style={{ ...td, ...color(r.d3) }}>¥{fmt(r.d3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{ borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#1e293b', color: 'white' }}>
                <th rowSpan={2} style={th}>工場</th>
                <th colSpan={3} style={th}>日本検品</th>
                <th colSpan={4} style={th}>第三者検品会社</th>
                <th colSpan={5} style={th}>直入庫</th>
                <th colSpan={3} style={{ ...th, background: '#166534' }}>コスト削減差額</th>
              </tr>
              <tr style={{ background: '#334155', color: 'white' }}>
                <th style={th}>検品数</th><th style={th}>検品費</th><th style={th}>1PCS</th>
                <th style={th}>検品数</th><th style={th}>良品数</th><th style={th}>検品費</th><th style={th}>1PCS</th>
                <th style={th}>検品数</th><th style={th}>良品数</th><th style={th}>検品費</th><th style={th}>1PCS</th><th style={th}>備考（梱包費）</th>
                <th style={{ ...th, background: '#166534' }}>国内検品→検品会社</th>
                <th style={{ ...th, background: '#166534' }}>検品会社→直入庫</th>
                <th style={{ ...th, background: '#166534' }}>合計差額</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ fontWeight: 'bold', background: '#f1f5f9' }}>
                <td style={td}>合計</td>
                <td style={td}>{fmt(naishokuTotal.totalQty)}</td>
                <td style={td}>¥{fmt(naishokuTotal.totalCost)}</td>
                <td style={td}>{fmtD(naishokuTotal.avgPrice)}</td>
                <td style={td}>{fmt(inspTotal.qty)}</td>
                <td style={td}>{fmt(inspTotal.goodQty)}</td>
                <td style={td}>¥{fmt(inspTotal.cost)}</td>
                <td style={td}>{fmtD(inspTotal.perPcs)}</td>
                <td style={td}>{fmt(directTotal.qty)}</td>
                <td style={td}>{fmt(directTotal.goodQty)}</td>
                <td style={td}>¥{fmt(directTotal.cost)}</td>
                <td style={td}>{fmtD(directTotal.perPcs)}</td>
                <td style={td}>ー</td>
                <td style={{ ...td, ...color(diffToInspTotal) }}>¥{fmt(diffToInspTotal)}</td>
                <td style={{ ...td, ...color(diffToDirectTotal) }}>¥{fmt(diffToDirectTotal)}</td>
                <td style={{ ...td, ...color(diffTotalAll) }}>¥{fmt(diffTotalAll)}</td>
              </tr>
              {displayFactories.map(f => {
                const insp = inspByFactory(f)
                const dir  = directByFactory(f)
                const d1   = diffToInsp(f)
                const d2   = diffToDirect(f)
                const d3   = diffTotal(f)
                return (
                  <tr key={f} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={td}>{f}</td>
                    <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                    <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                    <td style={{ ...td, color: '#94a3b8' }}>ー</td>
                    <td style={td}>{fmt(insp.qty)}</td>
                    <td style={td}>{fmt(insp.goodQty)}</td>
                    <td style={td}>¥{fmt(insp.cost)}</td>
                    <td style={td}>{fmtD(insp.perPcs)}</td>
                    <td style={td}>{fmt(dir.qty)}</td>
                    <td style={td}>{fmt(dir.goodQty)}</td>
                    <td style={td}>¥{fmt(dir.cost)}</td>
                    <td style={td}>{fmtD(dir.perPcs)}</td>
                    <td style={td}>{f === 'サンリーフ' ? '¥' + fmt(dir.packCost) : 'ー'}</td>
                    <td style={{ ...td, ...color(d1) }}>¥{fmt(d1)}</td>
                    <td style={{ ...td, ...color(d2) }}>¥{fmt(d2)}</td>
                    <td style={{ ...td, ...color(d3) }}>¥{fmt(d3)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const th = { padding: '8px 12px', border: '1px solid #475569', textAlign: 'center' }
const td = { padding: '6px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }
