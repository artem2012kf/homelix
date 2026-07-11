"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Apartment } from "@/types/apartment";
import { DEFAULT_CITY } from "@/lib/city-data";

type CityContextValue = {
  cities: string[];
  projects: string[];
  selectedCity: string;
  selectedProject: string;
  isChooserOpen: boolean;
  isReady: boolean;
  openChooser: () => void;
  closeChooser: () => void;
  selectCity: (city: string) => void;
  selectProject: (project: string) => void;
  confirmSelection: () => void;
};

const CityContext = createContext<CityContextValue | null>(null);
const CITY_KEY = "hall-selected-city";
const PROJECT_KEY = "hall-selected-project";
const ANY_PROJECT_STORAGE_VALUE = "__any_project__";

export function CityProvider({ apartments, children }: { apartments: Apartment[]; children: React.ReactNode }) {
  const cities = useMemo(
    () => [...new Set(apartments.map((apartment) => apartment.city))].sort((a, b) => a.localeCompare(b, "ru")),
    [apartments]
  );
  const fallbackCity = cities.includes(DEFAULT_CITY) ? DEFAULT_CITY : cities[0] ?? DEFAULT_CITY;
  const [selectedCity, setSelectedCity] = useState(fallbackCity);
  const [selectedProject, setSelectedProject] = useState("");
  const [isChooserOpen, setChooserOpen] = useState(false);
  const [isReady, setReady] = useState(false);

  const projects = useMemo(
    () => [...new Set(apartments.filter((item) => item.city === selectedCity).map((item) => item.project))].sort((a, b) => a.localeCompare(b, "ru")),
    [apartments, selectedCity]
  );

  useEffect(() => {
    const savedCity = window.localStorage.getItem(CITY_KEY);
    const initialCity = savedCity && cities.includes(savedCity) ? savedCity : fallbackCity;
    const allowedProjects = [...new Set(apartments.filter((item) => item.city === initialCity).map((item) => item.project))];
    const savedProject = window.localStorage.getItem(PROJECT_KEY);

    setSelectedCity(initialCity);
    setSelectedProject(
      savedProject === ANY_PROJECT_STORAGE_VALUE
        ? ""
        : savedProject && allowedProjects.includes(savedProject)
          ? savedProject
          : ""
    );
    setChooserOpen(!savedCity);
    setReady(true);
  }, [apartments, cities, fallbackCity]);

  useEffect(() => {
    if (selectedProject && !projects.includes(selectedProject)) {
      setSelectedProject("");
    }
  }, [projects, selectedProject]);

  function selectCity(city: string) {
    if (!cities.includes(city)) return;
    setSelectedCity(city);
    setSelectedProject("");
  }

  function confirmSelection() {
    window.localStorage.setItem(CITY_KEY, selectedCity);
    window.localStorage.setItem(PROJECT_KEY, selectedProject || ANY_PROJECT_STORAGE_VALUE);
    setChooserOpen(false);
    window.dispatchEvent(new CustomEvent("hall-city-changed", { detail: { city: selectedCity, project: selectedProject } }));
  }

  const value = useMemo<CityContextValue>(
    () => ({
      cities,
      projects,
      selectedCity,
      selectedProject,
      isChooserOpen,
      isReady,
      openChooser: () => setChooserOpen(true),
      closeChooser: () => setChooserOpen(false),
      selectCity,
      selectProject: setSelectedProject,
      confirmSelection
    }),
    [cities, projects, selectedCity, selectedProject, isChooserOpen, isReady]
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) throw new Error("useCity must be used inside CityProvider");
  return context;
}
