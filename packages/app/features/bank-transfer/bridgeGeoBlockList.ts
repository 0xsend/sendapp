// Countries where Bridge marks US ACH/FedWire as "No" (ISO alpha-2 codes).
// Source: https://apidocs.bridge.xyz/platform/customers/compliance/supported-countries-list
// Note: Bridge lists Ukrainian Territories separately; country_code2 can't distinguish them from UA.
export const BRIDGE_ACH_WIRE_BLOCKLIST: readonly string[] = [
  'AF', // Afghanistan
  'BY', // Belarus
  'CD', // Congo, Democratic Republic of
  'CU', // Cuba
  'PS', // Gaza Strip / West Bank (Palestinian Territory, Occupied)
  'IR', // Iran
  'IQ', // Iraq
  'LB', // Lebanon
  'LY', // Libya
  'MM', // Myanmar
  'KP', // North Korea
  'RU', // Russian Federation
  'SO', // Somalia
  'SS', // South Sudan
  'SD', // Sudan
  'SY', // Syria
  'YE', // Yemen
  'DZ', // Algeria
  'BD', // Bangladesh
  'CN', // China
  'GW', // Guinea-Bissau
  'HT', // Haiti
  'MA', // Morocco
  'MZ', // Mozambique
  'NP', // Nepal
  'MK', // North Macedonia
  'PK', // Pakistan
  'QA', // Qatar
  'VE', // Venezuela
  'BT', // Bhutan
  'BI', // Burundi
  'XK', // Kosovo (not ISO official, but commonly returned by IP geolocation)
  'NE', // Niger
  'NG', // Nigeria
  'ZW', // Zimbabwe
]
