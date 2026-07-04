import { BoundaryResolver } from "./boundaryResolver.js";

export class BoundaryEngine {
  constructor({ resolver = new BoundaryResolver() } = {}) {
    this.resolver = resolver;
  }

  evaluate(turnInput, { acceptedSemanticDelta } = {}) {
    return this.resolver.resolve({
      acceptedSemanticDelta
    });
  }
}
