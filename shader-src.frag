#version 300 es
precision highp float;

uniform float iTime;
uniform vec2 iResolution;

out vec4 fragColor;

struct Cube{
    vec3 pos;
    vec4 rot;
    vec4 color;
    vec3 size;
};


struct RayHit{
    vec4 color;
    float dist;
};


const int maxHits = 50;

struct HitRegister{
    RayHit[maxHits] hits;
    int index;
} registerer;



const int numCubes = 27;
Cube cubes[numCubes];




void addHit(vec4 color, float dist){
    if(registerer.index < maxHits){
        registerer.hits[registerer.index] = RayHit(color, dist);
        registerer.index++;
    }
}

vec4 accumulateHits(){
    vec4 color = vec4(1.);
    
    bool swapped;
  
    for (int i = 0; i < registerer.index -1; i++) {
        swapped = false;
        for (int j = 0; j < registerer.index - i -1; j++) {
            if (registerer.hits[j].dist > registerer.hits[j + 1].dist) {
                RayHit old = registerer.hits[j];
                registerer.hits[j] = registerer.hits[j + 1];
                registerer.hits[j+1] = old;
                swapped = true;
            }
        }
        if (!swapped)
            break;
    }
    
    if(registerer.index > 0) return registerer.hits[0].color;
    else return vec4(1.);
    
}

vec3 light = vec3(1000.,1000.,1000.);


vec3 qtransform(vec3 v, vec4 q){ 
    return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
}


vec3 oneHot(vec3 vector){
    vec3 a = abs(vector);
    float maxVal = max(a.x, max(a.y,a.z));
    return sign(vector) * vec3(equal(a,vec3(maxVal)));
}


vec3 toColor(vec3 normal){
    vec3 maxVec = oneHot(normal);
    if(maxVec.x > .5 && abs(maxVec.y) < .5 && abs(maxVec.z) < .5) return vec3(0., 0., 1.);
    if(maxVec.x < -.5 && abs(maxVec.y) < .5 && abs(maxVec.z) < .5) return vec3(1., 0., 0.);
    if(maxVec.y > .5 && abs(maxVec.z) < .5 && abs(maxVec.x) < .5) return vec3(0., 1., 0.);
    if(maxVec.y < -.5 && abs(maxVec.z) < .5 && abs(maxVec.x) < .5) return vec3(1., 1., 1.);
    if(maxVec.z > .5 && abs(maxVec.y) < .5 && abs(maxVec.x) < .5) return vec3(1., 1., 0.);
    if(maxVec.z < -.5 && abs(maxVec.y) < .5 && abs(maxVec.x) < .5) return vec3(1., .5, 0.);
}

void cubeIntersect(Cube cube, vec3 base, vec3 direct){
    base = qtransform(base-cube.pos, cube.rot)+cube.pos;
    direct = qtransform(direct, cube.rot);
    vec3 offset = base-cube.pos;
    vec3 rLight = qtransform(light-cube.pos, cube.rot)-cube.pos + offset - base;
    
    float[6] indices = float[6](
    (cube.size.z-offset.z)/direct.z,
    (-cube.size.z-offset.z)/direct.z,
    (cube.size.x-offset.x)/direct.x,
    (-cube.size.x-offset.x)/direct.x,
    (cube.size.y-offset.y)/direct.y,
    (-cube.size.y-offset.y)/direct.y
    );
    
    for(int i =0; i < 6; i++){
        vec3 intersect = offset + direct * indices[i];
        if(indices[i] > 0. && abs(intersect.z) <= cube.size.z*1.01 && abs(intersect.y) <= cube.size.y*1.01 && abs(intersect.x) <= cube.size.x*1.01){
            vec3 normal = normalize(oneHot(intersect));
            vec4 color = vec4((.5+max(.0,dot(normal, normalize(intersect-rLight))))/1.5 * toColor(intersect),1.);
            addHit(color, indices[i]);
        }
    }
}


vec4 makeQuaternion(vec3 axis, float theta){
    vec4 q = vec4(normalize(axis) * sin(theta/2.),cos(theta/2.));
    return q;
}

vec4 quaternionMultiply(vec4 q1, vec4 q2) {
    return vec4(
        q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
        q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
        q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w,
        q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z
    );
}

void main(){
    vec3 middle = vec3(0.,0.,200.);
    int index = 0;
    for(int x = -1; x <= 1; x++){
        for(int y = -1; y <= 1; y++){
            for(int z = -1; z <= 1; z++){
                cubes[index] = Cube(vec3(x*80, y* 80, z* 80)+ middle,
                                    makeQuaternion(vec3(1., 1., 1.), 0.),
                                    vec4(.5, 7. , .5 , 1.),
                                    vec3(40.,40.,40.));

                if(x == 1){
                    cubes[index].pos = qtransform(cubes[index].pos-middle, makeQuaternion(vec3(1., 0., 0.), iTime))+middle;
                    cubes[index].rot = quaternionMultiply(makeQuaternion(vec3(0., 1., 0.), -.5*iTime), makeQuaternion(vec3(1., 0., 0.), -iTime));
                }else{
                    cubes[index].rot = makeQuaternion(vec3(0., 1., 0.), -.5*iTime);
                }
                cubes[index].pos = qtransform(cubes[index].pos-middle, makeQuaternion(vec3(0., 1., 0.), .5*iTime))+middle;
                
                
                index++;
            }
        }
    }
    vec3 camera = vec3(0,0,-300);
    vec3 point = vec3((gl_FragCoord.xy - iResolution.xy * 0.5) , 0);
    vec3 direction = normalize(point - camera);
    direction *= .5/direction.z;
    for(int i=0; i < numCubes; i++){
        cubeIntersect(cubes[i], point, direction);
    }
    fragColor = accumulateHits();
}
