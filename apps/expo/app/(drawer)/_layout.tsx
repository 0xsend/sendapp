import { Drawer } from 'expo-router/drawer'

export default function Layout() {
  return <Drawer drawerContent={ProfileScreen} />
}

function ProfileScreen() {
  return <></>
}
