import { useState, useEffect } from 'react'
import {
  fetchWeatherData,
  getCurrentTemperature,
  getAverageTemperature,
  calculateRelativeChange,
  getChangeLevel,
  getTodayHighLow,
  getAverageHighLow,
  getClothingAdvice,
  getUserLocation
} from './weatherService'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTemp, setCurrentTemp] = useState(null)
  const [todayHighLow, setTodayHighLow] = useState(null)
  const [comparisons, setComparisons] = useState([])
  const [clothingAdvice, setClothingAdvice] = useState([])
  const [location, setLocation] = useState(null)
  const [coordinates, setCoordinates] = useState(null)

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
        const userLocation = await getUserLocation()
        coords = userLocation
        setLocation('現在地')
        setCoordinates({
          lat: userLocation.latitude.toFixed(4),
          lon: userLocation.longitude.toFixed(4),
          accuracy: userLocation.accuracy ? Math.round(userLocation.accuracy) : null
        })
      } catch (locError) {
        setLocation('東京（デフォルト）')
        setCoordinates({
          lat: coords.latitude.toFixed(4),
          lon: coords.longitude.toFixed(4),
          accuracy: null
        })
        console.log('位置情報の取得に失敗しました。東京のデータを表示します。', locError.message)
      }

      // 気象データを取得
      const weatherData = await fetchWeatherData(coords.latitude, coords.longitude)

      // 現在の気温
      const current = getCurrentTemperature(weatherData)
      setCurrentTemp(current)

      // 今日の最高気温・最低気温
      const todayHL = getTodayHighLow(weatherData)
      setTodayHighLow(todayHL)

      // 各期間との比較
      const periods = [
        { hours: 24, days: 1, label: '昨日' },
        { hours: 72, days: 3, label: '3日前' },
        { hours: 168, days: 7, label: '1週間前' }
      ]

      const comparisonData = periods.map(period => {
        const avgTemp = getAverageTemperature(weatherData, period.hours)
        const avgHL = getAverageHighLow(weatherData, period.days)
        const change = calculateRelativeChange(current, avgTemp)
        const changeInfo = getChangeLevel(change)

        return {
          period: period.label,
          avgTemp: avgTemp.toFixed(1),
          avgHigh: avgHL.high.toFixed(1),
          avgLow: avgHL.low.toFixed(1),
          change: change.toFixed(1),
          ...changeInfo
        }
      })

      setComparisons(comparisonData)

      // 服装アドバイス（過去3日間との比較）
      const past3DaysAvg = getAverageHighLow(weatherData, 3)
      const advice = getClothingAdvice(todayHL, past3DaysAvg, current)
      setClothingAdvice(advice)

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
          {coordinates && (
            <p className="coordinates">
              {coordinates.lat}, {coordinates.lon}
              {coordinates.accuracy && (
                <span className="accuracy"> (精度: ±{coordinates.accuracy}m)</span>
              )}
            </p>
          )}
        </div>

        <div className="current-temp">
          <div className="temp-value">{currentTemp.toFixed(1)}°C</div>
          <div className="temp-label">現在の気温</div>
          {todayHighLow && (
            <div className="high-low">
              <span className="high">最高 {todayHighLow.high.toFixed(1)}°C</span>
              <span className="separator">|</span>
              <span className="low">最低 {todayHighLow.low.toFixed(1)}°C</span>
            </div>
          )}
        </div>

        {clothingAdvice.length > 0 && (
          <div className="clothing-advice">
            <h2>今日の服装アドバイス</h2>
            <div className="advice-list">
              {clothingAdvice.map((advice, index) => (
                <div key={index} className="advice-item">
                  <span className="advice-icon">👔</span>
                  <span className="advice-text">{advice}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="comparisons">
          <h2>過去との比較</h2>
          {comparisons.map((comp, index) => (
            <div key={index} className={`comparison-item ${comp.level}`}>
              <div className="comparison-header">
                <span className="period">{comp.period}と比べて</span>
                <span className="change-label">{comp.label}</span>
              </div>
              <div className="comparison-details">
                <div className="temp-info">
                  <span className="avg-temp">平均: {comp.avgTemp}°C</span>
                  <span className="high-low-small">最高: {comp.avgHigh}°C / 最低: {comp.avgLow}°C</span>
                </div>
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
