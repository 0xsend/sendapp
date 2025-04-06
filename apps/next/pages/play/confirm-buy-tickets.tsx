import { ConfirmBuyTicketsScreen } from 'app/features/play/ConfirmBuyTicketsScreen'
import { HomeLayout } from 'app/features/home/layout.web' // Assuming HomeLayout is appropriate
import { TopNav } from 'app/components/TopNav' // Assuming TopNav is needed
import type React from 'react' // Import React for type

// Removed NextPageWithLayout type
const ConfirmBuyTicketsPage = () => {
  return <ConfirmBuyTicketsScreen />
}

// Apply the layout, similar to other pages
// Explicitly type 'page' parameter
ConfirmBuyTicketsPage.getLayout = (page: React.ReactElement) => (
  <HomeLayout TopNav={<TopNav header="Confirm Purchase" showLogo={true} />}>{page}</HomeLayout>
)

export default ConfirmBuyTicketsPage
