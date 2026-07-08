declare global {
  interface Window {
    fornac: {
      FornaContainer: new (
        selector: string | Element,
        options?: Record<string, unknown>,
      ) => {
        addRNA(structure: string, options?: Record<string, unknown>): void;
        clearNodes(): void;
        setSize(): void;
      };
    };
  }
}

export {};
