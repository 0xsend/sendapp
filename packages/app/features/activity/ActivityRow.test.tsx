import { describe, expect, it } from '@jest/globals'
import { config } from '@my/ui'
import { TamaguiProvider } from '@tamagui/web'
import { render, screen } from '@testing-library/react-native'
import { EventSchema } from 'app/utils/zod/activity'
import { ActivityRow } from './ActivityRow'
import {
  mockReceivedTransfer,
  mockReferral,
  mockTagReceipt,
} from './utils/__mocks__/mock-activity-feed'

const bigboss = {
  // user has id so it's the authenticated user
  id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
  name: 'Big Boss',
  avatar_url: 'https://avatars.githubusercontent.com/u/95193764?v=4',
  send_id: 1337,
  tags: ['bigboss'],
}

const alice = {
  // user has no id so it's not the authenticated user
  id: null,
  name: 'Alice',
  avatar_url: 'https://i.pravatar.cc/500?u=alice',
  send_id: 42,
  tags: ['alice'],
}

describe('ActivityRow', () => {
  it('should render send account transfers event when received and sender is not a send app user', () => {
    const activity = EventSchema.parse(mockReceivedTransfer)
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityRow activity={activity} />
      </TamaguiProvider>
    )
    expect(screen.getByText('Received')).toBeOnTheScreen()
    expect(screen.getByText('0.019032 USDC')).toBeOnTheScreen()
    expect(screen.getByText('0x760E2928C3aa3aF87897bE52eb4833d42bbB27cf')).toBeOnTheScreen() // show senders address if not a send app user
  })

  it('should render send account transfers event when sent and receiver is a send app user', () => {
    const activity = EventSchema.parse(mockReceivedTransfer)
    activity.from_user = bigboss
    activity.to_user = alice
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityRow activity={activity} />
      </TamaguiProvider>
    )
    // expect(screen.getByText('Alice')).toBeOnTheScreen() // should we show the user's name?
    expect(screen.getByText('Sent')).toBeOnTheScreen()
    expect(screen.getByText('0.019032 USDC')).toBeOnTheScreen()
    expect(screen.getByText('/alice')).toBeOnTheScreen() // shows receivers first tag
  })

  it('should render send account transfers event when received and sender is a send app user', () => {
    const activity = EventSchema.parse(mockReceivedTransfer)
    activity.from_user = alice
    activity.to_user = bigboss
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityRow activity={activity} />
      </TamaguiProvider>
    )
    expect(screen.getByText('Received')).toBeOnTheScreen()
    expect(screen.getByText('0.019032 USDC')).toBeOnTheScreen() // show senders address if not a send app user
    expect(screen.getByText('/alice')).toBeOnTheScreen() // shows senders first tag
  })

  it('should render tag receipts event', () => {
    const activity = EventSchema.parse(mockTagReceipt)
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityRow activity={activity} />
      </TamaguiProvider>
    )
    expect(screen.getByText('Sendtag Registered')).toBeOnTheScreen()
    expect(screen.getByText('/yuw')).toBeOnTheScreen()
    expect(screen.getByText('0.02 ETH')).toBeOnTheScreen()
  })

  it('should render referrals event', () => {
    const activity = EventSchema.parse(mockReferral)
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityRow activity={activity} />
      </TamaguiProvider>
    )
    expect(screen.getByText('Referral')).toBeOnTheScreen()
    expect(screen.getByText('/disconnect_whorl7351')).toBeOnTheScreen()
    expect(screen.getByTestId('ActivityRowAmount')).toHaveTextContent('1 Referrals')
  })

  it('should render referred by event', () => {
    const activity = EventSchema.parse(mockReferral)
    activity.from_user = mockReferral.to_user
    activity.to_user = mockReferral.from_user
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <ActivityRow activity={activity} />
      </TamaguiProvider>
    )
    expect(screen.getByText('Referred By')).toBeOnTheScreen()
    expect(screen.getByText('/disconnect_whorl7351')).toBeOnTheScreen()
    expect(screen.getByTestId('ActivityRowAmount')).toBeEmptyElement()
  })
})
