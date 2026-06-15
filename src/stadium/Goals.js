/**
 * Goals.js — regulation goals (7.32 × 2.44 m) with round posts, a crossbar and
 * a slanted, sagging net built from a procedural mesh texture.
 */

import * as THREE from 'three';
import { FIELD, GOAL } from '../config.js';

function createNetTexture() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.4;
  const cells = 9;
  const step = size / cells;
  ctx.beginPath();
  for (let i = 0; i <= cells; i++) {
    const p = i * step;
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
  }
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export class Goals {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Goals';

    this.netTex = createNetTexture();
    this.postMat = new THREE.MeshStandardMaterial({
      color: 0xf4f6f8,
      roughness: 0.32,
      metalness: 0.05
    });

    this.group.add(this.buildGoal(-1)); // home (opening faces +X)
    this.group.add(this.buildGoal(1)); // away (opening faces −X)
  }

  buildGoal(sign) {
    const g = new THREE.Group();
    const W = GOAL.WIDTH;
    const H = GOAL.HEIGHT;
    const r = GOAL.POST_RADIUS;
    const halfW = W / 2;
    const depthTop = GOAL.DEPTH_TOP;
    const depthBottom = GOAL.DEPTH_BOTTOM;

    // Build facing +X, net trailing toward −X, then place/rotate per side.
    const post = (z) => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, H, 20),
        this.postMat
      );
      m.position.set(0, H / 2, z);
      m.castShadow = true;
      g.add(m);
    };
    post(-halfW);
    post(halfW);

    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, W + r * 2, 20),
      this.postMat
    );
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, H, 0);
    bar.castShadow = true;
    g.add(bar);

    // back ground bar
    const back = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.7, r * 0.7, W, 12),
      this.postMat
    );
    back.rotation.x = Math.PI / 2;
    back.position.set(-depthBottom, r * 0.7, 0);
    g.add(back);

    // ---- net -------------------------------------------------------------
    const netMat = new THREE.MeshStandardMaterial({
      map: this.netTex,
      alphaMap: this.netTex,
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide,
      color: 0xf4f8fb,
      roughness: 0.85,
      metalness: 0,
      depthWrite: true
    });

    // Back panel: slanted plane from crossbar (x=0,y=H) to back bar (x=-depthBottom, y=0)
    const backPanel = this.saggedPanel(
      [0, H, -halfW],
      [0, H, halfW],
      [-depthBottom, 0, halfW],
      [-depthBottom, 0, -halfW],
      netMat,
      12,
      8,
      0.18
    );
    g.add(backPanel);

    // Top panel: from crossbar back to depthTop (gives the net a "roof")
    const topPanel = this.saggedPanel(
      [0, H, -halfW],
      [0, H, halfW],
      [-depthTop, H * 0.62, halfW],
      [-depthTop, H * 0.62, -halfW],
      netMat,
      10,
      4,
      0.1
    );
    g.add(topPanel);

    // Two side triangles (left/right). Use quads degenerated to triangles.
    const sidePanelL = this.saggedPanel(
      [0, H, -halfW],
      [-depthTop, H * 0.62, -halfW],
      [-depthBottom, 0, -halfW],
      [0, 0, -halfW],
      netMat,
      8,
      8,
      0.05
    );
    const sidePanelR = this.saggedPanel(
      [0, 0, halfW],
      [-depthBottom, 0, halfW],
      [-depthTop, H * 0.62, halfW],
      [0, H, halfW],
      netMat,
      8,
      8,
      0.05
    );
    g.add(sidePanelL, sidePanelR);

    // texture density on the net
    [backPanel, topPanel, sidePanelL, sidePanelR].forEach((p) => {
      p.material.map.repeat.set(4, 3);
    });

    // place
    const x = sign * FIELD.HALF_LENGTH;
    g.position.x = x;
    if (sign > 0) g.rotation.y = Math.PI; // away goal faces −X
    return g;
  }

  /**
   * A subdivided quad through four corners with a soft inward sag, used for net
   * faces. Corners given in goal-local coords [x,y,z]; bilinearly interpolated.
   */
  saggedPanel(c00, c10, c11, c01, material, segU, segV, sag) {
    const geo = new THREE.PlaneGeometry(1, 1, segU, segV);
    const pos = geo.attributes.position;
    const a = new THREE.Vector3(...c00);
    const b = new THREE.Vector3(...c10);
    const c = new THREE.Vector3(...c11);
    const d = new THREE.Vector3(...c01);
    const tmpAB = new THREE.Vector3();
    const tmpDC = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) + 0.5; // 0..1
      const v = pos.getY(i) + 0.5; // 0..1
      tmpAB.lerpVectors(a, b, u);
      tmpDC.lerpVectors(d, c, u);
      p.lerpVectors(tmpAB, tmpDC, v);
      // sag toward −X and slightly down, strongest at panel centre
      const s = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * sag;
      p.x -= s;
      p.y -= s * 0.4;
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material.clone());
    return mesh;
  }

  get object() {
    return this.group;
  }
}
