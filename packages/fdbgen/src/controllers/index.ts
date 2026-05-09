import { alcorMicroController } from "./alcor-micro";
import { chipsBankController } from "./chips-bank";
import { firstChipController } from "./first-chip";
import { innostorController } from "./innostor";
import { jmicronController } from "./jmicron";
import { maxioController } from "./maxio";
import { maxiotekController } from "./maxiotek";
import { phisonController } from "./phison";
import { sandForceController } from "./sand-force";
import { siliconMotionController } from "./silicon-motion";
import { yeestorController } from "./yeestor";

export const CONTROLLER_GENERATORS = [
  siliconMotionController,
  jmicronController,
  maxiotekController,
  maxioController,
  sandForceController,
  alcorMicroController,
  chipsBankController,
  innostorController,
  phisonController,
  yeestorController,
  firstChipController
] as const;

export type { ControllerGenerator, ControllerMergeContext, ControllerRawFile } from "./types";
