import { Anchor, Avatar, Button, Card, Container, H1, Paragraph, XStack, YStack, Dialog, ScrollView, ListItem, Theme } from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { Image } from '@my/ui'
import { MainLayout } from 'app/components/layout';
import { useState } from 'react';
import { CommentsTime } from 'app/utils/dateHelper';
import { IconEthereum, IconUSDC, IconSend, IconArrowDown, IconClose, IconDeposit, IconReceive, IconSendTile } from 'app/components/icons';
import { Square } from 'tamagui'

export function HomeScreen() {
  const { resolvedTheme } = useThemeSetting()
  let USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const [expandBalance, setExpandBalance] = useState(false)

  const actionButtons = [
    { label: "Deposit", iconPNGPath: <IconDeposit />, href: "/" },
    { label: "Recieve", iconPNGPath: <IconReceive />, href: "/" },
    { label: "Send", iconPNGPath: <IconSendTile />, href: "/checkout" }
  ]
  const balanceViewButtons = [
    { label: "Ethereum", onPress: (e: any) => { } },
    { label: "Cards", onPress: (e: any) => { } }
  ]
  const transactions = [
    {
      user: {
        sendTag: 'ethantree'
      },
      type: 'inbound',
      amount: 200,
      currency: 'USDT',
      amountInUSD: 199.98,
      created_on: ''
    },
    {
      user: {
        sendTag: 'You'
      },
      type: 'outbound',
      amount: 1,
      currency: 'ETH',
      amountInUSD: 1985.56,
      created_on: ''
    },
    {
      user: {
        sendTag: 'You'
      },
      type: 'outbound',
      amount: 1,
      currency: 'ETH',
      amountInUSD: 1985.56,
      created_on: ''
    },
    {
      user: {
        sendTag: 'You'
      },
      type: 'outbound',
      amount: 1,
      currency: 'ETH',
      amountInUSD: 1985.56,
      created_on: ''
    }
  ]
  const balanceDetails = [
    {
      currency: "Ethereum",
      symbol: "eth",
      balance: 1.45
    },
    {
      currency: "USDC",
      symbol: "usdc",
      balance: 125
    },
    {
      currency: "SEND",
      symbol: "send",
      balance: 71454457
    },
    {
      currency: "SEND",
      symbol: "send",
      balance: 4412
    },
    {
      currency: "USDC",
      symbol: "usdc",
      balance: 2.0
    }
  ]
  return (
    <>
      <MainLayout scrollable={true}>
        <Theme name="send">
          <Container >
            <YStack $gtLg={{ width: 600 }} $sm={{ width: '100vw' }} $gtSm={{ width: '100vw' }} ai={"center"} paddingTop={"$6"} gap={"$space.6"}>
              {/* Balance Card */}
              <XStack w={"90%"} ai={"center"} jc={"space-between"} zIndex={4}>
                <Card cur={"pointer"} w={"100%"} h={"$13"} borderRadius={"$8"} shadowColor={"rgba(0, 0, 0, 0.1)"} shadowOffset={{ width: 0, height: 4 }} shadowRadius={8} shadowOpacity={0.1} onPress={() => { !expandBalance && setExpandBalance(!expandBalance) }}>
                  <YStack m={"$3"}>
                    <XStack jc={"flex-end"} height={"$2.5"} zIndex={5}>
                      {!expandBalance && <IconArrowDown />}
                    </XStack>
                    <YStack ai={"center"} jc={"center"}>
                      <Paragraph color={"$primary"} fontSize={"$4"} zIndex={1}>Total Balance</Paragraph>
                      <XStack style={{ color: "white" }}>
                        <Paragraph color={"$light"} fontSize={"$6"} zIndex={1}>{"$"}</Paragraph>
                        <Paragraph fontWeight={"700"} color={"$light"} fontSize={"$10"} lineHeight={"$8"} zIndex={1} p={"$1"}>{USDollar.format(6990).replace('$', '').split(".")[0]}</Paragraph>
                        <Paragraph color={"$light"} fontSize={"$6"} zIndex={1}>{".00"}</Paragraph>
                      </XStack>
                    </YStack>
                  </YStack>
                  <Card.Background borderRadius={"$8"} backgroundColor={resolvedTheme?.startsWith('dark') ? "rgb(0,0,0,1)" : "$khaki900"}>
                    {/* <Image source={{ uri: './balanceCard.png' }} width={"100%"} height={"100%"} /> */}
                  </Card.Background>
                </Card>
              </XStack>
              {expandBalance && <YStack position={"absolute"} top={210} left={0} width={"100%"} height={"100%"}
                backgroundColor={resolvedTheme?.startsWith('dark') ? "rgb(0,0,0,0.1)" : "rgb(255,255,255,0.1"} style={{ backdropFilter: 'blur(15px)' }}
                zIndex={3} alignItems='center' >
                <Card cur={"pointer"} w={"90%"} h={"$18"} borderRadius={"$8"} shadowColor={"rgba(0, 0, 0, 0.3)"} shadowOffset={{ width: 0, height: 4 }} shadowRadius={8} shadowOpacity={0.1} overflow={"scroll"} paddingVertical={"$3"} paddingBottom={"$7"}>
                  <ScrollView zi={4} bc={"transparent"}>
                    <YStack m={"$1"}>
                      {balanceDetails.map(balance => (<ListItem bc={"transparent"}>
                        <XStack f={1} h={"100%"} paddingLeft={"$3"} paddingRight={"$3"} paddingTop={"$2"} alignItems='center' jc={"space-between"} zi={4} >
                          <XStack alignItems='center' jc={"space-between"} gap={"$2"}>
                            {(balance.currency === "Ethereum" ? <IconEthereum size={30} /> : (balance.currency === "USDC" ? <IconUSDC size={30} /> : <IconSend size={30} />))}
                            <Paragraph size={"$4"} fontWeight={"400"} color={"$white"}>{`${balance.currency}`}
                            </Paragraph>
                          </XStack>
                          <Paragraph size={"$3"} fontWeight={"400"} color={"$white"}>{`${balance.balance}`}</Paragraph>
                        </XStack></ListItem>))}
                    </YStack>
                  </ScrollView>
                  <Card.Background borderRadius={"$8"} backgroundColor={resolvedTheme?.startsWith('dark') ? "rgb(0,0,0,1)" : "$khaki900"}>
                    {/* <Image source={{ uri: './balanceCard.png' }} width={"100%"} height={"100%"} /> */}
                  </Card.Background>
                </Card>
                <YStack width={"$3"} height={"$3"} mt={"$4"} onPress={() => setExpandBalance(false)}>
                  <IconClose color={"$gray10"} />
                </YStack>
              </YStack>}

              {/* D-R-S Buttons */}
              <XStack w={"90%"} ai={"center"} jc={"space-evenly"} gap={"$4"}>
                {actionButtons.map(actionButton => <YStack f={1} w={"inherit"} gap={"$2"}>
                  <Card f={1} h={"$12"} borderRadius={"$8"} $sm={{ height: "$10" }} shadowColor={"rgba(0, 0, 0, 0.1)"} shadowOffset={{ width: 0, height: 4 }} shadowRadius={8} shadowOpacity={0.1} onPress={() => window.location.pathname = actionButton.href}>
                    <XStack f={1} alignItems={"center"} justifyContent={"center"} zIndex={2}>
                      {actionButton.iconPNGPath}
                    </XStack>
                    <Card.Background borderRadius={"$8"} backgrounded backgroundColor={resolvedTheme?.startsWith('dark') ? "$cinereous" : "white"}>
                    </Card.Background>
                  </Card>
                  <Paragraph textAlign={"center"} color={resolvedTheme?.startsWith('dark') ? "$primary" : ""}>{actionButton.label}</Paragraph>
                </YStack>)}
              </XStack>
              {/* Etheruem-Cards Buttons */}
              <XStack w={"90%"} ai={"center"} jc={"space-evenly"} gap={"$2"}>
                {balanceViewButtons.map(balanceViewButton => {
                  return (
                    <Button
                      f={1}
                      br={"$radius.true"}
                      bw={"$0.5"}
                      borderColor={"rgba(195, 171, 142, 0.3)"}
                      bg={"transparent"}
                      shadowColor={"rgba(0, 0, 0, 0.1)"}
                      shadowOffset={{ width: 0, height: 4 }}
                      shadowRadius={8}
                      shadowOpacity={0.1}
                      onPress={balanceViewButton.onPress}><Paragraph
                        color={"$primary"}
                        fontWeight={"700"}>{balanceViewButton.label}</Paragraph>
                    </Button>
                  )
                })}
              </XStack>
              {/* Transactions */}
              <YStack w={"90%"} gap={"$3"} mb={"$7"}>
                <XStack jc={"space-between"}>
                  <Paragraph opacity={0.6}>{"TRANSACTIONS"}</Paragraph>
                  <Anchor color={"$primary"}>See All</Anchor>
                </XStack>
                {transactions.map(transaction =>
                  <Card
                    h={"$6"}
                    borderRadius={"$4"}
                    shadowColor={"rgba(0, 0, 0, 0.1)"}
                    shadowOffset={{ width: 0, height: 4 }}
                    shadowRadius={8}
                    shadowOpacity={0.1}
                    backgroundColor={resolvedTheme?.startsWith('dark') ? "$cinereous" : "white"}>
                    <XStack h={"inherit"} ai="center" padding={"$2"} paddingRight={"$3"}>
                      <Avatar br={"$4"} size={"$4.5"}>
                        <Square size={"$2"} backgroundColor="$color" elevation="$4" />
                        <Avatar.Fallback theme={"gold"} />
                      </Avatar>
                      <YStack f={1} >
                        <XStack f={1} h={"Inherit"} paddingLeft={"$3"} paddingTop={"$2"} alignItems='center' jc={"space-between"}>
                          <XStack alignItems='center' jc={"space-between"} gap={"$2"}>
                            <Paragraph size={"$4"} fontWeight={"400"} color={"$primary"}>{transaction.user.sendTag}
                            </Paragraph>
                            <Avatar size={"$s16"}>
                              {transaction.type == 'inbound' ? <IconReceive /> : <IconSendTile />}
                            </Avatar>
                          </XStack>
                          <Paragraph size={"$3"} fontWeight={"400"}>{`${transaction.amount} ${transaction.currency} (${USDollar.format(transaction.amountInUSD)})`}</Paragraph>
                        </XStack>
                        <XStack f={1} h={"Inherit"} alignItems='center' jc={"flex-end"}>
                          <Paragraph opacity={0.6} size={"$1"} fontWeight={"400"}>{CommentsTime(new Date)}</Paragraph>
                        </XStack>
                      </YStack>
                    </XStack>
                  </Card>
                )}
              </YStack>
            </YStack>
          </Container >
        </Theme>
      </MainLayout >
    </>
  )
}
