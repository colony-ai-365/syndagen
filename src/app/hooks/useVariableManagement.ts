// useVariableManagement.ts
// Hook for managing variable state, cleanup, and handlers
import { useEffect, useState } from "react";
import { VariableValues } from "../utils/formHelpers";
import { fetchDatalistEntries } from "./useDatalists";

type UseVariableManagementProps = {
  variables: string[];
  variableValues?: VariableValues;
  setVariableValues?: (vals: VariableValues) => void;
  variableSelections?: Record<string, number>;
  setVariableSelections?: (sel: Record<string, number>) => void;
};

export function useVariableManagement({
  variables,
  variableValues,
  setVariableValues,
  variableSelections,
  setVariableSelections,
}: UseVariableManagementProps) {
  const [modalVar, setModalVar] = useState<string | null>(null);
  const [loadingEntries, setLoadingEntries] = useState<Record<string, boolean>>(
    {}
  );
  const [prevVariables, setPrevVariables] = useState<string[]>([]);

  // Clean up deleted variables from state when they are removed from prompt
  useEffect(() => {
    if (!setVariableValues || !setVariableSelections || !variableValues) return;

    // Only run cleanup if variables array actually changed (not on initial load or variableValues change)
    const variablesChanged =
      prevVariables.length > 0 &&
      (prevVariables.length !== variables.length ||
        prevVariables.some((v, i) => v !== variables[i]));

    if (!variablesChanged) {
      setPrevVariables(variables);
      return;
    }

    const currentVarSet = new Set(variables);
    const storedVars = Object.keys(variableValues);
    const deletedVars = storedVars.filter((v) => !currentVarSet.has(v));

    if (deletedVars.length > 0) {
      // Remove deleted variables from variableValues
      const updatedValues = { ...variableValues };
      deletedVars.forEach((v) => delete updatedValues[v]);
      setVariableValues(updatedValues);

      // Remove deleted variables from variableSelections
      if (variableSelections) {
        const updatedSelections = { ...variableSelections };
        deletedVars.forEach((v) => delete updatedSelections[v]);
        setVariableSelections(updatedSelections);
      }
    }

    setPrevVariables(variables);
  }, [variables]);

  // Handle source type change (manual/datalist)
  const handleSourceTypeChange = (
    varName: string,
    newType: "manual" | "datalist"
  ) => {
    if (setVariableValues && variableValues) {
      setVariableValues({
        ...variableValues,
        [varName]: {
          type: newType,
          values: [],
        },
      });
    }
  };

  // Handle manual input change
  const handleManualInputChange = (varName: string, inputValue: string) => {
    const vals = inputValue.split(",");
    if (setVariableValues && variableValues) {
      setVariableValues({
        ...variableValues,
        [varName]: {
          type: "manual",
          values: vals,
        },
      });
    }
    if (setVariableSelections) {
      setVariableSelections({
        ...(variableSelections || {}),
        [varName]: 0,
      });
    }
  };

  // Handle datalist selection from dropdown
  const handleDatalistSelect = (varName: string, datalistId: number) => {
    if (setVariableValues && variableValues) {
      setVariableValues({
        ...variableValues,
        [varName]: {
          type: "datalist",
          datalistId: datalistId,
          values: [],
        },
      });
    }
    if (setVariableSelections) {
      setVariableSelections({
        ...(variableSelections || {}),
        [varName]: 0,
      });
    }
  };

  // Handle value selection from modal
  const handleModalSelect = (
    varName: string,
    entry: string,
    datalistId: number
  ) => {
    if (setVariableValues && variableValues) {
      setVariableValues({
        ...variableValues,
        [varName]: {
          type: "datalist",
          datalistId: datalistId,
          values: [entry],
        },
      });
    }
    if (setVariableSelections) {
      setVariableSelections({
        ...(variableSelections || {}),
        [varName]: 0,
      });
    }
    setModalVar(null);
  };

  // Handle manual variable value selection
  const handleManualValueSelect = (varName: string, index: number) => {
    if (setVariableSelections) {
      setVariableSelections({
        ...(variableSelections || {}),
        [varName]: index,
      });
    }
  };

  return {
    modalVar,
    setModalVar,
    loadingEntries,
    setLoadingEntries,
    handleSourceTypeChange,
    handleManualInputChange,
    handleDatalistSelect,
    handleModalSelect,
    handleManualValueSelect,
  };
}
