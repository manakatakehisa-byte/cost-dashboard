import { google } from 'googleapis'

export async function getSheetsClient() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || ''
  
  let privateKey = rawKey
  if (!privateKey.includes('\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }
  
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
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

export function toNum(v) {
  if (v === undefined || v === null || v === '') return 0
  const n = parseFloat(String(v).replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

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
