import { useState, useEffect } from 'react'
import {
  fetchWeatherData,
  getCurrentTemperature,
  getAverageTemperature,
  calculateRelativeChange,
  getChangeLevel,
  getUserLocation
} from './weatherService'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTemp, setCurrentTemp] = useState(null)
  const [comparisons, setComparisons] = useState([])
  const [location, setLocation] = useState(null)

  useEffect(() => {
    loadWeatherData()
  }, [])

  async function loadWeatherData() {
    try {
      setLoading(true)
      setError(null)

      // 位置情報を取得（デフォルトは東京）
      let coords = { latitude: 35.6762, longitude: 139.6503 } // 東京

      try {
        coords = await getUserLocation()
        setLocation('現在地')
      } catch (locError) {
        setLocation('東京（デフォルト）')
        console.log('位置情報の取得に失敗しました。東京のデータを表示します。')
      }

      // 気象データを取得
      const weatherData = await fetchWeatherData(coords.latitude, coords.longitude)

      // 現在の気温
      const current = getCurrentTemperature(weatherData)
      setCurrentTemp(current)

      // 各期間との比較
      const periods = [
        { hours: 24, label: '昨日' },
        { hours: 72, label: '3日前' },
        { hours: 168, label: '1週間前' }
      ]

      const comparisonData = periods.map(period => {
        const avgTemp = getAverageTemperature(weatherData, period.hours)
        const change = calculateRelativeChange(current, avgTemp)
        const changeInfo = getChangeLevel(change)

        return {
          period: period.label,
          avgTemp: avgTemp.toFixed(1),
          change: change.toFixed(1),
          ...changeInfo
        }
      })

      setComparisons(comparisonData)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="card loading-card">
          <div className="spinner"></div>
          <p>気温データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="card error-card">
          <h2>エラー</h2>
          <p>{error}</p>
          <button onClick={loadWeatherData}>再試行</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="card">
        <div className="header">
          <h1>相対体感温度</h1>
          <p className="location">{location}</p>
        </div>

        <div className="current-temp">
          <div className="temp-value">{currentTemp.toFixed(1)}°C</div>
          <div className="temp-label">現在の気温</div>
        </div>

        <div className="comparisons">
          <h2>過去との比較</h2>
          {comparisons.map((comp, index) => (
            <div key={index} className={`comparison-item ${comp.level}`}>
              <div className="comparison-header">
                <span className="period">{comp.period}と比べて</span>
                <span className="change-label">{comp.label}</span>
              </div>
              <div className="comparison-details">
                <span className="avg-temp">{comp.period}の平均: {comp.avgTemp}°C</span>
                <span className={`change-value ${comp.change >= 0 ? 'warmer' : 'colder'}`}>
                  {comp.change >= 0 ? '+' : ''}{comp.change}°C
                </span>
              </div>
            </div>
          ))}
        </div>

        <button className="refresh-button" onClick={loadWeatherData}>
          更新
        </button>
      </div>
    </div>
  )
}

export default App
