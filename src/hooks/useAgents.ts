
/**
 * @fileoverview This custom React hook manages agency and agent data for the application.
 * It loads information from localStorage, seeds default demo data if none exists,
 * and provides functions to retrieve agency and agent items.
 */
import * as React from 'react';
import type { Agency, AgentProfile, AgentAddress, CountryItem } from '@/types/agent';
import { generateGUID } from '@/lib/utils';
import { useCountries, DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID, DEFAULT_BANGLADESH_ID } from './useCountries'; // For seeding with valid country IDs
import { useToast } from './use-toast';

const AGENCIES_STORAGE_KEY = 'itineraryAceAgencies';
const AGENTS_STORAGE_KEY = 'itineraryAceAgents';

// --- Default Demo Data ---
const DEFAULT_AGENCIES_DATA_SEED: Omit<Agency, 'id'>[] = [
  {
    name: "Global Travel Experts",
    mainAddress: { street: "100 Sukhumvit Rd", city: "Bangkok", postalCode: "10110", countryId: DEFAULT_THAILAND_ID, stateProvince: "Bangkok" },
    contactEmail: "contact@globaltravel.com",
    contactPhone: "+66 2 555 0100"
  },
  {
    name: "Local Adventures Inc.",
    mainAddress: { street: "50 Jalan Ampang", city: "Kuala Lumpur", postalCode: "50450", countryId: DEFAULT_MALAYSIA_ID, stateProvince: "WP Kuala Lumpur" },
    contactEmail: "info@localadventures.my",
    contactPhone: "+60 3 555 0200"
  },
  {
    name: "Bengal Voyager",
    mainAddress: { street: "75 Gulshan Ave", city: "Dhaka", postalCode: "1212", countryId: DEFAULT_BANGLADESH_ID, stateProvince: "Dhaka" },
    contactEmail: "support@bengalvoyager.com.bd",
    contactPhone: "+880 2 555 0300"
  }
];

// Generate fixed IDs for default agencies for consistent relationships
const AGENCY_ID_GLOBAL_TRAVEL = `agency_${DEFAULT_THAILAND_ID.substring(0,8)}_global`;
const AGENCY_ID_LOCAL_ADVENTURES = `agency_${DEFAULT_MALAYSIA_ID.substring(0,8)}_local`;
const AGENCY_ID_BENGAL_VOYAGER = `agency_${DEFAULT_BANGLADESH_ID.substring(0,8)}_bengal`;

const DEFAULT_AGENTS_DATA_SEED: Omit<AgentProfile, 'id'>[] = [
  {
    agencyId: AGENCY_ID_GLOBAL_TRAVEL,
    fullName: "John Doe",
    email: "john.doe@globaltravel.com",
    phoneNumber: "+66 81 123 4567",
    agencyName: "Global Travel Experts (Sukhumvit Branch)", // Example of specific branch name
    agencyAddress: { street: "100 Sukhumvit Rd", city: "Bangkok", postalCode: "10110", countryId: DEFAULT_THAILAND_ID, stateProvince: "Bangkok" },
    preferredCurrency: "THB",
    specializations: "Luxury Travel, Thailand & SE Asia",
    yearsOfExperience: 10,
    bio: "Experienced travel consultant specializing in bespoke luxury itineraries across Southeast Asia."
  },
  {
    agencyId: AGENCY_ID_GLOBAL_TRAVEL,
    fullName: "Alice Smith",
    email: "alice.smith@globaltravel.com",
    phoneNumber: "+66 82 987 6543",
    preferredCurrency: "USD",
    specializations: "Cultural Tours, Indochina",
    yearsOfExperience: 7,
    bio: "Passionate about cultural immersion and unique travel experiences in Vietnam, Laos, and Cambodia."
  },
  {
    agencyId: AGENCY_ID_LOCAL_ADVENTURES,
    fullName: "Bob Johnson",
    email: "bob.johnson@localadventures.my",
    phoneNumber: "+60 12 345 6789",
    preferredCurrency: "MYR",
    specializations: "Adventure Tours, Malaysia & Borneo",
    yearsOfExperience: 5,
    bio: "Your guide for thrilling adventures, from jungle trekking in Borneo to diving in Sipadan."
  },
  {
    agencyId: AGENCY_ID_BENGAL_VOYAGER,
    fullName: "Fatima Ahmed",
    email: "fatima.ahmed@bengalvoyager.com.bd",
    phoneNumber: "+880 17 111 2222",
    preferredCurrency: "BDT",
    specializations: "Heritage Tours, Bangladesh",
    yearsOfExperience: 8,
    bio: "Discover the rich history and vibrant culture of Bangladesh with expertly crafted tours."
  }
];

const assignFixedAgencyIds = (data: Omit<Agency, 'id'>[]): Agency[] => {
  return data.map(agency => {
    let id = generateGUID();
    if (agency.name === "Global Travel Experts") id = AGENCY_ID_GLOBAL_TRAVEL;
    else if (agency.name === "Local Adventures Inc.") id = AGENCY_ID_LOCAL_ADVENTURES;
    else if (agency.name === "Bengal Voyager") id = AGENCY_ID_BENGAL_VOYAGER;
    return { ...agency, id };
  });
};


export function useAgents() {
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const [agencies, setAgencies] = React.useState<Agency[]>([]);
  const [agents, setAgents] = React.useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchAndSeedData = React.useCallback(async () => {
    if (isLoadingCountries) return; 

    setIsLoading(true);
    setError(null);

    try {
      const storedAgencies = localStorage.getItem(AGENCIES_STORAGE_KEY);
      let agenciesToSet: Agency[] = [];
      if (storedAgencies) {
        agenciesToSet = JSON.parse(storedAgencies);
      } else {
        agenciesToSet = assignFixedAgencyIds(DEFAULT_AGENCIES_DATA_SEED);
        localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(agenciesToSet));
      }
      const defaultAgenciesWithFixedIds = assignFixedAgencyIds(DEFAULT_AGENCIES_DATA_SEED);
      defaultAgenciesWithFixedIds.forEach(da => {
        const existing = agenciesToSet.find(a => a.id === da.id);
        if (!existing) agenciesToSet.push(da);
      });
      agenciesToSet.sort((a, b) => a.name.localeCompare(b.name));
      setAgencies(agenciesToSet);

      const storedAgents = localStorage.getItem(AGENTS_STORAGE_KEY);
      let agentsToSet: AgentProfile[] = [];
      if (storedAgents) {
        agentsToSet = JSON.parse(storedAgents);
      } else {
        agentsToSet = DEFAULT_AGENTS_DATA_SEED.map(a => ({ ...a, id: generateGUID() }));
        localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agentsToSet));
      }
      DEFAULT_AGENTS_DATA_SEED.forEach(da => {
        const existing = agentsToSet.find(a => a.email === da.email && a.agencyId === da.agencyId);
        if (!existing) agentsToSet.push({ ...da, id: generateGUID() });
      });
      setAgents(agentsToSet);

    } catch (e: any) {
      console.error("Error initializing agent/agency data from localStorage:", e);
      setError("Failed to load agent/agency data.");
      const defaultAgencies = assignFixedAgencyIds(DEFAULT_AGENCIES_DATA_SEED);
      setAgencies(defaultAgencies.sort((a, b) => a.name.localeCompare(b.name)));
      localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(defaultAgencies));
      const defaultAgents = DEFAULT_AGENTS_DATA_SEED.map(a => ({ ...a, id: generateGUID() }));
      setAgents(defaultAgents);
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(defaultAgents));
    }
    setIsLoading(false);
  }, [isLoadingCountries, countries]);

  React.useEffect(() => {
    fetchAndSeedData();
  }, [fetchAndSeedData]);

  const getAgencies = React.useCallback((): Agency[] => {
    return agencies;
  }, [agencies]);

  const getAgentsByAgencyId = React.useCallback((agencyId: string): AgentProfile[] => {
    return agents.filter(agent => agent.agencyId === agencyId);
  }, [agents]);

  const getAllAgents = React.useCallback((): AgentProfile[] => {
    return agents;
  }, [agents]);

  const addAgency = React.useCallback((agencyData: Omit<Agency, 'id'>) => {
    const newAgency: Agency = { ...agencyData, id: generateGUID() };
    const updatedAgencies = [...agencies, newAgency].sort((a, b) => a.name.localeCompare(b.name));
    setAgencies(updatedAgencies);
    localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(updatedAgencies));
    toast({ title: "Agency Added", description: `Agency "${newAgency.name}" has been successfully added.` });
  }, [agencies, toast]);

  const updateAgency = React.useCallback((updatedAgencyData: Agency) => {
    const updatedAgencies = agencies.map(agency =>
      agency.id === updatedAgencyData.id ? updatedAgencyData : agency
    ).sort((a, b) => a.name.localeCompare(b.name));
    setAgencies(updatedAgencies);
    localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(updatedAgencies));
    toast({ title: "Agency Updated", description: `Agency "${updatedAgencyData.name}" has been successfully updated.` });
  }, [agencies, toast]);

  const deleteAgency = React.useCallback((agencyId: string) => {
    const agencyToDelete = agencies.find(a => a.id === agencyId);
    const updatedAgencies = agencies.filter(agency => agency.id !== agencyId);
    setAgencies(updatedAgencies);
    localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(updatedAgencies));
    // Optionally, handle deleting/unlinking agents associated with this agency
    const updatedAgents = agents.filter(agent => agent.agencyId !== agencyId);
    setAgents(updatedAgents); // Or update their agencyId to a default/unassigned
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updatedAgents));
    if (agencyToDelete) {
      toast({ title: "Agency Deleted", description: `Agency "${agencyToDelete.name}" and its agents have been removed.`, variant: "destructive" });
    }
  }, [agencies, agents, toast]);

  return {
    agencies,
    agents,
    isLoading: isLoading || isLoadingCountries,
    error,
    getAgencies,
    getAgentsByAgencyId,
    getAllAgents,
    addAgency,
    updateAgency,
    deleteAgency,
    refreshAgentData: fetchAndSeedData
  };
}
