import analysesJson from './analyses.json';
import profilesJson from './profiles.json';
import tendersJson from './tenders.json';
import { CompanyProfile, Tender, TenderAnalysis, Verdict } from '../models';

export interface TenderDossier extends Tender {
  analysis: TenderAnalysis;
}

export const mockProfiles = profilesJson as CompanyProfile[];
export const mockTenders = tendersJson as Tender[];
export const mockAnalysesByProfile = analysesJson as Record<string, TenderAnalysis[]>;

export function getTenderAnalysesForProfile(profileId: string): TenderAnalysis[] {
  return mockAnalysesByProfile[profileId] ?? [];
}

export function getTenderDossiersForProfile(profileId: string): TenderDossier[] {
  const analysesByTenderId = new Map(
    getTenderAnalysesForProfile(profileId).map((analysis) => [analysis.tender_id, analysis]),
  );

  return mockTenders.map((tender) => {
    const analysis = analysesByTenderId.get(tender.id);

    if (!analysis) {
      throw new Error(`Missing analysis for tender ${tender.id} in profile ${profileId}`);
    }

    return {
      ...tender,
      analysis,
    };
  });
}

export const mockTenderDossiers = getTenderDossiersForProfile(mockProfiles[0]?.id ?? 'profile-a');

export const verdictLabels: Record<Verdict, string> = {
  BID: 'Bid ready',
  MAYBE: 'Under review',
  REJECT: 'Disqualified',
};

export const verdictOrder: Verdict[] = ['BID', 'MAYBE', 'REJECT'];

export function getTenderDossier(tenderId: string): TenderDossier | undefined {
  return mockTenderDossiers.find((dossier) => dossier.id === tenderId);
}
