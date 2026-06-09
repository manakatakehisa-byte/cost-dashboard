import { getSheetData, toNum, toYearMonth, toYear } from '../../lib/sheets'

export default async function handler(req, res) {
  try {
    const sheetName = process.env.DIRECT_SHEET_NAME || '直入庫コスト'
    const rows = await getSheetData(sheetName)

    if (rows.length < 2) return res.status(200).json({ debug: 'rows < 2', rowCount: rows.length })

    const header = rows[0]
    const firstRow = rows[1]

    return res.status(200).json({ header, firstRow, rowCount: rows.length })

  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
