import { H1, H3, H4, H5, Link, Paragraph, Separator, YStack } from '@my/ui'
import { IconNote } from 'app/components/icons'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useQuery } from '@tanstack/react-query'
import type { Tables } from '@my/supabase/database.types'

export const BackupScreen = () => {
  return (
    <YStack w={'100%'} als={'center'} gap={'$6'}>
      <YStack w={'100%'} gap={'$2'}>
        <H1 size={'$8'} fontWeight={'300'} color={'$color05'}>
          Backup Send Account
        </H1>
        <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
          Backup your Send Account by adding more passkeys to your account. Passkeys are authorized
          devices that can sign transactions for your account.
        </Paragraph>
      </YStack>
      <Separator w={'100%'} />
      <WebauthnCreds />
    </YStack>
  )
}

const WebauthnCreds = () => {
  const supabase = useSupabase()
  const { data, error } = useQuery({
    queryKey: ['webauthn_credentials'],
    queryFn: async () => {
      const { data, error } = await supabase.from('webauthn_credentials').select('*')
      if (error) {
        throw new Error(error.message)
      }
      return data
    },
  })

  return (
    <YStack w={'100%'} gap={'$2'}>
      <H3 size={'$6'} fontWeight={'300'} color={'$color05'}>
        Passkeys
      </H3>
      <YStack w={'100%'}>
        {error && (
          <YStack w={'100%'} gap={'$6'}>
            <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
              {error.message}
            </Paragraph>
          </YStack>
        )}
        {data && data.length === 0 && (
          <YStack w={'100%'} gap={'$6'}>
            <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
              You have no Webauthn Credentials.
            </Paragraph>
            <Link
              href="https://info.send.it/send/mission-vision-and-values"
              target="_blank"
              display="flex"
              alignItems="center"
              gap="2"
              color="$color12"
            >
              <IconNote size="1.5" />
              <Paragraph size={'$6'} fontWeight={'300'} color={'$color05'}>
                Learn more about Webauthn
              </Paragraph>
            </Link>
          </YStack>
        )}
      </YStack>
      {data && data.length > 0 && (
        <YStack w={'100%'} gap={'$6'}>
          {data.map((cred) => (
            <WebauthnCredential key={cred.id} {...{ cred }} />
          ))}
        </YStack>
      )}
    </YStack>
  )
}

const WebauthnCredential = ({ cred }: { cred: Tables<'webauthn_credentials'> }) => {
  return (
    <YStack w={'100%'} gap={'$3'} mt={'$2'} mb={'$2'}>
      <H4 fontWeight={'300'} color={'$color05'}>
        {cred.display_name}
      </H4>
      <H5 fontWeight={'300'} color={'$color05'}>
        Created At
      </H5>
      <Paragraph fontWeight={'300'} color={'$color05'}>
        {cred.created_at}
      </Paragraph>
      <Separator w={'100%'} />
    </YStack>
  )
}
