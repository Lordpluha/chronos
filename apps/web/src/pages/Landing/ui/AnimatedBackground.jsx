import { OrbitingCircles } from "@shared/ui/orbiting-circles";

const Icons = {
  icon1: () => (
    <img src="/land-orbit-icon-1.svg" alt="" className="w-full h-full" />
  ),
  icon2: () => (
    <img src="/land-orbit-icon-2.svg" alt="" className="w-full h-full" />
  ),
  icon3: () => (
    <img src="/land-orbit-icon-3.svg" alt="" className="w-full h-full" />
  ),
  icon4: () => (
    <img src="/land-orbit-icon-4.svg" alt="" className="w-full h-full" />
  ),
  icon5: () => (
    <img src="/land-orbit-icon-5.svg" alt="" className="w-full h-full" />
  ),
  icon6: () => (
    <img src="/land-orbit-icon-6.svg" alt="" className="w-full h-full" />
  ),
  icon7: () => (
    <img src="/land-orbit-icon-7.svg" alt="" className="w-full h-full" />
  ),
  icon8: () => (
    <img src="/land-orbit-icon-8.svg" alt="" className="w-full h-full" />
  ),
  icon9: () => (
    <img src="/land-orbit-icon-9.svg" alt="" className="w-full h-full" />
  ),
  icon10: () => (
    <img src="/land-orbit-icon-10.svg" alt="" className="w-full h-full" />
  ),
  icon11: () => (
    <img src="/land-orbit-icon-11.svg" alt="" className="w-full h-full" />
  ),
  icon13: () => (
    <img src="/land-orbit-icon-13.svg" alt="" className="w-full h-full" />
  ),
};

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <OrbitingCircles radius={600} duration={45} iconSize={50} path={true}>
        <Icons.icon9 />
        <Icons.icon2 />
        <Icons.icon3 />
      </OrbitingCircles>

      <OrbitingCircles
        radius={450}
        duration={35}
        iconSize={45}
        reverse
        path={true}
      >
        <Icons.icon4 />
        <Icons.icon5 />
        <Icons.icon6 />
        <Icons.icon7 />
      </OrbitingCircles>

      <OrbitingCircles radius={300} duration={25} iconSize={40} path={true}>
        <Icons.icon8 />
        <Icons.icon1 />
        <Icons.icon10 />
        <Icons.icon11 />
        <Icons.icon13 />
      </OrbitingCircles>
    </div>
  )
}
