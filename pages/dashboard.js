import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import InspectionTab from '../components/InspectionTab'
import DirectTab from '../components/DirectTab'
import ComparisonTab from '../components/ComparisonTab'

export default function Dashboard() {
  const router = useRouter()
  const [tab, setTab] = useState('inspection')
  const [inspData, setInspData] = useState([])
  const [directData, setDirectData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 認証チェック
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('auth')
      if (auth !== 'ok') router.push('/')
    }
  }, [router])

  // データ取得
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [r1, r2] = await Promise.all([
          fetch('/api/inspection'),
          fetch('/api/direct'),
        ])
        if (!r1.ok || !r2.ok) throw new Error('データの取得に失敗しました')
        const [d1, d2] = await Promise.all([r1.json(), r2.json()])
        if (d1.error) throw new Error(d1.error)
        if (d2.error) throw new Error(d2.error)
        setInspData(d1)
        setDirectData(d2)
      } catch (e) {
        setError(e.message)
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('auth')
    router.push('/')
  }

  const handleRefresh = async () => {
    setLoading(true)
    setError('')
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/inspection'),
        fetch('/api/direct'),
      ])
      const [d1, d2] = await Promise.all([r1.json(), r2.json()])
      setInspData(d1)
      setDirectData(d2)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">コストダッシュボード</h1>
              <p className="text-slate-400 text-xs">スプレッドシート自動連携</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm transition disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              {loading ? '読込中...' : '更新'}
            </button>
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm transition"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* タブ */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex gap-0">
            {[
              { id: 'inspection', label: '🔍 検品コスト', desc: '工場・検品会社別' },
              { id: 'direct',     label: '📦 直入庫コスト', desc: '工場別' },
              { id: 'comparison', label: '📊 コスト比較', desc: '工場別比較' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>{t.label}</div>
                <div className="text-xs font-normal text-slate-400">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            ⚠️ {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-bounce">📊</div>
              <p className="text-slate-500">データを読み込んでいます...</p>
            </div>
          </div>
        ) : (
          <>
            {tab === 'inspection' && <InspectionTab data={inspData} />}
            {tab === 'direct'     && <DirectTab     data={directData} />}
             {tab === 'comparison' && <ComparisonTab inspData={inspData} directData={directData} />}
          </>
        )}
      </main>
    </div>
  )
}
