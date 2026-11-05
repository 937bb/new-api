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
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { cn } from '@/lib/utils'

import { landingModels, type LandingVisual } from './landing-model-config'

interface LandingModelSceneProps {
  className?: string
  visual: LandingVisual
}

export type { LandingVisual } from './landing-model-config'

function disposeMaterial(material: THREE.Material) {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) {
      value.dispose()
    }
  }
  material.dispose()
}

function disposeScene(scene: THREE.Object3D) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    object.geometry.dispose()
    if (Array.isArray(object.material)) {
      object.material.forEach(disposeMaterial)
    } else {
      disposeMaterial(object.material)
    }
  })
}

export function LandingModelScene(props: LandingModelSceneProps) {
  const { t } = useTranslation()
  const mountRef = useRef<HTMLDivElement>(null)
  const model = landingModels[props.visual]

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {
      return
    }

    let frameId = 0
    let disposed = false
    let mixer: THREE.AnimationMixer | null = null
    let root: THREE.Object3D | null = null

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100)
    camera.position.set(...model.cameraPosition)
    camera.lookAt(new THREE.Vector3(...model.lookAt))

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = model.exposure
    renderer.domElement.className = 'h-full w-full'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xe7f9ff, 0x1d2127, 2.6))

    const keyLight = new THREE.DirectionalLight(0xffefb5, 3.5)
    keyLight.position.set(-3.8, 5.6, 4.2)
    keyLight.castShadow = true
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x5ecaff, 2.1)
    rimLight.position.set(4.2, 2.6, -3.8)
    scene.add(rimLight)

    const fillLight = new THREE.PointLight(0xffffff, 1.4, 8)
    fillLight.position.set(0.8, 1.2, 2.4)
    scene.add(fillLight)

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    const loader = new GLTFLoader()
    loader.load(model.src, (gltf) => {
      if (disposed) {
        disposeScene(gltf.scene)
        return
      }

      root = gltf.scene
      root.position.set(...model.position)
      root.rotation.set(...model.rotation)
      root.scale.setScalar(model.scale)
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
          return
        }
        object.castShadow = true
        object.receiveShadow = true
      })
      scene.add(root)

      const clip =
        THREE.AnimationClip.findByName(gltf.animations, model.animationName) ||
        gltf.animations[0]
      if (clip) {
        mixer = new THREE.AnimationMixer(root)
        mixer.clipAction(clip).play()
      }
    })

    let lastTime = Date.now() / 1000
    let elapsedTime = 0
    const animate = () => {
      const currentTime = Date.now() / 1000
      const delta = Math.min(currentTime - lastTime, 0.05)
      lastTime = currentTime
      elapsedTime += delta
      mixer?.update(delta)
      if (root) {
        root.rotation.y += delta * model.idleRotationSpeed
        root.position.y =
          model.position[1] + Math.sin(elapsedTime * 1.2) * 0.014
      }
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }
    animate()

    return () => {
      disposed = true
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      mixer?.stopAllAction()
      disposeScene(scene)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [model])

  return (
    <div
      className={cn('relative min-h-[24rem] lg:min-h-[42rem]', props.className)}
    >
      <div
        aria-hidden
        className='absolute top-[20%] right-[4%] h-[38rem] w-[38rem] rounded-full border border-slate-950/[0.035] opacity-55 lg:h-[48rem] lg:w-[48rem] dark:border-white/[0.045]'
      />
      <div
        aria-hidden
        className='absolute right-[12%] bottom-[18%] h-[18rem] w-[34rem] rotate-[-8deg] rounded-[50%] border border-slate-950/[0.035] opacity-55 dark:border-white/[0.045]'
      />
      <div
        aria-hidden
        className='absolute right-[4%] bottom-2 hidden h-[28rem] w-[44rem] rotate-[-72deg] rounded-[50%] border border-slate-950/[0.03] opacity-45 lg:block dark:border-white/[0.04]'
      />

      <div
        ref={mountRef}
        role='img'
        aria-label={t(model.altKey)}
        className={cn(
          'landing-animate-scale-in absolute z-10 w-[min(94vw,48rem)] max-w-none opacity-0 drop-shadow-[0_18px_36px_rgba(15,23,42,0.18)] dark:drop-shadow-[0_24px_48px_rgba(0,0,0,0.32)]',
          model.modelClassName
        )}
      />
    </div>
  )
}
