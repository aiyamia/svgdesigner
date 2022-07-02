const SVG_NS = "http://www.w3.org/2000/svg";
var svg = document.querySelector("#lines");
const svg_rect = svg.getBoundingClientRect();
//下方两个相等由svg的css中设置box-sizing: border-box保证，
//参见https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
const svg_width = svg_rect.width; 
const svg_height = svg_rect.height; 
// const defs = document.createElementNS(SVG_NS, "defs");
// const glow_filter = document.createElementNS(SVG_NS, "filter");
// glow_filter.setAttribute('id', 'glow');
// const colorMatrix = document.createElementNS(SVG_NS, "feColorMatrix");
// colorMatrix.setAttribute("type","matrix");
// colorMatrix.setAttribute(
//   "values","0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0.7 0");
// const gaussianBlur = document.createElementNS(SVG_NS, "feGaussianBlur");
// gaussianBlur.setAttribute("result","coloredBlur");
// gaussianBlur.setAttribute("stdDeviation","1");
// const merge = document.createElementNS(SVG_NS, "feMerge");
// const mergeNode1 = document.createElementNS(SVG_NS, "feMergeNode");
// mergeNode1.setAttribute("in","coloredBlur");
// const mergeNode2 = document.createElementNS(SVG_NS, "feMergeNode");
// mergeNode2.setAttribute("in","SourceGraphic");
// merge.appendChild(mergeNode1);
// merge.appendChild(mergeNode2);
// glow_filter.appendChild(colorMatrix)
// glow_filter.appendChild(gaussianBlur)
// glow_filter.appendChild(merge)
// defs.appendChild(glow_filter);

// svg.appendChild(defs);  




m = {};// the mouse position
drawing = false;
selecting = false;
moving_group = false;
rotting_group = false;
snapping = false;
id_target = null;

var x0,y0,p1_x0,p1_y0,p2_x0,p2_y0,dx,dy;
var group_to_move;

var snap_angles_in_deg=new Set([]);
var snap_angle_in_deg;
const err_range_angles_in_deg = 10;
var currentGroup = new Group()
var groupRotPoint = new Point({x:100,y:100,color:'orange',size:10})
var rot_relevent_lines_in_group={};
var info_line = document.createElementNS(SVG_NS, "path");
info_line.setAttribute('d', `M 0 0 L 500 500`);
info_line.setAttribute('stroke-width', '1');
info_line.setAttribute("stroke-dasharray","2,2");
info_line.setAttribute('stroke', 'green');
info_line.setAttribute('fill', "transparent");

var dtheta_in_deg_to_snap = null;

var down_elements;
var l;
var select_frame_element = document.createElementNS(SVG_NS,'rect')
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

//用来存放历史状态的变量
var arPoints;
var arLines;
var arGroups;
var arBeziers;
var arSvg;
var arGroupRotPoint;



//events
// on mouse down you create the line and append it to the svg element
lines.addEventListener("mousedown", e => {
  setArchive()
  if(draw_select==1){
    m = oMousePosSVG(e);
    p1 = new Point({x:m.x,y:m.y})
    p2 = new Point({x:m.x,y:m.y})
    if(l){
      l0 = l
    }
    
    l = new Line({p1:p1,p2:p2},lines)
    drawing = true
    if(e.ctrlKey && l0){
      b = new Bezier({line1:l0,line2:l})
      b.show_bbox()
    }
    
  }else if(draw_select==0){
    // console.log(`draw.js mousedown`);
    if(!down_elements){
      hide_all_bbox()
      if(Object.keys(currentGroup.children).length==1 && currentGroup.children[Object.keys(currentGroup.children)[0]].constructor.name=="Group"){
        if(currentGroup.children[Object.keys(currentGroup.children)[0]].bezier){
          currentGroup.children[Object.keys(currentGroup.children)[0]].bezier.hide_control_widgets()
        }
      }
      currentGroup.children = {}
      selecting = true
      m = oMousePosSVG(e);
      x0 = m.x
      y0 = m.y

      currentGroup.element_b.setAttribute('pointer-events','initial')
    }else{
      if(e.altKey && groupRotPoint.groupRotSnapPoint){
        // degree_cum = 0
        snap_angles_in_deg.clear();
        rot_relevent_lines_in_group = {};
        let rot_relevent_lines = groupRotPoint.groupRotSnapPoint.line
        
        for (let i_line in rot_relevent_lines){
          let rot_relevent_line = rot_relevent_lines[i_line];
          if(!(group_to_move.contains(rot_relevent_line))){
            
            snap_angles_in_deg.add(rot_relevent_line.angle_in_deg)

          }else{
            rot_relevent_lines_in_group[i_line] = rot_relevent_line;
          }
        }
      }
    }
  }
});

// on mouse move you update the line 
lines.addEventListener("mousemove", e => {
  if (drawing) {
    m = oMousePosSVG(e);
    p2.moveTo(m.x,m.y)
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
    if(e.altKey){
      //旋转
      m = oMousePosSVG(e);
      let lx = m.x - groupRotPoint.x
      let ly = m.y - groupRotPoint.y
      let theta_in_deg = Math.atan2(ly,lx) * (180/Math.PI)
      let lx0 = x0 - groupRotPoint.x
      let ly0 = y0 - groupRotPoint.y
      let theta0_in_deg = Math.atan2(ly0,lx0) * (180/Math.PI)
      let dtheta_in_deg = theta_in_deg - theta0_in_deg;

      
      x0 = m.x
      y0 = m.y

      if(groupRotPoint.groupRotSnapPoint){
        snap_angles_in_deg_array = Array.from(snap_angles_in_deg)
        let stop_loop = false
        for(let i_line in rot_relevent_lines_in_group){
          let rot_relevent_line_in_group = rot_relevent_lines_in_group[i_line];
          for(let i_angle in snap_angles_in_deg_array){
            snap_angle_in_deg = snap_angles_in_deg_array[i_angle];
            let dtheta_ini = snap_angle_in_deg - rot_relevent_line_in_group.angle_in_deg
            let dtheta1_in_deg_for_judge = dtheta_ini
            // let dtheta2_in_deg_for_judge = Math.abs(dtheta_ini)-180
            let dtheta2_in_deg_for_judge = dtheta_ini - Math.sign(snap_angle_in_deg) * 180
            let condition1 = Math.abs(dtheta1_in_deg_for_judge) < err_range_angles_in_deg
            let condition2 = Math.abs(dtheta2_in_deg_for_judge) < err_range_angles_in_deg
            
            if( condition1 || condition2){
              dtheta_in_deg_to_snap = condition1 ? dtheta1_in_deg_for_judge : dtheta2_in_deg_for_judge

              info_line.setAttribute('d',
              `M 
              0 
              ${groupRotPoint.y - groupRotPoint.x * Math.tan(snap_angle_in_deg * (Math.PI/180))} 
              L 
              ${svg_width} 
              ${groupRotPoint.y + (svg_width - groupRotPoint.x) * Math.tan(snap_angle_in_deg * (Math.PI/180))}`)
              
              svg.prepend(info_line)
              info_line.setAttribute('visibility','visible')

              stop_loop = true;
              break;
            }else{
              info_line.setAttribute('visibility','hidden')
              dtheta_in_deg_to_snap = null
            }
          }
          
          if(stop_loop){
            break;
          }
        }
      }
      // degree_cum += dtheta_in_deg
      
      // if(dtheta_in_deg_to_snap){
      //   snap_degree_cum += dtheta_in_deg
      //   console.log(`snap_degree_cum：${snap_degree_cum}`);
      //   if(Math.abs(snap_degree_cum)>1){
      //     group_to_move.rotChildren(dtheta_in_deg)
      //     console.log(`动！`);
      //   }else{
      //     console.log(`不动`);
      //   }
      // }else{
      //   snap_degree_cum = 0
        
      // }
      group_to_move.rotChildren(dtheta_in_deg)
    }else{
      if(groupRotPoint.groupRotSnapPoint){
        // console.log(`groupRotPoint.groupRotSnapPoint`);
        if(group_to_move.contains(groupRotPoint.groupRotSnapPoint)||group_to_move.contains(groupRotPoint)){
          // console.log(`动了`);
          groupRotPoint.groupRotSnapPoint = null
        }
      }
      
      m = oMousePosSVG(e);
      dx = m.x - x0
      dy = m.y - y0
      x0 = m.x
      y0 = m.y
      group_to_move.moveChildren(dx,dy)
    }
    hide_all_bbox()
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
    if(e.altKey && groupRotPoint.groupRotSnapPoint){
      if(dtheta_in_deg_to_snap){
        // console.log(`snap啦！自动吸附${dtheta_in_deg_to_snap}°`);
        if(e.shiftKey){
          group_to_move.rotChildren(dtheta_in_deg_to_snap)
        }
        info_line.setAttribute('visibility','hidden')
        dtheta_in_deg_to_snap = null;
      }
    }
    moving_group = false;
    currentGroup.update_bbox()
    currentGroup.show_bbox()//保证线也全显示选框
  }
  if(selecting){
    m = oMousePosSVG(e);
    selecting = false;
    select_frame_element.setAttribute('visibility', 'hidden');
    for(let i_p in Point.list){
      let p = Point.list[i_p]
      if(p.id != groupRotPoint.id){
        if((p.x-x0)*(p.x-m.x)<0 && (p.y-y0)*(p.y-m.y)<0){
          currentGroup.addChild(p)
        }
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
  if(e.key=="Delete"){
    currentGroup.delete()
  }
  if (e.ctrlKey || e.metaKey) {
    
    if(e.shiftKey){
      switch (e.key.toLowerCase()) {
        case 's':
            e.preventDefault();
            alert('ctrl-shift-s');
            break;
        case 'f':
            e.preventDefault();
             alert('ctrl-shift-f');
            break;
        case 'g':
            e.preventDefault();
            deConfirmGroup();
            break;
    }
    }else{
      switch (e.key.toLowerCase()) {
        case 's':
            e.preventDefault();
            alert('ctrl-s');
            break;
        case 'z':
            e.preventDefault();
            getArchive()
            break;
        case 'g':
            e.preventDefault();
            confirmGroup();
            break;
      }
    }
  }
})


function confirmGroup() {
  if(Object.keys(currentGroup.children).length>1){
    console.log(`打组`);
    currentGroup = new Group()
  }
}

function deConfirmGroup() {
  if(Object.keys(currentGroup.children).length==1 
  && currentGroup.children[Object.keys(currentGroup.children)[0]].constructor.name=="Group"
  && !currentGroup.children[Object.keys(currentGroup.children)[0]].bezier){
    console.log(`解组`);
    let group_to_de = currentGroup.children[Object.keys(currentGroup.children)[0]]
    group_to_de.element_b.remove()
    
    for(let i_child in group_to_de.children){
      group_to_de.children[i_child].show_bbox()
    }
    currentGroup.children = group_to_de.children
    currentGroup.update_bbox()
    
    delete Group.list[group_to_de.id]
  }
}



function generateBboxElement(element){
  let rectBBox = document.createElementNS(SVG_NS, "rect");
  rectBBox.setAttribute("stroke","black");
  rectBBox.setAttribute("stroke-width","1");
  rectBBox.setAttribute("fill","none");
  rectBBox.setAttribute("stroke-dasharray","2,2");
  let bbox = element.getBBox();
  let pad = 10
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
  let pad = 10
  let w =  2*pad+bbox.width
  let h =  2*pad+bbox.height
  rectBBox.setAttribute('x', bbox.x-pad);
  rectBBox.setAttribute('y', bbox.y-pad);

  rectBBox.setAttribute('width', w);
  rectBBox.setAttribute('height', h);
  // rectBBox.setAttribute('visibility', 'visible');
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

function setArchive() {
  // arPoints = {...Point.list}
  // arLines = {...Line.list}
  // arGroups = {...Group.list}
  // arBeziers = {...Bezier.list}
  // arSvg = $("#lines").clone(true,true)
  // arGroupRotPoint = Object.assign(new Point({x:0,y:0}), groupRotPoint)

  localStorage.setItem("arPoints", Point.list)
  localStorage.setItem("arLines", Line.list)
  localStorage.setItem("arGroups", Group.list)
  localStorage.setItem("arBeziers", Bezier.list)
  localStorage.setItem("arSvg", svg) //$("#lines").clone(true,true)
  localStorage.setItem("arGroupRotPoint", groupRotPoint)
}
function getArchive() {
  Point.list = localStorage.getItem("arPoints")
  Line.list = localStorage.getItem("arLines")
  Group.list = localStorage.getItem("arGroups")
  Bezier.list = localStorage.getItem("arBeziers")
  groupRotPoint = localStorage.getItem("arGroupRotPoint")
  let svg_stored = localStorage.getItem("arSvg")
  let svg_parent = svg.parentNode
  // svg_parent.removeChild(svg)
  svg_parent.appendChild(svg_stored)
}


// function union(...sets) {
//   return new Set([].concat(...sets.map(set => [...set])));
// }

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