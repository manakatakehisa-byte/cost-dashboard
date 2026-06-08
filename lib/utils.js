// 数値をカンマ区切りでフォーマット
export function fmt(n, decimals = 0) {
  if (n === null || n === undefined || isNaN(n)) return '-'
  return Number(n).toLocaleString('ja-JP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// 差額に色クラスを付ける（正=緑、負=赤）
export function diffColor(n) {
  if (n > 0) return 'text-emerald-600 font-semibold'
  if (n < 0) return 'text-red-500 font-semibold'
  return 'text-slate-500'
}

// データをキーでグループ化して各フィールドを合計する
export function groupAndSum(data, groupKey, sumFields) {
  const map = {}
  for (const row of data) {
    const key = Array.isArray(groupKey)
      ? groupKey.map(k => row[k]).join('__')
      : row[groupKey]
    if (!key) continue
    if (!map[key]) {
      map[key] = { _key: key }
      if (Array.isArray(groupKey)) {
        groupKey.forEach(k => { map[key][k] = row[k] })
      } else {
        map[key][groupKey] = row[groupKey]
      }
      sumFields.forEach(f => { map[key][f] = 0 })
    }
    sumFields.forEach(f => { map[key][f] += (row[f] || 0) })
  }
  return Object.values(map)
}

// 月リスト（ソート済み）
export function getMonths(data) {
  return [...new Set(data.map(d => d.yearMonth).filter(Boolean))].sort()
}

// 年リスト（ソート済み）
export function getYears(data) {
  return [...new Set(data.map(d => d.year).filter(Boolean))].sort()
}
