# Temporal Workflows

## How to develop Workflow logic

Workflow logic is constrained by deterministic execution requirements. Therefore, each language is limited to the use of certain idiomatic techniques. However, each Temporal SDK provides a set of APIs that can be used inside your Workflow to interact with external (to the Workflow) application code.

In the Temporal TypeScript SDK, Workflows run in a deterministic sandboxed environment. The code is bundled on Worker creation using Webpack, and can import any package as long as it does not reference Node.js or DOM APIs.

> [!NOTE]
> If you must use a library that references a Node.js or DOM API and you are certain that those APIs are not used at runtime, add that module to the ignoreModules list.

The Workflow sandbox can run only deterministic code, so side effects and access to external state must be done through Activities because Activity outputs are recorded in the Event History and can read deterministically by the Workflow.

This limitation also means that Workflow code cannot directly import the [Activity Definition](https://docs.temporal.io/activities#activity-definition). [Activity Types](https://docs.temporal.io/activities#activity-type) can be imported, so they can be invoked in a type-safe manner.

To make the Workflow runtime deterministic, functions like `Math.random()`, `Date`, and `setTimeout()` are replaced by deterministic versions.

[FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry) and [WeakRef](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef) are removed because v8's garbage collector is not deterministic.

- **Workflows require one file**: you can organize Workflow code however you like, but each Worker needs to reference a single file that exports all the Workflows it handles (so you have to handle name conflicts instead of us)
- **Activities are top level**:
  - Inside the Temporal Worker, Activities are registered at the same level Workflows are.
  - Since Activities are required, not bundled, Activities don't need to be exported in a single file.
    Just make sure they are registered with some Workers if you intend them to be executed.
  - You can organize activities however you like, but it is important to understand that activities don't "belong" to workflows as far as Temporal is concerned.

## Testing

```sh
yarn test
```

Temporal has a great resource on testing: [Test suites](https://docs.temporal.io/develop/typescript/testing-suite). The Testing section of the Temporal Application development guide describes the frameworks that facilitate Workflow and integration testing.

In the context of Temporal, you can create these types of automated tests:

End-to-end: Running a Temporal Server and Worker with all its Workflows and Activities; starting and interacting with Workflows from a Client.
Integration: Anything between end-to-end and unit testing.
Running Activities with mocked Context and other SDK imports (and usually network requests).
Running Workers with mock Activities, and using a Client to start Workflows.
Running Workflows with mocked SDK imports.
Unit: Running a piece of Workflow or Activity code (a function or method) and mocking any code it calls.
We generally recommend writing the majority of your tests as integration tests.

Because the test server supports skipping time, use the test server for both end-to-end and integration tests with Workers.

Tests are written using [jest](https://jestjs.io/docs/getting-started) and [ts-jest](https://kulshekhar.github.io/ts-jest/docs/).

Temporal runs tests in an in-memory environment. When testing workflows, you can use the `TestWorkflowEnvironment` to run tests against a local Temporal server. This is useful for testing workflows that interact with external services or databases. You can also mock activities. Do note, that if you miss an activity for a workflow, the test will fail with a timeout.

### Coverage

A coverage report is generated when running tests using `nyc` and `@temporalio/nyc-test-coverage`. For now, it requires a patch to [`istanbul-lib-coverage`](../../.yarn/patches/istanbul-lib-coverage-npm-3.2.2-5c0526e059.patch) to support generating coverage reports. See [this issue](https://github.com/temporalio/sdk-typescript/issues/1233#issuecomment-2211603638) for more details.
