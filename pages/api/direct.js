import { getSheetData, toNum, toYearMonth, toYear } from '../../lib/sheets'

export default async function handler(req, res) {
  try {
    const sheetName = process.env.DIRECT_SHEET_NAME || '直入庫コスト'
    const rows = await getSheetData(sheetName)

    if (rows.length < 3) return res.status(200).json([])

    const col = {
      date:          0,  // A 報告日
      factory:       1,  // B 工場名
      itemCode:      2,  // C 品番
      inspQty:       3,  // D 検品数
      defectQty:     4,  // E 不良数（総計）
      inspCost:      6,  // G 検品会社コスト
      packCost:      7,  // H 梱包費
      diffInspPack:  8,  // I 検品会社+梱包費の差額
      base:          9,  // J BASE
      diffInspBase:  16, // Q 検品費とBASEの差額
    }

    const data = []
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i]
      const rawDate = r[col.date] || ''
      const ym = toYearMonth(rawDate)
      const year = toYear(rawDate)
      if (!ym && !year) continue

      data.push({
        yearMonth:    ym,
        year,
        factory:      r[col.factory] || '',
        itemCode:     r[col.itemCode] || '',
        inspQty:      Math.round(toNum(r[col.inspQty])),
        defectQty:    Math.round(toNum(r[col.defectQty])),
        inspCost:     Math.round(toNum(r[col.inspCost])),
        packCost:     Math.round(toNum(r[col.packCost])),
        diffInspPack: Math.round(toNum(r[col.diffInspPack])),
        base:         Math.round(toNum(r[col.base])),
        diffInspBase: Math.round(toNum(r[col.diffInspBase])),
      })
    }

    res.status(200).json(data)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
