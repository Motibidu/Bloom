import { useRef, useEffect, useCallback } from 'react'
import { SafeAreaView, StyleSheet, StatusBar, BackHandler } from 'react-native'
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { handleBridgeMessage } from './src/bridge/handler'
import { WebToNativeMsg } from './src/bridge/types'

const WEBVIEW_URL = (Constants.expoConfig?.extra?.webviewUrl as string | undefined) ?? 'http://172.30.1.78:5173'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export default function App() {
  const webViewRef = useRef<WebView>(null)
  const canGoBackRef = useRef(false)

  const sendToWeb = useCallback((message: object) => {
    webViewRef.current?.postMessage(JSON.stringify(message))
  }, [])

  const fcmTokenRef = useRef<string | null>(null)

  const registerFcmToken = useCallback(async () => {
    try {
      console.log('[fcm] registerFcmToken 시작')
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      })
      console.log('[fcm] 권한 상태:', status)
      if (status !== 'granted') return
      const tokenData = await Notifications.getDevicePushTokenAsync()
      console.log('[fcm] 토큰 발급:', tokenData.data)
      fcmTokenRef.current = tokenData.data as string
    } catch (e) {
      console.error('[fcm] 토큰 발급 실패:', e)
    }
  }, [])

  const tokenInjectedRef = useRef(false)

  const injectFcmToken = useCallback(() => {
    const token = fcmTokenRef.current
    if (!token || tokenInjectedRef.current) return
    tokenInjectedRef.current = true
    const js = `
      (function() {
        window.__nativeFcmToken = ${JSON.stringify(token)};
        window.dispatchEvent(new CustomEvent('native-fcm-token', { detail: ${JSON.stringify(token)} }));
      })();
      true;
    `
    webViewRef.current?.injectJavaScript(js)
    console.log('[fcm] 웹뷰에 토큰 주입 완료')
  }, [])

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as WebToNativeMsg
      handleBridgeMessage(msg, sendToWeb, fcmTokenRef)
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    canGoBackRef.current = navState.canGoBack
  }

  useEffect(() => {
    registerFcmToken()
  }, [registerFcmToken])

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
        onLoadEnd={injectFcmToken}
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
