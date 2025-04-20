import { test, expect } from '@jest/globals'
import { webauthnCredToXY } from './webauthnCredToXY'

const cases: readonly { public_key: `0x${string}` | `\\x${string}` }[] = [
  {
    public_key:
      '\\xA5010203262001215820A08FE292CFE1867023A102A00A24DED5E2E1F361131608F8FC8F5FE47E1611232258209ECFD876549B7319912462B41D586712DE05878273C07213F067DC071045B3B2',
  },
  {
    public_key:
      '\\xA50102032620012158207AC341F075485C00352DA1787DD43EFDA3E2863A5A02ECE911FCD450C0E32763225820DE4F1BA9155EDFF9B8A940C2965996688DA677B33197EF901E1EB64E940EABC7',
  },
  {
    public_key:
      '\\xA5010203262001215820C2639C1972D41AB9D8C3A612A1A01E5DA9D081B9D133E870B55F2E5DBF751390225820AD1A3FA2ABF6E9F9C0F754F5FE7C3B0E39E29EC7054B4C84189CFB7D2FB69A95',
  },
  {
    public_key:
      '\\xA5010203262001215820F2417BB22991C68C353891DCD87F7F5FA367F38B01C6325EDD3D7D78CDCFD26F225820ED51BFB06621110BB1AEB876B2F9CAA231FD6ABDE9A06E4B0C48439D992111E2',
  },
  {
    public_key:
      '\\xA50102032620012158203FC451AAC5EF23B00A69CA99D05EB867A341805B5C7A185C2CFB9FE8CAB243E222582064CF2E70D1AD809D5BE5D0D79F29A234D9943491B9E8DA4B093E77A4A43DE90A',
  },
  {
    public_key:
      '\\xa5010203262001215820b6e8e41d1a431531b66dadab8554f5520b4bad5ce194aa5cb5c51017606e8eb5225820e0b99efdbfdd12821b58b9fce4c9694443d02e9f366a05a5a6868e2d581382c4',
  },
] as const

const expected = [
  [
    '0xa08fe292cfe1867023a102a00a24ded5e2e1f361131608f8fc8f5fe47e161123',
    '0x9ecfd876549b7319912462b41d586712de05878273c07213f067dc071045b3b2',
  ],
  [
    '0x7ac341f075485c00352da1787dd43efda3e2863a5a02ece911fcd450c0e32763',
    '0xde4f1ba9155edff9b8a940c2965996688da677b33197ef901e1eb64e940eabc7',
  ],
  [
    '0xc2639c1972d41ab9d8c3a612a1a01e5da9d081b9d133e870b55f2e5dbf751390',
    '0xad1a3fa2abf6e9f9c0f754f5fe7c3b0e39e29ec7054b4c84189cfb7d2fb69a95',
  ],
  [
    '0xf2417bb22991c68c353891dcd87f7f5fa367f38b01c6325edd3d7d78cdcfd26f',
    '0xed51bfb06621110bb1aeb876b2f9caa231fd6abde9a06e4b0c48439d992111e2',
  ],
  [
    '0x3fc451aac5ef23b00a69ca99d05eb867a341805b5c7a185c2cfb9fe8cab243e2',
    '0x64cf2e70d1ad809d5be5d0d79f29a234d9943491b9e8da4b093e77a4a43de90a',
  ],
  [
    '0xb6e8e41d1a431531b66dadab8554f5520b4bad5ce194aa5cb5c51017606e8eb5',
    '0xe0b99efdbfdd12821b58b9fce4c9694443d02e9f366a05a5a6868e2d581382c4',
  ],
] as const

test('webauthnCredToXY', () => {
  cases.forEach((c, i) => {
    expect(webauthnCredToXY(c)).toEqual(expected[i])
  })

  expect(() => webauthnCredToXY({ public_key: '0x1234567890' })).toThrow()
  expect(() => webauthnCredToXY({ public_key: '\\x1234567890' })).toThrow()
  // @ts-expect-error invalid public_key
  expect(() => webauthnCredToXY({ public_key: 1234567890 })).toThrow()
  // @ts-expect-error invalid public_key
  expect(() => webauthnCredToXY({ public_key: 'zzxxxxaaa' })).toThrow()
  // @ts-expect-error invalid public_key
  expect(() => webauthnCredToXY(undefined)).toThrow()
})
