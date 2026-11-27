// Paste into a new standalone Apps Script project. Run setup once as owner.
const PAGES=/^\/(?:[a-z0-9-]+\.html|(?:blog|posts|field-notes|journal)\/[a-z0-9/_-]+(?:\.html|\/)?)$/;
function setup(){
 const p=PropertiesService.getScriptProperties();
 if(p.getProperty('SHEET_ID'))return;
 const ss=SpreadsheetApp.create('Website Community & Comments');
 const s=ss.getSheets()[0];s.setName('Moderation');
 s.appendRow(['ID','Page','Submitted UTC','Display name','Comment','Parent ID','Status','Owner reply']);
 s.setFrozenRows(1);s.getRange('A1:H1').setFontWeight('bold').setBackground('#175a78').setFontColor('#ffffff');
 s.setColumnWidth(5,420);s.setColumnWidth(8,420);
 s.getRange('G2:G').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Pending','Approved','Rejected'],true).setAllowInvalid(false).build());
 p.setProperty('SHEET_ID',ss.getId());console.log(ss.getUrl());
}
function sheet_(){return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')).getSheetByName('Moderation')}
function page_(v){v=String(v||'');if(v.length>240||!PAGES.test(v)||v.includes('..'))throw Error('Invalid page');return v;}
function doGet(e){const t=HtmlService.createTemplateFromFile('Comments');t.page=page_(e.parameter.page);return t.evaluate().setTitle('Community comments').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}
function listComments(page){page=page_(page);const rows=sheet_().getDataRange().getDisplayValues().slice(1);const approved=rows.filter(r=>r[1]===page&&r[6]==='Approved');const ids=new Set(approved.map(r=>r[0]));return approved.filter(r=>!r[5]||ids.has(r[5])).slice(-100).map(r=>({id:r[0],date:r[2],name:r[3],comment:r[4],parent:r[5],reply:r[7]}));}
function safe_(v){return /^[\s]*[=+\-@]/.test(v)?"'"+v:v;}
function submitComment(d){
 const page=page_(d.page),name=String(d.name||'').trim(),comment=String(d.comment||'').trim(),parent=String(d.parent||''),token=String(d.token||'');
 if(d.website||name.length>60||comment.length<5||comment.length>2000||!/^[-a-zA-Z0-9]{16,80}$/.test(token))throw Error('Invalid submission.');
 if(parent&&!listComments(page).some(r=>r.id===parent))throw Error('Reply target unavailable.');
 const lock=LockService.getScriptLock();lock.waitLock(10000);
 try{const cache=CacheService.getScriptCache();const key='rate-'+token;const global=Number(cache.get('global-rate')||0);if(cache.get(key)||global>=30)throw Error('Please try again later.');
 const rows=sheet_().getDataRange().getDisplayValues().slice(1);if(rows.filter(r=>r[6]==='Pending').length>=500)throw Error('Moderation queue is full.');
 sheet_().appendRow([Utilities.getUuid(),page,new Date().toISOString(),safe_(name||'Anonymous'),safe_(comment),parent,'Pending','']);
 cache.put(key,'1',60);cache.put('global-rate',String(global+1),60);return true;
 }finally{lock.releaseLock();}
}
