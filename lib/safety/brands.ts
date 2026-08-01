/**
 * Known employers/institutions frequently impersonated in recruitment scams,
 * with their official registrable domains.
 *
 * A wrong entry here produces a false warning on a real site, so the UI must
 * never say "this is fake" — only that the address does not match the official
 * domain on record.
 */
export interface Brand {
  name: string;
  /** Lowercase tokens that identify the brand inside a hostname. */
  tokens: string[];
  officialDomains: string[];
}

export const BRANDS: Brand[] = [
  // Telcos
  { name: 'MTN', tokens: ['mtn'], officialDomains: ['mtn.ng', 'mtn.com', 'mtnonline.com'] },
  { name: 'Airtel', tokens: ['airtel'], officialDomains: ['airtel.com.ng', 'airtel.com', 'airtel.africa'] },
  { name: 'Glo', tokens: ['gloworld', 'glomobile'], officialDomains: ['gloworld.com'] },
  { name: '9mobile', tokens: ['9mobile'], officialDomains: ['9mobile.com.ng'] },
  { name: 'Safaricom', tokens: ['safaricom'], officialDomains: ['safaricom.co.ke'] },
  { name: 'Vodacom', tokens: ['vodacom'], officialDomains: ['vodacom.co.za', 'vodacom.com'] },
  // Banks
  { name: 'GTBank', tokens: ['gtbank', 'gtco', 'gtworld'], officialDomains: ['gtbank.com', 'gtcoplc.com'] },
  { name: 'Zenith Bank', tokens: ['zenithbank', 'zenith'], officialDomains: ['zenithbank.com'] },
  { name: 'Access Bank', tokens: ['accessbank'], officialDomains: ['accessbankplc.com'] },
  { name: 'First Bank', tokens: ['firstbank'], officialDomains: ['firstbanknigeria.com'] },
  { name: 'UBA', tokens: ['ubagroup', 'ubaplc'], officialDomains: ['ubagroup.com'] },
  { name: 'Ecobank', tokens: ['ecobank'], officialDomains: ['ecobank.com'] },
  { name: 'Stanbic IBTC', tokens: ['stanbic', 'stanbicibtc'], officialDomains: ['stanbicibtcbank.com', 'standardbank.com'] },
  { name: 'Equity Bank', tokens: ['equitybank'], officialDomains: ['equitygroupholdings.com', 'equitybankgroup.com'] },
  { name: 'KCB', tokens: ['kcbgroup', 'kcbbank'], officialDomains: ['kcbgroup.com'] },
  // Large employers
  { name: 'Dangote', tokens: ['dangote'], officialDomains: ['dangote.com'] },
  { name: 'NNPC', tokens: ['nnpc'], officialDomains: ['nnpcgroup.com'] },
  { name: 'Shell', tokens: ['shell'], officialDomains: ['shell.com', 'shell.com.ng'] },
  { name: 'Chevron', tokens: ['chevron'], officialDomains: ['chevron.com'] },
  { name: 'TotalEnergies', tokens: ['totalenergies'], officialDomains: ['totalenergies.com'] },
  { name: 'Flutterwave', tokens: ['flutterwave'], officialDomains: ['flutterwave.com'] },
  { name: 'Paystack', tokens: ['paystack'], officialDomains: ['paystack.com'] },
  { name: 'Jumia', tokens: ['jumia'], officialDomains: ['jumia.com.ng', 'jumia.com', 'group.jumia.com'] },
  { name: 'Interswitch', tokens: ['interswitch'], officialDomains: ['interswitchgroup.com'] },
  // Government & institutions
  { name: 'NYSC', tokens: ['nysc'], officialDomains: ['nysc.gov.ng', 'nysc.org.ng'] },
  { name: 'JAMB', tokens: ['jamb'], officialDomains: ['jamb.gov.ng'] },
  { name: 'WAEC', tokens: ['waec'], officialDomains: ['waecnigeria.org', 'waecdirect.org'] },
  { name: 'NPower', tokens: ['npower'], officialDomains: ['npower.gov.ng'] },
  { name: 'NIMC', tokens: ['nimc'], officialDomains: ['nimc.gov.ng'] },
  { name: 'CBN', tokens: ['cenbank', 'centralbank'], officialDomains: ['cbn.gov.ng'] },
  { name: 'Nigerian Immigration', tokens: ['immigration'], officialDomains: ['immigration.gov.ng'] },
  { name: 'Federal Inland Revenue', tokens: ['firs'], officialDomains: ['firs.gov.ng'] },
  // Job boards & global platforms
  { name: 'Jobberman', tokens: ['jobberman'], officialDomains: ['jobberman.com'] },
  { name: 'BrighterMonday', tokens: ['brightermonday'], officialDomains: ['brightermonday.co.ke'] },
  { name: 'MyJobMag', tokens: ['myjobmag'], officialDomains: ['myjobmag.com'] },
  { name: 'LinkedIn', tokens: ['linkedin'], officialDomains: ['linkedin.com'] },
  { name: 'Indeed', tokens: ['indeed'], officialDomains: ['indeed.com'] },
  { name: 'Google', tokens: ['google'], officialDomains: ['google.com', 'about.google', 'careers.google.com'] },
  { name: 'Microsoft', tokens: ['microsoft'], officialDomains: ['microsoft.com'] },
  { name: 'Amazon', tokens: ['amazon'], officialDomains: ['amazon.com', 'amazon.jobs'] },
  { name: 'United Nations', tokens: ['unitednations', 'uncareers'], officialDomains: ['un.org', 'careers.un.org'] },
];
