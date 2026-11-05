/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
export type LandingVisual = 'robot' | 'fox'

type VectorTuple = [number, number, number]

export interface LandingModelConfig {
  altKey: string
  animationName: string
  cameraPosition: VectorTuple
  exposure: number
  idleRotationSpeed: number
  lookAt: VectorTuple
  modelClassName: string
  position: VectorTuple
  rotation: VectorTuple
  scale: number
  src: string
}

export const landingModels: Record<LandingVisual, LandingModelConfig> = {
  robot: {
    altKey: 'Low-poly robot gateway mascot',
    animationName: 'Wave',
    cameraPosition: [0.1, 1.16, 7.8],
    exposure: 1.08,
    idleRotationSpeed: 0.14,
    lookAt: [0, 0.18, 0],
    modelClassName: 'right-[-2%] bottom-[-2%] h-[24rem] lg:h-[42rem]',
    position: [0, -1.2, 0],
    rotation: [0, -0.18, 0],
    scale: 0.76,
    src: '/models/landing/robot-expressive.glb',
  },
  fox: {
    altKey: 'Low-poly fox gateway mascot',
    animationName: 'Survey',
    cameraPosition: [0.18, 1.04, 5.55],
    exposure: 1.12,
    idleRotationSpeed: 0.1,
    lookAt: [0, 0.06, 0],
    modelClassName: 'right-[-2%] bottom-[-1%] h-[24rem] lg:h-[40rem]',
    position: [0, -0.78, 0],
    rotation: [0, -0.34, 0],
    scale: 0.028,
    src: '/models/landing/fox.glb',
  },
}
