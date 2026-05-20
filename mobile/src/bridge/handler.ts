import { MutableRefObject } from 'react'
import * as Contacts from 'expo-contacts'
import * as ImagePicker from 'expo-image-picker'
import { BridgeContact, NativeToWebMsg, WebToNativeMsg } from './types'

export async function handleBridgeMessage(
  msg: WebToNativeMsg,
  sendToWeb: (response: NativeToWebMsg) => void,
  fcmTokenRef?: MutableRefObject<string | null>,
): Promise<void> {
  const { requestId } = msg

  try {
    switch (msg.type) {
      case 'REQUEST_CONTACTS': {
        const { status } = await Contacts.requestPermissionsAsync()
        if (status !== 'granted') {
          sendToWeb({ type: 'BRIDGE_ERROR', requestId, error: '연락처 권한이 거부되었습니다' })
          return
        }
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        })
        const contacts: BridgeContact[] = data.map((c) => ({
          name: c.name,
          phone: c.phoneNumbers?.[0]?.number,
        }))
        sendToWeb({ type: 'CONTACTS_RESULT', requestId, payload: contacts })
        break
      }

      case 'REQUEST_CAMERA': {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          sendToWeb({ type: 'BRIDGE_ERROR', requestId, error: '카메라 권한이 거부되었습니다' })
          return
        }
        const result = await ImagePicker.launchCameraAsync({
          base64: true,
          quality: 0.8,
          allowsEditing: false,
        })
        if (result.canceled || !result.assets[0]?.base64) {
          sendToWeb({ type: 'BRIDGE_ERROR', requestId, error: '촬영이 취소되었습니다' })
          return
        }
        sendToWeb({ type: 'CAMERA_RESULT', requestId, payload: result.assets[0].base64 })
        break
      }

      case 'REQUEST_PUSH_TOKEN': {
        // 앱 시작 시 미리 발급된 토큰을 즉시 응답
        const cachedToken = fcmTokenRef?.current
        if (cachedToken) {
          sendToWeb({ type: 'PUSH_TOKEN_RESULT', requestId, payload: cachedToken })
        } else {
          sendToWeb({ type: 'BRIDGE_ERROR', requestId, error: 'FCM 토큰 준비 중입니다. 잠시 후 다시 시도해주세요.' })
        }
        break
      }

      default: {
        const _exhaustive: never = msg
        void _exhaustive
        sendToWeb({ type: 'BRIDGE_ERROR', requestId, error: '알 수 없는 메시지 타입' })
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다'
    sendToWeb({ type: 'BRIDGE_ERROR', requestId, error: message })
  }
}
