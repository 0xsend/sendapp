import { expect, test } from "@jest/globals";
import { TamaguiProvider, config } from "@my/ui";
import { render } from "@testing-library/react-native";
import { DashboardScreen } from "./screen";

jest.mock("app/utils/useUser", () => ({
	useUser: jest.fn().mockReturnValue({
		user: {
			id: "123",
			profile: { referral_code: "123" },
		},
	}),
}));

jest.mock("app/routers/params", () => ({
	useNav: jest.fn().mockReturnValue([undefined, jest.fn()]),
}));

jest.mock("wagmi", () => ({
	useAccount: jest.fn().mockReturnValue({
		address: "0x123",
		isConnected: false,
	}),
	useConnect: jest.fn().mockReturnValue({
		connectAsync: jest.fn(),
	}),
	useDisconnect: jest.fn().mockReturnValue({
		disconnect: jest.fn(),
	}),
}));

jest.mock("app/utils/getReferralLink", () => ({
	getReferralHref: jest.fn().mockReturnValue("https://send.it/123"),
	getXPostHref: jest.fn().mockReturnValue("https://send.it/123"),
}));

jest.mock("solito/link", () => ({
	Link: jest.fn(),
	useLink: jest.fn().mockReturnValue({
		href: "https://send.it/123",
	}),
}));

jest.mock("app/utils/UseUserReferralsCount", () => ({
	useUserReferralsCount: jest.fn().mockReturnValue(123),
}));

jest.mock("app/utils/useChainAddresses", () => ({
	useChainAddresses: jest.fn().mockReturnValue({
		data: [{ address: "0x123" }],
		isLoading: false,
	}),
}));

jest.mock("app/utils/useSendBalance", () => ({
	useSendBalance: jest.fn().mockReturnValue({
		data: { value: "123" },
		isLoading: false,
	}),
}));

jest.mock("app/utils/coin-gecko", () => ({
	useSendPrice: jest.fn().mockReturnValue({
		data: 123,
		isLoading: false,
	}),
}));

jest.mock("app/utils/tags", () => ({
	useConfirmedTags: jest.fn().mockReturnValue([
		{
			created_at: "2021-08-30T20:26:44.000Z",
			name: "123",
			status: "confirmed",
			user_id: "123",
		},
	]),
}));

test("DashboardScreen", () => {
	const tree = render(
		<TamaguiProvider defaultTheme={"dark"} config={config}>
			<DashboardScreen />
		</TamaguiProvider>,
	).toJSON();
	expect(tree).toMatchSnapshot();
});
