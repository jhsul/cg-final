import { vec2, vec4 } from "gl-matrix";
import { Material } from "../types";

export let vertices: vec4[];
export let normals: vec4[];
export let uvs: vec2[];

export let faceVertices = []; // Non-indexed final vertex definitions
export let faceNormals = []; // Non-indexed final normal definitions
export let faceUvs = []; // Non-indexed final UV definitions

export let mtlSwaps: { [key: number]: string };

export let materials: { [key: string]: Material };

let faceVerts = []; // Indices into vertices array for this face
let faceNorms = []; // Indices into normal array for this face
let faceTexs = []; // Indices into UVs array for this face

export let faceIndex = 0;

export const parseObjFile = (text: string) => {
  //const vertices: vec4[] = [];
  //const normals: vec4[] = [];
  //const uvs: vec2[] = [];

  vertices = [];
  normals = [];
  uvs = [];

  faceVertices = [];
  faceNormals = [];
  faceUvs = [];

  faceIndex = 0;
  mtlSwaps = {};

  let lines = text.split("\n");

  lines = lines.filter((line) => {
    return line.search(/\S/) !== -1;
  });
  lines = lines.map((line) => {
    return line.trim();
  });

  for (const line of lines) {
    const coords = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);

    if (line.startsWith("vn")) {
      normals.push([
        parseFloat(coords[0]),
        parseFloat(coords[1]),
        parseFloat(coords[2]),
        1.0,
      ]);
    } else if (line.startsWith("vt")) {
      uvs.push([parseFloat(coords[0]), 1.0 - parseFloat(coords[1])]);
    } else if (line.charAt(0) === "v") {
      vertices.push([
        parseFloat(coords[0]),
        parseFloat(coords[1]),
        parseFloat(coords[2]),
        1.0,
      ]);
    } else if (line.startsWith("usemtl")) {
      mtlSwaps[faceIndex] = line.substring(line.indexOf(" ") + 1);
    } else if (line.charAt(0) === "f") {
      parseFaces(line);
    }

    for (let i = 1; i < faceVerts.length - 1; i++) {
      faceIndex += 3;
      faceVertices.push(faceVerts[0], faceVerts[i], faceVerts[i + 1]);
      faceNormals.push(faceNorms[0], faceNorms[i], faceNorms[i + 1]);
      faceUvs.push(faceTexs[0], faceTexs[i], faceTexs[i + 1]);
    }

    faceVerts = [];
    faceNorms = [];
    faceTexs = [];
  }
};

const parseFaces = (line: string) => {
  let indices = line.match(/[0-9\/]+/g);
  let types = indices[0].match(/[\/]/g).length;
  //faceIndex++;

  if (types === 0) {
    // Only v provided
    indices.forEach((value) => {
      faceVerts.push(vertices[parseInt(value) - 1]);
    });
  } else if (types === 1) {
    // v and vt provided
    indices.forEach((value) => {
      faceVerts.push(
        vertices[parseInt(value.substr(0, value.indexOf("/"))) - 1]
      );
      faceTexs.push(uvs[parseInt(value.substr(value.indexOf("/") + 1)) - 1]);
    });
  } else if (types === 2) {
    // v, maybe vt, and vn provided
    let firstSlashIndex = indices[0].indexOf("/");
    if (indices[0].charAt(firstSlashIndex + 1) === "/") {
      // vt omitted
      indices.forEach((value) => {
        faceVerts.push(
          vertices[parseInt(value.substr(0, value.indexOf("/"))) - 1]
        );
        faceNorms.push(
          normals[parseInt(value.substr(value.indexOf("/") + 2)) - 1]
        );
      });
    } else {
      // vt provided
      indices.forEach((value) => {
        let firstSlashIndex = value.indexOf("/");
        let secondSlashIndex = value.indexOf("/", firstSlashIndex + 1);
        faceVerts.push(
          vertices[parseInt(value.substring(0, firstSlashIndex)) - 1]
        );
        faceTexs.push(
          uvs[
            parseInt(value.substring(firstSlashIndex + 1, secondSlashIndex)) - 1
          ]
        );
        faceNorms.push(
          normals[parseInt(value.substring(secondSlashIndex + 1)) - 1]
        );
      });
    }
  }
};

export const parseMtlFile = (text: string) => {
  materials = {};
  let currentMaterial = "";
  //let diffuseMap = new Map();
  //let specularMap = new Map();

  // Sanitize the MTL file
  let mtlLines = text.split("\n");
  mtlLines = mtlLines.filter((line) => {
    return line.search(/\S/) !== -1;
  });
  mtlLines = mtlLines.map((line) => {
    return line.trim();
  });

  for (let currLine = 0; currLine < mtlLines.length; currLine++) {
    let line = mtlLines[currLine];

    if (line.startsWith("newmtl")) {
      // Hit a new material
      currentMaterial = line.substring(line.indexOf(" ") + 1);
      materials[currentMaterial] = {};
    } else if (line.startsWith("Kd ")) {
      // Material diffuse definition
      let values = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);

      materials[currentMaterial].kd = [
        parseFloat(values[0]),
        parseFloat(values[1]),
        parseFloat(values[2]),
        1.0,
      ];
      /*
      diffuseMap.set(currMaterial, [
        parseFloat(values[0]),
        parseFloat(values[1]),
        parseFloat(values[2]),
        1.0,
      ]);
      */
    } else if (line.startsWith("Ks ")) {
      // Material specular definition
      let values = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
      materials[currentMaterial].ks = [
        parseFloat(values[0]),
        parseFloat(values[1]),
        parseFloat(values[2]),
        1.0,
      ];
    } else if (line.startsWith("Ka ")) {
      let values = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
      materials[currentMaterial].ka = [
        parseFloat(values[0]),
        parseFloat(values[1]),
        parseFloat(values[2]),
        1.0,
      ];
    } else if (line.startsWith("Ns ")) {
      let values = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
      materials[currentMaterial].ns = parseFloat(values[0]);
    } else if (line.startsWith("map_Kd")) {
      // Material diffuse texture definition
      let textureURL =
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/" +
        line.substr(line.indexOf(" ") + 1);
    }
  }
};
