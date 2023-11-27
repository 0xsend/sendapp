import { Container } from "@my/ui";
import { MainFooter } from "./footer";

const MainLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Container>
      {children}
      <MainFooter />
    </Container>
  )
}

export { MainLayout };