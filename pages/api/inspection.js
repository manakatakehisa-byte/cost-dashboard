import { getSheetData, toNum, toYearMonth, toYear } from '../../lib/sheets'

export default async function handler(req, res) {
  try {
    const sheetName = process.env.INSPECTION_SHEET_NAME || '検品コスト'
    const rows = await getSheetData(sheetName)

    if (rows.length < 2) return res.status(200).json([])

    // ヘッダー行を取得してカラムインデックスを動的に判定
    const header = rows[0]
    const idx = (name) => header.findIndex(h => h && h.includes(name))
    const idxExact = (name) => header.findIndex(h => h && h.trim() === name.trim())

    const col = {
      yearMonth: idx('年月'),
      date:      idx('日付'),
      factory:   idx('工場'),
      inspector: idx('検品会社'),
      itemCode:  idx('品番'),
      goodQty:   idx('良品数'),
      defectQty: idx('不良数'),
      totalQty:  idx('検品数'),
      unitPrice: idx('単価'),
      inspCost:  idx('検品費'),
      base:      idx('BASE'),
      naishoku:  idx('内職'),
      inspection:idx('検品'),
      outlet:    idx('アウトレット'),
      disposal:  idx('破棄費'),
      outStorage:idx('アウト保管'),
      recruit:   idx('内職求人'),
      barcode:   idx('バーコード'),
      otherStaff:idx('その他社員'),
      diff:      idx('差額'),
      sampling:  idx('抜き取り'),
     other:     idxExact('その他'),
    }

    const data = []
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      const rawDate = r[col.date] || r[col.yearMonth] || ''
      const ym = toYearMonth(rawDate)
      const year = toYear(rawDate)
      if (!ym && !year) continue

      const goodQty    = toNum(r[col.goodQty])
      const defectQty  = toNum(r[col.defectQty])
      const totalQty   = toNum(r[col.totalQty]) || (goodQty + defectQty)
      const inspCost   = toNum(r[col.inspCost])
      const base       = toNum(r[col.base])
      const sampling   = toNum(r[col.sampling])
      const other      = toNum(r[col.other])
      const othersTotal = sampling + other
      const diff       = toNum(r[col.diff])

      // 1pcs あたり
      const perPcs = totalQty > 0 ? inspCost / totalQty : 0

      data.push({
        yearMonth:   ym,
        year:        year,
        factory:     r[col.factory] || '',
        inspector:   r[col.inspector] || '',
        itemCode:    r[col.itemCode] || '',
        totalQty,
        goodQty,
        defectQty,
        inspCost,
        base,
        sampling,
        other,
        othersTotal,      // 抜き取り + その他
        inspPlusOthers: inspCost + othersTotal, // 検品費 + 抜き取り + その他
        baseVsDiff: base - (inspCost + othersTotal), // BASEと(検品費+抜き取り+その他)の差額
        diff,
        perPcs: Math.round(perPcs * 100) / 100,
      })
    }

    res.status(200).json(data)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
