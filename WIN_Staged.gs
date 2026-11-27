/**
 * WIN staged feed v3. Replace the existing WIN_Staged.gs, not the sync code.
 * Keep the original doGet renamed winLegacyGet. Run setupWINStationIndex once,
 * authorize Drive/Sheets access, then deploy a new version of the existing web app.
 * Private Drive snapshot: no Drive sharing changes; only public summary/selected
 * surface-water measurements are returned by doGet. No source data is deleted.
 */
const WIN_INDEX_SHEET_ID='18RlmRCj94sIy0zLzfgMzM34jcS946znfObeu6ucmEfQ';
const WIN_INDEX_PROPERTY='WIN_STATION_SNAPSHOT_V3';
const WIN_INDEX_AGENCIES=['21FLEECO','21FLCOFM'];
function winIndexDate(v){
  const s=String(v??'').trim();
  let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/) || null;
  if(!m){const t=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(t)m=[t[0],t[3],t[1],t[2]];}
  if(!m)return '';
  const d=m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
  return Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d?d:'';
}
function winIndexCoord(lat,lon){return lat!==''&&lon!==''&&lat!=null&&lon!=null&&Number.isFinite(+lat)&&Number.isFinite(+lon)&&Math.abs(+lat)<=90&&Math.abs(+lon)<=180&&+lat!==0&&+lon!==0;}
function winIndexSheet(){
  const sh=SpreadsheetApp.openById(WIN_INDEX_SHEET_ID).getSheetByName('WIN_Results');
  if(!sh)throw Error('WIN_Results missing');
  const expected=['OrganizationID','ResultKey','RawJSON','monitoringLocId','monitoringLocationName','activityStartDate','depAnalytePrimaryName','depResultValue','depResultUnit','valueQualifier','sampleFraction','latitude','longitude','laboratoryLongName','labAccreditationAuthName','analysisMethodName','depMdl','depPql','matrix'];
  if(sh.getRange(1,1,1,19).getDisplayValues()[0].join('|')!==expected.join('|'))throw Error('WIN_Results headers changed');
  return sh;
}
function rebuildWINStationIndex(){
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(1000))throw Error('Another index rebuild is running');
  try{
    const sh=winIndexSheet(),last=sh.getLastRow(),groups=new Map(),rowIndex={};
    let included=0,excluded=0,invalid=0,unknownDates=0;
    for(let start=2;start<=last;start+=8000){
      const n=Math.min(8000,last-start+1);
      // RawJSON is authoritative: historical sync writes A:C only.
      const data=sh.getRange(start,1,n,3).getValues();
      for(let i=0;i<n;i++){
        const [a,rid,raw]=data[i];
        let record;try{record=JSON.parse(raw);}catch(e){invalid++;continue;}
        if(!record||typeof record!=='object'){invalid++;continue;}
        const org=String(a??'').trim(),id=String(record.monitoringLocId??'').trim();
        if(!WIN_INDEX_AGENCIES.includes(org)||!/surface\s*water/i.test(String(record.matrix??''))){excluded++;continue;}
        if(String(record.organizationId??'')!==org||String(record.resultKey??'')!==String(rid)||!id||!record.depAnalytePrimaryName){invalid++;continue;}
        const name=String(record.monitoringLocationName??''),dt=record.activityStartDate,ch=String(record.depAnalytePrimaryName),unit=String(record.depResultUnit??''),lat=record.latitude,lon=record.longitude;
        const d=winIndexDate(dt),k=org+'|'+id;
        if(!d)unknownDates++;
        let g=groups.get(k);
        if(!g){g={org,id,name:name||id,lat:null,lon:null,date:'',count:0,parameters:{},coordDate:''};groups.set(k,g);rowIndex[k]=[];}
        if(winIndexCoord(lat,lon)&&(g.lat===null||d>=g.coordDate)){g.lat=+lat;g.lon=+lon;g.coordDate=d;}
        if(d>g.date){g.date=d;g.name=name||g.name;}
        g.count++;included++;
        const p=JSON.stringify([ch,unit||'']);g.parameters[p]=(g.parameters[p]||0)+1;
        const rr=rowIndex[k],row=start+i,prev=rr[rr.length-1];
        if(prev&&prev[1]===row-1)prev[1]=row;else rr.push([row,row]);
      }
    }
    if(sh.getLastRow()<last)throw Error('Source shrank during index build; retry');
    const stations=[...groups.values()].map(g=>{delete g.coordDate;return g;});
    const summary={schema:2,mode:'stations',sourceRows:Math.max(0,last-1),indexedResults:included,excludedRows:excluded,invalidRows:invalid,unknownDateRows:unknownDates,indexVersion:4,generatedAt:new Date().toISOString(),stations};
    const props=PropertiesService.getScriptProperties(),previous=props.getProperty(WIN_INDEX_PROPERTY);
    const file=DriveApp.createFile('WIN-station-snapshot-'+Date.now()+'.json',JSON.stringify({summary,rowIndex}),MimeType.PLAIN_TEXT);
    props.setProperty(WIN_INDEX_PROPERTY,file.getId());
    if(previous&&previous!==file.getId()){try{DriveApp.getFileById(previous).setTrashed(true);}catch(e){console.warn(e);}}
    console.log(JSON.stringify({sourceRows:summary.sourceRows,indexedResults:included,excludedRows:excluded,invalidRows:invalid,stations:stations.length,unknownDateRows:unknownDates,generatedAt:summary.generatedAt}));
    return summary;
  }finally{lock.releaseLock();}
}
function setupWINStationIndex(){
  rebuildWINStationIndex();
  // Replace only index triggers, leaving original sync triggers intact.
  for(const t of ScriptApp.getProjectTriggers())if(t.getHandlerFunction()==='rebuildWINStationIndex')ScriptApp.deleteTrigger(t);
  ScriptApp.newTrigger('rebuildWINStationIndex').timeBased().everyHours(6).create();
}
function winIndexSnapshot(){
  const id=PropertiesService.getScriptProperties().getProperty(WIN_INDEX_PROPERTY);
  if(!id)throw Error('Station index not initialized; administrator must run setupWINStationIndex');
  return JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString());
}
function winIndexOutput(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function doGet(e){
  const p=(e&&e.parameter)||{};
  if(p.mode!=='stations'&&p.mode!=='station')return winLegacyGet(e);
  try{
    const snapshot=winIndexSnapshot();
    if(p.mode==='stations')return winIndexOutput(snapshot.summary);
    const org=String(p.org||''),id=String(p.id||''),offset=Number(p.offset||0);
    if(!WIN_INDEX_AGENCIES.includes(org)||!id||id.length>250||!Number.isSafeInteger(offset)||offset<0)return winIndexOutput({error:'Invalid station request'});
    const spans=snapshot.rowIndex[org+'|'+id];
    if(!spans)return winIndexOutput({error:'Station not indexed'});
    const end=spans.reduce((n,r)=>n+r[1]-r[0]+1,0);
    if(offset>end)return winIndexOutput({error:'Invalid offset'});
    const next=Math.min(end,offset+1000),wanted=[];
    let position=0;
    for(const [a,b] of spans){const len=b-a+1;if(position+len>offset&&position<next){const lo=a+Math.max(0,offset-position),hi=a+Math.min(len,next-position)-1;for(let row=lo;row<=hi;row++)wanted.push(row);}position+=len;if(position>=next)break;}
    const sh=winIndexSheet(),result=[];
    // Coalesce adjacent and nearby matches to reduce Sheet read calls.
    for(let i=0;i<wanted.length;){
      let j=i+1;while(j<wanted.length&&wanted[j]-wanted[j-1]<=30&&wanted[j]-wanted[i]<2000)j++;
      const first=wanted[i],data=sh.getRange(first,1,wanted[j-1]-first+1,3).getValues();
      for(let k=i;k<j;k++){
        const [a,rid,raw]=data[wanted[k]-first];let r;try{r=JSON.parse(raw);}catch(_){continue;}
        if(String(a)!==org||String(r.organizationId)!==org||String(r.monitoringLocId)!==id||String(r.resultKey)!==String(rid)||!/surface\s*water/i.test(String(r.matrix)))continue;
        result.push([org,String(rid),r.monitoringLocId,r.monitoringLocationName,r.latitude,r.longitude,r.activityStartDate,r.depAnalytePrimaryName,r.depResultValue,r.depResultUnit,r.valueQualifier,r.activityDepth,r.depthUnit,r.laboratoryLongName,r.labAccreditationAuthName,r.analysisMethodName,r.depMdl,r.depPql,r.matrix,r.wbid,r.resultModifyTs,Boolean(r.resultCommentText),r.sampleFraction]);
      }i=j;
    }
    return winIndexOutput({schema:2,mode:'station',org,id,offset,next,end,rows:result,generatedAt:snapshot.summary.generatedAt});
  }catch(err){console.error(err);return winIndexOutput({error:String(err.message||err)});}
}
