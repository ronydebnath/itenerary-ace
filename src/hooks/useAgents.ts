
/**
 * @fileoverview This custom React hook manages agency and agent data for the application.
 * It loads information from localStorage, seeds default demo data if none exists,
 * and provides functions to retrieve, add, update, and delete agency and agent items.
 */
import * as React from 'react';
import type { Agency, AgentProfile, AgentAddress } from '@/types/agent';
import { generateGUID } from '@/lib/utils';
import { useCountries, DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID, DEFAULT_BANGLADESH_ID } from './useCountries';
import { useToast } from './use-toast';
import type { CurrencyCode } from '@/types/itinerary';

const AGENCIES_STORAGE_KEY = 'itineraryAceAgencies';
const AGENTS_STORAGE_KEY = 'itineraryAceAgents';

// --- Default Demo Data ---
const DEFAULT_AGENCIES_DATA_SEED: Omit<Agency, 'id'>[] = [
  {
    name: "Global Travel Experts",
    mainAddress: { street: "100 Sukhumvit Rd", city: "Bangkok", postalCode: "10110", countryId: DEFAULT_THAILAND_ID, stateProvince: "Bangkok" },
    contactEmail: "contact@globaltravel.com",
    contactPhone: "+66 2 555 0100",
    preferredCurrency: "THB" as CurrencyCode,
  },
  {
    name: "Local Adventures Inc.",
    mainAddress: { street: "50 Jalan Ampang", city: "Kuala Lumpur", postalCode: "50450", countryId: DEFAULT_MALAYSIA_ID, stateProvince: "WP Kuala Lumpur" },
    contactEmail: "info@localadventures.my",
    contactPhone: "+60 3 555 0200",
    preferredCurrency: "MYR" as CurrencyCode,
  },
  {
    name: "Bengal Voyager",
    mainAddress: { street: "75 Gulshan Ave", city: "Dhaka", postalCode: "1212", countryId: DEFAULT_BANGLADESH_ID, stateProvince: "Dhaka" },
    contactEmail: "support@bengalvoyager.com.bd",
    contactPhone: "+880 2 555 0300",
    preferredCurrency: "BDT" as CurrencyCode,
  }
];

export const AGENCY_ID_GLOBAL_TRAVEL = `agency_fixed_global`;
export const AGENCY_ID_LOCAL_ADVENTURES = `agency_fixed_local`;
export const AGENCY_ID_BENGAL_VOYAGER = `agency_fixed_bengal`;

export const AGENT_ID_JOHN_DOE_GTE = `agent_fixed_john_doe`;
export const AGENT_ID_ALICE_SMITH_GTE = `agent_fixed_alice_smith`;
export const AGENT_ID_BOB_JOHNSON_LAI = `agent_fixed_bob_johnson`;
export const AGENT_ID_FATIMA_AHMED_BV = `agent_fixed_fatima_ahmed`;
const PLACEHOLDER_DEFAULT_USER_AGENT_ID = "agent_default_user";


const DEFAULT_AGENTS_DATA_SEED: Omit<AgentProfile, 'id' | 'agencyId'>[] = [
  {
    fullName: "John Doe (GTE)",
    email: "john.doe@globaltravel.com",
    phoneNumber: "+66 81 123 4567",
    agencyName: "Global Travel Experts (Sukhumvit Branch)",
    specializations: "Luxury Travel, Thailand & SE Asia",
    yearsOfExperience: 10,
    bio: "Experienced travel consultant specializing in bespoke luxury itineraries across Southeast Asia."
  },
  {
    fullName: "Alice Smith (GTE)",
    email: "alice.smith@globaltravel.com",
    phoneNumber: "+66 82 987 6543",
    specializations: "Cultural Tours, Indochina",
    yearsOfExperience: 7,
    bio: "Passionate about cultural immersion and unique travel experiences in Vietnam, Laos, and Cambodia."
  },
  {
    fullName: "Bob Johnson (LAI)",
    email: "bob.johnson@localadventures.my",
    phoneNumber: "+60 12 345 6789",
    specializations: "Adventure Tours, Malaysia & Borneo",
    yearsOfExperience: 5,
    bio: "Your guide for thrilling adventures, from jungle trekking in Borneo to diving in Sipadan."
  },
  {
    fullName: "Fatima Ahmed (BV)",
    email: "fatima.ahmed@bengalvoyager.com.bd",
    phoneNumber: "+880 17 111 2222",
    specializations: "Heritage Tours, Bangladesh",
    yearsOfExperience: 8,
    bio: "Discover the rich history and vibrant culture of Bangladesh with expertly crafted tours."
  },
  { // Placeholder default user for /agent/profile if no specific user is loaded
    fullName: "Default Agent User",
    email: "agent@example.com", // Matches login credentials
    phoneNumber: "+1 000 000 0000",
    agencyName: "Demo Agency Branch",
    specializations: "General Travel",
    yearsOfExperience: 3,
    bio: "This is a default agent profile for demonstration purposes."
  }
];

const assignFixedIdsAndMapAgents = (agencySeedData: Omit<Agency, 'id'>[], agentSeedData: Omit<AgentProfile, 'id' | 'agencyId'>[]): { agencies: Agency[], agents: AgentProfile[] } => {
  const finalAgencies: Agency[] = agencySeedData.map(agency => {
    let id = generateGUID();
    if (agency.name === "Global Travel Experts") id = AGENCY_ID_GLOBAL_TRAVEL;
    else if (agency.name === "Local Adventures Inc.") id = AGENCY_ID_LOCAL_ADVENTURES;
    else if (agency.name === "Bengal Voyager") id = AGENCY_ID_BENGAL_VOYAGER;
    return { ...agency, id, preferredCurrency: agency.preferredCurrency || "USD" as CurrencyCode };
  });

  const finalAgents: AgentProfile[] = agentSeedData.map(agent => {
    let agencyIdToLink = finalAgencies[0]?.id;
    let agentId = generateGUID();

    if (agent.fullName.includes("John Doe (GTE)")) { agencyIdToLink = AGENCY_ID_GLOBAL_TRAVEL; agentId = AGENT_ID_JOHN_DOE_GTE; }
    else if (agent.fullName.includes("Alice Smith (GTE)")) { agencyIdToLink = AGENCY_ID_GLOBAL_TRAVEL; agentId = AGENT_ID_ALICE_SMITH_GTE; }
    else if (agent.fullName.includes("Bob Johnson (LAI)")) { agencyIdToLink = AGENCY_ID_LOCAL_ADVENTURES; agentId = AGENT_ID_BOB_JOHNSON_LAI; }
    else if (agent.fullName.includes("Fatima Ahmed (BV)")) { agencyIdToLink = AGENCY_ID_BENGAL_VOYAGER; agentId = AGENT_ID_FATIMA_AHMED_BV; }
    else if (agent.fullName === "Default Agent User") { agencyIdToLink = finalAgencies[0]?.id; agentId = PLACEHOLDER_DEFAULT_USER_AGENT_ID; } // Default user linked to first agency

    return { ...agent, id: agentId, agencyId: agencyIdToLink! };
  });

  return { agencies: finalAgencies, agents: finalAgents };
};

export function useAgents() {
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const [agencies, setAgenciesState] = React.useState<Agency[]>([]);
  const [agents, setAgentsState] = React.useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchAndSeedData = React.useCallback(async () => {
    if (isLoadingCountries) return;
    setIsLoading(true);
    setError(null);

    try {
      const { agencies: seededAgencies, agents: seededAgents } = assignFixedIdsAndMapAgents(DEFAULT_AGENCIES_DATA_SEED, DEFAULT_AGENTS_DATA_SEED);
      
      const storedAgencies = localStorage.getItem(AGENCIES_STORAGE_KEY);
      let agenciesToSet: Agency[] = storedAgencies ? JSON.parse(storedAgencies) : [...seededAgencies];
      seededAgencies.forEach(sa => { if (!agenciesToSet.find(a => a.id === sa.id)) agenciesToSet.push(sa); });
      agenciesToSet.forEach(agency => { if (!agency.preferredCurrency) agency.preferredCurrency = "USD" as CurrencyCode});
      agenciesToSet.sort((a, b) => a.name.localeCompare(b.name));
      setAgenciesState(agenciesToSet);
      localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(agenciesToSet));

      const storedAgents = localStorage.getItem(AGENTS_STORAGE_KEY);
      let agentsToSet: AgentProfile[] = storedAgents ? JSON.parse(storedAgents) : [...seededAgents];
      seededAgents.forEach(sa => { if (!agentsToSet.find(a => a.id === sa.id)) agentsToSet.push(sa); });
      setAgentsState(agentsToSet);
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agentsToSet));

    } catch (e: any) {
      console.error("Error initializing agent/agency data:", e);
      setError("Failed to load agent/agency data.");
      const { agencies: defaultAgencies, agents: defaultAgents } = assignFixedIdsAndMapAgents(DEFAULT_AGENCIES_DATA_SEED, DEFAULT_AGENTS_DATA_SEED);
      defaultAgencies.forEach(agency => { if (!agency.preferredCurrency) agency.preferredCurrency = "USD" as CurrencyCode});
      setAgenciesState(defaultAgencies.sort((a, b) => a.name.localeCompare(b.name)));
      localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(defaultAgencies));
      setAgentsState(defaultAgents);
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(defaultAgents));
    }
    setIsLoading(false);
  }, [isLoadingCountries, countries]);

  React.useEffect(() => {
    fetchAndSeedData();
  }, [fetchAndSeedData]);

  const getAgencyById = React.useCallback((agencyId: string): Agency | undefined => {
    return agencies.find(agency => agency.id === agencyId);
  }, [agencies]);
  
  const addAgency = React.useCallback((agencyData: Omit<Agency, 'id'>) => {
    const newAgency: Agency = { ...agencyData, id: generateGUID(), preferredCurrency: agencyData.preferredCurrency || ("USD" as CurrencyCode) };
    const updatedAgencies = [...agencies, newAgency].sort((a, b) => a.name.localeCompare(b.name));
    setAgenciesState(updatedAgencies);
    localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(updatedAgencies));
    toast({ title: "Agency Added", description: `Agency "${newAgency.name}" created.` });
  }, [agencies, toast]);

  const updateAgency = React.useCallback((updatedAgencyData: Agency) => {
    const finalAgencyData = { ...updatedAgencyData, preferredCurrency: updatedAgencyData.preferredCurrency || ("USD" as CurrencyCode) };
    const updatedAgencies = agencies.map(agency =>
      agency.id === finalAgencyData.id ? finalAgencyData : agency
    ).sort((a, b) => a.name.localeCompare(b.name));
    setAgenciesState(updatedAgencies);
    localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(updatedAgencies));
    toast({ title: "Agency Updated", description: `Agency "${finalAgencyData.name}" updated.` });
  }, [agencies, toast]);

  const deleteAgency = React.useCallback((agencyId: string) => {
    const agencyToDelete = agencies.find(a => a.id === agencyId);
    const updatedAgencies = agencies.filter(agency => agency.id !== agencyId);
    setAgenciesState(updatedAgencies);
    localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(updatedAgencies));
    
    const updatedAgents = agents.filter(agent => agent.agencyId !== agencyId);
    setAgentsState(updatedAgents);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updatedAgents));
    if (agencyToDelete) {
      toast({ title: "Agency Deleted", description: `Agency "${agencyToDelete.name}" and its users removed.`, variant: "destructive" });
    }
  }, [agencies, agents, toast]);

  const addAgent = React.useCallback((agentData: Omit<AgentProfile, 'id'>) => {
    if (!agentData.agencyId) {
      toast({ title: "Error", description: "Cannot add agent without an agency ID.", variant: "destructive" });
      return;
    }
    const newAgent: AgentProfile = { ...agentData, id: generateGUID() };
    const updatedAgents = [...agents, newAgent];
    setAgentsState(updatedAgents);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updatedAgents));
    toast({ title: "User Added", description: `User "${newAgent.fullName}" added to agency.` });
  }, [agents, toast]);

  const updateAgent = React.useCallback((updatedAgentData: AgentProfile) => {
    const updatedAgents = agents.map(agent =>
      agent.id === updatedAgentData.id ? updatedAgentData : agent
    );
    setAgentsState(updatedAgents);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updatedAgents));
    toast({ title: "User Updated", description: `User "${updatedAgentData.fullName}" updated.` });
  }, [agents, toast]);

  const deleteAgent = React.useCallback((agentId: string) => {
    const agentToDelete = agents.find(a => a.id === agentId);
    const updatedAgents = agents.filter(agent => agent.id !== agentId);
    setAgentsState(updatedAgents);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updatedAgents));
    if (agentToDelete) {
      toast({ title: "User Deleted", description: `User "${agentToDelete.fullName}" removed.`, variant: "destructive" });
    }
  }, [agents, toast]);


  return {
    agencies,
    agents,
    isLoading: isLoading || isLoadingCountries,
    error,
    getAgencies: () => agencies,
    getAgencyById,
    getAgentsByAgencyId: (agencyId: string) => agents.filter(agent => agent.agencyId === agencyId),
    getAllAgents: () => agents,
    addAgency,
    updateAgency,
    deleteAgency,
    addAgent,
    updateAgent,
    deleteAgent,
    refreshAgentData: fetchAndSeedData
  };
}

