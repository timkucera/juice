
var data = juice.data({
    text: ['hello','world','from','a','data model'],
    color: (i) => ['purple','red','blue','orange'][Math.floor(5 * Math.random())],
});
var title = juice.data('first title');

juice.def()
    .align('center')
    .def('shape')
        .width('30%')
        .height('50px')
        .def('text')
            .color('black')
            .text(title)
        .end()
    .end()
    .map(data)
        .def('shape')
            .width('30%')
            .height('50px')
            .color(data.color)
            .def('text')
                .color('black')
                .text(data.text)
            .end()
        .end()
    .end()
.end();
