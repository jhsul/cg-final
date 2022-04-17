import "./style.css";

import { addShaders } from "./src/shaders";
import { Entity } from "./src/entity";
import { mat4, vec3, vec4 } from "gl-matrix";

export const canvas = document.getElementById("webgl") as HTMLCanvasElement;
export const gl = canvas.getContext("webgl");

export const baseShaders = addShaders(gl, "vshader", "fshader");
export const phongShaders = addShaders(gl, "vphongshader", "fphongshader");

export let lightIsOn = true;
export let carIsMoving = false;
export let cameraIsOnCar = false;

const entities: Entity[] = [];

let carEntity: Entity;

const main = async () => {
  console.log("Starting 🙂");

  // KEYBINDINGS
  document.addEventListener("keydown", (event) => {
    switch (event.key.toLowerCase()) {
      case "l":
        console.log("Toggling lighting");
        lightIsOn = !lightIsOn;
        //console.log(lightIsOn);
        break;
      case "m":
        console.log("Toggling car movement");
        carIsMoving = !carIsMoving;
        break;
      case "c":
        console.log("Toggling camera position");
        cameraIsOnCar = !cameraIsOnCar;
        break;
    }
  });

  // WEBGL STUFF

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.99, 0.99, 0.99, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // ENTITY OBJECTS

  //console.log(carModelViewMatrix);
  carEntity = new Entity("car.obj", "car.mtl", mat4.create());

  const streetEntity = new Entity("street.obj", "street.mtl", mat4.create());
  const lampEntity = new Entity("lamp.obj", "lamp.mtl", mat4.create());

  streetEntity.children.push(lampEntity);

  entities.push(carEntity, streetEntity);
  for (const entity of entities) {
    await entity.setup();
  }

  render();
};

let track = 0;

const render = () => {
  requestAnimationFrame(render);

  if (carIsMoving) {
    track -= 0.05;
  }

  carEntity.modelViewMatrix = mat4.multiply(
    mat4.create(),
    mat4.rotateY(mat4.create(), mat4.create(), track),
    mat4.fromTranslation(mat4.create(), [3, 0, 0])
  );

  // Set up the view matrix
  const viewMatrix = mat4.create();
  let eye: vec3 = new Float32Array([5.5, 3.5, 5.5 * Math.sin(-0.5)]);
  let at: vec3 = new Float32Array([0.0, 0.0, 0.0]);
  const up = new Float32Array([0.0, 1.0, 0.0]);

  if (cameraIsOnCar) {
    const at4 = vec4.transformMat4(
      vec4.create(),
      [0, 0, 0, 1.0],
      carEntity.modelViewMatrix
    );

    const eye4 = vec4.transformMat4(
      vec4.create(),
      [0, 0, 0, 1.0],
      mat4.multiply(
        mat4.create(),
        mat4.fromTranslation(mat4.create(), [0, 0.5, 0]),
        carEntity.modelViewMatrix
      )
    );

    at = [at4[0], at4[1], at4[2]];
    eye = [eye4[0], eye4[1], eye4[2]];
  }

  mat4.lookAt(viewMatrix, eye, at, up);

  // Set up the projection
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, 90.0, 1.0, 0.1, 20.0);

  gl.clearColor(0.2, 0.2, 0.4, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (const entity of entities) {
    entity.draw(phongShaders, viewMatrix, projectionMatrix);
  }
  //console.error(gl.getError());
};

main();
