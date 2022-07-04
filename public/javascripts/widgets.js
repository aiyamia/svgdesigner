const select_btn = document.getElementById('select');
const draw_btn = document.getElementById('draw');

const on_color = 'orange';
const off_color = 'white';

select_btn.addEventListener('click', function onClick() {
  if(draw_select == 1){
    drawing = false;
    moving = false;
    select_btn.style.backgroundColor = on_color;
    draw_btn.style.backgroundColor = off_color;
    draw_select = 1-draw_select;
  }
});

draw_btn.addEventListener('click', function onClick() {
  if(draw_select == 0){
    drawing = false;
    moving = false;
    select_btn.style.backgroundColor = off_color;
    draw_btn.style.backgroundColor = on_color;
    draw_select = 1-draw_select;
  }
});

const clear_btn = document.getElementById('clear');
clear_btn.addEventListener('click', function onClick() {
  Point.clear();
  Line.clear();
  Group.clear();
  Bezier.clear();
});

const undo_btn = document.getElementById('undo');
undo_btn.addEventListener('click', function onClick() {
  
});


document.querySelector('#download')
.addEventListener('click', function onClick() {
  svgExport.downloadSvg(
    document.getElementById("lines"), // SVG DOM Element object to be exported. Alternatively, a string of the serialized SVG can be passed
    "chart title name", // chart title: file name of exported image
    // { width: 200, height: 200 } // options (optional, please see below for a list of option properties)
  );
});
document.querySelector('#import')
.addEventListener('click', function onClick() {
  document.querySelector('#imgimport').click()
});
document.querySelector('#imgimport')
.addEventListener('change', function onClick() {
  imported_file = this.files[0];
  if (!imported_file) {
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    let contents = event.target.result;
    contents = contents.substring(contents.indexOf("\n") + 1)
    document.querySelector("#lines").outerHTML = contents
  });
  reader.readAsText(imported_file);
});