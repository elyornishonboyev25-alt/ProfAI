import { useEffect, useRef, useState } from 'react'
import { Building2 } from 'lucide-react'
import type { University } from '@/data/admission'
import { useUniversityCampusImage } from '@/hooks/useUniversityCampusImage'
import { useCopy } from '@/i18n/interface'
export default function UniversityCampusThumbnail({ university }: { university: University }) {
  const ref=useRef<HTMLDivElement>(null)
  const [visible,setVisible]=useState(false)
  const [failed,setFailed]=useState(false)
  const { c }=useCopy()
  useEffect(()=>{
    const element=ref.current
    if(!element)return
    if (!('IntersectionObserver' in window)) { setVisible(true); return }
    const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){setVisible(true);observer.disconnect()}},{rootMargin:'100px'})
    observer.observe(element);return()=>observer.disconnect()
  },[])
  const image=useUniversityCampusImage(visible?university.name:'')
  useEffect(() => { setFailed(false) }, [university.id, image?.src])
  return <div ref={ref} className="liquid-campus-thumbnail">{image&&!failed?<><img src={image.src} alt={university.name} loading="lazy" onError={()=>setFailed(true)} /><a href={image.attributionUrl} target="_blank" rel="noopener noreferrer" className="liquid-photo-credit">{c('Photo source')}</a></>:<div className="liquid-campus-placeholder"><Building2 size={48} strokeWidth={1} /><span>{university.shortName}</span></div>}</div>
}
