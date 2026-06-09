import { getSheetData, toNum, toYearMonth, toYear } from '../../lib/sheets'

export default async function handler(req, res) {
  try {
    const sheetName = process.env.DIRECT_SHEET_NAME || '直入庫コスト'
    const rows = await getSheetData(sheetName)

    if (rows.length < 3) return res.status(200).json([])

    // 1行目が空なので2行目をヘッダーとして使う
    const header = rows[1]
    const idx = (name) => header.findIndex(h => h && h.includes(name))

    const col = {
      date:        idx('報告日'),
      factory:     idx('工場名'),
      itemCode:    idx('品番'),
      totalQty:    idx('総計'),
      goodQty:     idx('良品数'),
      inspector:   idx('検品会社'),
      packCost:    idx('梱包費'),
      diff:        idx('差額'),
      base:        idx('BASE'),
      naishoku:    idx('内職'),
      inspFee:     idx('検品'),
      outlet:      idx('アウトレット'),
      disposal:    idx('破棄費'),
      outStorage:  idx('アウト保管'),
      barcode:     idx('バーコード'),
      diffInspector: idx('差額（検品会社）'),
    }

    const data = []
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i]
      const rawDate = r[col.date] || ''
      const ym = toYearMonth(rawDate)
      const year = toYear(rawDate)
      if (!ym && !year) continue

      const totalQty     = toNum(r[col.totalQty])
      const goodQty      = toNum(r[col.goodQty])
      const inspFee      = toNum(r[col.inspFee])
      const packCost     = toNum(r[col.packCost])
      const base         = toNum(r[col.base])
      const diff         = toNum(r[col.diff])
      const diffInspector = toNum(r[col.diffInspector])

      const inspVsBase    = inspFee - base
      const packVsBase    = packCost - base
      const inspPackTotal = inspFee + packCost
      const inspPackDiff  = inspPackTotal - base

      const perPcsInsp = totalQty > 0 ? inspFee / totalQty : 0
      const perPcsPack = totalQty > 0 ? packCost / totalQty : 0

      data.push({
        yearMonth:   ym,
        year:        year,
        factory:     r[col.factory] || '',
        itemCode:    r[col.itemCode] || '',
        inspector:   r[col.inspector] || '',
        totalQty,
        goodQty,
        inspFee,
        packCost,
        base,
        diff,
        diffInspector,
        inspVsBase,
        packVsBase,
        inspPackTotal,
        inspPackDiff,
        perPcsInsp: Math.round(perPcsInsp * 100) / 100,
        perPcsPack: Math.round(perPcsPack * 100) / 100,
      })
    }

    res.status(200).json(data)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
