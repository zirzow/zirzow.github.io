/**
 * Add to the existing Apps Script project as WIN_Staged.gs.
 * Rename the existing doGet(e) to winLegacyGet(e), then deploy a new version.
 * Existing sync functions and triggers are unchanged.
 */
function doGet(e) {
  const p=(e&&e.parameter)||{};
  if(p.mode!=='stations' && p.mode!=='station') return winLegacyGet(e);
  const out=x=>ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);
  try {
    const ss=SpreadsheetApp.openById('18RlmRCj94sIy0zLzfgMzM34jcS946znfObeu6ucmEfQ');
    const sh=ss.getSheetByName('WIN_Results');
    if(!sh) return out({error:'Results sheet missing'});
    const last=sh.getLastRow(), count=Math.max(0,last-1);
    const cache=CacheService.getScriptCache();
    const cacheKey='win-stations-v1-'+last;
    if(p.mode==='stations'){
      const cached=cache.get(cacheKey);
      if(cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    }
    const org=String(p.org||''), id=String(p.id||'');
    if(p.mode==='station'&&(!['21FLEECO','21FLCOFM'].includes(org)||!id||id.length>250))return out({error:'Invalid station'});
    const groups=new Map(), rows=[];
    const date=v=>{let s=String(v||''),m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);return m?m[3]+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0'):s.slice(0,10)};
    // Read only the public readable fields for the index. Raw JSON is read
    // only for matching station rows when returning historical measurements.
    for(let start=2;start<=last;start+=10000){
      const n=Math.min(10000,last-start+1);
      const data=sh.getRange(start,4,n,16).getValues();
      const orgs=sh.getRange(start,1,n,1).getValues();
      for(let i=0;i<n;i++){
        const [sid,name,dt,ch,value,unit,qual,fraction,lat,lon,lab,accr,method,mdl,pql,matrix]=data[i];
        const a=String(orgs[i][0]), s=String(sid||'');
        if(!['21FLEECO','21FLCOFM'].includes(a)||!s||!ch||!/surface water/i.test(String(matrix)))continue;
        if(p.mode==='station'){
          if(a===org&&s===id)rows.push(start+i);
          continue;
        }
        const k=a+'|'+s,d=date(dt instanceof Date?Utilities.formatDate(dt,ss.getSpreadsheetTimeZone(),'yyyy-MM-dd'):dt);
        if(!/^\d{4}-\d{2}-\d{2}$/.test(d))continue;
        let g=groups.get(k);
        if(!g){g={org:a,id:s,name:String(name||s),lat:null,lon:null,date:d,count:0,parameters:{}};groups.set(k,g)}
        if(lat!==''&&lon!==''&&Number.isFinite(+lat)&&Number.isFinite(+lon)&&Math.abs(+lat)<=90&&Math.abs(+lon)<=180&&+lat!==0&&+lon!==0){g.lat=+lat;g.lon=+lon}
        if(d>g.date)g.date=d;g.count++;
        const pk=JSON.stringify([String(ch),String(unit||'')]);g.parameters[pk]=(g.parameters[pk]||0)+1;
      }
    }
    if(p.mode==='stations'){
      const result=JSON.stringify({schema:2,mode:'stations',sourceRows:count,generatedAt:new Date().toISOString(),stations:[...groups.values()]});
      if(Utilities.newBlob(result).getBytes().length<95000)cache.put(cacheKey,result,600);
      return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
    }
    // Preserve legacy row layout; bounded pages prevent oversized responses.
    const offset=Number(p.offset||0);
    if(!Number.isSafeInteger(offset)||offset<0||offset>rows.length)return out({error:'Invalid station offset'});
    const selected=rows.slice(offset,offset+2500), result=[];
    for(let i=0;i<selected.length;){
      let j=i+1;while(j<selected.length&&selected[j]===selected[j-1]+1)j++;
      const vals=sh.getRange(selected[i],1,j-i,3).getValues();
      for(const [a,rid,raw] of vals){let r;try{r=JSON.parse(raw)}catch(_){continue}
        if(String(a)!==org||String(r.monitoringLocId)!==id||String(r.organizationId)!==org||String(r.resultKey)!==String(rid))continue;
        result.push([org,String(rid),r.monitoringLocId,r.monitoringLocationName,r.latitude,r.longitude,r.activityStartDate,r.depAnalytePrimaryName,r.depResultValue,r.depResultUnit,r.valueQualifier,r.activityDepth,r.depthUnit,r.laboratoryLongName,r.labAccreditationAuthName,r.analysisMethodName,r.depMdl,r.depPql,r.matrix,r.wbid,r.resultModifyTs,Boolean(r.resultCommentText),r.sampleFraction]);
      }i=j;
    }
    return out({schema:2,mode:'station',org,id,offset,next:offset+selected.length,end:rows.length,rows:result});
  }catch(err){console.error(err);return out({error:'Staged WIN feed unavailable; retry later'});}
}
