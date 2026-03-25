// Dynamic GSAP loader — always use this, never import gsap directly
export async function loadGSAP() {
  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)
  return { gsap, ScrollTrigger }
}

export async function loadSplitText() {
  const { gsap } = await import('gsap')
  const { SplitText } = await import('gsap/SplitText')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger, SplitText)
  return { gsap, ScrollTrigger, SplitText }
}
