import { getSheetData, toNum, toYearMonth, toYear } from '../../lib/sheets'

export default async function handler(req, res) {
  try {
    const sheetName = process.env.DIRECT_SHEET_NAME || '直入庫コスト'
    const rows = await getSheetData(sheetName)

    if (rows.length < 2) return res.status(200).json([])

    const header = rows[0]
    const idx = (name) => header.findIndex(h => h && h.includes(name))

    const col = {
      date:        idx('報告日'),
      factory:     idx('工場名'),
      itemCode:    idx('品番'),
      deliveryQty: idx('納品数'),
      samplingQty: idx('抜き取り'),
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
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      const rawDate = r[col.date] || ''
      const ym = toYearMonth(rawDate)
      const year = toYear(rawDate)
      if (!ym && !year) continue

      const deliveryQty  = toNum(r[col.deliveryQty])
      const samplingQty  = toNum(r[col.samplingQty])
      const goodQty      = toNum(r[col.goodQty])
      const totalQty     = deliveryQty || (goodQty + samplingQty)
      const inspFee      = toNum(r[col.inspFee])
      const packCost     = toNum(r[col.packCost])
      const base         = toNum(r[col.base])
      const diff         = toNum(r[col.diff])
      const diffInspector = toNum(r[col.diffInspector])

      // 差額計算
      const inspVsBase = base - inspFee          // 検品費とBASEの差額
      const packVsBase = base - packCost          // 梱包費とBASEの差額
      const inspPackTotal = inspFee + packCost    // 検品会社費 + 梱包費
      const inspPackDiff = base - inspPackTotal   // (検品+梱包) vs BASE 差額

      // 1pcs あたり
      const perPcsInsp = totalQty > 0 ? inspFee / totalQty : 0
      const perPcsPack = totalQty > 0 ? packCost / totalQty : 0

      data.push({
        yearMonth:   ym,
        year:        year,
        factory:     r[col.factory] || '',
        itemCode:    r[col.itemCode] || '',
        inspector:   r[col.inspector] || '',
        totalQty,
        samplingQty,
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
