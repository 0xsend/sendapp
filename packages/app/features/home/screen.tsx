// import { createPasskey, signWithPasskey } from '@daimo/expo-passkeys'
import { Button, H4, ScrollView, Spinner, Theme, XStack, YStack } from "@my/ui";
import { HomeHeader } from "app/components/HomeHeader";
import { IconArrowRight } from "app/components/icons";
import { shorten } from "app/utils/strings";
import { useChainAddresses } from "app/utils/useChainAddresses";
import { useLink } from "solito/link";
import {
	SendBalanceCard,
	SendUsdBalanceCard,
} from "./components/SendBalanceCard";
import { SendTagsCard } from "./components/SendTagsCard";

export function DashboardScreen() {
	return (
		<ScrollView
			f={3}
			fb={0}
			$theme-light={{ backgroundColor: "#F0EEE9" }}
			$theme-dark={{ backgroundColor: "#292929" }}
		>
			<YStack gap="$6" pt="$5" pb="$8" px="$8">
				<YStack gap="$8">
					<HomeHeader>Dashboard</HomeHeader>

					<AccountSection />
				</YStack>
			</YStack>
		</ScrollView>
	);
}

const AccountSection = () => {
	const { data: addresses, isLoading } = useChainAddresses();
	const address = addresses?.[0]?.address; // possible since only one address is supported for now
	const etherscanLink = useLink({
		href: `https://etherscan.io/address/${address}`,
	});

	return (
		<YStack gap="$4">
			<XStack px="$4.5" ai="center" gap="$2" jc="space-between" mb="$4">
				<H4 fontWeight="400">Your Account</H4>
				<Theme name="alt2">
					{!address || isLoading ? (
						<Spinner color="$color" />
					) : (
						<Button
							size="$2"
							chromeless
							{...etherscanLink}
							iconAfter={IconArrowRight}
						>
							{shorten(address)}
						</Button>
					)}
				</Theme>
			</XStack>

			<XStack
				flexWrap="wrap"
				ai="flex-start"
				jc="flex-start"
				px="$4"
				gap="$8"
				mb="$4"
			>
				<SendBalanceCard address={address} />
				<SendUsdBalanceCard address={address} />
				<SendTagsCard />
			</XStack>
		</YStack>
	);
};
