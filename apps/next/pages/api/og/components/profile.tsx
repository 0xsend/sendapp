import type { Database } from '@my/supabase/database.types'
import type React from 'react'

export async function loadGoogleFont(font: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)

  if (resource) {
    const response = await fetch(resource[1])
    if (response.status === 200) {
      return await response.arrayBuffer()
    }
  }

  throw new Error('failed to load font data')
}
export const profileReactElement = (
  profile: Database['public']['Functions']['profile_lookup']['Returns'][number]
): React.ReactElement => {
  const avatarUrl =
    profile.avatar_url ??
    `https://ghassets.send.app/app_images/auth_image_${Math.floor(Math.random() * 3) + 1}.jpg`

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      }}
    >
      <img
        src={avatarUrl}
        alt="Profile Avatar Background"
        width={1200}
        height={630}
        loading="lazy"
        style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          filter: 'blur(40px)',
          WebkitFilter: 'blur(40px)',
        }}
      />
      <img
        src={avatarUrl}
        alt="Profile Avatar"
        width={630}
        height={630}
        loading="lazy"
        style={{
          position: 'absolute',
          height: 630,
          width: 630,
          objectFit: 'cover',
          objectPosition: 'center',
          right: '0%',
          top: '0%',
        }}
      />
      {/* Avatar with fallback pattern matching profile screen */}
      <div
        style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          backgroundImage: 'linear-gradient(180deg, transparent 0%, black 100%)',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '80px',
          paddingBottom: '40px',
        }}
      >
        {/* Name */}
        <h2
          style={{
            fontSize: '98px',
            textAlign: 'center',
            maxWidth: '1000px',
            color: 'white',
            fontWeight: 700,
          }}
        >
          {profile.name || ''}
        </h2>

        {/* Tag */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
          {profile?.all_tags
            ? profile.all_tags.map((tag) => {
                return (
                  <div
                    key={tag}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(102, 102, 102, 0.4)',
                      padding: '12px',
                      alignSelf: 'flex-start',
                      backdropFilter: 'blur(40px)',
                      WebkitBackdropFilter: 'blur(40px)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '32px',
                        color: 'white',
                        fontWeight: 400,

                        margin: 0,
                      }}
                    >
                      /{tag}
                    </p>
                  </div>
                )
              })
            : null}
        </div>

        {/* Bio/About */}
        {profile.about ? (
          <p
            style={{
              fontSize: '48px',
              color: 'rgba(255, 255, 255)',
              margin: '0',
              maxWidth: '800px',
              fontWeight: 600,
            }}
          >
            {profile.about.length > 100 ? `${profile.about.substring(0, 100)}...` : profile.about}
          </p>
        ) : null}
      </div>

      {/* Branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '48px',
          color: '#fff',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          fontWeight: 700,
        }}
      >
        /send
      </div>
    </div>
  )
}
