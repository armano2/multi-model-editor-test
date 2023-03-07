export interface ErrorItem {
  message: string;
  location: string;
  severity: number;
  suggestions: { message: string; fix(): void }[];
  fixer?: { message: string; fix(): void };
}

export interface ErrorGroup {
  group: string;
  uri?: string;
  items: ErrorItem[];
}

export interface LintCodeAction {
  message: string;
  code?: string | null;
  isPreferred: boolean;
  fix: {
    range: Readonly<[number, number]>;
    text: string;
  };
}
