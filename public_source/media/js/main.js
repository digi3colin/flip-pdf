const Vec2 = {
  radianToDegree: (n) => n * (180 /Math.PI),
  degreeToRadian: (n) => n * (Math.PI/180),
  rotation: (a, b) => Math.atan2(b.y-a.y, b.x-a.x),
  assign : (a, b) => {a.x = b.x; a.y=b.y},
  add : (a,b) => ({ x: a.x + b.x, y: a.y + b.y }),
  subtract: (a,b) => ({ x: a.x - b.x, y: a.y - b.y }),
  multiplyScalar: (a, s) => ({ x: a.x * s, y: a.y * s}),
  pointSlope: (m, a, x=null, y=null) => ({x: (x !== null) ? x : (y - a.y) / m + a.x, y: (y !== null) ? y : m * (x - a.x) + a.y}),
  magnitude: a => Math.sqrt((a.x * a.x) + (a.y * a.y)),
  normalize: a => {
    const mag = Vec2.magnitude(a);
    return {x: a.x / mag, y: a.y / mag}
  },
  slope: (a, o= {x:0, y:0}) => {
    const d = Vec2.subtract(a, o);
    return d.y / d.x;
  },
  perpendicularSlope(a, o = {x:0, y:0}){
    const d = Vec2.subtract(a, o);
    return - d.x / d.y;
  },
  project: (a,b) => {
    const normalizedScalarProjection = ((a.x * b.x) + (a.y * b.y)) / ((b.x * b.x) + (b.y * b.y));
    return{
      x: b.x * normalizedScalarProjection,
      y: b.y * normalizedScalarProjection
    }
  },

  pointAt: (a, len=1, o={x:0, y:0}) => {
    const d = Vec2.subtract(a, o);
    const n = Vec2.normalize(d);
    const p2 = Vec2.multiplyScalar(n, len);
    return Vec2.add(p2, o);
  },
  easeInOutSine: x => -(Math.cos(Math.PI * x) - 1) * .5,
  easeInSine:    x => 1 - Math.cos((x * Math.PI) * .5),
  easeOutSine:   x => Math.sin((x * Math.PI) * .5)

}
class FlipBook {
  contents = [];
  pages = [null];
  direction = {x:0,y:0};
  corner = {x:0,y:0};
  page = 1;

  constructor(pageWidth=300, pageHeight=300) {
    this.pageWidth = pageWidth;
    this.pageHeight = pageHeight;
  }

  setPageContent(pageNumber, blob){
    contents[pageNumber] = blob;
  }

  setPage(num, sprite){
    const deviceRatio = 1 / (window.devicePixelRatio || 1);
    sprite.scale.set(deviceRatio, deviceRatio);
    this.pages[num] = sprite;
  }

  start(p){
    //find hover zone
    this.direction.x = (p.x < 0) ? -1 : 1;
    this.direction.y = (p.y < 0) ? -1 : 1;

    this.corner = {
      x: this.pageWidth * this.direction.x,
      y: this.pageHeight * 0.5 * this.direction.y
    };
  }

  move(p){
    const p1 = Vec2.subtract(p, this.corner);
    const mx = this.pageWidth * -this.direction.x;
    const my = this.pageHeight * -this.direction.y;

    const {p2, p3, p4, p5, p6} = FlipBook.getMaskPoints(p1, my);

    //limit p3, p5
    const p3x = (p3.x * -this.direction.x);
    if(p3x > this.pageWidth || p3x < 0){
      p3.x = mx;

      const np = FlipBook.getMaskPoints(Vec2.pointAt(p1, this.pageWidth, p3), my);
      Vec2.assign(p1, np.p1);
      Vec2.assign(p2, np.p2);
      Vec2.assign(p3, np.p3);
      Vec2.assign(p4, np.p4);
      Vec2.assign(p5, np.p5);
      Vec2.assign(p6, np.p6);
    }

    if((p5.x * -this.direction.x) > this.pageWidth){
      p5.x = mx;

      Vec2.assign(p6, Vec2.pointAt(p6, this.pageWidth, p5));
      Vec2.assign(p1, Vec2.pointAt(Vec2.pointSlope(Vec2.perpendicularSlope(p6, p5), p6, 0, null), this.pageHeight, p6));

      const ap1x = (p1.x * -this.direction.x);
      const tolerance = 25;
      if(ap1x < tolerance ){
        const ratio = Math.max(ap1x / tolerance, 0);
        p1.y = p1.y * Vec2.easeOutSine(ratio);
      }

      const np = FlipBook.getMaskPoints(p1, my);
      Vec2.assign(p1, np.p1);
      Vec2.assign(p2, np.p2);
      Vec2.assign(p3, np.p3);
      Vec2.assign(p4, np.p4);
      Vec2.assign(p5, np.p5);
      Vec2.assign(p6, np.p6);
    }

    return {p1, p2, p3, p4, p5, p6}
  }

  static getMaskPoints(p1, maxY) {
    const p2 = Vec2.multiplyScalar(p1, .5);

    const m2 = Vec2.perpendicularSlope(p2);
    const p3 = Vec2.pointSlope(m2, p2, null, 0);
    const p4 = Vec2.pointSlope(m2, p2, 0, null);
    const p5 = Vec2.pointSlope(m2, p2, null, maxY);

    const p6 = Vec2.add(Vec2.project(Vec2.subtract(p5, p1), Vec2.subtract(p4, p1)), p1);
    return { p1, p2, p3, p4, p5, p6 }
  }
}

//load pdf;

async function renderPage(page, canvas, scale){
  const outputScale = window.devicePixelRatio || 1;

  const viewport = page.getViewport({scale: scale});
  const context = canvas.getContext('2d');
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);

  const transform = outputScale !== 1
    ? [outputScale, 0, 0, outputScale, 0, 0]
    : null;

  const renderContext = {
    canvasContext: context,
    transform: transform,
    viewport: viewport
  };
  await page.render(renderContext).promise;
}

//visualise
class Vec2Debug{
  static drawPoint(graphics, color, size, a, o={x:0, y:0}){
    const offsetA = Vec2.add(o, a);

    graphics
      .beginFill(color)
      .drawCircle(offsetA.x, offsetA.y, size)
      .endFill();

    return offsetA;
  }

  static drawLine(graphics, color, width, alpha, a, b, o = {x:0, y:0}){
    const oa = Vec2.add(o, a);
    const ob = Vec2.add(o, b);

    graphics
      .lineStyle({ width, color, alpha })
      .moveTo(oa.x, oa.y)
      .lineTo(ob.x, ob.y)
      .endFill();

    return {oa, ob}
  }
}

//prepare stage
const {bg, pages, pagesMask, flipPage, flipPageContainer, flipPageMask, backPages, grid, debug} = (()=>{
  const htmlStage = document.getElementById('stage');
  const rect = htmlStage.getBoundingClientRect();
  console.log(rect);
  const app = new PIXI.Application({ width: rect.width, height: rect.height , antialias: false, backgroundAlpha: 1, backgroundColor: 0xEEEEEE, resolution: 2 });
  htmlStage.appendChild(app.view);

  const stageCenter = new PIXI.Container();
  app.stage.addChild(stageCenter);
  stageCenter.x = rect.width * .5;
  stageCenter.y = rect.height * .5;

  const bg = new PIXI.Graphics();
  bg.beginFill(0x222222);
  bg.drawRect(-rect.width * .5, -rect.height * .5, rect.width, rect.height);
  stageCenter.addChild(bg);

  const pagesMask = new PIXI.Graphics();
  stageCenter.addChild(pagesMask);

  const backPages = new PIXI.Container();
  stageCenter.addChild(backPages)

  const pages = new PIXI.Container();
  pages.mask = pagesMask
  stageCenter.addChild(pages)

  const flipPageMask = new PIXI.Graphics();
  stageCenter.addChild(flipPageMask);

  const flipPage = new PIXI.Container();
  flipPage.mask = flipPageMask;
  stageCenter.addChild(flipPage);

  const flipPageContainer = new PIXI.Container();
  flipPage.addChild(flipPageContainer);

  const grid = new PIXI.Graphics();
  grid.interactive = true;
  stageCenter.addChild(grid);

  const debug = new PIXI.Graphics();
  stageCenter.addChild(debug);

  const dot = new PIXI.Graphics();
  stageCenter.addChild(dot);

  Vec2Debug.drawLine(dot, 0xFFFFFF, 0.5, 0.3, {x:0, y:-stageCenter.y}, {x:0, y: rect.height});
  Vec2Debug.drawLine(dot, 0xFFFFFF, 0.5, 0.3, {x:-stageCenter.x, y:0}, {x:rect.width, y:0});

  return {bg, pages, pagesMask, flipPage, flipPageContainer, flipPageMask, backPages, grid, debug};
})();

function setFlipPageContent(book){
  const content = (book.direction.x > 0)? book.pages[book.page+2] : book.pages[book.page-1];
  content.x = 0;
  content.y = 0;
  flipPageContainer.x = (book.direction.x < 0 )? -book.pageWidth : 0;
  flipPageContainer.y = (book.direction.y > 0 )? -book.pageHeight : 0;
  flipPageContainer.addChild(content);
}

function initBook(width, height, grid, debug){
  const book = new FlipBook(width, height);
  window.book = book;

  let isDragging = false;
  grid.lineStyle({ width: 1, color: 0xFFFFFF, alpha: 0.3 })
  grid.beginFill(0x000000, 0.01);
  grid.drawRect(-book.pageWidth, -book.pageHeight * 0.5, book.pageWidth * 2, book.pageHeight);

  pages.x = -width;
  pages.y = -height * 0.5;
  backPages.x = pages.x;
  backPages.y = pages.y;

  function onDragStart(evt){
    const pt = evt.data.getLocalPosition(bg);
    book.start(pt);

    if(book.direction.x > 0){
      const nextBack = book.pages[book.page + 3];
      if(!nextBack)return;
      nextBack.x = book.pageWidth;
      backPages.addChild(nextBack);
    }else{
      const nextBack = book.pages[book.page - 2];
      if(!nextBack)return;
      nextBack.x = 0;
      backPages.addChild(nextBack);
    }

    isDragging = true;
    setFlipPageContent(book);
  }

  function onDragEnd(){
    if(isDragging === false)return;

    isDragging = false;
    if(book.direction.x > 0){
      //flip forward
      //send current page to back pages;
      backPages.addChild(book.pages[book.page]);

      //push flip page to pages;
      book.page += 2;
    }else{
      //flip back
      backPages.addChildAt(book.pages[book.page]);
      book.page -= 2;
    }

    const currentPage = book.pages[book.page];
    if(currentPage)pages.addChild(currentPage);
    const nextPage = book.pages[book.page+1];
    if(nextPage){
      pages.addChild(nextPage);
      nextPage.x = book.pageWidth;
    }

    flipPageMask.clear();
    pagesMask.clear();
    debug.clear();
    pagesMask.beginFill(0xFF0000, 1);
    pagesMask.drawRect(-book.pageWidth, -book.pageHeight * .5, book.pageWidth *2, book.pageHeight)
    pagesMask.endFill();
  }

  grid.on('pointerdown', evt => onDragStart(evt) )
    .on('pointerup', () => onDragEnd())
    .on('pointerupoutside', () => onDragEnd())

  grid.on('pointermove', (evt)=>{
    if(!isDragging)return;
    debug.clear();
    pagesMask.clear();

    flipPageMask.clear();

    const pt = evt.data.getLocalPosition(bg);
    const {p1, p2, p3, p4, p5, p6} = book.move(pt);
    const origin = book.corner;

    Vec2Debug.drawPoint(debug, 0xFFFFFF, 3, origin);
    const op1 = Vec2Debug.drawPoint(debug, 0xFF0000, 2, p1, origin);
    const op2 = Vec2Debug.drawPoint(debug, 0xFFFF00, 2, p2, origin);
    const op3 = Vec2Debug.drawPoint(debug, 0x00FF77, 2, p3, origin);
    const op4 = Vec2Debug.drawPoint(debug, 0xFF7700, 2, p4, origin);
    const op5 = Vec2Debug.drawPoint(debug, 0xFF00FF, 2, p5, origin);
    const op6 = Vec2Debug.drawPoint(debug, 0xFF7700, 2, p6, origin);

    const mcx = (book.pageWidth * 2) * -book.direction.x;
    const mcy = book.pageHeight * -book.direction.y;
    const oc1 = Vec2.add({x: mcx, y: 0}, origin);
    const oc2 = Vec2.add({x: mcx , y: mcy}, origin);
    const oc3 = Vec2.add({x: 0, y: mcy}, origin);

    flipPage.rotation = Vec2.rotation(op1, op3) + ((book.direction.x > 0) ? 0 : Vec2.degreeToRadian(180));
    flipPage.x = op1.x;
    flipPage.y = op1.y;

    flipPageMask
      .beginFill(0xFF0000, 1)
      .drawPolygon((origin.x < 0 && p5.x < 0 || origin.x > 0 && p5.x > 0) ? [op1, op4, op3] : [op1, op6, op5, op3])
      .endFill();

    pagesMask
      .beginFill(0xFF0000, 1)
      .drawPolygon((origin.x < 0 && p5.x < 0 || origin.x > 0 && p5.x > 0) ? [oc1, oc2, oc3, op4, op3] : [oc1, oc2, op5, op3])
      .endFill();

    debug
      .beginFill(0xFFFFFF, 0.2)
      //    .drawPolygon([pt, oe1, oe2])
      .drawPolygon((origin.x < 0 && p5.x < 0 || origin.x > 0 && p5.x > 0) ? [op1, op4, op3] : [op1, op6, op5, op3])
      .endFill();

    //line from p1 to origin
    Vec2Debug.drawLine(debug, 0xFFFFFF, 1, 0.1, p1, {x:0, y:0}, origin);
    Vec2Debug.drawLine(debug, 0xFFFFFF, 1, 0.1, p2, p4, origin);
  })

  return book;
}


const doc = pdfjsLib.getDocument('/media/pdf/test.pdf');
async function render(pdf, book){
  for( let i =1; i<= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = book.pageWidth / page.view[2];
    const canvas = document.querySelector(`#page-${i} canvas`);
    await renderPage(page, canvas, scale);
  }
}

function getBlob(canvas){
  return new Promise((resolve, reject) =>{
    try{
      canvas.toBlob((blob)=>{
        resolve(blob);
      })
    }catch (e){
      reject(e);
    }
  })
}

async function showPage(pdf, width, height, num){
  const page =  await pdf.getPage(num);
  const scale = Math.min(width / page.view[2], height / page.view[3]);
  const canvas = document.createElement('canvas');
  await renderPage(page, canvas, scale);

  const blob = await getBlob(canvas);
  const blobUrl = await URL.createObjectURL(blob);

  return {
    view: page.view,
    scale,
    blob,
    blobUrl,
  };
}

async function getCanvasBlobURL(canvas){
  const blob = await getBlob(canvas);
  const blobURL = await URL.createObjectURL(blob);
  return { blob, blobURL }
}

async function renderPdf(pdf, w, h){
  const p1 = await showPage(pdf, w, h ,1);
  const pw = p1.view[2] * p1.scale;
  const ph = p1.view[3] * p1.scale;
  const book = initBook(pw, ph, grid, debug);

  const coverPage = PIXI.Sprite.from(p1.blobUrl);
  pages.addChild(coverPage);
  book.setPage(1, coverPage);

  pagesMask.clear();
  pagesMask.beginFill(0xFF0000, 1);
  pagesMask.drawRect(-pw, -ph * .5, pw *2, ph)
  pagesMask.endFill();

  const p2 = await showPage(pdf, w, h ,2);
  const mcPage = PIXI.Sprite.from(p2.blobUrl);
  mcPage.x = book.pageWidth;
  pages.addChild(mcPage);
  book.setPage(2, mcPage);

  for(let i = 3; i <= pdf.numPages; i++){
    const p = await showPage(pdf, w, h ,i);
    book.setPage(i, PIXI.Sprite.from(p.blobUrl));
  }
}

doc.promise.then(pdf => {
  //suggest width
  const w = window.innerWidth * 0.5 * 0.8;
  const h = window.innerHeight * 0.8;
  window.pdf = pdf;
  renderPdf(pdf, w, h).then(()=>{});
});