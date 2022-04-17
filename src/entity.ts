import { mat4, vec2, vec4 } from "gl-matrix";
import {
  faceIndex,
  faceNormals,
  faceUvs,
  faceVertices,
  materials,
  mtlSwaps,
  normals,
  parseMtlFile,
  parseObjFile,
  uvs,
  vertices,
} from "./parser";
import { Material } from "../types";
import { baseShaders, gl, lightIsOn } from "..";
import { flatten } from "./algebra";

const BASE_URL = "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/";

export class Entity {
  modelViewMatrix: mat4;
  objFile: string;
  mtlFile: string;

  mtlSwaps: { [key: number]: string };

  materials: { [key: string]: Material };

  vertices: vec4[];
  normals: vec4[];
  uvs: vec2[];

  faceVertices: vec4[];
  faceNormals: vec4[];
  faceUvs: vec2[];

  faceCount: number;

  children: Entity[] = [];

  lights: vec4[];
  light: vec4;

  constructor(objFile: string, mtlFile: string, modelViewMatrix: mat4) {
    this.objFile = objFile;
    this.mtlFile = mtlFile;

    this.modelViewMatrix = modelViewMatrix;
    this.lights = [
      [0.0, 3.0, 0.0, 1.0],
      [0.1, 0.1, 0.1, 1.0],
      [1.0, 1.0, 1.0, 1.0],
      [1.0, 1.0, 1.0, 1.0],
    ];
    //this.light = this.lights[0];
  }
  async setup() {
    await this.loadObjFile();
    await this.loadMtlFile();

    for (const child of this.children) {
      await child.setup();
    }

    //console.log(this.objFile);
    //console.log(this.materials);
    //console.log(this.mtlSwaps);
  }

  async loadObjFile() {
    const res = await fetch(BASE_URL + this.objFile);
    parseObjFile(await res.text());

    // Copy from the parser's global state
    this.mtlSwaps = { ...mtlSwaps };

    this.vertices = [...vertices];
    this.normals = [...normals];
    this.uvs = [...uvs];

    this.faceVertices = [...faceVertices];
    this.faceNormals = [...faceNormals];
    this.faceUvs = [...faceUvs];

    this.faceCount = faceIndex;
  }

  async loadMtlFile() {
    const res = await fetch(BASE_URL + this.mtlFile);
    parseMtlFile(await res.text());

    this.materials = { ...materials };
  }

  useMtl(mtl: string, program: WebGLProgram) {
    //console.log("Switching material");
    //console.log(mtl);
    const material = this.materials[mtl];
    if (!material) {
      console.error(`Couldn't find material ${mtl}`);
      console.log(this.objFile);
      console.log(this.materials);
    }

    const ambientProduct = vec4.create();
    const diffuseProduct = vec4.create();
    const specularProduct = vec4.create();

    if (lightIsOn) {
      vec4.multiply(ambientProduct, this.lights[1], material.ka);
      vec4.multiply(diffuseProduct, this.lights[2], material.kd);
    }

    vec4.multiply(specularProduct, this.lights[3], material.ks);

    // const ambientProduct = mult(this.lights[1], material.ka);
    //const diffuseProduct = mult(this.lights[2], material.kd);
    //const specularProduct = mult(this.lights[3], material.ks);

    gl.uniform4fv(
      gl.getUniformLocation(program, "diffuseProduct"),
      diffuseProduct
    );

    gl.uniform4fv(
      gl.getUniformLocation(program, "ambientProduct"),
      ambientProduct
    );

    gl.uniform4fv(
      gl.getUniformLocation(program, "specularProduct"),
      specularProduct
    );

    gl.uniform4fv(
      gl.getUniformLocation(program, "lightPosition"),
      this.lights[0]
    );
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), material.ns);
  }

  createATexture(gl: WebGLRenderingContext) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      2,
      2,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([
        0, 0, 255, 255, 255, 0, 0, 255, 0, 0, 255, 255, 0, 0, 255, 255,
      ])
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }

  draw(program: WebGLProgram, viewMatrix: mat4, projectionMatrix: mat4) {
    //console.log(this.vertices);
    for (const child of this.children) {
      //console.log("Drawing child");
      child.draw(program, viewMatrix, projectionMatrix);
    }

    gl.useProgram(program);

    /*
    console.log("BEGINNING DRAW");
    console.log(this.vertices);
    console.log(this.normals);
    console.log(this.uvs);
    */

    //console.log(flatten(this.faceVertices));

    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.faceVertices), gl.STATIC_DRAW);

    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    const tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.faceUvs), gl.STATIC_DRAW);

    const vNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.faceNormals), gl.STATIC_DRAW);

    const vNormalPosition = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalPosition);

    this.createATexture(gl);

    const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    const viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
    const projectionMatrixLoc = gl.getUniformLocation(
      program,
      "projectionMatrix"
    );

    gl.uniformMatrix4fv(modelMatrixLoc, false, this.modelViewMatrix);
    gl.uniformMatrix4fv(viewMatrixLoc, false, viewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix);

    //console.log(this.faceCount);
    //console.log(this.vertices.length);
    //console.log(this.faceVertices.length);
    for (let i = 0; i < this.faceCount; i += 3) {
      if (this.mtlSwaps[i]) {
        //console.log(`Switching to ${this.mtlSwaps[i]} at ${i}`);
        this.useMtl(this.mtlSwaps[i], program);
      }
      gl.drawArrays(gl.TRIANGLES, i, 3);
    }
  }
}

vec4;
