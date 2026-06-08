import { google } from 'googleapis'

export async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  return google.sheets({ version: 'v4', auth })
}

export async function getSheetData(sheetName) {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: `${sheetName}!A1:Z10000`,
  })
  return res.data.values || []
}

// 数値変換（空や文字列を安全に処理）
export function toNum(v) {
  if (v === undefined || v === null || v === '') return 0
  const n = parseFloat(String(v).replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

// 年月を "YYYY/MM" 形式で返す
export function toYearMonth(dateStr) {
  if (!dateStr) return null
  const parts = String(dateStr).split('/')
  if (parts.length < 2) return null
  return `${parts[0]}/${parts[1].padStart(2, '0')}`
}

export function toYear(dateStr) {
  if (!dateStr) return null
  return String(dateStr).split('/')[0]
}
