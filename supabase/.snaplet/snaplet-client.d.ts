type JsonPrimitive = null | number | string | boolean;
type Nested<V> = V | { [s: string]: V | Nested<V> } | Array<V | Nested<V>>;
type Json = Nested<JsonPrimitive>;

type ColumnValueCallbackContext = {
  /**
   * The seed of the field's model.
   *
   * \@example
   * ```ts
   * "<hash>/0/users/0"
   * ```
   */
  modelSeed: string;
  /**
   * The seed of the field.
   *
   * \@example
   * ```ts
   * "<hash>/0/users/0/email"
   * ```
   */
  seed: string;
};

/**
 * helper type to get the possible values of a scalar field
 */
type ColumnValue<T> = T | ((ctx: ColumnValueCallbackContext) => T);

/**
 * helper type to map a record of scalars to a record of ColumnValue
 */
type MapToColumnValue<T> = { [K in keyof T]: ColumnValue<T[K]> };

/**
 * Create an array of `n` models.
 *
 * Can be read as "Generate `model` times `n`".
 *
 * @param `n` The number of models to generate.
 * @param `callbackFn` The `x` function calls the `callbackFn` function one time for each element in the array.
 *
 * @example Generate 10 users:
 * ```ts
 * snaplet.users((x) => x(10));
 * ```
 *
 * @example Generate 3 projects with a specific name:
 * ```ts
 * snaplet.projects((x) => x(3, (index) => ({ name: `Project ${index}` })));
 * ```
 */
declare function xCallbackFn<T>(
  n: number | MinMaxOption,
  callbackFn?: (index: number) => T
): Array<T>;

type ChildCallbackInputs<T> = (
  x: typeof xCallbackFn<T>,
) => Array<T>;

/**
 * all the possible types for a child field
 */
type ChildInputs<T> = Array<T> | ChildCallbackInputs<T>;

/**
 * omit some keys TKeys from a child field
 * @example we remove ExecTask from the Snapshot child field values as we're coming from ExecTask
 * type ExecTaskChildrenInputs<TPath extends string[]> = {
 *   Snapshot: OmitChildInputs<SnapshotChildInputs<[...TPath, "Snapshot"]>, "ExecTask">;
 * };
 */
type OmitChildInputs<T, TKeys extends string> = T extends ChildCallbackInputs<
  infer U
>
  ? ChildCallbackInputs<Omit<U, TKeys>>
  : T extends Array<infer U>
  ? Array<Omit<U, TKeys>>
  : never;

type ConnectCallbackContext<TGraph, TPath extends string[]> = {
  /**
   * The branch of the current iteration for the relationship field.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/generate#branch | documentation}.
   */
  branch: GetBranch<TGraph, TPath>;
  /**
   * The plan's graph.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/generate#graph | documentation}.
   */
  graph: TGraph;
  /**
   * The index of the current iteration.
   */
  index: number;
  /**
   * The seed of the relationship field.
   */
  seed: string;
  /**
   * The plan's store.
   */
  store: Store;
};

/**
 * the callback function we can pass to a parent field to connect it to another model
 * @example
 * snaplet.Post({ User: (ctx) => ({ id: ctx.store.User[0] }) })
 */
type ConnectCallback<T, TGraph, TPath extends string[]> = (
  ctx: ConnectCallbackContext<TGraph, TPath>
) => T;

/**
 * compute the Graph type and the tracked path to pass to the connect callback
 */
type ParentCallbackInputs<T, TPath extends string[]> = TPath extends [
  infer TRoot,
  ...infer TRest extends string[],
]
  ? TRoot extends keyof Graph
    ? MergeGraphParts<Graph[TRoot]> extends infer TGraph
      ? ConnectCallback<T, TGraph, TRest>
      : never
    : never
  : never;

type ParentInputs<T, TPath extends string[]> =
  | T
  | ParentCallbackInputs<T, TPath>;

/**
 * omit some keys TKeys from a parent field
 * @example we remove Member from the Organization and User parent fields values as we're coming from Member
 * type MemberParentsInputs<TPath extends string[]> = {
 *   Organization: OmitParentInputs<OrganizationParentInputs<[...TPath, "Organization"]>, "Member", [...TPath, "Organization"]>;
 *   User: OmitParentInputs<UserParentInputs<[...TPath, "User"]>, "Member", [...TPath, "User"]>;
 * };
 */
type OmitParentInputs<
  T,
  TKeys extends string,
  TPath extends string[],
> = T extends ConnectCallback<infer U, any, any>
  ? ParentCallbackInputs<Omit<U, TKeys>, TPath>
  : Omit<T, TKeys>;

/**
 * compute the inputs type for a given model
 */
type Inputs<TScalars, TParents, TChildren> = Partial<
  MapToColumnValue<TScalars> & TParents & TChildren
>;

type OmitChildGraph<
  T extends Array<unknown>,
  TKeys extends string,
> = T extends Array<
  infer TGraph extends { Scalars: any; Parents: any; Children: any }
>
  ? Array<{
      Scalars: TGraph["Scalars"];
      Parents: TGraph["Parents"];
      Children: Omit<TGraph["Children"], TKeys>;
    }>
  : never;

type OmitParentGraph<
  T extends Array<unknown>,
  TKeys extends string,
> = T extends Array<
  infer TGraph extends { Scalars: any; Parents: any; Children: any }
>
  ? Array<{
      Scalars: TGraph["Scalars"];
      Parents: Omit<TGraph["Parents"], TKeys>;
      Children: TGraph["Children"];
    }>
  : never;

type UnwrapArray<T> = T extends Array<infer U> ? U : T;

type DeepUnwrapKeys<TGraph, TKeys extends any[]> = TKeys extends [
  infer THead,
  ...infer TTail,
]
  ? TTail extends any[]
    ? {
        [P in keyof TGraph]: P extends THead
          ? DeepUnwrapKeys<UnwrapArray<TGraph[P]>, TTail>
          : TGraph[P];
      }
    : TGraph
  : TGraph;

type GetBranch<T, K extends any[]> = T extends Array<infer U>
  ? DeepUnwrapKeys<U, K>
  : T;

type MergeGraphParts<T> = T extends Array<
  infer U extends { Scalars: unknown; Parents: unknown; Children: unknown }
>
  ? Array<
      U["Scalars"] & {
        [K in keyof U["Children"]]: MergeGraphParts<U["Children"][K]>;
      } & {
        [K in keyof U["Parents"]]: MergeGraphParts<
          U["Parents"][K]
        > extends Array<infer TParent>
          ? TParent
          : never;
      }
    >
  : never;

/**
 * the configurable map of models' generate and connect functions
 */
export type UserModels = {
  [KStore in keyof Store]?: Store[KStore] extends Array<
    infer TFields extends Record<string, any>
  >
    ? {
        connect?: (ctx: { store: Store }) => TFields;
        data?: Partial<MapToColumnValue<TFields>>;
      }
    : never;
};

type PlanOptions = {
  /**
   * Connect the missing relationships to one of the corresponding models in the store.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/generate#using-autoconnect-option | documentation}.
   */
  autoConnect?: boolean;
  /**
   * Provide custom data generation and connect functions for this plan.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/generate#using-autoconnect-option | documentation}.
   */
  models?: UserModels;
  /**
   * Pass a custom store instance to use for this plan.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/generate#augmenting-external-data-with-createstore | documentation}.
   */
  store?: StoreInstance;
  /**
   * Use a custom seed for this plan.
   */
  seed?: string;
};

/**
 * the plan is extending PromiseLike so it can be awaited
 * @example
 * await snaplet.User({ name: "John" });
 */
export interface Plan extends PromiseLike<any> {
  generate: (initialStore?: Store) => Promise<Store>;
  /**
   * Compose multiple plans together, injecting the store of the previous plan into the next plan.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/generate#using-pipe | documentation}.
   */
  pipe: Pipe;
  /**
   * Compose multiple plans together, without injecting the store of the previous plan into the next plan.
   * All stores stay independent and are merged together once all the plans are generated.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/generate#using-merge | documentation}.
   */
  merge: Merge;
}

type Pipe = (plans: Plan[], options?: { models?: UserModels, seed?: string }) => Plan;

type Merge = (plans: Plan[], options?: { models?: UserModels, seed?: string }) => Plan;

type StoreInstance<T extends Partial<Store> = {}> = {
  _store: T;
  toSQL: () => string[];
};

type CreateStore = <T extends Partial<Store>>(
  initialData?: T,
  options?: { external: boolean },
) => StoreInstance<T>;
type Store = {
  buckets: Array<bucketsScalars>;
  chainAddresses: Array<chainAddressesScalars>;
  distributionShares: Array<distributionSharesScalars>;
  distributionVerificationValues: Array<distributionVerificationValuesScalars>;
  distributionVerifications: Array<distributionVerificationsScalars>;
  distributions: Array<distributionsScalars>;
  featureInfos: Array<featureInfosScalars>;
  keys: Array<keysScalars>;
  migrations: Array<migrationsScalars>;
  objects: Array<objectsScalars>;
  profiles: Array<profilesScalars>;
  receipts: Array<receiptsScalars>;
  referrals: Array<referralsScalars>;
  authSchemaMigrations: Array<authSchemaMigrationsScalars>;
  supabaseMigrationsSchemaMigrations: Array<supabaseMigrationsSchemaMigrationsScalars>;
  secrets: Array<secretsScalars>;
  sendTransferLogs: Array<sendTransferLogsScalars>;
  tagReceipts: Array<tagReceiptsScalars>;
  tagReservations: Array<tagReservationsScalars>;
  tags: Array<tagsScalars>;
  users: Array<usersScalars>;
};
type aal_levelEnum = "aal1" | "aal2" | "aal3";
type code_challenge_methodEnum = "plain" | "s256";
type factor_statusEnum = "unverified" | "verified";
type factor_typeEnum = "totp" | "webauthn";
type key_statusEnum = "default" | "expired" | "invalid" | "valid";
type key_typeEnum = "aead-det" | "aead-ietf" | "auth" | "generichash" | "hmacsha256" | "hmacsha512" | "kdf" | "secretbox" | "secretstream" | "shorthash" | "stream_xchacha20";
type password_typesEnum = "PASSWORD_TYPE_MD5" | "PASSWORD_TYPE_PLAINTEXT" | "PASSWORD_TYPE_SCRAM_SHA_256";
type pg_tle_featuresEnum = "passcheck";
type tag_statusEnum = "confirmed" | "pending";
type verification_typeEnum = "tag_referral" | "tag_registration";
type bucketsScalars = {
  /**
   * Column `buckets.id`.
   */
  id: string;
  /**
   * Column `buckets.name`.
   */
  name: string;
  /**
   * Column `buckets.owner`.
   */
  owner: string | null;
  /**
   * Column `buckets.created_at`.
   */
  createdAt: string | null;
  /**
   * Column `buckets.updated_at`.
   */
  updatedAt: string | null;
  /**
   * Column `buckets.public`.
   */
  public: boolean | null;
  /**
   * Column `buckets.avif_autodetection`.
   */
  avifAutodetection: boolean | null;
  /**
   * Column `buckets.file_size_limit`.
   */
  fileSizeLimit: number | null;
  /**
   * Column `buckets.allowed_mime_types`.
   */
  allowedMimeTypes: string[] | null;
  /**
   * Column `buckets.owner_id`.
   */
  ownerId: string | null;
}
type bucketsParentsInputs<TPath extends string[]> = {

};
type bucketsChildrenInputs<TPath extends string[]> = {
  /**
  * Relationship from table `buckets` to table `objects` through the column `objects.bucketId`.
  */
  objects: OmitChildInputs<objectsChildInputs<[...TPath, "objects"]>, "bucket" | "bucketId">;
};
type bucketsInputs<TPath extends string[]> = Inputs<
  bucketsScalars,
  bucketsParentsInputs<TPath>,
  bucketsChildrenInputs<TPath>
>;
type bucketsChildInputs<TPath extends string[]> = ChildInputs<bucketsInputs<TPath>>;
type bucketsParentInputs<TPath extends string[]> = ParentInputs<
bucketsInputs<TPath>,
  TPath
>;
type chainAddressesScalars = {
  /**
   * Column `chain_addresses.address`.
   */
  address: string;
  /**
   * Column `chain_addresses.user_id`.
   */
  userId: string;
  /**
   * Column `chain_addresses.created_at`.
   */
  createdAt?: string;
}
type chainAddressesParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `chain_addresses` to table `users` through the column `chain_addresses.userId`.
   */
  user: OmitParentInputs<usersParentInputs<[...TPath, "user"]>, "chainAddresses", [...TPath, "user"]>;
};
type chainAddressesChildrenInputs<TPath extends string[]> = {

};
type chainAddressesInputs<TPath extends string[]> = Inputs<
  chainAddressesScalars,
  chainAddressesParentsInputs<TPath>,
  chainAddressesChildrenInputs<TPath>
>;
type chainAddressesChildInputs<TPath extends string[]> = ChildInputs<chainAddressesInputs<TPath>>;
type chainAddressesParentInputs<TPath extends string[]> = ParentInputs<
chainAddressesInputs<TPath>,
  TPath
>;
type distributionSharesScalars = {
  /**
   * Column `distribution_shares.id`.
   */
  id?: number;
  /**
   * Column `distribution_shares.distribution_id`.
   */
  distributionId: number;
  /**
   * Column `distribution_shares.user_id`.
   */
  userId: string;
  /**
   * Column `distribution_shares.address`.
   */
  address: string;
  /**
   * Column `distribution_shares.amount`.
   */
  amount: number;
  /**
   * Column `distribution_shares.hodler_pool_amount`.
   */
  hodlerPoolAmount: number;
  /**
   * Column `distribution_shares.bonus_pool_amount`.
   */
  bonusPoolAmount: number;
  /**
   * Column `distribution_shares.fixed_pool_amount`.
   */
  fixedPoolAmount: number;
  /**
   * Column `distribution_shares.created_at`.
   */
  createdAt?: string;
  /**
   * Column `distribution_shares.updated_at`.
   */
  updatedAt?: string;
  /**
   * Column `distribution_shares.index`.
   */
  index: number;
}
type distributionSharesParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `distribution_shares` to table `users` through the column `distribution_shares.userId`.
   */
  user: OmitParentInputs<usersParentInputs<[...TPath, "user"]>, "distributionShares", [...TPath, "user"]>;
  /**
   * Relationship from table `distribution_shares` to table `distributions` through the column `distribution_shares.distributionId`.
   */
  distribution: OmitParentInputs<distributionsParentInputs<[...TPath, "distribution"]>, "distributionShares", [...TPath, "distribution"]>;
};
type distributionSharesChildrenInputs<TPath extends string[]> = {

};
type distributionSharesInputs<TPath extends string[]> = Inputs<
  distributionSharesScalars,
  distributionSharesParentsInputs<TPath>,
  distributionSharesChildrenInputs<TPath>
>;
type distributionSharesChildInputs<TPath extends string[]> = ChildInputs<distributionSharesInputs<TPath>>;
type distributionSharesParentInputs<TPath extends string[]> = ParentInputs<
distributionSharesInputs<TPath>,
  TPath
>;
type distributionVerificationValuesScalars = {
  /**
   * Column `distribution_verification_values.type`.
   */
  type: verification_typeEnum;
  /**
   * Column `distribution_verification_values.fixed_value`.
   */
  fixedValue: number;
  /**
   * Column `distribution_verification_values.bips_value`.
   */
  bipsValue: number;
  /**
   * Column `distribution_verification_values.distribution_id`.
   */
  distributionId: number;
  /**
   * Column `distribution_verification_values.created_at`.
   */
  createdAt?: string;
  /**
   * Column `distribution_verification_values.updated_at`.
   */
  updatedAt?: string;
}
type distributionVerificationValuesParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `distribution_verification_values` to table `distributions` through the column `distribution_verification_values.distributionId`.
   */
  distribution: OmitParentInputs<distributionsParentInputs<[...TPath, "distribution"]>, "distributionVerificationValues", [...TPath, "distribution"]>;
};
type distributionVerificationValuesChildrenInputs<TPath extends string[]> = {

};
type distributionVerificationValuesInputs<TPath extends string[]> = Inputs<
  distributionVerificationValuesScalars,
  distributionVerificationValuesParentsInputs<TPath>,
  distributionVerificationValuesChildrenInputs<TPath>
>;
type distributionVerificationValuesChildInputs<TPath extends string[]> = ChildInputs<distributionVerificationValuesInputs<TPath>>;
type distributionVerificationValuesParentInputs<TPath extends string[]> = ParentInputs<
distributionVerificationValuesInputs<TPath>,
  TPath
>;
type distributionVerificationsScalars = {
  /**
   * Column `distribution_verifications.id`.
   */
  id?: number;
  /**
   * Column `distribution_verifications.distribution_id`.
   */
  distributionId: number;
  /**
   * Column `distribution_verifications.user_id`.
   */
  userId: string;
  /**
   * Column `distribution_verifications.type`.
   */
  type: verification_typeEnum;
  /**
   * Column `distribution_verifications.metadata`.
   */
  metadata: Json | null;
  /**
   * Column `distribution_verifications.created_at`.
   */
  createdAt?: string;
}
type distributionVerificationsParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `distribution_verifications` to table `users` through the column `distribution_verifications.userId`.
   */
  user: OmitParentInputs<usersParentInputs<[...TPath, "user"]>, "distributionVerifications", [...TPath, "user"]>;
  /**
   * Relationship from table `distribution_verifications` to table `distributions` through the column `distribution_verifications.distributionId`.
   */
  distribution: OmitParentInputs<distributionsParentInputs<[...TPath, "distribution"]>, "distributionVerifications", [...TPath, "distribution"]>;
};
type distributionVerificationsChildrenInputs<TPath extends string[]> = {

};
type distributionVerificationsInputs<TPath extends string[]> = Inputs<
  distributionVerificationsScalars,
  distributionVerificationsParentsInputs<TPath>,
  distributionVerificationsChildrenInputs<TPath>
>;
type distributionVerificationsChildInputs<TPath extends string[]> = ChildInputs<distributionVerificationsInputs<TPath>>;
type distributionVerificationsParentInputs<TPath extends string[]> = ParentInputs<
distributionVerificationsInputs<TPath>,
  TPath
>;
type distributionsScalars = {
  /**
   * Column `distributions.id`.
   */
  id?: number;
  /**
   * Column `distributions.number`.
   */
  number: number;
  /**
   * Column `distributions.amount`.
   */
  amount: number;
  /**
   * Column `distributions.hodler_pool_bips`.
   */
  hodlerPoolBips: number;
  /**
   * Column `distributions.bonus_pool_bips`.
   */
  bonusPoolBips: number;
  /**
   * Column `distributions.fixed_pool_bips`.
   */
  fixedPoolBips: number;
  /**
   * Column `distributions.name`.
   */
  name: string;
  /**
   * Column `distributions.description`.
   */
  description: string | null;
  /**
   * Column `distributions.qualification_start`.
   */
  qualificationStart: string;
  /**
   * Column `distributions.qualification_end`.
   */
  qualificationEnd: string;
  /**
   * Column `distributions.claim_end`.
   */
  claimEnd: string;
  /**
   * Column `distributions.snapshot_id`.
   */
  snapshotId: number | null;
  /**
   * Column `distributions.hodler_min_balance`.
   */
  hodlerMinBalance: number;
  /**
   * Column `distributions.created_at`.
   */
  createdAt?: string;
  /**
   * Column `distributions.updated_at`.
   */
  updatedAt?: string;
}
type distributionsParentsInputs<TPath extends string[]> = {

};
type distributionsChildrenInputs<TPath extends string[]> = {
  /**
  * Relationship from table `distributions` to table `distribution_shares` through the column `distribution_shares.distributionId`.
  */
  distributionShares: OmitChildInputs<distributionSharesChildInputs<[...TPath, "distributionShares"]>, "distribution" | "distributionId">;
  /**
  * Relationship from table `distributions` to table `distribution_verification_values` through the column `distribution_verification_values.distributionId`.
  */
  distributionVerificationValues: OmitChildInputs<distributionVerificationValuesChildInputs<[...TPath, "distributionVerificationValues"]>, "distribution" | "distributionId">;
  /**
  * Relationship from table `distributions` to table `distribution_verifications` through the column `distribution_verifications.distributionId`.
  */
  distributionVerifications: OmitChildInputs<distributionVerificationsChildInputs<[...TPath, "distributionVerifications"]>, "distribution" | "distributionId">;
};
type distributionsInputs<TPath extends string[]> = Inputs<
  distributionsScalars,
  distributionsParentsInputs<TPath>,
  distributionsChildrenInputs<TPath>
>;
type distributionsChildInputs<TPath extends string[]> = ChildInputs<distributionsInputs<TPath>>;
type distributionsParentInputs<TPath extends string[]> = ParentInputs<
distributionsInputs<TPath>,
  TPath
>;
type featureInfosScalars = {
  /**
   * Column `feature_info.feature`.
   */
  feature: pg_tle_featuresEnum;
  /**
   * Column `feature_info.schema_name`.
   */
  schemaName: string;
  /**
   * Column `feature_info.proname`.
   */
  proname: string;
  /**
   * Column `feature_info.obj_identity`.
   */
  objIdentity: string;
}
type featureInfosParentsInputs<TPath extends string[]> = {

};
type featureInfosChildrenInputs<TPath extends string[]> = {

};
type featureInfosInputs<TPath extends string[]> = Inputs<
  featureInfosScalars,
  featureInfosParentsInputs<TPath>,
  featureInfosChildrenInputs<TPath>
>;
type featureInfosChildInputs<TPath extends string[]> = ChildInputs<featureInfosInputs<TPath>>;
type featureInfosParentInputs<TPath extends string[]> = ParentInputs<
featureInfosInputs<TPath>,
  TPath
>;
type keysScalars = {
  /**
   * Column `key.id`.
   */
  id?: string;
  /**
   * Column `key.status`.
   */
  status: key_statusEnum | null;
  /**
   * Column `key.created`.
   */
  created?: string;
  /**
   * Column `key.expires`.
   */
  expires: string | null;
  /**
   * Column `key.key_type`.
   */
  keyType: key_typeEnum | null;
  /**
   * Column `key.key_id`.
   */
  keyId: number | null;
  /**
   * Column `key.key_context`.
   */
  keyContext: string | null;
  /**
   * Column `key.name`.
   */
  name: string | null;
  /**
   * Column `key.associated_data`.
   */
  associatedData: string | null;
  /**
   * Column `key.raw_key`.
   */
  rawKey: string | null;
  /**
   * Column `key.raw_key_nonce`.
   */
  rawKeyNonce: string | null;
  /**
   * Column `key.parent_key`.
   */
  parentKey: string | null;
  /**
   * Column `key.comment`.
   */
  comment: string | null;
  /**
   * Column `key.user_data`.
   */
  userData: string | null;
}
type keysParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `key` to table `key` through the column `key.parentKey`.
   */
  keysByParentKey: OmitParentInputs<keysParentInputs<[...TPath, "keysByParentKey"]>, "keysByParentKey", [...TPath, "keysByParentKey"]>;
};
type keysChildrenInputs<TPath extends string[]> = {
  /**
  * Relationship from table `key` to table `secrets` through the column `secrets.keyId`.
  */
  secrets: OmitChildInputs<secretsChildInputs<[...TPath, "secrets"]>, "key" | "keyId">;
};
type keysInputs<TPath extends string[]> = Inputs<
  keysScalars,
  keysParentsInputs<TPath>,
  keysChildrenInputs<TPath>
>;
type keysChildInputs<TPath extends string[]> = ChildInputs<keysInputs<TPath>>;
type keysParentInputs<TPath extends string[]> = ParentInputs<
keysInputs<TPath>,
  TPath
>;
type migrationsScalars = {
  /**
   * Column `migrations.id`.
   */
  id: number;
  /**
   * Column `migrations.name`.
   */
  name: string;
  /**
   * Column `migrations.hash`.
   */
  hash: string;
  /**
   * Column `migrations.executed_at`.
   */
  executedAt: string | null;
}
type migrationsParentsInputs<TPath extends string[]> = {

};
type migrationsChildrenInputs<TPath extends string[]> = {

};
type migrationsInputs<TPath extends string[]> = Inputs<
  migrationsScalars,
  migrationsParentsInputs<TPath>,
  migrationsChildrenInputs<TPath>
>;
type migrationsChildInputs<TPath extends string[]> = ChildInputs<migrationsInputs<TPath>>;
type migrationsParentInputs<TPath extends string[]> = ParentInputs<
migrationsInputs<TPath>,
  TPath
>;
type objectsScalars = {
  /**
   * Column `objects.id`.
   */
  id?: string;
  /**
   * Column `objects.bucket_id`.
   */
  bucketId: string | null;
  /**
   * Column `objects.name`.
   */
  name: string | null;
  /**
   * Column `objects.owner`.
   */
  owner: string | null;
  /**
   * Column `objects.created_at`.
   */
  createdAt: string | null;
  /**
   * Column `objects.updated_at`.
   */
  updatedAt: string | null;
  /**
   * Column `objects.last_accessed_at`.
   */
  lastAccessedAt: string | null;
  /**
   * Column `objects.metadata`.
   */
  metadata: Json | null;
  /**
   * Column `objects.path_tokens`.
   */
  pathTokens?: string[] | null;
  /**
   * Column `objects.version`.
   */
  version: string | null;
  /**
   * Column `objects.owner_id`.
   */
  ownerId: string | null;
}
type objectsParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `objects` to table `buckets` through the column `objects.bucketId`.
   */
  bucket: OmitParentInputs<bucketsParentInputs<[...TPath, "bucket"]>, "objects", [...TPath, "bucket"]>;
};
type objectsChildrenInputs<TPath extends string[]> = {

};
type objectsInputs<TPath extends string[]> = Inputs<
  Omit<objectsScalars, "pathTokens">,
  objectsParentsInputs<TPath>,
  objectsChildrenInputs<TPath>
>;
type objectsChildInputs<TPath extends string[]> = ChildInputs<objectsInputs<TPath>>;
type objectsParentInputs<TPath extends string[]> = ParentInputs<
objectsInputs<TPath>,
  TPath
>;
type profilesScalars = {
  /**
   * Column `profiles.id`.
   */
  id: string;
  /**
   * Column `profiles.avatar_url`.
   */
  avatarUrl: string | null;
  /**
   * Column `profiles.name`.
   */
  name: string | null;
  /**
   * Column `profiles.about`.
   */
  about: string | null;
  /**
   * Column `profiles.referral_code`.
   */
  referralCode: string | null;
}
type profilesParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `profiles` to table `users` through the column `profiles.id`.
   */
  i: OmitParentInputs<usersParentInputs<[...TPath, "i"]>, "profiles", [...TPath, "i"]>;
};
type profilesChildrenInputs<TPath extends string[]> = {
  /**
  * Relationship from table `profiles` to table `referrals` through the column `referrals.referredId`.
  */
  referralsByReferredId: OmitChildInputs<referralsChildInputs<[...TPath, "referralsByReferredId"]>, "referred" | "referredId">;
  /**
  * Relationship from table `profiles` to table `referrals` through the column `referrals.referrerId`.
  */
  referralsByReferrerId: OmitChildInputs<referralsChildInputs<[...TPath, "referralsByReferrerId"]>, "referrer" | "referrerId">;
};
type profilesInputs<TPath extends string[]> = Inputs<
  profilesScalars,
  profilesParentsInputs<TPath>,
  profilesChildrenInputs<TPath>
>;
type profilesChildInputs<TPath extends string[]> = ChildInputs<profilesInputs<TPath>>;
type profilesParentInputs<TPath extends string[]> = ParentInputs<
profilesInputs<TPath>,
  TPath
>;
type receiptsScalars = {
  /**
   * Column `receipts.hash`.
   */
  hash: string;
  /**
   * Column `receipts.created_at`.
   */
  createdAt: string | null;
  /**
   * Column `receipts.user_id`.
   */
  userId: string;
}
type receiptsParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `receipts` to table `users` through the column `receipts.userId`.
   */
  user: OmitParentInputs<usersParentInputs<[...TPath, "user"]>, "receipts", [...TPath, "user"]>;
};
type receiptsChildrenInputs<TPath extends string[]> = {
  /**
  * Relationship from table `receipts` to table `tag_receipts` through the column `tag_receipts.hash`.
  */
  tagReceipts: OmitChildInputs<tagReceiptsChildInputs<[...TPath, "tagReceipts"]>, "ha" | "hash">;
};
type receiptsInputs<TPath extends string[]> = Inputs<
  receiptsScalars,
  receiptsParentsInputs<TPath>,
  receiptsChildrenInputs<TPath>
>;
type receiptsChildInputs<TPath extends string[]> = ChildInputs<receiptsInputs<TPath>>;
type receiptsParentInputs<TPath extends string[]> = ParentInputs<
receiptsInputs<TPath>,
  TPath
>;
type referralsScalars = {
  /**
   * Column `referrals.referrer_id`.
   */
  referrerId: string;
  /**
   * Column `referrals.referred_id`.
   */
  referredId: string;
  /**
   * Column `referrals.tag`.
   */
  tag: string;
  /**
   * Column `referrals.id`.
   */
  id?: number;
}
type referralsParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `referrals` to table `profiles` through the column `referrals.referredId`.
   */
  referred: OmitParentInputs<profilesParentInputs<[...TPath, "referred"]>, "referralsByReferredId", [...TPath, "referred"]>;
  /**
   * Relationship from table `referrals` to table `profiles` through the column `referrals.referrerId`.
   */
  referrer: OmitParentInputs<profilesParentInputs<[...TPath, "referrer"]>, "referralsByReferrerId", [...TPath, "referrer"]>;
  /**
   * Relationship from table `referrals` to table `tags` through the column `referrals.tag`.
   */
  tagByTag: OmitParentInputs<tagsParentInputs<[...TPath, "tagByTag"]>, "referralsByTag", [...TPath, "tagByTag"]>;
};
type referralsChildrenInputs<TPath extends string[]> = {

};
type referralsInputs<TPath extends string[]> = Inputs<
  referralsScalars,
  referralsParentsInputs<TPath>,
  referralsChildrenInputs<TPath>
>;
type referralsChildInputs<TPath extends string[]> = ChildInputs<referralsInputs<TPath>>;
type referralsParentInputs<TPath extends string[]> = ParentInputs<
referralsInputs<TPath>,
  TPath
>;
type authSchemaMigrationsScalars = {
  /**
   * Column `schema_migrations.version`.
   */
  version: string;
}
type authSchemaMigrationsParentsInputs<TPath extends string[]> = {

};
type authSchemaMigrationsChildrenInputs<TPath extends string[]> = {

};
type authSchemaMigrationsInputs<TPath extends string[]> = Inputs<
  authSchemaMigrationsScalars,
  authSchemaMigrationsParentsInputs<TPath>,
  authSchemaMigrationsChildrenInputs<TPath>
>;
type authSchemaMigrationsChildInputs<TPath extends string[]> = ChildInputs<authSchemaMigrationsInputs<TPath>>;
type authSchemaMigrationsParentInputs<TPath extends string[]> = ParentInputs<
authSchemaMigrationsInputs<TPath>,
  TPath
>;
type supabaseMigrationsSchemaMigrationsScalars = {
  /**
   * Column `schema_migrations.version`.
   */
  version: string;
  /**
   * Column `schema_migrations.statements`.
   */
  statements: string[] | null;
  /**
   * Column `schema_migrations.name`.
   */
  name: string | null;
}
type supabaseMigrationsSchemaMigrationsParentsInputs<TPath extends string[]> = {

};
type supabaseMigrationsSchemaMigrationsChildrenInputs<TPath extends string[]> = {

};
type supabaseMigrationsSchemaMigrationsInputs<TPath extends string[]> = Inputs<
  supabaseMigrationsSchemaMigrationsScalars,
  supabaseMigrationsSchemaMigrationsParentsInputs<TPath>,
  supabaseMigrationsSchemaMigrationsChildrenInputs<TPath>
>;
type supabaseMigrationsSchemaMigrationsChildInputs<TPath extends string[]> = ChildInputs<supabaseMigrationsSchemaMigrationsInputs<TPath>>;
type supabaseMigrationsSchemaMigrationsParentInputs<TPath extends string[]> = ParentInputs<
supabaseMigrationsSchemaMigrationsInputs<TPath>,
  TPath
>;
type secretsScalars = {
  /**
   * Column `secrets.id`.
   */
  id?: string;
  /**
   * Column `secrets.name`.
   */
  name: string | null;
  /**
   * Column `secrets.description`.
   */
  description?: string;
  /**
   * Column `secrets.secret`.
   */
  secret: string;
  /**
   * Column `secrets.key_id`.
   */
  keyId: string | null;
  /**
   * Column `secrets.nonce`.
   */
  nonce: string | null;
  /**
   * Column `secrets.created_at`.
   */
  createdAt?: string;
  /**
   * Column `secrets.updated_at`.
   */
  updatedAt?: string;
}
type secretsParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `secrets` to table `key` through the column `secrets.keyId`.
   */
  key: OmitParentInputs<keysParentInputs<[...TPath, "key"]>, "secrets", [...TPath, "key"]>;
};
type secretsChildrenInputs<TPath extends string[]> = {

};
type secretsInputs<TPath extends string[]> = Inputs<
  secretsScalars,
  secretsParentsInputs<TPath>,
  secretsChildrenInputs<TPath>
>;
type secretsChildInputs<TPath extends string[]> = ChildInputs<secretsInputs<TPath>>;
type secretsParentInputs<TPath extends string[]> = ParentInputs<
secretsInputs<TPath>,
  TPath
>;
type sendTransferLogsScalars = {
  /**
   * Column `send_transfer_logs.from`.
   */
  from: string;
  /**
   * Column `send_transfer_logs.to`.
   */
  to: string;
  /**
   * Column `send_transfer_logs.value`.
   */
  value: number;
  /**
   * Column `send_transfer_logs.block_number`.
   */
  blockNumber: number;
  /**
   * Column `send_transfer_logs.block_timestamp`.
   */
  blockTimestamp: string;
  /**
   * Column `send_transfer_logs.block_hash`.
   */
  blockHash: string;
  /**
   * Column `send_transfer_logs.tx_hash`.
   */
  txHash: string;
  /**
   * Column `send_transfer_logs.log_index`.
   */
  logIndex: number;
  /**
   * Column `send_transfer_logs.created_at`.
   */
  createdAt: string | null;
}
type sendTransferLogsParentsInputs<TPath extends string[]> = {

};
type sendTransferLogsChildrenInputs<TPath extends string[]> = {

};
type sendTransferLogsInputs<TPath extends string[]> = Inputs<
  sendTransferLogsScalars,
  sendTransferLogsParentsInputs<TPath>,
  sendTransferLogsChildrenInputs<TPath>
>;
type sendTransferLogsChildInputs<TPath extends string[]> = ChildInputs<sendTransferLogsInputs<TPath>>;
type sendTransferLogsParentInputs<TPath extends string[]> = ParentInputs<
sendTransferLogsInputs<TPath>,
  TPath
>;
type tagReceiptsScalars = {
  /**
   * Column `tag_receipts.tag_name`.
   */
  tagName: string;
  /**
   * Column `tag_receipts.hash`.
   */
  hash: string;
}
type tagReceiptsParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `tag_receipts` to table `receipts` through the column `tag_receipts.hash`.
   */
  ha: OmitParentInputs<receiptsParentInputs<[...TPath, "ha"]>, "tagReceipts", [...TPath, "ha"]>;
  /**
   * Relationship from table `tag_receipts` to table `tags` through the column `tag_receipts.tagName`.
   */
  tag: OmitParentInputs<tagsParentInputs<[...TPath, "tag"]>, "tagReceipts", [...TPath, "tag"]>;
};
type tagReceiptsChildrenInputs<TPath extends string[]> = {

};
type tagReceiptsInputs<TPath extends string[]> = Inputs<
  tagReceiptsScalars,
  tagReceiptsParentsInputs<TPath>,
  tagReceiptsChildrenInputs<TPath>
>;
type tagReceiptsChildInputs<TPath extends string[]> = ChildInputs<tagReceiptsInputs<TPath>>;
type tagReceiptsParentInputs<TPath extends string[]> = ParentInputs<
tagReceiptsInputs<TPath>,
  TPath
>;
type tagReservationsScalars = {
  /**
   * Column `tag_reservations.tag_name`.
   */
  tagName: string;
  /**
   * Column `tag_reservations.chain_address`.
   */
  chainAddress: string | null;
  /**
   * Column `tag_reservations.created_at`.
   */
  createdAt?: string;
}
type tagReservationsParentsInputs<TPath extends string[]> = {

};
type tagReservationsChildrenInputs<TPath extends string[]> = {

};
type tagReservationsInputs<TPath extends string[]> = Inputs<
  tagReservationsScalars,
  tagReservationsParentsInputs<TPath>,
  tagReservationsChildrenInputs<TPath>
>;
type tagReservationsChildInputs<TPath extends string[]> = ChildInputs<tagReservationsInputs<TPath>>;
type tagReservationsParentInputs<TPath extends string[]> = ParentInputs<
tagReservationsInputs<TPath>,
  TPath
>;
type tagsScalars = {
  /**
   * Column `tags.name`.
   */
  name: string;
  /**
   * Column `tags.status`.
   */
  status?: tag_statusEnum;
  /**
   * Column `tags.user_id`.
   */
  userId?: string;
  /**
   * Column `tags.created_at`.
   */
  createdAt?: string;
}
type tagsParentsInputs<TPath extends string[]> = {
  /**
   * Relationship from table `tags` to table `users` through the column `tags.userId`.
   */
  user: OmitParentInputs<usersParentInputs<[...TPath, "user"]>, "tags", [...TPath, "user"]>;
};
type tagsChildrenInputs<TPath extends string[]> = {
  /**
  * Relationship from table `tags` to table `referrals` through the column `referrals.tag`.
  */
  referralsByTag: OmitChildInputs<referralsChildInputs<[...TPath, "referralsByTag"]>, "tagByTag" | "tag">;
  /**
  * Relationship from table `tags` to table `tag_receipts` through the column `tag_receipts.tagName`.
  */
  tagReceipts: OmitChildInputs<tagReceiptsChildInputs<[...TPath, "tagReceipts"]>, "tag" | "tagName">;
};
type tagsInputs<TPath extends string[]> = Inputs<
  tagsScalars,
  tagsParentsInputs<TPath>,
  tagsChildrenInputs<TPath>
>;
type tagsChildInputs<TPath extends string[]> = ChildInputs<tagsInputs<TPath>>;
type tagsParentInputs<TPath extends string[]> = ParentInputs<
tagsInputs<TPath>,
  TPath
>;
type usersScalars = {
  /**
   * Column `users.instance_id`.
   */
  instanceId: string | null;
  /**
   * Column `users.id`.
   */
  id: string;
  /**
   * Column `users.aud`.
   */
  aud: string | null;
  /**
   * Column `users.role`.
   */
  role: string | null;
  /**
   * Column `users.email`.
   */
  email: string | null;
  /**
   * Column `users.encrypted_password`.
   */
  encryptedPassword: string | null;
  /**
   * Column `users.email_confirmed_at`.
   */
  emailConfirmedAt: string | null;
  /**
   * Column `users.invited_at`.
   */
  invitedAt: string | null;
  /**
   * Column `users.confirmation_token`.
   */
  confirmationToken: string | null;
  /**
   * Column `users.confirmation_sent_at`.
   */
  confirmationSentAt: string | null;
  /**
   * Column `users.recovery_token`.
   */
  recoveryToken: string | null;
  /**
   * Column `users.recovery_sent_at`.
   */
  recoverySentAt: string | null;
  /**
   * Column `users.email_change_token_new`.
   */
  emailChangeTokenNew: string | null;
  /**
   * Column `users.email_change`.
   */
  emailChange: string | null;
  /**
   * Column `users.email_change_sent_at`.
   */
  emailChangeSentAt: string | null;
  /**
   * Column `users.last_sign_in_at`.
   */
  lastSignInAt: string | null;
  /**
   * Column `users.raw_app_meta_data`.
   */
  rawAppMetaData: Json | null;
  /**
   * Column `users.raw_user_meta_data`.
   */
  rawUserMetaData: Json | null;
  /**
   * Column `users.is_super_admin`.
   */
  isSuperAdmin: boolean | null;
  /**
   * Column `users.created_at`.
   */
  createdAt: string | null;
  /**
   * Column `users.updated_at`.
   */
  updatedAt: string | null;
  /**
   * Column `users.phone`.
   */
  phone: string | null;
  /**
   * Column `users.phone_confirmed_at`.
   */
  phoneConfirmedAt: string | null;
  /**
   * Column `users.phone_change`.
   */
  phoneChange: string | null;
  /**
   * Column `users.phone_change_token`.
   */
  phoneChangeToken: string | null;
  /**
   * Column `users.phone_change_sent_at`.
   */
  phoneChangeSentAt: string | null;
  /**
   * Column `users.confirmed_at`.
   */
  confirmedAt?: string | null;
  /**
   * Column `users.email_change_token_current`.
   */
  emailChangeTokenCurrent: string | null;
  /**
   * Column `users.email_change_confirm_status`.
   */
  emailChangeConfirmStatus: number | null;
  /**
   * Column `users.banned_until`.
   */
  bannedUntil: string | null;
  /**
   * Column `users.reauthentication_token`.
   */
  reauthenticationToken: string | null;
  /**
   * Column `users.reauthentication_sent_at`.
   */
  reauthenticationSentAt: string | null;
  /**
   * Column `users.is_sso_user`.
   */
  isSsoUser?: boolean;
  /**
   * Column `users.deleted_at`.
   */
  deletedAt: string | null;
}
type usersParentsInputs<TPath extends string[]> = {

};
type usersChildrenInputs<TPath extends string[]> = {
  /**
  * Relationship from table `users` to table `chain_addresses` through the column `chain_addresses.userId`.
  */
  chainAddresses: OmitChildInputs<chainAddressesChildInputs<[...TPath, "chainAddresses"]>, "user" | "userId">;
  /**
  * Relationship from table `users` to table `distribution_shares` through the column `distribution_shares.userId`.
  */
  distributionShares: OmitChildInputs<distributionSharesChildInputs<[...TPath, "distributionShares"]>, "user" | "userId">;
  /**
  * Relationship from table `users` to table `distribution_verifications` through the column `distribution_verifications.userId`.
  */
  distributionVerifications: OmitChildInputs<distributionVerificationsChildInputs<[...TPath, "distributionVerifications"]>, "user" | "userId">;
  /**
  * Relationship from table `users` to table `profiles` through the column `profiles.id`.
  */
  profiles: OmitChildInputs<profilesChildInputs<[...TPath, "profiles"]>, "i" | "id">;
  /**
  * Relationship from table `users` to table `receipts` through the column `receipts.userId`.
  */
  receipts: OmitChildInputs<receiptsChildInputs<[...TPath, "receipts"]>, "user" | "userId">;
  /**
  * Relationship from table `users` to table `tags` through the column `tags.userId`.
  */
  tags: OmitChildInputs<tagsChildInputs<[...TPath, "tags"]>, "user" | "userId">;
};
type usersInputs<TPath extends string[]> = Inputs<
  Omit<usersScalars, "confirmedAt">,
  usersParentsInputs<TPath>,
  usersChildrenInputs<TPath>
>;
type usersChildInputs<TPath extends string[]> = ChildInputs<usersInputs<TPath>>;
type usersParentInputs<TPath extends string[]> = ParentInputs<
usersInputs<TPath>,
  TPath
>;
type bucketsParentsGraph = {

};
type bucketsChildrenGraph = {
 objects: OmitParentGraph<objectsGraph, "bucket">;
};
type bucketsGraph = Array<{
  Scalars: bucketsScalars;
  Parents: bucketsParentsGraph;
  Children: bucketsChildrenGraph;
}>;
type chainAddressesParentsGraph = {
 user: OmitChildGraph<usersGraph, "chainAddresses">;
};
type chainAddressesChildrenGraph = {

};
type chainAddressesGraph = Array<{
  Scalars: chainAddressesScalars;
  Parents: chainAddressesParentsGraph;
  Children: chainAddressesChildrenGraph;
}>;
type distributionSharesParentsGraph = {
 user: OmitChildGraph<usersGraph, "distributionShares">;
 distribution: OmitChildGraph<distributionsGraph, "distributionShares">;
};
type distributionSharesChildrenGraph = {

};
type distributionSharesGraph = Array<{
  Scalars: distributionSharesScalars;
  Parents: distributionSharesParentsGraph;
  Children: distributionSharesChildrenGraph;
}>;
type distributionVerificationValuesParentsGraph = {
 distribution: OmitChildGraph<distributionsGraph, "distributionVerificationValues">;
};
type distributionVerificationValuesChildrenGraph = {

};
type distributionVerificationValuesGraph = Array<{
  Scalars: distributionVerificationValuesScalars;
  Parents: distributionVerificationValuesParentsGraph;
  Children: distributionVerificationValuesChildrenGraph;
}>;
type distributionVerificationsParentsGraph = {
 user: OmitChildGraph<usersGraph, "distributionVerifications">;
 distribution: OmitChildGraph<distributionsGraph, "distributionVerifications">;
};
type distributionVerificationsChildrenGraph = {

};
type distributionVerificationsGraph = Array<{
  Scalars: distributionVerificationsScalars;
  Parents: distributionVerificationsParentsGraph;
  Children: distributionVerificationsChildrenGraph;
}>;
type distributionsParentsGraph = {

};
type distributionsChildrenGraph = {
 distributionShares: OmitParentGraph<distributionSharesGraph, "distribution">;
 distributionVerificationValues: OmitParentGraph<distributionVerificationValuesGraph, "distribution">;
 distributionVerifications: OmitParentGraph<distributionVerificationsGraph, "distribution">;
};
type distributionsGraph = Array<{
  Scalars: distributionsScalars;
  Parents: distributionsParentsGraph;
  Children: distributionsChildrenGraph;
}>;
type featureInfosParentsGraph = {

};
type featureInfosChildrenGraph = {

};
type featureInfosGraph = Array<{
  Scalars: featureInfosScalars;
  Parents: featureInfosParentsGraph;
  Children: featureInfosChildrenGraph;
}>;
type keysParentsGraph = {
 keysByParentKey: OmitChildGraph<keysGraph, "keysByParentKey">;
};
type keysChildrenGraph = {
 secrets: OmitParentGraph<secretsGraph, "key">;
};
type keysGraph = Array<{
  Scalars: keysScalars;
  Parents: keysParentsGraph;
  Children: keysChildrenGraph;
}>;
type migrationsParentsGraph = {

};
type migrationsChildrenGraph = {

};
type migrationsGraph = Array<{
  Scalars: migrationsScalars;
  Parents: migrationsParentsGraph;
  Children: migrationsChildrenGraph;
}>;
type objectsParentsGraph = {
 bucket: OmitChildGraph<bucketsGraph, "objects">;
};
type objectsChildrenGraph = {

};
type objectsGraph = Array<{
  Scalars: objectsScalars;
  Parents: objectsParentsGraph;
  Children: objectsChildrenGraph;
}>;
type profilesParentsGraph = {
 i: OmitChildGraph<usersGraph, "profiles">;
};
type profilesChildrenGraph = {
 referralsByReferredId: OmitParentGraph<referralsGraph, "referred">;
 referralsByReferrerId: OmitParentGraph<referralsGraph, "referrer">;
};
type profilesGraph = Array<{
  Scalars: profilesScalars;
  Parents: profilesParentsGraph;
  Children: profilesChildrenGraph;
}>;
type receiptsParentsGraph = {
 user: OmitChildGraph<usersGraph, "receipts">;
};
type receiptsChildrenGraph = {
 tagReceipts: OmitParentGraph<tagReceiptsGraph, "ha">;
};
type receiptsGraph = Array<{
  Scalars: receiptsScalars;
  Parents: receiptsParentsGraph;
  Children: receiptsChildrenGraph;
}>;
type referralsParentsGraph = {
 referred: OmitChildGraph<profilesGraph, "referralsByReferredId">;
 referrer: OmitChildGraph<profilesGraph, "referralsByReferrerId">;
 tagByTag: OmitChildGraph<tagsGraph, "referralsByTag">;
};
type referralsChildrenGraph = {

};
type referralsGraph = Array<{
  Scalars: referralsScalars;
  Parents: referralsParentsGraph;
  Children: referralsChildrenGraph;
}>;
type authSchemaMigrationsParentsGraph = {

};
type authSchemaMigrationsChildrenGraph = {

};
type authSchemaMigrationsGraph = Array<{
  Scalars: authSchemaMigrationsScalars;
  Parents: authSchemaMigrationsParentsGraph;
  Children: authSchemaMigrationsChildrenGraph;
}>;
type supabaseMigrationsSchemaMigrationsParentsGraph = {

};
type supabaseMigrationsSchemaMigrationsChildrenGraph = {

};
type supabaseMigrationsSchemaMigrationsGraph = Array<{
  Scalars: supabaseMigrationsSchemaMigrationsScalars;
  Parents: supabaseMigrationsSchemaMigrationsParentsGraph;
  Children: supabaseMigrationsSchemaMigrationsChildrenGraph;
}>;
type secretsParentsGraph = {
 key: OmitChildGraph<keysGraph, "secrets">;
};
type secretsChildrenGraph = {

};
type secretsGraph = Array<{
  Scalars: secretsScalars;
  Parents: secretsParentsGraph;
  Children: secretsChildrenGraph;
}>;
type sendTransferLogsParentsGraph = {

};
type sendTransferLogsChildrenGraph = {

};
type sendTransferLogsGraph = Array<{
  Scalars: sendTransferLogsScalars;
  Parents: sendTransferLogsParentsGraph;
  Children: sendTransferLogsChildrenGraph;
}>;
type tagReceiptsParentsGraph = {
 ha: OmitChildGraph<receiptsGraph, "tagReceipts">;
 tag: OmitChildGraph<tagsGraph, "tagReceipts">;
};
type tagReceiptsChildrenGraph = {

};
type tagReceiptsGraph = Array<{
  Scalars: tagReceiptsScalars;
  Parents: tagReceiptsParentsGraph;
  Children: tagReceiptsChildrenGraph;
}>;
type tagReservationsParentsGraph = {

};
type tagReservationsChildrenGraph = {

};
type tagReservationsGraph = Array<{
  Scalars: tagReservationsScalars;
  Parents: tagReservationsParentsGraph;
  Children: tagReservationsChildrenGraph;
}>;
type tagsParentsGraph = {
 user: OmitChildGraph<usersGraph, "tags">;
};
type tagsChildrenGraph = {
 referralsByTag: OmitParentGraph<referralsGraph, "tagByTag">;
 tagReceipts: OmitParentGraph<tagReceiptsGraph, "tag">;
};
type tagsGraph = Array<{
  Scalars: tagsScalars;
  Parents: tagsParentsGraph;
  Children: tagsChildrenGraph;
}>;
type usersParentsGraph = {

};
type usersChildrenGraph = {
 chainAddresses: OmitParentGraph<chainAddressesGraph, "user">;
 distributionShares: OmitParentGraph<distributionSharesGraph, "user">;
 distributionVerifications: OmitParentGraph<distributionVerificationsGraph, "user">;
 profiles: OmitParentGraph<profilesGraph, "i">;
 receipts: OmitParentGraph<receiptsGraph, "user">;
 tags: OmitParentGraph<tagsGraph, "user">;
};
type usersGraph = Array<{
  Scalars: usersScalars;
  Parents: usersParentsGraph;
  Children: usersChildrenGraph;
}>;
type Graph = {
  buckets: bucketsGraph;
  chainAddresses: chainAddressesGraph;
  distributionShares: distributionSharesGraph;
  distributionVerificationValues: distributionVerificationValuesGraph;
  distributionVerifications: distributionVerificationsGraph;
  distributions: distributionsGraph;
  featureInfos: featureInfosGraph;
  keys: keysGraph;
  migrations: migrationsGraph;
  objects: objectsGraph;
  profiles: profilesGraph;
  receipts: receiptsGraph;
  referrals: referralsGraph;
  authSchemaMigrations: authSchemaMigrationsGraph;
  supabaseMigrationsSchemaMigrations: supabaseMigrationsSchemaMigrationsGraph;
  secrets: secretsGraph;
  sendTransferLogs: sendTransferLogsGraph;
  tagReceipts: tagReceiptsGraph;
  tagReservations: tagReservationsGraph;
  tags: tagsGraph;
  users: usersGraph;
};
export type SnapletClient = {
  /**
   * Generate one or more `buckets`.
   * @example With static inputs:
   * ```ts
   * snaplet.buckets([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.buckets((x) => x(3));
   * snaplet.buckets((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.buckets((x) => [{}, ...x(3), {}]);
   * ```
   */
  buckets: (
    inputs: bucketsChildInputs<["buckets"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `chainAddresses`.
   * @example With static inputs:
   * ```ts
   * snaplet.chainAddresses([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.chainAddresses((x) => x(3));
   * snaplet.chainAddresses((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.chainAddresses((x) => [{}, ...x(3), {}]);
   * ```
   */
  chainAddresses: (
    inputs: chainAddressesChildInputs<["chainAddresses"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `distributionShares`.
   * @example With static inputs:
   * ```ts
   * snaplet.distributionShares([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.distributionShares((x) => x(3));
   * snaplet.distributionShares((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.distributionShares((x) => [{}, ...x(3), {}]);
   * ```
   */
  distributionShares: (
    inputs: distributionSharesChildInputs<["distributionShares"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `distributionVerificationValues`.
   * @example With static inputs:
   * ```ts
   * snaplet.distributionVerificationValues([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.distributionVerificationValues((x) => x(3));
   * snaplet.distributionVerificationValues((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.distributionVerificationValues((x) => [{}, ...x(3), {}]);
   * ```
   */
  distributionVerificationValues: (
    inputs: distributionVerificationValuesChildInputs<["distributionVerificationValues"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `distributionVerifications`.
   * @example With static inputs:
   * ```ts
   * snaplet.distributionVerifications([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.distributionVerifications((x) => x(3));
   * snaplet.distributionVerifications((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.distributionVerifications((x) => [{}, ...x(3), {}]);
   * ```
   */
  distributionVerifications: (
    inputs: distributionVerificationsChildInputs<["distributionVerifications"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `distributions`.
   * @example With static inputs:
   * ```ts
   * snaplet.distributions([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.distributions((x) => x(3));
   * snaplet.distributions((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.distributions((x) => [{}, ...x(3), {}]);
   * ```
   */
  distributions: (
    inputs: distributionsChildInputs<["distributions"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `featureInfos`.
   * @example With static inputs:
   * ```ts
   * snaplet.featureInfos([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.featureInfos((x) => x(3));
   * snaplet.featureInfos((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.featureInfos((x) => [{}, ...x(3), {}]);
   * ```
   */
  featureInfos: (
    inputs: featureInfosChildInputs<["featureInfos"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `keys`.
   * @example With static inputs:
   * ```ts
   * snaplet.keys([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.keys((x) => x(3));
   * snaplet.keys((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.keys((x) => [{}, ...x(3), {}]);
   * ```
   */
  keys: (
    inputs: keysChildInputs<["keys"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `migrations`.
   * @example With static inputs:
   * ```ts
   * snaplet.migrations([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.migrations((x) => x(3));
   * snaplet.migrations((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.migrations((x) => [{}, ...x(3), {}]);
   * ```
   */
  migrations: (
    inputs: migrationsChildInputs<["migrations"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `objects`.
   * @example With static inputs:
   * ```ts
   * snaplet.objects([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.objects((x) => x(3));
   * snaplet.objects((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.objects((x) => [{}, ...x(3), {}]);
   * ```
   */
  objects: (
    inputs: objectsChildInputs<["objects"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `profiles`.
   * @example With static inputs:
   * ```ts
   * snaplet.profiles([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.profiles((x) => x(3));
   * snaplet.profiles((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.profiles((x) => [{}, ...x(3), {}]);
   * ```
   */
  profiles: (
    inputs: profilesChildInputs<["profiles"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `receipts`.
   * @example With static inputs:
   * ```ts
   * snaplet.receipts([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.receipts((x) => x(3));
   * snaplet.receipts((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.receipts((x) => [{}, ...x(3), {}]);
   * ```
   */
  receipts: (
    inputs: receiptsChildInputs<["receipts"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `referrals`.
   * @example With static inputs:
   * ```ts
   * snaplet.referrals([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.referrals((x) => x(3));
   * snaplet.referrals((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.referrals((x) => [{}, ...x(3), {}]);
   * ```
   */
  referrals: (
    inputs: referralsChildInputs<["referrals"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `authSchemaMigrations`.
   * @example With static inputs:
   * ```ts
   * snaplet.authSchemaMigrations([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.authSchemaMigrations((x) => x(3));
   * snaplet.authSchemaMigrations((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.authSchemaMigrations((x) => [{}, ...x(3), {}]);
   * ```
   */
  authSchemaMigrations: (
    inputs: authSchemaMigrationsChildInputs<["authSchemaMigrations"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `supabaseMigrationsSchemaMigrations`.
   * @example With static inputs:
   * ```ts
   * snaplet.supabaseMigrationsSchemaMigrations([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.supabaseMigrationsSchemaMigrations((x) => x(3));
   * snaplet.supabaseMigrationsSchemaMigrations((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.supabaseMigrationsSchemaMigrations((x) => [{}, ...x(3), {}]);
   * ```
   */
  supabaseMigrationsSchemaMigrations: (
    inputs: supabaseMigrationsSchemaMigrationsChildInputs<["supabaseMigrationsSchemaMigrations"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `secrets`.
   * @example With static inputs:
   * ```ts
   * snaplet.secrets([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.secrets((x) => x(3));
   * snaplet.secrets((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.secrets((x) => [{}, ...x(3), {}]);
   * ```
   */
  secrets: (
    inputs: secretsChildInputs<["secrets"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `sendTransferLogs`.
   * @example With static inputs:
   * ```ts
   * snaplet.sendTransferLogs([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.sendTransferLogs((x) => x(3));
   * snaplet.sendTransferLogs((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.sendTransferLogs((x) => [{}, ...x(3), {}]);
   * ```
   */
  sendTransferLogs: (
    inputs: sendTransferLogsChildInputs<["sendTransferLogs"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `tagReceipts`.
   * @example With static inputs:
   * ```ts
   * snaplet.tagReceipts([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.tagReceipts((x) => x(3));
   * snaplet.tagReceipts((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.tagReceipts((x) => [{}, ...x(3), {}]);
   * ```
   */
  tagReceipts: (
    inputs: tagReceiptsChildInputs<["tagReceipts"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `tagReservations`.
   * @example With static inputs:
   * ```ts
   * snaplet.tagReservations([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.tagReservations((x) => x(3));
   * snaplet.tagReservations((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.tagReservations((x) => [{}, ...x(3), {}]);
   * ```
   */
  tagReservations: (
    inputs: tagReservationsChildInputs<["tagReservations"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `tags`.
   * @example With static inputs:
   * ```ts
   * snaplet.tags([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.tags((x) => x(3));
   * snaplet.tags((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.tags((x) => [{}, ...x(3), {}]);
   * ```
   */
  tags: (
    inputs: tagsChildInputs<["tags"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Generate one or more `users`.
   * @example With static inputs:
   * ```ts
   * snaplet.users([{}, {}]);
   * ```
   * @example Using the `x` helper:
   * ```ts
   * snaplet.users((x) => x(3));
   * snaplet.users((x) => x({ min: 1, max: 10 }));
   * ```
   * @example Mixing both:
   * ```ts
   * snaplet.users((x) => [{}, ...x(3), {}]);
   * ```
   */
  users: (
    inputs: usersChildInputs<["users"]>,
    options?: PlanOptions,
  ) => Plan;
  /**
   * Compose multiple plans together, injecting the store of the previous plan into the next plan.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/generate#using-pipe | documentation}.
   */
  $pipe: Pipe;
  /**
   * Compose multiple plans together, without injecting the store of the previous plan into the next plan.
   * All stores stay independent and are merged together once all the plans are generated.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/generate#using-merge | documentation}.
   */
  $merge: Merge;
  /**
   * Create a store instance.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/generate#augmenting-external-data-with-createstore | documentation}.
   */
  $createStore: CreateStore;
};
type ScalarField = {
  name: string;
  type: string;
};
type ObjectField = ScalarField & {
  relationFromFields: string[];
  relationToFields: string[];
};
type Inflection = {
  modelName?: (name: string) => string;
  scalarField?: (field: ScalarField) => string;
  parentField?: (field: ObjectField, oppositeBaseNameMap: Record<string, string>) => string;
  childField?: (field: ObjectField, oppositeField: ObjectField, oppositeBaseNameMap: Record<string, string>) => string;
  oppositeBaseNameMap?: Record<string, string>;
};
type Override = {
  buckets?: {
    name?: string;
    fields?: {
      id?: string;
      name?: string;
      owner?: string;
      created_at?: string;
      updated_at?: string;
      public?: string;
      avif_autodetection?: string;
      file_size_limit?: string;
      allowed_mime_types?: string;
      owner_id?: string;
      objects?: string;
    };
  }
  chain_addresses?: {
    name?: string;
    fields?: {
      address?: string;
      user_id?: string;
      created_at?: string;
      users?: string;
    };
  }
  distribution_shares?: {
    name?: string;
    fields?: {
      id?: string;
      distribution_id?: string;
      user_id?: string;
      address?: string;
      amount?: string;
      hodler_pool_amount?: string;
      bonus_pool_amount?: string;
      fixed_pool_amount?: string;
      created_at?: string;
      updated_at?: string;
      index?: string;
      users?: string;
      distributions?: string;
    };
  }
  distribution_verification_values?: {
    name?: string;
    fields?: {
      type?: string;
      fixed_value?: string;
      bips_value?: string;
      distribution_id?: string;
      created_at?: string;
      updated_at?: string;
      distributions?: string;
    };
  }
  distribution_verifications?: {
    name?: string;
    fields?: {
      id?: string;
      distribution_id?: string;
      user_id?: string;
      type?: string;
      metadata?: string;
      created_at?: string;
      users?: string;
      distributions?: string;
    };
  }
  distributions?: {
    name?: string;
    fields?: {
      id?: string;
      number?: string;
      amount?: string;
      hodler_pool_bips?: string;
      bonus_pool_bips?: string;
      fixed_pool_bips?: string;
      name?: string;
      description?: string;
      qualification_start?: string;
      qualification_end?: string;
      claim_end?: string;
      snapshot_id?: string;
      hodler_min_balance?: string;
      created_at?: string;
      updated_at?: string;
      distribution_shares?: string;
      distribution_verification_values?: string;
      distribution_verifications?: string;
    };
  }
  feature_info?: {
    name?: string;
    fields?: {
      feature?: string;
      schema_name?: string;
      proname?: string;
      obj_identity?: string;
    };
  }
  key?: {
    name?: string;
    fields?: {
      id?: string;
      status?: string;
      created?: string;
      expires?: string;
      key_type?: string;
      key_id?: string;
      key_context?: string;
      name?: string;
      associated_data?: string;
      raw_key?: string;
      raw_key_nonce?: string;
      parent_key?: string;
      comment?: string;
      user_data?: string;
      key?: string;
      key?: string;
      secrets?: string;
    };
  }
  migrations?: {
    name?: string;
    fields?: {
      id?: string;
      name?: string;
      hash?: string;
      executed_at?: string;
    };
  }
  objects?: {
    name?: string;
    fields?: {
      id?: string;
      bucket_id?: string;
      name?: string;
      owner?: string;
      created_at?: string;
      updated_at?: string;
      last_accessed_at?: string;
      metadata?: string;
      path_tokens?: string;
      version?: string;
      owner_id?: string;
      buckets?: string;
    };
  }
  profiles?: {
    name?: string;
    fields?: {
      id?: string;
      avatar_url?: string;
      name?: string;
      about?: string;
      referral_code?: string;
      users?: string;
      referrals_referrals_referred_idToprofiles?: string;
      referrals_referrals_referrer_idToprofiles?: string;
    };
  }
  receipts?: {
    name?: string;
    fields?: {
      hash?: string;
      created_at?: string;
      user_id?: string;
      users?: string;
      tag_receipts?: string;
    };
  }
  referrals?: {
    name?: string;
    fields?: {
      referrer_id?: string;
      referred_id?: string;
      tag?: string;
      id?: string;
      profiles_referrals_referred_idToprofiles?: string;
      profiles_referrals_referrer_idToprofiles?: string;
      tags?: string;
    };
  }
  auth_schema_migrations?: {
    name?: string;
    fields?: {
      version?: string;
    };
  }
  supabase_migrations_schema_migrations?: {
    name?: string;
    fields?: {
      version?: string;
      statements?: string;
      name?: string;
    };
  }
  secrets?: {
    name?: string;
    fields?: {
      id?: string;
      name?: string;
      description?: string;
      secret?: string;
      key_id?: string;
      nonce?: string;
      created_at?: string;
      updated_at?: string;
      key?: string;
    };
  }
  send_transfer_logs?: {
    name?: string;
    fields?: {
      from?: string;
      to?: string;
      value?: string;
      block_number?: string;
      block_timestamp?: string;
      block_hash?: string;
      tx_hash?: string;
      log_index?: string;
      created_at?: string;
    };
  }
  tag_receipts?: {
    name?: string;
    fields?: {
      tag_name?: string;
      hash?: string;
      receipts?: string;
      tags?: string;
    };
  }
  tag_reservations?: {
    name?: string;
    fields?: {
      tag_name?: string;
      chain_address?: string;
      created_at?: string;
    };
  }
  tags?: {
    name?: string;
    fields?: {
      name?: string;
      status?: string;
      user_id?: string;
      created_at?: string;
      users?: string;
      referrals?: string;
      tag_receipts?: string;
    };
  }
  users?: {
    name?: string;
    fields?: {
      instance_id?: string;
      id?: string;
      aud?: string;
      role?: string;
      email?: string;
      encrypted_password?: string;
      email_confirmed_at?: string;
      invited_at?: string;
      confirmation_token?: string;
      confirmation_sent_at?: string;
      recovery_token?: string;
      recovery_sent_at?: string;
      email_change_token_new?: string;
      email_change?: string;
      email_change_sent_at?: string;
      last_sign_in_at?: string;
      raw_app_meta_data?: string;
      raw_user_meta_data?: string;
      is_super_admin?: string;
      created_at?: string;
      updated_at?: string;
      phone?: string;
      phone_confirmed_at?: string;
      phone_change?: string;
      phone_change_token?: string;
      phone_change_sent_at?: string;
      confirmed_at?: string;
      email_change_token_current?: string;
      email_change_confirm_status?: string;
      banned_until?: string;
      reauthentication_token?: string;
      reauthentication_sent_at?: string;
      is_sso_user?: string;
      deleted_at?: string;
      chain_addresses?: string;
      distribution_shares?: string;
      distribution_verifications?: string;
      profiles?: string;
      receipts?: string;
      tags?: string;
    };
  }}
export type Alias = {
  inflection?: Inflection | false;
  override?: Override;
};