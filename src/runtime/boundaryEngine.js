import { FastBoundarySignalScanner } from "./fastBoundarySignalScanner.js";
import { BoundaryResolver } from "./boundaryResolver.js";

export class BoundaryEngine {
  constructor({ scanner = new FastBoundarySignalScanner(), resolver = new BoundaryResolver() } = {}) {
    this.scanner = scanner;
    this.resolver = resolver;
  }

  scan(turnInput) {
    return this.scanner.scan(turnInput.studentMessage || "");
  }

  evaluate(turnInput, { fastBoundarySignals, acceptedInterpretation } = {}) {
    return this.resolver.resolve({
      fastBoundarySignals: fastBoundarySignals || this.scan(turnInput),
      acceptedInterpretation
    });
  }
}
