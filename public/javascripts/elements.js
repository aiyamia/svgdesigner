class Point {
  static max_id = 0;
  static Points = {}
  line={};
  element;

  constructor(obj,parent=svg) {
    this.id = ++Point.max_id;
    Point.Points[this.id] = this;
    this.x = obj.x;
    this.y = obj.y;
    this.size = obj.size || 5;
    this.color = obj.color || 'black';
    this.edgewidth = obj.edgewidth || '1';
    this.edgecolor = obj.edgecolor || 'black';

    let point_g = document.createElementNS(SVG_NS, "g");
    point_g.setAttribute('id', `${this.constructor.name}${this.id}`);
    point_g.setAttribute('transform', `translate(${this.x},${this.y})`);
    let point = document.createElementNS(SVG_NS, "circle");
    point.setAttribute('cx', 0);
    point.setAttribute('cy', 0);
    point.setAttribute('r', this.size/2);
    point.setAttribute('fill', this.color);
    point.setAttribute('stroke-width', this.edgewidth);
    point.setAttribute('stroke', this.edgecolor);
    
    let bbox_element = getBboxElement(point)
    bbox_element.setAttribute('id', `${this.constructor.name}${this.id}_bbox`);
    bbox_element.setAttribute('class', `bbox`);
    point_g.appendChild(point)
    point_g.appendChild(bbox_element)
    parent.appendChild(point_g)
    this.element = point_g;
    
    point.addEventListener("mousedown", e => {
      if(draw_select==0){
        down_elements = true
        moving = true
        p2 = this;
        if(e.ctrlKey){
          if(this.element.getElementsByTagName('rect')[0].getAttribute('visibility')=='visible'){
            this.hide_bbox()
            currentGroup.removeChild(this)
          }else{
            console.log(`hoo${currentGroup}`);
            if (!currentGroup) {
              currentGroup = new Group()
            }
            currentGroup.addChild(this)
          }
          
        }else{
          hide_all_bbox()
          this.show_bbox()
          // if (currentGroup) {
          //   // currentGroup = null
          // }else{
          //   currentGroup = new Group()
          //   currentGroup.addChild(this)
          // }
        }
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
            Point.Points[id_target].color = 'black'
            Point.Points[id_target].edgecolor = 'black'
            Point.Points[id_target].update()
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
            Point.Points[id_target].color = 'black'
            Point.Points[id_target].edgecolor = 'black'
            Point.Points[id_target].update()
            id_target = null;
          }
        }
      }
    })
  }
  update(){
    let point = this.element.getElementsByTagName('circle')[0];
    point.setAttribute('r', this.size/2);
    point.setAttribute('fill', this.color);
    point.setAttribute('stroke-width', this.edgewidth);
    point.setAttribute('stroke', this.edgecolor);
  }
  update_loc(x,y) {
    let point_g = this.element;
    point_g.setAttribute('transform', `translate(${x},${y})`)
    
    this.x = x
    this.y = y
    for(let i_line in this.line){
      this.line[i_line].update()
    }
  }
  snapshow() {
    let d_list = []
    let id_list = []
    let d,dx,dy;
    for(let i_comp in Point.Points){
      let point_to_compare = Point.Points[i_comp]
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
        Point.Points[id_target].color = 'black'
        Point.Points[id_target].edgecolor = 'black'
        Point.Points[id_target].update()
        id_target = null;
      }
      id_target = id_list[d_list.indexOf(d_min)]
      Point.Points[id_target].color = 'grey'
      Point.Points[id_target].edgecolor = '#eee'
      Point.Points[id_target].update()
    }else{
      if(id_target){
        Point.Points[id_target].color = 'black'
        Point.Points[id_target].edgecolor = 'black'
        Point.Points[id_target].update()
        id_target = null;
      }
    }
  }
  snap(){
    let point_target = Point.Points[id_target]
    this.update_loc(point_target.x,point_target.y)
    let lines_target = point_target.line
    point_target = this;
    Point.Points[id_target].element.remove()
    delete Point.Points[id_target]

    this.element.parentNode.appendChild(this.element);

    point_target.line = {...point_target.line,...lines_target}
    for(let i_line in lines_target){
      if(lines_target[i_line].p1.id==id_target){
        lines_target[i_line].p1 = this
      }else{
        lines_target[i_line].p2 = this
      }
    }
    id_target = null;
  }
  static clear(){
    Point.max_id = 0;
    Point.Points = {}
  }
  show_bbox(){
    let bbox_element = document.getElementById(`${this.constructor.name}${this.id}_bbox`)
    bbox_element.setAttribute('visibility','visible')
  }
  hide_bbox(){
    let bbox_element = document.getElementById(`${this.constructor.name}${this.id}_bbox`)
    bbox_element.setAttribute('visibility','hidden')
  }
}


class Line {
  static max_id = 0;
  static Lines = {}
  element;
  constructor(obj,parent=svg) {
    this.id = ++Line.max_id;
    Line.Lines[this.id] = this;
    this.p1 = obj.p1;
    this.p2 = obj.p2;
    this.p1.line[this.id] = this;
    this.p2.line[this.id] = this;
    this.width = obj.width || 2;
    this.color = obj.color || 'red';

    let line = document.createElementNS(SVG_NS, "path");
    line.setAttribute('d', `M ${this.p1.x} ${this.p1.y} L ${this.p2.x} ${this.p2.y}`);
    line.setAttribute('stroke-width', this.width);
    line.setAttribute('stroke', this.color);
    line.setAttribute('fill', "transparent");
    this.element = line
    parent.prepend(line);
    
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

      }
    })
    line.addEventListener("mouseup", e => {
      down_elements = false
    })
  }
  
  update() {
    let line = this.element;
    line.setAttribute('d', `M ${this.p1.x} ${this.p1.y} L ${this.p2.x} ${this.p2.y}`);
    line.setAttribute('stroke-width', this.width);
    line.setAttribute('stroke', this.color);
    line.setAttribute('fill', "transparent");
  }
}


class Group {
  static max_id = 0;
  static Groups = {}
  constructor() {
    this.id = ++Group.max_id;
    Group.Groups[this.id] = this;
    this.children = {}
    this.parent = svg
    let group_g = document.createElementNS(SVG_NS, "g");
    group_g.setAttribute('id',`${this.constructor.name}${this.id}`);
    
    let group = document.createElementNS(SVG_NS, "g");
    let bbox_element = getBboxElement(group)
    bbox_element.setAttribute('id', `${this.constructor.name}${this.id}_bbox`);
    bbox_element.setAttribute('class', `bbox`);
    group_g.appendChild(bbox_element)
    group_g.appendChild(group)
    this.parent.appendChild(group_g)
    this.element = group_g
  }
  update_bbox(){
    let bbox_element = document.getElementById(`${this.constructor.name}${this.id}_bbox`)
    let group = this.element.getElementsByTagName('g')[0]
    
    let bbox = group.getBBox();
    let w =  Math.max(1.5*bbox.width,10)
    let h =  Math.max(1.5*bbox.height,10)
    bbox_element.setAttribute('x', bbox.x-(w-bbox.width)/2);
    bbox_element.setAttribute('y', bbox.y-(w-bbox.height)/2);
    bbox_element.setAttribute('width', w);
    bbox_element.setAttribute('height', h);
  }
  setParent(new_parent){
    this.parent = new_parent
  }

  addChild(obj){
    this.children[`${obj.constructor.name}${obj.id}`]=obj
    this.element.getElementsByTagName('g')[0].appendChild(obj.element)
    console.log(`Group${this.id}.children= `);
    console.log(this.children);
    this.update_bbox()
    this.show_bbox()
  }
  removeChild(obj){
    delete this.children[`${obj.constructor.name}${obj.id}`]
    this.element.parentNode.appendChild(obj.element)
    this.element.parentNode.removeChild(this.element)
  }
  show_bbox(){
    let bbox_element = document.getElementById(`${this.constructor.name}${this.id}_bbox`)
    bbox_element.setAttribute('visibility','visible')
    console.log(`bbox_element =`);
    console.log(bbox_element);
  }
  hide_bbox(){
    let bbox_element = document.getElementById(`${this.constructor.name}${this.id}_bbox`)
    bbox_element.setAttribute('visibility','hidden')
  }
  update() {

  }
}
class Selection {
  constructor(obj) {

  }
  
}

