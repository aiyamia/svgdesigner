class Element {
  element_c;
  element_b;
  element_g;
  x;
  y;
  constructor() {
    this.parentGroup = {}
  }
  init_element(type,obj){
    let group_element = document.createElementNS(SVG_NS, "g");
    group_element.setAttribute('id', `${this.constructor.name}${this.id}`);
    group_element.setAttribute('transform', `translate(${this.x},${this.y})`);
    let core_element = document.createElementNS(SVG_NS, type);
    for(let property in obj){
      core_element.setAttribute(property, obj[property]);
    }
    
    let bbox_element = generateBboxElement(core_element)
    bbox_element.setAttribute('id', `${this.constructor.name}${this.id}_bbox`);
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
    let bbox_element = this.element_b;
    bbox_element.setAttribute('visibility','hidden')
  }
}

class Point extends Element {
  static max_id = 0;
  static list = {}
  line={};
  bezier={};
  constructor(obj,parent=svg) {
    super();
    this.id = ++Point.max_id;
    Point.list[this.id] = this;
    this.x = obj.x;
    this.y = obj.y;
    this.size = obj.size || 5;
    this.color = obj.color || 'black';
    this.edgewidth = obj.edgewidth || '1';
    this.edgecolor = obj.edgecolor || 'black';

    this.init_element('circle', 
                          { 'cx':0,
                            'cy':0,
                            'r':this.size/2,
                            'fill':this.color,
                            'stroke-width':this.edgewidth,
                            'stroke':this.edgecolor 
                          }
    )

    //下面这波绑定是在用“Group”操作“Point”时snapshow()、snap()仍然及时精准响应的必要条件。
    let point = this.element_c;
    point.myObj = this;
    point.addEventListener("mousedown", e => {
      if(draw_select==0){
        currentGroup.mousedown_event(e)
      }
    })
    point.addEventListener("mousemove", e => {
      if(draw_select==0){
        currentGroup.mousemove_event(e)
      }
    })
    point.addEventListener("mouseup", e => {
      if(draw_select==0){
        currentGroup.mouseup_event(e)
      }
    })
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
      this.line[i_line].update()
    }
  }
  move(dx,dy) {
    let point_g = this.element_c.parentNode;
    this.x += dx
    this.y += dy
    point_g.setAttribute('transform', `translate(${this.x},${this.y})`)
    for(let i_line in this.line){
      this.line[i_line].update()
    }
  }
  rot(dtheta_in_deg) {
    let dtheta_in_rad = dtheta_in_deg * (Math.PI/180);
    let point_g = this.element_c.parentNode;
    let rho = Math.hypot(this.x-groupRotPoint.x,this.y-groupRotPoint.y)
    let theta0_in_rad = Math.atan2(this.y-groupRotPoint.y,this.x-groupRotPoint.x)
    let theta_in_rad = theta0_in_rad + dtheta_in_rad

    this.x = groupRotPoint.x + rho * Math.cos(theta_in_rad);
    this.y = groupRotPoint.y + rho * Math.sin(theta_in_rad);
    point_g.setAttribute('transform', `translate(${this.x},${this.y})`)
    for(let i_line in this.line){
      this.line[i_line].update()
    }
  }
  snapshow() {
    let d_list = []
    let id_list = []
    let d,dx,dy;
    for(let i_comp in Point.list){
      let point_to_compare = Point.list[i_comp]
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
        Point.list[id_target].color = 'black'
        Point.list[id_target].edgecolor = 'black'
        Point.list[id_target].update()
        id_target = null;
      }
      id_target = id_list[d_list.indexOf(d_min)]
      Point.list[id_target].color = 'grey'
      Point.list[id_target].edgecolor = '#eee'
      Point.list[id_target].update()
    }else{
      if(id_target){
        Point.list[id_target].color = 'black'
        Point.list[id_target].edgecolor = 'black'
        Point.list[id_target].update()
        id_target = null;
      }
    }
  }
  snap(){
    // console.log(`snap!\ntarget: Point ${id_target}`);
    let point_target = Point.list[id_target]
    this.moveTo(point_target.x,point_target.y)

    if(this.id!=groupRotPoint.id){
      let lines_target = point_target.line
      let beziers_target = point_target.bezier
      point_target = this;
      Point.list[id_target].element_g.remove()
      delete Point.list[id_target]
  
      svg.appendChild(this.element_g); //使其位于（仅次于groupRotPoint的）最前
      svg.appendChild(groupRotPoint.element_g)

      point_target.line = {...point_target.line,...lines_target}
      point_target.bezier = {...point_target.bezier,...beziers_target}
      for(let i_line in lines_target){
        if(lines_target[i_line].p1.id==id_target){
          lines_target[i_line].p1 = this
        }else{
          lines_target[i_line].p2 = this
        }
      }
      for(let i_bezier in beziers_target){
        let this_bezier = beziers_target[i_bezier]
        this_bezier.p1 = this_bezier.line1.p1;
        this_bezier.p2 = this_bezier.line1.p2;
        this_bezier.p3 = this_bezier.line2.p2;
        this_bezier.p4 = this_bezier.line2.p1;
      }
    }else{
      point_target.color = 'black'
      point_target.edgecolor = 'black'
      point_target.update()
    }
    id_target = null;
    currentGroup.update_bbox()
    // currentGroup.hide_bbox()
  }
  static clear(){
    for(let name in Point.list){
      svg.removeChild(Point.list[name].element_g)
    }
    Point.max_id = 0;
    Point.list = {}
    groupRotPoint = new Point({x:100,y:100,color:'orange',size:10})
  }
}


class Line extends Element {
  static max_id = 0;
  static list = {}
  
  constructor(obj,parent=svg) {
    super();
    
    this.id = ++Line.max_id;
    Line.list[this.id] = this;
    this.bezier = {};
    this.p1 = obj.p1;
    this.p2 = obj.p2;
    this.p1.line[this.id] = this;
    this.p2.line[this.id] = this;
    this.width = obj.width || 2;
    this.color = obj.color || 'red';
    
    let group_element = document.createElementNS(SVG_NS, "g");
    group_element.setAttribute('id', `${this.constructor.name}${this.id}`);
    let line = document.createElementNS(SVG_NS, "path");
    line.setAttribute('d', `M ${this.p1.x} ${this.p1.y} L ${this.p2.x} ${this.p2.y}`);
    line.setAttribute('stroke-width', this.width);
    line.setAttribute('stroke', this.color);
    line.setAttribute('fill', "transparent");

    let bbox_element = generateBboxElement(line)
    bbox_element.setAttribute('id', `${this.constructor.name}${this.id}_bbox`);
    bbox_element.setAttribute('class', `bbox`);
    group_element.appendChild(line)
    group_element.appendChild(bbox_element)

    this.element_b = bbox_element;
    this.element_c = line;
    this.element_g = group_element;
    svg.prepend(group_element);
    for(let i_g in Group.list){
      svg.prepend(Group.list[i_g].element_b)
    }
    line.myObj = this;
    line.addEventListener("mousedown", e => {
      if(draw_select==0){
        currentGroup.mousedown_event(e)
      }
    })
  }
  update() {
    let line = this.element_c;
    line.setAttribute('d', `M ${this.p1.x} ${this.p1.y} L ${this.p2.x} ${this.p2.y}`);
    line.setAttribute('stroke-width', this.width);
    line.setAttribute('stroke', this.color);
    line.setAttribute('fill', "transparent");
    if(Object.keys(this.bezier).length!=0){
      for (let i_be in this.bezier){
        this.bezier[i_be].update();
      }
    }
    this.update_bbox()
  }
  move(dx,dy) {
    this.p1.move(dx,dy)
    this.p2.move(dx,dy)
  }
  update_bbox(){
    updateBboxElement(this.element_b,this.element_c)
    this.hide_bbox()    
  }
  static clear(){
    for(let name in Line.list){
      svg.removeChild(Line.list[name].element_g)
    }
    Line.max_id = 0;
    Line.list = {}
  }
}

class Group {
  static max_id = 0;
  static list = {}
  element_b;
  constructor() {
    this.id = ++Group.max_id;
    Group.list[this.id] = this;
    this.children = {}
    this.parentGroup = {}
    
    let group = document.createElementNS(SVG_NS, "g");
    group.setAttribute('id','group_init')
    let volumn_init = document.createElementNS(SVG_NS, "rect");
    volumn_init.setAttribute('id','volumn_init')
    volumn_init.setAttribute('width',100)
    volumn_init.setAttribute('height',100)
    group.appendChild(volumn_init)
    svg.appendChild(group)
  
    let bbox_element = generateBboxElement(group)
    
    bbox_element.setAttribute('id', `${this.constructor.name}${this.id}_bbox`);
    bbox_element.setAttribute('class', `bbox`);
    
    this.element_b = bbox_element;
    svg.prepend(bbox_element)
    svg.removeChild(group)

    //将事件响应函数分出去单独写，是为了让组内的元素接收到的事件也传递到这里。
    this.element_b.myObj = this;
    this.element_b.addEventListener("mousedown", this.mousedown_event)
    this.element_b.addEventListener("mousemove", this.mousemove_event)
    this.element_b.addEventListener("mouseup", this.mouseup_event)
  }
  mousedown_event = e => {
    let this_target = e.currentTarget.myObj;
    if(draw_select==0){
      down_elements = true
      hide_all_bbox()
      if(e.ctrlKey){
        if(Object.keys(this.children).includes(`${this_target.constructor.name}${this_target.id}`)){
          this.removeChild(this_target)
          // console.log(`当前this：\n${Object.keys(this.children)}`);
        }else{
          this.addChild(this_target)
          // console.log(`当前this：\n${Object.keys(this.children)}`);
        }
      }else{
        if(this_target.constructor.name!="Group"){
          this.children = {}
          this.addChild(this_target)
        }else{
          if(this_target.id!=this.id){
            // console.log(`这是个和当前组不一样的Group`);
            this.children = {}
            this.addChild(this_target)
            // console.log(this);
          }
        }
        // console.log(`当前组内成员：\n${Object.keys(this.children)}`);
      }
      this.show_bbox()
      
      this.element_b.setAttribute('pointer-events','all')
      
      // console.log(`将移动：组${this.id}`);
      down_elements = true
      moving_group = true
      group_to_move = this
      m = oMousePosSVG(e);
      x0 = m.x;
      y0 = m.y;
    }
  }

  mousemove_event = e => {
    if(moving_group){
      // console.log(`elements.js mousemove`);
      if(Object.keys(this.children).length==1 && this.children[Object.keys(this.children)[0]].constructor.name=='Point'){
        let point = this.children[Object.keys(this.children)[0]]
        if(e.ctrlKey){
          snapping = true;
          point.snapshow();
        }else{
          snapping = false;
          if(id_target){
            Point.list[id_target].color = 'black'
            Point.list[id_target].edgecolor = 'black'
            Point.list[id_target].update()
            id_target = null;
          }
        }
      }
    }
  }

  mouseup_event = e => {
    if(moving_group){
      // console.log(`elements.js Group mouseup`);
      if(Object.keys(this.children).length==1 && this.children[Object.keys(this.children)[0]].constructor.name=='Point'){
        let point = this.children[Object.keys(this.children)[0]]
        down_elements = false
        if(e.ctrlKey){
          if(id_target){
            point.snap()
          }
        }else{
          snapping = false;
          if(id_target){
            Point.list[id_target].color = 'black'
            Point.list[id_target].edgecolor = 'black'
            Point.list[id_target].update()
            id_target = null;
          }
        }
      }
    }
  }

  moveChildren(dx,dy){
    let p = {}
    let child;
    for(let name in this.children){
      child = this.children[name];
      if(child.constructor.name=="Line"){
        p[child.p1.id]=child.p1
        p[child.p2.id]=child.p2
      }else if(child.constructor.name=="Point"){
        p[child.id]=child
      }else if(child.constructor.name=="Bezier"){
        p[child.p1.id]=child.p1
        p[child.p2.id]=child.p2
        p[child.p3.id]=child.p3
        p[child.p4.id]=child.p4
      }else if(child.constructor.name=="Group"){
        child.moveChildren(dx,dy)
      }
    }
    for(let i_p in p){
      p[i_p].move(dx,dy)
    }
  }
  rotChildren(dtheta){
    let p = {}
    let child;
    for(let name in this.children){
      child = this.children[name];
      if(child.constructor.name=="Line"){
        p[child.p1.id]=child.p1
        p[child.p2.id]=child.p2
      }else if(child.constructor.name=="Point"){
        p[child.id]=child
      }else if(child.constructor.name=="Bezier"){
        p[child.p1.id]=child.p1
        p[child.p2.id]=child.p2
        p[child.p3.id]=child.p3
        p[child.p4.id]=child.p4
      }else if(child.constructor.name=="Group"){
        child.rotChildren(dtheta)
      }
    }
    for(let i_p in p){
      p[i_p].rot(dtheta)
    }
  }
  update_bbox(recursive=true){
    // console.log(recursive);
    let group = document.createElementNS(SVG_NS, "g");
    group.setAttribute('id','tmp')
    
    for(let name in this.children){
      if(this.children[name].constructor.name=="Group"){
        if(recursive){
          this.children[name].update_bbox()
          // this.children[name].show_bbox()
        }
        group.appendChild(this.children[name].element_b.cloneNode(true))
      }else{
        group.appendChild(this.children[name].element_g.cloneNode(true))
      }
    }
    svg.appendChild(group)
    updateBboxElement(this.element_b,group)
    
    svg.removeChild(group)
    if(recursive){
      // let childArray = Object.keys(this.children)
      // for(let name in Group.list){
      //   let intersect = Object.keys(Group.list[name].children).filter(x => childArray.includes(x))
      //   if(intersect.length>0){
      //     Group.list[name].update_bbox(false)
      //   }
      // }
      for(let name in Group.list){
        Group.list[name].update_bbox(false)
      }
    }
  }
  addChild(obj){
    this.children[`${obj.constructor.name}${obj.id}`]=obj
    this.update_bbox()
    obj.parentGroup[`Group${this.id}`] = this
  }
  removeChild(obj){
    delete this.children[`${obj.constructor.name}${obj.id}`]
    this.update_bbox()
    delete obj.parentGroup[`Group${this.id}`]
  }
  show_bbox(){
    let bbox_element = document.getElementById(`${this.constructor.name}${this.id}_bbox`)
    bbox_element.setAttribute('visibility','visible')
    if(Object.keys(this.children).length>1){
      for(let i_child in this.children){
        this.children[i_child].show_bbox()
      }
    }else if(Object.keys(this.children).length==1){
      if(this.children[Object.keys(this.children)[0]].constructor.name=="Group"){
        for(let i_child in this.children){
          this.children[i_child].show_bbox()
        }
      }
    }
  }
  hide_bbox(){
    let bbox_element = document.getElementById(`${this.constructor.name}${this.id}_bbox`)
    bbox_element.setAttribute('visibility','hidden')
    if(Object.keys(this.children).length>1){
      for(let i_child in this.children){
        this.children[i_child].hide_bbox()
      }
    }
  }
  remove(){
    
  }
  static clear(){
    for(let name in Group.list){
      svg.removeChild(Group.list[name].element_b)
    }
    Group.max_id = 0;
    Group.list = {};
    currentGroup = new Group();
  }
}

class Bezier extends Element {
  static max_id = 0;
  static list = {}
  constructor(obj) {
    super();
    this.id = ++Bezier.max_id;
    Bezier.list[this.id] = this;

    this.line1 = obj.line1
    this.line2 = obj.line2
    this.line1.bezier[this.id] = this
    this.line2.bezier[this.id] = this
    this.line1.p1.bezier[this.id] = this
    this.line1.p2.bezier[this.id] = this
    this.line2.p1.bezier[this.id] = this
    this.line2.p2.bezier[this.id] = this

    this.p1 = obj.line1.p1;
    this.p2 = obj.line1.p2;
    this.p3 = obj.line2.p2;
    this.p4 = obj.line2.p1;
    this.width = obj.width || 2;
    this.color = obj.color || 'red';
    
    let group_element = document.createElementNS(SVG_NS, "g");
    group_element.setAttribute('id', `${this.constructor.name}${this.id}`);
    let bezier = document.createElementNS(SVG_NS, "path");
    bezier.setAttribute('d', 
    `M ${this.p1.x} ${this.p1.y} C ${this.p2.x} ${this.p2.y}, 
    ${this.p3.x} ${this.p3.y}, ${this.p4.x} ${this.p4.y}`);
    bezier.setAttribute('stroke-width', this.width);
    bezier.setAttribute('stroke', this.color);
    bezier.setAttribute('fill', "transparent");
    this.element_c = bezier
    
    let bbox_element = generateBboxElement(bezier)
    bbox_element.setAttribute('id', `${this.constructor.name}${this.id}_bbox`);
    bbox_element.setAttribute('class', `bbox`);
    group_element.appendChild(bezier)
    group_element.appendChild(bbox_element)
    
    this.element_b = bbox_element;
    this.element_g = group_element;
    svg.prepend(group_element);
    for(let i_g in Group.list){
      svg.prepend(Group.list[i_g].element_b)
    }

    let bG = new Group()
    bG.addChild(this.line1)
    bG.addChild(this.line2)
    bG.addChild(this)
    this.parentGroup = bG

    bezier.myObj = this.parentGroup;
    bezier.addEventListener("mousedown", e => {
      if(draw_select==0){
        currentGroup.mousedown_event(e)
      }
    })
  }
  update() {
    let bezier = this.element_c;
    bezier.setAttribute('d', `M ${this.p1.x} ${this.p1.y} C ${this.p2.x} ${this.p2.y}, 
    ${this.p3.x} ${this.p3.y}, ${this.p4.x} ${this.p4.y}`);
    bezier.setAttribute('stroke-width', this.width);
    bezier.setAttribute('stroke', this.color);
    bezier.setAttribute('fill', "transparent");
    this.update_bbox()
  }
  move(dx,dy) {
    this.p1.move(dx,dy)
    this.p2.move(dx,dy)
    this.p3.move(dx,dy)
    this.p4.move(dx,dy)
  }
  update_bbox(){
    updateBboxElement(this.element_b,this.element_c)
    this.hide_bbox()    
  }
  static clear(){
    for(let name in Bezier.list){
      svg.removeChild(Bezier.list[name].element_g)
    }
    Bezier.max_id = 0;
    Bezier.list = {}
  }
}
