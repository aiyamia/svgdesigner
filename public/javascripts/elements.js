class Element {
  element_c;
  element_b;
  element_g;
  parent;
  x;
  y;
  constructor(obj,parent=svg) {
    this.parent = parent;
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
    this.parent.appendChild(group_element)
    this.element_b = bbox_element;
    this.element_c = core_element;
    this.element_g = group_element;
  }
  event_select(e){
    console.log(`您来了`);
    if(e.ctrlKey){
      if(this.element_b.getAttribute('visibility')=='visible'){
        this.hide_bbox()
        currentGroup.removeChild(this)
        console.log(`你选中了${Object.keys(currentGroup.children)}`);
      }else{
        // console.log(currentGroup.element_b);
        currentGroup.addChild(this)
        this.element_b.setAttribute('visibility','visible')
        console.log(`你选中了${Object.keys(currentGroup.children)}`);
      }
    }else{
      hide_all_bbox()
      this.show_bbox()
      currentGroup.children = {}
      currentGroup.addChild(this)
      currentGroup.hide_bbox()
      console.log(`你选中了${Object.keys(currentGroup.children)}`);
    }
  }
  static clear(){
    Element.max_id = 0;
    Element.list = {}
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
    bbox_element.setAttribute('pointer-events','all')
  }
  hide_bbox(){
    let bbox_element = this.element_b;
    bbox_element.setAttribute('visibility','hidden')
    bbox_element.setAttribute('pointer-events','initial')
  }
}

class Point extends Element {
  static max_id = 0;
  static list = {}
  line={};
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
    let point = this.element_c;
    point.addEventListener("mousedown", e => {
      if(draw_select==0){
        down_elements = true
        moving = true
        p2 = this;
        this.event_select(e)
      }
    })
    point.addEventListener("mousemove", e => {
      if(moving){
        if(e.ctrlKey){
          snapping = true;
          this.snapshow();
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
    })
    point.addEventListener("mouseup", e => {
      if(moving){
        down_elements = false
        if(e.ctrlKey){
          if(id_target){
            this.snap()
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
    })
  }
  update(){
    let point = this.element_c;
    point.setAttribute('r', this.size/2);
    point.setAttribute('fill', this.color);
    point.setAttribute('stroke-width', this.edgewidth);
    point.setAttribute('stroke', this.edgecolor);
  }
  update_loc(x,y) {
    let point_g = this.element_c.parentNode;
    point_g.setAttribute('transform', `translate(${x},${y})`)
    
    this.x = x
    this.y = y
    for(let i_line in this.line){
      this.line[i_line].update()
    }
  }
  update_loc_inc(dx,dy) {
    let point_g = this.element_c.parentNode;
    this.x += dx
    this.y += dy
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
      if(point_to_compare.id != this.id){
        dx = point_to_compare.x - this.x
        dy = point_to_compare.y - this.y
        d = Math.hypot(dx,dy)
        d_list.push(d)
        id_list.push(point_to_compare.id)
      }
    }
    let d_min = Math.min(...d_list)
    if(d_min<30){
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
    let point_target = Point.list[id_target]
    this.update_loc(point_target.x,point_target.y)
    let lines_target = point_target.line
    point_target = this;
    Point.list[id_target].element_g.remove()
    delete Point.list[id_target]

    this.element_g.parentNode.appendChild(this.element_g); //使其位于最前

    point_target.line = {...point_target.line,...lines_target}
    for(let i_line in lines_target){
      if(lines_target[i_line].p1.id==id_target){
        lines_target[i_line].p1 = this
      }else{
        lines_target[i_line].p2 = this
      }
    }
    id_target = null;
    currentGroup.update_bbox()
    currentGroup.hide_bbox()
  }
}


class Line extends Element {
  static max_id = 0;
  static list = {}
  constructor(obj,parent=svg) {
    super();
    this.id = ++Line.max_id;
    Line.list[this.id] = this;
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
    this.parent.prepend(group_element);
    
    line.addEventListener("mousedown", e => {
      if(draw_select==0){
        down_elements = true
        moving_line = true
        line_to_move = this
        m = oMousePosSVG(e);
        x0 = m.x;
        y0 = m.y;
        p1_x0 = this.p1.x;
        p1_y0 = this.p1.y;
        p2_x0 = this.p2.x;
        p2_y0 = this.p2.y;
        this.event_select(e)
      }
    })
  }
  
  update() {
    let line = this.element_c;
    line.setAttribute('d', `M ${this.p1.x} ${this.p1.y} L ${this.p2.x} ${this.p2.y}`);
    line.setAttribute('stroke-width', this.width);
    line.setAttribute('stroke', this.color);
    line.setAttribute('fill', "transparent");
    this.update_bbox()
  }
  update_loc_inc(dx,dy) {
    this.p1.update_loc_inc(dx,dy)
    this.p2.update_loc_inc(dx,dy)
  }
  update_bbox(){
    updateBboxElement(this.element_b,this.element_c)
    this.hide_bbox()    
  }
  setParent(new_parent){
    this.parent = new_parent
  }
}


class Group {
  static max_id = 0;
  static Groups = {}
  element_b;
  constructor(parent=svg) {
    this.id = ++Group.max_id;
    Group.Groups[this.id] = this;
    this.children = {}
    this.parent = parent
    
    let group = document.createElementNS(SVG_NS, "g");
    group.setAttribute('id','group_init')
    let volumn_init = document.createElementNS(SVG_NS, "rect");
    volumn_init.setAttribute('id','volumn_init')
    volumn_init.setAttribute('width',100)
    volumn_init.setAttribute('height',100)
    group.appendChild(volumn_init)
    this.parent.appendChild(group)
  
    let bbox_element = generateBboxElement(group)
    
    bbox_element.setAttribute('id', `${this.constructor.name}${this.id}_bbox`);
    bbox_element.setAttribute('class', `bbox`);
    
    this.element_b = bbox_element;
    this.parent.appendChild(bbox_element)
    this.parent.removeChild(group)
    console.log("bbox_element");
    console.log(bbox_element);

    this.element_b.addEventListener("mousedown", e => {
      if(draw_select==0){
        console.log(`正在移动：组${this.id}`);
        down_elements = true
        moving_group = true
        group_to_move = this
        m = oMousePosSVG(e);
        x0 = m.x;
        y0 = m.y;
      }
    })
  }
  moveChildren(dx,dy){
    for(let name in this.children){
      this.children[name].update_loc_inc(dx,dy)
      this.children[name].show_bbox()
    }
  }
  update_bbox(){
    let group = document.createElementNS(SVG_NS, "g");
    group.setAttribute('id','tmp')
    for(let name in this.children){
      group.appendChild(this.children[name].element_g.cloneNode(true))
    }
    svg.appendChild(group)
    updateBboxElement(this.element_b,group)
    svg.removeChild(group)
  }

  setParent(new_parent){
    this.parent = new_parent
  }

  addChild(obj){
    this.children[`${obj.constructor.name}${obj.id}`]=obj
    this.update_bbox()
  }
  removeChild(obj){
    delete this.children[`${obj.constructor.name}${obj.id}`]
    this.update_bbox()
  }
  show_bbox(){
    let bbox_element = document.getElementById(`${this.constructor.name}${this.id}_bbox`)
    bbox_element.setAttribute('visibility','visible')
    bbox_element.setAttribute('pointer-events','all')
    // console.log(`bbox_element =`);
    // console.log(bbox_element);
  }
  hide_bbox(){
    let bbox_element = document.getElementById(`${this.constructor.name}${this.id}_bbox`)
    bbox_element.setAttribute('visibility','hidden')
    bbox_element.setAttribute('pointer-events','initial')
  }
  update() {

  }
}
class Selection {
  constructor(obj) {

  }
  
}

