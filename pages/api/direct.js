import { getSheetData, toNum, toYearMonth, toYear } from '../../lib/sheets'

export default async function handler(req, res) {
  try {
    const sheetName = process.env.DIRECT_SHEET_NAME || '直入庫コスト'
    const rows = await getSheetData(sheetName)

    if (rows.length < 3) return res.status(200).json([])

    // 1行目が空なので2行目をヘッダーとして使う
    // 列は固定: A=報告日 B=工場名 C=品番 D=納品数 E=総計 F=良品数 G=検品会社 H=梱包費 I=差額 J=BASE K=内職 L=検品 M=アウトレット N=破棄費 O=アウト保管 P=バーコード Q=差額（検品会社）
    const col = {
      date:          0,  // A
      factory:       1,  // B
      itemCode:      2,  // C
      deliveryQty:   3,  // D
      totalQty:      4,  // E
      goodQty:       5,  // F
      inspector:     6,  // G
      packCost:      7,  // H
      diff:          8,  // I
      base:          9,  // J
      inspFee:       11, // L
      diffInspector: 16, // Q
    }

    const data = []
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i]
      const rawDate = r[col.date] || ''
      const ym = toYearMonth(rawDate)
      const year = toYear(rawDate)
      if (!ym && !year) continue

      const totalQty      = toNum(r[col.totalQty])
      const goodQty       = toNum(r[col.goodQty])
      const inspFee       = toNum(r[col.inspFee])
      const packCost      = toNum(r[col.packCost])
      const base          = toNum(r[col.base])
      const diff          = toNum(r[col.diff])
      const diffInspector = toNum(r[col.diffInspector])

      const inspVsBase    = inspFee - base
      const packVsBase    = packCost - base
      const inspPackTotal = inspFee + packCost
      const inspPackDiff  = inspPackTotal - base

      const perPcsInsp = totalQty > 0 ? inspFee / totalQty : 0
      const perPcsPack = totalQty > 0 ? packCost / totalQty : 0

      data.push({
        yearMonth: ym,
        year,
        factory:       r[col.factory] || '',
        itemCode:      r[col.itemCode] || '',
        inspector:     r[col.inspector] || '',
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
