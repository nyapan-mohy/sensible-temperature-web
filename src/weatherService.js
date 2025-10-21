// Open-Meteo APIを使用して気温データを取得
export async function fetchWeatherData(latitude, longitude) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const startDate = weekAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&timezone=Asia/Tokyo&start_date=${startDate}&end_date=${endDate}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('気象データの取得に失敗しました');
  }

  return await response.json();
}

// 現在の気温を取得
export function getCurrentTemperature(weatherData) {
  const temps = weatherData.hourly.temperature_2m;
  return temps[temps.length - 1]; // 最新の気温
}

// 過去N時間の平均気温を計算
export function getAverageTemperature(weatherData, hoursAgo) {
  const temps = weatherData.hourly.temperature_2m;
  const currentIndex = temps.length - 1;
  const startIndex = Math.max(0, currentIndex - hoursAgo);

  const relevantTemps = temps.slice(startIndex, currentIndex);
  const sum = relevantTemps.reduce((acc, temp) => acc + temp, 0);

  return sum / relevantTemps.length;
}

// 相対的な温度変化を計算
export function calculateRelativeChange(current, past) {
  return current - past;
}

// 変化の程度を判定
export function getChangeLevel(change) {
  const absChange = Math.abs(change);

  if (absChange < 2) {
    return { level: 'minimal', label: 'ほぼ同じ' };
  } else if (absChange < 5) {
    return { level: 'moderate', label: change > 0 ? 'やや暖かい' : 'やや寒い' };
  } else if (absChange < 8) {
    return { level: 'significant', label: change > 0 ? '暖かい' : '寒い' };
  } else {
    return { level: 'extreme', label: change > 0 ? 'かなり暖かい' : 'かなり寒い' };
  }
}

// 位置情報を取得
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('位置情報がサポートされていません'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}
