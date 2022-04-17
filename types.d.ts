import { vec4 } from "gl-matrix";

export interface Material {
  ka?: vec4;
  kd?: vec4;
  ks?: vec4;
  ns?: number;
}
