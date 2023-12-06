/**
 * This file is loaded in the browser before the tests are run. It mocks the WebAuthn API and exposes a WebAuthnAuthenticator object on the window.
 */
import * as utils from './utils';
export { utils };
/**
 * Install the WebAuthn authenticator mock in the browser. This is a helper function to be used in Playwright tests.
 */
export declare function installWebAuthnMock({ exposedCreateCredFuncName, exposedGetCredFuncName, }?: {
    exposedCreateCredFuncName?: string;
    exposedGetCredFuncName?: string;
}): void;
