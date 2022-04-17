import { mat4 } from "gl-matrix";

export const flatten = (arr: (Float32Array | number[])[]): Float32Array => {
  if (!arr || !arr[0]) return new Float32Array();

  const n = arr.length * arr[0].length;
  const ret = new Float32Array(n);
  let index = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[i].length; j++) {
      ret[index++] = arr[i][j];
    }
  }
  return ret;
};
