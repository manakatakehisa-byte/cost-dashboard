import { getSheetData, toNum, toYearMonth } from '../../lib/sheets'

export default async function handler(req, res) {
  try {
    const sheetName = '日本検品'
    const rows = await getSheetData(sheetName)

    if (rows.length < 2) return res.status(200).json([])

    const data = []
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      const rawDate = r[0] || ''
      if (!rawDate) continue

      const ym = toYearMonth(rawDate)
      if (!ym) continue

      const hhCost     = toNum(r[1])
      const hhQty      = toNum(r[2])
      const trustCost  = toNum(r[4])
      const trustQty   = toNum(r[5])
      const jisaCost   = toNum(r[7])
      const jisaQty    = toNum(r[8])
      const avgPrice   = toNum(r[10])

      const totalCost = hhCost + trustCost + jisaCost
      const totalQty  = hhQty + trustQty + jisaQty

      data.push({
        yearMonth: ym,
        totalCost,
        totalQty,
        avgPrice,
      })
    }

    res.status(200).json(data)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
