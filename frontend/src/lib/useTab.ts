import { useSearchParams } from "react-router-dom";

/** Dashboard tab kept in the URL (?tab=...) so refresh / back button keep working. */
export function useTab(defaultTab: string): [string, (tab: string) => void] {
  const [params, setParams] = useSearchParams();
  return [params.get("tab") ?? defaultTab, (tab) => setParams({ tab })];
}
