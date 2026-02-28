import { safeStorage } from 'electron'
import Store from 'electron-store'

interface StoredCredential {
  naverId: string
  naverPwEncrypted: string // Base64 인코딩된 암호화 버퍼
}

const store = new Store<StoredCredential>({
  name: 'credentials',
  defaults: {
    naverId: '',
    naverPwEncrypted: ''
  }
})

export function saveCredential(credential: { id: string; password: string }): void {
  store.set('naverId', credential.id)

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(credential.password)
    store.set('naverPwEncrypted', encrypted.toString('base64'))
  } else {
    // safeStorage 사용 불가 시 경고 (보안 약화)
    console.warn('safeStorage 사용 불가 - 비밀번호가 안전하지 않게 저장됩니다')
    store.set('naverPwEncrypted', Buffer.from(credential.password).toString('base64'))
  }
}

export function getCredential(): { id: string; hasPassword: boolean } {
  return {
    id: store.get('naverId') || '',
    hasPassword: !!store.get('naverPwEncrypted')
  }
}

// Main Process 내부에서만 사용 (Renderer에 노출 금지)
export function decryptPassword(): string {
  const encrypted = store.get('naverPwEncrypted')
  if (!encrypted) return ''

  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
  } else {
    return Buffer.from(encrypted, 'base64').toString('utf-8')
  }
}
