const SVG_NS = "http://www.w3.org/2000/svg";
let svg = document.querySelector("#lines");
var defs = document.createElementNS(SVG_NS, "defs");
let glow_filter = document.createElementNS(SVG_NS, "filter");
glow_filter.setAttribute('id', 'glow');
let colorMatrix = document.createElementNS(SVG_NS, "feColorMatrix");
colorMatrix.setAttribute("type","matrix");
colorMatrix.setAttribute(
  "values","0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0.7 0");
let gaussianBlur = document.createElementNS(SVG_NS, "feGaussianBlur");
gaussianBlur.setAttribute("result","coloredBlur");
gaussianBlur.setAttribute("stdDeviation","1");
let merge = document.createElementNS(SVG_NS, "feMerge");
let mergeNode1 = document.createElementNS(SVG_NS, "feMergeNode");
mergeNode1.setAttribute("in","coloredBlur");
let mergeNode2 = document.createElementNS(SVG_NS, "feMergeNode");
mergeNode2.setAttribute("in","SourceGraphic");
merge.appendChild(mergeNode1);
merge.appendChild(mergeNode2);
glow_filter.appendChild(colorMatrix)
glow_filter.appendChild(gaussianBlur)
glow_filter.appendChild(merge)
defs.appendChild(glow_filter);

svg.appendChild(defs);  

function union(...sets) {
  return new Set([].concat(...sets.map(set => [...set])));
}


m = {};// the mouse position
drawing = false;
selecting = false;
moving_group = false;
snapping = false;
id_target = null;

var x0,y0,p1_x0,p1_y0,p2_x0,p2_y0,dx,dy;
var group_to_move;
var select_frame_element;
currentGroup = new Group()
var down_elements;

select_frame_element=document.createElementNS(SVG_NS,'rect')
svg.appendChild(select_frame_element)
select_frame_element.setAttribute('id','select_frame')
select_frame_element.setAttribute("stroke","black");
select_frame_element.setAttribute("stroke-width","1");
select_frame_element.setAttribute("fill","none");
select_frame_element.setAttribute("stroke-dasharray","2,2");

select_frame_element.setAttribute('x', 0);
select_frame_element.setAttribute('y', 0);

select_frame_element.setAttribute('width', 5);
select_frame_element.setAttribute('height', 5);
select_frame_element.setAttribute('visibility', 'hidden');

//events
// on mouse down you create the line and append it to the svg element
lines.addEventListener("mousedown", e => {
  if(draw_select==1){
    m = oMousePosSVG(e);
    p1 = new Point({x:m.x,y:m.y})
    p2 = new Point({x:m.x,y:m.y})
    
    l = new Line({p1:p1,p2:p2},lines)
    drawing = true
  }else if(draw_select==0){
    // console.log(`draw.js mousedown`);
    if(!down_elements){
      hide_all_bbox()
      currentGroup.children = {}
      selecting = true
      m = oMousePosSVG(e);
      x0 = m.x
      y0 = m.y
      currentGroup.element_b.setAttribute('pointer-events','initial')
    }
  }
});

// on mouse move you update the line 
lines.addEventListener("mousemove", e => {
  if (drawing) {
    m = oMousePosSVG(e);
    p2.update_loc(m.x,m.y)
  }
  if (selecting) {
    m = oMousePosSVG(e);
    select_frame_element.setAttribute('x', Math.min(x0,m.x));
    select_frame_element.setAttribute('y', Math.min(y0,m.y));
    select_frame_element.setAttribute('width', Math.abs(m.x-x0));
    select_frame_element.setAttribute('height', Math.abs(m.y-y0));
    select_frame_element.setAttribute('visibility', 'visible');
  }
  if(moving_group){
    m = oMousePosSVG(e);
    dx = m.x - x0
    dy = m.y - y0
    x0 = m.x
    y0 = m.y
    group_to_move.moveChildren(dx,dy)
    group_to_move.update_bbox()
    group_to_move.show_bbox()//保证线也全显示选框
  }
});
// on mouse up or mouse out the line ends here and you "empty" the eLine and oLine to be able to draw a new line
lines.addEventListener("mouseup", e => {
  
  down_elements = false
  if (drawing) {
    drawing = false;
  }
  if (moving_group) {
    // console.log(`draw.js  mouseup`);
    moving_group = false;
  }
  if(selecting){
    m = oMousePosSVG(e);
    selecting = false;
    select_frame_element.setAttribute('visibility', 'hidden');
    for(let i_p in Point.list){
      let p = Point.list[i_p]
      if((p.x-x0)*(p.x-m.x)<0 && (p.y-y0)*(p.y-m.y)<0){
        currentGroup.addChild(p)
      }
    }
    for(let i_l in Line.list){
      let l = Line.list[i_l]
      if((l.p1.x-x0)*(l.p1.x-m.x)<0 && (l.p1.y-y0)*(l.p1.y-m.y)<0 && (l.p2.x-x0)*(l.p2.x-m.x)<0 && (l.p2.y-y0)*(l.p2.y-m.y)<0){
        currentGroup.addChild(l)
      }
    }
    let selected_item = Object.keys(currentGroup.children)
    if(selected_item.length!=0){
      currentGroup.show_bbox()
      // console.log(`你选中了${selected_item}`);
      currentGroup.element_b.setAttribute('pointer-events','all')
    }
  }
});

document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
        case 's':
            e.preventDefault();
            alert('ctrl-s');
            break;
        case 'f':
            e.preventDefault();
             alert('ctrl-f');
            break;
        case 'g':
            e.preventDefault();
            confirmGroup();
            break;
    }
  }
})


function confirmGroup() {
  console.log(`打组`);
  currentGroup = new Group()
}



function generateBboxElement(element){
  let rectBBox = document.createElementNS(SVG_NS, "rect");
  rectBBox.setAttribute("stroke","black");
  rectBBox.setAttribute("stroke-width","1");
  rectBBox.setAttribute("fill","none");
  rectBBox.setAttribute("stroke-dasharray","2,2");
  let bbox = element.getBBox();
  let pad = 5
  let w =  2*pad+bbox.width
  let h =  2*pad+bbox.height
  rectBBox.setAttribute('x', bbox.x-pad);
  rectBBox.setAttribute('y', bbox.y-pad);

  rectBBox.setAttribute('width', w);
  rectBBox.setAttribute('height', h);
  rectBBox.setAttribute('visibility', 'hidden');
  return rectBBox
}
function updateBboxElement(rectBBox,element){
  let bbox = element.getBBox();
  let pad = 5
  let w =  2*pad+bbox.width
  let h =  2*pad+bbox.height
  rectBBox.setAttribute('x', bbox.x-pad);
  rectBBox.setAttribute('y', bbox.y-pad);

  rectBBox.setAttribute('width', w);
  rectBBox.setAttribute('height', h);
  rectBBox.setAttribute('visibility', 'visible');
  return rectBBox
}

function hide_all_bbox() {
  let bbox_els = document.getElementsByClassName('bbox')
  for(let i_el=0;i_el<bbox_els.length;i_el++){
    bbox_els[i_el].setAttribute('visibility','hidden')
  }
}
// a function to detect the mouse position on a resizable SVG element
function oMousePosSVG(ev) {
  var p = svg.createSVGPoint();
  p.x = ev.clientX;
  p.y = ev.clientY;
  var ctm = svg.getScreenCTM().inverse();
  var p = p.matrixTransform(ctm);
  return p;
}

// lines.addEventListener("mouseout", e => {
//   if (eLine) {
//     m = oMousePosSVG(e);
//     eLine = null;
//     oLine = {};
//   }
// });


// a function to draw a line in SVG
// function drawline(o, parent) {
//   let line = document.createElementNS(SVG_NS, "line");
//   for (var name in o) {
//     if (o.hasOwnProperty(name)) {
//       line.setAttributeNS(null, name, o[name]);
//     }
//   }
//   parent.appendChild(line);
//   return line;
// }