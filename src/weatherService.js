// Open-Meteo APIを使用して気温データを取得
export async function fetchWeatherData(latitude, longitude) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const startDate = weekAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Tokyo&start_date=${startDate}&end_date=${endDate}`;

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

// 今日の最高気温・最低気温を取得
export function getTodayHighLow(weatherData) {
  const dailyMax = weatherData.daily.temperature_2m_max;
  const dailyMin = weatherData.daily.temperature_2m_min;

  return {
    high: dailyMax[dailyMax.length - 1],
    low: dailyMin[dailyMin.length - 1]
  };
}

// 過去N日間の平均最高気温・最低気温を計算
export function getAverageHighLow(weatherData, daysAgo) {
  const dailyMax = weatherData.daily.temperature_2m_max;
  const dailyMin = weatherData.daily.temperature_2m_min;

  const currentIndex = dailyMax.length - 1;
  const startIndex = Math.max(0, currentIndex - daysAgo);

  const relevantMaxTemps = dailyMax.slice(startIndex, currentIndex);
  const relevantMinTemps = dailyMin.slice(startIndex, currentIndex);

  const avgHigh = relevantMaxTemps.reduce((acc, temp) => acc + temp, 0) / relevantMaxTemps.length;
  const avgLow = relevantMinTemps.reduce((acc, temp) => acc + temp, 0) / relevantMinTemps.length;

  return { high: avgHigh, low: avgLow };
}

// 服装アドバイスを生成
export function getClothingAdvice(todayHighLow, pastAvgHighLow, currentTemp) {
  const advice = [];

  // 今日の温度差（日中の変化）
  const todayRange = todayHighLow.high - todayHighLow.low;

  // 過去との比較
  const highDiff = todayHighLow.high - pastAvgHighLow.high;
  const lowDiff = todayHighLow.low - pastAvgHighLow.low;

  // 日中の温度変化が大きい場合
  if (todayRange > 10) {
    advice.push('日中の気温差が大きいので、脱ぎ着しやすい服装がおすすめです');
  }

  // 過去と比較して寒い場合
  if (highDiff < -3 || lowDiff < -3) {
    if (todayRange > 8) {
      advice.push('朝晩は冷えるので、上着を持っていくと良いでしょう');
    } else {
      advice.push('いつもより寒く感じそうです。暖かい服装がおすすめです');
    }
  }

  // 過去と比較して暑い場合
  if (highDiff > 3 || lowDiff > 3) {
    if (todayRange > 8) {
      advice.push('日中は暖かくなりそうです。薄手の上着で調整できると良いでしょう');
    } else {
      advice.push('いつもより暖かく感じそうです。薄着でも大丈夫そうです');
    }
  }

  // 現在の気温と最高気温の差
  const tempRiseExpected = todayHighLow.high - currentTemp;
  if (tempRiseExpected > 8) {
    advice.push('これから気温が上がりそうです。調整しやすい服装で');
  }

  // アドバイスがない場合
  if (advice.length === 0) {
    advice.push('いつも通りの服装で快適に過ごせそうです');
  }

  return advice;
}

// 位置情報を取得
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('位置情報がサポートされていません'));
      return;
    }

    const options = {
      enableHighAccuracy: true, // 高精度モード（GPS使用）
      timeout: 10000, // 10秒でタイムアウト
      maximumAge: 0 // キャッシュを使わない
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy // 精度情報も返す
        });
      },
      (error) => {
        // エラーの種類に応じたメッセージ
        let errorMessage = '位置情報の取得に失敗しました';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置情報の使用が拒否されました';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置情報が利用できません';
            break;
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました';
            break;
        }
        reject(new Error(errorMessage));
      },
      options
    );
  });
}
