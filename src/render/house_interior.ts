import * as THREE from 'three';
import { surfaceMat } from './gfx';

const WALL_HW = 10;
const WALL_THICK = 1;
const Z0 = -10;
const WALL_HEIGHT = 6;
const WALL_Y_OFFSET = 0;
const FLOOR_Y = -0.05;

export class HouseInteriors {
  private wallMat: THREE.Material | null = null;
  private floorMat: THREE.Material | null = null;
  private ceilMat: THREE.Material | null = null;
  private wallGeo: THREE.BoxGeometry | null = null;
  private floorGeo: THREE.BoxGeometry | null = null;

  constructor(private scene: THREE.Scene, private lowGfx: boolean) {}

  private getWallMat(): THREE.Material {
    if (!this.wallMat) {
      this.wallMat = surfaceMat({
        color: 0xc4a882,
        roughness: 0.85,
        metalness: 0,
      });
    }
    return this.wallMat;
  }

  private getFloorMat(): THREE.Material {
    if (!this.floorMat) {
      this.floorMat = surfaceMat({
        color: 0x8B6914,
        roughness: 0.9,
        metalness: 0,
      });
    }
    return this.floorMat;
  }

  private getCeilMat(): THREE.Material {
    if (!this.ceilMat) {
      this.ceilMat = surfaceMat({
        color: 0xd4c4a8,
        roughness: 0.95,
        metalness: 0,
        side: THREE.BackSide,
      });
    }
    return this.ceilMat;
  }

  private getWallGeo(): THREE.BoxGeometry {
    if (!this.wallGeo) {
      this.wallGeo = new THREE.BoxGeometry(8, WALL_HEIGHT, WALL_THICK);
    }
    return this.wallGeo;
  }

  private getFloorGeo(): THREE.BoxGeometry {
    if (!this.floorGeo) {
      this.floorGeo = new THREE.BoxGeometry(4, 0.1, 4);
    }
    return this.floorGeo;
  }

  private ceilGeo(): THREE.BoxGeometry {
    return new THREE.BoxGeometry(4, 0.1, 4);
  }

  buildHouseInterior(originX: number, originZ: number, tier: number): void {
    const group = new THREE.Group();
    const zMin = Z0;
    const zMax = Z0 + tier * 10 + 6;
    const zLen = zMax - zMin;

    const wallMat = this.getWallMat();
    const floorMat = this.getFloorMat();
    const ceilMat = this.getCeilMat();
    const wallGeo = this.getWallGeo();
    const floorGeo = this.getFloorGeo();
    const ceilGeo = this.ceilGeo();

    // Side walls (left and right)
    for (const sx of [-WALL_HW - WALL_THICK, WALL_HW + WALL_THICK]) {
      const count = Math.ceil(zLen / 8);
      for (let i = 0; i < count; i++) {
        const z = zMin + i * 8 + 4;
        if (z > zMax - 2) break;
        const mesh = new THREE.Mesh(wallGeo, wallMat);
        mesh.position.set(sx, WALL_Y_OFFSET + WALL_HEIGHT / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    }

    // Back and front walls
    for (const zz of [zMin, zMax]) {
      const totalW = WALL_HW * 2 + WALL_THICK * 2;
      const count = Math.ceil(totalW / 8);
      for (let i = 0; i < count; i++) {
        const x = -WALL_HW - WALL_THICK + i * 8 + 4;
        if (x > WALL_HW + WALL_THICK - 2) break;
        const mesh = new THREE.Mesh(wallGeo, wallMat);
        mesh.position.set(x, WALL_Y_OFFSET + WALL_HEIGHT / 2, zz);
        mesh.rotation.y = Math.PI / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    }

    // Floor tiles
    for (let z = zMin; z < zMax; z += 4) {
      for (let x = -WALL_HW + 1; x <= WALL_HW - 1; x += 4) {
        const mesh = new THREE.Mesh(floorGeo, floorMat);
        mesh.position.set(x, FLOOR_Y, z + 2);
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    }

    // Ceiling tiles
    for (let z = zMin; z < zMax; z += 4) {
      for (let x = -WALL_HW + 1; x <= WALL_HW - 1; x += 4) {
        const mesh = new THREE.Mesh(ceilGeo, ceilMat);
        mesh.position.set(x, WALL_HEIGHT, z + 2);
        group.add(mesh);
      }
    }

    // Room dividers for tier >= 2 (interior walls with 3yd door gap)
    if (tier >= 2) {
      const roomSpan = zLen / tier;
      const dividerMat = this.getWallMat();
      const dividerGeo = new THREE.BoxGeometry(0.5, WALL_HEIGHT, 0.5);
      for (let i = 1; i < tier; i++) {
        const zDiv = zMin + i * roomSpan;
        // Left divider segment
        for (let x = -WALL_HW + 1; x <= -1.5; x += 4) {
          const mesh = new THREE.Mesh(dividerGeo, dividerMat);
          mesh.position.set(x, WALL_Y_OFFSET + WALL_HEIGHT / 2, zDiv);
          mesh.scale.set(4, 1, 1);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          group.add(mesh);
        }
        // Right divider segment
        for (let x = 1.5; x <= WALL_HW - 1; x += 4) {
          const mesh = new THREE.Mesh(dividerGeo, dividerMat);
          mesh.position.set(x, WALL_Y_OFFSET + WALL_HEIGHT / 2, zDiv);
          mesh.scale.set(4, 1, 1);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          group.add(mesh);
        }
      }
    }

    group.position.set(originX, 0, originZ);
    this.scene.add(group);
  }
}
