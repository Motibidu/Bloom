import { useRef, useEffect } from 'react'
import { SafeAreaView, StyleSheet, StatusBar, BackHandler } from 'react-native'
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview'
import Constants from 'expo-constants'
import { handleBridgeMessage } from './src/bridge/handler'
import { WebToNativeMsg } from './src/bridge/types'

const WEBVIEW_URL = (Constants.expoConfig?.extra?.webviewUrl as string | undefined) ?? 'http://172.30.1.78:5173'

export default function App() {
  const webViewRef = useRef<WebView>(null)
  const canGoBackRef = useRef(false)

  const sendToWeb = (message: object) => {
    webViewRef.current?.postMessage(JSON.stringify(message))
  }

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as WebToNativeMsg
      handleBridgeMessage(msg, sendToWeb)
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    canGoBackRef.current = navState.canGoBack
  }

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current) {
        webViewRef.current?.goBack()
        return true // 이벤트 소비 — 앱 종료 막음
      }
      return false // 히스토리 없으면 앱 종료 허용
    })
    return () => handler.remove()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEBVIEW_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        sharedCookiesEnabled
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
})
