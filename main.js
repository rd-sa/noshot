function setVH(){
  const h = (window.visualViewport ? window.visualViewport.height : window.innerHeight)
  document.documentElement.style.setProperty('--vh', (h * 0.01) + 'px')
}
setVH()
window.addEventListener('resize', setVH)
window.addEventListener('orientationchange', setVH)
if (window.visualViewport) window.visualViewport.addEventListener('resize', setVH)

const shapes=[...document.querySelectorAll('.shape')]
const lerp=(a,b,t)=>a+(b-a)*t
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n))
const state={mx:0,my:0,tx:0,ty:0}
let eX=innerWidth/2,eY=innerHeight/2

document.addEventListener('mousemove',e=>{
  state.mx=(e.clientX/innerWidth-.5)*2
  state.my=(e.clientY/innerHeight-.5)*2
  eX=e.clientX; eY=e.clientY
},{passive:true})

document.addEventListener('touchmove',e=>{
  const t=e.touches[0]; if(!t)return
  state.mx=(t.clientX/innerWidth-.5)*2
  state.my=(t.clientY/innerHeight-.5)*2
  eX=t.clientX; eY=t.clientY
},{passive:true})

shapes.forEach(el=>{
  el.__seed=Math.random()*1000
  el.__speed=.3+Math.random()*.7
  el.__px=0; el.__py=0; el.__rx=0; el.__ry=0; el.__rz=0; el.__scale=1
})

function csNum(el,prop,unit){
  const v=getComputedStyle(el).getPropertyValue(prop).trim()
  return unit==='vw'?(+v.replace('vw','')/100*innerWidth)
  :unit==='vh'?(+v.replace('vh','')/100*innerHeight)
  :parseFloat(v)
}

function influenceFor(el,x,y){
  const bx=csNum(el,'--baseX','vw')
  const by=csNum(el,'--baseY','vh')
  const s=csNum(el,'--size')
  const cx=bx+s/2, cy=by+s/2
  const d=Math.hypot(x-cx,y-cy)
  return Math.max(0,1-d/(innerWidth*.8))
}

function frame(t){
  state.tx=lerp(state.tx,state.mx,.06)
  state.ty=lerp(state.ty,state.my,.06)
  const sy=scrollY

  for(const el of shapes){
    const z=csNum(el,'--z')
    const bx=csNum(el,'--baseX','vw')
    const by=csNum(el,'--baseY','vh')
    const bob=Math.sin(t/1000*(el.__speed||.6)+(el.__seed||0))*6
    const infl=influenceFor(el,eX,eY)

    const tpx=-state.tx*(30+(60-z)*.25)*infl
    const tpy=-state.ty*(30+(60-z)*.25)*infl

    el.__px=lerp(el.__px,tpx,.08)
    el.__py=lerp(el.__py,tpy,.08)

    const ang=Math.atan2(eY-by,eX-bx)
    const tilt=clamp(infl*8,-10,10)

    el.__rx=lerp(el.__rx,Math.sin(ang)*tilt,.08)
    el.__ry=lerp(el.__ry,-Math.cos(ang)*tilt,.08)
    el.__rz=lerp(el.__rz,(state.tx*-4+state.ty*4)*infl,.08)

    el.__scale=lerp(el.__scale,1+infl*.06,.08)

    const drift=sy*(.05+(60-z)*.0006)
    const x=bx+el.__px
    const y=by+el.__py+bob+drift

    el.style.transform=
      `translate3d(${x}px,${y}px,0) rotateX(${el.__rx}deg) rotateY(${el.__ry}deg) rotateZ(${el.__rz}deg) scale(${el.__scale})`

    const sm=Math.hypot(tpx-el.__px,tpy-el.__py)
    el.style.setProperty('--motionBlur',clamp(sm/120,0,3).toFixed(2)+'px')

    const pulse=(Math.sin(t/200+(el.__seed||0))+1)/2
    const alpha=.20+infl*.25+pulse*.10
    el.style.setProperty('--glowAlpha',alpha.toFixed(2))
    el.style.setProperty('--glowPulse',(pulse*6).toFixed(1)+'px')
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

document.getElementById('yr').textContent=new Date().getFullYear()
