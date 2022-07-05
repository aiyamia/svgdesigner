class Element {
  element_c;
  element_b;
  element_g;
  x;
  y;
  type_id;
  control_widgets={}
  constructor() {
    this.parentGroup = {}
  }
  init_element(type,obj){
    let group_element = document.createElementNS(SVG_NS, "g");
    group_element.setAttribute('id', this.type_id);
    if(!this.x){
      console.log('oo');
    }
    try {
      group_element.setAttribute('transform', `translate(${this.x},${this.y})`);
    } catch (error) {
      console.log('ooo');
    }
    
    let core_element = document.createElementNS(SVG_NS, type);
    for(let property in obj){
      core_element.setAttribute(property, obj[property]);
    }
    
    let bbox_element = generateBboxElement(core_element)
    bbox_element.setAttribute('id', `${this.type_id}_bbox`);
    bbox_element.setAttribute('class', `bbox`);
    group_element.appendChild(core_element)
    group_element.appendChild(bbox_element)
    svg.appendChild(group_element)
    this.element_b = bbox_element;
    this.element_c = core_element;
    this.element_g = group_element;
  }
  
  

  show_bbox(){
    let bbox_element = this.element_b;
    let bbox = this.element_c.getBBox();
    let pad = 5
    let w = 2*pad+bbox.width
    let h = 2*pad+bbox.height
    bbox_element.setAttribute('x', bbox.x-pad);
    bbox_element.setAttribute('y', bbox.y-pad);
    bbox_element.setAttribute('width', w);
    bbox_element.setAttribute('height', h);
    bbox_element.setAttribute('visibility','visible')
  }
  hide_bbox(){
    this.element_b.setAttribute('visibility','hidden')
  }
  hide_control_widgets(){
    for(let i_widget in this.control_widgets){
      getObj(i_widget).element_g.setAttribute('visibility','hidden')
    }
  }
  show_control_widgets(){
    for(let i_widget in this.control_widgets){
      try {
        getObj(i_widget).element_g.setAttribute('visibility','visible')
      } catch (error) {
        console.log(`ooo`);
      }
      
    }
  }
}

class Point extends Element {
  line={};
  bezier={};
  groupRotSnapPoint;
  constructor(obj,regenerate=false) {
    super();
    if(regenerate){
      this.id = obj.id;
      myData.Point.list[this.id] = this;
      this.type_id = obj.type_id;
      this.x = obj.x;
      this.y = obj.y;
      this.size = obj.size;
      this.color = obj.color;
      this.edgewidth = obj.edgewidth;
      this.edgecolor = obj.edgecolor;
      this.line = obj.line;
      this.bezier = obj.bezier;
      this.parentGroup = obj.parentGroup;
      if(obj.groupRotSnapPoint){
        this.groupRotSnapPoint = obj.groupRotSnapPoint;
      }
    }else{
      this.id = ++myData.Point.max_id;
      myData.Point.list[this.id] = this;
      this.type_id = `${this.constructor.name}${this.id}`;
      this.x = obj.x;
      this.y = obj.y;
      this.size = obj.size || 5;
      this.color = obj.color || point_color;
      this.edgewidth = obj.edgewidth || '1';
      this.edgecolor = obj.edgecolor || 'black';
    }
    

    this.init_element('circle', 
                          { 'cx':0,
                            'cy':0,
                            'r':this.size/2,
                            'fill':this.color,
                            'stroke-width':this.edgewidth,
                            'stroke':this.edgecolor 
                          }
    )

    //让旋转中心点保持在最前面，方便点取。
    if(groupRotPoint){
      svg.appendChild(groupRotPoint.element_g)
    }

    this.element_c.classList.add('pointlistener')
    this.element_c.targetObj_typeid = this.type_id;
  }
  update(){
    let point = this.element_c;
    point.setAttribute('r', this.size/2);
    point.setAttribute('fill', this.color);
    point.setAttribute('stroke-width', this.edgewidth);
    point.setAttribute('stroke', this.edgecolor);
  }
  moveTo(x,y) {
    let point_g = this.element_c.parentNode;
    point_g.setAttribute('transform', `translate(${x},${y})`)
    
    this.x = x
    this.y = y
    for(let i_line in this.line){
      myData.Line.list[i_line].update()
    }
  }
  move(dx,dy) {
    let point_g = this.element_c.parentNode;
    this.x += dx
    this.y += dy
    point_g.setAttribute('transform', `translate(${this.x},${this.y})`)
    for(let i_line in this.line){
      myData.Line.list[i_line].update()
    }
  }
  rot(dtheta_in_deg) {
    let point_g = this.element_c.parentNode;
    let rho = Math.hypot(this.x-groupRotPoint.x,this.y-groupRotPoint.y)
    let theta0_in_rad = Math.atan2(this.y-groupRotPoint.y,this.x-groupRotPoint.x)
    let theta_in_rad = theta0_in_rad + dtheta_in_deg * (Math.PI/180)

    this.x = groupRotPoint.x + rho * Math.cos(theta_in_rad);
    this.y = groupRotPoint.y + rho * Math.sin(theta_in_rad);
    point_g.setAttribute('transform', `translate(${this.x},${this.y})`)
    for(let i_line in this.line){
      myData.Line.list[i_line].update()
    }
  }
  snapshow() {
    let d_list = []
    let id_list = []
    let d,dx,dy;
    for(let i_comp in myData.Point.list){
      let point_to_compare = myData.Point.list[i_comp]
      if(![this.id,groupRotPoint.id].includes(point_to_compare.id)){
        dx = point_to_compare.x - this.x
        dy = point_to_compare.y - this.y
        d = Math.hypot(dx,dy)
        d_list.push(d)
        id_list.push(point_to_compare.id)
      }
    }
    let d_min = Math.min(...d_list)
    if(d_min<50){
      if(id_target){
        myData.Point.list[id_target].color = point_color
        myData.Point.list[id_target].edgecolor = 'black'
        myData.Point.list[id_target].update()
        id_target = null;
      }
      id_target = id_list[d_list.indexOf(d_min)]
      myData.Point.list[id_target].color = 'grey'
      myData.Point.list[id_target].edgecolor = '#eee'
      myData.Point.list[id_target].update()
    }else{
      if(id_target){
        myData.Point.list[id_target].color = point_color
        myData.Point.list[id_target].edgecolor = 'black'
        myData.Point.list[id_target].update()
        id_target = null;
      }
    }
  }
  snap(){
    // 称 吸附中位置变动的点为“跳点”，位置不动的是“目标点”
    let point_target = myData.Point.list[id_target]
    
    //跳点位置移动
    this.moveTo(point_target.x,point_target.y)

    if(this.id != groupRotPoint.id){
      //本次吸附的跳点 不是 旋转中心点，将删除目标点
      let lines_target = point_target.line
      let beziers_target = point_target.bezier
      let groups_target = point_target.parentGroup
      point_target.element_g.remove()
      delete myData.Point.list[id_target]

      if(groupRotPoint.groupRotSnapPoint){
        if(groupRotPoint.groupRotSnapPoint == id_target){
          groupRotPoint.groupRotSnapPoint = this.id
        }
      }
  
      svg.appendChild(this.element_g); //使其位于（仅次于groupRotPoint的）最前
      svg.appendChild(groupRotPoint.element_g)
      
      this.line = {...this.line,...lines_target}
      this.bezier = {...this.bezier,...beziers_target}
      for(let i_line in lines_target){
        let this_l = myData.Line.list[i_line];
        if(this_l.p1 == id_target){
          this_l.p1 = this.id
        }else{
          this_l.p2 = this.id
        }
      }
      for(let i_bezier in beziers_target){
        let target_bezier = myData.Bezier.list[i_bezier]
        delete myData.Group.list[target_bezier.parentGroup].children[`Point${target_bezier.p1}`]
        delete myData.Group.list[target_bezier.parentGroup].children[`Point${target_bezier.p2}`]
        delete myData.Group.list[target_bezier.parentGroup].children[`Point${target_bezier.p3}`]
        delete myData.Group.list[target_bezier.parentGroup].children[`Point${target_bezier.p4}`]
        
        target_bezier.p1 = myData.Line.list[target_bezier.line1].p1;
        target_bezier.p2 = myData.Line.list[target_bezier.line1].p2;
        target_bezier.p3 = myData.Line.list[target_bezier.line2].p2;
        target_bezier.p4 = myData.Line.list[target_bezier.line2].p1;

        myData.Group.list[target_bezier.parentGroup].children[`Point${target_bezier.p1}`] = null
        myData.Group.list[target_bezier.parentGroup].children[`Point${target_bezier.p2}`] = null
        myData.Group.list[target_bezier.parentGroup].children[`Point${target_bezier.p3}`] = null
        myData.Group.list[target_bezier.parentGroup].children[`Point${target_bezier.p4}`] = null
        
        if(!this.parentGroup.hasOwnProperty(target_bezier.parentGroup)){
          this.parentGroup[target_bezier.parentGroup] = null
        }
      }
      for(let i_group in groups_target){
        let target_group = myData.Group.list[i_group]
        delete target_group.children[`Point${id_target}`]
      }
    }else{
      //本次吸附的跳点 是 旋转中心点，不删除目标点
      groupRotPoint.groupRotSnapPoint = point_target.id
      point_target.color = point_color
      point_target.edgecolor = 'black'
      point_target.update()
    }
    id_target = null;
    currentGroup.update_bbox()
    // currentGroup.hide_bbox()
  }
  static clear(){
    for(let name in myData.Point.list){
      svg.removeChild(myData.Point.list[name].element_g)
    }
    myData.Point.max_id = 0;
    myData.Point.list = {}
    groupRotPoint = null
    groupRotPoint = new Point({x:100,y:100,color:'orange',size:10})
    myData.GroupRotPoint = groupRotPoint.id
  }
}


class Line extends Element {
  constructor(obj,regenerate=false) {
    super();
    if(regenerate){
      this.id = obj.id
      myData.Line.list[this.id] = this
      this.type_id = obj.type_id
      this.bezier = obj.bezier
      this.p1 = obj.p1
      this.p2 = obj.p2
      this.width = obj.width
      this.color = obj.color
      this.angle_in_deg = obj.angle_in_deg
      this.parentGroup = obj.parentGroup;
    }else{
      this.id = ++myData.Line.max_id;
      myData.Line.list[this.id] = this;
      this.type_id = `${this.constructor.name}${this.id}`;
      this.bezier = {};
      this.p1 = obj.p1.id;
      this.p2 = obj.p2.id;
      obj.p1.line[this.id] = null;
      obj.p2.line[this.id] = null;
      this.width = obj.width || 2;
      this.color = obj.color || stroke_color;
      
      this.angle_in_deg = Math.atan2(obj.p2.y-obj.p1.y,obj.p2.x-obj.p1.x) * (180/Math.PI)
    }
    

    let group_element = document.createElementNS(SVG_NS, "g");
    group_element.setAttribute('id', this.type_id);
    let line = document.createElementNS(SVG_NS, "path");
    if(regenerate){
      line.setAttribute('d', `M ${myData.Point.list[obj.p1].x} ${myData.Point.list[obj.p1].y} L ${myData.Point.list[obj.p2].x} ${myData.Point.list[obj.p2].y}`);
    }else{
      line.setAttribute('d', `M ${obj.p1.x} ${obj.p1.y} L ${obj.p2.x} ${obj.p2.y}`);
    }
    
    line.setAttribute('stroke-width', this.width);
    line.setAttribute('stroke', this.color);
    line.setAttribute('fill', "transparent");

    let bbox_element = generateBboxElement(line)
    bbox_element.setAttribute('id', `${this.type_id}_bbox`);
    bbox_element.setAttribute('class', `bbox`);
    group_element.appendChild(line)
    group_element.appendChild(bbox_element)

    this.element_b = bbox_element;
    this.element_c = line;
    this.element_g = group_element;
    svg.prepend(group_element);
    for(let i_g in myData.Group.list){
      svg.prepend(myData.Group.list[i_g].element_b)
    }
    line.targetObj_typeid = this.type_id;
    line.classList.add('linelistener')
  }
  update() {
    let this_p1 = myData.Point.list[this.p1]
    let this_p2 = myData.Point.list[this.p2]
    this.angle_in_deg = Math.atan2(this_p2.y-this_p1.y,this_p2.x-this_p1.x) * (180/Math.PI)
    let line = this.element_c;
    line.setAttribute('d', `M ${this_p1.x} ${this_p1.y} L ${this_p2.x} ${this_p2.y}`);
    line.setAttribute('stroke-width', this.width);
    line.setAttribute('stroke', this.color);
    line.setAttribute('fill', "transparent");
    if(Object.keys(this.bezier).length!=0){
      for (let i_be in this.bezier){
        myData.Bezier.list[i_be].update();
      }
    }
    this.update_bbox()
  }
  move(dx,dy) {
    myData.Point.list[this.p1].move(dx,dy)
    myData.Point.list[this.p2].move(dx,dy)
  }
  update_bbox(){
    updateBboxElement(this.element_b,this.element_c)
    this.hide_bbox()
  }
  static clear(){
    for(let name in myData.Line.list){
      svg.removeChild(myData.Line.list[name].element_g)
    }
    myData.Line.max_id = 0;
    myData.Line.list = {}
  }
}

class Group {
  element_b;
  constructor(obj=null,regenerate=false) {
    if(regenerate){
      this.id = obj.id;
      myData.Group.list[this.id] = this;
      this.type_id = obj.type_id;
  
      this.bezier = obj.bezier;
      this.children = obj.children;
      this.parentGroup = obj.parentGroup;
    }else{
      this.id = ++myData.Group.max_id;
      myData.Group.list[this.id] = this;
      this.type_id = `${this.constructor.name}${this.id}`;
  
      this.bezier = null;
      this.children = {}
      this.parentGroup = {}
    }
    
    
    let group = document.createElementNS(SVG_NS, "g");
    group.setAttribute('id','group_init')
    let volumn_init = document.createElementNS(SVG_NS, "rect");
    volumn_init.setAttribute('id','volumn_init')
    volumn_init.setAttribute('width',100)
    volumn_init.setAttribute('height',100)
    group.appendChild(volumn_init)
    svg.appendChild(group)
  
    let bbox_element = generateBboxElement(group)
    
    bbox_element.setAttribute('id', `${this.type_id}_bbox`);
    bbox_element.setAttribute('class', 'bbox');
    bbox_element.setAttribute('pointer-events','all');
    
    this.element_b = bbox_element;
    svg.prepend(bbox_element)
    svg.removeChild(group)

    //将事件响应函数分出去单独写，是为了让组内的元素接收到的事件也传递到这里。
    this.element_b.targetObj_typeid = this.type_id;
    this.element_b.classList.add('grouplistener')
  }
  mousedown_event = e => {
    let this_target = getObj(e.target.targetObj_typeid)

    if(draw_select==0){
      down_elements = true
      hide_all_bbox()
      info_line.setAttribute('visibility','hidden')

      if(e.shiftKey){
        //此处的限制很重要，不然会添加自身引起栈溢出
        if(Object.keys(currentGroup.children).length>1 && Object.keys(currentGroup.children).includes(`${this_target.type_id}`)){
          currentGroup.removeChild(this_target)
          // console.log(`删除--当前this：\n${Object.keys(currentGroup.children)}`);
        }else{
          if(this_target.type_id != currentGroup.type_id){
            currentGroup.addChild(this_target)
            // console.log(`添加--当前this：\n${Object.keys(currentGroup.children)}`);
          }
        }
      }else{
        if(this_target.constructor.name!="Group"){
          if(Object.keys(this_target.bezier).length!=0){
            for(let i_b in this_target.bezier){
              myData.Bezier.list[i_b].show_control_widgets()
            }
          }else{
            if(Object.keys(currentGroup.children).length==1 && Object.keys(currentGroup.children)[0].includes('Group')){
              let this_b = getObj(Object.keys(currentGroup.children)[0]).bezier;
              if(this_b){
                myData.Bezier.list[this_b].hide_control_widgets()
              }
            }
            this_target.show_control_widgets()
          }
          currentGroup.children = {}
          currentGroup.addChild(this_target)
        }else{
          if(this_target.id!=currentGroup.id){
            // console.log(`这是个和当前组不一样的Group`);
            if(Object.keys(currentGroup.children).length==1 && Object.keys(currentGroup.children)[0].includes('Group')){
              let this_b = getObj(Object.keys(currentGroup.children)[0]).bezier;
              if(this_b){
                myData.Bezier.list[this_b].hide_control_widgets()
              }
            }
            if(this_target.bezier){
              myData.Bezier.list[this_target.bezier].show_control_widgets()
            }
            currentGroup.children = {}
            currentGroup.addChild(this_target)
            // console.log(this);
          }
        }
        // console.log(`当前组内成员：\n${Object.keys(this.children)}`);
      }
      currentGroup.show_bbox()
      
      currentGroup.element_b.setAttribute('pointer-events','all')
      
      // console.log(`将移动：组${this.id}`);
      down_elements = true
      moving_group = true
      group_to_move = currentGroup
      m = oMousePosSVG(e);
      x0 = m.x;
      y0 = m.y;
    }
  }

  mousemove_event = e => {
    if(moving_group){
      // console.log(`elements.js mousemove`);
      if(Object.keys(this.children).length==1 && Object.keys(this.children)[0].includes('Point')){
        let point = getObj(Object.keys(this.children)[0])
        if(e.shiftKey){
          snapping = true;
          point.snapshow();
        }else{
          snapping = false;
          if(id_target){
            myData.Point.list[id_target].color = point_color
            myData.Point.list[id_target].edgecolor = 'black'
            myData.Point.list[id_target].update()
            id_target = null;
          }
        }
      }
    }
  }

  mouseup_event = e => {
    if(moving_group){
      // console.log(`elements.js Group mouseup`);
      if(Object.keys(this.children).length==1 && Object.keys(this.children)[0].includes('Point')){
        let point = getObj(Object.keys(this.children)[0])
        down_elements = false
        if(e.shiftKey){
          if(id_target){
            point.snap()
          }
        }else{
          snapping = false;
          if(id_target){
            myData.Point.list[id_target].color = point_color
            myData.Point.list[id_target].edgecolor = 'black'
            myData.Point.list[id_target].update()
            id_target = null;
          }
        }
      }
    }
  }
  getMovePoints(){
    let p = {}
    let child;
    for(let name in this.children){
      child = getObj(name);
      if(name.includes("Line")){
        p[child.p1] = null
        p[child.p2] = null
      }else if(name.includes("Point")){
        p[child.id] = null
      }else if(name.includes("Bezier")){
        p[child.p1] = null
        p[child.p2] = null
        p[child.p3] = null
        p[child.p4] = null
      }else if(name.includes("Group")){
        p = {...child.getMovePoints(),...p}
      }
    }
    return p
  }
  moveChildren(dx,dy){
    for(let i_p in this.getMovePoints()){
      myData.Point.list[i_p].move(dx,dy)
    }
  }
  rotChildren(dtheta_in_deg){
    for(let i_p in this.getMovePoints()){
      myData.Point.list[i_p].rot(dtheta_in_deg)
    }
  }
  update_bbox(recursive=true,compact=false){
    // console.log(recursive);
    let group = document.createElementNS(SVG_NS, "g");
    group.setAttribute('id','tmp')
    
    for(let name in this.children){
      let child_obj = getObj(name)
      if(name.includes('Group')){
        // console.log(`组内有组${name}`);
        if(recursive){
          try {
            child_obj.update_bbox(true,compact)
          } catch (error) {
            console.log('ooo');
          }
          
          // child_obj.show_bbox()
        }
        group.appendChild(child_obj.element_b.cloneNode(true))
      }else{
        if(isVisible(child_obj.element_g)){
          try {
            if(compact){
              group.appendChild(child_obj.element_c.cloneNode(true))
            }else{
              group.appendChild(child_obj.element_g.cloneNode(true))
            }
          } catch (error) {
            console.log(`ooo`);
          }
        }
      }
    }
    svg.appendChild(group)
    updateBboxElement(this.element_b,group,compact)
    
    svg.removeChild(group)
    if(recursive){
      // let childArray = Object.keys(this.children)
      // for(let name in myData.Group.list){
      //   let intersect = Object.keys(myData.Group.list[name].children).filter(x => childArray.includes(x))
      //   if(intersect.length>0){
      //     myData.Group.list[name].update_bbox(false)
      //   }
      // }
      for(let name in myData.Group.list){
        myData.Group.list[name].update_bbox(false,compact)
        // myData.Group.list[name].hide_bbox()
      }
    }
  }
  addChild(obj,updatebbx=true){
    this.children[obj.type_id] = null
    if(updatebbx){
      this.update_bbox()
    }
    obj.parentGroup[this.id] = null
  }
  removeChild(obj){
    delete this.children[obj.type_id]
    this.update_bbox()
    delete obj.parentGroup[this.id]
  }
  highlight_children(){
    for(let name in this.children){
      let child_obj = getObj(name)
      let [child_type,child_id] = name.split(/(?<=[^\d])(?=\d)/)
      switch (child_type) {
        case 'Group':
          child_obj.element_b.setAttribute('fill',group_color_selected)
          child_obj.element_b.setAttribute('opacity','0.5')
          child_obj.element_b.setAttribute('visibility','visible')
          break;
        case 'Point':
          if(isVisible(child_obj.element_g) && child_obj.id != groupRotPoint.id){
            child_obj.element_c.setAttribute('fill',point_color_selected)
          }
          break;
        case 'Line':
          if(isVisible(child_obj.element_g)){
            child_obj.element_c.setAttribute('stroke',stroke_color_selected)
          }
          break;
        case 'Bezier':
          if(isVisible(child_obj.element_g)){
            child_obj.element_c.setAttribute('stroke',stroke_color_selected)
          }
          break;
        default:
          break;
      }
    }
  }
  deHighlight_children(){
    for(let name in this.children){
      let child_obj = getObj(name)
      let [child_type,child_id] = name.split(/(?<=[^\d])(?=\d)/)
      switch (child_type) {
        case 'Group':
          child_obj.element_b.setAttribute('fill','none')
          child_obj.element_b.removeAttribute('opacity')
          child_obj.element_b.setAttribute('visibility','hidden')
          break;
        case 'Point':
          if(isVisible(child_obj.element_g) && child_obj.id != groupRotPoint.id){
            child_obj.element_c.setAttribute('fill',point_color)
          }
          break;
        case 'Line':
          if(isVisible(child_obj.element_g)){
            child_obj.element_c.setAttribute('stroke',stroke_color)
          }
          break;
        case 'Bezier':
          if(isVisible(child_obj.element_g)){
            child_obj.element_c.setAttribute('stroke',stroke_color)
          }
          break;
        default:
          break;
      }
    }
  }
  show_bbox(){
    this.element_b.setAttribute('visibility','visible')
    this.highlight_children()
    // if(Object.keys(this.children).length>1){
    //   for(let i_child in this.children){
    //     getObj(i_child).show_bbox()
    //   }
    // }else if(Object.keys(this.children).length==1){
    //   if(Object.keys(this.children)[0].includes("Group")){
    //     for(let i_child in this.children){
    //       getObj(i_child).show_bbox()
    //     }
    //   }
    // }

    if(Object.keys(this.children).length==1){
      if(Object.keys(this.children)[0].includes("Group")){
        for(let i_child in this.children){
          getObj(i_child).show_bbox()
        }
      }
    }
  }
  hide_bbox(){
    this.element_b.setAttribute('visibility','hidden')
    this.deHighlight_children()
    if(Object.keys(this.children).length==1){
      if(Object.keys(this.children)[0].includes("Group")){
        for(let i_child in this.children){
          getObj(i_child).hide_bbox()
        }
      }
    }
    // if(Object.keys(this.children).length>1){
    //   for(let i_child in this.children){
    //     getObj(i_child).hide_bbox()
    //   }
    // }
  }

  contains(obj_type_id){
    let group_child = []
    let line_child = []
    for(let i_child in this.children){
      if(obj_type_id == i_child){
        return true
      }
      if(i_child.includes("Group")){
        group_child.push(i_child)
      }
      if(i_child.includes("Line")){
        line_child.push(i_child)
      }
    }
    for(let i_group_child in group_child){
      if(getObj(group_child[i_group_child]).contains(obj_type_id)){
        return true
      }
    }
    if(obj_type_id.includes("Point")){
      for(let i_line_child in line_child){
        let obj_id = obj_type_id.replace('Point','')
        if(getObj(line_child[i_line_child]).p1 == obj_id || getObj(line_child[i_line_child]).p2 == obj_id){
          return true
        }
      }
    }
    return false
  }
  delete(){
    let groups_child = []
    let child;
    for(let i_child in this.children){
      child = getObj(i_child)
      if(i_child.includes("Group")){
        groups_child.push(i_child)
      }else if(i_child.includes("Line")){
        child.element_g.remove()
        for(let i_group in child.parentGroup){
          myData.Group.list[i_group].removeChild(child)
        }
        let child_p1 = getObj(child.p1);
        if(Object.keys(child_p1.line).length==1){
          child_p1.element_g.remove()
          delete myData.Point.list[child_p1.id]
        }else{
          delete child_p1.line[child.id]
        }
        let child_p2 = getObj(child.p2);
        if(Object.keys(child_p2.line).length==1){
          child_p2.element_g.remove()
          delete myData.Point.list[child_p2.id]
        }else{
          delete child_p2.line[child.id]
        }
      }
    }
    for(let i_group in groups_child){
      let group_child = getObj(i_group)
      group_child.delete()
    }
    if(this.id != currentGroup.id){
      this.element_b.remove()
      delete myData.Group.list[this.id]
    }
  }
  static clear(){
    for(let name in myData.Group.list){
      svg.removeChild(myData.Group.list[name].element_b)
    }
    myData.Group.max_id = 0;
    myData.Group.list = {};
    currentGroup = new Group();
    myData.CurrentGroup = currentGroup.id;
  }
}

class Bezier extends Element {
  constructor(obj,regenerate=false) {
    super();
    let this_p1;
    let this_p2;
    let this_p3;
    let this_p4;
    if(regenerate){
      this.id = obj.id;
      myData.Bezier.list[this.id] = this;
      this.type_id = obj.type_id;

      this.line1 = obj.line1
      this.line2 = obj.line2

      this.p1 = obj.p1;
      this.p2 = obj.p2;
      this.p3 = obj.p3;
      this.p4 = obj.p4;
      this.width = obj.width;
      this.color = obj.color;
      this.control_widgets = obj.control_widgets;
      this_p1 = myData.Point.list[this.p1]
      this_p2 = myData.Point.list[this.p2]
      this_p3 = myData.Point.list[this.p3]
      this_p4 = myData.Point.list[this.p4]
      this.parentGroup = obj.parentGroup;
    }else{
      this.id = ++myData.Bezier.max_id;
      myData.Bezier.list[this.id] = this;
      this.type_id = `${this.constructor.name}${this.id}`;
  
      this.line1 = obj.line1.id
      this.line2 = obj.line2.id
  
      this.p1 = obj.line1.p1;
      this.p2 = obj.line1.p2;
      this.p3 = obj.line2.p2;
      this.p4 = obj.line2.p1;
      this.width = obj.width || 2;
      this.color = obj.color || stroke_color;
      
      this_p1 = myData.Point.list[this.p1]
      this_p2 = myData.Point.list[this.p2]
      this_p3 = myData.Point.list[this.p3]
      this_p4 = myData.Point.list[this.p4]
  
      this.control_widgets[obj.line1.type_id] = null;
      this.control_widgets[obj.line2.type_id] = null;
      this.control_widgets[this_p2.type_id] = null;
      this.control_widgets[this_p3.type_id] = null;
    }
    
    let group_element = document.createElementNS(SVG_NS, "g");
    group_element.setAttribute('id', this.type_id);
    let bezier = document.createElementNS(SVG_NS, "path");
    bezier.setAttribute('d', 
    `M ${this_p1.x} ${this_p1.y} C ${this_p2.x} ${this_p2.y}, 
    ${this_p3.x} ${this_p3.y}, ${this_p4.x} ${this_p4.y}`);
    bezier.setAttribute('stroke-width', this.width);
    bezier.setAttribute('stroke', this.color);
    bezier.setAttribute('fill', "transparent");
    this.element_c = bezier
    
    let bbox_element = generateBboxElement(bezier)
    bbox_element.setAttribute('id', `${this.type_id}_bbox`);
    bbox_element.setAttribute('class', `bbox`);
    group_element.appendChild(bezier)
    group_element.appendChild(bbox_element)
    
    this.element_b = bbox_element;
    this.element_g = group_element;
    svg.prepend(group_element);
    for(let i_g in myData.Group.list){
      svg.prepend(myData.Group.list[i_g].element_b)
    }

    if (!regenerate) {
      let bG = new Group()
      bG.bezier = this.id
      bG.addChild(this_p1)
      bG.addChild(this_p2)
      bG.addChild(this_p3)
      bG.addChild(this_p4)
      bG.addChild(obj.line1)
      bG.addChild(obj.line2)
      bG.addChild(this)
      this.parentGroup = bG.id

      this_p1.bezier[this.id] = this.parentGroup
      this_p2.bezier[this.id] = this.parentGroup
      this_p4.bezier[this.id] = this.parentGroup
      this_p3.bezier[this.id] = this.parentGroup
      obj.line1.bezier[this.id] = this.parentGroup
      obj.line2.bezier[this.id] = this.parentGroup
    }
    

    bezier.targetObj_typeid = `Group${this.parentGroup}`;
    bezier.classList.add('bezierlistener')
    if (regenerate) {
      this.hide_control_widgets()
    }
  }
  update() {
    let this_p1 = myData.Point.list[this.p1]
    let this_p2 = myData.Point.list[this.p2]
    let this_p3 = myData.Point.list[this.p3]
    let this_p4 = myData.Point.list[this.p4]
    let bezier = this.element_c;
    bezier.setAttribute('d', `M ${this_p1.x} ${this_p1.y} C ${this_p2.x} ${this_p2.y}, 
    ${this_p3.x} ${this_p3.y}, ${this_p4.x} ${this_p4.y}`);
    bezier.setAttribute('stroke-width', this.width);
    bezier.setAttribute('stroke', this.color);
    bezier.setAttribute('fill', "transparent");
    this.update_bbox()
  }
  move(dx,dy) {
    let this_p1 = myData.Point.list[this.p1]
    let this_p2 = myData.Point.list[this.p2]
    let this_p3 = myData.Point.list[this.p3]
    let this_p4 = myData.Point.list[this.p4]
    this_p1.move(dx,dy)
    this_p2.move(dx,dy)
    this_p3.move(dx,dy)
    this_p4.move(dx,dy)
  }
  update_bbox(){
    updateBboxElement(this.element_b,this.element_c)
    this.hide_bbox()
  }
  static clear(){
    for(let name in myData.Bezier.list){
      svg.removeChild(myData.Bezier.list[name].element_g)
    }
    myData.Bezier.max_id = 0;
    myData.Bezier.list = {}
  }
}
