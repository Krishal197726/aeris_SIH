import React, { createContext, useContext, useState } from 'react';

const PERSONAS = [
  {
    id: 'citizen',
    label: 'Citizen',
    icon: 'User',
    description: 'Everyday forecast, commute safety, rain timings, outdoor planning',
    accentColor: '#38bdf8'
  },
  {
    id: 'farmer',
    label: 'Farmer',
    icon: 'Sprout',
    description: 'Soil moisture, evapotranspiration, irrigation scheduling, crop protection',
    accentColor: '#10b981'
  },
  {
    id: 'disaster',
    label: 'Disaster Manager',
    icon: 'ShieldAlert',
    description: 'Flash flood runoffs, storm surge, population at risk, evacuation alerts',
    accentColor: '#ef4444'
  },
  {
    id: 'aviation',
    label: 'Aviation',
    icon: 'Plane',
    description: 'Cloud base ceilings, runway crosswinds, downdrafts, CAT turbulence',
    accentColor: '#818cf8'
  },
  {
    id: 'marine',
    label: 'Marine',
    icon: 'Anchor',
    description: 'Wave swell height, gale gust vectors, port cautionary signals, coastal squall',
    accentColor: '#06b6d4'
  },
  {
    id: 'researcher',
    label: 'Researcher',
    icon: 'Microscope',
    description: 'Atmospheric pressure gradients, CAPE index, NWP ensemble variance, ERA5 trends',
    accentColor: '#f59e0b'
  }
];

const PersonaContext = createContext({
  currentPersona: PERSONAS[0],
  setPersona: () => {},
  personas: PERSONAS
});

export function PersonaProvider({ children }) {
  const [currentPersona, setCurrentPersona] = useState(PERSONAS[0]);

  const setPersonaById = (id) => {
    const found = PERSONAS.find(p => p.id === id);
    if (found) setCurrentPersona(found);
  };

  return (
    <PersonaContext.Provider
      value={{
        currentPersona,
        setPersona: setPersonaById,
        personas: PERSONAS
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  return useContext(PersonaContext);
}
