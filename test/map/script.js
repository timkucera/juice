
var colors = ['orange','blue','green','teal','red','grey'];
function randomColors(num) {
    var arr = [];
    for (var i=0;i<num;i++) arr.push(colors[Math.floor(Math.random() * colors.length)]);
    return arr
}

var data = juice.data({
    color: randomColors(6),
    text: (i) => data.color[i],
});

function animate() {
    var elem = Math.floor(Math.random() * data.color.length);
    var color = colors[Math.floor(Math.random() * colors.length)]
    data.color[elem] = color;
}
window.setInterval(animate, 500);


juice.def()
    .color('grey')
    .def('shape')
        .color('black')
        .padgap('1u')
        .wrap()
        .center()
        .map(data)
            .def('shape')
                .width('2u')
                .height('2u')
                .color(data.color)
                .def('text')
                    .text(data.text)
                    .fontsize('verybig')
                    .bold()
                    .center()
                .end()
            .end()
        .end()
    .end()
.end();
