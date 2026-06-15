/**
 * Surroundings.js — everything that frames the pitch: the concrete apron/ground,
 * the two team dugouts in the technical area, and the four corner flags.
 */

import * as THREE from 'three';
import { FIELD, TEAMS } from '../config.js';

export class Surroundings {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Surroundings';
    this.buildGround();
    this.buildDugouts();
    this.buildCornerFlags();
  }

  buildGround() {
    // concrete apron surrounding the turf
    const tex = this.concreteTexture();
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.95,
      metalness: 0,
      color: 0x8a8f96
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 300), mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.04;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  concreteTexture() {
    const s = 512;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#6e747c';
    ctx.fillRect(0, 0, s, s);
    const img = ctx.getImageData(0, 0, s, s);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 36;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    // expansion joints
    ctx.strokeStyle = 'rgba(20,20,20,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= s; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, s);
      ctx.moveTo(0, i);
      ctx.lineTo(s, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(40, 34);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  buildDugouts() {
    const z = FIELD.HALF_WIDTH + 3.6; // main-stand side
    const make = (x, color) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.25, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.9 })
      );
      base.position.y = 0.12;
      base.receiveShadow = true;
      g.add(base);

      // bucket seats
      const seatGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const seatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
      for (let i = 0; i < 12; i++) {
        const s = new THREE.Mesh(seatGeo, seatMat);
        s.position.set(-3.5 + i * 0.62, 0.5, 0.2);
        g.add(s);
      }

      // tinted roof on posts
      const postMat = new THREE.MeshStandardMaterial({ color: 0x7a818a, metalness: 0.7, roughness: 0.4 });
      [-3.8, 3.8].forEach((px) => {
        [-0.7, 0.7].forEach((pz) => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 8), postMat);
          post.position.set(px, 1.05, pz);
          g.add(post);
        });
      });
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(8.4, 0.1, 2.2),
        new THREE.MeshStandardMaterial({
          color: 0x10141a,
          roughness: 0.2,
          metalness: 0.3,
          transparent: true,
          opacity: 0.65
        })
      );
      roof.position.set(0, 2.15, 0);
      roof.rotation.x = -0.12;
      roof.castShadow = true;
      g.add(roof);

      g.rotation.y = Math.PI; // face the pitch (−Z)
      return g;
    };

    this.group.add(make(-7, TEAMS.HOME.primary));
    this.group.add(make(7, TEAMS.AWAY.primary));
  }

  buildCornerFlags() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 });
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xffd23f,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const corners = [
      [-FIELD.HALF_LENGTH, -FIELD.HALF_WIDTH],
      [FIELD.HALF_LENGTH, -FIELD.HALF_WIDTH],
      [-FIELD.HALF_LENGTH, FIELD.HALF_WIDTH],
      [FIELD.HALF_LENGTH, FIELD.HALF_WIDTH]
    ];
    corners.forEach(([x, z]) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), poleMat);
      pole.position.y = 0.75;
      pole.castShadow = true;
      g.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.3), flagMat);
      flag.position.set(Math.sign(-x) * 0.22, 1.32, 0);
      g.add(flag);
      this.group.add(g);
    });
  }

  get object() {
    return this.group;
  }
}
