// Original instructional illustrations using the flat computer-test workspace layout.
export function renderPage(catalog) {
  return `<meta charset="utf-8"><canvas width="1280" height="720"></canvas><script>
  const catalog=${JSON.stringify(catalog)};
  const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
  const ink='#222', muted='#58616a', red='#b91e3e', blue='#2463a5', border='#d5d8dc';
  function box(x,y,w,h,fill='#fff',stroke=border){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1)}}
  function label(t,x,y,size=18,color=ink,bold=false){ctx.fillStyle=color;ctx.font=(bold?'bold ':'')+size+'px Arial';ctx.fillText(t,x,y)}
  function paragraph(text,x,y,width,size=18,color=ink){let row='',offset=0;ctx.font=size+'px Arial';for(const word of text.split(' ')){const next=row+word+' ';if(ctx.measureText(next).width>width&&row){label(row,x,y+offset,size,color);offset+=size*1.5;row=word+' '}else row=next}if(row)label(row,x,y+offset,size,color);return offset+size*1.5}
  const descriptions={listening:['A conversation in an everyday social situation','A monologue about an everyday topic','A conversation about education or training','A monologue about an academic subject'],reading:['Read the passage and answer its questions.','A new text with its own question instructions.','Follow the writer’s ideas, views and claims.']};
  function pointer(points,progress,clicks=[]){
    const end=points.findIndex(point=>point[0]>progress), b=end<0?points[points.length-1]:points[end], a=end<=0?b:points[end-1];
    const f=a===b?0:Math.max(0,Math.min(1,(progress-a[0])/(b[0]-a[0]))), ease=f*f*(3-2*f), x=a[1]+(b[1]-a[1])*ease,y=a[2]+(b[2]-a[2])*ease;
    clicks.forEach(t=>{const delta=progress-t;if(delta>=0&&delta<.045){ctx.beginPath();ctx.arc(x,y,12+delta*300,0,Math.PI*2);ctx.strokeStyle='rgba(185,30,62,'+(1-delta/.045)+')';ctx.lineWidth=3;ctx.stroke()}});
    ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,25);ctx.lineTo(7,19);ctx.lineTo(12,31);ctx.lineTo(17,28);ctx.lineTo(11,17);ctx.lineTo(22,17);ctx.closePath();ctx.fillStyle='#15191f';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.restore();
  }
  function toolDemo(key,scene,p){
    const reading=key==='reading', view=scene.view;
    box(26,165,1228,399,'#fff');
    if(view!=='display')label(reading?'Reading passage':'Questions '+(view==='navigate'&&p>=.22?'11–20':'31–40'),48,204,22,ink,true);
    box(760,5,520,48,'#fff',null);label('Display settings',912,37,16,muted);label('Notes',1058,37,16,muted);label('Review',1142,37,16,muted);
    if(reading){box(623,165,8,399,'#d9dde1',null);label('Questions',659,203,21,ink,true);paragraph('Find information in the passage, then enter your answer.',659,247,535,20);label('31  Main subject:',659,326,19);box(836,298,369,40,'#fff',blue)}
    const text=reading?'Researchers study how shared spaces influence everyday life.':'Complete the notes. Write NO MORE THAN TWO WORDS.';
    if(view==='highlight'||view==='notes'){
      const selectionProgress=view==='notes'?p/.55:p;
      const selecting=selectionProgress>=.14&&selectionProgress<.38, marked=view==='highlight'?p>=.52&&p<.91:p>=.3;
      if(selecting||marked)box(47,258,selecting?Math.min(420,Math.max(0,(selectionProgress-.14)/.19*420)):420,28,selecting?'#b5d7fa':view==='highlight'?'#f3c85b':'#fed7aa',null);
      label(text,48,280,18);paragraph('Select only the words you want to mark. Highlights and notes do not change your answers.',48,340,reading?529:1028,19,muted);
      if(selectionProgress>=.38&&selectionProgress<.54){box(183,200,270,45,'#fff','#efc5cc');box(199,215,15,15,'#f3c85b',null);label('Highlight',224,231,17);label('Note',352,231,17,red)}
      if(view==='highlight'){
        if(p>=.75&&p<.91){box(178,204,190,44,'#fff',border);label('Delete highlight',193,232,17,red)}
        const status=p<.14?'Move the pointer to the text':p<.38?'Click and drag to select words':p<.54?'Choose Highlight from the toolbar':p<.75?'Selected words are highlighted':p<.91?'Click the highlight, then Delete highlight':'The highlight has been removed';
        box(48,450,1126,72,'#f5f6f8');label(status,71,493,22,ink,true);
        pointer([[0,750,438],[.13,48,278],[.14,48,278],[.33,465,278],[.38,465,278],[.5,267,224],[.54,267,224],[.69,270,279],[.76,270,279],[.86,270,226],[.92,270,226],[1,549,433]],p,[.14,.5,.76,.86]);
      }else{
        if(p>=.3&&p<.55){box(373,177,535,372,'#fff','#efc5cc');label('Add note',398,220,25,ink,true);label('Selected text',399,257,14,muted);paragraph(text,399,287,476,16);box(398,328,486,124,'#fff',border);const note='Check the key detail';label(note.slice(0,Math.max(0,Math.floor((p-.32)*125))),415,364,19);box(748,478,135,45,red,null);label('Save note',774,507,18,'#fff',true)}
        if(p>=.66){box(939,153,341,432,'#fff',border);label('Reading Notes',961,197,23,ink,true);label('Auto-saved instantly',961,231,15,muted);box(958,260,301,245,'#fff',border);label('Quick reminder',974,300,18)}
        pointer([[0,740,430],[.07,48,278],[.08,48,278],[.18,465,278],[.21,465,278],[.28,373,224],[.31,373,224],[.34,425,361],[.47,425,361],[.52,808,502],[.55,808,502],[.64,1080,32],[.68,1080,32],[1,1000,300]],p,[.08,.28,.52,.64]);
        if(p<.3)label('Select text, then choose Note',49,489,22,ink,true);
      }
    }else if(view==='display'){
      const large=p>=.48, high=p>=.85;
      box(28,165,reading?595:1224,399,high?'#20242a':'#fff',null);
      const color=high?'#fff':ink;label('Example text',48,207,large?28:22,color,true);paragraph(text,48,264,reading?530:1000,large?25:18,color);paragraph('Choose a comfortable size and contrast. These settings change the display, not your answers.',48,358,reading?530:1000,large?23:18,color);
      if(p>=.17&&p<.94){box(709,166,445,370,'#fff','#efc5cc');label(p<.34?'Display settings':p<.64?'Text size':'Contrast',733,210,24,ink,true);label('×',1117,205,26,muted);
        const values=p<.34?['Contrast','Text size','Reading font']:p<.64?['Regular','Large','Extra large']:['Black on white','Sepia (warm paper)','White on black','Yellow on black'];
        values.forEach((v,n)=>{box(732,233+n*60,397,59,((p>=.48&&p<.64&&n===1)||(p>=.85&&n===2))?'#fff0f3':'#fff',border);label(v,751,270+n*60,20);if((p>=.48&&p<.64&&n===1)||(p>=.85&&n===2))label('✓',1088,270+n*60,20,red)})}
      pointer([[0,360,412],[.15,960,31],[.19,960,31],[.31,843,327],[.35,843,327],[.46,843,327],[.51,843,327],[.59,1117,194],[.63,1117,194],[.67,960,31],[.69,960,31],[.72,841,267],[.76,841,267],[.83,841,387],[.87,841,387],[.93,1117,194],[1,1117,194]],p,[.15,.31,.46,.59,.67,.72,.83,.93]);
    }else if(view==='navigate'){
      const first=reading?14:11;
      paragraph('Move between parts and questions using the navigation bar below.',48,262,1080,23);label('Current question: '+(p<.22?'31':p<.42?first:first+1),48,342,25,ink,true);
      box(1079,513,50,40,p>=.58?'#fff2cc':'#fff',border);label('⚑',1094,542,25,p>=.58?'#ad7800':muted);
      if(p>=.75&&p<.96){box(358,172,563,374,'#fff','#efc5cc');label('Review your answers',382,211,25,ink,true);label('Choose a question to return and edit your answer.',382,246,17,muted);['Question '+first+'   Answered','Question '+(first+1)+'   Flagged · Unanswered','Question '+(first+2)+'   Unanswered'].forEach((v,n)=>{box(381,269+n*67,516,54,'#fff',border);label(v,399,304+n*67,19,n===1?red:ink)})}
    }else if(view==='timer'){
      box(170,244,940,173,'#f4f6f8');label(reading?'One timer for all three passages':'Two-minute answer review',200,289,26,ink,true);
      label(reading?'59:'+String(59-Math.floor(p*12)).padStart(2,'0'):'01:'+String(59-Math.floor(p*12)).padStart(2,'0'),200,363,48,red,true);
      paragraph(reading?'Keep an eye on the time. There is no extra time for transferring answers.':'This countdown appears only after the final recording ends. It does not begin after an earlier track.',421,319,656,22);
      paragraph('Your test submits automatically when the countdown reaches zero.',201,476,884,22,muted);
      pointer([[0,924,434],[.2,270,338],[.8,270,338],[1,518,489]],p);
    }
  }
  function frame(key,time,timeline) {
    const intro=catalog[key], i=Math.max(0,timeline.findLastIndex(s=>time>=s.start)), scene=intro.scenes[i], part=scene.part;
    ctx.clearRect(0,0,1280,720);box(0,0,1280,720,'#fff',null);
    box(0,0,1280,60,'#fff');label('PROFAI',26,38,25,red,true);label('IELTS Academic · '+intro.title,172,37,18,ink,true);label('Instruction preview · timer not started',807,36,16,muted);label('Help',1210,36,16,blue);
    box(20,76,1240,70,'#f0f0ee',null);label(scene.title,38,106,21,ink,true);label(intro.meta,38,134,16,muted);
    const localProgress=Math.min(1,(time-timeline[i].start)/(timeline[i].end-timeline[i].start));
    if(['highlight','display','notes','navigate','timer'].includes(scene.view)){
      toolDemo(key,scene,localProgress);
    }else if(scene.view==='overview'){
      label('INSTRUCTIONS TO CANDIDATES',62,194,20,ink,true);
      const bullets=key==='listening'?['Four parts, with ten questions in each part.','Each recording is played once.','Enter answers while you listen.','Two minutes to check after the final recording.']:key==='reading'?['Three passages, with forty questions in total.','Sixty minutes for the whole Reading test.','Read the instructions for each question.','There is no extra answer-transfer time.']:key==='writing'?['Complete both tasks within sixty minutes.','Task 1: write at least 150 words.','Task 2: write at least 250 words.','Task 2 carries twice the weight of Task 1.']:['Three parts: interview, long turn and discussion.','Check your microphone before you begin.','Listen carefully and respond naturally.','This practice uses an AI examiner.'];
      bullets.forEach((text,n)=>{label('•',64,243+n*52,22,red);label(text,91,243+n*52,22)});
      box(62,467,1156,87,'#f7f8fa');paragraph(key==='listening'?'Headphone check: you should hear the narration clearly. Adjust your device volume before starting.':'Your test begins only when you select Start Test. You can replay or skip these instructions.',84,500,1106,19);
    }else if(key==='listening'){
      if(scene.view==='review'){
        label('The recording has finished.',61,204,23,ink,true);box(62,234,1156,90,'#f4f6f8');label('Time to check your answers',85,270,22,ink,true);label('02:00',1090,291,36,red,true);label('Check all four parts. The test submits when this countdown ends.',85,304,18,muted);
        for(let n=0;n<4;n++){label('Part '+(n+1)+'    Questions '+(n*10+1)+'–'+(n+1)*10,85,367+n*48,20);for(let q=0;q<10;q++){box(500+q*54,342+n*48,42,33,'#fff',blue);label(String(n*10+q+1),510+q*54,365+n*48,16,blue)}}
      }else{
        label('Part '+part+' · Questions '+((part-1)*10+1)+'–'+part*10,46,188,22,ink,true);label(descriptions.listening[part-1],46,221,18,muted);
        box(25,248,748,308,'#fff');label('Complete the notes below.',48,285,19,ink,true);label('Write NO MORE THAN TWO WORDS AND / OR A NUMBER.',48,316,16);
        const topics=['BOOKING INFORMATION','VISITOR INFORMATION','PROJECT DISCUSSION','LECTURE NOTES'];label(topics[part-1],49,363,19,ink,true);
        const rows=[['Name','Arrival date','Number of guests'],['Opening time','Location','Facilities'],['Topic','Research method','Next step'],['Main subject','Key finding','Example']][part-1];
        rows.forEach((v,n)=>{label(String((part-1)*10+n+1)+'   '+v+':',49,406+n*57,19);box(284,380+n*57,443,40,'#fff',scene.view==='answer'&&n===0?blue:border);if(scene.view==='answer'&&n===0)label('Sample answer',297,406,18,blue)});
        box(793,248,461,308,'#f8f9fa');label('Listen and answer',821,287,21,ink,true);paragraph('Read the questions first. Follow the recording and answer in order.',821,328,403,19,muted);for(let n=0;n<42;n++){const h=6+Math.abs(Math.sin(time*2+n*.6))*46;box(823+n*9,454-h/2,4,h,blue,null)}label('Recording plays once',822,520,17,muted);
      }
    }else if(key==='reading'){
      box(23,164,603,401,'#fff');box(633,164,624,401,'#fff');box(625,164,8,401,'#ddd',null);
      const names=['The changing world of cities','Learning from the natural world','How people make decisions'];label('READING PASSAGE '+part,44,197,17,ink,true);label(names[part-1],44,239,25,ink,true);
      const paras=['Cities develop as people find new ways to live and work. Researchers study how shared spaces bring communities together and influence everyday life.','Scientists often look to nature when developing new materials. The structures found in plants and animals can offer useful starting points for design.','The choices people make are shaped by the information available to them. Researchers investigate how experience, expectations and context affect these decisions.'];
      for(let n=0;n<3;n++)paragraph(String.fromCharCode(65+n)+'  '+paras[part-1],44,285+n*83,556,18);
      label('Questions for Passage '+part,655,197,22,ink,true);paragraph('Read each question and follow its instructions. The question types vary between tests.',655,239,560,18);
      label('Example · Identifying information',655,328,19,ink,true);paragraph('Do the following statements agree with the information given in the passage?',655,367,556,18);paragraph('1  The passage discusses how people respond to their surroundings.',655,432,556,18);
      ['TRUE','FALSE','NOT GIVEN'].forEach((v,n)=>{ctx.beginPath();ctx.arc(668,481+n*31,7,0,Math.PI*2);ctx.strokeStyle=border;ctx.stroke();if(scene.view==='answer'&&n===0){ctx.fillStyle=blue;ctx.fill()}label(v,687,487+n*31,16)});
    }else if(key==='writing'){
      box(23,164,579,401,'#fff');box(611,164,645,401,'#fff');box(602,164,9,401,'#ddd',null);label('WRITING TASK '+part,45,201,21,ink,true);
      paragraph(part===1?'You should spend about 20 minutes on this task.':'You should spend about 40 minutes on this task.',45,244,531,18);
      paragraph(part===1?'The chart below shows changes across five categories. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.':'Some people believe that technology has improved education. To what extent do you agree or disagree? Give reasons for your answer and include relevant examples.',45,311,531,20);
      if(part===1){ctx.strokeStyle='#777';ctx.strokeRect(90,419,412,99);[31,66,88,52,92].forEach((h,n)=>box(125+n*72,518-h,35,h,blue,null))}
      label('Write at least '+(part===1?'150':'250')+' words.',45,550,18,ink,true);label('Your answer',634,199,18,ink,true);box(634,216,598,316,'#fff',blue);
      const response=part===1?'The chart illustrates changes across five categories. Overall, the final category shows the highest figure.':'Technology plays an important role in modern education. In my view, it offers significant benefits when used thoughtfully.';
      if(scene.view!=='review')paragraph(response.slice(0,Math.min(response.length,Math.floor(time%15*12))),652,254,557,20);label('Words: '+(scene.view==='review'?'Check both tasks':'24'),634,554,16,muted);
    }else{
      box(30,165,376,398,'#f5f6f7');label('AI practice examiner',63,213,23,ink,true);paragraph('Listen to the question, then give your answer aloud.',63,260,300,20);for(let n=0;n<28;n++){const h=5+Math.abs(Math.sin(time*2+n*.7))*43;box(75+n*10,429-h/2,4,h,blue,null)}label('Microphone required',64,514,18,muted);
      label('Part '+part,444,208,22,ink,true);const topics=part===1?'What do you enjoy about your work or studies?':part===2?'Describe a skill you would like to learn. Say what it is, why it interests you, and how you would learn it.':'How has technology changed the way people learn new skills?';paragraph(topics,444,263,735,26);
      if(part===2){box(444,411,746,112,'#f4f6f8');label('Preparation: 1 minute',467,451,21,ink,true);label('Your long turn: up to 2 minutes',467,490,21)}else paragraph(part===3?'Explain your views and develop your ideas.':'Answer naturally and give relevant details.',444,441,735,21,muted);
    }
    box(0,584,1280,64,'#f4f4f2');const count=key==='listening'?4:key==='reading'||key==='speaking'?3:2;
    const activePart=scene.view==='navigate'&&localProgress>=.22?2:part;
    for(let n=1;n<=count;n++){const x=25+(n-1)*(1230/count);box(x,597,1230/count-12,38,n===activePart?'#fff':'#f4f4f2',n===activePart?blue:null);label((key==='writing'?'Task ':'Part ')+n,x+12,622,18,n===activePart?blue:muted,n===activePart);if((key==='listening'||key==='reading')&&n===activePart){const first=key==='reading'?[1,14,27][n-1]:(n-1)*10+1;for(let q=0;q<(key==='reading'?(n===3?14:13):10);q++){box(x+83+q*20,605,18,24,'#fff',blue);label(String(first+q),x+85+q*20,621,11,blue);if(scene.view==='navigate'&&localProgress>=.58&&q===1)box(x+88+q*20,599,7,7,'#dda419',null)}}}
    if(scene.view==='navigate')pointer([[0,525,400],[.2,key==='listening'?344:470,615],[.26,key==='listening'?344:470,615],[.39,key==='listening'?443:545,615],[.44,key==='listening'?443:545,615],[.54,1104,534],[.61,1104,534],[.71,1165,31],[.77,1165,31],[.9,580,365],[.97,580,365],[1,765,424]],localProgress,[.2,.39,.54,.71,.9]);
    box(0,655,1280,65,'#fff',null);label('Instruction preview · example questions',25,692,15,muted);label(String(i+1)+' / '+intro.scenes.length+'    '+scene.title,600,692,16,ink,true);
  }
  window.record=async(key)=>{
    window.recordingState={key,phase:'decoding'};
    const context=new AudioContext();await context.resume();const destination=context.createMediaStreamDestination();
    const clips=await Promise.all(catalog[key].scenes.map(async(_,i)=>context.decodeAudioData(await(await fetch('/voice/'+key+'-'+i+'.wav')).arrayBuffer())));
    let cursor=0;const timeline=clips.map(clip=>{const start=cursor;cursor+=clip.duration+0.8;return {start,end:cursor,audioDuration:clip.duration}});const duration=cursor;
    const stream=canvas.captureStream(0),videoTrack=stream.getVideoTracks()[0];destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:1200000});const chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise(resolve=>recorder.onstop=resolve);
    // Warm the canvas/fonts before scheduling speech: first-frame work must never
    // consume narration before MediaRecorder has begun capturing the audio track.
    frame(key,0,timeline);await document.fonts.ready;frame(key,0,timeline);
    // Inactive tabs may suspend animation frames before capture begins.
    await new Promise(resolve=>setTimeout(resolve,50));
    // Start capture before scheduling sound, then keep supplying canvas frames.
    // MediaRecorder.onstart can wait for its first frame/audio packet, so awaiting
    // it before producing either would prevent recording from ever beginning.
    recorder.start();window.recordingState.phase='recording';
    const began=performance.now(),start=context.currentTime+.15;
    clips.forEach((clip,i)=>{const source=context.createBufferSource();source.buffer=clip;source.playbackRate.value=1;source.connect(destination);source.start(start+timeline[i].start)});
    // Explicit frames and unthrottled timers also run in the other recording tabs;
    // requestAnimationFrame may suspend in a hidden tab and produce a still video.
    const draw=()=>{frame(key,Math.min(duration,(performance.now()-began)/1000),timeline);videoTrack.requestFrame()};draw();const interval=setInterval(draw,1000/24);
    await new Promise(resolve=>setTimeout(resolve,duration*1000));clearInterval(interval);frame(key,duration,timeline);videoTrack.requestFrame();window.recordingState.phase='stopping';recorder.stop();stream.getTracks().forEach(track=>track.stop());await stopped;await context.close();
    window.recordingState.phase='encoding';const blob=new Blob(chunks,{type:'video/webm'});const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let n=0;n<bytes.length;n+=8192)binary+=String.fromCharCode(...bytes.subarray(n,n+8192));const base64=btoa(binary);window.recordingState.phase='complete';
    return {base64,duration,scenes:timeline,voice:'en_GB-cori-high',playbackRate:1};
  };
  </script>`
}
