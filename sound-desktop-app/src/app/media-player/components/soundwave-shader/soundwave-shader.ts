import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

const VERTEX_SHADER = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    float t = u_time * 0.45;

    float wave1 = sin(p.x * 3.5 + t * 1.5) * 0.12 * sin(p.x * 2.0 + t);
    float wave2 = cos(p.x * 5.0 - t * 1.2) * 0.08 * cos(p.x * 1.5 + t * 0.8);
    float n = snoise(vec2(p.x * 1.8 + t * 0.3, p.y * 1.2 - t * 0.2)) * 0.15;

    float dist = abs(p.y - (wave1 + wave2 + n));
    float glow = 0.022 / (dist + 0.015);

    float wave3 = sin(p.x * 7.0 + t * 2.2) * 0.06;
    float dist2 = abs(p.y - (wave3 - 0.1 + n * 0.5));
    float glow2 = 0.014 / (dist2 + 0.02);

    float rad = length(p);
    float pulse = sin(rad * 8.0 - t * 2.5) * 0.5 + 0.5;
    float radGlow = exp(-rad * 2.2) * pulse * 0.18;

    vec3 cyan = vec3(0.0, 0.824, 1.0);
    vec3 deepBlue = vec3(0.05, 0.18, 0.42);
    vec3 violet = vec3(0.28, 0.08, 0.58);

    vec3 col = vec3(0.0);
    col += cyan * (glow * 0.95);
    col += deepBlue * (glow2 * 0.7 + radGlow);
    col += violet * (glow * 0.2);

    float alpha = clamp((glow * 0.85 + glow2 * 0.5 + radGlow * 0.6), 0.0, 0.85);

    gl_FragColor = vec4(col, alpha);
}`;

@Component({
  selector: 'media-player-soundwave-shader',
  imports: [],
  templateUrl: './soundwave-shader.html',
  styleUrl: './soundwave-shader.css',
})
export class SoundwaveShader implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  private canvasRef?: ElementRef<HTMLCanvasElement>;

  private rafId = 0;
  private resizeObserver?: ResizeObserver;
  private mouseX = 0;
  private mouseY = 0;
  private destroyed = false;

  ngAfterViewInit(): void {
    this.initShader();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.canvasRef?.nativeElement.removeEventListener('mousemove', this.onMouseMove);
    const canvas = this.canvasRef?.nativeElement;
    const gl = canvas?.getContext('webgl') as WebGLRenderingContext | null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private readonly onMouseMove = (event: MouseEvent): void => {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = 1.0 - (event.clientY - rect.top) / rect.height;
      this.mouseX = nx * canvas.width;
      this.mouseY = ny * canvas.height;
    }
  };

  private compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
  }

  private initShader(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const syncSize = (): void => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(syncSize);
      this.resizeObserver.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) return;

    const program = gl.createProgram();
    if (!program) return;
    const vs = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    this.mouseX = canvas.width / 2;
    this.mouseY = canvas.height / 2;
    canvas.addEventListener('mousemove', this.onMouseMove);

    gl.clearColor(0, 0, 0, 0);

    const render = (t: number): void => {
      if (this.destroyed) return;
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, this.mouseX, this.mouseY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      this.rafId = requestAnimationFrame(render);
    };
    this.rafId = requestAnimationFrame(render);
  }
}
