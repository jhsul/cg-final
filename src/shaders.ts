export const addShaders = (
  gl: WebGLRenderingContext,
  vShaderId: string,
  fShaderId: string
) => {
  const vElement = document.getElementById(vShaderId) as HTMLScriptElement;
  const fElement = document.getElementById(fShaderId) as HTMLScriptElement;

  if (!vElement || !fElement) {
    console.error(`Couldn't find ${vShaderId} ${fShaderId}`);
  }
  const vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, vElement.text);
  gl.compileShader(vShader);

  if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
    console.error(`Couldn't compile vertex shader ${vShaderId}`);
    console.error(gl.getShaderInfoLog(vShader));
    return;
  }

  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, fElement.text);
  gl.compileShader(fShader);

  if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
    console.error(`Couldn't compile fragment shader ${fShaderId}`);
    console.error(gl.getShaderInfoLog(fShader));
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Couldnt link program");
    console.error(gl.getProgramInfoLog(program));
  }
  return program;
};
