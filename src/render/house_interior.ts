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

    // Grid overlay: thin lines every 0.5yd on the floor
    const gridMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
    const gridStep = 0.5;
    for (let z = zMin + 0.5; z < zMax; z += gridStep) {
      const points: THREE.Vector3[] = [];
      for (let x = -WALL_HW + 1; x <= WALL_HW - 1; x += gridStep) {
        points.push(new THREE.Vector3(x, FLOOR_Y + 0.01, z));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, gridMat);
      group.add(line);
    }
    for (let x = -WALL_HW + 1; x <= WALL_HW - 1; x += gridStep) {
      const points: THREE.Vector3[] = [];
      for (let z = zMin + 0.5; z < zMax; z += gridStep) {
        points.push(new THREE.Vector3(x, FLOOR_Y + 0.01, z));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, gridMat);
      group.add(line);
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

  placeFurnitureItems(
    originX: number,
    originZ: number,
    furniture: { itemId: string; x: number; z: number; rotY: number }[],
  ): void {
    const group = new THREE.Group();
    for (const f of furniture) {
      const lx = f.x - originX;
      const lz = f.z - originZ;
      const size = FURNITURE_SIZES[f.itemId] ?? { w: 0.5, h: 0.8, d: 0.5 };
      const color = FURNITURE_COLORS[f.itemId] ?? 0x8B6914;
      const geo = new THREE.BoxGeometry(size.w, size.h, size.d);
      const mat = surfaceMat({ color, roughness: 0.8, metalness: 0 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(lx, size.h / 2, lz);
      mesh.rotation.y = f.rotY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    group.position.set(0, 0, 0);
    this.scene.add(group);
  }
}

const FURNITURE_SIZES: Record<string, { w: number; h: number; d: number }> = {
  rustic_chair: { w: 0.6, h: 0.8, d: 0.6 },
  rustic_table: { w: 1.0, h: 0.7, d: 1.0 },
  rustic_bed: { w: 1.5, h: 0.6, d: 1.0 },
  rustic_shelf: { w: 0.5, h: 1.0, d: 0.3 },
  rustic_rug: { w: 1.0, h: 0.05, d: 0.7 },
  rustic_lamp: { w: 0.3, h: 0.6, d: 0.3 },
  rustic_cabinet: { w: 0.6, h: 1.2, d: 0.6 },
  sturdy_chair: { w: 0.6, h: 0.85, d: 0.6 },
  sturdy_table: { w: 1.0, h: 0.75, d: 1.0 },
  sturdy_bed: { w: 1.5, h: 0.65, d: 1.0 },
  sturdy_shelf: { w: 0.5, h: 1.1, d: 0.3 },
  sturdy_rug: { w: 1.0, h: 0.05, d: 0.7 },
  sturdy_lamp: { w: 0.3, h: 0.65, d: 0.3 },
  ornate_chair: { w: 0.6, h: 0.9, d: 0.6 },
  ornate_table: { w: 1.0, h: 0.8, d: 1.0 },
  ornate_bed: { w: 1.5, h: 0.7, d: 1.0 },
  ornate_cabinet: { w: 0.6, h: 1.3, d: 0.6 },
  ornate_lamp: { w: 0.3, h: 0.7, d: 0.3 },
  ornate_rug: { w: 1.0, h: 0.05, d: 0.7 },
  exquisite_chair: { w: 0.6, h: 0.9, d: 0.6 },
  exquisite_table: { w: 1.0, h: 0.8, d: 1.0 },
  exquisite_bed: { w: 1.5, h: 0.7, d: 1.0 },
  exquisite_lamp: { w: 0.3, h: 0.7, d: 0.3 },
  masterwork_chair: { w: 0.6, h: 0.95, d: 0.6 },
  masterwork_table: { w: 1.0, h: 0.85, d: 1.0 },
  masterwork_bed: { w: 1.5, h: 0.75, d: 1.0 },
  masterwork_rug: { w: 1.0, h: 0.05, d: 0.7 },
  station_workbench: { w: 1.5, h: 0.8, d: 0.8 },
  station_anvil: { w: 0.8, h: 0.6, d: 0.8 },
  station_alchemy: { w: 1.0, h: 0.7, d: 0.8 },
  station_cooking_fire: { w: 0.8, h: 0.4, d: 0.8 },
  station_loom: { w: 1.2, h: 0.9, d: 0.6 },
  chest_small: { w: 0.6, h: 0.5, d: 0.6 },
  chest_medium: { w: 0.8, h: 0.6, d: 0.8 },
  chest_large: { w: 1.0, h: 0.7, d: 1.0 },
};

const FURNITURE_COLORS: Record<string, number> = {
  rustic_chair: 0x8B6914,
  rustic_table: 0x8B6914,
  rustic_bed: 0xa0724a,
  rustic_shelf: 0x8B6914,
  rustic_rug: 0x6B4E2E,
  rustic_lamp: 0xc4a040,
  rustic_cabinet: 0x6B3A1F,
  sturdy_chair: 0x6B4E2E,
  sturdy_table: 0x6B4E2E,
  sturdy_bed: 0x7a5a3a,
  sturdy_shelf: 0x6B4E2E,
  sturdy_rug: 0x4a3520,
  sturdy_lamp: 0xb8943a,
  ornate_chair: 0x4a2080,
  ornate_table: 0x4a2080,
  ornate_bed: 0x5a3090,
  ornate_cabinet: 0x3a1a70,
  ornate_lamp: 0xd4b060,
  ornate_rug: 0x3a1a60,
  exquisite_chair: 0x1a5a2a,
  exquisite_table: 0x1a5a2a,
  exquisite_bed: 0x2a6a3a,
  exquisite_lamp: 0xe8c860,
  masterwork_chair: 0x8a2020,
  masterwork_table: 0x8a2020,
  masterwork_bed: 0x9a3030,
  masterwork_rug: 0x6a1a1a,
  station_workbench: 0x5a4a3a,
  station_anvil: 0x4a4a4a,
  station_alchemy: 0x2a6a4a,
  station_cooking_fire: 0x8a3a1a,
  station_loom: 0x6a5a3a,
  chest_small: 0x5a3a1a,
  chest_medium: 0x5a3a1a,
  chest_large: 0x5a3a1a,
};
