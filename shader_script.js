const canv = document.getElementById("glsl_canvas");
const gl = canv.getContext("webgl2");
const program = gl.createProgram();


function setSize(){
    canv.style.height = (window.innerHeight/3)+"px";
    canv.width = canv.clientWidth;
    canv.height = canv.clientHeight;
}
setSize()

window.onresize =setSize;

var uniformMapper = {};

function drawShader(time){
    gl.useProgram(program)
    gl.uniform2fv(uniformMapper["iResolution"], [canv.width,canv.height]);
    gl.uniform1f(uniformMapper["iTime"], (time|0)/1000);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    

    gl.viewport(0, 0, canv.width, canv.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    window.requestAnimationFrame(drawShader)
}

function makeAndRunShader(shaderCode){
    const vertex_dummy_shader = gl.createShader(gl.VERTEX_SHADER);
    let vertexCode = `#version 300 es
        in vec4 position;

        void main() 
        {
            gl_Position = position;
        }
    `


    gl.shaderSource(vertex_dummy_shader, vertexCode);
    gl.compileShader(vertex_dummy_shader);
    gl.attachShader(program, vertex_dummy_shader);


    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);
    gl.attachShader(program, shader);

    
    console.log("Linking...")
    gl.linkProgram(program);

    console.log(gl.getProgramParameter(program, gl.LINK_STATUS))
    console.log(gl.getProgramInfoLog(program))
    for(i of ["iTime","iResolution"]){
        uniformMapper[i] = gl.getUniformLocation(program, i)
    }

    const vertices = new Float32Array([
        -1, -1,
        3, -1,
        -1,  3
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "position");

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    requestAnimationFrame(drawShader)
    
}

fetch("shader-src.frag").then(x => x.text()).then(makeAndRunShader);
