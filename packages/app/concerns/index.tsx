import type React from 'react'
import { OnboardedConcern } from './OnboardedConcern'
import { SendV0TokenUpgradeScreen } from 'app/features/send-token-upgrade/screen'
import { MaintenanceModeScreen } from 'app/features/maintenance-mode/screen'

const compose = (providers: React.FC<{ children: React.ReactNode }>[]) =>
  providers.reduce((Prev, Curr) => ({ children }) => {
    const Provider = Prev ? (
      <Prev>
        <Curr>{children}</Curr>
      </Prev>
    ) : (
      <Curr>{children}</Curr>
    )
    return Provider
  })

/**
 * A list of concerns that are used to wrap the app.
 * These concerns are used to wrap the app in a specific way.
 *
 * For example, the OnboardedConcern is used to ensure that the user is onboarded before rendering the children.
 *
 * The concerns are ordered from the most important to the least important.
 */
export const Concerns = compose([MaintenanceModeScreen, OnboardedConcern, SendV0TokenUpgradeScreen])
