import React, { useCallback, useEffect, useState } from 'react';
import {
  View, TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  Switch,
  StyleSheet,
  Button,
  SafeAreaView,
  Alert, Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Fontisto } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import * as Location from 'expo-location';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const API_KEY = '784ab24ff2ed5d94d4288abed9e25d13';
const Separator = () => <View style={styles.separator} />;

const icons = {
  Clouds: 'cloudy',
  Clear: 'day-sunny',
  Atmosphere: 'cloudy-gusts',
  Snow: 'snow',
  Rain: 'rains',
  Drizzle: 'rain',
  Thunderstorm: 'lightning',
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [city, setCity] = useState('Loading...');
  const [day, setDay] = useState(null);
  const [ok, setOk] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('blue');

  const fetchWithTimeout = async (url, options = {}) => {
    const { timeout = 8000 } = options;
  
    try {
      const response = await Promise.race([
        fetch(url),
        new Promise((_, reject) => setTimeout(() => {
          
          reject(new Error('Timeout'));
        }, timeout)
        )
      ]);
      const data = response.text();
      if (data === 'welcome') {
        // 응답이 'welcome'이면 배경색을 파란색으로 변경
        setBackgroundColor('blue');
      }
    } catch (error) {
      console.error('Fetch operation error:', error);
    }
  };
  
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync(Entypo.font);
        // Fetch weather data
        await getWeather();
        // 추가: http://192.168.4.1/ 주소로 HTTP 요청 보내기
        await fetchWithTimeout('http://192.168.4.1/', { timeout: 1000 });
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);
  
  const sendRequest = (url, callback) => {
    
      fetch(url, { method: 'GET' })
        .then(response => {
          if (response.ok) {
            return response.text(); // or response.json() based on the server response format
          }
          throw new Error('Network response was not ok.');
        })
        .then(data => {
          console.log(data);
          if (callback) {
            callback(data);
          }
        })
        .catch(error => {
          console.error('There has been a problem with your fetch operation:', error);
        });
    
  };
  
  useEffect(() => {
    async function checkServer() {
      try {
        // Send a request to http://192.168.4.1/ and handle the response
        const response = await fetch('http://192.168.4.1/');
        const data = await response.text(); // Convert response to text
        if (data === 'welcome') {
          // If response is 'welcome', change the background color to blue
          setBackgroundColor('blue');
        }
      } catch (e) {
        console.warn(e);
      }
    }
    checkServer();
  }, []);

  const getWeather = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      setOk(false);
      return;
    }
    const {
      coords: { latitude, longitude },
    } = await Location.getCurrentPositionAsync({ accuracy: 5 });

    const location = await Location.reverseGeocodeAsync(
      { latitude, longitude },
      { useGoogleMaps: false }
    );
    setCity(location[0].city);

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=alerts,minutely,hourly,daily&appid=${API_KEY}&units=metric`
    );

    const json = await response.json();
    setDay(json.current);
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const toggleSwitch = () => {
    if (!isEnabled) {
      sendRequest('http://192.168.4.1/On', (response) => {
        if (response === 'up') {
          setIsEnabled(true);
        }
      });
    } else {sendRequest('http://192.168.4.1/Off', (response) => {
      if (response === 'down') {
        setIsEnabled(false);
      }
    });
    }
  };

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor }]} onLayout={onLayoutRootView}>

      <StatusBar style="light" />
      <SafeAreaView >
        <Text style={styles.title}></Text>
        <View style={styles.city}></View>
        <View style={styles.city}>
          <Text style={styles.cityName}>{city}</Text>
        </View>
        <View style={styles.weather}>
          {!day ? (
            <View style={{ ...styles.day, alignItems: 'center' }}>
              <ActivityIndicator
                color="white"
                style={{ marginTop: 10 }}
                size="large"
              />
            </View>
          ) : (
            <View style={styles.day}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={styles.temp}>
                  {parseFloat(day.temp).toFixed(1)}
                </Text>
                <Fontisto
                  name={icons[day.weather[0].main]}
                  size={68}
                  color="white"
                />
              </View>

              <Text style={styles.description}>{day.weather[0].main}</Text>
              <Text style={styles.tinyText}>{day.weather[0].description}</Text>
            </View>
          )}
        </View>
        <View style={[styles.button, { marginTop: 50 ,marginBottom :20}]}>
          <Text style={{ color: 'white', fontWeight: 200,marginBottom :20 }}>GYRO MODE</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>
        <View style={styles.container}>
          <Text style={styles.title}>Remote your Umbrella</Text>


          <View style={styles.Row}>
            <TouchableOpacity
              style={styles.buttonBox}
              onPress={() => {sendRequest('http://192.168.4.1/forward')
              }}
            >
              <Text style={styles.buttonText}>up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonBox}
              onPress={() => {
                sendRequest('http://192.168.4.1/backward')                
              }}
            >
              <Text style={styles.buttonText}>down</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonBox}
              onPress={() => {
                sendRequest('http://192.168.4.1/stop')      
              }}
            >
              <Text style={styles.buttonText}>stop</Text>
            </TouchableOpacity>
          </View>
          <View><Text style={styles.title}>SPEED</Text></View>
          <View style={styles.Row}>
          <TouchableOpacity
              style={styles.buttonBox}
              onPress={() => {  sendRequest('http://192.168.4.1/speedup')
              }}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonBox}
              onPress={() => {  sendRequest('http://192.168.4.1/speeddown')
              }}
            >
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.Row}>
          <TouchableOpacity
              style={styles.buttonBox}
              onPress={() => {  sendRequest('http://192.168.4.1/max')
              }}
            >
              <Text style={styles.buttonText}>max</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonBox}
              onPress={() => {  sendRequest('http://192.168.4.1/medium')
              }}
            >
              <Text style={styles.buttonText}>medium</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    marginVertical: 8,
    color: 'white',
  },

  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  Row: {
    flexDirection: 'row', // Align children in a row
    justifyContent: 'center', // Center buttons in the row
    alignItems: 'center', // Center buttons vertically
    marginVertical: 10, // Add vertical margin for spacing between rows
  },
  uttonRow: {
    flexDirection: 'row', // 버튼들을 가로로 배치합니다.
    justifyContent: 'space-between', // 버튼들 사이에 공간을 균등하게 배치합니다.
  },
  buttonBox: {
    paddingVertical: 20, // Vertical padding
    paddingHorizontal: 30, // Horizontal padding
    backgroundColor: '#007bff', // A nice shade of blue
    borderRadius: 20, // Rounded corners
    marginHorizontal: 10, // Horizontal margin for spacing between buttons
    elevation: 3, // Add shadow for Android (optional)
    // For iOS shadow (optional)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  buttonText: {
    color: '#ffffff', // White text color
    fontWeight: 'bold', // Bold font weight
    fontSize: 16, // Increase font size for better readability
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'blue',
  },
  city: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityName: {
    fontSize: 58,
    fontWeight: '500',
    color: 'white',
  },
  weather: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  temp: {
    marginTop: 50,
    fontWeight: '600',
    fontSize: 100,
    color: 'white',
  },
  description: {
    marginTop: -10,
    fontSize: 30,
    color: 'white',
    fontWeight: '500',
  },
  tinyText: {
    marginTop: -5,
    fontSize: 25,
    color: 'white',
    fontWeight: '500',
  },
});