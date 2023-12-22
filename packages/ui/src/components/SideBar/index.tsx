import { YStack } from "@my/ui";


export const SideBar = ({ children }: { children?: React.ReactNode }) => {
  return (
    <YStack $md={{ display: "none" }} height={'100svh'} width={"20%"} py="$6" zIndex={1} justifyContent="space-around" alignItems="center" backgroundColor={"$backgroundHover"}>
      {children}
    </YStack>
  )
}