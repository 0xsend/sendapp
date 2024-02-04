import { test } from '@jest/globals'
import { webauthnCredToXY } from './webauthnCredToXY'

test('webauthnCredToXY', () => {
  const webauthnCred = {
    public_key:
      '\\xa5010203262001215820b6e8e41d1a431531b66dadab8554f5520b4bad5ce194aa5cb5c51017606e8eb5225820e0b99efdbfdd12821b58b9fce4c9694443d02e9f366a05a5a6868e2d581382c4',
  }
  const result = webauthnCredToXY(webauthnCred)
  expect(result).toBe([
    '0xb6e8e41d1a431531b66dadab8554f5520b4bad5ce194aa5cb5c51017606e8eb5',
    '0xe0b99efdbfdd12821b58b9fce4c9694443d02e9f366a05a5a6868e2d581382c4',
  ])
})
