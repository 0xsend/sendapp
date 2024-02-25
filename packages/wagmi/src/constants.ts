import BaseEntrypointSimulations from '@my/contracts/out/EntryPointSimulations.sol/EntryPointSimulations.json'

/**
 * The first Send snapshot block
 */
export const SEND_SNAPSHOT_1 = BigInt(18251966)

// Export only the bytecode object to try and save space.
export const entryPointSimulationsBytecode = BaseEntrypointSimulations.bytecode.object
