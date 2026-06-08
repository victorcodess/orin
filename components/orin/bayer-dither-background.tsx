"use client";

import {
  bayerDitherFragmentShader,
  bayerDitherVertexShader,
} from "@/lib/shaders/bayer-dither";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const MAX_CLICKS = 10;

const SHAPE_MAP = {
  square: 0,
  circle: 1,
  triangle: 2,
  diamond: 3,
} as const;

type DitherShape = keyof typeof SHAPE_MAP;

type BayerDitherBackgroundProps = {
  className?: string;
  shape?: DitherShape;
  pixelSize?: number;
  color?: string;
};

function readCssColor(variable: string, fallback: string) {
  if (typeof window === "undefined") return fallback;

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();

  return value || fallback;
}

export function BayerDitherBackground({
  className,
  shape = "circle",
  pixelSize = 4,
  color,
}: BayerDitherBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<THREE.Color | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    canvas.style.pointerEvents = "none";

    const gl = canvas.getContext("webgl2");
    if (!gl) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl,
      antialias: true,
      alpha: true,
    });

    container.appendChild(canvas);

    const inkColor = new THREE.Color(
      color ??
        readCssColor(
          "--muted-foreground",
          resolvedTheme === "dark" ? "#525252" : "#d4d4d4",
        ),
    );
    colorRef.current = inkColor;

    const uniforms = {
      uResolution: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uColor: { value: inkColor },
      uClickPos: {
        value: Array.from(
          { length: MAX_CLICKS },
          () => new THREE.Vector2(-1, -1),
        ),
      },
      uClickTimes: { value: new Float32Array(MAX_CLICKS) },
      uShapeType: { value: SHAPE_MAP[shape] },
      uPixelSize: { value: pixelSize },
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: bayerDitherVertexShader,
      fragmentShader: bayerDitherFragmentShader,
      uniforms,
      glslVersion: THREE.GLSL3,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener("resize", resize);
    resize();

    let clickIndex = 0;

    const handlePointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width);
      const y =
        (rect.height - (event.clientY - rect.top)) *
        (canvas.height / rect.height);

      uniforms.uClickPos.value[clickIndex].set(x, y);
      uniforms.uClickTimes.value[clickIndex] = uniforms.uTime.value;
      clickIndex = (clickIndex + 1) % MAX_CLICKS;
    };

    window.addEventListener("pointerdown", handlePointerDown);

    const clock = new THREE.Clock();
    let frame = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      uniforms.uTime.value = reducedMotion ? 0 : clock.getElapsedTime();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      colorRef.current = null;
      canvas.remove();
    };
  }, [color, pixelSize, shape, resolvedTheme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.style.backgroundColor = readCssColor("--background", "#ffffff");

    if (colorRef.current && !color) {
      colorRef.current.set(
        readCssColor(
          "--muted-foreground",
          resolvedTheme === "dark" ? "#525252" : "#d4d4d4",
        ),
      );
    }
  }, [color, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn("absolute inset-0 overflow-hidden", className)}
    />
  );
}
