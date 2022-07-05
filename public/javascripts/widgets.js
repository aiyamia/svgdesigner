const select_draw_btn = document.getElementById('select_draw');
const select_draw_btn_img = select_draw_btn.querySelector('img');

select_draw_btn.addEventListener('click', function onClick() {
  if(draw_select == 1){
    drawing = false;
    moving = false;
    select_draw_btn_img.src = "/images/edit-svgrepo-com.svg"
    draw_select = 1-draw_select;
  }else{
    drawing = false;
    moving = false;
    select_draw_btn_img.src = "/images/pencil-svgrepo-com.svg"
    draw_select = 1-draw_select;
  }
});

const theme_btn = document.getElementById('theme');
const theme_btn_img = theme_btn.querySelector('img');

let root = document.documentElement;
let imgs = document.querySelectorAll('#widgets>button>img');
for (let i = 0; i < imgs.length; i++) {
  imgs[i].classList.add('widgetsButtonImgNight');
}

var stroke_color = 'black'
var point_color = stroke_color;
var box_color = '#a45013';
var stroke_color_selected = '#740a00'
var point_color_selected = '#740a00'
var group_color_selected = 'darkslategrey'


theme_btn.addEventListener('click', function onClick() {
  if(day_night == 1){//从白昼切换到暗夜
    stroke_color = 'black'
    point_color = stroke_color;
    box_color = '#a45013';
    stroke_color_selected = '#740a00'
    point_color_selected = '#740a00'
    group_color_selected = 'darkslategrey'

    theme_btn_img.src = "/images/sun-svgrepo-com.svg"
    day_night = 1-day_night;

    root.style.setProperty('--html-color', "#222946");
    root.style.setProperty('--container-color', "#1c2136");
    root.style.setProperty('--font-color', "seagreen");
    root.style.setProperty('--container-border-color', "#080a27");
    // root.style.setProperty('--widgets-pad-background', "#434141");
    root.style.setProperty('--widgets-pad-background', "#323131");
    root.style.setProperty('--widgets-pad-box-shadow', "1px 1px 25px 0px black inset, 1px -1px 11px 0px black inset");
    root.style.setProperty('--widgets-button-background', "#897f7f");
    // root.style.removeProperty('--button-img-hover-filter');

    // root.style.setProperty('--button-img-hover-filter', "invert(92%) sepia(1%) saturate(2865%) hue-rotate(314deg) brightness(78%) contrast(92%);");
    
    for (let i = 0; i < imgs.length; i++) {
      imgs[i].classList.remove('widgetsButtonImgDay');
      imgs[i].classList.add('widgetsButtonImgNight');
    }
    root.style.setProperty('--button-img-filter', "none");
    root.style.setProperty('--widgets-button-hover-background', "#897f7f");
    root.style.setProperty('--widgets-button-border-radius', "3px");
    root.style.setProperty('--widgets-button-box-shadow', "1px 1px 0px 0px rgb(0 0 0) inset, -1px 1px 0px 0px black inset, 1px -1px 0px 0px black inset, -1px -1px 0px 0px black inset");
  }else{//从暗夜切换到白昼
    stroke_color = 'black'
    point_color = stroke_color;
    box_color = 'black';
    stroke_color_selected = 'red'
    point_color_selected = 'red'
    group_color_selected = 'lightblue'

    theme_btn_img.src = "/images/moon-svgrepo-com.svg"
    day_night = 1-day_night;

    root.style.setProperty('--html-color', "whitesmoke");
    root.style.setProperty('--container-color', "floralwhite");
    root.style.setProperty('--font-color', "#d08915");
    root.style.setProperty('--container-border-color', "#080a27c2");
    root.style.setProperty('--widgets-pad-background', "white");
    root.style.setProperty('--widgets-pad-box-shadow', "1px 1px 0px 0px #b6b6b6 inset, 1px -1px 0px 0px #b6b6b6 inset, -1px 1px 0px 0px #b6b6b6 inset, -1px -1px 0px 0px #b6b6b6 inset");
    root.style.setProperty('--widgets-button-background', "#a03716");
    // root.style.setProperty('--widgets-button-background', "#d8d8d8");
    // root.style.setProperty('--theme-button-hover-background', "#897f7f");
    root.style.setProperty('--widgets-button-hover-background', "#f08462");
    // root.style.removeProperty('--button-img-hover-filter');
    // root.style.setProperty('--button-img-hover-filter', "invert(66%) sepia(48%) saturate(2027%) hue-rotate(358deg) brightness(99%) contrast(107%);");
    for (let i = 0; i < imgs.length; i++) {
      imgs[i].classList.remove('widgetsButtonImgNight');
      imgs[i].classList.add('widgetsButtonImgDay');
    }
    root.style.setProperty('--button-img-filter', "invert(1)");
    // root.style.setProperty('--widgets-button-hover-background', "#ededed");
    root.style.setProperty('--widgets-button-border-radius', "7px");
    root.style.setProperty('--widgets-button-box-shadow', "0.5px 0.5px 0px 0px #080a27 inset, -0.5px 0.5px 0px 0px #080a27 inset, 0.5px -0.5px 0px 0px #080a27 inset, -0.5px -0.5px 0px 0px #080a27 inset");
  }
});


const clear_btn = document.getElementById('clear');
clear_btn.addEventListener('click', function onClick() {
  Point.clear();
  Line.clear();
  Group.clear();
  Bezier.clear();
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