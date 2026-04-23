// ==================== BANK DATABASE BY COUNTRY ====================

export interface Bank {
  name: string;
  code: string;
  swift?: string;
}

export interface CountryBankInfo {
  countryCode: string;
  countryName: string;
  currency: string;
  banks: Bank[];
  requiredFields: {
    field: string;
    label: string;
    placeholder: string;
    required: boolean;
  }[];
  localTransferNote: string;
}

export const countryBankData: Record<string, CountryBankInfo> = {
  US: {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    banks: [
      { name: 'JPMorgan Chase', code: 'CHASE', swift: 'CHASUS33' },
      { name: 'Bank of America', code: 'BOA', swift: 'BOFAUS3N' },
      { name: 'Wells Fargo', code: 'WF', swift: 'WFBIUS6S' },
      { name: 'Citibank', code: 'CITI', swift: 'CITIUS33' },
      { name: 'Goldman Sachs', code: 'GS', swift: 'GOLDUS33' },
      { name: 'Morgan Stanley', code: 'MS', swift: 'MSNYUS33' },
      { name: 'HSBC USA', code: 'HSBC_US', swift: 'MRMDUS33' },
      { name: 'Capital One', code: 'COF', swift: 'HIBKUS44' },
      { name: 'PNC Bank', code: 'PNC', swift: 'PNCCUS33' },
      { name: 'TD Bank', code: 'TD', swift: 'NRTHUS33' },
      { name: 'Truist Financial', code: 'TFC', swift: 'BRBTUS33' },
      { name: 'US Bank', code: 'USB', swift: 'USBKUS44' },
      { name: 'Charles Schwab', code: 'SCHW', swift: 'SCHWUS33' },
      { name: 'Fidelity', code: 'FID', swift: 'FETIUS33' },
      { name: 'Ally Bank', code: 'ALLY', swift: 'ALLYUS33' },
      { name: 'Discover Bank', code: 'DISC', swift: 'DISCUS33' },
      { name: 'Fifth Third Bank', code: 'FTB', swift: 'FTBCUS33' },
      { name: 'Regions Bank', code: 'REG', swift: 'UPNBUS44' },
      { name: 'KeyBank', code: 'KEY', swift: 'KEYBUS33' },
      { name: 'Citizens Bank', code: 'CTZ', swift: 'CTZIUS33' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: 'e.g., 000123456789', required: true },
      { field: 'routing_number', label: 'Routing Number (ABA)', placeholder: '9-digit routing number', required: true },
    ],
    localTransferNote: 'Domestic ACH transfer — 1-2 business days',
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currency: 'GBP',
    banks: [
      { name: 'HSBC UK', code: 'HSBC_GB', swift: 'HBUKGB4B' },
      { name: 'Barclays', code: 'BARC', swift: 'BARCGB22' },
      { name: 'Lloyds Bank', code: 'LLOY', swift: 'LOYDGB2L' },
      { name: 'NatWest', code: 'NWBK', swift: 'NWBKGB2L' },
      { name: 'Santander UK', code: 'SANT_GB', swift: 'ABBYGB2L' },
      { name: 'Metro Bank', code: 'MYB', swift: 'MYBUGB2L' },
      { name: 'Monzo', code: 'MONZO', swift: 'MONZGB2L' },
      { name: 'Starling Bank', code: 'STRL', swift: 'SRLGGB2L' },
      { name: 'Halifax', code: 'HLFX', swift: 'HLFXGB22' },
      { name: 'TSB Bank', code: 'TSB', swift: 'TSBSGB2A' },
      { name: 'Nationwide', code: 'NBS', swift: 'NAIAGB21' },
      { name: 'Virgin Money', code: 'VM', swift: 'CITIGB2L' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: '8-digit account number', required: true },
      { field: 'routing_number', label: 'Sort Code', placeholder: 'e.g., 12-34-56', required: true },
    ],
    localTransferNote: 'Faster Payments — usually instant',
  },
  EU: {
    countryCode: 'EU',
    countryName: 'European Union',
    currency: 'EUR',
    banks: [
      { name: 'Deutsche Bank', code: 'DB', swift: 'DEUTDEFF' },
      { name: 'BNP Paribas', code: 'BNP', swift: 'BNPAFRPP' },
      { name: 'ING Bank', code: 'ING', swift: 'INGBNL2A' },
      { name: 'Santander', code: 'SANT_EU', swift: 'BSCHESMM' },
      { name: 'UniCredit', code: 'UC', swift: 'UNCRITMM' },
      { name: 'Commerzbank', code: 'CBK', swift: 'COBADEFF' },
      { name: 'Intesa Sanpaolo', code: 'ISP', swift: 'BCITITMM' },
      { name: 'Société Générale', code: 'SG', swift: 'SOGEFRPP' },
      { name: 'Crédit Agricole', code: 'CA', swift: 'AGRIFRPP' },
      { name: 'Rabobank', code: 'RABO', swift: 'RABONL2U' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'IBAN', placeholder: 'e.g., DE89 3704 0044 0532 0130 00', required: true },
      { field: 'routing_number', label: 'BIC/SWIFT (optional)', placeholder: 'e.g., DEUTDEFF', required: false },
    ],
    localTransferNote: 'SEPA transfer — 1 business day',
  },
  NG: {
    countryCode: 'NG',
    countryName: 'Nigeria',
    currency: 'NGN',
    banks: [
      { name: 'First Bank of Nigeria', code: 'FBN', swift: 'FBNINGLA' },
      { name: 'Guaranty Trust Bank', code: 'GTB', swift: 'GTBINGLA' },
      { name: 'Access Bank', code: 'ACC', swift: 'ABNGNGLA' },
      { name: 'Zenith Bank', code: 'ZEN', swift: 'ZEIBNGLA' },
      { name: 'United Bank for Africa', code: 'UBA', swift: 'UNAFNGLA' },
      { name: 'Ecobank Nigeria', code: 'ECO_NG', swift: 'ECOCNGLA' },
      { name: 'Fidelity Bank', code: 'FID_NG', swift: 'FIDTNGLA' },
      { name: 'Union Bank', code: 'UNB', swift: 'UBNINGLA' },
      { name: 'Stanbic IBTC', code: 'STAN_NG', swift: 'SBICNGLX' },
      { name: 'Polaris Bank', code: 'POL', swift: 'PRDTNGLA' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: '10-digit NUBAN', required: true },
    ],
    localTransferNote: 'NIP transfer — instant',
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    currency: 'INR',
    banks: [
      { name: 'State Bank of India', code: 'SBI', swift: 'SBININBB' },
      { name: 'HDFC Bank', code: 'HDFC', swift: 'HDFCINBB' },
      { name: 'ICICI Bank', code: 'ICICI', swift: 'ICICINBB' },
      { name: 'Axis Bank', code: 'AXIS', swift: 'AXISINBB' },
      { name: 'Punjab National Bank', code: 'PNB_IN', swift: 'PUNBINBB' },
      { name: 'Bank of Baroda', code: 'BOB', swift: 'BARBINBB' },
      { name: 'Canara Bank', code: 'CAN', swift: 'CNRBINBB' },
      { name: 'Union Bank of India', code: 'UBI', swift: 'UBININBB' },
      { name: 'Kotak Mahindra Bank', code: 'KOTAK', swift: 'KKBKINBB' },
      { name: 'IndusInd Bank', code: 'INDUS', swift: 'INDBINBB' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: 'Account number', required: true },
      { field: 'routing_number', label: 'IFSC Code', placeholder: 'e.g., HDFC0001234', required: true },
    ],
    localTransferNote: 'IMPS/NEFT — instant to 2 hours',
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    currency: 'BRL',
    banks: [
      { name: 'Itaú Unibanco', code: 'ITAU', swift: 'ITAUBRSP' },
      { name: 'Banco do Brasil', code: 'BB', swift: 'BRASBRRJ' },
      { name: 'Bradesco', code: 'BRAD', swift: 'BBDEBRSP' },
      { name: 'Caixa Econômica', code: 'CEF', swift: 'CEFXBRSP' },
      { name: 'Santander Brasil', code: 'SANT_BR', swift: 'BSCHBRSP' },
      { name: 'Nubank', code: 'NU', swift: 'NUMBBRSP' },
      { name: 'Banco Inter', code: 'INTER', swift: 'BICBBRSP' },
      { name: 'BTG Pactual', code: 'BTG', swift: 'BPACBRSP' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number + Digit', placeholder: 'e.g., 12345-6', required: true },
      { field: 'routing_number', label: 'Branch Code (Agência)', placeholder: 'e.g., 1234', required: true },
    ],
    localTransferNote: 'TED/DOC — same day',
  },
  GH: {
    countryCode: 'GH',
    countryName: 'Ghana',
    currency: 'GHS',
    banks: [
      { name: 'GCB Bank', code: 'GCB', swift: 'GHCBGHAC' },
      { name: 'Ecobank Ghana', code: 'ECO_GH', swift: 'ECOCGHAC' },
      { name: 'Stanbic Bank Ghana', code: 'STAN_GH', swift: 'SBICGHAC' },
      { name: 'Absa Bank Ghana', code: 'ABSA_GH', swift: 'BARCGHAC' },
      { name: 'Fidelity Bank Ghana', code: 'FID_GH', swift: 'FBLIGHAC' },
      { name: 'CalBank', code: 'CAL', swift: 'ACCCGHAC' },
      { name: 'Zenith Bank Ghana', code: 'ZEN_GH', swift: 'ZEIBGHAC' },
      { name: 'GTBank Ghana', code: 'GT_GH', swift: 'GTBIUS44' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: 'Account number', required: true },
    ],
    localTransferNote: 'GHIPSS — instant',
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    currency: 'KES',
    banks: [
      { name: 'Equity Bank', code: 'EQTY', swift: 'EQBLKENA' },
      { name: 'KCB Bank', code: 'KCB', swift: 'KCBLKENX' },
      { name: 'Co-operative Bank', code: 'COOP', swift: 'KCOOKENA' },
      { name: 'Stanbic Bank Kenya', code: 'STAN_KE', swift: 'SBICKENX' },
      { name: 'Absa Bank Kenya', code: 'ABSA_KE', swift: 'BARCKENX' },
      { name: 'Standard Chartered Kenya', code: 'SC_KE', swift: 'SCBLKENX' },
      { name: 'DTB Bank', code: 'DTB', swift: 'DTKEKENA' },
      { name: 'I&M Bank', code: 'IM', swift: 'IMBLKENA' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: 'Account number', required: true },
    ],
    localTransferNote: 'KESWITCH — instant',
  },
  PH: {
    countryCode: 'PH',
    countryName: 'Philippines',
    currency: 'PHP',
    banks: [
      { name: 'BDO Unibank', code: 'BDO', swift: 'BNORPHMM' },
      { name: 'Bank of the Philippine Islands', code: 'BPI', swift: 'BOPIPHMM' },
      { name: 'Metrobank', code: 'MBT', swift: 'MBTCPHMM' },
      { name: 'Land Bank', code: 'LBP', swift: 'TLBPPHMM' },
      { name: 'Security Bank', code: 'SEC', swift: 'SETCPHMM' },
      { name: 'UnionBank', code: 'UBP', swift: 'UBPHPHMM' },
      { name: 'PNB', code: 'PNB_PH', swift: 'PNBMPHMM' },
      { name: 'China Banking', code: 'CBC', swift: 'CHBKPHMM' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: 'Account number', required: true },
    ],
    localTransferNote: 'PESONet — same day',
  },
  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    currency: 'MXN',
    banks: [
      { name: 'BBVA México', code: 'BBVA_MX', swift: 'BBVAMXMM' },
      { name: 'Citibanamex', code: 'CITI_MX', swift: 'CITIMXMX' },
      { name: 'Santander México', code: 'SANT_MX', swift: 'BSCHMXMM' },
      { name: 'Banorte', code: 'BNT', swift: 'MIFOMXMT' },
      { name: 'HSBC México', code: 'HSBC_MX', swift: 'BIMEMXMM' },
      { name: 'Scotiabank México', code: 'SC_MX', swift: 'BNSDMXMM' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'CLABE', placeholder: '18-digit CLABE', required: true },
    ],
    localTransferNote: 'SPEI — instant',
  },
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    currency: 'ZAR',
    banks: [
      { name: 'Standard Bank', code: 'SB_ZA', swift: 'SBZAZAJJ' },
      { name: 'ABSA Bank', code: 'ABSA_ZA', swift: 'ABSAZAJJ' },
      { name: 'First National Bank', code: 'FNB', swift: 'FIRNZAJJ' },
      { name: 'Nedbank', code: 'NED', swift: 'NEDSZAJJ' },
      { name: 'Capitec Bank', code: 'CPT', swift: 'CABLZAJJ' },
      { name: 'Investec Bank', code: 'INV', swift: 'IVESZAJJ' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: 'Account number', required: true },
      { field: 'routing_number', label: 'Branch Code', placeholder: '6-digit branch code', required: true },
    ],
    localTransferNote: 'EFT — same day',
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    currency: 'AUD',
    banks: [
      { name: 'Commonwealth Bank', code: 'CBA', swift: 'CTBAAU2S' },
      { name: 'Westpac', code: 'WBC', swift: 'WPACAU2S' },
      { name: 'ANZ Bank', code: 'ANZ', swift: 'ANZBAU3M' },
      { name: 'National Australia Bank', code: 'NAB', swift: 'NATAAU33' },
      { name: 'Macquarie Bank', code: 'MQG', swift: 'MACQAU2S' },
      { name: 'ING Australia', code: 'ING_AU', swift: 'INGBAU2S' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: 'Account number', required: true },
      { field: 'routing_number', label: 'BSB Code', placeholder: 'e.g., 062-000', required: true },
    ],
    localTransferNote: 'NPP/Osko — instant',
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    currency: 'CAD',
    banks: [
      { name: 'Royal Bank of Canada', code: 'RBC', swift: 'ROYCCAT2' },
      { name: 'TD Canada Trust', code: 'TD_CA', swift: 'TDOMCATTT' },
      { name: 'Scotiabank', code: 'BNS', swift: 'NOSCCATT' },
      { name: 'Bank of Montreal', code: 'BMO', swift: 'BOFMCAM2' },
      { name: 'CIBC', code: 'CIBC', swift: 'CIBCCATT' },
      { name: 'National Bank of Canada', code: 'NBC', swift: 'BNDCCAMM' },
      { name: 'HSBC Canada', code: 'HSBC_CA', swift: 'HKBCCATT' },
      { name: 'Simplii Financial', code: 'SIMP', swift: 'CIBCCATT' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: 'Account number', required: true },
      { field: 'routing_number', label: 'Transit + Institution', placeholder: 'e.g., 12345-001', required: true },
    ],
    localTransferNote: 'Interac e-Transfer — instant',
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    currency: 'JPY',
    banks: [
      { name: 'MUFG Bank', code: 'MUFG', swift: 'BOTKJPJT' },
      { name: 'Sumitomo Mitsui Banking', code: 'SMBC', swift: 'SMBCJPJT' },
      { name: 'Mizuho Bank', code: 'MIZ', swift: 'MHCBJPJT' },
      { name: 'Resona Bank', code: 'RES', swift: 'DIWAJPJT' },
      { name: 'Japan Post Bank', code: 'JPB', swift: 'JPPSJPJ1' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: '7-digit account number', required: true },
      { field: 'routing_number', label: 'Branch Code + Account Type', placeholder: 'e.g., 123-4567890 (ordinary)', required: true },
    ],
    localTransferNote: 'Zengin — same day',
  },
  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    currency: 'SGD',
    banks: [
      { name: 'DBS Bank', code: 'DBS', swift: 'DBSSSGSG' },
      { name: 'OCBC Bank', code: 'OCBC', swift: 'OCBCSGSG' },
      { name: 'UOB', code: 'UOB', swift: 'UOVBSGSG' },
      { name: 'Standard Chartered Singapore', code: 'SC_SG', swift: 'SCBLSGSG' },
      { name: 'Citibank Singapore', code: 'CITI_SG', swift: 'CITISGSG' },
      { name: 'HSBC Singapore', code: 'HSBC_SG', swift: 'HSBCSGSG' },
      { name: 'Maybank Singapore', code: 'MAYB', swift: 'MBBESGSG' },
    ],
    requiredFields: [
      { field: 'account_number', label: 'Account Number', placeholder: 'Account number', required: true },
    ],
    localTransferNote: 'FAST/PayNow — instant',
  },
};

export function getBankInfo(countryCode: string): CountryBankInfo | null {
  return countryBankData[countryCode] || null;
}

export function getAllCountryBanks(): { code: string; name: string }[] {
  return Object.values(countryBankData).map(c => ({ code: c.countryCode, name: c.countryName }));
}
