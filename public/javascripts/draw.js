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

var myData_plain;

var myData={
  Point:{
    max_id:0,
    list:{}
  },
  Line:{
    max_id:0,
    list:{}
  },
  Group:{
    max_id:0,
    list:{}
  },
  Bezier:{
    max_id:0,
    list:{}
  },
  GroupRotPoint:null,
  CurrentGroup:null
}

function regenerate(myData_plain) {
  svg.replaceChildren()
  select_frame_element = document.createElementNS(SVG_NS,'rect')
  svg.appendChild(select_frame_element)
  select_frame_element.setAttribute('id','select_frame')
  select_frame_element.setAttribute("stroke",box_color);
  select_frame_element.setAttribute("stroke-width","1");
  select_frame_element.setAttribute("fill","none");
  select_frame_element.setAttribute("stroke-dasharray","2,2");

  select_frame_element.setAttribute('x', 0);
  select_frame_element.setAttribute('y', 0);

  select_frame_element.setAttribute('width', 5);
  select_frame_element.setAttribute('height', 5);
  select_frame_element.setAttribute('visibility', 'hidden');
  myData={
    Point:{
      max_id:0,
      list:{}
    },
    Line:{
      max_id:0,
      list:{}
    },
    Group:{
      max_id:0,
      list:{}
    },
    Bezier:{
      max_id:0,
      list:{}
    },
    GroupRotPoint:null,
    CurrentGroup:null
  };

  groupRotPoint = null
  myData.Point.max_id = myData_plain.Point.max_id;
  for (let i_point_plain in myData_plain.Point.list) {
    myData.Point.list[i_point_plain] = new Point(myData_plain.Point.list[i_point_plain],true);
  }
  groupRotPoint = myData.Point.list[myData_plain.GroupRotPoint]
  myData.GroupRotPoint = myData_plain.GroupRotPoint;

  if(!myData_plain.GroupRotPoint){
    console.log(`myData_plain.GroupRotPoint = ${myData_plain.GroupRotPoint}`);
    console.log(groupRotPoint);
  }
  myData.Line.max_id = myData_plain.Line.max_id;
  for (let i_line_plain in myData_plain.Line.list) {
    myData.Line.list[i_line_plain] = new Line(myData_plain.Line.list[i_line_plain],true);
    // myData.Line.list[i_line_plain].update_bbox()
  }

  myData.Bezier.max_id = myData_plain.Bezier.max_id;
  for (let i_bezier_plain in myData_plain.Bezier.list) {
    myData.Bezier.list[i_bezier_plain] = new Bezier(myData_plain.Bezier.list[i_bezier_plain],true);
    // myData.Bezier.list[i_bezier_plain].update_bbox()
  }

  myData.Group.max_id = myData_plain.Group.max_id;
  for (let i_group_plain in myData_plain.Group.list) {
    myData.Group.list[i_group_plain] = new Group(myData_plain.Group.list[i_group_plain],true);
    // myData.Group.list[i_group_plain].update_bbox();
  }

  currentGroup = myData.Group.list[myData_plain.CurrentGroup]
  myData.CurrentGroup = myData_plain.CurrentGroup;


  for (let i_line_plain in myData_plain.Line.list) {
    myData.Line.list[i_line_plain].update_bbox()
  }
  for (let i_bezier_plain in myData_plain.Bezier.list) {
    myData.Bezier.list[i_bezier_plain].update_bbox()
  }
  for (let i_group_plain in myData_plain.Group.list) {
    myData.Group.list[i_group_plain].update_bbox();
  }
  //让旋转中心点保持在最前面，方便点取。
  svg.appendChild(groupRotPoint.element_g)
}


var head=-1;
var last_id=-1;
var maxLength_archive = 10;
var archive=[];

function undo() {
  console.log('撤销');
  if(archive.length<2){
    // alert('初始状态，不能撤销')
    showSnackbar('初始状态，不能撤销')
  }else if(head==0){
    // alert('已到最前，不能撤销')
    showSnackbar('已到最前，不能撤销')
  }else{
    head -= 1
    regenerate(archive[head]);
  }
}

function redo() {
  console.log('重做');
  if(archive.length<2){
    // alert('初始状态，不能重做')
    showSnackbar('初始状态，不能重做')
  }else if(head == last_id){
    // alert('已到最后，不能重做')
    showSnackbar('已到最后，不能重做')
  }else{
    head += 1
    regenerate(archive[head]);
  }
}

function setArchive() {
  if(!myData.GroupRotPoint || !myData.CurrentGroup ){
    console.log(myData);
  }
  // console.log(`存档`);
  if(head == last_id){
    if(last_id != maxLength_archive-1){
      archive[++head] = JSON.parse(JSON.stringify(myData))
      last_id++
    }else{
      for(let i=0;i<last_id;i++){
        archive[i] = archive[i+1]
      }
      archive[last_id] = JSON.parse(JSON.stringify(myData))
    }
  }else{
    archive[++head] = JSON.parse(JSON.stringify(myData))
    last_id = head
  }
}


m = {};// the mouse position
var draw_select = 0;
var day_night = 0;
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
myData.CurrentGroup = currentGroup.id;
var groupRotPoint = new Point({x:100,y:100,color:'orange',size:10})
myData.GroupRotPoint = groupRotPoint.id;
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
select_frame_element.setAttribute("stroke",box_color);
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
    if(l){
      l0 = l
    }
    
    l = new Line({p1:p1,p2:p2})
    drawing = true
    if(e.ctrlKey && l0){
      b = new Bezier({line1:l0,line2:l})
    }
    
  }else if(draw_select==0){
    // console.log(e.target);
    // console.log(e.target.getAttribute('class') && e.target.getAttribute('class').split(' ').includes('pointlistener'));
    if(e.target.getAttribute('class')){
      let target_class = e.target.getAttribute('class').split(' ');
      if(target_class.includes('pointlistener') || target_class.includes('linelistener') || target_class.includes('bezierlistener') || target_class.includes('grouplistener')){
        currentGroup.mousedown_event(e)
      }
    }
    // console.log(`draw.js mousedown`);
    
    if(!down_elements){
      hide_all_bbox()
      for(let i_b in myData.Bezier.list){
        myData.Bezier.list[i_b].hide_control_widgets()
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
        let rot_relevent_lines = myData.Point.list[groupRotPoint.groupRotSnapPoint].line
        
        for (let i_line in rot_relevent_lines){
          let rot_relevent_line = myData.Line.list[i_line];
          if(!(group_to_move.contains(rot_relevent_line.type_id))){
            
            snap_angles_in_deg.add(rot_relevent_line.angle_in_deg)

          }else{
            rot_relevent_lines_in_group[i_line] = null;
          }
        }
      }
      if(e.ctrlKey){
        duplicate()
        //Thanks to https://stackoverflow.com/a/49122553
        Object.defineProperty(e, 'target', {writable: false, value: currentGroup.element_b});
        currentGroup.mousedown_event(e)
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
  if(draw_select==0){
    if(e.target.getAttribute('class') && e.target.getAttribute('class').split(' ').includes('pointlistener')){
        currentGroup.mousemove_event(e)
    }
  }
  if (selecting) {
    m = oMousePosSVG(e);
    select_frame_element.setAttribute('x', Math.min(x0,m.x));
    select_frame_element.setAttribute('y', Math.min(y0,m.y));
    select_frame_element.setAttribute('width', Math.abs(m.x-x0));
    select_frame_element.setAttribute('height', Math.abs(m.y-y0));
    select_frame_element.setAttribute('visibility', 'visible');
    select_frame_element.setAttribute('stroke', box_color);
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
          let rot_relevent_line_in_group = myData.Line.list[i_line];
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
      m = oMousePosSVG(e);
      dx = m.x - x0
      dy = m.y - y0
      if(Math.abs(dx)>0||Math.abs(dy)>0){
        // console.log(`dx = ${dx};dy = ${dy}`);
        if(groupRotPoint.groupRotSnapPoint){
          // console.log(`groupRotPoint.groupRotSnapPoint`);
          if(group_to_move.contains(`Point${groupRotPoint.groupRotSnapPoint}`)||group_to_move.contains(groupRotPoint.type_id)){
            // console.log(`动了`);
            groupRotPoint.groupRotSnapPoint = null
          }
        }
        x0 = m.x
        y0 = m.y
        group_to_move.moveChildren(dx,dy)
      }else{
        // console.log(`没动`);
      }
    }
    hide_all_bbox()
  }
});
// on mouse up or mouse out the line ends here and you "empty" the eLine and oLine to be able to draw a new line
lines.addEventListener("mouseup", e => {
  
  if(draw_select==0){
    if(e.target.getAttribute('class') && e.target.getAttribute('class').split(' ').includes('pointlistener')){
      currentGroup.mouseup_event(e)
    }
  }
  down_elements = false
  if (drawing) {
    if(e.ctrlKey && l0){
      myData.Group.list[b.parentGroup].update_bbox()
      // console.log();
    }
    setArchive()
    drawing = false;
  }
  if (moving_group) {
    setArchive()
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
    let group_in_selection = []
    let p;
    for(i_group in myData.Group.list){
      if (i_group != currentGroup.id) {
        let group = myData.Group.list[i_group]
        let group_selected = true;
        for(let i_p in group.getMovePoints()){
          p = myData.Point.list[i_p]
          if(isVisible(p.element_g) && p.id != groupRotPoint.id){
            if(!((p.x-x0)*(p.x-m.x)<0 && (p.y-y0)*(p.y-m.y)<0)){
              group_selected = false;
              break;
            }
          }
        }
        if (group_selected) {
          currentGroup.addChild(group,false)
          group_in_selection.push(`${group.id}`)
          // console.log(`选中了组${group.id}`);
        }
      }
    }
    for(let i_p in myData.Point.list){
      p = myData.Point.list[i_p]
      if(isVisible(p.element_g) && p.id != groupRotPoint.id){
        if((p.x-x0)*(p.x-m.x)<0 && (p.y-y0)*(p.y-m.y)<0){
          if(Object.keys(p.parentGroup).filter(x => group_in_selection.includes(x)).length==0){
            currentGroup.addChild(p,false)
            // console.log(`选中了点${p.id}`);
          }
        }
      }
    }
    for(let i_l in myData.Line.list){
      let l = myData.Line.list[i_l]
      if (isVisible(l.element_g)) {
        let l_p1 = myData.Point.list[l.p1]
        let l_p2 = myData.Point.list[l.p2]
        if((l_p1.x-x0)*(l_p1.x-m.x)<0 && (l_p1.y-y0)*(l_p1.y-m.y)<0 && (l_p2.x-x0)*(l_p2.x-m.x)<0 && (l_p2.y-y0)*(l_p2.y-m.y)<0){
          if(Object.keys(l.parentGroup).filter(x => group_in_selection.includes(x)).length==0){
            currentGroup.addChild(l,false)
            // console.log(`选中了线${l.id}`);
          }
        }
      }
    }
    let selected_item = Object.keys(currentGroup.children)
    if(selected_item.length!=0){
      currentGroup.update_bbox()
      currentGroup.show_bbox()
      // console.log(`你选中了${selected_item}`);
      currentGroup.element_b.setAttribute('pointer-events','all')
    }
    
  }
});

document.addEventListener("keydown", e => {
  if (e.key=="z") {
    draw_select = 1
  }
  if(e.key=="Delete"){
    currentGroup.delete()
  }
  if (e.ctrlKey || e.metaKey) {
    if(e.shiftKey){
      switch (e.key.toLowerCase()) {
        case 'g':
            e.preventDefault();
            deConfirmGroup();
            setArchive();
            break;
    }
    }else{
      switch (e.key.toLowerCase()) {
        case 'y':
            e.preventDefault();
            redo()
            break;
        case 'u':
            e.preventDefault();
            undo()
            break;
        case 'g':
            e.preventDefault();
            confirmGroup();
            setArchive();
            break;
      }
    }
  }
})

document.addEventListener("keyup", e => {
  if (e.key=="z") {
    draw_select = 0
  }
})
setArchive()

function confirmGroup() {
  if(Object.keys(currentGroup.children).length>1){
    console.log(`打组`);
    currentGroup = new Group()
    myData.CurrentGroup = currentGroup.id;
  }
}

function deConfirmGroup() {
  if(Object.keys(currentGroup.children).length==1 
  && Object.keys(currentGroup.children)[0].includes("Group")){
    let this_g = getObj(Object.keys(currentGroup.children)[0]);
    if (!this_g.bezier){
      console.log(`解组`);
      let group_to_de = this_g;
      group_to_de.element_b.remove()
      
      for(let i_child in group_to_de.children){
        getObj(i_child).show_bbox()
      }
      currentGroup.children = group_to_de.children
      currentGroup.update_bbox()
      
      delete myData.Group.list[group_to_de.id]
    }
  }
}



function generateBboxElement(element){
  let rectBBox = document.createElementNS(SVG_NS, "rect");
  rectBBox.setAttribute("stroke",box_color);
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

function updateBboxElement(rectBBox,element,compact=false){
  let bbox = element.getBBox();
  let pad;
  if (compact) {
    pad = 0
  } else {
    pad = 10
  }
  
  let w =  2*pad+bbox.width
  let h =  2*pad+bbox.height
  rectBBox.setAttribute('x', bbox.x-pad);
  rectBBox.setAttribute('y', bbox.y-pad);

  rectBBox.setAttribute('width', w);
  rectBBox.setAttribute('height', h);
  rectBBox.setAttribute('stroke', box_color);
  // rectBBox.setAttribute('visibility', 'visible');
  return rectBBox
}

function hide_all_bbox() {
  let bbox_els = document.getElementsByClassName('bbox')
  for(let i_el=0;i_el<bbox_els.length;i_el++){
    bbox_els[i_el].setAttribute('visibility','hidden')
  }
  for(let i_group in myData.Group.list){
    myData.Group.list[i_group].deHighlight_children()
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

function getObj(this_type_id) {
  let [targetObj_type,targetObj_id] = this_type_id.split(/(?<=[^\d])(?=\d)/);
  return myData[targetObj_type].list[targetObj_id];
}


function showSnackbar(contents) {
  var x = document.getElementById("snackbar");
  x.textContent = contents
  // setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
  x.classList.add('show')
  setTimeout(function(){ x.classList.remove('show'); }, 2000);
}


function duplicate(){
  myData_plain = JSON.parse(JSON.stringify(myData));
  let myData_plain_origin = myData_plain;
  let max_id_obj = {}
  max_id_obj["Point"] = myData_plain_origin.Point.max_id;
  max_id_obj["Line"] = myData_plain_origin.Line.max_id;
  max_id_obj["Bezier"] = myData_plain_origin.Bezier.max_id;
  max_id_obj["Group"] = myData_plain_origin.Group.max_id;
  
  duplet(currentGroup, max_id_obj, myData_plain_origin, myData_plain)

  myData_plain.Line.max_id = myData_plain_origin.Line.max_id * 2
  myData_plain.Point.max_id = myData_plain_origin.Point.max_id * 2
  myData_plain.Bezier.max_id = myData_plain_origin.Bezier.max_id * 2
  myData_plain.Group.max_id = myData_plain_origin.Group.max_id * 2

  
  regenerate(myData_plain)
  currentGroup.show_bbox()
  setArchive();
}

function duplet(target_group, max_id_obj, myData_plain_origin, myData_plain) {
  let max_id_point = max_id_obj["Point"]
  let max_id_line = max_id_obj["Line"]
  let max_id_bezier = max_id_obj["Bezier"]
  let max_id_group = max_id_obj["Group"]

  let iscurrentGroup = (target_group.id == currentGroup.id)
  let id_old_group;
  let id_new_group;
  if (!iscurrentGroup) {
    id_old_group = target_group.id
    id_new_group = id_old_group + max_id_group
    if (!myData_plain.Group.list.hasOwnProperty(id_new_group)) {
      myData_plain.Group.list[id_new_group] = _.cloneDeep(myData_plain_origin.Group.list[id_old_group])
      myData_plain.Group.list[id_new_group].id = id_new_group
      myData_plain.Group.list[id_new_group].type_id = `Group${id_new_group}`
    }
  }

  let children_old = {...target_group.children};
  // console.log(`children_old`);
  // console.log(children_old);
  let children_new = {};
  for(let i_child in children_old){
    let [type,id_old] = i_child.split(/(?<=[^\d])(?=\d)/)
    id_old = parseInt(id_old)
    let id_new;
    switch (type) {
      case 'Point':
        break;
      case 'Line':
        //self: Line
        id_new = id_old + max_id_line
        children_new[`Line${id_new}`] = null
        if (!myData_plain.Line.list.hasOwnProperty(id_new)) {
          myData_plain.Line.list[id_new] = _.cloneDeep(myData_plain_origin.Line.list[id_old])
          myData_plain.Line.list[id_new].id = id_new
          myData_plain.Line.list[id_new].type_id = `Line${id_new}`
        }
        if (!iscurrentGroup) {
          delete myData_plain.Line.list[id_new].parentGroup[id_old_group] //parentGroup
          myData_plain.Line.list[id_new].parentGroup[id_new_group] = null
        }

        //Point
        
        p1_old = myData_plain_origin.Line.list[id_old].p1;
        p2_old = myData_plain_origin.Line.list[id_old].p2;
        p1_new = p1_old + max_id_point
        p2_new = p2_old + max_id_point
        if (!myData_plain.Point.list.hasOwnProperty(p1_new)) {
          myData_plain.Point.list[p1_new] = _.cloneDeep(myData_plain_origin.Point.list[p1_old])
          myData_plain.Point.list[p1_new].id = p1_new
          myData_plain.Point.list[p1_new].type_id = `Point${p1_new}`
        }
        delete myData_plain.Point.list[p1_new].line[id_old];
        myData_plain.Point.list[p1_new].line[id_new] = null;
        children_new[`Point${p1_new}`] = null //target_group
        myData_plain.Line.list[id_new].p1 = p1_new //self: Line
       
        
        if (!iscurrentGroup) {
          delete myData_plain.Point.list[p1_new].parentGroup[id_old_group] //parentGroup
          myData_plain.Point.list[p1_new].parentGroup[id_new_group] = null
        }

        if (!myData_plain.Point.list.hasOwnProperty(p2_new)) {
          myData_plain.Point.list[p2_new] = _.cloneDeep(myData_plain_origin.Point.list[p2_old])
          myData_plain.Point.list[p2_new].id = p2_new
          myData_plain.Point.list[p2_new].type_id = `Point${p2_new}`
        }
        delete myData_plain.Point.list[p2_new].line[id_old];
        myData_plain.Point.list[p2_new].line[id_new] = null;
        children_new[`Point${p2_new}`] = null //target_group
        myData_plain.Line.list[id_new].p2 = p2_new //self: Line

        if (!iscurrentGroup) {
          delete myData_plain.Point.list[p2_new].parentGroup[id_old_group] //parentGroup
          myData_plain.Point.list[p2_new].parentGroup[id_new_group] = null
        }

        break;
      case 'Bezier':
        // console.log(`bezier`);
        //self: Bezier
        id_new = id_old + max_id_bezier
        children_new[`Bezier${id_new}`] = null
        if (!myData_plain.Bezier.list.hasOwnProperty(id_new)) {
          myData_plain.Bezier.list[id_new] = _.cloneDeep(myData_plain_origin.Bezier.list[id_old])
          myData_plain.Bezier.list[id_new].id = id_new
          myData_plain.Bezier.list[id_new].type_id = `Bezier${id_new}`
        }
        if (!iscurrentGroup) {
          myData_plain.Bezier.list[id_new].parentGroup = id_new_group //parentGroup
          myData_plain.Group.list[id_new_group].bezier = id_new //target_group
          // console.log(`id_old_group ${id_old_group}->\nid_new_group${id_new_group}`);
          // console.log(myData_plain.Bezier.list);
        }

        //Point
        p1_old = myData_plain_origin.Bezier.list[id_old].p1;
        p2_old = myData_plain_origin.Bezier.list[id_old].p2;
        p3_old = myData_plain_origin.Bezier.list[id_old].p3;
        p4_old = myData_plain_origin.Bezier.list[id_old].p4;
        p1_new = p1_old + max_id_point
        p2_new = p2_old + max_id_point
        p3_new = p3_old + max_id_point
        p4_new = p4_old + max_id_point

        if (!myData_plain.Point.list.hasOwnProperty(p1_new)) {
          myData_plain.Point.list[p1_new] = _.cloneDeep(myData_plain_origin.Point.list[p1_old])
          myData_plain.Point.list[p1_new].id = p1_new
          myData_plain.Point.list[p1_new].type_id = `Point${p1_new}`
        }

        delete myData_plain.Point.list[p1_new].bezier[id_old];
        myData_plain.Point.list[p1_new].bezier[id_new] = null;
        children_new[`Point${p1_new}`] = null //target_group
        myData_plain.Bezier.list[id_new].p1 = p1_new //self: Bezier

        if (!iscurrentGroup) {
          delete myData_plain.Point.list[p1_new].parentGroup[id_old_group] //parentGroup
          myData_plain.Point.list[p1_new].parentGroup[id_new_group] = null
        }


        if (!myData_plain.Point.list.hasOwnProperty(p2_new)) {
          myData_plain.Point.list[p2_new] = _.cloneDeep(myData_plain_origin.Point.list[p2_old])
          myData_plain.Point.list[p2_new].id = p2_new
          myData_plain.Point.list[p2_new].type_id = `Point${p2_new}`
        }
        delete myData_plain.Point.list[p2_new].bezier[id_old];
        myData_plain.Point.list[p2_new].bezier[id_new] = null;
        children_new[`Point${p2_new}`] = null //target_group
        myData_plain.Bezier.list[id_new].p2 = p2_new //self: Bezier
        delete myData_plain.Bezier.list[id_new].control_widgets[`Point${p2_old}`] //self: Bezier
        myData_plain.Bezier.list[id_new].control_widgets[`Point${p2_new}`] = null //self: Bezier

        if (!iscurrentGroup) {
          delete myData_plain.Point.list[p2_new].parentGroup[id_old_group] //parentGroup
          myData_plain.Point.list[p2_new].parentGroup[id_new_group] = null
        }


        if (!myData_plain.Point.list.hasOwnProperty(p3_new)) {
          myData_plain.Point.list[p3_new] = _.cloneDeep(myData_plain_origin.Point.list[p3_old])
          myData_plain.Point.list[p3_new].id = p3_new
          myData_plain.Point.list[p3_new].type_id = `Point${p3_new}`
        }
        delete myData_plain.Point.list[p3_new].bezier[id_old];
        myData_plain.Point.list[p3_new].bezier[id_new] = null;
        children_new[`Point${p3_new}`] = null //target_group
        myData_plain.Bezier.list[id_new].p3 = p3_new //self: Bezier
        delete myData_plain.Bezier.list[id_new].control_widgets[`Point${p3_old}`] //self: Bezier
        myData_plain.Bezier.list[id_new].control_widgets[`Point${p3_new}`] = null //self: Bezier

        if (!iscurrentGroup) {
          delete myData_plain.Point.list[p3_new].parentGroup[id_old_group] //parentGroup
          myData_plain.Point.list[p3_new].parentGroup[id_new_group] = null
        }


        if (!myData_plain.Point.list.hasOwnProperty(p4_new)) {
          myData_plain.Point.list[p4_new] = _.cloneDeep(myData_plain_origin.Point.list[p4_old])
          myData_plain.Point.list[p4_new].id = p4_new
          myData_plain.Point.list[p4_new].type_id = `Point${p4_new}`
        }
        delete myData_plain.Point.list[p4_new].bezier[id_old];
        myData_plain.Point.list[p4_new].bezier[id_new] = null;
        children_new[`Point${p4_new}`] = null //target_group
        myData_plain.Bezier.list[id_new].p4 = p4_new //self: Bezier

        if (!iscurrentGroup) {
          delete myData_plain.Point.list[p4_new].parentGroup[id_old_group] //parentGroup
          myData_plain.Point.list[p4_new].parentGroup[id_new_group] = null
        }


        //Line
        line1_old = myData_plain_origin.Bezier.list[id_old].line1;
        line2_old = myData_plain_origin.Bezier.list[id_old].line2;
        line1_new = line1_old + max_id_line
        line2_new = line2_old + max_id_line
        if (!myData_plain.Line.list.hasOwnProperty(line1_new)) {
          myData_plain.Line.list[line1_new] = _.cloneDeep(myData_plain_origin.Line.list[line1_old])
          myData_plain.Line.list[line1_new].id = line1_new
          myData_plain.Line.list[line1_new].type_id = `Line${line1_new}`
        }
        delete myData_plain.Line.list[line1_new].bezier[id_old];
        myData_plain.Line.list[line1_new].bezier[id_new] = null;
        children_new[`Line${line1_new}`] = null //target_group
        myData_plain.Bezier.list[id_new].line1 = line1_new //self: Bezier
        delete myData_plain.Bezier.list[id_new].control_widgets[`Line${line1_old}`] //self: Bezier
        myData_plain.Bezier.list[id_new].control_widgets[`Line${line1_new}`] = null //self: Bezier
        
        if (!iscurrentGroup) {
          delete myData_plain.Line.list[line1_new].parentGroup[id_old_group] //parentGroup
          myData_plain.Line.list[line1_new].parentGroup[id_new_group] = null
        }


        if (!myData_plain.Line.list.hasOwnProperty(line2_new)) {
          myData_plain.Line.list[line2_new] = _.cloneDeep(myData_plain_origin.Line.list[line2_old])
          myData_plain.Line.list[line2_new].id = line2_new
          myData_plain.Line.list[line2_new].type_id = `Line${line2_new}`
        }
        delete myData_plain.Line.list[line2_new].bezier[id_old];
        myData_plain.Line.list[line2_new].bezier[id_new] = null;
        children_new[`Line${line2_new}`] = null //target_group
        myData_plain.Bezier.list[id_new].line2 = line2_new //self: Bezier
        delete myData_plain.Bezier.list[id_new].control_widgets[`Line${line2_old}`] //self: Bezier
        myData_plain.Bezier.list[id_new].control_widgets[`Line${line2_new}`] = null //self: Bezier
        
        if (!iscurrentGroup) {
          delete myData_plain.Line.list[line2_new].parentGroup[id_old_group] //parentGroup
          myData_plain.Line.list[line2_new].parentGroup[id_new_group] = null
        }


        break;
      case 'Group':
        id_new = id_old + max_id_group
        // console.log(`you child is a Group`);
        children_new[`Group${id_new}`] = null
        duplet(getObj(i_child), max_id_obj, myData_plain_origin, myData_plain)
        break;
    }
  }
  if (!iscurrentGroup) {
    myData_plain.Group.list[id_new_group].children = children_new
  }else{
    myData_plain.Group.list[currentGroup.id].children = children_new
  }
}


function isVisible(domElement) {
  return (domElement.hasAttribute('visibility') && domElement.getAttribute('visibility')!='hidden')||
  !domElement.hasAttribute('visibility')
}

// setInterval(function () {console.log(`heartbreak${myData.Point.list[1].groupRotSnapPoint}`);}, 1000);
// function setArchive() {
//   // arPoints = {...myData.Point.list}
//   // arLines = {...myData.Line.list}
//   // arGroups = {...myData.Group.list}
//   // arBeziers = {...myData.Bezier.list}
//   // arSvg = $("#lines").clone(true,true)
//   // arGroupRotPoint = Object.assign(new Point({x:0,y:0}), groupRotPoint)

//   localStorage.setItem("arPoints", myData.Point.list)
//   localStorage.setItem("arLines", myData.Line.list)
//   localStorage.setItem("arGroups", myData.Group.list)
//   localStorage.setItem("arBeziers", myData.Bezier.list)
//   localStorage.setItem("arSvg", svg) //$("#lines").clone(true,true)
//   localStorage.setItem("arGroupRotPoint", groupRotPoint)
// }
// function getArchive() {
//   myData.Point.list = localStorage.getItem("arPoints")
//   myData.Line.list = localStorage.getItem("arLines")
//   myData.Group.list = localStorage.getItem("arGroups")
//   myData.Bezier.list = localStorage.getItem("arBeziers")
//   groupRotPoint = localStorage.getItem("arGroupRotPoint")
//   let svg_stored = localStorage.getItem("arSvg")
//   let svg_parent = svg.parentNode
//   // svg_parent.removeChild(svg)
//   svg_parent.appendChild(svg_stored)
// }


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