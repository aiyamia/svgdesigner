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
moving = false;
moving_line = false;
moving_group = false;
snapping = false;
id_target = null;

var x0,y0,p1_x0,p1_y0,p2_x0,p2_y0,dx,dy,line_to_move,group_to_move;
currentGroup = new Group()
var down_elements;
//events
// on mouse down you create the line and append it to the svg element
lines.addEventListener("mousedown", e => {
  if(draw_select==1){
    m = oMousePosSVG(e);
    p1 = new Point({x:m.x,y:m.y})
    p2 = new Point({x:m.x,y:m.y})
    
    l = new Line({p1:p1,p2:p2},lines)
    drawing = true
  }else if(draw_select==0 && !down_elements){
    hide_all_bbox()
  }
});

// on mouse move you update the line 
lines.addEventListener("mousemove", e => {
  if (drawing) {
    m = oMousePosSVG(e);
    p2.update_loc(m.x,m.y)
  }
  if (moving) {
    m = oMousePosSVG(e)
    p2.update_loc(m.x,m.y)
    currentGroup.update_bbox()
  }
  if(moving_line){
    m = oMousePosSVG(e);
    dx = m.x - x0
    dy = m.y - y0
    line_to_move.p1.update_loc(p1_x0 + dx,p1_y0 + dy)
    line_to_move.p2.update_loc(p2_x0 + dx,p2_y0 + dy)
    line_to_move.show_bbox()
    currentGroup.update_bbox()
  }
  if(moving_group){
    m = oMousePosSVG(e);
    dx = m.x - x0
    dy = m.y - y0
    group_to_move.moveChildren(dx,dy)
    group_to_move.update_bbox()
  }
});
// on mouse up or mouse out the line ends here and you "empty" the eLine and oLine to be able to draw a new line
lines.addEventListener("mouseup", e => {
  if (drawing || moving) {
    drawing = false;
    moving = false;
  }
  if(moving_line){
    moving_line = false
  }
  if(moving_group){
    moving_group = false;
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