export const Conflict={

min(t){const [h,m]=t.split(":").map(Number);return h*60+m},

overlap(a,b){let as=this.min(a.start),ae=this.min(a.end||a.start),bs=this.min(b.start),be=this.min(b.end||b.start);return as===ae||bs===be?as===bs:as<be&&bs<ae},

cross(s){let a=s.filter(x=>x.childId==="first"),b=s.filter(x=>x.childId==="second"),r=[];a.forEach(x=>b.forEach(y=>{if(this.overlap(x,y))r.push({a:x,b:y})}));return r}};