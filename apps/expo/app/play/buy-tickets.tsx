import React from 'react'
import { BuyTicketsScreen } from 'app/features/play/BuyTicketsScreen'
import { Stack } from 'expo-router'

export default function BuyTickets() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Buy Tickets',
        }}
      />
      <BuyTicketsScreen />
    </>
  )
}
