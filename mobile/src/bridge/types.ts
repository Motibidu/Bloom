export interface BridgeContact {
  name?: string
  phone?: string
}

export type WebToNativeMsg =
  | { type: 'REQUEST_CONTACTS'; requestId: string }
  | { type: 'REQUEST_CAMERA'; requestId: string }
  | { type: 'REQUEST_PUSH_TOKEN'; requestId: string }

export type NativeToWebMsg =
  | { type: 'CONTACTS_RESULT'; requestId: string; payload: BridgeContact[] }
  | { type: 'CAMERA_RESULT'; requestId: string; payload: string }
  | { type: 'PUSH_TOKEN_RESULT'; requestId: string; payload: string }
  | { type: 'BRIDGE_ERROR'; requestId: string; error: string }
