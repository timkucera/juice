var hsv2rgb = function(hsv) {
    var [h,s,v] = hsv;
    let f = (n,k=(n+h/60)%6) => Math.round((v - v*s*Math.max( Math.min(k,4-k,1), 0))*255);
    return [f(5),f(3),f(1)];
}
var rgb2hsv = function(rgb) {
    var [r, g, b] = rgb;
    let v=Math.max(r,g,b), c=v-Math.min(r,g,b);
    let h = c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c));
    return [60*(h<0?h+6:h), v&&c/v, v/256];
}
var hex2rgb = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function rgb2hex(rgb) {
    var [r, g, b] = rgb;
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function lab2rgb(lab){
  var y = (lab[0] + 16) / 116,
      x = lab[1] / 500 + y,
      z = y - lab[2] / 200,
      r, g, b;

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
  y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

  r = x *  3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y *  1.8758 + z *  0.0415;
  b = x *  0.0557 + y * -0.2040 + z *  1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

  return [Math.round(Math.max(0, Math.min(1, r)) * 255),
          Math.round(Math.max(0, Math.min(1, g)) * 255),
          Math.round(Math.max(0, Math.min(1, b)) * 255)]
}


function rgb2lab(rgb){
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      x, y, z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

function lab2hcl(lab) {
    var [l,a,b] = lab;
    var c = Math.hypot(a,b);
    var h = Math.atan2(b,a)*180/Math.PI;
    h = h < 0 ? h + 360 : h;
    return [h,c,l];
}

function hcl2lab(hcl) {
    var [h,c,l] = hcl;
    var a = c*Math.cos(h*Math.PI/180);
    var b = c*Math.sin(h*Math.PI/180);
    return [l,a,b];
}

var dull = {
    'red': '#f44336',
    'pink': '#e91e63',
    'purple': '#9c27b0',
    'violet': '#673ab7',
    'indigo': '#3f51b5',
    'blue': '#2196f3',
    'sky': '#03a9f4',
    'cyan': '#00bcd4',
    'teal': '#009688',
    'green': '#4caf50',
    'apple': '#8bc34a',
    'lime': '#cddc39',
    'yellow': '#ffeb3b',
    'amber': '#ffc107',
    'orange': '#ff9800',
    'fire': '#ff5722',
    'brown': '#795548',
    'asphalt': '#34495e',
    'steel': '#607D8B',
    'black': '#333333',
    'grey': '#9e9e9e',
    'white': '#eeeeee',
}

var vibrant = {
    'red': '#ff1744',
    'pink': '#f50057',
    'purple': '#f50057',
    'violet': '#651fff',
    'indigo': '#3d5afe',
    'blue': '#2979ff',
    'sky': '#00b0ff',
    'cyan': '#00e5ff',
    'teal': '#1de9b6',
    'green': '#00e676',
    'apple': '#76ff03',
    'lime': '#c6ff00',
    'yellow': '#ffea00',
    'amber': '#ffc400',
    'orange': '#ff9100',
    'fire': '#ff3d00',
    'brown': '#795548',
    'asphalt': '#34495e',
    'black': '#333333',
    'grey': '#9e9e9e',
    'white': '#eeeeee',
}

var h_rot = 1;
var c_rot = 0.1;
var l_rot = 10;

function tint(hcl,dir,int) {
    var [h,c,l] = hcl;
    h -= h_rot*dir
    c-=c*c_rot;
    l+=int*l_rot;
    h = h<0 ? h+360 : h;
    h = h>360 ? 360-h : h;
    l = l<0 ? 0 : l;
    l = l>100 ? 100 : l;
    return [h,c,l];
}

function shade(hcl,dir,int) {
    var [h,c,l] = hcl;
    h += h_rot*dir;
    c-=c*c_rot;
    l-=int*l_rot;
    h = h<0 ? h+360 : h;
    h = h>360 ? 360-h : h;
    l = l<0 ? 0 : l;
    l = l>100 ? 100 : l;
    return [h,c,l];
}

function sigmoid(t) {
    return (1/(1+Math.pow(Math.E, -t/100))-0.5)*2;
}

function palette(dict) {
    var p = {};
    for (var [key, base] of Object.entries(dict)) {
        var color = {'base':base}
        var hcl = lab2hcl(rgb2lab(hex2rgb(base)));
        var t = hcl;
        var s = hcl;
        var dir = hcl[0] >= 45 && hcl[0] <= 45+180 ? 1 : -1;
        var amp = Math.abs(hcl[0]-225)/225;
        var r = hcl[0]-45;
        r = r<0? 360+r:r;
        r = 100-Math.abs(Math.abs(r-180)-90)
        amp = sigmoid(r)-1//(Math.sin(r*Math.PI/180)+1)/2;
        dir = dir*amp;
        dir-=1
        var int = 1//hcl[2]/50;
        var int2 = 1//-(hcl[2]-100)/50;
        for (var i=1;i<=3;i++) {
            s = shade(s,dir,int);
            t = tint(t,dir,int2);
            color['shade'+i] = rgb2hex(lab2rgb(hcl2lab(s)));
            color['tint'+i] = rgb2hex(lab2rgb(hcl2lab(t)));
        }
        p[key] = color;
    }
    return p;
}

var p = palette(dull);

var data = []
Object.entries(p).forEach(([k,v])=>{
    data.push([v['shade3'],v['shade2'],v['shade1'],v['base'],v['tint1'],v['tint2'],v['tint3']]);
});
data = juice.data(data);
var colors = juice.data(Object.values(p));

juice.template('patch')
    .def('shape')
        .width('4u')
        .height('2u')
        .def()
            .width('fill')
            .height('100%')
            .color($template.base)
            .def('shape')
                .width('1u')
                .height('1u')
                .color($template.shade3)
                .center()
            .end()
        .end()
        .def()
            .width('fill')
            .height('100%')
            .color($template.base)
            .def('shape')
                .width('1u')
                .height('1u')
                .color($template.tint3)
                //.color($template.base)
                //.css('filter:brightness(150%)')
                .center()
            .end()
        .end()
    .end()
.end()

juice.def()
    .def('shape')
        .width('100%')
        .height('100%')
        .padgap('1u')
        .def('shape')
            .width('fill')
            .space('around')
            .wrap()
            .padgap('10px')
            .map(colors)
                .patch(colors.$i)
            .end()
        .end()
        .def()
            .width('fill')
            .pad('2u')
            .align('center')
            .flow('td')
            .space('around')
            .map(data)
                .def()
                    .flow('lr')
                    .map(data.$i)
                    .def('shape')
                        .width('2u')
                        .height('2u')
                        .color(data.$i.$j)
                        .css('border-radius:0px;')
                    .end()
                .end()
            .end()
        .end()
    .end()
.end()
