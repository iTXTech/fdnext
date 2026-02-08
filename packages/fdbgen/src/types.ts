export interface FdbInfoPayload {
  name?: string;
  website?: string;
  version?: string;
  time?: string;
  controllers?: string[];
}

export interface PartNumberPayload {
  id?: string[];
  l?: string;
  c?: string;
  t?: string[];
  m?: string;
  d?: number;
  e?: number;
  r?: number;
  n?: number;
}

export interface FlashIdPayload {
  s?: number;
  p?: number;
  b?: number;
  t?: string[];
  n?: string[];
}

export interface ExtraPayload {
  info?: FdbInfoPayload;
  vendors?: Record<string, Record<string, PartNumberPayload>>;
  iddb?: Record<string, FlashIdPayload>;
}

export interface GenerateFdbOptions {
  inputDir: string;
  outputFile?: string;
  metaFile?: string;
  extraFile?: string;
  version?: string;
  name?: string;
  website?: string;
  time?: string;
  pretty?: boolean;
}
