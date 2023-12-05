import { useState } from 'react'
import { Adapt, Button, Dialog, Sheet, XStack, YStack, Card, Paragraph, Avatar, Image } from 'tamagui'
import { useThemeSetting } from '@tamagui/next-theme'

export function BalanceCard() {
	let USDollar = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	});
	const [open, setOpen] = useState(false)
	const { resolvedTheme } = useThemeSetting()
	return (

		<Dialog
			modal
			onOpenChange={(open) => {
				setOpen(open)
			}}
		>
			<Dialog.Trigger asChild>
				<XStack w={"90%"} ai={"center"} jc={"space-between"}>
					<Card cur={"pointer"} w={"100%"} h={"$13"} borderRadius={"$8"} shadowColor={"rgba(0, 0, 0, 0.1)"} shadowOffset={{ width: 0, height: 4 }} shadowRadius={8} shadowOpacity={0.1} zIndex={100000}>
						<YStack m={"$3"}>
							<XStack jc={"flex-end"}>
								<Avatar size={"$2.5"}>
									<Avatar.Image src={"./arrowDown.png"}></Avatar.Image>
								</Avatar>
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
							<Image source={{ uri: './balanceCard.png' }} width={"100%"} height={"100%"} />
						</Card.Background>
					</Card>
				</XStack>
			</Dialog.Trigger>
			<Adapt when="sm" platform="touch">

				<Sheet animation="medium" zIndex={200000} modal dismissOnSnapToBottom>

					<Sheet.Frame padding="$4" gap="$4">

						<Adapt.Contents />

					</Sheet.Frame>

					<Sheet.Overlay
						animation="lazy"
						enterStyle={{ opacity: 0 }}
						exitStyle={{ opacity: 0 }}
					/>

				</Sheet>

			</Adapt>
			<Dialog.Portal >

				<Dialog.Overlay
					key="overlay"
					animation="quick"
					opacity={0.5}
					enterStyle={{ opacity: 0 }}
					exitStyle={{ opacity: 0 }}
				/>
				<Dialog.Content
					bordered
					elevate
					key="content"
					animateOnly={['transform', 'opacity']}
					animation={[
						'quick',
						{
							opacity: {
								overshootClamping: true,
							},
						},
					]}
					w={"30%"}
					enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
					exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
					gap="$4"
				>
					<BalanceCard />

				</Dialog.Content>

			</Dialog.Portal>

		</Dialog>

	)

}
